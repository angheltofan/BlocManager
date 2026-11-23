import { Prisma } from "librarie-modele";

export type Tx = Prisma.TransactionClient;

/** Ziua curenta, la ora 00:00 UTC (datele de perioada se compara pe zile). */
export function ziCurenta(moment = new Date()): Date {
  return new Date(Date.UTC(moment.getUTCFullYear(), moment.getUTCMonth(), moment.getUTCDate()));
}

/** Aceeasi zi, peste o luna. */
export function plusOLuna(d: Date): Date {
  const r = new Date(d);
  r.setUTCMonth(r.getUTCMonth() + 1);
  return r;
}

/** Urmatoarea referinta dintr-o serie anuala: PREFIX-AAAA-NNNNNN (SIM pentru comenzi, BM pentru facturi). */
export async function urmatorulNumar(
  tx: Tx,
  serie: "SIM" | "BM",
): Promise<string> {
  const prefix = `${serie}-${new Date().getFullYear()}-`;
  const ultimul =
    serie === "SIM"
      ? (await tx.comandaSimulata.findFirst({ where: { referinta: { startsWith: prefix } }, orderBy: { referinta: "desc" }, select: { referinta: true } }))?.referinta
      : (await tx.facturaSimulata.findFirst({ where: { numar: { startsWith: prefix } }, orderBy: { numar: "desc" }, select: { numar: true } }))?.numar;
  const numar = ultimul ? Number(ultimul.slice(prefix.length)) + 1 : 1;
  return prefix + String(numar).padStart(6, "0");
}

/** Pretul dupa reducerea procentuala, rotunjit la bani. */
export function cuReducere(pret: Prisma.Decimal, procent: Prisma.Decimal): Prisma.Decimal {
  return pret.mul(new Prisma.Decimal(100).sub(procent)).div(100).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}
