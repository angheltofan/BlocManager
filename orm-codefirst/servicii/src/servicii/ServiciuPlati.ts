import { StatusAbonament, StatusComanda, TipComanda } from "librarie-modele";
import type { BlockManagerContext } from "repository-codefirst";
import { EroareBusiness } from "../infrastructura/EroareBusiness.ts";
import type { Logger } from "../infrastructura/Logger.ts";
import type { Evenimente, MagistralaEvenimente } from "../infrastructura/MagistralaEvenimente.ts";
import { plusOLuna, ziCurenta } from "./utilitare.ts";
import type { IServiciuPlati, IServiciuTokeni } from "../contracte.ts";

/**
 * ServiciuPlati: plata simulata a unei comenzi (nu exista procesator de plati; butonul "Plateste" o marcheaza achitata).
 *
 * Totul se face intr-o singura tranzactie:
 * - comanda devine ACHITATA (actualizare conditionata: o comanda nu poate fi platita de doua ori);
 * - abonament: abonamentul devine ACTIV pentru o luna de azi; la un upgrade, cel vechi expira si porneste cel nou;
 *   tokenii de plan ramasi expira si se aloca tokenii lunari ai planului;
 * - pachet: tokenii pachetului se adauga la tokenii extra.
 * Dupa tranzactie se publica evenimentul PlataEfectuata (factura, notificarea si auditul il trateaza separat).
 */
export class ServiciuPlati implements IServiciuPlati {
  private readonly db: BlockManagerContext;
  private readonly tokeni: IServiciuTokeni;
  private readonly evenimente: MagistralaEvenimente;
  private readonly log: Logger;

  constructor(dep: { db: BlockManagerContext; serviciuTokeni: IServiciuTokeni; magistralaEvenimente: MagistralaEvenimente; logger: Logger }) {
    this.db = dep.db;
    this.tokeni = dep.serviciuTokeni;
    this.evenimente = dep.magistralaEvenimente;
    this.log = dep.logger.pentru("ServiciuPlati");
  }

  async plateste(comandaId: number): Promise<Evenimente["PlataEfectuata"]> {
    const plata = await this.db.$transaction(async (tx) => {
      const comanda = await tx.comandaSimulata.findUnique({ where: { id: comandaId }, include: { plan: true, pachet: true, abonament: true } });
      if (!comanda) throw new EroareBusiness("NEGASIT", `Comanda ${comandaId} nu există.`);
      const achitataLa = new Date();
      const marcate = await tx.comandaSimulata.updateMany({ where: { id: comandaId, status: StatusComanda.IN_ASTEPTARE }, data: { status: StatusComanda.ACHITATA, achitataLa } });
      if (marcate.count === 0) throw new EroareBusiness("CONFLICT", `Comanda ${comanda.referinta} nu mai este în așteptare (este ${comanda.status === StatusComanda.ACHITATA ? "deja achitată" : "anulată"}).`);

      const portofel = await this.tokeni.asiguraPortofel(tx, comanda.asociatieId);

      if (comanda.tip === TipComanda.PACHET) {
        if (!comanda.pachet) throw new EroareBusiness("DATE_INVALIDE", "Comanda nu are pachet.");
        await this.tokeni.adaugaTokeniExtra(tx, portofel, comanda.pachet.tokeni, comanda.pachet.denumire, comanda.id);
        return { comanda, achitataLa, descriere: comanda.pachet.denumire, tokeniAlocati: comanda.pachet.tokeni };
      }

      const plan = comanda.plan;
      const vechi = comanda.abonament;
      if (!plan || !vechi) throw new EroareBusiness("DATE_INVALIDE", "Comanda nu are plan sau abonament.");
      if (vechi.status !== StatusAbonament.ACTIV && vechi.status !== StatusAbonament.SUSPENDAT) {
        throw new EroareBusiness("CONFLICT", "Abonamentul comenzii nu mai este curent.");
      }
      const inceput = ziCurenta();
      if (vechi.planId === plan.id) {
        // prima plata sau plata dupa suspendare: perioada urmatoare, de azi
        await tx.abonament.update({ where: { id: vechi.id }, data: { status: StatusAbonament.ACTIV, inceputPerioada: inceput, sfarsitPerioada: plusOLuna(inceput) } });
      } else {
        // upgrade: abonamentul vechi expira, porneste unul nou pe planul platit
        await tx.abonament.update({ where: { id: vechi.id }, data: { status: StatusAbonament.EXPIRAT } });
        const nou = await tx.abonament.create({
          data: { asociatieId: comanda.asociatieId, planId: plan.id, inceputPerioada: inceput, sfarsitPerioada: plusOLuna(inceput), status: StatusAbonament.ACTIV, reinnoireAutomata: vechi.reinnoireAutomata },
        });
        await tx.comandaSimulata.update({ where: { id: comanda.id }, data: { abonamentId: nou.id } });
      }
      await this.tokeni.alocaTokeniPlan(tx, portofel, plan.tokeniLunari, `Alocare plan ${plan.denumire}`, comanda.id);
      return { comanda, achitataLa, descriere: `Abonament ${plan.denumire}`, tokeniAlocati: plan.tokeniLunari };
    });

    const eveniment: Evenimente["PlataEfectuata"] = {
      comandaId: plata.comanda.id,
      referinta: plata.comanda.referinta,
      asociatieId: plata.comanda.asociatieId,
      tip: plata.comanda.tip,
      suma: plata.comanda.suma.toFixed(2),
      descriere: plata.descriere,
      tokeniAlocati: plata.tokeniAlocati,
      achitataLa: plata.achitataLa.toISOString(),
    };
    this.log.info(`Plată simulată: ${eveniment.referinta}`, { asociatieId: eveniment.asociatieId, suma: eveniment.suma, tokeni: eveniment.tokeniAlocati });
    this.evenimente.publica("PlataEfectuata", eveniment);
    return eveniment;
  }
}
