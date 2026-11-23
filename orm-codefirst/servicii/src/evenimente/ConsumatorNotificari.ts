import { Rol, TipNotificare } from "librarie-modele";
import type { BlockManagerContext } from "repository-codefirst";
import type { Logger } from "../infrastructura/Logger.ts";
import type { Evenimente, MagistralaEvenimente } from "../infrastructura/MagistralaEvenimente.ts";

/**
 * Consumatorul 2: trimite o notificare administratorilor asociatiei (tabelul notificari),
 * dupa o plata (PlataEfectuata) sau cand abonamentul a fost suspendat de jobul zilnic (AbonamentSuspendat).
 */
export class ConsumatorNotificari {
  private readonly db: BlockManagerContext;
  private readonly log: Logger;

  constructor(dep: { db: BlockManagerContext; logger: Logger }) {
    this.db = dep.db;
    this.log = dep.logger.pentru("ConsumatorNotificari");
  }

  inregistreaza(magistrala: MagistralaEvenimente) {
    magistrala.abonare("PlataEfectuata", "ConsumatorNotificari", (e) => this.dupaPlata(e));
    magistrala.abonare("AbonamentSuspendat", "ConsumatorNotificari", (e) => this.dupaSuspendare(e));
  }

  async dupaPlata(e: Evenimente["PlataEfectuata"]) {
    const suma = e.suma.replace(".", ",");
    const mesaj =
      e.tip === "ABONAMENT"
        ? `Plata comenzii ${e.referinta} (${suma} lei) a fost înregistrată. ${e.descriere} este activ: ${e.tokeniAlocati} tokeni alocați.`
        : `Plata comenzii ${e.referinta} (${suma} lei) a fost înregistrată: ${e.tokeniAlocati} tokeni extra adăugați.`;
    await this.trimite(e.asociatieId, e.tip === "ABONAMENT" ? TipNotificare.ABONAMENT : TipNotificare.TOKENI, mesaj);
  }

  async dupaSuspendare(e: Evenimente["AbonamentSuspendat"]) {
    await this.trimite(e.asociatieId, TipNotificare.ABONAMENT, `Perioada abonamentului ${e.plan} s-a încheiat. Abonamentul este suspendat până la plata comenzii ${e.comandaReferinta}.`);
  }

  private async trimite(asociatieId: number, tip: TipNotificare, mesaj: string) {
    const admini = await this.db.utilizator.findMany({ where: { asociatieId, rol: Rol.ADMIN, activ: true }, select: { id: true } });
    if (admini.length === 0) return;
    await this.db.notificare.createMany({ data: admini.map((u) => ({ utilizatorId: u.id, tip, mesaj })) });
    this.log.info(`Notificare trimisă`, { asociatieId, destinatari: admini.length, tip });
  }
}
