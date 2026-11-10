import { Suspense } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Aplicatia de test (Laborator 2, Exercitiul 3; actualizata la Laboratoarele 3 si 4):
 * se conecteaza la baza de date PostgreSQL prin Prisma si afiseaza date de test din tabele.
 *
 * Antetul paginii este static; sectiunea cu date ruleaza la fiecare cerere (connection()),
 * in interiorul unui <Suspense>, asa cum cere Next.js 16 pentru date care se schimba.
 */
export default function Page() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <p className="text-sm font-medium text-accent">BlockManager · aplicație de test</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Conexiunea la baza de date</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Pagina citește direct din PostgreSQL, prin Prisma, planurile de abonament, cupoanele de reducere, situația
          fiecărei asociații, facturile simulate și ultimele mișcări de tokeni.
        </p>
      </header>

      <Suspense fallback={<p className="text-muted">Se citesc datele din baza de date…</p>}>
        <DateDinBaza />
      </Suspense>
    </main>
  );
}

/** Citeste toate datele afisate pe pagina. Erorile de conexiune sunt intoarse ca rezultat, nu aruncate. */
async function citesteDate() {
  try {
    const [info] = await prisma.$queryRaw<{ versiune: string; baza: string; utilizator: string }[]>`
      SELECT version() AS versiune, current_database() AS baza, current_user AS utilizator`;

    const [planuri, cupoane, asociatii, facturi, tranzactii, numaratori] = await Promise.all([
      prisma.plan.findMany({ orderBy: { pretLunar: "asc" } }),
      prisma.cuponReducere.findMany({ orderBy: [{ activ: "desc" }, { valabilPana: "asc" }], include: { plan: true } }),
      prisma.asociatie.findMany({
        orderBy: { id: "asc" },
        include: {
          portofel: true,
          abonamente: { where: { status: { in: ["ACTIV", "SUSPENDAT"] } }, include: { plan: true } },
          comenzi: { where: { status: "IN_ASTEPTARE" } },
          _count: { select: { utilizatori: true, blocuri: true } },
        },
      }),
      prisma.facturaSimulata.findMany({
        orderBy: { numar: "desc" },
        include: { comanda: { include: { asociatie: true, plan: true, pachet: true } } },
      }),
      prisma.tranzactieTokeni.findMany({
        take: 10,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        include: { portofel: { include: { asociatie: true } }, actiune: true },
      }),
      Promise.all([
        prisma.utilizator.count(),
        prisma.apartament.count(),
        prisma.abonament.count(),
        prisma.tranzactieTokeni.count(),
        prisma.comandaSimulata.count(),
        prisma.fisaIntretinere.count(),
      ]),
    ]);

    return { ok: true as const, info, planuri, cupoane, asociatii, facturi, tranzactii, numaratori };
  } catch (eroare) {
    return { ok: false as const, mesaj: eroare instanceof Error ? eroare.message : String(eroare) };
  }
}

