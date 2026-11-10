/**
 * LibrarieModele
 *
 * Modelele entitatilor sunt scrise de mana in prisma/schema/*.prisma (Code First).
 * Din ele, "prisma generate" produce in ./generated/prisma cate un tip TypeScript pentru fiecare
 * entitate (Plan, Abonament, CuponReducere, ...), enumerarile si clasa PrismaClient.
 */
export * from "./generated/prisma/client.ts";
