import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * O singura instanta de PrismaClient pentru toata aplicatia.
 * In dezvoltare, Next.js reincarca modulele la fiecare modificare; pastram clientul pe
 * globalThis ca sa nu deschidem cate o conexiune noua la fiecare reincarcare.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Lipsește DATABASE_URL. Copiază .env.example în .env și completează datele de conectare.");
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
