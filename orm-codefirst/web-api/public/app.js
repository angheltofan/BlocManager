// Sectiunea de utilizator BlockManager: toate datele si operatiile trec prin API-ul REST (/api/...).
"use strict";

const stare = { asociatieId: null, planuri: [], pachete: [], actiuni: [], date: null, reduceri: {} };
const $ = (id) => document.getElementById(id);
const lei = (s) => Number(s).toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " lei";
const zi = (iso) => iso.slice(0, 10).split("-").reverse().join(".");
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const TIP = { ALOCARE: "Alocare", CONSUM: "Consum", CUMPARARE: "Cumpărare", EXPIRARE: "Expirare", BONUS: "Bonus" };

async function api(cale, metoda = "GET", corp) {
  const r = await fetch(cale, { method: metoda, headers: corp ? { "Content-Type": "application/json" } : {}, body: corp ? JSON.stringify(corp) : undefined });
  const date = r.status === 204 ? null : await r.json();
  if (!r.ok) throw Object.assign(new Error(date?.eroare ?? `Eroare ${r.status}`), { status: r.status, date });
  return date;
}

let ceasMesaj;
function mesaj(text, tip = "ok") {
  const el = $("mesaj");
  el.textContent = text;
  el.className = `mesaj ${tip}`;
  el.hidden = false;
  clearTimeout(ceasMesaj);
  ceasMesaj = setTimeout(() => (el.hidden = true), 6000);
}

/** Ruleaza o operatie (buton), afiseaza rezultatul si reincarca starea. */
async function operatie(buton, f) {
  buton.disabled = true;
  try {
    const r = await f();
    mesaj(r.mesaj, "ok");
    await incarcaStare();
  } catch (e) {
    mesaj(e.message, "eroare");
  } finally {
    buton.disabled = false;
  }
}

// ---------------- afisare ----------------

function afiseazaAbonament() {
  const { abonament: a, portofel: p } = stare.date;
  const anunt = $("anunt");
  anunt.hidden = true;
  if (!a) {
    $("plan-curent").textContent = "Niciun abonament";
    $("plan-detalii").textContent = "Alege un plan mai jos. Planul Free pornește imediat, cu 50 de tokeni pe lună.";
    $("plan-programat").hidden = true;
  } else {
    $("plan-curent").innerHTML = `${esc(a.planDenumire)} <span class="eticheta ${a.status === "ACTIV" ? "verde" : "galben"}">${a.status === "ACTIV" ? "Activ" : "Suspendat până la plată"}</span>`;
    const pret = Number(a.pretLunar) === 0 ? "gratuit" : `${lei(a.pretLunar)} / lună`;
    $("plan-detalii").textContent = `${pret} · ${a.tokeniLunari} tokeni / lună · perioada ${zi(a.inceputPerioada)} – ${zi(a.sfarsitPerioada)}${a.reinnoireAutomata ? ", se reînnoiește automat" : ", fără reînnoire automată"}`;
    const prog = $("plan-programat");
    prog.hidden = !a.planUrmator;
    if (a.planUrmator) prog.textContent = `De la ${zi(a.sfarsitPerioada)} treci pe planul ${a.planUrmator.denumire}.`;
    if (a.status === "SUSPENDAT") {
      anunt.hidden = false;
      anunt.textContent = `Abonamentul ${a.planDenumire} este suspendat: acțiunile sunt blocate până la plata comenzii de mai jos.`;
    }
  }
  $("sold").textContent = p.sold;
  const total = Math.max(p.sold, a ? a.tokeniLunari : 0, 1);
  $("bara-plan").style.width = `${(p.tokeniPlan / total) * 100}%`;
  $("bara-extra").style.width = `${(p.tokeniExtra / total) * 100}%`;
  $("sold-detalii").textContent = `${p.tokeniPlan} din plan · ${p.tokeniExtra} extra`;
}

function afiseazaComenzi() {
  const lista = stare.date.comenziInAsteptare;
  $("sectiune-comenzi").hidden = lista.length === 0;
  $("comenzi").innerHTML = lista
    .map(
      (c) => `<div class="comanda">
        <div><p class="cod">${esc(c.referinta)}</p><p class="estompat mic">${esc(c.descriere)} · emisă ${zi(c.emisa)}</p></div>
        <p class="suma">${lei(c.suma)}</p>
        <div class="actiuni">
          <button class="buton principal" data-plata="${c.id}">Plătește (simulat)</button>
          <button class="buton" data-anulare="${c.id}">Anulează</button>
        </div>
      </div>`,
    )
    .join("");
}

