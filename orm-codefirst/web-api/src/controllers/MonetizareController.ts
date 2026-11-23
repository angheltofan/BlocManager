import type { Request, Response } from "express";
import { EroareBusiness, type Dependente } from "servicii";
import { actiuneDto, pachetDto, planDto, rezultatPlanDto, stareDto } from "../dtos/MonetizareDto.ts";

/**
 * MonetizareController: endpoint-urile folosite de sectiunea de utilizator ("Abonamentul meu").
 *
 *   GET  /api/planuri                         planurile (din cache)
 *   GET  /api/pachete                         pachetele de tokeni
 *   GET  /api/actiuni                         actiunile taxate si costul lor in tokeni
 *   GET  /api/cupoane/verifica?cod=&planCod=  pretul planului dupa reducere (fara sa foloseasca cuponul)
 *   GET  /api/asociatii                       asociatiile (pentru alegerea asociatiei curente)
 *   GET  /api/asociatii/:id/stare             abonamentul, portofelul, comenzile in asteptare, jurnalul, facturile
 *   POST /api/asociatii/:id/abonament         alege un plan { planCod, codCupon? }: abonament nou, upgrade sau downgrade
 *   POST /api/asociatii/:id/pachete           cumpara un pachet de tokeni { pachetId }: emite comanda
 *   POST /api/asociatii/:id/actiuni           executa o actiune taxata { cod }: debiteaza tokenii
 *   POST /api/comenzi/:id/plata               plata simulata a unei comenzi
 *   POST /api/comenzi/:id/anulare             anuleaza o comanda in asteptare
 *
 * Toata logica este in nivelul Services; controller-ul doar citeste cererea si converteste raspunsul in DTO.
 */
export class MonetizareController {
  private readonly s: Pick<Dependente, "serviciuPlanuri" | "serviciuAbonamente" | "serviciuComenzi" | "serviciuPlati" | "serviciuTokeni" | "serviciuCupoane" | "magistralaEvenimente" | "db">;

  constructor(dep: Dependente) {
    this.s = dep;
  }

  planuri = async (_req: Request, res: Response) => {
    res.json((await this.s.serviciuPlanuri.getPlanuri()).map(planDto));
  };

  pachete = async (_req: Request, res: Response) => {
    res.json((await this.s.serviciuPlanuri.getPachete()).map(pachetDto));
  };

  actiuni = async (_req: Request, res: Response) => {
    res.json((await this.s.serviciuPlanuri.getActiuni()).map(actiuneDto));
  };

  verificaCupon = async (req: Request, res: Response) => {
    const plan = await this.planDupaCod(String(req.query.planCod ?? ""));
    const cupon = await this.s.serviciuCupoane.valideazaPentruPlan(this.s.db, String(req.query.cod ?? ""), plan);
    const pret = plan.pretLunar.mul(cupon.procentReducere.neg().add(100)).div(100).toDecimalPlaces(2);
    res.json({ cod: cupon.cod, reducereProcent: cupon.procentReducere.toNumber(), planCod: plan.cod, pretInitial: plan.pretLunar.toFixed(2), pretRedus: pret.toFixed(2) });
  };

  asociatii = async (_req: Request, res: Response) => {
    res.json(await this.s.serviciuAbonamente.getAsociatii());
  };

  stare = async (req: Request, res: Response) => {
    res.json(stareDto(await this.s.serviciuAbonamente.getStareAsociatie(id(req))));
  };

  alegePlan = async (req: Request, res: Response) => {
    const corp = (req.body ?? {}) as { planCod?: unknown; codCupon?: unknown };
    const plan = await this.planDupaCod(typeof corp.planCod === "string" ? corp.planCod : "");
    const codCupon = typeof corp.codCupon === "string" && corp.codCupon.trim() !== "" ? corp.codCupon.trim().toUpperCase() : null;
    const rezultat = await this.s.serviciuComenzi.alegePlan(id(req), plan.id, { codCupon });
    res.status(rezultat.tip === "COMANDA" ? 201 : 200).json(rezultatPlanDto(rezultat));
  };

  cumparaPachet = async (req: Request, res: Response) => {
    const pachetId = Number((req.body ?? {}).pachetId);
    if (!Number.isInteger(pachetId) || pachetId < 1) throw new EroareBusiness("DATE_INVALIDE", "Alege un pachet din listă.", "pachetId");
    const comanda = await this.s.serviciuComenzi.comandaPachet(id(req), pachetId);
    res.status(201).json({ mesaj: `Comanda ${comanda.referinta} (${comanda.suma.toFixed(2).replace(".", ",")} lei) a fost emisă. Plătește-o ca să primești tokenii.`, comanda: { id: comanda.id, referinta: comanda.referinta, suma: comanda.suma.toFixed(2) } });
  };

  executaActiune = async (req: Request, res: Response) => {
    const cod = String((req.body ?? {}).cod ?? "");
    const r = await this.s.serviciuTokeni.debiteaza(id(req), cod);
    res.json({ mesaj: `${r.actiune}: ${r.cost} tokeni consumați. Sold rămas: ${r.sold} tokeni.`, ...r });
  };

  plateste = async (req: Request, res: Response) => {
    const p = await this.s.serviciuPlati.plateste(id(req));
    // consumatorii evenimentului PlataEfectuata (factura, notificare, audit) ruleaza separat de tranzactie;
    // raspunsul asteapta sa termine, ca pagina care se reincarca dupa plata sa vada deja factura
    await this.s.magistralaEvenimente.asteaptaConsumatorii();
    res.json({
      mesaj: p.tip === "ABONAMENT"
        ? `Plata ${p.referinta} (${p.suma.replace(".", ",")} lei) a fost înregistrată. ${p.descriere} este activ: ${p.tokeniAlocati} tokeni alocați.`
        : `Plata ${p.referinta} (${p.suma.replace(".", ",")} lei) a fost înregistrată: ${p.tokeniAlocati} tokeni extra adăugați.`,
      plata: p,
    });
  };

  anuleaza = async (req: Request, res: Response) => {
    const c = await this.s.serviciuComenzi.anuleaza(id(req));
    res.json({ mesaj: `Comanda ${c.referinta} a fost anulată.`, comanda: { id: c.id, referinta: c.referinta } });
  };

  private async planDupaCod(cod: string) {
    const plan = await this.s.serviciuPlanuri.getPlanDupaCod(cod);
    if (!plan) throw new EroareBusiness("DATE_INVALIDE", `Nu există planul ${cod || "(gol)"}.`, "planCod");
    return plan;
  }
}

function id(req: Request): number {
  const n = Number(req.params.id);
  if (!Number.isInteger(n) || n < 1) throw new EroareBusiness("NEGASIT", `Id invalid: ${req.params.id}.`);
  return n;
}

