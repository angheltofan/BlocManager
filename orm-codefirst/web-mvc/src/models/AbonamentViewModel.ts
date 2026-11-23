import type { AbonamentCuDetalii } from "nivel-acces-date";
import type { DateModificareAbonament, Dependente, OptiuniAbonament } from "servicii";

/**
 * AbonamentViewModel: un abonament cu datele din tabelele legate prin chei straine
 * (echivalentul CarViewModel din aplicatia de la curs).
 *
 *   abonamente        id, perioada, status, reinnoireAutomata
 *   asociatii         asociatieDenumire, asociatieAdresa         (prin abonamente.asociatie_id)
 *   planuri           planCod, planDenumire, pretLunar, tokeni    (prin abonamente.plan_id)
 *   comenzi_simulate  comandaReferinta, comandaSuma, comandaStatus (prin comenzi_simulate.abonament_id)
 */
export type AbonamentViewModel = {
  id: number;
  asociatieDenumire: string;
  asociatieAdresa: string;
  planCod: string;
  planDenumire: string;
  pretLunar: string; // "49,00"
  tokeniLunari: number;
  inceputPerioada: string; // ZZ.LL.AAAA
  sfarsitPerioada: string;
  status: "ACTIV" | "SUSPENDAT" | "ANULAT" | "EXPIRAT";
  reinnoireAutomata: boolean;
  comandaReferinta: string | null;
  comandaSuma: string | null;
  comandaStatus: "IN_ASTEPTARE" | "ACHITATA" | "ANULATA" | null;
};

/** Datele formularului Create, exact cum le-a completat utilizatorul. */
export type AbonamentFormular = {
  asociatieId: string; // lista de selectie (cheia straina asociatie_id)
  planId: string; // lista de selectie (cheia straina plan_id)
  inceputPerioada: string; // AAAA-LL-ZZ
  codCupon: string;
  reinnoireAutomata: boolean;
};

/** Datele formularului Edit. */
export type AbonamentFormularEdit = {
  reinnoireAutomata: boolean;
  planUrmatorId: string; // "" = fara schimbare de plan
  sfarsitPerioada: string; // AAAA-LL-ZZ
};

export type EroriAbonament = Partial<Record<keyof AbonamentFormular | keyof AbonamentFormularEdit | "general", string>>;

export const lei = (v: { toFixed(n: number): string }) => v.toFixed(2).replace(".", ",");
export const zi = (d: Date) => d.toISOString().slice(0, 10).split("-").reverse().join(".");
const iso = (d: Date) => d.toISOString().slice(0, 10);
const esteData = (t: string) => /^\d{4}-\d{2}-\d{2}$/.test(t) && !Number.isNaN(new Date(`${t}T00:00:00Z`).getTime());

/** Entitate (cu relatiile incarcate) -> ViewModel. */
export function dinEntitate(a: AbonamentCuDetalii): AbonamentViewModel {
  const comanda = a.comenzi[0] ?? null;
  return {
    id: a.id,
    asociatieDenumire: a.asociatie.denumire,
    asociatieAdresa: a.asociatie.adresa,
    planCod: a.plan.cod,
    planDenumire: a.plan.denumire,
    pretLunar: lei(a.plan.pretLunar),
    tokeniLunari: a.plan.tokeniLunari,
    inceputPerioada: zi(a.inceputPerioada),
    sfarsitPerioada: zi(a.sfarsitPerioada),
    status: a.status,
    reinnoireAutomata: a.reinnoireAutomata,
    comandaReferinta: comanda?.referinta ?? null,
    comandaSuma: comanda ? lei(comanda.suma) : null,
    comandaStatus: comanda?.status ?? null,
  };
}

type Detalii = Awaited<ReturnType<Dependente["serviciuAbonamente"]["getDetalii"]>>;

