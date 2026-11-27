import { StatusAbonament, StatusComanda, TipComanda, type Abonament, type ComandaSimulata, type Plan } from "librarie-modele";
import type { BlockManagerContext } from "repository-codefirst";
import { EroareBusiness } from "../infrastructura/EroareBusiness.ts";
import type { Logger } from "../infrastructura/Logger.ts";
import { cuReducere, plusOLuna, urmatorulNumar, ziCurenta, type Tx } from "./utilitare.ts";
import type { IServiciuComenzi, IServiciuCupoane, IServiciuTokeni } from "../contracte.ts";

export type OptiuniAbonament = {
  codCupon?: string | null;
  inceputPerioada?: Date; // implicit azi (doar pentru un abonament nou)
  reinnoireAutomata?: boolean; // implicit true (doar pentru un abonament nou)
};

/** Ce s-a intamplat la alegerea unui plan, ca interfata sa poata explica utilizatorului. */
export type RezultatAlegerePlan =
  | { tip: "ACTIV"; abonament: Abonament; mesaj: string }
  | { tip: "COMANDA"; abonament: Abonament; comanda: ComandaSimulata; mesaj: string }
  | { tip: "DOWNGRADE_PROGRAMAT"; abonament: Abonament; mesaj: string };

const lei = (v: { toFixed(n: number): string }) => v.toFixed(2).replace(".", ",");

/**
 * ServiciuComenzi: alegerea unui plan (abonament nou, upgrade, downgrade), cumpararea pachetelor de tokeni
 * si anularea comenzilor. Plata propriu-zisa este in ServiciuPlati.
 */
export class ServiciuComenzi implements IServiciuComenzi {
  private readonly db: BlockManagerContext;
  private readonly cupoane: IServiciuCupoane;
  private readonly tokeni: IServiciuTokeni;
  private readonly log: Logger;

  constructor(dep: { db: BlockManagerContext; serviciuCupoane: IServiciuCupoane; serviciuTokeni: IServiciuTokeni; logger: Logger }) {
    this.db = dep.db;
    this.cupoane = dep.serviciuCupoane;
    this.tokeni = dep.serviciuTokeni;
    this.log = dep.logger.pentru("ServiciuComenzi");
  }

  getInAsteptare(asociatieId: number) {
    return this.db.comandaSimulata.findMany({
      where: { asociatieId, status: StatusComanda.IN_ASTEPTARE },
      orderBy: { id: "desc" },
      include: { plan: true, pachet: true },
    });
  }

