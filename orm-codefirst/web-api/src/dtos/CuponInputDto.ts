/**
 * CuponInputDto: corpul (body-ul JSON) cererilor POST si PUT.
 * Planul se trimite prin cod ("PRO", "MAX") sau null, nu prin id-ul din baza de date.
 * Numarul de utilizari nu se trimite: il creste plata simulata.
 *
 * Exemplu:
 *   { "cod": "IARNA25", "reducereProcent": 12.5, "planCod": "MAX",
 *     "valabilPana": "2027-02-28", "utilizariMaxime": 40, "activ": true }
 */
export type CuponInputDto = {
  cod: string;
  reducereProcent: number;
  planCod: string | null;
  valabilPana: string;
  utilizariMaxime: number;
  activ: boolean;
};

export type EroriValidare = Partial<Record<keyof CuponInputDto, string>>;

/** Verifica tipurile si valorile din body. Intoarce DTO-ul curatat sau erorile pe campuri. */
export function valideazaInput(corp: unknown): { ok: true; dto: CuponInputDto } | { ok: false; erori: EroriValidare } {
  const erori: EroriValidare = {};
  const b = (typeof corp === "object" && corp !== null ? corp : {}) as Record<string, unknown>;

  const cod = typeof b.cod === "string" ? b.cod.trim().toUpperCase() : "";
  if (!/^[A-Z0-9]{3,30}$/.test(cod)) erori.cod = "Codul este obligatoriu: 3-30 litere mari fără diacritice și cifre.";

  const procent = b.reducereProcent;
  if (typeof procent !== "number" || !Number.isFinite(procent) || procent <= 0 || procent > 100 || Math.round(procent * 100) !== procent * 100) {
    erori.reducereProcent = "reducereProcent este un număr între 0.01 și 100, cu cel mult două zecimale.";
  }

  let planCod: string | null = null;
  if (b.planCod !== undefined && b.planCod !== null) {
    if (typeof b.planCod !== "string" || b.planCod.trim() === "") erori.planCod = "planCod este codul unui plan (PRO, MAX) sau null.";
    else planCod = b.planCod.trim().toUpperCase();
  }

  const valabilPana = typeof b.valabilPana === "string" ? b.valabilPana : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valabilPana) || Number.isNaN(new Date(`${valabilPana}T00:00:00Z`).getTime())) {
    erori.valabilPana = "valabilPana este o dată în formatul AAAA-LL-ZZ.";
  }

  const max = b.utilizariMaxime;
  if (typeof max !== "number" || !Number.isInteger(max) || max < 1 || max > 100000) {
    erori.utilizariMaxime = "utilizariMaxime este un număr întreg, cel puțin 1.";
  }

  if (b.activ !== undefined && typeof b.activ !== "boolean") erori.activ = "activ este true sau false.";

  if (Object.keys(erori).length > 0) return { ok: false, erori };
  return {
    ok: true,
    dto: { cod, reducereProcent: procent as number, planCod, valabilPana, utilizariMaxime: max as number, activ: b.activ !== false },
  };
}
