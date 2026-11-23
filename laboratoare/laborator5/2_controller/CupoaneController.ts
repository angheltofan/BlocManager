import type { Request, Response } from "express";
import { CodCuponDuplicat, CupoaneAccessor, PlanuriAccessor } from "nivel-acces-date";
import { cuponGol, dinEntitate, dinFormular, valideaza, type CuponViewModel, type EroriCupon, type OptiunePlan } from "../models/CuponViewModel.ts";

/**
 * CupoaneController: actiunile MVC pentru entitatea CuponReducere.
 *
 *   GET  /cupoane            Index       lista cupoanelor
 *   GET  /cupoane/:id        Details     detaliile unui cupon
 *   GET  /cupoane/create     Create      formularul gol
 *   POST /cupoane/create     Create      salvarea cuponului nou (AddEntity)
 *   GET  /cupoane/edit/:id   Edit        formularul completat cu cuponul existent
 *   POST /cupoane/edit/:id   Edit        salvarea modificarilor (UpdateEntity)
 *
 * Datele vin doar prin clasele Accessor din NivelAccesDate (Laboratorul 4).
 */
export class CupoaneController {
  constructor(
    private readonly cupoane = new CupoaneAccessor(),
    private readonly planuri = new PlanuriAccessor(),
  ) {}

  /** GET /cupoane */
  index = async (req: Request, res: Response) => {
    const lista = (await this.cupoane.getToate()).map((c) => dinEntitate(c));
    res.render("cupoane/index", { titlu: "Cupoane de reducere", cupoane: lista, mesaj: mesajDinQuery(req) });
  };

  /** GET /cupoane/:id */
  details = async (req: Request, res: Response) => {
    const cupon = await this.gasesteCupon(req, res);
    if (!cupon) return;
    res.render("cupoane/details", { titlu: `Cuponul ${cupon.cod}`, cupon, mesaj: mesajDinQuery(req) });
  };

  /** GET /cupoane/create: starea initiala a paginii Create. */
  createGet = async (_req: Request, res: Response) => {
    await this.afiseazaFormular(res, "cupoane/create", "Cupon nou", cuponGol(), {});
  };

  /** POST /cupoane/create: datele completate de utilizator, trimise la apasarea butonului Salvează. */
  createPost = async (req: Request, res: Response) => {
    const vm = dinFormular(req.body ?? {});
    const rezultat = valideaza(vm, await this.idPlanuri());
    if (!rezultat.ok) return this.afiseazaFormular(res, "cupoane/create", "Cupon nou", vm, rezultat.erori, 400);

    try {
      const nou = await this.cupoane.adauga(rezultat.date);
      res.redirect(303, `/cupoane/${nou.id}?mesaj=adaugat`);
    } catch (e) {
      if (!(e instanceof CodCuponDuplicat)) throw e;
      await this.afiseazaFormular(res, "cupoane/create", "Cupon nou", vm, { cod: `Există deja un cupon cu codul ${e.cod}.` }, 409);
    }
  };

  /** GET /cupoane/edit/:id: starea initiala a entitatii editate. */
  editGet = async (req: Request, res: Response) => {
    const cupon = await this.gasesteCupon(req, res);
    if (!cupon) return;
    await this.afiseazaFormular(res, "cupoane/edit", `Modifică cuponul ${cupon.cod}`, cupon, {});
  };

  /** POST /cupoane/edit/:id: salvarea modificarilor. */
  editPost = async (req: Request, res: Response) => {
    const existent = await this.gasesteCupon(req, res);
    if (!existent) return;

    const vm = { ...dinFormular(req.body ?? {}, existent.id), utilizari: existent.utilizari };
    const titlu = `Modifică cuponul ${existent.cod}`;
    const rezultat = valideaza(vm, await this.idPlanuri());
    if (!rezultat.ok) return this.afiseazaFormular(res, "cupoane/edit", titlu, vm, rezultat.erori, 400);

    try {
      await this.cupoane.modifica(existent.id!, rezultat.date);
      res.redirect(303, `/cupoane/${existent.id}?mesaj=modificat`);
    } catch (e) {
      if (!(e instanceof CodCuponDuplicat)) throw e;
      await this.afiseazaFormular(res, "cupoane/edit", titlu, vm, { cod: `Există deja un cupon cu codul ${e.cod}.` }, 409);
    }
  };

  // ---------------------------------------------------------------

  /** Cuponul din parametrul :id, ca ViewModel; raspunde 404 si intoarce null daca nu exista. */
  private async gasesteCupon(req: Request, res: Response): Promise<CuponViewModel | null> {
    const id = Number(req.params.id);
    const cupon = Number.isInteger(id) && id > 0 ? await this.cupoane.getDupaId(id) : null;
    if (!cupon) {
      res.status(404).render("eroare", { titlu: "Cupon inexistent", mesaj: `Nu există niciun cupon cu id-ul ${req.params.id}.` });
      return null;
    }
    return dinEntitate(cupon);
  }

  /** Lista de selectie a planului: "orice plan platit" + planurile cu pret (FREE nu are ce reduce). */
  private async optiuniPlan(): Promise<OptiunePlan[]> {
    const platite = (await this.planuri.getToate()).filter((p) => p.pretLunar.gt(0));
    return [
      { valoare: "", text: "Orice plan plătit" },
      ...platite.map((p) => ({ valoare: String(p.id), text: `${p.denumire} (${p.pretLunar.toFixed(2).replace(".", ",")} lei / lună)` })),
    ];
  }

  private async idPlanuri(): Promise<number[]> {
    return (await this.planuri.getToate()).filter((p) => p.pretLunar.gt(0)).map((p) => p.id);
  }

  private async afiseazaFormular(res: Response, view: string, titlu: string, cupon: CuponViewModel, erori: EroriCupon, status = 200) {
    res.status(status).render(view, { titlu, cupon, erori, optiuniPlan: await this.optiuniPlan() });
  }
}

function mesajDinQuery(req: Request): string | null {
  if (req.query.mesaj === "adaugat") return "Cuponul a fost adăugat.";
  if (req.query.mesaj === "modificat") return "Modificările au fost salvate.";
  return null;
}
