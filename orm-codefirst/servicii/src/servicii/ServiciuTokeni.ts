import { CodActiune, StatusAbonament, TipTranzactie, type PortofelTokeni, type TranzactieTokeni } from "librarie-modele";
import type { BlockManagerContext } from "repository-codefirst";
import { EroareBusiness } from "../infrastructura/EroareBusiness.ts";
import type { Logger } from "../infrastructura/Logger.ts";
import type { ServiciuPlanuri } from "./ServiciuPlanuri.ts";
import type { Tx } from "./utilitare.ts";

export type RezultatDebitare = {
  actiune: string;
  cost: number;
  tokeniPlan: number;
  tokeniExtra: number;
  sold: number;
};

/**
 * ServiciuTokeni: portofelul de tokeni al unei asociatii si jurnalul lui.
 *
 * Regula de baza: orice schimbare a soldului scrie un rand in tranzactii_tokeni, in aceeasi tranzactie,
 * astfel incat soldul din portofel = ultimul sold_dupa = suma cantitatilor din jurnal.
 */
export class ServiciuTokeni {
  private readonly db: BlockManagerContext;
  private readonly planuri: ServiciuPlanuri;
  private readonly log: Logger;

  constructor(dep: { db: BlockManagerContext; serviciuPlanuri: ServiciuPlanuri; logger: Logger }) {
    this.db = dep.db;
    this.planuri = dep.serviciuPlanuri;
    this.log = dep.logger.pentru("ServiciuTokeni");
  }

  getPortofel(asociatieId: number): Promise<PortofelTokeni | null> {
    return this.db.portofelTokeni.findUnique({ where: { asociatieId } });
  }

  async getJurnal(asociatieId: number, numar = 20): Promise<(TranzactieTokeni & { actiune: { denumire: string } | null })[]> {
    const portofel = await this.getPortofel(asociatieId);
    if (!portofel) return [];
    return this.db.tranzactieTokeni.findMany({
      where: { portofelId: portofel.id },
      orderBy: { id: "desc" }, // ordinea reala a operatiilor
      take: numar,
      include: { actiune: { select: { denumire: true } } },
    });
  }

  /**
   * Debiteaza costul unei actiuni taxate (regula 7), intr-o singura tranzactie:
   * abonamentul trebuie sa fie ACTIV; raportul anual cere un plan cu raport; soldul trebuie sa ajunga.
   * Se consuma intai tokenii planului, apoi cei extra, cu o actualizare conditionata (doua cereri simultane
   * nu pot consuma acelasi sold).
   */
  async debiteaza(asociatieId: number, codActiune: string): Promise<RezultatDebitare> {
    const actiune = (await this.planuri.getActiuni()).find((a) => a.cod === codActiune.toUpperCase());
    if (!actiune) throw new EroareBusiness("NEGASIT", `Acțiunea ${codActiune} nu există.`);

    const rezultat = await this.db.$transaction(async (tx) => {
      const abonament = await tx.abonament.findFirst({
        where: { asociatieId, status: { in: [StatusAbonament.ACTIV, StatusAbonament.SUSPENDAT] } },
        include: { plan: true },
      });
      if (!abonament) throw new EroareBusiness("ABONAMENT_INACTIV", "Asociația nu are niciun abonament. Alege un plan.");
      if (abonament.status === StatusAbonament.SUSPENDAT) {
        throw new EroareBusiness("ABONAMENT_INACTIV", `Abonamentul ${abonament.plan.denumire} este suspendat până la plată. Plătește comanda ca să poți folosi acțiunile.`);
      }
      if (actiune.cod === CodActiune.RAPORT && !abonament.plan.raportAnual) {
        throw new EroareBusiness("PLAN_NEPERMIS", `Raportul anual nu este inclus în planul ${abonament.plan.denumire}. Trece la Pro sau Max.`);
      }

      const portofel = await tx.portofelTokeni.findUnique({ where: { asociatieId } });
      if (!portofel) throw new EroareBusiness("SOLD_INSUFICIENT", "Asociația nu are portofel de tokeni.");
      const cost = actiune.costTokeni;
      const actualizate = await tx.$queryRaw<{ tokeni_plan: number; tokeni_extra: number }[]>`
        UPDATE "portofele_tokeni"
        SET "tokeni_plan" = "tokeni_plan" - LEAST("tokeni_plan", ${cost}),
            "tokeni_extra" = "tokeni_extra" - (${cost} - LEAST("tokeni_plan", ${cost})),
            "updated_at" = NOW()
        WHERE "id" = ${portofel.id} AND "tokeni_plan" + "tokeni_extra" >= ${cost}
        RETURNING "tokeni_plan", "tokeni_extra"`;
      if (actualizate.length === 0) {
        const sold = portofel.tokeniPlan + portofel.tokeniExtra;
        throw new EroareBusiness(
          "SOLD_INSUFICIENT",
          `Sold insuficient: ${actiune.denumire} costă ${cost} tokeni, iar soldul este ${sold}. Cumpără un pachet de tokeni sau treci la un plan superior.`,
          undefined,
          { cost, sold },
        );
      }
      const { tokeni_plan: tokeniPlan, tokeni_extra: tokeniExtra } = actualizate[0];
      await tx.tranzactieTokeni.create({
        data: { portofelId: portofel.id, tip: TipTranzactie.CONSUM, cantitate: -cost, soldDupa: tokeniPlan + tokeniExtra, actiuneId: actiune.id, descriere: actiune.denumire },
      });
      return { actiune: actiune.denumire, cost, tokeniPlan, tokeniExtra, sold: tokeniPlan + tokeniExtra };
    });

    this.log.info(`Tokeni debitați: ${rezultat.actiune}`, { asociatieId, cost: rezultat.cost, sold: rezultat.sold });
    return rezultat;
  }

