/**
 * Seed (Code First): date de test in aceleasi doua tabele ca migrarea date_test,
 * planuri si cupoane_reducere.
 *
 * Ruleaza cu "npx prisma db seed", DUPA migrari. Cauta fiecare rand dupa cod, apoi il actualizeaza sau il insereaza:
 * - randurile inserate deja de migrarea date_test (FREE, PRO, BUNVENIT20, TOAMNA10) sunt doar actualizate
 *   si isi pastreaza id-urile 1 si 2;
 * - randurile noi (MAX, MAX15, VARA5) primesc id-urile urmatoare.
 * Poate fi rulat de mai multe ori fara duplicate.
 */
import "dotenv/config";
import { BlockManagerContext } from "../src/BlockManagerContext.ts";

const db = new BlockManagerContext();

const planuri = [
  { cod: "FREE", denumire: "Free", pretLunar: "0.00", pretAnual: null, tokeniLunari: 50, maxApartamente: 30, maxBlocuri: 1, raportAnual: false, recomandat: false, descriere: "Pentru asociatiile mici: 50 de tokeni pe luna, reinnoiti automat." },
  { cod: "PRO", denumire: "Pro", pretLunar: "49.00", pretAnual: "490.00", tokeniLunari: 400, maxApartamente: 300, maxBlocuri: 5, raportAnual: true, recomandat: true, descriere: "400 de tokeni pe luna si raport anual; se plateste lunar." },
  { cod: "MAX", denumire: "Max", pretLunar: "149.00", pretAnual: "1490.00", tokeniLunari: 2000, maxApartamente: null, maxBlocuri: null, raportAnual: true, recomandat: false, descriere: "2000 de tokeni pe luna, fara limita de blocuri si apartamente." },
];

const cupoane = [
  { cod: "BUNVENIT20", procentReducere: "20.00", plan: "PRO", valabilPana: "2026-12-31", utilizariMaxime: 100, utilizari: 0, activ: true },
  { cod: "TOAMNA10", procentReducere: "10.00", plan: null, valabilPana: "2026-11-30", utilizariMaxime: 50, utilizari: 12, activ: true },
  { cod: "MAX15", procentReducere: "15.00", plan: "MAX", valabilPana: "2026-11-30", utilizariMaxime: 20, utilizari: 3, activ: true },
  { cod: "VARA5", procentReducere: "7.50", plan: null, valabilPana: "2026-08-31", utilizariMaxime: 10, utilizari: 10, activ: false },
];

async function main() {
  console.log("Seed Code First: planuri si cupoane_reducere");

  for (const p of planuri) {
    const existent = await db.plan.findUnique({ where: { cod: p.cod } });
    const { cod, ...date } = p;
    const rezultat = existent
      ? await db.plan.update({ where: { cod }, data: date })
      : await db.plan.create({ data: { cod, ...date } });
    console.log(`  planuri          id=${rezultat.id}  ${cod.padEnd(10)} ${existent ? "exista deja (inserat inainte, de migrare) -> actualizat" : "inserat de seed"}`);
  }

  const idPlan = new Map((await db.plan.findMany({ select: { id: true, cod: true } })).map((p) => [p.cod, p.id]));

  for (const c of cupoane) {
    const existent = await db.cuponReducere.findUnique({ where: { cod: c.cod } });
    const date = {
      procentReducere: c.procentReducere,
      planId: c.plan ? idPlan.get(c.plan)! : null,
      valabilPana: new Date(`${c.valabilPana}T00:00:00Z`),
      utilizariMaxime: c.utilizariMaxime,
      utilizari: c.utilizari,
      activ: c.activ,
    };
    const rezultat = existent
      ? await db.cuponReducere.update({ where: { cod: c.cod }, data: date })
      : await db.cuponReducere.create({ data: { cod: c.cod, ...date } });
    console.log(`  cupoane_reducere id=${rezultat.id}  ${c.cod.padEnd(10)} ${existent ? "exista deja (inserat inainte, de migrare) -> actualizat" : "inserat de seed"}`);
  }

  console.log(`Gata: ${await db.plan.count()} planuri, ${await db.cuponReducere.count()} cupoane.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
