/**
 * BlockManager - date de test (seed)
 *
 * Ruleaza cu:  npx prisma db seed
 *
 * Scriptul goleste toate tabelele si le populeaza din nou, deci poate fi rulat de mai multe ori.
 * Toate datele sunt fictive. Parola pentru toate conturile de test: parola123
 */
import "dotenv/config";
import { scryptSync, randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  CodActiune,
  ModRepartizare,
  Rol,
  TipTranzactie,
} from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

// ---------------------------------------------------------------
// Utilitare
// ---------------------------------------------------------------

/** Data fixa (ora 10:00 UTC), ca datele de test sa fie aceleasi la fiecare rulare. */
const d = (iso: string) => new Date(`${iso}T10:00:00Z`);

/** Hash de parola cu scrypt (modul crypto din Node), fara dependente externe. */
function hashParola(parola: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(parola, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}
const PAROLA = hashParola("parola123");

/** Sumele se lucreaza in bani (numere intregi), ca sa nu apara erori de rotunjire. */
const lei = (bani: number) => (bani / 100).toFixed(2);

/**
 * Imparte o suma (in bani) proportional cu ponderile date.
 * Rotunjirea se face in jos, iar restul de bani se da apartamentelor cu cea mai mare
 * parte fractionara, astfel incat suma partilor sa fie exact totalul facturii.
 */
function repartizeaza(totalBani: number, ponderi: number[]): number[] {
  const sumaPonderi = ponderi.reduce((a, b) => a + b, 0);
  const exacte = ponderi.map((p) => (totalBani * p) / sumaPonderi);
  const parti = exacte.map(Math.floor);
  let rest = totalBani - parti.reduce((a, b) => a + b, 0);
  const ordine = exacte
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; rest > 0; k++, rest--) parti[ordine[k % ordine.length].i] += 1;
  return parti;
}

const PRENUME = ["Andrei", "Maria", "Ioan", "Elena", "Mihai", "Ana", "Cristian", "Ioana", "Gabriel", "Alexandra", "Radu", "Diana", "Vlad", "Irina", "Sorin", "Roxana", "Bogdan", "Simona", "Florin", "Laura", "Adrian", "Carmen", "Paul", "Oana", "Dan", "Raluca"];
const NUME = ["Popescu", "Ionescu", "Popa", "Constantin", "Stan", "Dumitru", "Stoica", "Gheorghe", "Matei", "Ciobanu", "Rusu", "Munteanu", "Lungu", "Moldovan", "Barbu", "Neagu", "Toma", "Marin", "Florea", "Dinu", "Nistor", "Ilie", "Oprea", "Sandu", "Tudor", "Voicu"];
let indexNume = 0;
function urmatorulNume() {
  const prenume = PRENUME[indexNume % PRENUME.length];
  const nume = NUME[(indexNume * 7) % NUME.length];
  indexNume++;
  return { prenume, nume };
}
const faraDiacritice = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// ---------------------------------------------------------------
// Golirea tabelelor (ordinea nu conteaza datorita CASCADE)
// ---------------------------------------------------------------

