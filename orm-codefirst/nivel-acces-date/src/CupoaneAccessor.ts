import { Prisma, type CuponReducere, type Plan } from "librarie-modele";
import { getContext, type BlockManagerContext } from "repository-codefirst";

export type CuponCuPlan = CuponReducere & { plan: Plan | null };

/** Datele unui cupon, asa cum sunt scrise la adaugare sau la modificare (fara id, utilizari si createdAt). */
export type DateCupon = {
  cod: string;
  procentReducere: Prisma.Decimal | string;
  planId: number | null;
  valabilPana: Date;
  utilizariMaxime: number;
  activ: boolean;
};

/** Eroare aruncata cand codul cuponului exista deja (indexul unic cupoane_reducere.cod). */
export class CodCuponDuplicat extends Error {
  constructor(readonly cod: string) {
    super(`Exista deja un cupon cu codul ${cod}.`);
  }
}

const esteCodDuplicat = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

/**
 * Accessor pentru tabelul "cupoane_reducere" (modelul CuponReducere).
 * procentReducere este acum Decimal(5,2), deci un cupon poate avea si 7,5%.
 */
export class CupoaneAccessor {
  constructor(private readonly db: BlockManagerContext = getContext()) {}

  /** Cupoanele, cu planul pentru care sunt valabile (null = orice plan platit). Cele sterse logic apar doar la cerere. */
  getToate(inclusivSterse = false): Promise<CuponCuPlan[]> {
    return this.db.cuponReducere.findMany({
      where: inclusivSterse ? undefined : { stersLa: null },
      orderBy: { id: "asc" },
      include: { plan: true },
    });
  }

  /** Un cupon dupa cod (inclusiv sters logic), sau null. */
  getDupaCod(cod: string): Promise<CuponCuPlan | null> {
    return this.db.cuponReducere.findUnique({ where: { cod }, include: { plan: true } });
  }

  /** Stergere logica: cuponul primeste data stergerii si devine inactiv; ramane in baza de date. */
  stergeLogic(id: number): Promise<CuponReducere> {
    return this.db.cuponReducere.update({ where: { id }, data: { stersLa: new Date(), activ: false } });
  }

  /** Anuleaza stergerea logica (cuponul ramane inactiv pana e activat din Edit). */
  restaureaza(id: number): Promise<CuponReducere> {
    return this.db.cuponReducere.update({ where: { id }, data: { stersLa: null } });
  }

  /** Un cupon dupa id, cu planul lui, sau null daca nu exista. */
  getDupaId(id: number): Promise<CuponCuPlan | null> {
    return this.db.cuponReducere.findUnique({ where: { id }, include: { plan: true } });
  }

  /** AddEntity: adauga un cupon nou (utilizari = 0). Arunca CodCuponDuplicat daca exista codul. */
  async adauga(date: DateCupon): Promise<CuponReducere> {
    try {
      return await this.db.cuponReducere.create({ data: { ...date, utilizari: 0 } });
    } catch (e) {
      if (esteCodDuplicat(e)) throw new CodCuponDuplicat(date.cod);
      throw e;
    }
  }

  /** UpdateEntity: modifica un cupon existent (numarul de utilizari nu se schimba). */
  async modifica(id: number, date: DateCupon): Promise<CuponReducere> {
    try {
      return await this.db.cuponReducere.update({ where: { id }, data: date });
    } catch (e) {
      if (esteCodDuplicat(e)) throw new CodCuponDuplicat(date.cod);
      throw e;
    }
  }

  /** Cupoanele care pot fi folosite la data data: active, neexpirate si cu utilizari ramase. */
  async getValabile(laData = new Date()): Promise<CuponCuPlan[]> {
    const zi = new Date(Date.UTC(laData.getFullYear(), laData.getMonth(), laData.getDate()));
    const cupoane = await this.db.cuponReducere.findMany({
      where: { activ: true, stersLa: null, valabilPana: { gte: zi } },
      orderBy: { procentReducere: "desc" },
      include: { plan: true },
    });
    return cupoane.filter((c) => c.utilizari < c.utilizariMaxime);
  }

  /** Pretul lunar al planului dupa aplicarea cuponului, rotunjit la bani. */
  pretCuReducere(plan: Plan, cupon: CuponReducere): Prisma.Decimal {
    const factor = new Prisma.Decimal(100).sub(cupon.procentReducere).div(100);
    return plan.pretLunar.mul(factor).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  }
}
