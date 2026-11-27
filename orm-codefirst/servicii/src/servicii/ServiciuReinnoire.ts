import { StatusAbonament, StatusComanda } from "librarie-modele";
import type { BlockManagerContext } from "repository-codefirst";
import type { Logger } from "../infrastructura/Logger.ts";
import type { MagistralaEvenimente } from "../infrastructura/MagistralaEvenimente.ts";
import { plusOLuna, ziCurenta } from "./utilitare.ts";
import type { IServiciuComenzi, IServiciuReinnoire, IServiciuTokeni } from "../contracte.ts";

export type RezultatReinnoire = { abonamentId: number; asociatie: string; plan: string; actiune: string }[];

/**
 * ServiciuReinnoire: jobul zilnic care inchide perioadele terminate (regulile 3, 4 si 11).
 * Pentru fiecare abonament ACTIV cu perioada terminata:
 * - fara reinnoire automata: abonamentul expira, tokenii de plan expira;
 * - planul (sau planul programat prin downgrade) este gratuit: perioada noua, tokenii se realoca;
 * - planul este platit: tokenii de plan expira, se emite comanda pentru luna urmatoare, abonamentul devine SUSPENDAT.
 * Se ruleaza din sectiunea de admin ("Rulează jobul zilnic") sau periodic, daca este setat JOB_INTERVAL_MINUTE.
 */
export class ServiciuReinnoire implements IServiciuReinnoire {
  private readonly db: BlockManagerContext;
  private readonly tokeni: IServiciuTokeni;
  private readonly comenzi: IServiciuComenzi;
  private readonly evenimente: MagistralaEvenimente;
  private readonly log: Logger;

  constructor(dep: { db: BlockManagerContext; serviciuTokeni: IServiciuTokeni; serviciuComenzi: IServiciuComenzi; magistralaEvenimente: MagistralaEvenimente; logger: Logger }) {
    this.db = dep.db;
    this.tokeni = dep.serviciuTokeni;
    this.comenzi = dep.serviciuComenzi;
    this.evenimente = dep.magistralaEvenimente;
    this.log = dep.logger.pentru("ServiciuReinnoire");
  }

  async ruleaza(moment = new Date()): Promise<RezultatReinnoire> {
    const azi = ziCurenta(moment);
    const terminate = await this.db.abonament.findMany({
      where: { status: StatusAbonament.ACTIV, sfarsitPerioada: { lte: azi } },
      include: { plan: true, planUrmator: true, asociatie: true },
      orderBy: { sfarsitPerioada: "asc" },
    });
    const rezultat: RezultatReinnoire = [];

    for (const ab of terminate) {
      const planNou = ab.planUrmator ?? ab.plan;
      const actiune = await this.db.$transaction(async (tx) => {
        const portofel = await this.tokeni.asiguraPortofel(tx, ab.asociatieId);
        if (!ab.reinnoireAutomata) {
          await tx.abonament.update({ where: { id: ab.id }, data: { status: StatusAbonament.EXPIRAT } });
          await this.tokeni.expiraTokeniPlan(tx, portofel, `Expirare abonament ${ab.plan.denumire}`);
          return { text: "expirat (fără reînnoire automată)" };
        }
        const inceput = ab.sfarsitPerioada;
        if (planNou.pretLunar.isZero()) {
          await tx.abonament.update({ where: { id: ab.id }, data: { planId: planNou.id, planUrmatorId: null, inceputPerioada: inceput, sfarsitPerioada: plusOLuna(inceput) } });
          await this.tokeni.alocaTokeniPlan(tx, portofel, planNou.tokeniLunari, `Reînnoire plan ${planNou.denumire}`);
          return { text: `reînnoit gratuit (${planNou.tokeniLunari} tokeni)` };
        }
        await this.tokeni.expiraTokeniPlan(tx, portofel, `Sfârșitul perioadei ${ab.plan.denumire}`);
        await tx.abonament.update({ where: { id: ab.id }, data: { planId: planNou.id, planUrmatorId: null, status: StatusAbonament.SUSPENDAT } });
        const existenta = await tx.comandaSimulata.findFirst({ where: { abonamentId: ab.id, status: StatusComanda.IN_ASTEPTARE } });
        const comanda = existenta ?? (await this.comenzi.emiteComandaAbonament(tx, ab.asociatieId, ab.id, planNou, null));
        return { text: `suspendat până la plata comenzii ${comanda.referinta}`, comanda: comanda.referinta };
      });
      if (actiune.comanda) {
        this.evenimente.publica("AbonamentSuspendat", { abonamentId: ab.id, asociatieId: ab.asociatieId, plan: planNou.denumire, comandaReferinta: actiune.comanda });
      }
      rezultat.push({ abonamentId: ab.id, asociatie: ab.asociatie.denumire, plan: planNou.denumire, actiune: actiune.text });
    }

    this.log.info(`Job zilnic rulat`, { ziua: azi.toISOString().slice(0, 10), procesate: rezultat.length });
    return rezultat;
  }
}