async function golesteTabelele() {
  const tabele = [
    "cupoane_reducere", "tranzactii_tokeni", "comenzi_simulate", "portofele_tokeni", "abonamente", "pachete_tokeni",
    "actiuni_taxabile", "planuri", "notificari", "sesizari", "anunturi", "penalizari",
    "alocari_plati", "plati", "detalii_intretinere", "fise_intretinere", "facturi_furnizori",
    "citiri_contoare", "contoare", "luni_intretinere", "categorii_cheltuieli", "furnizori",
    "fonduri", "proprietati", "apartamente", "scari", "blocuri", "utilizatori", "asociatii",
  ];
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tabele.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`,
  );
}

// ---------------------------------------------------------------
// 1. Monetizare: planuri, actiuni taxabile, pachete
// ---------------------------------------------------------------

async function seedCatalogMonetizare() {
  const free = await prisma.plan.create({
    data: { cod: "FREE", denumire: "Free", pretLunar: "0.00", tokeniLunari: 50, maxApartamente: 30, maxBlocuri: 1, raportAnual: false, descriere: "Pentru asociații mici: un bloc, cel mult 30 de apartamente și 50 de tokeni pe lună." },
  });
  const pro = await prisma.plan.create({
    data: { cod: "PRO", denumire: "Pro", pretLunar: "49.00", tokeniLunari: 400, maxApartamente: 300, maxBlocuri: 5, raportAnual: true, descriere: "Pentru asociații obișnuite: până la 5 blocuri, 400 de tokeni pe lună și raport anual." },
  });
  const max = await prisma.plan.create({
    data: { cod: "MAX", denumire: "Max", pretLunar: "149.00", tokeniLunari: 2000, maxApartamente: null, maxBlocuri: null, raportAnual: true, descriere: "Pentru complexe mari: fără limită de blocuri sau apartamente și 2.000 de tokeni pe lună." },
  });

  const definitii: [CodActiune, string, number][] = [
    [CodActiune.CALCUL, "Calcul întreținere lunară", 10],
    [CodActiune.RECALCUL, "Recalculare întreținere", 5],
    [CodActiune.NOTIFICARI, "Trimitere notificări lunare către proprietari", 5],
    [CodActiune.EXPORT_PDF, "Export PDF listă de plată", 2],
    [CodActiune.RAPORT, "Raport anual de încasări", 15],
  ];
  const actiuni = {} as Record<CodActiune, { id: number; costTokeni: number }>;
  for (const [cod, denumire, costTokeni] of definitii) {
    actiuni[cod] = await prisma.actiuneTaxabila.create({ data: { cod, denumire, costTokeni } });
  }

  const pachet100 = await prisma.pachetTokeni.create({ data: { denumire: "Pachet 100 tokeni", tokeni: 100, pret: "19.00" } });
  await prisma.pachetTokeni.create({ data: { denumire: "Pachet 300 tokeni", tokeni: 300, pret: "49.00" } });
  await prisma.pachetTokeni.create({ data: { denumire: "Pachet 1000 tokeni", tokeni: 1000, pret: "129.00" } });

  // cupoane de reducere pentru plata simulata (Laborator 3, Ex. 4); planId null = orice plan platit
  await prisma.cuponReducere.createMany({
    data: [
      { cod: "BUNVENIT20", procentReducere: 20, planId: pro.id, valabilPana: d("2026-12-31"), utilizariMaxime: 100, utilizari: 0 },
      { cod: "MAX15", procentReducere: 15, planId: max.id, valabilPana: d("2026-11-30"), utilizariMaxime: 20, utilizari: 3 },
      { cod: "TOAMNA10", procentReducere: 10, planId: null, valabilPana: d("2026-11-15"), utilizariMaxime: 50, utilizari: 12 },
      { cod: "VARA5", procentReducere: 5, planId: null, valabilPana: d("2026-08-31"), utilizariMaxime: 10, utilizari: 10, activ: false },
    ],
  });

  return { planuri: { free, pro, max }, actiuni, pachet100 };
}

// ---------------------------------------------------------------
// 2. Structura: asociatie, blocuri, scari, apartamente, proprietari, apometre
// ---------------------------------------------------------------

type ConfigAsociatie = {
  denumire: string;
  cui: string;
  adresa: string;
  iban: string;
  domeniu: string; // pentru emailurile de test
  blocuri: { denumire: string; scari: { denumire: string; apartamente: number }[] }[];
  /** cate apartamente au proprietar cu cont in aplicatie */
  proprietariCuCont: number;
};

async function seedAsociatie(cfg: ConfigAsociatie) {
  const asociatie = await prisma.asociatie.create({
    data: { denumire: cfg.denumire, cui: cfg.cui, adresa: cfg.adresa, iban: cfg.iban, banca: "Banca Test" },
  });

  const admin = await prisma.utilizator.create({
    data: { asociatieId: asociatie.id, email: `admin@${cfg.domeniu}`, parolaHash: PAROLA, ...urmatorulNume(), telefon: "0700000001", rol: Rol.ADMIN },
  });
  const presedinte = await prisma.utilizator.create({
    data: { asociatieId: asociatie.id, email: `presedinte@${cfg.domeniu}`, parolaHash: PAROLA, ...urmatorulNume(), telefon: "0700000002", rol: Rol.PRESEDINTE },
  });

  // apartamentele, cu suprafete variate; cota-parte = suprafata / suprafata totala * 100
  const brute: { scaraId: number; numar: string; etaj: number; suprafata: number; persoane: number }[] = [];
  let nrGlobal = 0;
  for (const b of cfg.blocuri) {
    const bloc = await prisma.bloc.create({ data: { asociatieId: asociatie.id, denumire: b.denumire, adresa: cfg.adresa } });
    for (const s of b.scari) {
      const scara = await prisma.scara.create({ data: { blocId: bloc.id, denumire: s.denumire } });
      for (let i = 1; i <= s.apartamente; i++) {
        nrGlobal++;
        const suprafata = [52.4, 64.1, 38.7, 71.3][nrGlobal % 4];
        brute.push({ scaraId: scara.id, numar: String(i), etaj: Math.floor((i - 1) / 4), suprafata, persoane: [2, 3, 1, 4][nrGlobal % 4] });
      }
    }
  }
  const cote = repartizeaza(1_000_000, brute.map((a) => a.suprafata)); // 100.0000% = 1.000.000 de zecimi de miime

  const apartamente = [];
  for (let k = 0; k < brute.length; k++) {
    const a = brute[k];
    const apt = await prisma.apartament.create({
      data: {
        scaraId: a.scaraId,
        numar: a.numar,
        etaj: a.etaj,
        suprafataUtila: a.suprafata.toFixed(2),
        cotaParte: (cote[k] / 10_000).toFixed(4),
        nrPersoane: a.persoane,
      },
    });
    const contor = await prisma.contor.create({
      data: { apartamentId: apt.id, serie: `AP-${asociatie.id}${String(k + 1).padStart(4, "0")}`, dataVerificareMetrologica: d("2025-03-15") },
    });
    apartamente.push({ ...apt, contorId: contor.id, persoane: a.persoane });
  }

  // proprietari: presedintele detine primul apartament, restul au conturi PROPRIETAR
  const proprietari = [];
  for (let k = 0; k < Math.min(cfg.proprietariCuCont, apartamente.length); k++) {
    let user = presedinte;
    if (k > 0) {
      const n = urmatorulNume();
      user = await prisma.utilizator.create({
        data: {
          asociatieId: asociatie.id,
          email: `${faraDiacritice(n.prenume)}.${faraDiacritice(n.nume)}${k}@${cfg.domeniu}`,
          parolaHash: PAROLA,
          ...n,
          telefon: `07${String(10000000 + k * 7919).slice(0, 8)}`,
          rol: Rol.PROPRIETAR,
        },
      });
    }
    await prisma.proprietate.create({
      data: { apartamentId: apartamente[k].id, utilizatorId: user.id, procentDetinere: "100.00", dataInceput: d("2020-01-01") },
    });
    proprietari.push({ user, apartament: apartamente[k] });
  }

  return { asociatie, admin, presedinte, apartamente, proprietari };
}

// ---------------------------------------------------------------
// 3. Tokeni: jurnal de tranzactii cu sold consecvent
// ---------------------------------------------------------------

/** Tine soldul portofelului si scrie fiecare miscare cu sold_dupa corect. */
async function jurnalTokeni(portofelId: number) {
  let plan = 0;
  let extra = 0;
  const scrie = (tip: TipTranzactie, cantitate: number, data: string, extras: { actiuneId?: number; comandaId?: number; utilizatorId?: number; descriere?: string }) =>
    prisma.tranzactieTokeni.create({
      data: { portofelId, tip, cantitate, soldDupa: plan + extra, createdAt: d(data), ...extras },
    });

  return {
    alocare: async (tokeni: number, data: string, comandaId?: number) => {
      plan = tokeni;
      await scrie(TipTranzactie.ALOCARE, tokeni, data, { comandaId, descriere: "Alocare tokeni pentru perioada nouă" });
    },
    expirare: async (data: string) => {
      const expirati = plan;
      plan = 0;
      if (expirati > 0) await scrie(TipTranzactie.EXPIRARE, -expirati, data, { descriere: "Tokenii nefolosiți din plan au expirat" });
    },
    cumparare: async (tokeni: number, data: string, comandaId: number, utilizatorId: number) => {
      extra += tokeni;
      await scrie(TipTranzactie.CUMPARARE, tokeni, data, { comandaId, utilizatorId, descriere: "Pachet de tokeni cumpărat" });
    },
    consum: async (actiune: { id: number; costTokeni: number }, data: string, utilizatorId: number, descriere: string) => {
      // regula: se consuma intai tokenii planului, apoi cei extra
      const dinPlan = Math.min(plan, actiune.costTokeni);
      plan -= dinPlan;
      extra -= actiune.costTokeni - dinPlan;
      if (extra < 0) throw new Error("Sold insuficient in datele de test");
      await scrie(TipTranzactie.CONSUM, -actiune.costTokeni, data, { actiuneId: actiune.id, utilizatorId, descriere });
    },
    sold: () => ({ plan, extra }),
  };
}

let nrReferinta = 0;
const referinta = () => `SIM-2026-${String(++nrReferinta).padStart(6, "0")}`;

// ---------------------------------------------------------------
// 4. Cheltuieli: o luna de intretinere calculata
// ---------------------------------------------------------------

type Apt = Awaited<ReturnType<typeof seedAsociatie>>["apartamente"][number];

async function calculeazaLuna(opts: {
  lunaId: number;
  apartamente: Apt[];
  facturi: { categorieId: number; mod: ModRepartizare; sumaBani: number }[];
  consumuri: Map<number, number>; // apartamentId -> consum apa (mc)
  restante: Map<number, number>; // apartamentId -> restanta anterioara (bani)
  data: string;
}) {
  const totaluri = new Map<number, number>();
  const detalii: { apartamentId: number; categorieId: number; baza: number; bani: number }[] = [];

  for (const f of opts.facturi) {
    const baze = opts.apartamente.map((a) => {
      switch (f.mod) {
        case ModRepartizare.CONSUM: return opts.consumuri.get(a.id) ?? 0;
        case ModRepartizare.PERSOANE: return a.persoane;
        case ModRepartizare.APARTAMENT: return 1;
        case ModRepartizare.SUPRAFATA: return Number(a.suprafataUtila);
        case ModRepartizare.COTA_PARTE: return Number(a.cotaParte);
      }
    });
    const parti = repartizeaza(f.sumaBani, baze);
    opts.apartamente.forEach((a, i) => {
      detalii.push({ apartamentId: a.id, categorieId: f.categorieId, baza: baze[i], bani: parti[i] });
      totaluri.set(a.id, (totaluri.get(a.id) ?? 0) + parti[i]);
    });
  }

  const fise = new Map<number, { id: number; totalDePlata: number }>();
  for (const a of opts.apartamente) {
    const total = totaluri.get(a.id) ?? 0;
    const restanta = opts.restante.get(a.id) ?? 0;
    const fisa = await prisma.fisaIntretinere.create({
      data: {
        lunaId: opts.lunaId,
        apartamentId: a.id,
        totalLunaCurenta: lei(total),
        restantaAnterioara: lei(restanta),
        penalizari: "0.00",
        totalDePlata: lei(total + restanta),
        createdAt: d(opts.data),
      },
    });
    fise.set(a.id, { id: fisa.id, totalDePlata: total + restanta });
  }
  await prisma.detaliuIntretinere.createMany({
    data: detalii.map((x) => ({
      fisaId: fise.get(x.apartamentId)!.id,
      categorieId: x.categorieId,
      bazaCalcul: x.baza.toFixed(4),
      suma: lei(x.bani),
    })),
  });
  return fise;
}

// ---------------------------------------------------------------
// Scenariul principal
// ---------------------------------------------------------------

async function main() {
  await golesteTabelele();
  const { planuri, actiuni, pachet100 } = await seedCatalogMonetizare();

  // --- Asociatia 1: plan PRO activ, cu istoric complet -------------------------------
  const a1 = await seedAsociatie({
    denumire: "Asociația de Proprietari Florilor 12",
    cui: "RO90000001",
    adresa: "Str. Florilor nr. 12, Iași",
    iban: "RO49TEST0000000000000001",
    domeniu: "florilor12.test",
    blocuri: [{ denumire: "Bloc F12", scari: [{ denumire: "A", apartamente: 8 }, { denumire: "B", apartamente: 8 }] }],
    proprietariCuCont: 16,
  });

  // --- Asociatia 2: plan FREE ----------------------------------------------------------
  const a2 = await seedAsociatie({
    denumire: "Asociația Locatarilor Parcul Verde",
    cui: "RO90000002",
    adresa: "Bd. Parcului nr. 3, Cluj-Napoca",
    iban: "RO49TEST0000000000000002",
    domeniu: "parculverde.test",
    blocuri: [{ denumire: "Bloc P3", scari: [{ denumire: "1", apartamente: 6 }] }],
    proprietariCuCont: 6,
  });

  // --- Asociatia 3: plan MAX suspendat (perioada s-a incheiat, plata in asteptare) -----
  const a3 = await seedAsociatie({
    denumire: "Asociația de Proprietari Mărăști 7",
    cui: "RO90000003",
    adresa: "Bd. Mărăști nr. 7, București",
    iban: "RO49TEST0000000000000003",
    domeniu: "marasti7.test",
    blocuri: [
      { denumire: "Bloc M7", scari: [{ denumire: "A", apartamente: 8 }, { denumire: "B", apartamente: 8 }] },
      { denumire: "Bloc M7 bis", scari: [{ denumire: "A", apartamente: 6 }] },
    ],
    proprietariCuCont: 4,
  });

  // ===== Monetizare A1: Free -> Pro (august), plata lunara, pachet extra =====
  await prisma.abonament.create({
    data: { asociatieId: a1.asociatie.id, planId: planuri.free.id, inceputPerioada: d("2026-07-05"), sfarsitPerioada: d("2026-08-05"), status: "EXPIRAT", createdAt: d("2026-07-05") },
  });
  const ab1 = await prisma.abonament.create({
    data: { asociatieId: a1.asociatie.id, planId: planuri.pro.id, inceputPerioada: d("2026-10-06"), sfarsitPerioada: d("2026-11-06"), status: "ACTIV", createdAt: d("2026-08-05") },
  });
  const p1 = await prisma.portofelTokeni.create({ data: { asociatieId: a1.asociatie.id } });
  const j1 = await jurnalTokeni(p1.id);
  const adm1 = a1.admin.id;

  const cmdAug = await prisma.comandaSimulata.create({
    data: { asociatieId: a1.asociatie.id, utilizatorId: adm1, abonamentId: ab1.id, tip: "ABONAMENT", planId: planuri.pro.id, suma: "49.00", status: "ACHITATA", referinta: referinta(), achitataLa: d("2026-08-05"), createdAt: d("2026-08-05") },
  });
  await j1.alocare(400, "2026-08-05", cmdAug.id);
  await j1.consum(actiuni.CALCUL, "2026-08-24", adm1, "Calcul întreținere august 2026");
  await j1.consum(actiuni.NOTIFICARI, "2026-08-24", adm1, "Notificări listă de plată august");
  await j1.expirare("2026-09-05");

  const cmdSep = await prisma.comandaSimulata.create({
    data: { asociatieId: a1.asociatie.id, utilizatorId: adm1, abonamentId: ab1.id, tip: "ABONAMENT", planId: planuri.pro.id, suma: "49.00", status: "ACHITATA", referinta: referinta(), achitataLa: d("2026-09-05"), createdAt: d("2026-09-05") },
  });
  await j1.alocare(400, "2026-09-05", cmdSep.id);
  await j1.consum(actiuni.CALCUL, "2026-09-23", adm1, "Calcul întreținere septembrie 2026");
  await j1.consum(actiuni.RECALCUL, "2026-09-23", adm1, "Recalculare după corectarea unui index");
  await j1.consum(actiuni.NOTIFICARI, "2026-09-24", adm1, "Notificări listă de plată septembrie");
  await j1.consum(actiuni.EXPORT_PDF, "2026-09-24", adm1, "Export PDF listă de plată septembrie");
  await j1.expirare("2026-10-05");

  // 5 oct: planificatorul emite comanda (in asteptare); 6 oct: administratorul confirma plata simulata
  const cmdOct = await prisma.comandaSimulata.create({
    data: { asociatieId: a1.asociatie.id, utilizatorId: null, abonamentId: ab1.id, tip: "ABONAMENT", planId: planuri.pro.id, suma: "49.00", status: "ACHITATA", referinta: referinta(), achitataLa: d("2026-10-06"), createdAt: d("2026-10-05") },
  });
  await j1.alocare(400, "2026-10-06", cmdOct.id);
  const cmdPachet = await prisma.comandaSimulata.create({
    data: { asociatieId: a1.asociatie.id, utilizatorId: adm1, tip: "PACHET", pachetId: pachet100.id, suma: "19.00", status: "ACHITATA", referinta: referinta(), achitataLa: d("2026-10-10"), createdAt: d("2026-10-10") },
  });
  await j1.cumparare(100, "2026-10-10", cmdPachet.id, adm1);
  await j1.consum(actiuni.CALCUL, "2026-10-21", adm1, "Calcul întreținere octombrie 2026");
  await j1.consum(actiuni.NOTIFICARI, "2026-10-21", adm1, "Notificări listă de plată octombrie");
  await j1.consum(actiuni.EXPORT_PDF, "2026-10-22", adm1, "Export PDF listă de plată octombrie");
  await j1.consum(actiuni.RAPORT, "2026-10-22", adm1, "Raport anual de încasări 2025-2026");
  await prisma.portofelTokeni.update({ where: { id: p1.id }, data: { tokeniPlan: j1.sold().plan, tokeniExtra: j1.sold().extra, ultimaResetare: d("2026-10-06") } });

  // ===== Monetizare A2: Free, reinnoit automat =====
  await prisma.abonament.create({
    data: { asociatieId: a2.asociatie.id, planId: planuri.free.id, inceputPerioada: d("2026-10-01"), sfarsitPerioada: d("2026-11-01"), status: "ACTIV", createdAt: d("2026-09-01") },
  });
  const p2 = await prisma.portofelTokeni.create({ data: { asociatieId: a2.asociatie.id } });
  const j2 = await jurnalTokeni(p2.id);
  await j2.alocare(50, "2026-09-01");
  await j2.consum(actiuni.CALCUL, "2026-09-22", a2.admin.id, "Calcul întreținere septembrie 2026");
  await j2.expirare("2026-10-01");
  await j2.alocare(50, "2026-10-01");
  await prisma.portofelTokeni.update({ where: { id: p2.id }, data: { tokeniPlan: j2.sold().plan, tokeniExtra: j2.sold().extra, ultimaResetare: d("2026-10-01") } });

  // ===== Monetizare A3: Max, perioada incheiata pe 20 oct, suspendat pana la plata =====
  const ab3 = await prisma.abonament.create({
    data: { asociatieId: a3.asociatie.id, planId: planuri.max.id, inceputPerioada: d("2026-09-20"), sfarsitPerioada: d("2026-10-20"), status: "SUSPENDAT", createdAt: d("2026-09-20") },
  });
  const p3 = await prisma.portofelTokeni.create({ data: { asociatieId: a3.asociatie.id } });
  const j3 = await jurnalTokeni(p3.id);
  const cmdMax = await prisma.comandaSimulata.create({
    data: { asociatieId: a3.asociatie.id, utilizatorId: a3.admin.id, abonamentId: ab3.id, tip: "ABONAMENT", planId: planuri.max.id, suma: "149.00", status: "ACHITATA", referinta: referinta(), achitataLa: d("2026-09-20"), createdAt: d("2026-09-20") },
  });
  await j3.alocare(2000, "2026-09-20", cmdMax.id);
  await j3.consum(actiuni.CALCUL, "2026-10-02", a3.admin.id, "Calcul întreținere septembrie 2026");
  await j3.consum(actiuni.EXPORT_PDF, "2026-10-02", a3.admin.id, "Export PDF listă de plată septembrie");
  await j3.expirare("2026-10-20");
  await prisma.comandaSimulata.create({
    data: { asociatieId: a3.asociatie.id, utilizatorId: null, abonamentId: ab3.id, tip: "ABONAMENT", planId: planuri.max.id, suma: "149.00", status: "IN_ASTEPTARE", referinta: referinta(), createdAt: d("2026-10-20") },
  });
  await prisma.portofelTokeni.update({ where: { id: p3.id }, data: { tokeniPlan: 0, tokeniExtra: 0, ultimaResetare: d("2026-09-20") } });

  // ===== Domeniu A1: furnizori, categorii, doua luni de intretinere, plati =====
  const aid = a1.asociatie.id;
  const furnizori = {
    apa: await prisma.furnizor.create({ data: { asociatieId: aid, denumire: "ApaServ Test SA", cui: "RO10000001", iban: "RO49TEST1000000000000001" } }),
    salubritate: await prisma.furnizor.create({ data: { asociatieId: aid, denumire: "Salubris Test SRL", cui: "RO10000002" } }),
    lift: await prisma.furnizor.create({ data: { asociatieId: aid, denumire: "LiftService Test SRL", cui: "RO10000003" } }),
    energie: await prisma.furnizor.create({ data: { asociatieId: aid, denumire: "Energie Test SA", cui: "RO10000004" } }),
  };
  const cat = {
    apa: await prisma.categorieCheltuiala.create({ data: { asociatieId: aid, denumire: "Apă", modRepartizare: "CONSUM" } }),
    salubritate: await prisma.categorieCheltuiala.create({ data: { asociatieId: aid, denumire: "Salubritate", modRepartizare: "PERSOANE" } }),
    lift: await prisma.categorieCheltuiala.create({ data: { asociatieId: aid, denumire: "Întreținere lift", modRepartizare: "APARTAMENT" } }),
    energie: await prisma.categorieCheltuiala.create({ data: { asociatieId: aid, denumire: "Energie electrică părți comune", modRepartizare: "COTA_PARTE" } }),
  };
  await prisma.fond.createMany({
    data: [
      { asociatieId: aid, tip: "RULMENT", sold: "4800.00", contributieLunara: "0.00" },
      { asociatieId: aid, tip: "REPARATII", sold: "12350.00", contributieLunara: "400.00" },
    ],
  });

  const septembrie = await prisma.lunaIntretinere.create({
    data: { asociatieId: aid, an: 2026, luna: 9, status: "INCHISA", dataLimitaCitiri: d("2026-09-20"), dataPublicare: d("2026-09-25"), dataScadenta: d("2026-10-15"), aprobatDeId: a1.presedinte.id },
  });
  const octombrie = await prisma.lunaIntretinere.create({
    data: { asociatieId: aid, an: 2026, luna: 10, status: "PUBLICATA", dataLimitaCitiri: d("2026-10-20"), dataPublicare: d("2026-10-22"), dataScadenta: d("2026-11-15"), aprobatDeId: a1.presedinte.id },
  });

  // citiri apometre: septembrie si octombrie
  const consumSep = new Map<number, number>();
  const consumOct = new Map<number, number>();
  for (const [k, a] of a1.apartamente.entries()) {
    const start = 100 + k * 37;
    const cSep = 4 + ((k * 3) % 7);
    const cOct = 3 + ((k * 5) % 8);
    consumSep.set(a.id, cSep);
    consumOct.set(a.id, cOct);
    const proprietar = a1.proprietari.find((p) => p.apartament.id === a.id)?.user.id;
    await prisma.citireContor.create({
      data: { contorId: a.contorId, lunaId: septembrie.id, introdusDeId: proprietar, index: (start + cSep).toFixed(3), consum: cSep.toFixed(3), dataCitire: d("2026-09-18"), sursa: "PROPRIETAR", validata: true },
    });
    await prisma.citireContor.create({
      data: { contorId: a.contorId, lunaId: octombrie.id, introdusDeId: k === 5 ? adm1 : proprietar, index: (start + cSep + cOct).toFixed(3), consum: cOct.toFixed(3), dataCitire: d("2026-10-17"), sursa: k === 5 ? "ADMIN" : "PROPRIETAR", validata: true },
    });
  }

  const facturiLuna = async (lunaId: number, data: string, scadenta: string, sume: { apa: number; salubritate: number; lift: number; energie: number }, sufix: string) => {
    const lista = [
      { furnizorId: furnizori.apa.id, categorie: cat.apa, suma: sume.apa, cantitate: "105.000" },
      { furnizorId: furnizori.salubritate.id, categorie: cat.salubritate, suma: sume.salubritate, cantitate: null },
      { furnizorId: furnizori.lift.id, categorie: cat.lift, suma: sume.lift, cantitate: null },
      { furnizorId: furnizori.energie.id, categorie: cat.energie, suma: sume.energie, cantitate: "310.000" },
    ];
    for (const [i, f] of lista.entries()) {
      await prisma.facturaFurnizor.create({
        data: { furnizorId: f.furnizorId, lunaId, categorieId: f.categorie.id, numar: `F-${sufix}-${i + 1}`, dataEmitere: d(data), dataScadenta: d(scadenta), suma: lei(f.suma), cantitate: f.cantitate, platita: lunaId === septembrie.id },
      });
    }
    return lista.map((f) => ({ categorieId: f.categorie.id, mod: f.categorie.modRepartizare, sumaBani: f.suma }));
  };

  const facturiSep = await facturiLuna(septembrie.id, "2026-09-10", "2026-10-10", { apa: 98_250, salubritate: 41_600, lift: 32_000, energie: 18_745 }, "2609");
  const fiseSep = await calculeazaLuna({ lunaId: septembrie.id, apartamente: a1.apartamente, facturi: facturiSep, consumuri: consumSep, restante: new Map(), data: "2026-09-23" });

  // plati pentru septembrie: majoritatea achita integral, ap. 4 partial, ap. 9 si 13 nu au platit
  let nrChitanta = 0;
  const restanteOct = new Map<number, number>();
  for (const [k, a] of a1.apartamente.entries()) {
    const fisa = fiseSep.get(a.id)!;
    const platit = k === 3 ? Math.round(fisa.totalDePlata / 2) : k === 8 || k === 12 ? 0 : fisa.totalDePlata;
    if (platit > 0) {
      const metoda = (["CASIERIE", "TRANSFER", "CARD"] as const)[k % 3];
      const plata = await prisma.plata.create({
        data: {
          apartamentId: a.id,
          platitorId: a1.proprietari.find((p) => p.apartament.id === a.id)?.user.id,
          inregistratDeId: metoda === "CASIERIE" ? adm1 : null,
          suma: lei(platit),
          dataPlata: d(`2026-10-${String(1 + (k % 12)).padStart(2, "0")}`),
          metoda,
          numarChitanta: `BM-2026-${String(++nrChitanta).padStart(4, "0")}`,
        },
      });
      await prisma.alocarePlata.create({ data: { plataId: plata.id, fisaId: fisa.id, suma: lei(platit) } });
    }
    await prisma.fisaIntretinere.update({
      where: { id: fisa.id },
      data: { achitat: lei(platit), status: platit === 0 ? "NEPLATITA" : platit < fisa.totalDePlata ? "PARTIAL_PLATITA" : "PLATITA" },
    });
    if (platit < fisa.totalDePlata) restanteOct.set(a.id, fisa.totalDePlata - platit);
  }

  const facturiOct = await facturiLuna(octombrie.id, "2026-10-10", "2026-11-10", { apa: 91_430, salubritate: 41_600, lift: 32_000, energie: 21_380 }, "2610");
  const fiseOct = await calculeazaLuna({ lunaId: octombrie.id, apartamente: a1.apartamente, facturi: facturiOct, consumuri: consumOct, restante: restanteOct, data: "2026-10-21" });

  // un proprietar a platit deja octombrie cu cardul
  const apPlatitor = a1.apartamente[1];
  const fisaOct = fiseOct.get(apPlatitor.id)!;
  const plataOct = await prisma.plata.create({
    data: { apartamentId: apPlatitor.id, platitorId: a1.proprietari[1].user.id, suma: lei(fisaOct.totalDePlata), dataPlata: d("2026-10-23"), metoda: "CARD", numarChitanta: `BM-2026-${String(++nrChitanta).padStart(4, "0")}` },
  });
  await prisma.alocarePlata.create({ data: { plataId: plataOct.id, fisaId: fisaOct.id, suma: lei(fisaOct.totalDePlata) } });
  await prisma.fisaIntretinere.update({ where: { id: fisaOct.id }, data: { achitat: lei(fisaOct.totalDePlata), status: "PLATITA" } });

  // ===== Domeniu A2: luna deschisa, citiri in curs =====
  const octA2 = await prisma.lunaIntretinere.create({
    data: { asociatieId: a2.asociatie.id, an: 2026, luna: 10, status: "DESCHISA", dataLimitaCitiri: d("2026-10-25") },
  });
  for (const [k, a] of a2.apartamente.slice(0, 4).entries()) {
    await prisma.citireContor.create({
      data: { contorId: a.contorId, lunaId: octA2.id, introdusDeId: a2.proprietari[k]?.user.id, index: (250 + k * 21).toFixed(3), consum: (5 + k).toFixed(3), dataCitire: d("2026-10-19"), sursa: "PROPRIETAR", validata: false },
    });
  }

  // ===== Comunicare =====
  await prisma.anunt.createMany({
    data: [
      { asociatieId: aid, autorId: adm1, titlu: "Lista de plată pe octombrie a fost publicată", continut: "Lista de plată pentru octombrie 2026 este disponibilă în aplicație. Termenul de plată este 15 noiembrie.", important: true, dataPublicare: d("2026-10-22") },
      { asociatieId: aid, autorId: adm1, titlu: "Revizie lift scara B", continut: "Joi, 29 octombrie, între 9:00 și 12:00, liftul de la scara B va fi oprit pentru revizie.", dataPublicare: d("2026-10-20") },
      { asociatieId: a3.asociatie.id, autorId: a3.admin.id, titlu: "Ședința anuală a asociației", continut: "Ședința anuală va avea loc pe 5 noiembrie la ora 18:00, la sediul administrației.", dataPublicare: d("2026-10-15") },
    ],
  });
  await prisma.sesizare.createMany({
    data: [
      { apartamentId: a1.apartamente[6].id, autorId: a1.proprietari[6].user.id, titlu: "Bec ars pe casa scării", descriere: "Becul de la etajul 1, scara A, nu mai funcționează.", status: "REZOLVATA", raspuns: "Becul a fost înlocuit.", dataCreare: d("2026-10-02"), dataRezolvare: d("2026-10-04") },
      { apartamentId: a1.apartamente[10].id, autorId: a1.proprietari[10].user.id, titlu: "Infiltrație la ultimul etaj", descriere: "Apare umezeală pe tavan după ploaie, în apartamentul 3 de la scara B.", status: "IN_LUCRU", raspuns: "Am contactat o firmă pentru verificarea acoperișului.", dataCreare: d("2026-10-12") },
      { apartamentId: a1.apartamente[13].id, autorId: a1.proprietari[13].user.id, titlu: "Interfon defect", descriere: "Interfonul nu sună în apartament.", dataCreare: d("2026-10-21") },
    ],
  });
  await prisma.notificare.createMany({
    data: [
      { utilizatorId: adm1, tip: "ABONAMENT", mesaj: "Plata simulată pentru planul Pro a fost confirmată. Ai primit 400 de tokeni.", citita: true, dataCreare: d("2026-10-06") },
      { utilizatorId: adm1, tip: "TOKENI", mesaj: "Pachetul de 100 de tokeni a fost adăugat în portofel.", citita: true, dataCreare: d("2026-10-10") },
      { utilizatorId: a3.admin.id, tip: "ABONAMENT", mesaj: "Abonamentul Max este suspendat până la plata lunii următoare (149 lei).", citita: false, dataCreare: d("2026-10-20") },
      { utilizatorId: a2.admin.id, tip: "TOKENI", mesaj: "Ai primit 50 de tokeni pentru perioada nouă a planului Free.", citita: false, dataCreare: d("2026-10-01") },
      ...a1.proprietari.slice(0, 5).map((p) => ({ utilizatorId: p.user.id, tip: "INTRETINERE" as const, mesaj: "Lista de plată pe octombrie 2026 a fost publicată.", citita: false, dataCreare: d("2026-10-22") })),
    ],
  });

  // ===== Rezumat =====
  const rezumat = {
    planuri: await prisma.plan.count(),
    cupoane: await prisma.cuponReducere.count(),
    abonamente: await prisma.abonament.count(),
    tranzactiiTokeni: await prisma.tranzactieTokeni.count(),
    comenziSimulate: await prisma.comandaSimulata.count(),
    utilizatori: await prisma.utilizator.count(),
    apartamente: await prisma.apartament.count(),
    fiseIntretinere: await prisma.fisaIntretinere.count(),
    plati: await prisma.plata.count(),
  };
  console.log("Date de test inserate:", rezumat);
  console.log("Sold tokeni:", { florilor12: j1.sold(), parculVerde: j2.sold(), marasti7: j3.sold() });
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
