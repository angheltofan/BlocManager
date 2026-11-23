import { appendFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import type { Evenimente, MagistralaEvenimente } from "../infrastructura/MagistralaEvenimente.ts";

/**
 * Consumatorul 3: jurnalul de audit al operatiilor financiare, separat de logul aplicatiei
 * (orm-codefirst/logs/audit-plati.log), cate o linie JSON pentru fiecare eveniment.
 */
export class ConsumatorAudit {
  private readonly fisier = process.env.FISIER_AUDIT ?? path.resolve(import.meta.dirname, "../../../logs/audit-plati.log");

  constructor() {
    mkdirSync(path.dirname(this.fisier), { recursive: true });
  }

  inregistreaza(magistrala: MagistralaEvenimente) {
    magistrala.abonare("PlataEfectuata", "ConsumatorAudit", async (e) => this.scrie("PlataEfectuata", e));
    magistrala.abonare("AbonamentSuspendat", "ConsumatorAudit", async (e) => this.scrie("AbonamentSuspendat", e));
  }

  private scrie(eveniment: keyof Evenimente, date: object) {
    appendFileSync(this.fisier, JSON.stringify({ moment: new Date().toISOString(), eveniment, ...date }) + "\n", "utf8");
  }
}
