import type { Request, Response } from "express";
import { AbonamenteAccessor, EroareAbonament, PlanuriAccessor } from "nivel-acces-date";
import { dinCorp, dinEntitate, formularGol, valideaza, type AbonamentFormular, type EroriAbonament } from "../models/AbonamentViewModel.ts";

/**
 * AbonamenteController: actiunile Index si Create pentru entitatea Abonament
 * (cheile straine asociatie_id -> asociatii si plan_id -> planuri).
 *
 *   GET  /abonamente          Index    lista abonamentelor, cu asociatia, planul si comanda simulata
 *   GET  /abonamente/create   Create   formularul gol, cu listele de selectie pentru cheile straine
 *   POST /abonamente/create   Create   salvarea abonamentului (si a comenzii simulate, la planurile platite)
 */
export class AbonamenteController {
  constructor(
    private readonly abonamente = new AbonamenteAccessor(),
    private readonly planuri = new PlanuriAccessor(),
  ) {}

  /** GET /abonamente */
  index = async (req: Request, res: Response) => {
    const lista = (await this.abonamente.getToateCuDetalii()).map(dinEntitate);
    res.render("abonamente/index", { titlu: "Abonamente", abonamente: lista, mesaj: await this.mesajCreat(req), nouId: Number(req.query.id) || null });
  };

  /** GET /abonamente/create */
  createGet = async (_req: Request, res: Response) => {
    await this.afiseazaFormular(res, formularGol(), {});
  };

  /** POST /abonamente/create */
  createPost = async (req: Request, res: Response) => {
    const formular = dinCorp(req.body ?? {});
    const rezultat = valideaza(formular);
    if (!rezultat.ok) return this.afiseazaFormular(res, formular, rezultat.erori, 400);

    try {
      const { abonament } = await this.abonamente.creeaza(rezultat.date);
      res.redirect(303, `/abonamente?mesaj=creat&id=${abonament.id}`);
    } catch (e) {
      if (!(e instanceof EroareAbonament)) throw e;
      await this.afiseazaFormular(res, formular, { [e.camp]: e.message }, 409);
    }
  };

  // ---------------------------------------------------------------

  /** Formularul Create, cu listele de selectie citite din tabelele asociatii si planuri. */
  private async afiseazaFormular(res: Response, formular: AbonamentFormular, erori: EroriAbonament, status = 200) {
    const [asociatii, planuri] = await Promise.all([this.abonamente.getAsociatiiFaraAbonamentCurent(), this.planuri.getToate()]);
    res.status(status).render("abonamente/create", {
      titlu: "Abonament nou",
      formular,
      erori,
      optiuniAsociatie: asociatii.map((a) => ({ valoare: String(a.id), text: a.denumire })),
      optiuniPlan: planuri.map((p) => ({
        valoare: String(p.id),
        text: p.pretLunar.isZero()
          ? `${p.denumire} (gratuit, ${p.tokeniLunari} tokeni / lună)`
          : `${p.denumire} (${p.pretLunar.toFixed(2).replace(".", ",")} lei, ${p.tokeniLunari} tokeni / lună)`,
      })),
    });
  }

  /** Mesajul afisat in Index dupa Create, construit din abonamentul salvat. */
  private async mesajCreat(req: Request): Promise<string | null> {
    if (req.query.mesaj !== "creat") return null;
    const id = Number(req.query.id);
    const a = Number.isInteger(id) ? await this.abonamente.getDupaIdCuDetalii(id) : null;
    if (!a) return null;
    const vm = dinEntitate(a);
    return vm.status === "ACTIV"
      ? `Abonamentul ${vm.planDenumire} pentru ${vm.asociatieDenumire} este activ.`
      : `Abonamentul ${vm.planDenumire} pentru ${vm.asociatieDenumire} a fost creat. Rămâne suspendat până la plata comenzii ${vm.comandaReferinta} (${vm.comandaSuma} lei).`;
  }
}
