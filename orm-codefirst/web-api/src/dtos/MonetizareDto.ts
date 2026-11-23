/**
 * Modelele returnate de endpoint-urile sectiunii de utilizator (planuri, abonament, portofel, comenzi).
 * Sunt diferite de modelele bazei de date: sumele sunt text cu doua zecimale, datele sunt AAAA-LL-ZZ,
 * relatiile sunt aplatizate, iar campurile interne (createdAt, chei straine) nu sunt expuse.
 */
import type { Dependente, RezultatAlegerePlan } from "servicii";

type Stare = Awaited<ReturnType<Dependente["serviciuAbonamente"]["getStareAsociatie"]>>;
type Plan = Awaited<ReturnType<Dependente["serviciuPlanuri"]["getPlanuri"]>>[number];
type Pachet = Awaited<ReturnType<Dependente["serviciuPlanuri"]["getPachete"]>>[number];
type Actiune = Awaited<ReturnType<Dependente["serviciuPlanuri"]["getActiuni"]>>[number];
type ComandaPlan = Stare["comenziInAsteptare"][number];

const bani = (v: { toFixed(n: number): string }) => v.toFixed(2);
const zi = (d: Date) => d.toISOString().slice(0, 10);

export type PlanDto = {
  cod: string;
  denumire: string;
  descriere: string | null;
  pretLunar: string;
  pretAnual: string | null;
  tokeniLunari: number;
  maxApartamente: number | null;
  maxBlocuri: number | null;
  raportAnual: boolean;
  recomandat: boolean;
};

export const planDto = (p: Plan): PlanDto => ({
  cod: p.cod,
  denumire: p.denumire,
  descriere: p.descriere,
  pretLunar: bani(p.pretLunar),
  pretAnual: p.pretAnual ? bani(p.pretAnual) : null,
  tokeniLunari: p.tokeniLunari,
  maxApartamente: p.maxApartamente,
  maxBlocuri: p.maxBlocuri,
  raportAnual: p.raportAnual,
  recomandat: p.recomandat,
});

export const pachetDto = (p: Pachet) => ({ id: p.id, denumire: p.denumire, tokeni: p.tokeni, pret: bani(p.pret) });

export const actiuneDto = (a: Actiune) => ({ cod: a.cod, denumire: a.denumire, costTokeni: a.costTokeni });

export const comandaDto = (c: ComandaPlan) => ({
  id: c.id,
  referinta: c.referinta,
  tip: c.tip,
  descriere: c.plan ? `Abonament ${c.plan.denumire}` : (c.pachet?.denumire ?? c.tip),
  suma: bani(c.suma),
  status: c.status,
  emisa: zi(c.createdAt),
});

/** Starea completa a unei asociatii, pentru pagina "Abonamentul meu". */
export const stareDto = (s: Stare) => ({
  asociatie: s.asociatie,
  abonament: s.abonament
    ? {
        id: s.abonament.id,
        planCod: s.abonament.plan.cod,
        planDenumire: s.abonament.plan.denumire,
        pretLunar: bani(s.abonament.plan.pretLunar),
        tokeniLunari: s.abonament.plan.tokeniLunari,
        raportAnual: s.abonament.plan.raportAnual,
        status: s.abonament.status,
        inceputPerioada: zi(s.abonament.inceputPerioada),
        sfarsitPerioada: zi(s.abonament.sfarsitPerioada),
        reinnoireAutomata: s.abonament.reinnoireAutomata,
        planUrmator: s.abonament.planUrmator ? { cod: s.abonament.planUrmator.cod, denumire: s.abonament.planUrmator.denumire } : null,
      }
    : null,
  portofel: s.portofel
    ? { tokeniPlan: s.portofel.tokeniPlan, tokeniExtra: s.portofel.tokeniExtra, sold: s.portofel.tokeniPlan + s.portofel.tokeniExtra }
    : { tokeniPlan: 0, tokeniExtra: 0, sold: 0 },
  comenziInAsteptare: s.comenziInAsteptare.map(comandaDto),
  jurnal: s.jurnal.map((t) => ({
    data: t.createdAt.toISOString(),
    tip: t.tip,
    cantitate: t.cantitate,
    soldDupa: t.soldDupa,
    descriere: t.descriere ?? t.actiune?.denumire ?? "",
  })),
  facturi: s.facturi.map((f) => ({
    numar: f.numar,
    dataEmitere: zi(f.dataEmitere),
    comanda: f.comanda.referinta,
    descriere: f.comanda.plan ? `Abonament ${f.comanda.plan.denumire}` : (f.comanda.pachet?.denumire ?? ""),
    subtotal: bani(f.subtotal),
    tva: bani(f.tva),
    total: bani(f.total),
  })),
});

export const rezultatPlanDto = (r: RezultatAlegerePlan) => ({
  rezultat: r.tip,
  mesaj: r.mesaj,
  abonamentId: r.abonament.id,
  comanda: r.tip === "COMANDA" ? { id: r.comanda.id, referinta: r.comanda.referinta, suma: bani(r.comanda.suma) } : null,
});
