import type { Request, Response } from "express";
import { EroareBusiness, type Dependente } from "servicii";
import {
  detaliiDinEntitate,
  dinCorp,
  dinCorpEdit,
  dinEntitate,
  formularEditDinEntitate,
  formularGol,
  valideaza,
  valideazaEdit,
  type AbonamentFormular,
  type AbonamentFormularEdit,
  type EroriAbonament,
} from "../models/AbonamentViewModel.ts";

/**
 * AbonamenteController (admin): CRUD complet pentru entitatea Abonament
 * (cheile straine asociatie_id -> asociatii, plan_id -> planuri, plan_urmator_id -> planuri).
 *
 *   GET  /abonamente               Index    lista abonamentelor
 *   GET  /abonamente/:id           Details  abonamentul, comenzile, facturile si jurnalul de tokeni
 *   GET  /abonamente/create        Create   formularul gol
 *   POST /abonamente/create        Create   abonament nou (Free activ; Pro/Max suspendat, cu comanda simulata)
 *   GET  /abonamente/edit/:id      Edit     formularul completat
 *   POST /abonamente/edit/:id      Edit     reinnoire automata, plan programat, sfarsitul perioadei
 *   GET  /abonamente/delete/:id    Delete   confirmarea anularii
 *   POST /abonamente/delete/:id    Delete   anulare = stergere logica (abonamentul ramane in istoric)
 *   POST /abonamente/job           -        ruleaza jobul zilnic de reinnoire
 */
export class AbonamenteController {
  private readonly abonamente: Dependente["serviciuAbonamente"];
  private readonly planuri: Dependente["serviciuPlanuri"];
  private readonly reinnoire: Dependente["serviciuReinnoire"];

  constructor(dep: Pick<Dependente, "serviciuAbonamente" | "serviciuPlanuri" | "serviciuReinnoire">) {
    this.abonamente = dep.serviciuAbonamente;
    this.planuri = dep.serviciuPlanuri;
    this.reinnoire = dep.serviciuReinnoire;
  }

  index = async (req: Request, res: Response) => {
    const lista = (await this.abonamente.getToate()).map(dinEntitate);
    res.render("abonamente/index", {
      titlu: "Abonamente",
      abonamente: lista,
      mesaj: typeof req.query.mesaj === "string" ? req.query.mesaj : null,
      nouId: Number(req.query.id) || null,
    });
  };

  details = async (req: Request, res: Response) => {
    const a = detaliiDinEntitate(await this.abonamente.getDetalii(citesteId(req)));
    res.render("abonamente/details", { titlu: `Abonament ${a.plan.denumire} · ${a.asociatie.denumire}`, a, mesaj: typeof req.query.mesaj === "string" ? req.query.mesaj : null });
  };

  createGet = async (_req: Request, res: Response) => {
    await this.afiseazaCreate(res, formularGol(), {});
  };

  createPost = async (req: Request, res: Response) => {
    const formular = dinCorp(req.body ?? {});
    const v = valideaza(formular);
    if (!v.ok) return this.afiseazaCreate(res, formular, v.erori, 400);
    try {
      const rezultat = await this.abonamente.creeaza(v.asociatieId, v.planId, v.optiuni);
      res.redirect(303, `/abonamente?id=${rezultat.abonament.id}&mesaj=${encodeURIComponent(rezultat.mesaj)}`);
    } catch (e) {
      if (!(e instanceof EroareBusiness)) throw e;
      await this.afiseazaCreate(res, formular, { [e.camp ?? "general"]: e.message }, e.status);
    }
  };

  editGet = async (req: Request, res: Response) => {
    const detalii = await this.abonamente.getDetalii(citesteId(req));
    await this.afiseazaEdit(res, detalii, formularEditDinEntitate(detalii.abonament), {});
  };

  editPost = async (req: Request, res: Response) => {
    const detalii = await this.abonamente.getDetalii(citesteId(req));
    const formular = dinCorpEdit(req.body ?? {});
    const v = valideazaEdit(formular);
    if (!v.ok) return this.afiseazaEdit(res, detalii, formular, v.erori, 400);
    try {
      await this.abonamente.modifica(detalii.abonament.id, v.date);
      res.redirect(303, `/abonamente/${detalii.abonament.id}?mesaj=${encodeURIComponent("Modificările au fost salvate.")}`);
    } catch (e) {
      if (!(e instanceof EroareBusiness)) throw e;
      await this.afiseazaEdit(res, detalii, formular, { [e.camp ?? "general"]: e.message }, e.status);
    }
  };

  deleteGet = async (req: Request, res: Response) => {
    const a = detaliiDinEntitate(await this.abonamente.getDetalii(citesteId(req)));
    res.render("abonamente/delete", { titlu: "Anulează abonamentul", a });
  };

  deletePost = async (req: Request, res: Response) => {
    const id = citesteId(req);
    await this.abonamente.anuleaza(id);
    res.redirect(303, `/abonamente/${id}?mesaj=${encodeURIComponent("Abonamentul a fost anulat. Rămâne în istoric, iar asociația poate alege un plan nou.")}`);
  };

  jobPost = async (_req: Request, res: Response) => {
    const rezultat = await this.reinnoire.ruleaza();
    const mesaj =
      rezultat.length === 0
        ? "Jobul zilnic a rulat: nicio perioadă nu s-a încheiat azi."
        : `Jobul zilnic a rulat: ${rezultat.map((r) => `${r.asociatie} – ${r.actiune}`).join("; ")}.`;
    res.redirect(303, `/abonamente?mesaj=${encodeURIComponent(mesaj)}`);
  };

  // ---------------------------------------------------------------

  private async optiuniPlan() {
    return (await this.planuri.getPlanuri()).map((p) => ({
      valoare: String(p.id),
      text: p.pretLunar.isZero()
        ? `${p.denumire} (gratuit, ${p.tokeniLunari} tokeni / lună)`
        : `${p.denumire} (${p.pretLunar.toFixed(2).replace(".", ",")} lei, ${p.tokeniLunari} tokeni / lună)`,
    }));
  }

  private async afiseazaCreate(res: Response, formular: AbonamentFormular, erori: EroriAbonament, status = 200) {
    const [asociatii, optiuniPlan] = await Promise.all([this.abonamente.getAsociatiiFaraAbonamentCurent(), this.optiuniPlan()]);
    res.status(status).render("abonamente/create", {
      titlu: "Abonament nou",
      formular,
      erori,
      optiuniAsociatie: asociatii.map((a) => ({ valoare: String(a.id), text: a.denumire })),
      optiuniPlan,
    });
  }

  private async afiseazaEdit(
    res: Response,
    detalii: Awaited<ReturnType<Dependente["serviciuAbonamente"]["getDetalii"]>>,
    formular: AbonamentFormularEdit,
    erori: EroriAbonament,
    status = 200,
  ) {
    const a = detaliiDinEntitate(detalii);
    const optiuniPlan = (await this.optiuniPlan()).filter((o) => o.valoare !== String(detalii.abonament.planId));
    res.status(status).render("abonamente/edit", { titlu: "Modifică abonamentul", a, formular, erori, optiuniPlan });
  }
}

function citesteId(req: Request): number {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : 0;
}
