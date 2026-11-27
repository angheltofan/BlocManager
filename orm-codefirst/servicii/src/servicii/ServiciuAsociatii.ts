import type { Asociatie } from "librarie-modele";
import { CuiDuplicat, type AsociatieCuAbonament, type AsociatiiAccessor } from "nivel-acces-date";
import { EroareBusiness } from "../infrastructura/EroareBusiness.ts";
import type { Logger } from "../infrastructura/Logger.ts";

export type FormularAsociatie = { denumire: string; cui: string; adresa: string; iban: string; banca: string };

/**
 * ServiciuAsociatii: asociatiile clientilor (Index + Create in admin).
 * O asociatie noua primeste un portofel de tokeni gol; abonamentul se creeaza apoi din "Abonament nou".
 */
export class ServiciuAsociatii {
  private readonly asociatii: AsociatiiAccessor;
  private readonly log: Logger;

  constructor(dep: { asociatiiAccessor: AsociatiiAccessor; logger: Logger }) {
    this.asociatii = dep.asociatiiAccessor;
    this.log = dep.logger.pentru("ServiciuAsociatii");
  }

  getToate(): Promise<AsociatieCuAbonament[]> {
    return this.asociatii.getToate();
  }

  /** Valideaza si adauga o asociatie. Erorile pe campuri vin ca EroareBusiness DATE_INVALIDE, cu detalii. */
  async adauga(f: FormularAsociatie): Promise<Asociatie> {
    const date = {
      denumire: f.denumire.trim().replace(/\s+/g, " "),
      cui: f.cui.trim().toUpperCase().replace(/\s+/g, ""),
      adresa: f.adresa.trim().replace(/\s+/g, " "),
      iban: f.iban.trim().toUpperCase().replace(/\s+/g, ""),
      banca: f.banca.trim() || null,
    };
    const erori: Record<string, string> = {};
    if (date.denumire.length < 3 || date.denumire.length > 120) erori.denumire = "Scrie denumirea asociației (3–120 de caractere).";
    if (!/^(RO)?\d{2,10}$/.test(date.cui)) erori.cui = "CUI-ul are 2–10 cifre, opțional cu prefixul RO (ex. RO40000090).";
    if (date.adresa.length < 5 || date.adresa.length > 200) erori.adresa = "Scrie adresa (strada, numărul, localitatea).";
    if (!/^RO\d{2}[A-Z]{4}[A-Z0-9]{16}$/.test(date.iban)) erori.iban = "IBAN-ul românesc are 24 de caractere: RO, 2 cifre, codul băncii și 16 caractere (ex. RO49AAAA1B31007593840000).";
    if (date.banca && date.banca.length > 80) erori.banca = "Denumirea băncii are cel mult 80 de caractere.";
    if (Object.keys(erori).length) throw new EroareBusiness("DATE_INVALIDE", "Asociația nu a fost salvată. Corectează câmpurile marcate.", undefined, erori);

    try {
      const asociatie = await this.asociatii.adauga(date);
      this.log.info(`Asociație adăugată: ${asociatie.denumire}`, { id: asociatie.id, cui: asociatie.cui });
      return asociatie;
    } catch (e) {
      if (e instanceof CuiDuplicat) throw new EroareBusiness("CONFLICT", e.message, "cui");
      throw e;
    }
  }
}
