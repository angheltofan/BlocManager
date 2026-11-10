import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "librarie-modele";

/** Cum se incarca relatiile (de exemplu cupoanele unui plan): toate odata sau doar la acces. */
export type ModIncarcare = "eager" | "lazy";

/** Optiunile contextului: adaptorul PostgreSQL si jurnalizarea interogarilor ca evenimente. */
type OptiuniContext = {
  adapter: PrismaPg;
  log: [{ emit: "event"; level: "query" }];
};

function creeazaOptiuni(connectionString: string): OptiuniContext {
  return {
    adapter: new PrismaPg({ connectionString }),
    // fiecare interogare SQL trimisa la baza de date este semnalata ca eveniment "query"
    log: [{ emit: "event", level: "query" }],
  };
}

/**
 * Contextul bazei de date BlockManager: clasa derivata din PrismaClient,
 * echivalentul clasei derivate din DbContext in Entity Framework.
 *
 * Are cate o proprietate pentru fiecare entitate din LibrarieModele (this.plan, this.abonament, ...).
 * Sirul de conexiune vine din DATABASE_URL, iar modul de incarcare a relatiilor din INCARCARE_RELATII,
 * ambele din fisierul .env al aplicatiei (echivalentul app.config).
 */
export class BlockManagerContext extends PrismaClient<OptiuniContext> {
  /** Setarea care comuta intre eager loading si lazy loading. */
  readonly modIncarcare: ModIncarcare;

  /** Cate interogari SQL a trimis contextul de la creare (sau de la ultima resetare). */
  numarInterogari = 0;

  constructor(
    connectionString = process.env.DATABASE_URL,
    modIncarcare: ModIncarcare = citesteModIncarcare(process.env.INCARCARE_RELATII),
  ) {
    if (!connectionString) {
      throw new Error("Lipseste DATABASE_URL. Adauga in .env sirul de conexiune la baza de date blockmanager_codefirst.");
    }
    super(creeazaOptiuni(connectionString));
    this.modIncarcare = modIncarcare;
    this.$on("query", () => {
      this.numarInterogari++;
    });
  }

  /** Reseteaza contorul de interogari (folosit la compararea eager / lazy). */
  reseteazaContor(): void {
    this.numarInterogari = 0;
  }
}

function citesteModIncarcare(valoare: string | undefined): ModIncarcare {
  const v = (valoare ?? "eager").trim().toLowerCase();
  if (v !== "eager" && v !== "lazy") {
    throw new Error(`INCARCARE_RELATII trebuie sa fie "eager" sau "lazy", nu "${valoare}".`);
  }
  return v;
}