  /**
   * Asociatia alege un plan. Regulile:
   * - fara abonament curent: Free porneste ACTIV (cu 50 de tokeni); Pro/Max pornesc SUSPENDAT, cu o comanda de plata;
   * - cu abonament curent, plan mai scump (upgrade): comanda cu pretul noului plan; schimbarea se face la plata;
   * - cu abonament ACTIV, plan mai ieftin (downgrade): se programeaza la finalul perioadei, fara plata;
   * - cu abonament SUSPENDAT si alegerea planului Free: comenzile neplatite se anuleaza si porneste Free;
   * - un abonament are cel mult o comanda in asteptare.
   * Cuponul (optional) reduce suma comenzii si se considera folosit.
   */
  async alegePlan(asociatieId: number, planId: number, optiuni: OptiuniAbonament = {}): Promise<RezultatAlegerePlan> {
    const rezultat = await this.db.$transaction(async (tx): Promise<RezultatAlegerePlan> => {
      const asociatie = await tx.asociatie.findUnique({ where: { id: asociatieId } });
      if (!asociatie) throw new EroareBusiness("NEGASIT", "Asociația nu există.", "asociatieId");
      const plan = await tx.plan.findUnique({ where: { id: planId } });
      if (!plan || !plan.activ) throw new EroareBusiness("DATE_INVALIDE", "Alege un plan din listă.", "planId");
      if (optiuni.codCupon && plan.pretLunar.isZero()) {
        throw new EroareBusiness("DATE_INVALIDE", "Planul Free nu are preț de redus: lasă codul gol.", "codCupon");
      }

      const curent = await tx.abonament.findFirst({
        where: { asociatieId, status: { in: [StatusAbonament.ACTIV, StatusAbonament.SUSPENDAT] } },
        include: { plan: true },
      });

      // 1. Abonament nou
      if (!curent) {
        const inceput = optiuni.inceputPerioada ?? ziCurenta();
        const gratuit = plan.pretLunar.isZero();
        const abonament = await tx.abonament.create({
          data: {
            asociatieId,
            planId: plan.id,
            inceputPerioada: inceput,
            sfarsitPerioada: plusOLuna(inceput),
            status: gratuit ? StatusAbonament.ACTIV : StatusAbonament.SUSPENDAT,
            reinnoireAutomata: optiuni.reinnoireAutomata ?? true,
          },
        });
        const portofel = await this.tokeni.asiguraPortofel(tx, asociatieId);
        if (gratuit) {
          await this.tokeni.alocaTokeniPlan(tx, portofel, plan.tokeniLunari, `Alocare plan ${plan.denumire}`);
          return { tip: "ACTIV", abonament, mesaj: `Planul ${plan.denumire} este activ: ${plan.tokeniLunari} tokeni pe lună.` };
        }
        const comanda = await this.emiteComandaAbonament(tx, asociatieId, abonament.id, plan, optiuni.codCupon);
        return {
          tip: "COMANDA",
          abonament,
          comanda,
          mesaj: `Abonamentul ${plan.denumire} a fost creat și rămâne suspendat până la plata comenzii ${comanda.referinta} (${lei(comanda.suma)} lei).`,
        };
      }

      // 2. Exista deja un abonament curent
      const inAsteptare = await tx.comandaSimulata.findFirst({ where: { abonamentId: curent.id, status: StatusComanda.IN_ASTEPTARE } });
      if (curent.planId === plan.id) {
        if (inAsteptare) throw new EroareBusiness("CONFLICT", `Planul ${plan.denumire} așteaptă plata comenzii ${inAsteptare.referinta}.`, "planId");
        if (curent.status === StatusAbonament.ACTIV) throw new EroareBusiness("CONFLICT", `Planul ${plan.denumire} este deja activ.`, "planId");
        // abonament suspendat fara comanda de platit (de exemplu, comanda a fost anulata): se emite o comanda noua,
        // altfel asociatia ar ramane blocata; dupa plata, abonamentul redevine ACTIV cu o perioada noua
        const comanda = await this.emiteComandaAbonament(tx, asociatieId, curent.id, plan, optiuni.codCupon);
        return {
          tip: "COMANDA",
          abonament: curent,
          comanda,
          mesaj: `Comanda ${comanda.referinta} (${lei(comanda.suma)} lei) a fost emisă. După plată, planul ${plan.denumire} redevine activ.`,
        };
      }

      if (curent.status === StatusAbonament.SUSPENDAT && plan.pretLunar.isZero()) {
        // renunta la planul platit si trece pe Free imediat
        await tx.comandaSimulata.updateMany({ where: { abonamentId: curent.id, status: StatusComanda.IN_ASTEPTARE }, data: { status: StatusComanda.ANULATA } });
        await tx.abonament.update({ where: { id: curent.id }, data: { status: StatusAbonament.ANULAT } });
        const inceput = ziCurenta();
        const abonament = await tx.abonament.create({
          data: { asociatieId, planId: plan.id, inceputPerioada: inceput, sfarsitPerioada: plusOLuna(inceput), status: StatusAbonament.ACTIV, reinnoireAutomata: curent.reinnoireAutomata },
        });
        const portofel = await this.tokeni.asiguraPortofel(tx, asociatieId);
        await this.tokeni.alocaTokeniPlan(tx, portofel, plan.tokeniLunari, `Alocare plan ${plan.denumire}`);
        return { tip: "ACTIV", abonament, mesaj: `Ai trecut pe planul ${plan.denumire}; comanda neplătită a fost anulată.` };
      }

      if (inAsteptare) {
        throw new EroareBusiness("CONFLICT", `Există deja comanda ${inAsteptare.referinta} în așteptarea plății. Plătește-o sau anuleaz-o înainte să alegi alt plan.`, "planId");
      }

      if (curent.status === StatusAbonament.ACTIV && plan.pretLunar.lt(curent.plan.pretLunar)) {
        const abonament = await tx.abonament.update({ where: { id: curent.id }, data: { planUrmatorId: plan.id } });
        const data = curent.sfarsitPerioada.toISOString().slice(0, 10).split("-").reverse().join(".");
        return { tip: "DOWNGRADE_PROGRAMAT", abonament, mesaj: `Trecerea pe planul ${plan.denumire} a fost programată pentru ${data}, la finalul perioadei plătite.` };
      }

      // upgrade (sau alt plan platit, pentru un abonament suspendat)
      const comanda = await this.emiteComandaAbonament(tx, asociatieId, curent.id, plan, optiuni.codCupon);
      return {
        tip: "COMANDA",
        abonament: curent,
        comanda,
        mesaj: `Comanda ${comanda.referinta} (${lei(comanda.suma)} lei) a fost emisă. După plată, abonamentul trece pe planul ${plan.denumire}.`,
      };
    });

    this.log.info(`Plan ales: ${rezultat.tip}`, { asociatieId, planId, comanda: "comanda" in rezultat ? rezultat.comanda.referinta : null });
    return rezultat;
  }

