import { StatusAbonament, StatusComanda } from "librarie-modele";
import type { AbonamenteAccessor } from "nivel-acces-date";
import type { BlockManagerContext } from "repository-codefirst";
import { EroareBusiness } from "../infrastructura/EroareBusiness.ts";
import type { Logger } from "../infrastructura/Logger.ts";
import type { OptiuniAbonament, RezultatAlegerePlan } from "./ServiciuComenzi.ts";
import type { IServiciuAbonamente, IServiciuComenzi, IServiciuTokeni } from "../contracte.ts";

export type DateModificareAbonament = {
  reinnoireAutomata: boolean;
  planUrmatorId: number | null;
  sfarsitPerioada: Date;
};

const CURENTE: StatusAbonament[] = [StatusAbonament.ACTIV, StatusAbonament.SUSPENDAT];

/**
 * ServiciuAbonamente: administrarea abonamentelor (sectiunea de admin) si starea completa a unei asociatii
 * (sectiunea de utilizator): abonamentul curent, portofelul, comenzile in asteptare, jurnalul si facturile.
 */
export class ServiciuAbonamente implements IServiciuAbonamente {
  private readonly db: BlockManagerContext;
  private readonly accessor: AbonamenteAccessor;
  private readonly comenzi: IServiciuComenzi;
  private readonly tokeni: IServiciuTokeni;
  private readonly log: Logger;

  constructor(dep: {
    db: BlockManagerContext;
    abonamenteAccessor: AbonamenteAccessor;
    serviciuComenzi: IServiciuComenzi;
    serviciuTokeni: IServiciuTokeni;
    logger: Logger;
  }) {
    this.db = dep.db;
    this.accessor = dep.abonamenteAccessor;
    this.comenzi = dep.serviciuComenzi;
    this.tokeni = dep.serviciuTokeni;
    this.log = dep.logger.pentru("ServiciuAbonamente");
  }

  // ---- citire ----

  getToate() {
    return this.accessor.getToateCuDetalii();
  }

  getAsociatiiFaraAbonamentCurent() {
    return this.accessor.getAsociatiiFaraAbonamentCurent();
  }

  getAsociatii() {
    return this.db.asociatie.findMany({ orderBy: { denumire: "asc" }, select: { id: true, denumire: true, adresa: true } });
  }

  /** Details: abonamentul cu asociatia, planurile, toate comenzile (cu facturi) si jurnalul de tokeni al asociatiei. */
  async getDetalii(id: number) {
    const abonament = await this.db.abonament.findUnique({
      where: { id },
      include: {
        asociatie: true,
        plan: true,
        planUrmator: true,
        comenzi: { orderBy: { id: "desc" }, include: { factura: true } },
      },
    });
    if (!abonament) throw new EroareBusiness("NEGASIT", `Nu există niciun abonament cu id-ul ${id}.`);
    const [portofel, jurnal] = await Promise.all([this.tokeni.getPortofel(abonament.asociatieId), this.tokeni.getJurnal(abonament.asociatieId, 15)]);
    return { abonament, portofel, jurnal };
  }

  /** Tot ce afiseaza pagina utilizatorului pentru o asociatie. */
  async getStareAsociatie(asociatieId: number) {
    const asociatie = await this.db.asociatie.findUnique({ where: { id: asociatieId }, select: { id: true, denumire: true, adresa: true } });
    if (!asociatie) throw new EroareBusiness("NEGASIT", `Asociația ${asociatieId} nu există.`);
    const [abonament, portofel, comenziInAsteptare, jurnal, facturi] = await Promise.all([
      this.db.abonament.findFirst({ where: { asociatieId, status: { in: CURENTE } }, include: { plan: true, planUrmator: true } }),
      this.tokeni.getPortofel(asociatieId),
      this.comenzi.getInAsteptare(asociatieId),
      this.tokeni.getJurnal(asociatieId, 15),
      this.db.facturaSimulata.findMany({
        where: { comanda: { asociatieId } },
        orderBy: { numar: "desc" },
        take: 10,
        include: { comanda: { select: { referinta: true, tip: true, plan: { select: { denumire: true } }, pachet: { select: { denumire: true } } } } },
      }),
    ]);
    return { asociatie, abonament, portofel, comenziInAsteptare, jurnal, facturi };
  }

  // ---- scriere (admin) ----

  /** Create: abonament nou pentru o asociatie fara abonament curent (regulile sunt in ServiciuComenzi.alegePlan). */
  async creeaza(asociatieId: number, planId: number, optiuni: OptiuniAbonament): Promise<RezultatAlegerePlan> {
    const curent = await this.db.abonament.findFirst({ where: { asociatieId, status: { in: CURENTE } } });
    if (curent) throw new EroareBusiness("CONFLICT", "Asociația are deja un abonament activ sau suspendat.", "asociatieId");
    return this.comenzi.alegePlan(asociatieId, planId, optiuni);
  }

  /** Edit: reinnoirea automata, planul programat pentru perioada urmatoare si data de sfarsit a perioadei. */
  async modifica(id: number, date: DateModificareAbonament) {
    const { abonament } = await this.getDetalii(id);
    if (!CURENTE.includes(abonament.status)) throw new EroareBusiness("CONFLICT", "Doar un abonament activ sau suspendat poate fi modificat.");
    if (date.sfarsitPerioada <= abonament.inceputPerioada) {
      throw new EroareBusiness("DATE_INVALIDE", "Sfârșitul perioadei trebuie să fie după începutul ei.", "sfarsitPerioada");
    }
    if (date.planUrmatorId !== null) {
      if (date.planUrmatorId === abonament.planId) throw new EroareBusiness("DATE_INVALIDE", "Planul următor trebuie să fie diferit de cel curent.", "planUrmatorId");
      const plan = await this.db.plan.findUnique({ where: { id: date.planUrmatorId } });
      if (!plan || !plan.activ) throw new EroareBusiness("DATE_INVALIDE", "Alege un plan din listă.", "planUrmatorId");
    }
    const actualizat = await this.db.abonament.update({ where: { id }, data: date });
    this.log.info(`Abonament modificat`, { id, ...date, sfarsitPerioada: date.sfarsitPerioada.toISOString().slice(0, 10) });
    return actualizat;
  }

  /**
   * Delete logic: abonamentul devine ANULAT (ramane in istoric), comenzile lui neplatite se anuleaza,
   * iar tokenii de plan ramasi expira. Tokenii extra raman in portofel.
   */
  async anuleaza(id: number) {
    const { abonament } = await this.getDetalii(id);
    if (!CURENTE.includes(abonament.status)) throw new EroareBusiness("CONFLICT", "Abonamentul nu este activ sau suspendat.");
    await this.db.$transaction(async (tx) => {
      await tx.abonament.update({ where: { id }, data: { status: StatusAbonament.ANULAT, planUrmatorId: null } });
      await tx.comandaSimulata.updateMany({ where: { abonamentId: id, status: StatusComanda.IN_ASTEPTARE }, data: { status: StatusComanda.ANULATA } });
      const portofel = await tx.portofelTokeni.findUnique({ where: { asociatieId: abonament.asociatieId } });
      if (portofel) await this.tokeni.expiraTokeniPlan(tx, portofel, `Anulare abonament ${abonament.plan.denumire}`);
    });
    this.log.info(`Abonament anulat (ștergere logică)`, { id, asociatie: abonament.asociatie.denumire });
  }
}
