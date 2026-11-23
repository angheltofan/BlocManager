import { Prisma, StatusAbonament, type CuponReducere, type Plan } from "librarie-modele";
import { getContext, type BlockManagerContext, type ModIncarcare } from "repository-codefirst";

/** Un plan, impreuna cu numarul de abonamente curente (active sau suspendate). */
export type PlanCuAbonamente = Plan & { abonamenteCurente: number };

/** Venitul lunar simulat adus de un plan: abonamentele active inmultite cu pretul planului. */
export type VenitPlan = {
  cod: string;
  denumire: string;
  pretLunar: Prisma.Decimal;
  abonamenteActive: number;
  venitLunar: Prisma.Decimal;
};

/**
 * Un plan cu relatia "cupoane" (Plan 1 -> n CuponReducere, prin cheia straina cupoane_reducere.plan_id).
 * - eager: cupoanele sunt deja incarcate, odata cu planurile; getCupoane() nu mai trimite nicio interogare;
 * - lazy: cupoanele se incarca abia la primul apel getCupoane(), cu o interogare separata pentru fiecare plan.
 */
export type PlanCuCupoane = Plan & {
  readonly cupoaneIncarcate: boolean;
  getCupoane(): Promise<CuponReducere[]>;
};

/**
 * Accessor pentru tabelul "planuri", preluat din NivelAccesDate_DBFirst (Laboratorul 3)
 * si adaptat la modelul Code First "Plan" din LibrarieModele.
 */
export class PlanuriAccessor {
  constructor(private readonly db: BlockManagerContext = getContext()) {}

  /** Toate planurile, de la cel mai ieftin la cel mai scump. */
  getToate(doarActive = true): Promise<Plan[]> {
    return this.db.plan.findMany({
      where: doarActive ? { activ: true } : undefined,
      orderBy: { pretLunar: "asc" },
    });
  }

  /** Un plan dupa cod (FREE, PRO, MAX), sau null daca nu exista. */
  getDupaCod(cod: string): Promise<Plan | null> {
    return this.db.plan.findUnique({ where: { cod: cod.toUpperCase() } });
  }

  /** Planul evidentiat pe pagina de preturi (proprietatea noua "recomandat"). */
  getRecomandat(): Promise<Plan | null> {
    return this.db.plan.findFirst({ where: { recomandat: true, activ: true } });
  }

  /** Cat economiseste un client care plateste anual fata de 12 plati lunare (null daca planul nu are pret anual). */
  getEconomieAnuala(plan: Plan): Prisma.Decimal | null {
    return plan.pretAnual ? plan.pretLunar.mul(12).sub(plan.pretAnual) : null;
  }

  /** Planurile, fiecare cu numarul de abonamente curente (ACTIV sau SUSPENDAT) care il folosesc. */
  async getCuAbonamenteCurente(): Promise<PlanCuAbonamente[]> {
    const rezultat = await this.db.plan.findMany({
      orderBy: { pretLunar: "asc" },
      include: {
        _count: {
          select: { abonamente: { where: { status: { in: [StatusAbonament.ACTIV, StatusAbonament.SUSPENDAT] } } } },
        },
      },
    });
    return rezultat.map(({ _count, ...plan }) => ({ ...plan, abonamenteCurente: _count.abonamente }));
  }

  /**
   * Venitul lunar simulat pe fiecare plan: numarul de abonamente ACTIVE x pretul lunar.
   * Abonamentele suspendate nu intra in calcul, pentru ca nu au platit perioada curenta.
   */
  async getVenitLunarSimulat(): Promise<{ planuri: VenitPlan[]; total: Prisma.Decimal }> {
    const [toatePlanurile, grupuri] = await Promise.all([
      this.getToate(false),
      this.db.abonament.groupBy({ by: ["planId"], where: { status: StatusAbonament.ACTIV }, _count: { _all: true } }),
    ]);
    const activePePlan = new Map(grupuri.map((g) => [g.planId, g._count._all]));
    const rezultat = toatePlanurile.map((p) => {
      const abonamenteActive = activePePlan.get(p.id) ?? 0;
      return { cod: p.cod, denumire: p.denumire, pretLunar: p.pretLunar, abonamenteActive, venitLunar: p.pretLunar.mul(abonamenteActive) };
    });
    const total = rezultat.reduce((suma, r) => suma.add(r.venitLunar), new Prisma.Decimal(0));
    return { planuri: rezultat, total };
  }

  /**
   * Planurile cu cupoanele lor, incarcate dupa setarea INCARCARE_RELATII a contextului
   * (sau dupa parametrul "mod", daca este dat).
   */
  getCuCupoane(mod: ModIncarcare = this.db.modIncarcare): Promise<PlanCuCupoane[]> {
    return mod === "eager" ? this.getCuCupoaneEager() : this.getCuCupoaneLazy();
  }

  /** Eager loading: planurile si cupoanele lor sunt citite odata, cu "include". */
  private async getCuCupoaneEager(): Promise<PlanCuCupoane[]> {
    const planuri = await this.db.plan.findMany({
      orderBy: { pretLunar: "asc" },
      include: { cupoane: { orderBy: { cod: "asc" } } },
    });
    return planuri.map(({ cupoane, ...plan }) => ({
      ...plan,
      cupoaneIncarcate: true,
      getCupoane: () => Promise.resolve(cupoane),
    }));
  }

  /** Lazy loading: se citesc doar planurile; cupoanele unui plan se citesc la primul acces, apoi se pastreaza. */
  private async getCuCupoaneLazy(): Promise<PlanCuCupoane[]> {
    const planuri = await this.db.plan.findMany({ orderBy: { pretLunar: "asc" } });
    return planuri.map((plan) => {
      let cupoane: CuponReducere[] | undefined;
      return {
        ...plan,
        get cupoaneIncarcate() {
          return cupoane !== undefined;
        },
        getCupoane: async () => {
          // o singura interogare, dupa cheia straina cupoane_reducere.plan_id
          cupoane ??= await this.db.cuponReducere.findMany({ where: { planId: plan.id }, orderBy: { cod: "asc" } });
          return cupoane;
        },
      };
    });
  }
}
