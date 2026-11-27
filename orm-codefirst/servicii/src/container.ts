/**
 * Containerul de dependency injection (awilix).
 *
 * Toate clasele (accesori, servicii, infrastructura, consumatori) sunt inregistrate aici o singura data;
 * fiecare primeste dependentele prin constructor, dupa nume (modul PROXY: constructorul primeste
 * un obiect cu dependentele cerute). Controllerele din web-mvc si web-api cer serviciile din container,
 * nu le creeaza singure, si depind doar de interfetele din contracte.ts.
 *
 * Durata de viata (Laboratorul 10) se alege din .env, cu DURATA_VIATA_SERVICII:
 *   singleton  (implicit) un singur obiect pentru tot procesul;
 *   scoped     un obiect pentru fiecare cerere HTTP (scope creat de server.ts la fiecare cerere);
 *   transient  un obiect nou la fiecare rezolvare (fiecare dependenta primeste propria instanta).
 * Se aplica accesorilor si serviciilor. Infrastructura (contextul bazei de date, logger, cache, magistrala de
 * evenimente) si consumatorii raman Singleton: pastreaza stare comuna (conexiunile, cache-ul, abonarile).
 */
import { asClass, asFunction, asValue, createContainer, InjectionMode, Lifetime, type AwilixContainer, type LifetimeType } from "awilix";
import { AbonamenteAccessor, AsociatiiAccessor, CupoaneAccessor, NotificariAccessor, PacheteAccessor, PlanuriAccessor } from "nivel-acces-date";
import { getContext, type BlockManagerContext } from "repository-codefirst";
import { ConsumatorAudit } from "./evenimente/ConsumatorAudit.ts";
import { ConsumatorFacturi } from "./evenimente/ConsumatorFacturi.ts";
import { ConsumatorNotificari } from "./evenimente/ConsumatorNotificari.ts";
import { CacheMemorie } from "./infrastructura/CacheMemorie.ts";
import { Logger } from "./infrastructura/Logger.ts";
import { MagistralaEvenimente } from "./infrastructura/MagistralaEvenimente.ts";
import { MonitorInstante } from "./infrastructura/MonitorInstante.ts";
import type {
  IServiciuAbonamente,
  IServiciuAsociatii,
  IServiciuComenzi,
  IServiciuCupoane,
  IServiciuNotificari,
  IServiciuPachete,
  IServiciuPlanuri,
  IServiciuPlati,
  IServiciuReinnoire,
  IServiciuTokeni,
} from "./contracte.ts";
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
  serviciuPlanuri: IServiciuPlanuri;
  serviciuCupoane: IServiciuCupoane;
  serviciuPachete: IServiciuPachete;
  serviciuAsociatii: IServiciuAsociatii;
  serviciuNotificari: IServiciuNotificari;
  serviciuTokeni: IServiciuTokeni;
  serviciuComenzi: IServiciuComenzi;
  serviciuPlati: IServiciuPlati;
  serviciuAbonamente: IServiciuAbonamente;
  serviciuReinnoire: IServiciuReinnoire;
  consumatorFacturi: ConsumatorFacturi;
  consumatorNotificari: ConsumatorNotificari;
  consumatorAudit: ConsumatorAudit;
  monitorInstante: MonitorInstante;
  durataViata: DurataViata;
};

export type Container = AwilixContainer<Dependente>;

export type DurataViata = "singleton" | "scoped" | "transient";
const DURATE: Record<DurataViata, LifetimeType> = { singleton: Lifetime.SINGLETON, scoped: Lifetime.SCOPED, transient: Lifetime.TRANSIENT };

/** Durata de viata din .env (DURATA_VIATA_SERVICII); o valoare necunoscuta inseamna singleton. */
export function citesteDurataViata(): DurataViata {
  const v = (process.env.DURATA_VIATA_SERVICII ?? "singleton").trim().toLowerCase();
  return v in DURATE ? (v as DurataViata) : "singleton";
}

