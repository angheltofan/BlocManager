import type { Logger } from "./Logger.ts";

/** Evenimentele de business publicate de servicii si datele fiecaruia. */
export type Evenimente = {
  PlataEfectuata: {
    comandaId: number;
    referinta: string;
    asociatieId: number;
    tip: "ABONAMENT" | "PACHET";
    suma: string; // lei, cu TVA inclus
    descriere: string; // ex. "Abonament Pro" sau "Pachet 300 tokeni"
    tokeniAlocati: number;
    achitataLa: string; // ISO
  };
  AbonamentSuspendat: {
    abonamentId: number;
    asociatieId: number;
    plan: string;
    comandaReferinta: string;
  };
};

type Consumator<E extends keyof Evenimente> = { nume: string; trateaza: (date: Evenimente[E]) => Promise<void> };

/**
 * Magistrala de evenimente (publish / subscribe, in proces).
 *
 * Un serviciu publica un eveniment DUPA ce tranzactia lui s-a terminat cu succes; nu stie cine il preia.
 * Fiecare consumator inregistrat il primeste separat, asincron: o eroare intr-un consumator este logata,
 * dar nu afecteaza operatia de business si nici ceilalti consumatori.
 */
export class MagistralaEvenimente {
  private readonly consumatori = new Map<keyof Evenimente, Consumator<never>[]>();
  private readonly inCurs = new Set<Promise<void>>();
  private readonly log: Logger;

  constructor({ logger }: { logger: Logger }) {
    this.log = logger.pentru("Evenimente");
  }

  abonare<E extends keyof Evenimente>(eveniment: E, nume: string, trateaza: (date: Evenimente[E]) => Promise<void>) {
    const lista = this.consumatori.get(eveniment) ?? [];
    lista.push({ nume, trateaza } as Consumator<never>);
    this.consumatori.set(eveniment, lista);
  }

  publica<E extends keyof Evenimente>(eveniment: E, date: Evenimente[E]) {
    const lista = (this.consumatori.get(eveniment) ?? []) as unknown as Consumator<E>[];
    this.log.info(`Publicat ${eveniment}`, { consumatori: lista.map((c) => c.nume), ...date });
    for (const consumator of lista) {
      const p = new Promise<void>((rezolva) => setImmediate(rezolva))
        .then(() => consumator.trateaza(date))
        .then(() => this.log.info(`${consumator.nume} a tratat ${eveniment}`))
        .catch((e: unknown) => this.log.eroare(`${consumator.nume} a eșuat la ${eveniment}`, { eroare: String(e) }))
        .finally(() => this.inCurs.delete(p));
      this.inCurs.add(p);
    }
  }

  /** Asteapta consumatorii aflati in lucru (util in teste si la oprirea aplicatiei). */
  async asteaptaConsumatorii() {
    while (this.inCurs.size > 0) await Promise.all([...this.inCurs]);
  }

  numeConsumatori(eveniment: keyof Evenimente) {
    return (this.consumatori.get(eveniment) ?? []).map((c) => c.nume);
  }
}
