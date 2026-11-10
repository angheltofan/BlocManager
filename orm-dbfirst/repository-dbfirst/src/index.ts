/**
 * Repository_DBFirst
 *
 * Modelele din ./generated/prisma sunt generate automat din baza de date existenta:
 *   1. npx prisma db pull    -> citeste tabelele, coloanele, cheile si scrie prisma/schema.prisma
 *   2. npx prisma generate   -> genereaza din schema tipurile modelelor si clasa PrismaClient
 *
 * PrismaClient este echivalentul clasei DbContext din Entity Framework: are cate o proprietate
 * pentru fiecare tabel (db.planuri, db.abonamente, ...) prin care se fac interogarile.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.ts";

// tipurile modelelor generate (planuri, abonamente, ...), enumerarile si namespace-ul Prisma
export * from "./generated/prisma/client.ts";

/** Contextul bazei de date BlockManager (echivalentul DbContext). */
export type BlockManagerContext = PrismaClient;

let contextImplicit: BlockManagerContext | undefined;

/**
 * Creeaza contextul de acces la baza de date.
 * Sirul de conexiune vine din variabila DATABASE_URL, citita din fisierul .env al aplicatiei
 * care foloseste librăria (echivalentul sectiunii connectionStrings din app.config).
 */
export function creeazaContext(connectionString = process.env.DATABASE_URL): BlockManagerContext {
  if (!connectionString) {
    throw new Error("Lipseste DATABASE_URL. Adauga in .env sirul de conexiune la baza de date blockmanager.");
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

/** Contextul comun, creat la prima utilizare. */
export function getContext(): BlockManagerContext {
  contextImplicit ??= creeazaContext();
  return contextImplicit;
}

/** Inchide conexiunile contextului comun (la finalul aplicatiei). */
export async function inchideContext(): Promise<void> {
  await contextImplicit?.$disconnect();
  contextImplicit = undefined;
}
