import type { CuponCuPlan, DateCupon } from "nivel-acces-date";

/**
 * CuponViewModel: datele unui cupon de reducere, in forma folosita de view-uri
 * (echivalentul CompanyViewModel din ASP.NET MVC).
 *
 * Campurile formularului:
 * - casete text: cod, procentReducere, valabilPana (data), utilizariMaxime;
 * - lista de selectie: planId (planul pentru care e valabil cuponul, sau orice plan platit);
 * - checkbox: activ.
 */
export type CuponViewModel = {
  id: number | null;
  cod: string;
  procentReducere: string; // text, ca in formular: "20" sau "7,50"
  planId: number | null;
  planDenumire: string | null; // doar pentru afisare
  valabilPana: string; // AAAA-LL-ZZ, formatul controlului <input type="date">
  utilizariMaxime: string;
  utilizari: number; // doar pentru afisare: le creste plata simulata, nu formularul
  activ: boolean;
  stare: "ACTIV" | "INACTIV" | "EXPIRAT" | "EPUIZAT" | "STERS";
  stersLa: string | null; // ZZ.LL.AAAA, cand cuponul a fost sters logic
};

/** Erorile de validare, pe camp (cheia "general" = eroare care nu tine de un singur camp). */
export type EroriCupon = Partial<Record<"cod" | "procentReducere" | "planId" | "valabilPana" | "utilizariMaxime" | "general", string>>;

/** O optiune a listei de selectie a planului. */
export type OptiunePlan = { valoare: string; text: string };

export function cuponGol(): CuponViewModel {
  const peste30Zile = new Date(Date.now() + 30 * 24 * 3600 * 1000);
  return {
    id: null,
    cod: "",
    procentReducere: "",
    planId: null,
    planDenumire: null,
    valabilPana: peste30Zile.toISOString().slice(0, 10),
    utilizariMaxime: "1",
    utilizari: 0,
    activ: true,
    stare: "ACTIV",
    stersLa: null,
  };
}

/** Entitate (din NivelAccesDate) -> ViewModel. */
export function dinEntitate(c: CuponCuPlan, azi = new Date()): CuponViewModel {
  const valabilPana = c.valabilPana.toISOString().slice(0, 10);
  const ziCurenta = azi.toISOString().slice(0, 10);
  return {
    id: c.id,
    cod: c.cod,
    procentReducere: c.procentReducere.toFixed(2).replace(/\.?0+$/, "").replace(".", ","),
    planId: c.planId,
    planDenumire: c.plan?.denumire ?? null,
    valabilPana,
    utilizariMaxime: String(c.utilizariMaxime),
    utilizari: c.utilizari,
    activ: c.activ,
    stersLa: c.stersLa ? c.stersLa.toISOString().slice(0, 10).split("-").reverse().join(".") : null,
    stare: c.stersLa ? "STERS" : !c.activ ? "INACTIV" : c.utilizari >= c.utilizariMaxime ? "EPUIZAT" : valabilPana < ziCurenta ? "EXPIRAT" : "ACTIV",
  };
}

/**
 * Formular (corpul cererii POST) -> ViewModel. Pastreaza exact ce a scris utilizatorul,
 * ca formularul sa fie reafisat neschimbat cand are erori.
 * Un checkbox nebifat nu este trimis deloc de browser, deci lipsa lui inseamna false.
 */
export function dinFormular(corp: Record<string, unknown>, id: number | null = null): CuponViewModel {
  const text = (camp: string) => (typeof corp[camp] === "string" ? (corp[camp] as string).trim() : "");
  const plan = text("planId");
  return {
    ...cuponGol(),
    id,
    cod: text("cod").toUpperCase(),
    procentReducere: text("procentReducere"),
    planId: plan === "" ? null : Number(plan),
    valabilPana: text("valabilPana"),
    utilizariMaxime: text("utilizariMaxime"),
    activ: corp.activ === "on" || corp.activ === "true",
  };
}

/** Valideaza ViewModel-ul. Intoarce datele pentru Accessor sau erorile de afisat in formular. */
export function valideaza(
  vm: CuponViewModel,
  planuriValide: number[],
): { ok: true; date: DateCupon } | { ok: false; erori: EroriCupon } {
  const erori: EroriCupon = {};

  if (!/^[A-Z0-9]{3,30}$/.test(vm.cod)) {
    erori.cod = "Codul are între 3 și 30 de caractere: doar litere mari fără diacritice și cifre.";
  }

  const procentText = vm.procentReducere.replace(",", ".");
  const procent = Number(procentText);
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(procentText) || procent <= 0 || procent > 100) {
    erori.procentReducere = "Procentul este un număr între 0,01 și 100, cu cel mult două zecimale.";
  }

  if (vm.planId !== null && !planuriValide.includes(vm.planId)) {
    erori.planId = "Alege un plan din listă.";
  }

  const data = new Date(`${vm.valabilPana}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(vm.valabilPana) || Number.isNaN(data.getTime())) {
    erori.valabilPana = "Alege data până la care este valabil cuponul.";
  }

  const utilizariMaxime = Number(vm.utilizariMaxime);
  if (!Number.isInteger(utilizariMaxime) || utilizariMaxime < 1 || utilizariMaxime > 100000) {
    erori.utilizariMaxime = "Numărul maxim de utilizări este un număr întreg, cel puțin 1.";
  } else if (utilizariMaxime < vm.utilizari) {
    erori.utilizariMaxime = `Cuponul a fost deja folosit de ${vm.utilizari} ori; maximul nu poate fi mai mic.`;
  }

  if (Object.keys(erori).length > 0) return { ok: false, erori };
  return {
    ok: true,
    date: { cod: vm.cod, procentReducere: procent.toFixed(2), planId: vm.planId, valabilPana: data, utilizariMaxime, activ: vm.activ },
  };
}
