import type { ActiuneTaxabila, PachetTokeni, Plan } from "librarie-modele";
import type { PlanuriAccessor } from "nivel-acces-date";
import type { BlockManagerContext } from "repository-codefirst";
import type { CacheMemorie } from "../infrastructura/CacheMemorie.ts";

const TTL = 600; // 10 minute: planurile, pachetele si costurile se schimba rar

/**
 * ServiciuPlanuri: oferta comerciala (planuri, pachete de tokeni, actiuni taxate), citita prin cache.
 */
export class ServiciuPlanuri {
  private readonly planuriAccessor: PlanuriAccessor;
  private readonly db: BlockManagerContext;
  private readonly cache: CacheMemorie;

  constructor(dep: { planuriAccessor: PlanuriAccessor; db: BlockManagerContext; cache: CacheMemorie }) {
    this.planuriAccessor = dep.planuriAccessor;
    this.db = dep.db;
    this.cache = dep.cache;
  }

  /** Planurile active, de la cel mai ieftin la cel mai scump. */
  getPlanuri(): Promise<Plan[]> {
    return this.cache.getSauIncarca("planuri", TTL, () => this.planuriAccessor.getToate());
  }

  async getPlanDupaCod(cod: string): Promise<Plan | null> {
    return (await this.getPlanuri()).find((p) => p.cod === cod.toUpperCase()) ?? null;
  }

  getPachete(): Promise<PachetTokeni[]> {
    return this.cache.getSauIncarca("pachete", TTL, () => this.db.pachetTokeni.findMany({ where: { activ: true }, orderBy: { tokeni: "asc" } }));
  }

  getActiuni(): Promise<ActiuneTaxabila[]> {
    return this.cache.getSauIncarca("actiuni", TTL, () => this.db.actiuneTaxabila.findMany({ orderBy: { costTokeni: "desc" } }));
  }
}