async function DateDinBaza() {
  await connection(); // datele se citesc la fiecare cerere, nu la build
  const date = await citesteDate();

  if (!date.ok) {
    const { mesaj } = date;
    return (
      <section role="alert" className="rounded-lg border border-danger/40 bg-danger-soft px-4 py-3">
        <p className="font-medium text-danger">Nu m-am putut conecta la baza de date.</p>
        <p className="mt-1 text-sm">
          Verifică dacă serverul PostgreSQL rulează și dacă <code className="font-mono">DATABASE_URL</code> din{" "}
          <code className="font-mono">.env</code> are utilizatorul, parola și numele bazei corecte.
        </p>
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap font-mono text-xs text-muted">{mesaj}</pre>
      </section>
    );
  }

  const { info, planuri, cupoane, asociatii, facturi, tranzactii, numaratori } = date;
  const acum = new Date();
  const [nrUtilizatori, nrApartamente, nrAbonamente, nrTranzactii, nrComenzi, nrFise] = numaratori;

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-accent/30 bg-accent-soft px-4 py-3">
        <p className="font-medium text-accent">Conectat la baza de date „{info.baza}” ca {info.utilizator}</p>
        <p className="mt-1 break-words font-mono text-xs text-muted">{info.versiune}</p>
      </section>

      <section aria-label="Numărul de înregistrări" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Cifra eticheta="Utilizatori" valoare={nrUtilizatori} />
        <Cifra eticheta="Apartamente" valoare={nrApartamente} />
        <Cifra eticheta="Abonamente" valoare={nrAbonamente} />
        <Cifra eticheta="Tranzacții tokeni" valoare={nrTranzactii} />
        <Cifra eticheta="Comenzi simulate" valoare={nrComenzi} />
        <Cifra eticheta="Fișe întreținere" valoare={nrFise} />
      </section>

      <Sectiune titlu="Planuri de abonament" sursa="planuri">
        <Tabel
          antet={["Cod", "Plan", "Preț / lună", "Preț / an", "Tokeni / lună", "Max apartamente", "Max blocuri", "Raport anual"]}
          numerice={[2, 3, 4, 5, 6]}
          randuri={planuri.map((p) => [
            <span key="c" className="font-mono text-xs">{p.cod}</span>,
            <div key="p" className="max-w-xs">
              <p className="font-medium">
                {p.denumire}
                {p.recomandat && (
                  <span className="ml-2 inline-block rounded bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
                    Recomandat
                  </span>
                )}
              </p>
              {p.descriere && <p className="mt-0.5 text-xs text-muted">{p.descriere}</p>}
            </div>,
            `${formatLei(p.pretLunar.toString())} lei`,
            p.pretAnual ? (
              <div key="an">
                <p>{formatLei(p.pretAnual.toString())} lei</p>
                <p className="text-xs text-accent">
                  economie {formatLei(p.pretLunar.mul(12).sub(p.pretAnual).toString())} lei
                </p>
              </div>
            ) : (
              "—"
            ),
            formatNumar(p.tokeniLunari),
            p.maxApartamente ?? "nelimitat",
            p.maxBlocuri ?? "nelimitat",
            p.raportAnual ? "da" : "nu",
          ])}
        />
      </Sectiune>

      <Sectiune titlu="Cupoane de reducere" sursa="cupoane_reducere">
        <Tabel
          antet={["Cod", "Reducere", "Valabil pentru", "Valabil până la", "Utilizări", "Stare"]}
          numerice={[1, 4]}
          randuri={cupoane.map((c) => [
            <span key="c" className="font-mono text-xs">{c.cod}</span>,
            `${formatProcent(c.procentReducere.toString())}%`,
            c.plan ? `planul ${c.plan.denumire}` : "orice plan plătit",
            formatData(c.valabilPana),
            `${c.utilizari} / ${c.utilizariMaxime}`,
            <Stare
              key="s"
              status={!c.activ ? "INACTIV" : c.utilizari >= c.utilizariMaxime ? "EPUIZAT" : c.valabilPana < acum ? "EXPIRAT" : "ACTIV"}
            />,
          ])}
        />
      </Sectiune>

      <Sectiune titlu="Asociații: plan, abonament și tokeni" sursa="asociatii, abonamente, portofele_tokeni, comenzi_simulate">
        <Tabel
          antet={["Asociație", "Plan", "Stare", "Perioadă", "Tokeni plan", "Tokeni extra", "Utilizatori"]}
          numerice={[4, 5, 6]}
          randuri={asociatii.map((a) => {
            const ab = a.abonamente[0];
            return [
              <div key="a">
                <p className="font-medium">{a.denumire}</p>
                <p className="text-xs text-muted">{a._count.blocuri} {a._count.blocuri === 1 ? "bloc" : "blocuri"}</p>
              </div>,
              ab?.plan.denumire ?? "—",
              <div key="s">
                {ab ? <Stare status={ab.status} /> : "—"}
                {a.comenzi.length > 0 && (
                  <p className="mt-1 text-xs text-warn">
                    Plată în așteptare: {formatLei(a.comenzi[0].suma.toString())} lei
                  </p>
                )}
              </div>,
              ab ? `${formatData(ab.inceputPerioada)} – ${formatData(ab.sfarsitPerioada)}` : "—",
              formatNumar(a.portofel?.tokeniPlan ?? 0),
              formatNumar(a.portofel?.tokeniExtra ?? 0),
              a._count.utilizatori,
            ];
          })}
        />
      </Sectiune>

      <Sectiune titlu="Facturi simulate" sursa="facturi_simulate, comenzi_simulate">
        <Tabel
          antet={["Număr", "Data", "Asociație", "Pentru", "Fără TVA", "TVA", "Total"]}
          numerice={[4, 5, 6]}
          randuri={facturi.map((f) => [
            <span key="n" className="font-mono text-xs">{f.numar}</span>,
            formatData(f.dataEmitere),
            f.comanda.asociatie.denumire,
            f.comanda.plan
              ? `Abonament ${f.comanda.plan.denumire}`
              : f.comanda.pachet
                ? f.comanda.pachet.denumire
                : f.comanda.tip,
            `${formatLei(f.subtotal.toString())} lei`,
            `${formatLei(f.tva.toString())} lei`,
            <span key="t" className="font-medium">{formatLei(f.total.toString())} lei</span>,
          ])}
        />
      </Sectiune>

      <Sectiune titlu="Ultimele 10 mișcări de tokeni" sursa="tranzactii_tokeni">
        <Tabel
          antet={["Data", "Asociație", "Tip", "Descriere", "Cantitate", "Sold după"]}
          numerice={[4, 5]}
          randuri={tranzactii.map((t) => [
            formatData(t.createdAt),
            t.portofel.asociatie.denumire,
            <span key="t" className="font-mono text-xs">{t.tip}</span>,
            t.descriere ?? t.actiune?.denumire ?? "—",
            <span key="q" className={t.cantitate < 0 ? "text-danger" : "text-accent"}>
              {t.cantitate > 0 ? "+" : ""}
              {formatNumar(t.cantitate)}
            </span>,
            formatNumar(t.soldDupa),
          ])}
        />
      </Sectiune>
    </div>
  );
}

