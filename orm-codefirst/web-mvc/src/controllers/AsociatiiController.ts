import type { Request, Response } from "express";
import { EroareBusiness, type Dependente, type FormularAsociatie } from "servicii";

/**
 * AsociatiiController (admin): asociatiile clientilor.
 *
 *   GET  /asociatii          Index    asociatiile, cu abonamentul curent
 *   GET  /asociatii/create   Create   formularul gol
 *   POST /asociatii/create   Create   salvarea; apoi se poate crea abonamentul
 */
export class AsociatiiController {
  private readonly asociatii: Dependente["serviciuAsociatii"];

  constructor({ serviciuAsociatii }: Pick<Dependente, "serviciuAsociatii">) {
    this.asociatii = serviciuAsociatii;
  }

  index = async (req: Request, res: Response) => {
    const lista = (await this.asociatii.getToate()).map((a) => ({
      id: a.id,
      denumire: a.denumire,
      cui: a.cui,
      adresa: a.adresa,
      abonament: a.abonamente[0] ? { id: a.abonamente[0].id, plan: a.abonamente[0].plan.denumire, status: a.abonamente[0].status } : null,
    }));
    const nou = Number(req.query.id) || null;
    res.render("asociatii/index", { titlu: "Asociații", asociatii: lista, nou, mesaj: req.query.mesaj === "adaugata" ? "Asociația a fost adăugată. Îi poți crea acum un abonament." : null });
  };

  createGet = (_req: Request, res: Response) => {
    res.render("asociatii/create", { titlu: "Asociație nouă", f: { denumire: "", cui: "", adresa: "", iban: "", banca: "" }, erori: {} });
  };

  createPost = async (req: Request, res: Response) => {
    const corp = (req.body ?? {}) as Record<string, unknown>;
    const text = (c: string) => (typeof corp[c] === "string" ? (corp[c] as string) : "");
    const f: FormularAsociatie = { denumire: text("denumire"), cui: text("cui"), adresa: text("adresa"), iban: text("iban"), banca: text("banca") };
    try {
      const a = await this.asociatii.adauga(f);
      res.redirect(303, `/asociatii?mesaj=adaugata&id=${a.id}`);
    } catch (e) {
      if (!(e instanceof EroareBusiness)) throw e;
      const erori: Record<string, unknown> = { ...(e.detalii ?? {}) };
      if (e.camp) erori[e.camp] = e.message;
      else erori.general = e.message;
      res.status(e.status).render("asociatii/create", { titlu: "Asociație nouă", f, erori });
    }
  };
}
