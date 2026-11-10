/**
 * Aplicatia consola de test (Code First).
 *
 * Ex. 4: afiseaza datele din tabelul planuri, direct prin context.
 * Ex. 5: afiseaza date prin clasele Accessor din NivelAccesDate.
 * Ex. 7: incarca relatia Plan -> CuponReducere in modul din setarea INCARCARE_RELATII (eager sau lazy)
 *        si numara interogarile SQL trimise; la final compara cele doua moduri.
 */
import "dotenv/config";
import { AbonamenteAccessor, CupoaneAccessor, PlanuriAccessor } from "nivel-acces-date";
import { BlockManagerContext, type ModIncarcare } from "repository-codefirst";

const db = new BlockManagerContext();
const planuriAcc = new PlanuriAccessor(db);
const cupoaneAcc = new CupoaneAccessor(db);
const abonamenteAcc = new AbonamenteAccessor(db);

const lei = (v: { toFixed(n: number): string } | null) => (v === null ? "-" : `${v.toFixed(2)} lei`);
const titlu = (t: string) => console.log(`\n=== ${t} ===`);

async function main() {
  const [{ server_version }] = await db.$queryRaw<{ server_version: string }[]>`SHOW server_version`;
  const [{ baza }] = await db.$queryRaw<{ baza: string }[]>`SELECT current_database() AS baza`;
  console.log(`BlockManager - test Code First | PostgreSQL ${server_version} | baza de date: ${baza}`);
  console.log(`Setarea INCARCARE_RELATII = ${db.modIncarcare}`);

  // ---------------------------------------------------------------
  titlu("Ex. 4: tabelul planuri (db.plan.findMany)");
  const planuri = await db.plan.findMany({ orderBy: { id: "asc" } });
  console.table(
    planuri.map((p) => ({
      id: p.id,
      cod: p.cod,
      pretLunar: p.pretLunar.toFixed(2),
      pretAnual: p.pretAnual?.toFixed(2) ?? null,
      tokeni: p.tokeniLunari,
      recomandat: p.recomandat,
      descriere: p.descriere,
    })),
  );

  // ---------------------------------------------------------------
  titlu("Ex. 5: date prin NivelAccesDate");
  console.log("PlanuriAccessor.getToate() + getEconomieAnuala():");
  for (const p of await planuriAcc.getToate()) {
    const economie = planuriAcc.getEconomieAnuala(p);
    console.log(
      `  ${p.cod.padEnd(5)} ${lei(p.pretLunar).padStart(11)} / luna, anual ${lei(p.pretAnual).padStart(12)}` +
        (economie ? `  (economie ${lei(economie)})` : ""),
    );
  }
  const recomandat = await planuriAcc.getRecomandat();
  console.log(`PlanuriAccessor.getRecomandat(): ${recomandat ? `${recomandat.cod} - ${recomandat.denumire}` : "niciunul"}`);

  console.log("CupoaneAccessor.getValabile() + pretCuReducere():");
  const pro = await planuriAcc.getDupaCod("PRO");
  for (const c of await cupoaneAcc.getValabile()) {
    const plan = c.plan ?? pro;
    const pretRedus = plan ? cupoaneAcc.pretCuReducere(plan, c) : null;
    console.log(
      `  ${c.cod.padEnd(11)} -${c.procentReducere.toFixed(2)}%  plan ${(c.plan?.cod ?? "oricare").padEnd(7)}` +
        ` valabil pana la ${c.valabilPana.toISOString().slice(0, 10)}, utilizari ${c.utilizari}/${c.utilizariMaxime}` +
        (plan && pretRedus ? `  -> ${plan.cod} costa ${lei(pretRedus)}` : ""),
    );
  }
  console.log("AbonamenteAccessor.getNumarPeStatus():", await abonamenteAcc.getNumarPeStatus());

  // ---------------------------------------------------------------
  titlu(`Ex. 7: relatia Plan -> CuponReducere, mod ${db.modIncarcare.toUpperCase()}`);
  db.reseteazaContor();
  const cuCupoane = await planuriAcc.getCuCupoane();
  console.log(`Dupa citirea planurilor: ${db.numarInterogari} interogari SQL`);
  console.log(`Cupoane deja incarcate: ${cuCupoane.map((p) => `${p.cod}=${p.cupoaneIncarcate ? "da" : "nu"}`).join(", ")}`);
  for (const p of cuCupoane) {
    const inainte = db.numarInterogari;
    const cupoane = await p.getCupoane();
    console.log(
      `  ${p.cod.padEnd(5)} ${cupoane.length} cupoane [${cupoane.map((c) => c.cod).join(", ")}]` +
        `  (interogari noi la acces: ${db.numarInterogari - inainte})`,
    );
  }
  console.log(`Total interogari SQL in modul ${db.modIncarcare}: ${db.numarInterogari}`);

  titlu("Ex. 7: comparatie eager / lazy");
  const rezultate: Record<string, string | number>[] = [];
  for (const mod of ["eager", "lazy"] as ModIncarcare[]) {
    db.reseteazaContor();
    const lista = await planuriAcc.getCuCupoane(mod);
    const laCitire = db.numarInterogari;
    for (const p of lista) await p.getCupoane();
    const laAcces = db.numarInterogari - laCitire;
    for (const p of lista) await p.getCupoane(); // al doilea acces: cupoanele sunt deja in memorie
    rezultate.push({
      mod,
      "interogari la citirea planurilor": laCitire,
      "interogari la primul acces": laAcces,
      "interogari la al doilea acces": db.numarInterogari - laCitire - laAcces,
      total: db.numarInterogari,
    });
  }
  console.table(rezultate);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
