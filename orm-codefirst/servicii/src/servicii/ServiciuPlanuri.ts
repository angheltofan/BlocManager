import type { ActiuneTaxabila, PachetTokeni, Plan } from "librarie-modele";
import type { PacheteAccessor, PlanuriAccessor } from "nivel-acces-date";
import type { BlockManagerContext } from "repository-codefirst";
import type { CacheMemorie } from "../infrastructura/CacheMemorie.ts";
import type { IServiciuPlanuri } from "../contracte.ts";

const TTL = 600; // 10 minute: planurile si costurile se schimba rar
// pachetele pot fi sterse logic din admin (alt proces, cu cache propriu): cache scurt, ca stergerea sa se vada repede
const TTL_PACHETE = 30;

/**
 * ServiciuPlanuri: oferta comerciala (planuri, pachete de tokeni, actiuni taxate), citita prin cache.
 */
export class ServiciuPlanuri implements IServiciuPlanuri {
  private readonly planuriAccessor: PlanuriAccessor;
  private readonly pacheteAccessor: PacheteAccessor;
  private readonly db: BlockManagerContext;
  private readonly cache: CacheMemorie;

  constructor(dep: { planuriAccessor: PlanuriAccessor; pacheteAccessor: PacheteAccessor; db: BlockManagerContext; cache: CacheMemorie }) {
    this.planuriAccessor = dep.planuriAccessor;
    this.pacheteAccessor = dep.pacheteAccessor;
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

  /** Pachetele oferite utilizatorilor: active si nesterse logic. */
  getPachete(): Promise<PachetTokeni[]> {
    return this.cache.getSauIncarca("pachete", TTL_PACHETE, () => this.pacheteAccessor.getOferite());
  }

  getActiuni(): Promise<ActiuneTaxabila[]> {
    return this.cache.getSauIncarca("actiuni", TTL, () => this.db.actiuneTaxabila.findMany({ orderBy: { costTokeni: "desc" } }));
  }
}
