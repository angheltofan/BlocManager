/**
 * Containerul de dependency injection (awilix).
 *
 * Toate clasele (accesori, servicii, infrastructura, consumatori) sunt inregistrate aici o singura data;
 * fiecare primeste dependentele prin constructor, dupa nume (modul PROXY: constructorul primeste
 * un obiect cu dependentele cerute). Controllerele din web-mvc si web-api cer serviciile din container,
 * nu le creeaza singure.
 */
import { asClass, asFunction, asValue, createContainer, InjectionMode, Lifetime, type AwilixContainer } from "awilix";
import { AbonamenteAccessor, AsociatiiAccessor, CupoaneAccessor, NotificariAccessor, PacheteAccessor, PlanuriAccessor } from "nivel-acces-date";
import { getContext, type BlockManagerContext } from "repository-codefirst";
import { ConsumatorAudit } from "./evenimente/ConsumatorAudit.ts";
import { ConsumatorFacturi } from "./evenimente/ConsumatorFacturi.ts";
import { ConsumatorNotificari } from "./evenimente/ConsumatorNotificari.ts";
import { CacheMemorie } from "./infrastructura/CacheMemorie.ts";
import { Logger } from "./infrastructura/Logger.ts";
import { MagistralaEvenimente } from "./infrastructura/MagistralaEvenimente.ts";
import { ServiciuAbonamente } from "./servicii/ServiciuAbonamente.ts";
import { ServiciuComenzi } from "./servicii/ServiciuComenzi.ts";
import { ServiciuAsociatii } from "./servicii/ServiciuAsociatii.ts";
import { ServiciuCupoane } from "./servicii/ServiciuCupoane.ts";
import { ServiciuNotificari } from "./servicii/ServiciuNotificari.ts";
import { ServiciuPachete } from "./servicii/ServiciuPachete.ts";
import { ServiciuPlanuri } from "./servicii/ServiciuPlanuri.ts";
import { ServiciuPlati } from "./servicii/ServiciuPlati.ts";
import { ServiciuReinnoire } from "./servicii/ServiciuReinnoire.ts";
import { ServiciuTokeni } from "./servicii/ServiciuTokeni.ts";

export type Dependente = {
  db: BlockManagerContext;
  logger: Logger;
  cache: CacheMemorie;
  magistralaEvenimente: MagistralaEvenimente;
  planuriAccessor: PlanuriAccessor;
  cupoaneAccessor: CupoaneAccessor;
  abonamenteAccessor: AbonamenteAccessor;
  pacheteAccessor: PacheteAccessor;
  asociatiiAccessor: AsociatiiAccessor;
  notificariAccessor: NotificariAccessor;
  serviciuPlanuri: ServiciuPlanuri;
  serviciuCupoane: ServiciuCupoane;
  serviciuPachete: ServiciuPachete;
  serviciuAsociatii: ServiciuAsociatii;
  serviciuNotificari: ServiciuNotificari;
  serviciuTokeni: ServiciuTokeni;
  serviciuComenzi: ServiciuComenzi;
  serviciuPlati: ServiciuPlati;
  serviciuAbonamente: ServiciuAbonamente;
  serviciuReinnoire: ServiciuReinnoire;
  consumatorFacturi: ConsumatorFacturi;
  consumatorNotificari: ConsumatorNotificari;
  consumatorAudit: ConsumatorAudit;
};

export type Container = AwilixContainer<Dependente>;

/** Creeaza containerul aplicatiei; "sursa" apare in loguri (de exemplu "admin-mvc" sau "api"). */
export function creeazaContainer(sursa: string): Container {
  const container = createContainer<Dependente>({ injectionMode: InjectionMode.PROXY, strict: true });
  const singleton = { lifetime: Lifetime.SINGLETON };

  container.register({
    // infrastructura
    db: asValue(getContext()),
    logger: asValue(new Logger(sursa)),
    cache: asClass(CacheMemorie, singleton),
    magistralaEvenimente: asClass(MagistralaEvenimente, singleton),
    // nivelul de acces la date (accesorii primesc contextul comun)
    planuriAccessor: asFunction(({ db }: Dependente) => new PlanuriAccessor(db), singleton),
    cupoaneAccessor: asFunction(({ db }: Dependente) => new CupoaneAccessor(db), singleton),
    abonamenteAccessor: asFunction(({ db }: Dependente) => new AbonamenteAccessor(db), singleton),
    pacheteAccessor: asFunction(({ db }: Dependente) => new PacheteAccessor(db), singleton),
    asociatiiAccessor: asFunction(({ db }: Dependente) => new AsociatiiAccessor(db), singleton),
    notificariAccessor: asFunction(({ db }: Dependente) => new NotificariAccessor(db), singleton),
    // nivelul de servicii
    serviciuPlanuri: asClass(ServiciuPlanuri, singleton),
    serviciuCupoane: asClass(ServiciuCupoane, singleton),
    serviciuPachete: asClass(ServiciuPachete, singleton),
    serviciuAsociatii: asClass(ServiciuAsociatii, singleton),
    serviciuNotificari: asClass(ServiciuNotificari, singleton),
    serviciuTokeni: asClass(ServiciuTokeni, singleton),
    serviciuComenzi: asClass(ServiciuComenzi, singleton),
    serviciuPlati: asClass(ServiciuPlati, singleton),
    serviciuAbonamente: asClass(ServiciuAbonamente, singleton),
    serviciuReinnoire: asClass(ServiciuReinnoire, singleton),
    // consumatorii evenimentelor
    consumatorFacturi: asClass(ConsumatorFacturi, singleton),
    consumatorNotificari: asClass(ConsumatorNotificari, singleton),
    consumatorAudit: asClass(ConsumatorAudit, singleton),
  });

  // consumatorii se aboneaza la magistrala la pornire
  const magistrala = container.cradle.magistralaEvenimente;
  container.cradle.consumatorFacturi.inregistreaza(magistrala);
  container.cradle.consumatorNotificari.inregistreaza(magistrala);
  container.cradle.consumatorAudit.inregistreaza(magistrala);

  // jobul zilnic, optional, la un interval in minute (JOB_INTERVAL_MINUTE din .env)
  const minute = Number(process.env.JOB_INTERVAL_MINUTE ?? 0);
  if (minute > 0) {
    const job = setInterval(() => void container.cradle.serviciuReinnoire.ruleaza().catch((e) => container.cradle.logger.eroare("Job zilnic eșuat", { eroare: String(e) })), minute * 60_000);
    job.unref();
  }

  container.cradle.logger.info(`Container DI pregătit`, { inregistrari: Object.keys(container.registrations).length, consumatoriPlata: magistrala.numeConsumatori("PlataEfectuata") });
  return container;
}
