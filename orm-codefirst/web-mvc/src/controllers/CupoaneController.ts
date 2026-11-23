import type { Request, Response } from "express";
import { EroareBusiness, type Dependente } from "servicii";
import { cuponGol, dinEntitate, dinFormular, valideaza, type CuponViewModel, type EroriCupon, type OptiunePlan } from "../models/CuponViewModel.ts";

/**
 * CupoaneController (admin): CRUD complet pentru entitatea CuponReducere.
 *
 *   GET  /cupoane                 Index       lista cupoanelor (?sterse=1 le arata si pe cele sterse)
 *   GET  /cupoane/:id             Details     detaliile unui cupon
 *   GET  /cupoane/create          Create      formularul gol
 *   POST /cupoane/create          Create      salvarea cuponului nou
 *   GET  /cupoane/edit/:id        Edit        formularul completat
 *   POST /cupoane/edit/:id        Edit        salvarea modificarilor
 *   GET  /cupoane/delete/:id      Delete      confirmarea stergerii
 *   POST /cupoane/delete/:id      Delete      stergerea logica (cuponul ramane in baza de date)
 *   POST /cupoane/restore/:id     Restore     anularea stergerii logice
 *
 * Controller-ul foloseste doar ServiciuCupoane si ServiciuPlanuri, primite din containerul de dependency injection.
 */
export class CupoaneController {
  private readonly cupoane: Dependente["serviciuCupoane"];
  private readonly planuri: Dependente["serviciuPlanuri"];

  constructor({ serviciuCupoane, serviciuPlanuri }: Pick<Dependente, "serviciuCupoane" | "serviciuPlanuri">) {
    this.cupoane = serviciuCupoane;
    this.planuri = serviciuPlanuri;
  }

  index = async (req: Request, res: Response) => {
    const inclusivSterse = req.query.sterse === "1";
    const lista = (await this.cupoane.getToate(inclusivSterse)).map((c) => dinEntitate(c));
    res.render("cupoane/index", { titlu: "Cupoane de reducere", cupoane: lista, inclusivSterse, mesaj: mesajDinQuery(req) });
  };

  details = async (req: Request, res: Response) => {
    const cupon = dinEntitate(await this.cupoane.getDupaId(citesteId(req)));
    res.render("cupoane/details", { titlu: `Cuponul ${cupon.cod}`, cupon, mesaj: mesajDinQuery(req) });
  };

  createGet = async (_req: Request, res: Response) => {
    await this.afiseazaFormular(res, "cupoane/create", "Cupon nou", cuponGol(), {});
  };

  createPost = async (req: Request, res: Response) => {
    const vm = dinFormular(req.body ?? {});
    const rezultat = valideaza(vm, await this.idPlanuri());
    if (!rezultat.ok) return this.afiseazaFormular(res, "cupoane/create", "Cupon nou", vm, rezultat.erori, 400);
    try {
      const nou = await this.cupoane.adauga(rezultat.date);
      res.redirect(303, `/cupoane/${nou.id}?mesaj=adaugat`);
    } catch (e) {
      if (!(e instanceof EroareBusiness)) throw e;
      await this.afiseazaFormular(res, "cupoane/create", "Cupon nou", vm, { [e.camp ?? "general"]: e.message }, e.status);
    }
  };

  editGet = async (req: Request, res: Response) => {
    const cupon = dinEntitate(await this.cupoane.getDupaId(citesteId(req)));
    if (cupon.stare === "STERS") return res.redirect(303, `/cupoane/${cupon.id}`);
    await this.afiseazaFormular(res, "cupoane/edit", `Modifică cuponul ${cupon.cod}`, cupon, {});
  };

  editPost = async (req: Request, res: Response) => {
    const existent = dinEntitate(await this.cupoane.getDupaId(citesteId(req)));
    const vm = { ...dinFormular(req.body ?? {}, existent.id), utilizari: existent.utilizari };
    const titlu = `Modifică cuponul ${existent.cod}`;
    const rezultat = valideaza(vm, await this.idPlanuri());
    if (!rezultat.ok) return this.afiseazaFormular(res, "cupoane/edit", titlu, vm, rezultat.erori, 400);
    try {
      await this.cupoane.modifica(existent.id!, rezultat.date);
      res.redirect(303, `/cupoane/${existent.id}?mesaj=modificat`);
    } catch (e) {
      if (!(e instanceof EroareBusiness)) throw e;
      await this.afiseazaFormular(res, "cupoane/edit", titlu, vm, { [e.camp ?? "general"]: e.message }, e.status);
    }
  };

  deleteGet = async (req: Request, res: Response) => {
    const cupon = dinEntitate(await this.cupoane.getDupaId(citesteId(req)));
    res.render("cupoane/delete", { titlu: `Șterge cuponul ${cupon.cod}`, cupon });
  };

  deletePost = async (req: Request, res: Response) => {
    await this.cupoane.sterge(citesteId(req));
    res.redirect(303, "/cupoane?mesaj=sters");
  };

  restorePost = async (req: Request, res: Response) => {
    const id = citesteId(req);
    await this.cupoane.restaureaza(id);
    res.redirect(303, `/cupoane/${id}?mesaj=restaurat`);
  };

  // ---------------------------------------------------------------

  /** Lista de selectie a planului: "orice plan platit" + planurile cu pret (FREE nu are ce reduce). */
  private async optiuniPlan(): Promise<OptiunePlan[]> {
    const platite = (await this.planuri.getPlanuri()).filter((p) => p.pretLunar.gt(0));
    return [
      { valoare: "", text: "Orice plan plătit" },
      ...platite.map((p) => ({ valoare: String(p.id), text: `${p.denumire} (${p.pretLunar.toFixed(2).replace(".", ",")} lei / lună)` })),
    ];
  }

  private async idPlanuri(): Promise<number[]> {
    return (await this.planuri.getPlanuri()).filter((p) => p.pretLunar.gt(0)).map((p) => p.id);
  }

  private async afiseazaFormular(res: Response, view: string, titlu: string, cupon: CuponViewModel, erori: EroriCupon, status = 200) {
    res.status(status).render(view, { titlu, cupon, erori, optiuniPlan: await this.optiuniPlan() });
  }
}

/** Id-ul din ruta; un id invalid ajunge la serviciu ca 0 si produce "nu exista" (404). */
function citesteId(req: Request): number {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : 0;
}

function mesajDinQuery(req: Request): string | null {
  const mesaje: Record<string, string> = {
    adaugat: "Cuponul a fost adăugat.",
    modificat: "Modificările au fost salvate.",
    sters: "Cuponul a fost șters. Îl poți vedea și restaura din „Arată și cupoanele șterse”.",
    restaurat: "Cuponul a fost restaurat. Este inactiv: activează-l din Modifică, dacă trebuie folosit.",
  };
  return mesaje[String(req.query.mesaj)] ?? null;
}
