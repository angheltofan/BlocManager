import type { Request, Response } from "express";
import type { Dependente } from "servicii";
import type { PachetCuComenzi, PachetCuIstoric } from "nivel-acces-date";

/**
 * PacheteController (admin): pachetele de tokeni, cu STERGERE LOGICA (Laboratorul 9, exercitiul 2).
 *
 *   GET  /pachete                 Index     pachetele (?sterse=1 le arata si pe cele sterse logic)
 *   GET  /pachete/:id             Details   pachetul si comenzile care il folosesc
 *   GET  /pachete/delete/:id      Delete    confirmarea stergerii
 *   POST /pachete/delete/:id      Delete    stergerea logica (sters_la = acum; randul ramane)
 *   POST /pachete/restore/:id     Restore   anularea stergerii logice
 *
 * Pachetul nu se sterge fizic: comenzi_simulate.pachet_id il refera, iar comenzile vechi trebuie sa arate
 * in continuare ce pachet s-a cumparat.
 */
export class PacheteController {
  private readonly pachete: Dependente["serviciuPachete"];

  constructor({ serviciuPachete }: Pick<Dependente, "serviciuPachete">) {
    this.pachete = serviciuPachete;
  }

  index = async (req: Request, res: Response) => {
    const inclusivSterse = req.query.sterse === "1";
    const pachete = (await this.pachete.getToate(inclusivSterse)).map(vm);
    res.render("pachete/index", { titlu: "Pachete de tokeni", pachete, inclusivSterse, mesaj: mesajDinQuery(req) });
  };

  details = async (req: Request, res: Response) => {
    const p = await this.pachete.getCuIstoric(citesteId(req));
    res.render("pachete/details", { titlu: p.denumire, pachet: vm(p), comenzi: comenzi(p), mesaj: mesajDinQuery(req) });
  };

  deleteGet = async (req: Request, res: Response) => {
    const p = await this.pachete.getCuIstoric(citesteId(req));
    if (p.stersLa) return res.redirect(303, `/pachete/${p.id}`);
    res.render("pachete/delete", { titlu: `Șterge ${p.denumire}`, pachet: vm(p) });
  };

  deletePost = async (req: Request, res: Response) => {
    await this.pachete.sterge(citesteId(req));
    res.redirect(303, "/pachete?mesaj=sters");
  };

  restorePost = async (req: Request, res: Response) => {
    const id = citesteId(req);
    await this.pachete.restaureaza(id);
    res.redirect(303, `/pachete/${id}?mesaj=restaurat`);
  };
}

const lei = (d: { toFixed: (n: number) => string }) => d.toFixed(2).replace(".", ",");
const data = (d: Date) => d.toLocaleString("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

function vm(p: PachetCuComenzi | PachetCuIstoric) {
  return {
    id: p.id,
    denumire: p.denumire,
    tokeni: p.tokeni,
    pret: lei(p.pret),
    stare: p.stersLa ? "STERS" : p.activ ? "ACTIV" : "INACTIV",
    stersLa: p.stersLa ? data(p.stersLa) : null,
    numarComenzi: p._count.comenzi,
  };
}

function comenzi(p: PachetCuIstoric) {
  return p.comenzi.map((c) => ({ referinta: c.referinta, asociatie: c.asociatie.denumire, suma: lei(c.suma), status: c.status, emisa: data(c.createdAt) }));
}

function citesteId(req: Request): number {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : 0;
}

function mesajDinQuery(req: Request): string | null {
  const mesaje: Record<string, string> = {
    sters: "Pachetul a fost șters logic: nu mai este oferit, dar rămâne în baza de date, legat de comenzile vechi.",
    restaurat: "Pachetul a fost restaurat și este din nou oferit utilizatorilor.",
  };
  return mesaje[String(req.query.mesaj)] ?? null;
}
