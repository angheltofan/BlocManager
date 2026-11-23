/**
 * CuponDto: modelul returnat de endpoint-urile GET (diferit de entitatea CuponReducere din baza de date).
 *
 * Fata de entitate:
 * - procentReducere (Decimal) devine reducereProcent (number);
 * - relatia plan devine doua campuri simple, planCod si planDenumire;
 * - valabilPana (DateTime) devine text AAAA-LL-ZZ;
 * - se adauga campuri calculate: utilizariRamase si stare;
 * - createdAt nu este expus.
 */
export type CuponDto = {
  id: number;
  cod: string;
  reducereProcent: number;
  planCod: string | null; // null = valabil pentru orice plan platit
  planDenumire: string | null;
  valabilPana: string;
  utilizari: number;
  utilizariMaxime: number;
  utilizariRamase: number;
  activ: boolean;
  stare: "ACTIV" | "INACTIV" | "EXPIRAT" | "EPUIZAT";
};
