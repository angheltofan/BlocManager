import type { AbonamentCuDetalii, DateAbonamentNou } from "nivel-acces-date";

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

export type EroriAbonament = Partial<Record<keyof AbonamentFormular | "general", string>>;

const lei = (v: { toFixed(n: number): string }) => v.toFixed(2).replace(".", ",");
const zi = (d: Date) => d.toISOString().slice(0, 10).split("-").reverse().join(".");

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

export function formularGol(): AbonamentFormular {
  return { asociatieId: "", planId: "", inceputPerioada: new Date().toISOString().slice(0, 10), codCupon: "", reinnoireAutomata: true };
}

/** Corpul cererii POST -> formular. Checkbox-ul nebifat lipseste din cerere, deci inseamna false. */
export function dinCorp(corp: Record<string, unknown>): AbonamentFormular {
  const text = (camp: string) => (typeof corp[camp] === "string" ? (corp[camp] as string).trim() : "");
  return {
    asociatieId: text("asociatieId"),
    planId: text("planId"),
    inceputPerioada: text("inceputPerioada"),
    codCupon: text("codCupon").toUpperCase(),
    reinnoireAutomata: corp.reinnoireAutomata === "on",
  };
}

/** Validarea formatului; regulile de business (asociatie fara abonament, cupon valabil) le verifica Accessorul. */
export function valideaza(f: AbonamentFormular): { ok: true; date: DateAbonamentNou } | { ok: false; erori: EroriAbonament } {
  const erori: EroriAbonament = {};
  const asociatieId = Number(f.asociatieId);
  if (!Number.isInteger(asociatieId) || asociatieId < 1) erori.asociatieId = "Alege asociația.";
  const planId = Number(f.planId);
  if (!Number.isInteger(planId) || planId < 1) erori.planId = "Alege planul.";
  const inceput = new Date(`${f.inceputPerioada}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.inceputPerioada) || Number.isNaN(inceput.getTime())) {
    erori.inceputPerioada = "Alege data de început a abonamentului.";
  }
  if (f.codCupon !== "" && !/^[A-Z0-9]{3,30}$/.test(f.codCupon)) {
    erori.codCupon = "Codul are între 3 și 30 de litere mari și cifre.";
  }
  if (Object.keys(erori).length > 0) return { ok: false, erori };
  return {
    ok: true,
    date: { asociatieId, planId, inceputPerioada: inceput, reinnoireAutomata: f.reinnoireAutomata, codCupon: f.codCupon || null },
  };
}
