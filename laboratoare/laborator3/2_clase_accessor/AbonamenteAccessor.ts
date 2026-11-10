import {
  StatusAbonament,
  StatusComanda,
  getContext,
  type BlockManagerContext,
  type Prisma,
} from "repository-dbfirst";

/** Ce se incarca impreuna cu un abonament: planul (prin cheia straina plan_id) si asociatia. */
const cuPlanSiAsociatie = {
  planuri_abonamente_plan_idToplanuri: true,
  asociatii: { select: { id: true, denumire: true } },
} satisfies Prisma.abonamenteInclude;

export type AbonamentCuPlan = Prisma.abonamenteGetPayload<{ include: typeof cuPlanSiAsociatie }>;

export type AbonamentSuspendat = Prisma.abonamenteGetPayload<{
  include: typeof cuPlanSiAsociatie & { comenzi_simulate: true };
}>;

/**
 * Accessor pentru tabelul "abonamente".
 * Fiecare abonament este legat de un plan prin cheia straina abonamente.plan_id -> planuri.id.
 */
export class AbonamenteAccessor {
  constructor(private readonly db: BlockManagerContext = getContext()) {}

  /** Abonamentul curent al unei asociatii (ACTIV sau SUSPENDAT), cu planul lui. */
  getAbonamentCurent(asociatieId: number): Promise<AbonamentCuPlan | null> {
    return this.db.abonamente.findFirst({
      where: {
        asociatie_id: asociatieId,
        status: { in: [StatusAbonament.ACTIV, StatusAbonament.SUSPENDAT] },
      },
      include: cuPlanSiAsociatie,
    });
  }

  /** Abonamentele suspendate pana la plata, fiecare cu comanda simulata care asteapta plata. */
  getSuspendate(): Promise<AbonamentSuspendat[]> {
    return this.db.abonamente.findMany({
      where: { status: StatusAbonament.SUSPENDAT },
      orderBy: { sfarsit_perioada: "asc" },
      include: {
        ...cuPlanSiAsociatie,
        comenzi_simulate: { where: { status: StatusComanda.IN_ASTEPTARE } },
      },
    });
  }

  /** Abonamentele active a caror perioada se termina pana la data data (inclusiv cele deja depasite). */
  getCareExpiraPanaLa(data: Date): Promise<AbonamentCuPlan[]> {
    return this.db.abonamente.findMany({
      where: { status: StatusAbonament.ACTIV, sfarsit_perioada: { lte: data } },
      orderBy: { sfarsit_perioada: "asc" },
      include: cuPlanSiAsociatie,
    });
  }

  /** Istoricul abonamentelor unei asociatii, de la cel mai nou la cel mai vechi. */
  getIstoric(asociatieId: number): Promise<AbonamentCuPlan[]> {
    return this.db.abonamente.findMany({
      where: { asociatie_id: asociatieId },
      orderBy: { created_at: "desc" },
      include: cuPlanSiAsociatie,
    });
  }

  /** Cate abonamente sunt in fiecare stare (ACTIV, SUSPENDAT, ANULAT, EXPIRAT). */
  async getNumarPeStatus(): Promise<Record<StatusAbonament, number>> {
    const grupuri = await this.db.abonamente.groupBy({ by: ["status"], _count: { _all: true } });
    const rezultat = { ACTIV: 0, SUSPENDAT: 0, ANULAT: 0, EXPIRAT: 0 } as Record<StatusAbonament, number>;
    for (const g of grupuri) rezultat[g.status] = g._count._all;
    return rezultat;
  }
}