function afiseazaPlanuri() {
  const curent = stare.date.abonament;
  $("planuri").innerHTML = stare.planuri
    .map((p) => {
      const esteCurent = curent && curent.planCod === p.cod;
      const reducere = stare.reduceri[p.cod];
      const gratuit = Number(p.pretLunar) === 0;
      const pret = gratuit
        ? `<p class="pret">0 lei <span>/ lună</span></p>`
        : reducere
          ? `<p class="pret"><s>${lei(p.pretLunar)}</s> ${lei(reducere)} <span>/ lună</span></p>`
          : `<p class="pret">${lei(p.pretLunar)} <span>/ lună</span></p>`;
      const anual = p.pretAnual ? `<p class="estompat mic">sau ${lei(p.pretAnual)} / an</p>` : `<p class="estompat mic">&nbsp;</p>`;
      let buton;
      if (esteCurent) buton = `<button class="buton" disabled>Planul tău</button>`;
      else if (curent && Number(p.pretLunar) < Number(curent.pretLunar) && curent.status === "ACTIV") buton = `<button class="buton" data-plan="${p.cod}">Programează ${esc(p.denumire)}</button>`;
      else buton = `<button class="buton ${p.recomandat ? "principal" : ""}" data-plan="${p.cod}">${curent ? "Treci pe" : "Alege"} ${esc(p.denumire)}</button>`;
      return `<article class="plan ${p.recomandat ? "recomandat" : ""} ${esteCurent ? "curent" : ""}">
        ${p.recomandat ? `<span class="eticheta-plan">Recomandat</span>` : ""}
        <h3>${esc(p.denumire)}</h3>
        ${pret}${anual}
        <ul>
          <li><b>${p.tokeniLunari}</b> tokeni / lună</li>
          <li>${p.maxApartamente ? `până la ${p.maxApartamente} apartamente` : "apartamente nelimitate"}</li>
          <li>${p.maxBlocuri ? `${p.maxBlocuri} ${p.maxBlocuri === 1 ? "bloc" : "blocuri"}` : "blocuri nelimitate"}</li>
          <li class="${p.raportAnual ? "" : "lipsa"}">${p.raportAnual ? "raport anual de încasări" : "fără raport anual"}</li>
        </ul>
        ${buton}
      </article>`;
    })
    .join("");
}

function afiseazaActiuni() {
  $("actiuni").innerHTML = stare.actiuni
    .map((a) => `<button class="actiune" data-actiune="${a.cod}"><span>${esc(a.denumire)}</span><span class="cost">${a.costTokeni} tokeni</span></button>`)
    .join("");
}

function afiseazaPachete() {
  $("pachete").innerHTML = stare.pachete
    .map((p) => `<article class="pachet"><p class="pachet-tokeni">+${p.tokeni}</p><p class="estompat mic">tokeni extra</p><p class="pret-mic">${lei(p.pret)}</p><button class="buton" data-pachet="${p.id}">Cumpără</button></article>`)
    .join("");
}

function afiseazaTabele() {
  const { jurnal, facturi } = stare.date;
  $("jurnal").innerHTML = jurnal.length
    ? jurnal.map((t) => `<tr><td>${zi(t.data)}</td><td>${TIP[t.tip]}<span class="estompat mic bloc">${esc(t.descriere)}</span></td><td class="numar ${t.cantitate < 0 ? "minus" : "plus"}">${t.cantitate > 0 ? "+" : ""}${t.cantitate}</td><td class="numar">${t.soldDupa}</td></tr>`).join("")
    : `<tr><td colspan="4" class="estompat">Nicio mișcare de tokeni.</td></tr>`;
  $("facturi").innerHTML = facturi.length
    ? facturi.map((f) => `<tr><td><span class="cod">${esc(f.numar)}</span><span class="estompat mic bloc">${zi(f.dataEmitere)} · ${esc(f.comanda)}</span></td><td>${esc(f.descriere)}<span class="estompat mic bloc">${lei(f.subtotal)} + TVA ${lei(f.tva)}</span></td><td class="numar">${lei(f.total)}</td></tr>`).join("")
    : `<tr><td colspan="3" class="estompat">Nicio factură.</td></tr>`;
}