// ---------------------------------------------------------------
// Componente mici de afisare
// ---------------------------------------------------------------

function Sectiune({ titlu, sursa, children }: { titlu: string; sursa: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4">
        <h2 className="text-lg font-semibold">{titlu}</h2>
        <p className="font-mono text-xs text-muted">{sursa}</p>
      </div>
      {children}
    </section>
  );
}

function Tabel({ antet, randuri, numerice = [] }: { antet: string[]; randuri: React.ReactNode[][]; numerice?: number[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
            {antet.map((h, i) => (
              <th key={h} scope="col" className={`px-3 py-2 font-medium ${numerice.includes(i) ? "text-right" : ""}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {randuri.map((rand, r) => (
            <tr key={r} className="border-b border-border last:border-0">
              {rand.map((celula, c) => (
                <td key={c} className={`px-3 py-2 align-top ${numerice.includes(c) ? "text-right tabular-nums" : ""}`}>
                  {celula}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Cifra({ eticheta, valoare }: { eticheta: string; valoare: number }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2">
      <p className="text-xs text-muted">{eticheta}</p>
      <p className="text-xl font-semibold tabular-nums">{formatNumar(valoare)}</p>
    </div>
  );
}

const STARI: Record<string, { text: string; clase: string }> = {
  ACTIV: { text: "Activ", clase: "bg-accent-soft text-accent" },
  SUSPENDAT: { text: "Suspendat până la plată", clase: "bg-warn-soft text-warn" },
  ANULAT: { text: "Anulat", clase: "bg-danger-soft text-danger" },
  EXPIRAT: { text: "Expirat", clase: "bg-border text-muted" },
  EPUIZAT: { text: "Epuizat", clase: "bg-warn-soft text-warn" },
  INACTIV: { text: "Inactiv", clase: "bg-border text-muted" },
};

function Stare({ status }: { status: string }) {
  const s = STARI[status] ?? { text: status, clase: "bg-border text-muted" };
  return <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${s.clase}`}>{s.text}</span>;
}

const formatNumar = (n: number) => new Intl.NumberFormat("ro-RO").format(n);
const formatLei = (s: string) => new Intl.NumberFormat("ro-RO", { minimumFractionDigits: 2 }).format(Number(s));
const formatProcent = (s: string) => new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 2 }).format(Number(s));
const formatData = (d: Date) =>
  new Intl.DateTimeFormat("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Bucharest" }).format(d);
