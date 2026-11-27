/**
 * Servicii: nivelul de logica de business al aplicatiei BlockManager.
 * web-mvc (admin) si web-api (utilizator) folosesc doar acest nivel, prin containerul de dependency injection.
 */
export { creeazaContainer, type Container, type Dependente } from "./container.ts";
export { EroareBusiness, type CodEroare } from "./infrastructura/EroareBusiness.ts";
export { Logger } from "./infrastructura/Logger.ts";
export { CacheMemorie } from "./infrastructura/CacheMemorie.ts";
export { MagistralaEvenimente, type Evenimente } from "./infrastructura/MagistralaEvenimente.ts";
export type { DateModificareAbonament } from "./servicii/ServiciuAbonamente.ts";
export type { OptiuniAbonament, RezultatAlegerePlan } from "./servicii/ServiciuComenzi.ts";
export type { RezultatDebitare } from "./servicii/ServiciuTokeni.ts";
export type { RezultatReinnoire } from "./servicii/ServiciuReinnoire.ts";
export type { FormularAsociatie } from "./servicii/ServiciuAsociatii.ts";
