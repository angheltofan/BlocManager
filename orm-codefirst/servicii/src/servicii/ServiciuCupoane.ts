import type { CuponReducere, Plan } from "librarie-modele";
import { CodCuponDuplicat, type CupoaneAccessor, type CuponCuPlan, type DateCupon } from "nivel-acces-date";
import { EroareBusiness } from "../infrastructura/EroareBusiness.ts";
import type { Logger } from "../infrastructura/Logger.ts";
import { ziCurenta, type Tx } from "./utilitare.ts";

/**
 * ServiciuCupoane: administrarea cupoanelor (CRUD, cu stergere logica) si regula de valabilitate
 * a unui cupon la emiterea unei comenzi de abonament.
 */
export class ServiciuCupoane {
  private readonly cupoane: CupoaneAccessor;
  private readonly log: Logger;

  constructor(dep: { cupoaneAccessor: CupoaneAccessor; logger: Logger }) {
    this.cupoane = dep.cupoaneAccessor;
    this.log = dep.logger.pentru("ServiciuCupoane");
  }

  getToate(inclusivSterse = false): Promise<CuponCuPlan[]> {
    return this.cupoane.getToate(inclusivSterse);
  }

  async getDupaId(id: number): Promise<CuponCuPlan> {
    const cupon = await this.cupoane.getDupaId(id);
    if (!cupon) throw new EroareBusiness("NEGASIT", `Nu există niciun cupon cu id-ul ${id}.`);
    return cupon;
  }

  async adauga(date: DateCupon): Promise<CuponReducere> {
    try {
      const cupon = await this.cupoane.adauga(date);
      this.log.info(`Cupon adăugat: ${cupon.cod}`, { id: cupon.id, procent: cupon.procentReducere.toString() });
      return cupon;
    } catch (e) {
      throw this.traduce(e);
    }
  }

  async modifica(id: number, date: DateCupon): Promise<CuponReducere> {
    const existent = await this.getDupaId(id);
    if (existent.stersLa) throw new EroareBusiness("CONFLICT", "Cuponul este șters. Restaurează-l înainte să îl modifici.");
    if (date.utilizariMaxime < existent.utilizari) {
      throw new EroareBusiness("DATE_INVALIDE", `Cuponul a fost folosit deja de ${existent.utilizari} ori; maximul nu poate fi mai mic.`, "utilizariMaxime");
    }
    try {
      const cupon = await this.cupoane.modifica(id, date);
      this.log.info(`Cupon modificat: ${cupon.cod}`, { id });
      return cupon;
    } catch (e) {
      throw this.traduce(e);
    }
  }

  /** Stergere logica: cuponul nu mai apare in liste si nu mai poate fi folosit, dar istoricul ramane. */
  async sterge(id: number): Promise<void> {
    const cupon = await this.getDupaId(id);
    if (cupon.stersLa) return;
    await this.cupoane.stergeLogic(id);
    this.log.info(`Cupon șters logic: ${cupon.cod}`, { id });
  }

  async restaureaza(id: number): Promise<void> {
    const cupon = await this.getDupaId(id);
    await this.cupoane.restaureaza(id);
    this.log.info(`Cupon restaurat: ${cupon.cod}`, { id });
  }

  /**
   * Regula de business: un cupon poate fi folosit la o comanda de abonament doar daca exista, nu e sters,
   * e activ, nu a expirat, mai are utilizari si e valabil pentru planul ales. Planul gratuit nu are ce reduce.
   */
  async valideazaPentruPlan(tx: Tx, cod: string, plan: Plan): Promise<CuponReducere> {
    if (plan.pretLunar.isZero()) throw new EroareBusiness("DATE_INVALIDE", "Planul Free nu are preț de redus: lasă codul gol.", "codCupon");
    const cupon = await tx.cuponReducere.findUnique({ where: { cod: cod.trim().toUpperCase() } });
    const motiv = !cupon || cupon.stersLa
      ? "Codul nu există."
      : !cupon.activ
        ? "Cuponul nu este activ."
        : cupon.valabilPana < ziCurenta()
          ? "Cuponul a expirat."
          : cupon.utilizari >= cupon.utilizariMaxime
            ? "Cuponul a fost folosit de numărul maxim de ori."
            : cupon.planId !== null && cupon.planId !== plan.id
              ? "Cuponul nu este valabil pentru acest plan."
              : null;
    if (motiv || !cupon) throw new EroareBusiness("DATE_INVALIDE", motiv ?? "Codul nu există.", "codCupon");
    return cupon;
  }

  /** Numara o utilizare, cu o actualizare conditionata: doua comenzi simultane nu pot depasi maximul. */
  async folosesteCupon(tx: Tx, cuponId: number): Promise<void> {
    const actualizate = await tx.$executeRaw`UPDATE "cupoane_reducere" SET "utilizari" = "utilizari" + 1
      WHERE "id" = ${cuponId} AND "utilizari" < "utilizari_maxime" AND "sters_la" IS NULL`;
    if (actualizate !== 1) throw new EroareBusiness("CONFLICT", "Cuponul a fost folosit de numărul maxim de ori.", "codCupon");
  }

  private traduce(e: unknown): unknown {
    return e instanceof CodCuponDuplicat ? new EroareBusiness("CONFLICT", `Există deja un cupon cu codul ${e.cod}.`, "cod") : e;
  }
}