// ---------------- incarcare ----------------

async function incarcaStare() {
  stare.date = await api(`/api/asociatii/${stare.asociatieId}/stare`);
  afiseazaAbonament();
  afiseazaComenzi();
  afiseazaPlanuri();
  afiseazaTabele();
}

let ceasCupon;
async function verificaCupon() {
  const cod = $("cod-cupon").value.trim().toUpperCase();
  stare.reduceri = {};
  const info = $("cupon-info");
  if (!cod) {
    info.textContent = "";
    afiseazaPlanuri();
    return;
  }
  const platite = stare.planuri.filter((p) => Number(p.pretLunar) > 0);
  const rezultate = await Promise.all(platite.map((p) => api(`/api/cupoane/verifica?cod=${encodeURIComponent(cod)}&planCod=${p.cod}`).catch((e) => ({ eroare: e.message }))));
  const valide = rezultate.filter((r) => !r.eroare);
  valide.forEach((r) => (stare.reduceri[r.planCod] = r.pretRedus));
  info.textContent = valide.length
    ? `−${valide[0].reducereProcent.toLocaleString("ro-RO")}% pentru ${valide.map((r) => stare.planuri.find((p) => p.cod === r.planCod).denumire).join(" și ")}`
    : rezultate[0]?.eroare ?? "";
  info.className = valide.length ? "mic ok-text" : "mic eroare-text";
  afiseazaPlanuri();
}

async function porneste() {
  [stare.planuri, stare.pachete, stare.actiuni] = await Promise.all([api("/api/planuri"), api("/api/pachete"), api("/api/actiuni")]);
  const asociatii = await api("/api/asociatii");
  let salvat = null;
  try { salvat = Number(localStorage.getItem("asociatie")); } catch { /* fara stocare locala */ }
  stare.asociatieId = asociatii.some((a) => a.id === salvat) ? salvat : asociatii[0]?.id;
  $("asociatie").innerHTML = asociatii.map((a) => `<option value="${a.id}" ${a.id === stare.asociatieId ? "selected" : ""}>${esc(a.denumire)}</option>`).join("");
  afiseazaActiuni();
  afiseazaPachete();
  await incarcaStare();
}

// ---------------- evenimente ----------------

$("asociatie").addEventListener("change", async (e) => {
  stare.asociatieId = Number(e.target.value);
  try { localStorage.setItem("asociatie", String(stare.asociatieId)); } catch { /* fara stocare locala */ }
  await incarcaStare();
});

$("cod-cupon").addEventListener("input", () => {
  clearTimeout(ceasCupon);
  ceasCupon = setTimeout(() => void verificaCupon(), 350);
});

document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b || b.disabled) return;
  const id = stare.asociatieId;
  if (b.dataset.plan) {
    const codCupon = $("cod-cupon").value.trim() || null;
    const gratuit = Number(stare.planuri.find((p) => p.cod === b.dataset.plan).pretLunar) === 0;
    void operatie(b, async () => {
      const r = await api(`/api/asociatii/${id}/abonament`, "POST", { planCod: b.dataset.plan, codCupon: gratuit ? null : codCupon });
      if (codCupon && !gratuit) { $("cod-cupon").value = ""; stare.reduceri = {}; $("cupon-info").textContent = ""; }
      return r;
    });
  } else if (b.dataset.plata) void operatie(b, () => api(`/api/comenzi/${b.dataset.plata}/plata`, "POST"));
  else if (b.dataset.anulare) void operatie(b, () => api(`/api/comenzi/${b.dataset.anulare}/anulare`, "POST"));
  else if (b.dataset.pachet) void operatie(b, () => api(`/api/asociatii/${id}/pachete`, "POST", { pachetId: Number(b.dataset.pachet) }));
  else if (b.dataset.actiune) void operatie(b, () => api(`/api/asociatii/${id}/actiuni`, "POST", { cod: b.dataset.actiune }));
});

porneste().catch((e) => mesaj(`Nu am putut încărca datele: ${e.message}`, "eroare"));
