import type { PachetTokeni } from "librarie-modele";
import type { PachetCuComenzi, PachetCuIstoric, PacheteAccessor } from "nivel-acces-date";
import type { CacheMemorie } from "../infrastructura/CacheMemorie.ts";
import { EroareBusiness } from "../infrastructura/EroareBusiness.ts";
import type { Logger } from "../infrastructura/Logger.ts";

/**
 * ServiciuPachete: administrarea pachetelor de tokeni, cu stergere logica (Laboratorul 9).
 * Un pachet sters nu mai este oferit si nu mai poate fi cumparat, dar comenzile vechi il pastreaza.
 */
export class ServiciuPachete {
  private readonly pachete: PacheteAccessor;
  private readonly cache: CacheMemorie;
  private readonly log: Logger;

  constructor(dep: { pacheteAccessor: PacheteAccessor; cache: CacheMemorie; logger: Logger }) {
    this.pachete = dep.pacheteAccessor;
    this.cache = dep.cache;
    this.log = dep.logger.pentru("ServiciuPachete");
  }

  getToate(inclusivSterse = false): Promise<PachetCuComenzi[]> {
    return this.pachete.getToate(inclusivSterse);
  }

  /** Detaliile unui pachet pentru admin (inclusiv sters logic), cu comenzile care il folosesc. */
  async getCuIstoric(id: number): Promise<PachetCuIstoric> {
    const pachet = await this.pachete.getCuIstoric(id);
    if (!pachet) throw new EroareBusiness("NEGASIT", `Nu există niciun pachet cu id-ul ${id}.`);
    return pachet;
  }

  async sterge(id: number): Promise<PachetTokeni> {
    const pachet = await this.getCuIstoric(id);
    if (pachet.stersLa) return pachet;
    const sters = await this.pachete.stergeLogic(id);
    this.cache.invalideaza("pachete");
    this.log.info(`Pachet șters logic: ${pachet.denumire}`, { id, comenziPastrate: pachet._count.comenzi });
    return sters;
  }

  async restaureaza(id: number): Promise<PachetTokeni> {
    const pachet = await this.getCuIstoric(id);
    if (!pachet.stersLa) return pachet;
    const restaurat = await this.pachete.restaureaza(id);
    this.cache.invalideaza("pachete");
    this.log.info(`Pachet restaurat: ${pachet.denumire}`, { id });
    return restaurat;
  }
}
