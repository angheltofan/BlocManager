import { Prisma, type CuponReducere, type Plan } from "librarie-modele";
import { getContext, type BlockManagerContext } from "repository-codefirst";

export type CuponCuPlan = CuponReducere & { plan: Plan | null };

/**
 * Accessor pentru tabelul "cupoane_reducere" (modelul CuponReducere).
 * procentReducere este acum Decimal(5,2), deci un cupon poate avea si 7,5%.
 */
export class CupoaneAccessor {
  constructor(private readonly db: BlockManagerContext = getContext()) {}

  /** Toate cupoanele, cu planul pentru care sunt valabile (null = orice plan platit). */
  getToate(): Promise<CuponCuPlan[]> {
    return this.db.cuponReducere.findMany({ orderBy: { id: "asc" }, include: { plan: true } });
  }

  /** Cupoanele care pot fi folosite la data data: active, neexpirate si cu utilizari ramase. */
  async getValabile(laData = new Date()): Promise<CuponCuPlan[]> {
    const zi = new Date(Date.UTC(laData.getFullYear(), laData.getMonth(), laData.getDate()));
    const cupoane = await this.db.cuponReducere.findMany({
      where: { activ: true, valabilPana: { gte: zi } },
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
