import type { Logger } from "./Logger.ts";

type Intrare = { valoare: unknown; expiraLa: number };

/**
 * Cache in memorie, cu durata de viata (TTL) pe fiecare cheie.
 * Folosit pentru datele citite des si schimbate rar: planurile, pachetele de tokeni, actiunile taxate.
 * Serviciile invalideaza cheile cand datele se schimba.
 */
export class CacheMemorie {
  private readonly intrari = new Map<string, Intrare>();
  private readonly log: Logger;
  accesari = 0;
  ratari = 0;

  constructor({ logger }: { logger: Logger }) {
    this.log = logger.pentru("Cache");
  }

  /** Valoarea din cache sau, daca lipseste ori a expirat, rezultatul functiei incarca (salvat pentru secundeTtl). */
  async getSauIncarca<T>(cheie: string, secundeTtl: number, incarca: () => Promise<T>): Promise<T> {
    const intrare = this.intrari.get(cheie);
    if (intrare && intrare.expiraLa > Date.now()) {
      this.accesari++;
      return intrare.valoare as T;
    }
    this.ratari++;
    const valoare = await incarca();
    this.intrari.set(cheie, { valoare, expiraLa: Date.now() + secundeTtl * 1000 });
    this.log.info(`Încărcat în cache: ${cheie}`, { ttlSecunde: secundeTtl });
    return valoare;
  }

  /** Sterge cheile care incep cu prefixul dat (sau toate, fara prefix). */
  invalideaza(prefix = "") {
    let sterse = 0;
    for (const cheie of this.intrari.keys()) {
      if (cheie.startsWith(prefix)) {
        this.intrari.delete(cheie);
        sterse++;
      }
    }
    if (sterse > 0) this.log.info(`Invalidat din cache: ${prefix || "tot"}`, { chei: sterse });
  }

  statistici() {
    return { chei: this.intrari.size, accesari: this.accesari, ratari: this.ratari };
  }
}