  // ---- operatii folosite de celelalte servicii, in tranzactia lor ----

  /** Portofelul asociatiei; il creeaza (gol) daca nu exista. */
  async asiguraPortofel(tx: Tx, asociatieId: number): Promise<PortofelTokeni> {
    return tx.portofelTokeni.upsert({ where: { asociatieId }, update: {}, create: { asociatieId } });
  }

  /** Tokenii de plan ramasi expira (EXPIRARE); tokenii extra raman. */
  async expiraTokeniPlan(tx: Tx, portofel: PortofelTokeni, descriere: string): Promise<PortofelTokeni> {
    if (portofel.tokeniPlan === 0) return portofel;
    const actualizat = await tx.portofelTokeni.update({ where: { id: portofel.id }, data: { tokeniPlan: 0 } });
    await tx.tranzactieTokeni.create({
      data: { portofelId: portofel.id, tip: TipTranzactie.EXPIRARE, cantitate: -portofel.tokeniPlan, soldDupa: actualizat.tokeniExtra, descriere },
    });
    return actualizat;
  }

  /** Aloca tokenii lunari ai planului (ALOCARE), dupa expirarea celor ramasi. */
  async alocaTokeniPlan(tx: Tx, portofel: PortofelTokeni, tokeni: number, descriere: string, comandaId?: number): Promise<PortofelTokeni> {
    const dupaExpirare = await this.expiraTokeniPlan(tx, portofel, "Expirare tokeni plan la începutul perioadei noi");
    const actualizat = await tx.portofelTokeni.update({ where: { id: portofel.id }, data: { tokeniPlan: tokeni, ultimaResetare: new Date() } });
    await tx.tranzactieTokeni.create({
      data: { portofelId: portofel.id, tip: TipTranzactie.ALOCARE, cantitate: tokeni, soldDupa: dupaExpirare.tokeniExtra + tokeni, comandaId, descriere },
    });
    return actualizat;
  }

  /** Adauga tokeni extra dintr-un pachet cumparat (CUMPARARE); nu expira. */
  async adaugaTokeniExtra(tx: Tx, portofel: PortofelTokeni, tokeni: number, descriere: string, comandaId: number): Promise<PortofelTokeni> {
    const actualizat = await tx.portofelTokeni.update({ where: { id: portofel.id }, data: { tokeniExtra: { increment: tokeni } } });
    await tx.tranzactieTokeni.create({
      data: { portofelId: portofel.id, tip: TipTranzactie.CUMPARARE, cantitate: tokeni, soldDupa: actualizat.tokeniPlan + actualizat.tokeniExtra, comandaId, descriere },
    });
    return actualizat;
  }
}
