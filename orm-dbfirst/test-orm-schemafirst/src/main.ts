/**
 * TestORM_SchemaFirst - aplicatie consola de test.
 * Apeleaza metodele din clasele Accessor (NivelAccesDate_DBFirst) si afiseaza rezultatele.
 *
 * Rulare (din folderul orm-dbfirst):  npm start
 * Sirul de conexiune este in .env (DATABASE_URL), identic cu cel din repository-dbfirst/.env.
 */
import "dotenv/config";
import { getContext, inchideContext, type Prisma } from "repository-dbfirst";
import { AbonamenteAccessor, PlanuriAccessor } from "nivel-acces-date-dbfirst";

const lei = (d: Prisma.Decimal) => `${d.toFixed(2)} lei`;
const data = (d: Date) => d.toISOString().slice(0, 10);
const titlu = (text: string) => console.log(`\n=== ${text} ===`);

async function main() {
  const db = getContext();
  const planuri = new PlanuriAccessor(db);
  const abonamente = new AbonamenteAccessor(db);

  const [server] = await db.$queryRaw<{ baza: string; versiune: string }[]>`
    SELECT current_database() AS baza, version() AS versiune`;
  console.log(`Conectat la baza de date "${server.baza}"`);
  console.log(server.versiune);

  titlu("PlanuriAccessor.getToate()");
  console.table(
    (await planuri.getToate()).map((p) => ({
      cod: p.cod,
      denumire: p.denumire,
      pret: lei(p.pret_lunar),
      tokeni: p.tokeni_lunari,
      maxApartamente: p.max_apartamente ?? "nelimitat",
      descriere: p.descriere ?? "—", // coloana adaugata in baza de date la Exercitiul 3
    })),
  );

  titlu('PlanuriAccessor.getDupaCod("pro")');
  const pro = await planuri.getDupaCod("pro");
  console.log(pro ? `${pro.denumire}: ${lei(pro.pret_lunar)} pe luna, ${pro.tokeni_lunari} tokeni` : "Planul nu exista.");

  titlu("PlanuriAccessor.getCuAbonamenteCurente()");
  console.table(
    (await planuri.getCuAbonamenteCurente()).map((p) => ({ cod: p.cod, abonamenteCurente: p.abonamenteCurente })),
  );

  titlu("PlanuriAccessor.getVenitLunarSimulat()");
  const venit = await planuri.getVenitLunarSimulat();
  console.table(
    venit.planuri.map((v) => ({ cod: v.cod, pret: lei(v.pretLunar), abonamenteActive: v.abonamenteActive, venit: lei(v.venitLunar) })),
  );
  console.log(`Total venit lunar simulat: ${lei(venit.total)}`);

  titlu("AbonamenteAccessor.getNumarPeStatus()");
  console.table(await abonamente.getNumarPeStatus());

  titlu("AbonamenteAccessor.getAbonamentCurent(1)");
  const curent = await abonamente.getAbonamentCurent(1);
  console.log(
    curent
      ? `${curent.asociatii.denumire}: plan ${curent.planuri_abonamente_plan_idToplanuri.denumire}, ${curent.status}, ${data(curent.inceput_perioada)} - ${data(curent.sfarsit_perioada)}`
      : "Asociatia nu are abonament curent.",
  );

  titlu("AbonamenteAccessor.getSuspendate()");
  console.table(
    (await abonamente.getSuspendate()).map((a) => ({
      asociatie: a.asociatii.denumire,
      plan: a.planuri_abonamente_plan_idToplanuri.cod,
      perioadaIncheiata: data(a.sfarsit_perioada),
      plataInAsteptare: a.comenzi_simulate[0] ? lei(a.comenzi_simulate[0].suma) : "—",
      referinta: a.comenzi_simulate[0]?.referinta ?? "—",
    })),
  );

  const peste30Zile = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  titlu(`AbonamenteAccessor.getCareExpiraPanaLa(${data(peste30Zile)})`);
  console.table(
    (await abonamente.getCareExpiraPanaLa(peste30Zile)).map((a) => ({
      asociatie: a.asociatii.denumire,
      plan: a.planuri_abonamente_plan_idToplanuri.cod,
      sfarsitPerioada: data(a.sfarsit_perioada),
    })),
  );

  titlu("AbonamenteAccessor.getIstoric(1)");
  console.table(
    (await abonamente.getIstoric(1)).map((a) => ({
      plan: a.planuri_abonamente_plan_idToplanuri.cod,
      status: a.status,
      inceput: data(a.inceput_perioada),
      sfarsit: data(a.sfarsit_perioada),
    })),
  );
}

main()
  .catch((eroare) => {
    console.error("Eroare:", eroare instanceof Error ? eroare.message : eroare);
    process.exitCode = 1;
  })
  .finally(inchideContext);
