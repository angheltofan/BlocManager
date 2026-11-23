import type { Request, Response } from "express";
import { CodCuponDuplicat, CupoaneAccessor, PlanuriAccessor } from "nivel-acces-date";
import type { CuponDto } from "../dtos/CuponDto.ts";
import { valideazaInput } from "../dtos/CuponInputDto.ts";
import { laDateCupon, laDto, laDtoLista } from "../mapare/mapper.ts";

/**
 * CupoaneController: endpoint-urile API pentru entitatea CuponReducere (echivalentul ProduseController).
 *
 *   GET  /api/cupoane        Get()        toate cupoanele                  200
 *   GET  /api/cupoane/:id    Get(int id)  un cupon                         200 | 404
 *   POST /api/cupoane        Post         adauga un cupon (body JSON)      201 | 400 | 409
 *   PUT  /api/cupoane/:id    Put          modifica un cupon (body JSON)    200 | 400 | 404 | 409
 *
 * Raspunsurile sunt CuponDto (nu entitatea din baza de date); conversia o face AutoMapper.
 */
export class CupoaneController {
  constructor(
    private readonly cupoane = new CupoaneAccessor(),
    private readonly planuri = new PlanuriAccessor(),
  ) {}

  /** GET /api/cupoane */
  get = async (_req: Request, res: Response<CuponDto[]>) => {
    res.json(laDtoLista(await this.cupoane.getToate()));
  };

  /** GET /api/cupoane/:id */
  getById = async (req: Request, res: Response) => {
    const id = citesteId(req);
    const cupon = id ? await this.cupoane.getDupaId(id) : null;
    if (!cupon) return res.status(404).json({ eroare: `Nu există niciun cupon cu id-ul ${req.params.id}.` });
    res.json(laDto(cupon));
  };

  /** POST /api/cupoane */
  post = async (req: Request, res: Response) => {
    const validare = valideazaInput(req.body);
    if (!validare.ok) return res.status(400).json({ eroare: "Datele cuponului nu sunt valide.", erori: validare.erori });

    const planId = await this.idPlan(validare.dto.planCod);
    if (planId === undefined) return res.status(400).json({ eroare: "Datele cuponului nu sunt valide.", erori: { planCod: `Nu există un plan plătit cu codul ${validare.dto.planCod}.` } });

    try {
      const nou = await this.cupoane.adauga(laDateCupon(validare.dto, planId));
      const cupon = await this.cupoane.getDupaId(nou.id);
      res.status(201).location(`/api/cupoane/${nou.id}`).json(laDto(cupon!));
    } catch (e) {
      if (!(e instanceof CodCuponDuplicat)) throw e;
      res.status(409).json({ eroare: `Există deja un cupon cu codul ${e.cod}.` });
    }
  };

  /** PUT /api/cupoane/:id */
  put = async (req: Request, res: Response) => {
    const id = citesteId(req);
    const existent = id ? await this.cupoane.getDupaId(id) : null;
    if (!existent) return res.status(404).json({ eroare: `Nu există niciun cupon cu id-ul ${req.params.id}.` });

    const validare = valideazaInput(req.body);
    if (!validare.ok) return res.status(400).json({ eroare: "Datele cuponului nu sunt valide.", erori: validare.erori });
    if (validare.dto.utilizariMaxime < existent.utilizari) {
      return res.status(400).json({
        eroare: "Datele cuponului nu sunt valide.",
        erori: { utilizariMaxime: `Cuponul a fost folosit deja de ${existent.utilizari} ori; maximul nu poate fi mai mic.` },
      });
    }
    const planId = await this.idPlan(validare.dto.planCod);
    if (planId === undefined) return res.status(400).json({ eroare: "Datele cuponului nu sunt valide.", erori: { planCod: `Nu există un plan plătit cu codul ${validare.dto.planCod}.` } });

    try {
      await this.cupoane.modifica(existent.id, laDateCupon(validare.dto, planId));
      res.json(laDto((await this.cupoane.getDupaId(existent.id))!));
    } catch (e) {
      if (!(e instanceof CodCuponDuplicat)) throw e;
      res.status(409).json({ eroare: `Există deja un cupon cu codul ${e.cod}.` });
    }
  };

  /** Id-ul planului dupa cod; null = orice plan platit; undefined = cod inexistent sau plan gratuit. */
  private async idPlan(cod: string | null): Promise<number | null | undefined> {
    if (cod === null) return null;
    const plan = await this.planuri.getDupaCod(cod);
    return plan && plan.pretLunar.gt(0) ? plan.id : undefined;
  }
}

function citesteId(req: Request): number | null {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}