/** Pagina Details: abonamentul, comenzile lui (cu facturi), portofelul si jurnalul de tokeni al asociatiei. */
export function detaliiDinEntitate({ abonament: a, portofel, jurnal }: Detalii) {
  return {
    id: a.id,
    asociatie: { denumire: a.asociatie.denumire, adresa: a.asociatie.adresa, cui: a.asociatie.cui },
    plan: { denumire: a.plan.denumire, pretLunar: lei(a.plan.pretLunar), tokeniLunari: a.plan.tokeniLunari },
    planUrmator: a.planUrmator?.denumire ?? null,
    inceputPerioada: zi(a.inceputPerioada),
    sfarsitPerioada: zi(a.sfarsitPerioada),
    status: a.status,
    reinnoireAutomata: a.reinnoireAutomata,
    curent: a.status === "ACTIV" || a.status === "SUSPENDAT",
    portofel: portofel ? { tokeniPlan: portofel.tokeniPlan, tokeniExtra: portofel.tokeniExtra, sold: portofel.tokeniPlan + portofel.tokeniExtra } : null,
    comenzi: a.comenzi.map((c) => ({
      referinta: c.referinta,
      suma: lei(c.suma),
      status: c.status,
      creata: zi(c.createdAt),
      achitataLa: c.achitataLa ? zi(c.achitataLa) : null,
      factura: c.factura ? c.factura.numar : null,
    })),
    jurnal: jurnal.map((t) => ({ data: zi(t.createdAt), tip: t.tip, cantitate: t.cantitate, soldDupa: t.soldDupa, descriere: t.descriere ?? t.actiune?.denumire ?? "" })),
  };
}

export function formularGol(): AbonamentFormular {
  return { asociatieId: "", planId: "", inceputPerioada: iso(new Date()), codCupon: "", reinnoireAutomata: true };
}

export function formularEditDinEntitate(a: Detalii["abonament"]): AbonamentFormularEdit {
  return { reinnoireAutomata: a.reinnoireAutomata, planUrmatorId: a.planUrmatorId ? String(a.planUrmatorId) : "", sfarsitPerioada: iso(a.sfarsitPerioada) };
}

const text = (corp: Record<string, unknown>, camp: string) => (typeof corp[camp] === "string" ? (corp[camp] as string).trim() : "");

/** Corpul cererii POST -> formular. Checkbox-ul nebifat lipseste din cerere, deci inseamna false. */
export function dinCorp(corp: Record<string, unknown>): AbonamentFormular {
  return {
    asociatieId: text(corp, "asociatieId"),
    planId: text(corp, "planId"),
    inceputPerioada: text(corp, "inceputPerioada"),
    codCupon: text(corp, "codCupon").toUpperCase(),
    reinnoireAutomata: corp.reinnoireAutomata === "on",
  };
}

export function dinCorpEdit(corp: Record<string, unknown>): AbonamentFormularEdit {
  return { reinnoireAutomata: corp.reinnoireAutomata === "on", planUrmatorId: text(corp, "planUrmatorId"), sfarsitPerioada: text(corp, "sfarsitPerioada") };
}

/** Validarea formatului; regulile de business (asociatie fara abonament, cupon valabil) le verifica nivelul Services. */
export function valideaza(
  f: AbonamentFormular,
): { ok: true; asociatieId: number; planId: number; optiuni: OptiuniAbonament } | { ok: false; erori: EroriAbonament } {
  const erori: EroriAbonament = {};
  const asociatieId = Number(f.asociatieId);
  if (!Number.isInteger(asociatieId) || asociatieId < 1) erori.asociatieId = "Alege asociația.";
  const planId = Number(f.planId);
  if (!Number.isInteger(planId) || planId < 1) erori.planId = "Alege planul.";
  if (!esteData(f.inceputPerioada)) erori.inceputPerioada = "Alege data de început a abonamentului.";
  if (f.codCupon !== "" && !/^[A-Z0-9]{3,30}$/.test(f.codCupon)) erori.codCupon = "Codul are între 3 și 30 de litere mari și cifre.";
  if (Object.keys(erori).length > 0) return { ok: false, erori };
  return {
    ok: true,
    asociatieId,
    planId,
    optiuni: { inceputPerioada: new Date(`${f.inceputPerioada}T00:00:00Z`), reinnoireAutomata: f.reinnoireAutomata, codCupon: f.codCupon || null },
  };
}

export function valideazaEdit(f: AbonamentFormularEdit): { ok: true; date: DateModificareAbonament } | { ok: false; erori: EroriAbonament } {
  const erori: EroriAbonament = {};
  if (!esteData(f.sfarsitPerioada)) erori.sfarsitPerioada = "Alege data de sfârșit a perioadei.";
  const planUrmatorId = f.planUrmatorId === "" ? null : Number(f.planUrmatorId);
  if (planUrmatorId !== null && (!Number.isInteger(planUrmatorId) || planUrmatorId < 1)) erori.planUrmatorId = "Alege un plan din listă.";
  if (Object.keys(erori).length > 0) return { ok: false, erori };
  return { ok: true, date: { reinnoireAutomata: f.reinnoireAutomata, planUrmatorId, sfarsitPerioada: new Date(`${f.sfarsitPerioada}T00:00:00Z`) } };
}
