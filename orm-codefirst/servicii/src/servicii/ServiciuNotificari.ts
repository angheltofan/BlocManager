import type { NotificareCuDestinatar, NotificariAccessor } from "nivel-acces-date";
import { EroareBusiness } from "../infrastructura/EroareBusiness.ts";
import type { Logger } from "../infrastructura/Logger.ts";

/**
 * ServiciuNotificari: notificarile trimise administratorilor (create de ConsumatorNotificari),
 * cu stergere fizica (Laboratorul 9): randul dispare din baza de date, fara sa afecteze istoricul.
 */
export class ServiciuNotificari {
  private readonly notificari: NotificariAccessor;
  private readonly log: Logger;

  constructor(dep: { notificariAccessor: NotificariAccessor; logger: Logger }) {
    this.notificari = dep.notificariAccessor;
    this.log = dep.logger.pentru("ServiciuNotificari");
  }

  getToate(): Promise<NotificareCuDestinatar[]> {
    return this.notificari.getToate();
  }

  async getDupaId(id: number): Promise<NotificareCuDestinatar> {
    const n = await this.notificari.getDupaId(id);
    if (!n) throw new EroareBusiness("NEGASIT", `Nu există nicio notificare cu id-ul ${id}. Poate a fost ștearsă.`);
    return n;
  }

  async marcheazaCitita(id: number): Promise<void> {
    await this.getDupaId(id);
    await this.notificari.marcheazaCitita(id);
  }

  /** Stergere fizica a unei notificari. */
  async sterge(id: number): Promise<void> {
    const n = await this.getDupaId(id);
    await this.notificari.sterge(id);
    this.log.info(`Notificare ștearsă fizic`, { id, destinatar: n.utilizator.email, tip: n.tip });
  }

  /** Stergere fizica a tuturor notificarilor citite. */
  async stergeCitite(): Promise<number> {
    const numar = await this.notificari.stergeCitite();
    this.log.info(`Notificări citite șterse fizic`, { numar });
    return numar;
  }
}