/** Creeaza containerul aplicatiei; "sursa" apare in loguri (de exemplu "admin-mvc" sau "api"). */
export function creeazaContainer(sursa: string, durataViata: DurataViata = citesteDurataViata()): Container {
  const container = createContainer<Dependente>({ injectionMode: InjectionMode.PROXY, strict: true });
  const singleton = { lifetime: Lifetime.SINGLETON };
  const durata = { lifetime: DURATE[durataViata] };
  const monitor = new MonitorInstante();
  // fiecare obiect creat de container e numarat, ca sa se vada efectul duratei de viata
  const nou = <T extends object>(clasa: string, creeaza: () => T) => monitor.urmareste(clasa, creeaza());

  container.register({
    // infrastructura: mereu Singleton
    db: asValue(getContext()),
    logger: asValue(new Logger(sursa)),
    cache: asClass(CacheMemorie, singleton),
    magistralaEvenimente: asClass(MagistralaEvenimente, singleton),
    monitorInstante: asValue(monitor),
    durataViata: asValue(durataViata),
    // nivelul de acces la date (accesorii primesc contextul comun)
    planuriAccessor: asFunction(({ db }: Dependente) => nou("PlanuriAccessor", () => new PlanuriAccessor(db)), durata),
    cupoaneAccessor: asFunction(({ db }: Dependente) => nou("CupoaneAccessor", () => new CupoaneAccessor(db)), durata),
    abonamenteAccessor: asFunction(({ db }: Dependente) => nou("AbonamenteAccessor", () => new AbonamenteAccessor(db)), durata),
    pacheteAccessor: asFunction(({ db }: Dependente) => nou("PacheteAccessor", () => new PacheteAccessor(db)), durata),
    asociatiiAccessor: asFunction(({ db }: Dependente) => nou("AsociatiiAccessor", () => new AsociatiiAccessor(db)), durata),
    notificariAccessor: asFunction(({ db }: Dependente) => nou("NotificariAccessor", () => new NotificariAccessor(db)), durata),
    // nivelul de servicii: fiecare nume este legat de implementarea interfetei lui
    serviciuPlanuri: asFunction((d: Dependente) => nou("ServiciuPlanuri", () => new ServiciuPlanuri(d)), durata),
    serviciuCupoane: asFunction((d: Dependente) => nou("ServiciuCupoane", () => new ServiciuCupoane(d)), durata),
    serviciuPachete: asFunction((d: Dependente) => nou("ServiciuPachete", () => new ServiciuPachete(d)), durata),
    serviciuAsociatii: asFunction((d: Dependente) => nou("ServiciuAsociatii", () => new ServiciuAsociatii(d)), durata),
    serviciuNotificari: asFunction((d: Dependente) => nou("ServiciuNotificari", () => new ServiciuNotificari(d)), durata),
    serviciuTokeni: asFunction((d: Dependente) => nou("ServiciuTokeni", () => new ServiciuTokeni(d)), durata),
    serviciuComenzi: asFunction((d: Dependente) => nou("ServiciuComenzi", () => new ServiciuComenzi(d)), durata),
    serviciuPlati: asFunction((d: Dependente) => nou("ServiciuPlati", () => new ServiciuPlati(d)), durata),
    serviciuAbonamente: asFunction((d: Dependente) => nou("ServiciuAbonamente", () => new ServiciuAbonamente(d)), durata),
    serviciuReinnoire: asFunction((d: Dependente) => nou("ServiciuReinnoire", () => new ServiciuReinnoire(d)), durata),
    // consumatorii evenimentelor: Singleton, abonati o singura data la magistrala
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
    const job = setInterval(() => void container.createScope().cradle.serviciuReinnoire.ruleaza().catch((e) => container.cradle.logger.eroare("Job zilnic eșuat", { eroare: String(e) })), minute * 60_000);
    job.unref();
  }

  container.cradle.logger.info(`Container DI pregătit`, { durataViata, inregistrari: Object.keys(container.registrations).length, consumatoriPlata: magistrala.numeConsumatori("PlataEfectuata") });
  return container;
}