  /** Cumpararea unui pachet de tokeni extra: comanda simulata, platita apoi prin ServiciuPlati. */
  async comandaPachet(asociatieId: number, pachetId: number): Promise<ComandaSimulata> {
    const comanda = await this.db.$transaction(async (tx) => {
      const abonament = await tx.abonament.findFirst({ where: { asociatieId, status: StatusAbonament.ACTIV } });
      if (!abonament) throw new EroareBusiness("ABONAMENT_INACTIV", "Pachetele de tokeni se pot cumpăra doar cu un abonament activ.");
      const pachet = await tx.pachetTokeni.findUnique({ where: { id: pachetId } });
      if (!pachet || !pachet.activ || pachet.stersLa) throw new EroareBusiness("DATE_INVALIDE", "Pachetul nu mai este oferit. Alege un pachet din listă.", "pachetId");
      return tx.comandaSimulata.create({
        data: { asociatieId, tip: TipComanda.PACHET, pachetId: pachet.id, suma: pachet.pret, status: StatusComanda.IN_ASTEPTARE, referinta: await urmatorulNumar(tx, "SIM") },
      });
    });
    this.log.info(`Comandă pachet emisă: ${comanda.referinta}`, { asociatieId, pachetId, suma: comanda.suma.toString() });
    return comanda;
  }

  async anuleaza(comandaId: number): Promise<ComandaSimulata> {
    const actualizate = await this.db.comandaSimulata.updateMany({ where: { id: comandaId, status: StatusComanda.IN_ASTEPTARE }, data: { status: StatusComanda.ANULATA } });
    const comanda = await this.db.comandaSimulata.findUnique({ where: { id: comandaId } });
    if (!comanda) throw new EroareBusiness("NEGASIT", `Comanda ${comandaId} nu există.`);
    if (actualizate.count === 0) throw new EroareBusiness("CONFLICT", `Comanda ${comanda.referinta} nu mai este în așteptare.`);
    this.log.info(`Comandă anulată: ${comanda.referinta}`, { comandaId });
    return comanda;
  }

  /** Comanda de plata pentru un abonament, cu pretul planului redus de cupon (daca e valabil). */
  async emiteComandaAbonament(tx: Tx, asociatieId: number, abonamentId: number, plan: Plan, codCupon?: string | null): Promise<ComandaSimulata> {
    let suma = plan.pretLunar;
    if (codCupon) {
      const cupon = await this.cupoane.valideazaPentruPlan(tx, codCupon, plan);
      suma = cuReducere(plan.pretLunar, cupon.procentReducere);
      await this.cupoane.folosesteCupon(tx, cupon.id);
    }
    return tx.comandaSimulata.create({
      data: { asociatieId, abonamentId, tip: TipComanda.ABONAMENT, planId: plan.id, suma, status: StatusComanda.IN_ASTEPTARE, referinta: await urmatorulNumar(tx, "SIM") },
    });
  }
}
