import { Prisma, StatusAbonament, StatusComanda, TipComanda, type Asociatie } from "librarie-modele";
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
  comenzi: { orderBy: { createdAt: "desc" }, take: 1 },
} satisfies Prisma.AbonamentInclude;

export type AbonamentCuDetalii = Prisma.AbonamentGetPayload<{ include: typeof cuDetalii }>;

/** Datele trimise din formularul Create. */
export type DateAbonamentNou = {
  asociatieId: number;
  planId: number;
  inceputPerioada: Date;
  reinnoireAutomata: boolean;
  codCupon: string | null;
};

/** Eroare de business la crearea unui abonament, legata de un camp din formular. */
export class EroareAbonament extends Error {
  constructor(
    readonly camp: "asociatieId" | "planId" | "codCupon",
    mesaj: string,
  ) {
    super(mesaj);
  }
}

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

  /** Index: toate abonamentele, cu asociatia, planul si ultima comanda simulata (cele mai noi primele). */
  getToateCuDetalii(): Promise<AbonamentCuDetalii[]> {
    return this.db.abonament.findMany({ orderBy: [{ createdAt: "desc" }, { id: "desc" }], include: cuDetalii });
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

  /**
   * Create: un abonament nou, pentru o luna, intr-o singura tranzactie.
   * - Planul gratuit (pret 0) porneste direct ACTIV.
   * - Un plan platit porneste SUSPENDAT si primeste o comanda simulata IN_ASTEPTARE (referinta SIM-AAAA-NNNNNN),
   *   cu pretul planului redus de cuponul introdus, daca acesta este valabil; cuponul se considera folosit.
   */
  async creeaza(date: DateAbonamentNou) {
    return this.db.$transaction(async (tx) => {
      const curent = await tx.abonament.findFirst({
        where: { asociatieId: date.asociatieId, status: { in: [StatusAbonament.ACTIV, StatusAbonament.SUSPENDAT] } },
      });
      if (curent) throw new EroareAbonament("asociatieId", "Asociația are deja un abonament activ sau suspendat.");
      const asociatie = await tx.asociatie.findUnique({ where: { id: date.asociatieId } });
      if (!asociatie) throw new EroareAbonament("asociatieId", "Alege o asociație din listă.");

      const plan = await tx.plan.findUnique({ where: { id: date.planId } });
      if (!plan || !plan.activ) throw new EroareAbonament("planId", "Alege un plan din listă.");
      const gratuit = plan.pretLunar.isZero();

      let suma = plan.pretLunar;
      let cuponId: number | null = null;
      if (date.codCupon) {
        if (gratuit) throw new EroareAbonament("codCupon", "Planul Free nu are preț de redus: lasă codul gol.");
        const cupon = await tx.cuponReducere.findUnique({ where: { cod: date.codCupon } });
        const azi = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
        const motiv = !cupon
          ? "Codul nu există."
          : !cupon.activ
            ? "Cuponul nu este activ."
            : cupon.valabilPana < azi
              ? "Cuponul a expirat."
              : cupon.utilizari >= cupon.utilizariMaxime
                ? "Cuponul a fost folosit de numărul maxim de ori."
                : cupon.planId !== null && cupon.planId !== plan.id
                  ? "Cuponul nu este valabil pentru acest plan."
                  : null;
        if (motiv || !cupon) throw new EroareAbonament("codCupon", motiv ?? "Codul nu există.");
        const factor = new Prisma.Decimal(100).sub(cupon.procentReducere).div(100);
        suma = plan.pretLunar.mul(factor).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
        cuponId = cupon.id;
      }

      const sfarsit = new Date(date.inceputPerioada);
      sfarsit.setUTCMonth(sfarsit.getUTCMonth() + 1);
      const abonament = await tx.abonament.create({
        data: {
          asociatieId: asociatie.id,
          planId: plan.id,
          inceputPerioada: date.inceputPerioada,
          sfarsitPerioada: sfarsit,
          status: gratuit ? StatusAbonament.ACTIV : StatusAbonament.SUSPENDAT,
          reinnoireAutomata: date.reinnoireAutomata,
        },
      });
      if (gratuit) return { abonament, comanda: null };

      if (cuponId !== null) {
        // actualizare conditionata: doua comenzi simultane nu pot depasi numarul maxim de utilizari
        const folosit = await tx.$executeRaw`UPDATE "cupoane_reducere" SET "utilizari" = "utilizari" + 1
          WHERE "id" = ${cuponId} AND "utilizari" < "utilizari_maxime"`;
        if (folosit !== 1) throw new EroareAbonament("codCupon", "Cuponul a fost folosit de numărul maxim de ori.");
      }
      const comanda = await tx.comandaSimulata.create({
        data: {
          asociatieId: asociatie.id,
          abonamentId: abonament.id,
          tip: TipComanda.ABONAMENT,
          planId: plan.id,
          suma,
          status: StatusComanda.IN_ASTEPTARE,
          referinta: await this.urmatoareaReferinta(tx),
        },
      });
      return { abonament, comanda };
    });
  }

  /** Referinta fictiva a urmatoarei comenzi simulate: SIM-AAAA-NNNNNN. */
  private async urmatoareaReferinta(tx: Prisma.TransactionClient): Promise<string> {
    const prefix = `SIM-${new Date().getFullYear()}-`;
    const ultima = await tx.comandaSimulata.findFirst({
      where: { referinta: { startsWith: prefix } },
      orderBy: { referinta: "desc" },
      select: { referinta: true },
    });
    const numar = ultima ? Number(ultima.referinta.slice(prefix.length)) + 1 : 1;
    return prefix + String(numar).padStart(6, "0");
  }

  /** Cate abonamente sunt in fiecare stare (ACTIV, SUSPENDAT, ANULAT, EXPIRAT). */
  async getNumarPeStatus(): Promise<Record<StatusAbonament, number>> {
    const grupuri = await this.db.abonament.groupBy({ by: ["status"], _count: { _all: true } });
    const rezultat = { ACTIV: 0, SUSPENDAT: 0, ANULAT: 0, EXPIRAT: 0 } as Record<StatusAbonament, number>;
    for (const g of grupuri) rezultat[g.status] = g._count._all;
    return rezultat;
  }
}
