/**
 * Maparea automata intre modelul bazei de date si modelele API-ului, cu AutoMapper (@automapper/core),
 * strategia "pojos" (obiecte TypeScript simple, fara clase si decoratori).
 *
 *   CuponReducere (entitate, cu relatia plan)  ->  CuponDto        (raspunsul GET)
 *   CuponInputDto (body POST/PUT)              ->  DateCupon       (datele pentru CupoaneAccessor)
 *
 * Campurile cu acelasi nume si tip (id, cod, utilizari, utilizariMaxime, activ) sunt copiate automat.
 * Pentru celelalte, forMember spune de unde vine valoarea.
 */
import { createMap, createMapper, forMember, mapFrom, mapWithArguments } from "@automapper/core";
import { PojosMetadataMap, pojos } from "@automapper/pojos";
import type { CuponCuPlan, DateCupon } from "nivel-acces-date";
import type { CuponDto } from "../dtos/CuponDto.ts";
import type { CuponInputDto } from "../dtos/CuponInputDto.ts";

// Numele modelelor, folosite ca identificatori de AutoMapper
export const M = {
  CuponReducere: "CuponReducere",
  CuponDto: "CuponDto",
  CuponInputDto: "CuponInputDto",
  DateCupon: "DateCupon",
} as const;

// Metadatele: ce campuri simple are fiecare model (strategia pojos nu poate citi tipurile TypeScript la rulare)
PojosMetadataMap.create<CuponCuPlan>(M.CuponReducere, {
  id: Number,
  cod: String,
  planId: Number,
  utilizari: Number,
  utilizariMaxime: Number,
  activ: Boolean,
});
PojosMetadataMap.create<CuponDto>(M.CuponDto, {
  id: Number,
  cod: String,
  reducereProcent: Number,
  planCod: String,
  planDenumire: String,
  valabilPana: String,
  utilizari: Number,
  utilizariMaxime: Number,
  utilizariRamase: Number,
  activ: Boolean,
  stare: String,
});
PojosMetadataMap.create<CuponInputDto>(M.CuponInputDto, {
  cod: String,
  reducereProcent: Number,
  planCod: String,
  valabilPana: String,
  utilizariMaxime: Number,
  activ: Boolean,
});
PojosMetadataMap.create<DateCupon>(M.DateCupon, {
  cod: String,
  procentReducere: String,
  planId: Number,
  valabilPana: Date,
  utilizariMaxime: Number,
  activ: Boolean,
});

const ziCurenta = () => new Date().toISOString().slice(0, 10);

export const mapper = createMapper({ strategyInitializer: pojos() });

// Entitate -> DTO
createMap<CuponCuPlan, CuponDto>(
  mapper,
  M.CuponReducere,
  M.CuponDto,
  forMember((d) => d.reducereProcent, mapFrom((s) => s.procentReducere.toNumber())),
  forMember((d) => d.planCod, mapFrom((s) => s.plan?.cod ?? null)),
  forMember((d) => d.planDenumire, mapFrom((s) => s.plan?.denumire ?? null)),
  forMember((d) => d.valabilPana, mapFrom((s) => s.valabilPana.toISOString().slice(0, 10))),
  forMember((d) => d.utilizariRamase, mapFrom((s) => Math.max(0, s.utilizariMaxime - s.utilizari))),
  forMember(
    (d) => d.stare,
    mapFrom((s) =>
      s.stersLa ? "STERS" : !s.activ ? "INACTIV" : s.utilizari >= s.utilizariMaxime ? "EPUIZAT" : s.valabilPana.toISOString().slice(0, 10) < ziCurenta() ? "EXPIRAT" : "ACTIV",
    ),
  ),
);

// DTO de intrare -> datele pentru Accessor; id-ul planului vine ca argument (controller-ul il cauta dupa planCod)
createMap<CuponInputDto, DateCupon>(
  mapper,
  M.CuponInputDto,
  M.DateCupon,
  forMember((d) => d.procentReducere, mapFrom((s) => s.reducereProcent.toFixed(2))),
  forMember((d) => d.valabilPana, mapFrom((s) => new Date(`${s.valabilPana}T00:00:00Z`))),
  forMember((d) => d.planId, mapWithArguments((_s, args) => (args.planId as number | null) ?? null)),
);

export const laDto = (c: CuponCuPlan) => mapper.map<CuponCuPlan, CuponDto>(c, M.CuponReducere, M.CuponDto);
export const laDtoLista = (lista: CuponCuPlan[]) => mapper.mapArray<CuponCuPlan, CuponDto>(lista, M.CuponReducere, M.CuponDto);
export const laDateCupon = (dto: CuponInputDto, planId: number | null) =>
  mapper.map<CuponInputDto, DateCupon>(dto, M.CuponInputDto, M.DateCupon, { extraArgs: () => ({ planId }) });
