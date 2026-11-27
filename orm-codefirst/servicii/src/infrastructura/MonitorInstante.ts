/**
 * MonitorInstante: numara obiectele create de containerul DI, pe clase, si da fiecarui obiect un numar
 * (#1, #2, ...). Pagina "Durata de viata (DI)" din admin il foloseste ca sa arate cand containerul
 * refoloseste o instanta (Singleton, Scoped) si cand creeaza una noua (Transient).
 */
export class MonitorInstante {
  private readonly numere = new WeakMap<object, number>();
  private readonly totaluri = new Map<string, number>();

  /** Inregistreaza un obiect nou creat de container si il intoarce neschimbat. */
  urmareste<T extends object>(clasa: string, obiect: T): T {
    const numar = (this.totaluri.get(clasa) ?? 0) + 1;
    this.totaluri.set(clasa, numar);
    this.numere.set(obiect, numar);
    return obiect;
  }

  /** Numarul instantei (al catelea obiect de acel tip a fost creat). */
  numar(obiect: object): number {
    return this.numere.get(obiect) ?? 0;
  }

  /** Cate instante s-au creat din fiecare clasa, de la pornirea procesului. */
  totaluriPeClase(): { clasa: string; instante: number }[] {
    return [...this.totaluri].map(([clasa, instante]) => ({ clasa, instante })).sort((a, b) => a.clasa.localeCompare(b.clasa));
  }
}
