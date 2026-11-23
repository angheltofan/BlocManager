import { StatusAbonament, StatusComanda, type Asociatie, type Prisma } from "librarie-modele";
import { getContext, type BlockManagerContext } from "repository-codefirst";

/** Ce se incarca impreuna cu un abonament: planul (prin cheia straina plan_id) si asociatia. */
const cuPlanSiAsociatie = {
  plan: true,
  asociatie: { select: { id: true, denumire: true } },
} satisfies Prisma.AbonamentInclude;

export type AbonamentCuPlan = Prisma.AbonamentGetPayload<{ include: typeof cuPlanSiAsociatie }>;

/** Abonamentul cu datele din tabelele legate prin chei straine: asociatii, planuri si comenzi_simulate. */
const cuDetalii = {
  asociatie: { select: { id: true, denumire: true, adresa: true } },
  plan: { select: { id: true, cod: true, denumire: true, pretLunar: true, tokeniLunari: true } },
  comenzi: { orderBy: { id: "desc" }, take: 1 },
} satisfies Prisma.AbonamentInclude;

export type AbonamentCuDetalii = Prisma.AbonamentGetPayload<{ include: typeof cuDetalii }>;

export type AbonamentSuspendat = Prisma.AbonamentGetPayload<{
  include: typeof cuPlanSiAsociatie & { comenzi: true };
}>;

/**
 * Accessor pentru tabelul "abonamente" (doar acces la date; regulile de business sunt in proiectul Servicii),
 * preluat din NivelAccesDate_DBFirst (Laboratorul 3)
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

  /** Index: toate abonamentele, cu asociatia, planul si ultima comanda simulata (cele mai noi primele). */
  getToateCuDetalii(): Promise<AbonamentCuDetalii[]> {
    return this.db.abonament.findMany({ orderBy: { id: "desc" }, include: cuDetalii });
  }

  getDupaIdCuDetalii(id: number): Promise<AbonamentCuDetalii | null> {
    return this.db.abonament.findUnique({ where: { id }, include: cuDetalii });
  }

  /** Asociatiile fara abonament curent: doar ele pot primi un abonament nou (o asociatie are cel mult unul ACTIV sau SUSPENDAT). */
  getAsociatiiFaraAbonamentCurent(): Promise<Asociatie[]> {
    return this.db.asociatie.findMany({
      where: { abonamente: { none: { status: { in: [StatusAbonament.ACTIV, StatusAbonament.SUSPENDAT] } } } },
      orderBy: { denumire: "asc" },
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
