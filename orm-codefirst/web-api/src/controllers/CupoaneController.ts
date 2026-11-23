import type { Request, Response } from "express";
import { EroareBusiness, type Dependente } from "servicii";
import type { CuponDto } from "../dtos/CuponDto.ts";
import { valideazaInput } from "../dtos/CuponInputDto.ts";
import { laDateCupon, laDto, laDtoLista } from "../mapare/mapper.ts";

/**
 * CupoaneController: endpoint-urile API pentru entitatea CuponReducere (echivalentul ProduseController).
 *
 *   GET    /api/cupoane        Get()        toate cupoanele (?sterse=1 le include pe cele sterse)   200
 *   GET    /api/cupoane/:id    Get(int id)  un cupon                                                200 | 404
 *   POST   /api/cupoane        Post         adauga un cupon (body JSON)                             201 | 400 | 409
 *   PUT    /api/cupoane/:id    Put          modifica un cupon (body JSON)                           200 | 400 | 404 | 409
 *   DELETE /api/cupoane/:id    Delete       stergere logica                                         204 | 404
 *   POST   /api/cupoane/:id/restaurare     anularea stergerii logice                               200 | 404
 *
 * Raspunsurile sunt CuponDto (nu entitatea din baza de date); conversia o face AutoMapper.
 * Regulile (cod unic, utilizari, stergere logica) sunt in ServiciuCupoane.
 */
export class CupoaneController {
  private readonly cupoane: Dependente["serviciuCupoane"];
  private readonly planuri: Dependente["serviciuPlanuri"];

  constructor({ serviciuCupoane, serviciuPlanuri }: Pick<Dependente, "serviciuCupoane" | "serviciuPlanuri">) {
    this.cupoane = serviciuCupoane;
    this.planuri = serviciuPlanuri;
  }

  get = async (req: Request, res: Response<CuponDto[]>) => {
    res.json(laDtoLista(await this.cupoane.getToate(req.query.sterse === "1")));
  };

  getById = async (req: Request, res: Response) => {
    res.json(laDto(await this.cupoane.getDupaId(citesteId(req))));
  };

  post = async (req: Request, res: Response) => {
    const validare = valideazaInput(req.body);
    if (!validare.ok) return res.status(400).json({ eroare: "Datele cuponului nu sunt valide.", erori: validare.erori });
    const nou = await this.cupoane.adauga(laDateCupon(validare.dto, await this.idPlan(validare.dto.planCod)));
    res.status(201).location(`/api/cupoane/${nou.id}`).json(laDto(await this.cupoane.getDupaId(nou.id)));
  };

  put = async (req: Request, res: Response) => {
    const id = citesteId(req);
    await this.cupoane.getDupaId(id); // 404 daca nu exista
    const validare = valideazaInput(req.body);
    if (!validare.ok) return res.status(400).json({ eroare: "Datele cuponului nu sunt valide.", erori: validare.erori });
    await this.cupoane.modifica(id, laDateCupon(validare.dto, await this.idPlan(validare.dto.planCod)));
    res.json(laDto(await this.cupoane.getDupaId(id)));
  };

  delete = async (req: Request, res: Response) => {
    await this.cupoane.sterge(citesteId(req));
    res.status(204).end();
  };

  restaureaza = async (req: Request, res: Response) => {
    const id = citesteId(req);
    await this.cupoane.restaureaza(id);
    res.json(laDto(await this.cupoane.getDupaId(id)));
  };

  /** Id-ul planului dupa cod; null = orice plan platit. */
  private async idPlan(cod: string | null): Promise<number | null> {
    if (cod === null) return null;
    const plan = await this.planuri.getPlanDupaCod(cod);
    if (!plan || plan.pretLunar.isZero()) throw new EroareBusiness("DATE_INVALIDE", `Nu există un plan plătit cu codul ${cod}.`, "planCod");
    return plan.id;
  }
}

function citesteId(req: Request): number {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : 0;
}
