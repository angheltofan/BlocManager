import { appendFileSync, mkdirSync } from "node:fs";
import path from "node:path";

export type NivelLog = "INFO" | "AVERTISMENT" | "EROARE";

/**
 * Logger-ul aplicatiei: fiecare mesaj ajunge in consola si, ca o linie JSON, in fisierul de log
 * (implicit orm-codefirst/logs/blockmanager.log). Liniile JSON se pot filtra usor (de exemplu dupa "sursa").
 */
export class Logger {
  private readonly fisier: string;

  constructor(
    private readonly sursa = "aplicatie",
    fisier = process.env.FISIER_LOG ?? path.resolve(import.meta.dirname, "../../../logs/blockmanager.log"),
  ) {
    this.fisier = fisier;
    mkdirSync(path.dirname(fisier), { recursive: true });
  }

  /** Un logger cu alta sursa (de exemplu "ServiciuPlati"), care scrie in acelasi fisier. */
  pentru(sursa: string): Logger {
    return new Logger(sursa, this.fisier);
  }

  info(mesaj: string, date?: Record<string, unknown>) {
    this.scrie("INFO", mesaj, date);
  }

  avertisment(mesaj: string, date?: Record<string, unknown>) {
    this.scrie("AVERTISMENT", mesaj, date);
  }

  eroare(mesaj: string, date?: Record<string, unknown>) {
    this.scrie("EROARE", mesaj, date);
  }

  private scrie(nivel: NivelLog, mesaj: string, date?: Record<string, unknown>) {
    const moment = new Date().toISOString();
    const linie = JSON.stringify({ moment, nivel, sursa: this.sursa, mesaj, ...(date ? { date } : {}) });
    try {
      appendFileSync(this.fisier, linie + "\n", "utf8");
    } catch {
      // logul in fisier nu are voie sa opreasca aplicatia
    }
    if (process.env.LOG_CONSOLA !== "nu") {
      const detalii = date ? " " + JSON.stringify(date) : "";
      const scrieConsola = nivel === "EROARE" ? console.error : console.log;
      scrieConsola(`${moment.slice(11, 19)} ${nivel.padEnd(11)} [${this.sursa}] ${mesaj}${detalii}`);
    }
  }
}
