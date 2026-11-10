import { Prisma, StatusAbonament, getContext, type BlockManagerContext, type planuri } from "repository-dbfirst";

/** Un plan, impreuna cu numarul de abonamente curente (active sau suspendate). */
export type PlanCuAbonamente = planuri & { abonamenteCurente: number };

/** Venitul lunar simulat adus de un plan: abonamentele active inmultite cu pretul planului. */
export type VenitPlan = {
  cod: string;
  denumire: string;
  pretLunar: Prisma.Decimal;
  abonamenteActive: number;
  venitLunar: Prisma.Decimal;
};

/**
 * Accessor pentru tabelul "planuri" (planurile de abonament Free, Pro, Max).
 * Contine metode de preluare a datelor personalizate, construite peste modelul generat "planuri".
 */
export class PlanuriAccessor {
  constructor(private readonly db: BlockManagerContext = getContext()) {}

  /** Toate planurile, de la cel mai ieftin la cel mai scump. */
  getToate(doarActive = true): Promise<planuri[]> {
    return this.db.planuri.findMany({
      where: doarActive ? { activ: true } : undefined,
      orderBy: { pret_lunar: "asc" },
    });
  }

  /** Un plan dupa cod (FREE, PRO, MAX), sau null daca nu exista. */
  getDupaCod(cod: string): Promise<planuri | null> {
    return this.db.planuri.findUnique({ where: { cod: cod.toUpperCase() } });
  }

  /** Planurile, fiecare cu numarul de abonamente curente (ACTIV sau SUSPENDAT) care il folosesc. */
  async getCuAbonamenteCurente(): Promise<PlanCuAbonamente[]> {
    const rezultat = await this.db.planuri.findMany({
      orderBy: { pret_lunar: "asc" },
      include: {
        _count: {
          select: {
            abonamente_abonamente_plan_idToplanuri: {
              where: { status: { in: [StatusAbonament.ACTIV, StatusAbonament.SUSPENDAT] } },
            },
          },
        },
      },
    });
    return rezultat.map(({ _count, ...plan }) => ({
      ...plan,
      abonamenteCurente: _count.abonamente_abonamente_plan_idToplanuri,
    }));
  }

  /**
   * Venitul lunar simulat pe fiecare plan: numarul de abonamente ACTIVE x pretul lunar.
   * Abonamentele suspendate nu intra in calcul, pentru ca nu au platit perioada curenta.
   */
  async getVenitLunarSimulat(): Promise<{ planuri: VenitPlan[]; total: Prisma.Decimal }> {
    const [toatePlanurile, grupuri] = await Promise.all([
      this.getToate(false),
      this.db.abonamente.groupBy({
        by: ["plan_id"],
        where: { status: StatusAbonament.ACTIV },
        _count: { _all: true },
      }),
    ]);

    const activePePlan = new Map(grupuri.map((g) => [g.plan_id, g._count._all]));
    const rezultat = toatePlanurile.map((p) => {
      const abonamenteActive = activePePlan.get(p.id) ?? 0;
      return {
        cod: p.cod,
        denumire: p.denumire,
        pretLunar: p.pret_lunar,
        abonamenteActive,
        venitLunar: p.pret_lunar.mul(abonamenteActive),
      };
    });
    const total = rezultat.reduce((suma, r) => suma.add(r.venitLunar), new Prisma.Decimal(0));
    return { planuri: rezultat, total };
  }
}
