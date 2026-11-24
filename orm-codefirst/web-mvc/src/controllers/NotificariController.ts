import type { Request, Response } from "express";
import type { Dependente } from "servicii";
import type { NotificareCuDestinatar } from "nivel-acces-date";

/**
 * NotificariController (admin): notificarile trimise administratorilor, cu STERGERE FIZICA
 * (Laboratorul 9, exercitiul 1).
 *
 *   GET  /notificari                Index     toate notificarile
 *   POST /notificari/citita/:id     -         marcheaza notificarea ca citita
 *   GET  /notificari/delete/:id     Delete    confirmarea stergerii
 *   POST /notificari/delete/:id     Delete    stergerea fizica (randul dispare din baza de date)
 *   POST /notificari/delete-citite  Delete    stergerea fizica a tuturor notificarilor citite
 *
 * Notificarea poate fi stearsa fizic: niciun alt tabel nu o refera, iar platile, facturile si jurnalul raman.
 */
export class NotificariController {
  private readonly notificari: Dependente["serviciuNotificari"];

  constructor({ serviciuNotificari }: Pick<Dependente, "serviciuNotificari">) {
    this.notificari = serviciuNotificari;
  }

  index = async (req: Request, res: Response) => {
    const lista = (await this.notificari.getToate()).map(vm);
    res.render("notificari/index", { titlu: "Notificări", notificari: lista, citite: lista.filter((n) => n.citita).length, mesaj: mesajDinQuery(req) });
  };

  marcheazaCitita = async (req: Request, res: Response) => {
    await this.notificari.marcheazaCitita(citesteId(req));
    res.redirect(303, "/notificari");
  };

  deleteGet = async (req: Request, res: Response) => {
    const n = vm(await this.notificari.getDupaId(citesteId(req)));
    res.render("notificari/delete", { titlu: "Șterge notificarea", notificare: n });
  };

  deletePost = async (req: Request, res: Response) => {
    await this.notificari.sterge(citesteId(req));
    res.redirect(303, "/notificari?mesaj=stearsa");
  };

  deleteCititePost = async (_req: Request, res: Response) => {
    const numar = await this.notificari.stergeCitite();
    res.redirect(303, `/notificari?mesaj=citite&numar=${numar}`);
  };
}

const TIP: Record<string, string> = { INTRETINERE: "Întreținere", PLATA: "Plată", SESIZARE: "Sesizare", ABONAMENT: "Abonament", TOKENI: "Tokeni", SISTEM: "Sistem" };

function vm(n: NotificareCuDestinatar) {
  return {
    id: n.id,
    tip: TIP[n.tip] ?? n.tip,
    mesaj: n.mesaj,
    citita: n.citita,
    data: n.dataCreare.toLocaleString("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    destinatar: `${n.utilizator.prenume} ${n.utilizator.nume}`,
    email: n.utilizator.email,
    asociatie: n.utilizator.asociatie?.denumire ?? "—",
  };
}

function citesteId(req: Request): number {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : 0;
}

function mesajDinQuery(req: Request): string | null {
  if (req.query.mesaj === "stearsa") return "Notificarea a fost ștearsă definitiv din baza de date.";
  if (req.query.mesaj === "citite") return `${Number(req.query.numar) || 0} notificări citite au fost șterse definitiv.`;
  return null;
}
