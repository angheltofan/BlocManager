import type { ComandaSimulata, PachetTokeni } from "librarie-modele";
import { getContext, type BlockManagerContext } from "repository-codefirst";

export type PachetCuComenzi = PachetTokeni & { _count: { comenzi: number } };
export type PachetCuIstoric = PachetTokeni & {
  _count: { comenzi: number };
  comenzi: (ComandaSimulata & { asociatie: { denumire: string } })[];
};

/**
 * Accessor pentru tabelul "pachete_tokeni" (modelul PachetTokeni).
 *
 * Un pachet nu se sterge fizic: id-ul lui este cheie straina in comenzi_simulate.pachet_id, iar stergerea
 * fizica ar rupe legatura comenzilor vechi cu pachetul cumparat (istoricul aplicatiei).
 * De aceea stergerea este logica (sters_la), iar Get si GetAll omit pachetele sterse.
 */
export class PacheteAccessor {
  constructor(private readonly db: BlockManagerContext = getContext()) {}

  /** GetAll: pachetele, cu numarul de comenzi care le folosesc. Cele sterse logic apar doar la cerere. */
  getToate(inclusivSterse = false): Promise<PachetCuComenzi[]> {
    return this.db.pachetTokeni.findMany({
      where: inclusivSterse ? undefined : { stersLa: null },
      orderBy: { tokeni: "asc" },
      include: { _count: { select: { comenzi: true } } },
    });
  }

  /** Pachetele oferite la cumparare: active si nesterse. */
  getOferite(): Promise<PachetTokeni[]> {
    return this.db.pachetTokeni.findMany({ where: { activ: true, stersLa: null }, orderBy: { tokeni: "asc" } });
  }

  /** Get: un pachet nesters, sau null (un pachet sters logic este tratat ca inexistent). */
  getDupaId(id: number): Promise<PachetTokeni | null> {
    return this.db.pachetTokeni.findFirst({ where: { id, stersLa: null } });
  }

  /** Un pachet dupa id, inclusiv sters logic, cu ultimele comenzi (pentru administrare). */
  getCuIstoric(id: number): Promise<PachetCuIstoric | null> {
    return this.db.pachetTokeni.findUnique({
      where: { id },
      include: {
        _count: { select: { comenzi: true } },
        comenzi: { orderBy: { id: "desc" }, take: 10, include: { asociatie: { select: { denumire: true } } } },
      },
    });
  }

  /** Stergere logica: pachetul primeste data stergerii; randul si comenzile legate de el raman. */
  stergeLogic(id: number): Promise<PachetTokeni> {
    return this.db.pachetTokeni.update({ where: { id }, data: { stersLa: new Date() } });
  }

  /** Anuleaza stergerea logica. */
  restaureaza(id: number): Promise<PachetTokeni> {
    return this.db.pachetTokeni.update({ where: { id }, data: { stersLa: null } });
  }
}
