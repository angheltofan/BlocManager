import { StatusAbonament, StatusComanda, type Prisma } from "librarie-modele";
import { getContext, type BlockManagerContext } from "repository-codefirst";

/** Ce se incarca impreuna cu un abonament: planul (prin cheia straina plan_id) si asociatia. */
const cuPlanSiAsociatie = {
  plan: true,
  asociatie: { select: { id: true, denumire: true } },
} satisfies Prisma.AbonamentInclude;

export type AbonamentCuPlan = Prisma.AbonamentGetPayload<{ include: typeof cuPlanSiAsociatie }>;

export type AbonamentSuspendat = Prisma.AbonamentGetPayload<{
  include: typeof cuPlanSiAsociatie & { comenzi: true };
}>;

/**
 * Accessor pentru tabelul "abonamente", preluat din NivelAccesDate_DBFirst (Laboratorul 3)
 * si adaptat la modelul Code First "Abonament". Relatiile au acum nume alese in model
 * (plan, asociatie, comenzi), nu nume generate din cheile straine.
 */
export class AbonamenteAccessor {
  constructor(private readonly db: BlockManagerContext = getContext()) {}

  /** Abonamentul curent al unei asociatii (ACTIV sau SUSPENDAT), cu planul lui. */
  getAbonamentCurent(asociatieId: number): Promise<AbonamentCuPlan | null> {
    return this.db.abonament.findFirst({
      where: { asociatieId, status: { in: [StatusAbonament.ACTIV, StatusAbonament.SUSPENDAT] } },
      include: cuPlanSiAsociatie,
    });
  }

  /** Abonamentele suspendate pana la plata, fiecare cu comanda simulata care asteapta plata. */
  getSuspendate(): Promise<AbonamentSuspendat[]> {
    return this.db.abonament.findMany({
      where: { status: StatusAbonament.SUSPENDAT },
      orderBy: { sfarsitPerioada: "asc" },
      include: { ...cuPlanSiAsociatie, comenzi: { where: { status: StatusComanda.IN_ASTEPTARE } } },
    });
  }

  /** Abonamentele active a caror perioada se termina pana la data data (inclusiv cele deja depasite). */
  getCareExpiraPanaLa(data: Date): Promise<AbonamentCuPlan[]> {
    return this.db.abonament.findMany({
      where: { status: StatusAbonament.ACTIV, sfarsitPerioada: { lte: data } },
      orderBy: { sfarsitPerioada: "asc" },
      include: cuPlanSiAsociatie,
    });
  }

  /** Istoricul abonamentelor unei asociatii, de la cel mai nou la cel mai vechi. */
  getIstoric(asociatieId: number): Promise<AbonamentCuPlan[]> {
    return this.db.abonament.findMany({
      where: { asociatieId },
      orderBy: { createdAt: "desc" },
      include: cuPlanSiAsociatie,
    });
  }

  /** Cate abonamente sunt in fiecare stare (ACTIV, SUSPENDAT, ANULAT, EXPIRAT). */
  async getNumarPeStatus(): Promise<Record<StatusAbonament, number>> {
    const grupuri = await this.db.abonament.groupBy({ by: ["status"], _count: { _all: true } });
    const rezultat = { ACTIV: 0, SUSPENDAT: 0, ANULAT: 0, EXPIRAT: 0 } as Record<StatusAbonament, number>;
    for (const g of grupuri) rezultat[g.status] = g._count._all;
    return rezultat;
  }
}
