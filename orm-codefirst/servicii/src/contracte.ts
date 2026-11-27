/**
 * Contractele nivelului de servicii (echivalentul interfetelor ICompanies / ICarDbContext din laborator).
 *
 * Controllerele (web-mvc, web-api) si serviciile care folosesc alte servicii depind doar de aceste interfete.
 * Containerul DI (container.ts) leaga fiecare nume de implementarea lui: "serviciuCupoane" -> ServiciuCupoane.
 * O implementare se poate inlocui (de exemplu cu una de test) fara modificari in controllere.
 */
import type { ActiuneTaxabila, Asociatie, ComandaSimulata, CuponReducere, PachetTokeni, Plan, PortofelTokeni, TranzactieTokeni } from "librarie-modele";
import type {
  AsociatieCuAbonament,
  CuponCuPlan,
  DateCupon,
  NotificareCuDestinatar,
  PachetCuComenzi,
  PachetCuIstoric,
} from "nivel-acces-date";
import type { Evenimente } from "./infrastructura/MagistralaEvenimente.ts";
import type { DateModificareAbonament, ServiciuAbonamente } from "./servicii/ServiciuAbonamente.ts";
import type { FormularAsociatie } from "./servicii/ServiciuAsociatii.ts";
import type { OptiuniAbonament, RezultatAlegerePlan, ServiciuComenzi } from "./servicii/ServiciuComenzi.ts";
import type { RezultatReinnoire } from "./servicii/ServiciuReinnoire.ts";
import type { RezultatDebitare } from "./servicii/ServiciuTokeni.ts";
import type { Tx } from "./servicii/utilitare.ts";

/** Rezultatul (fara Promise) al unei metode a carei forma o da Prisma. */
type Rezultat<F extends (...a: never[]) => unknown> = Awaited<ReturnType<F>>;

export interface IServiciuPlanuri {
  getPlanuri(): Promise<Plan[]>;
  getPlanDupaCod(cod: string): Promise<Plan | null>;
  getPachete(): Promise<PachetTokeni[]>;
  getActiuni(): Promise<ActiuneTaxabila[]>;
}

export interface IServiciuCupoane {
  getToate(inclusivSterse?: boolean): Promise<CuponCuPlan[]>;
  getDupaId(id: number): Promise<CuponCuPlan>;
  adauga(date: DateCupon): Promise<CuponReducere>;
  modifica(id: number, date: DateCupon): Promise<CuponReducere>;
  sterge(id: number): Promise<void>;
  restaureaza(id: number): Promise<void>;
  valideazaPentruPlan(tx: Tx, cod: string, plan: Plan): Promise<CuponReducere>;
  folosesteCupon(tx: Tx, cuponId: number): Promise<void>;
}

export interface IServiciuPachete {
  getToate(inclusivSterse?: boolean): Promise<PachetCuComenzi[]>;
  getCuIstoric(id: number): Promise<PachetCuIstoric>;
  sterge(id: number): Promise<PachetTokeni>;
  restaureaza(id: number): Promise<PachetTokeni>;
}

export interface IServiciuNotificari {
  getToate(): Promise<NotificareCuDestinatar[]>;
  getDupaId(id: number): Promise<NotificareCuDestinatar>;
  marcheazaCitita(id: number): Promise<void>;
  sterge(id: number): Promise<void>;
  stergeCitite(): Promise<number>;
}

export interface IServiciuAsociatii {
  getToate(): Promise<AsociatieCuAbonament[]>;
  adauga(f: FormularAsociatie): Promise<Asociatie>;
}

export interface IServiciuTokeni {
  getPortofel(asociatieId: number): Promise<PortofelTokeni | null>;
  getJurnal(asociatieId: number, numar?: number): Promise<(TranzactieTokeni & { actiune: { denumire: string } | null })[]>;
  debiteaza(asociatieId: number, codActiune: string): Promise<RezultatDebitare>;
  asiguraPortofel(tx: Tx, asociatieId: number): Promise<PortofelTokeni>;
  expiraTokeniPlan(tx: Tx, portofel: PortofelTokeni, descriere: string): Promise<PortofelTokeni>;
  alocaTokeniPlan(tx: Tx, portofel: PortofelTokeni, tokeni: number, descriere: string, comandaId?: number): Promise<PortofelTokeni>;
  adaugaTokeniExtra(tx: Tx, portofel: PortofelTokeni, tokeni: number, descriere: string, comandaId: number): Promise<PortofelTokeni>;
}

export interface IServiciuComenzi {
  getInAsteptare(asociatieId: number): Promise<Rezultat<ServiciuComenzi["getInAsteptare"]>>;
  alegePlan(asociatieId: number, planId: number, optiuni?: OptiuniAbonament): Promise<RezultatAlegerePlan>;
  comandaPachet(asociatieId: number, pachetId: number): Promise<ComandaSimulata>;
  anuleaza(comandaId: number): Promise<ComandaSimulata>;
  emiteComandaAbonament(tx: Tx, asociatieId: number, abonamentId: number, plan: Plan, codCupon?: string | null): Promise<ComandaSimulata>;
}

export interface IServiciuPlati {
  plateste(comandaId: number): Promise<Evenimente["PlataEfectuata"]>;
}

export interface IServiciuAbonamente {
  getToate(): Promise<Rezultat<ServiciuAbonamente["getToate"]>>;
  getAsociatiiFaraAbonamentCurent(): Promise<Rezultat<ServiciuAbonamente["getAsociatiiFaraAbonamentCurent"]>>;
  getAsociatii(): Promise<Rezultat<ServiciuAbonamente["getAsociatii"]>>;
  getDetalii(id: number): Promise<Rezultat<ServiciuAbonamente["getDetalii"]>>;
  getStareAsociatie(asociatieId: number): Promise<Rezultat<ServiciuAbonamente["getStareAsociatie"]>>;
  creeaza(asociatieId: number, planId: number, optiuni: OptiuniAbonament): Promise<RezultatAlegerePlan>;
  modifica(id: number, date: DateModificareAbonament): Promise<Rezultat<ServiciuAbonamente["modifica"]>>;
  anuleaza(id: number): Promise<Rezultat<ServiciuAbonamente["anuleaza"]>>;
}

export interface IServiciuReinnoire {
  ruleaza(moment?: Date): Promise<RezultatReinnoire>;
}
