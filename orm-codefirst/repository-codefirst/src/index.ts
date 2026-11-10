/**
 * Repository_CodeFirst
 *
 * Contine contextul bazei de date (BlockManagerContext), configurarea conexiunii (prisma.config.ts),
 * migrarile generate din LibrarieModele (prisma/migrations) si seed-ul (prisma/seed.ts).
 */
import { BlockManagerContext } from "./BlockManagerContext.ts";

export { BlockManagerContext, type ModIncarcare } from "./BlockManagerContext.ts";

let contextImplicit: BlockManagerContext | undefined;

/** Contextul comun, creat la prima utilizare cu setarile din .env. */
export function getContext(): BlockManagerContext {
  contextImplicit ??= new BlockManagerContext();
  return contextImplicit;
}

/** Inchide conexiunile contextului comun (la finalul aplicatiei). */
export async function inchideContext(): Promise<void> {
  await contextImplicit?.$disconnect();
  contextImplicit = undefined;
}
