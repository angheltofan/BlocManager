// Pagina de administrare (servita de web-api la /admin/cupoane.html): front-end pentru operatiile CRUD ale API-ului de cupoane (Laboratorul 7):
//   GET /api/cupoane, GET /api/cupoane/:id, POST /api/cupoane, PUT /api/cupoane/:id,
//   DELETE /api/cupoane/:id (stergere logica), POST /api/cupoane/:id/restaurare
"use strict";

const $ = (id) => document.getElementById(id);
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const zi = (iso) => iso.split("-").reverse().join(".");
const procent = (n) => n.toLocaleString("ro-RO", { maximumFractionDigits: 2 }) + "%";
const STARE = { ACTIV: ["Activ", "verde"], INACTIV: ["Inactiv", "gri"], EXPIRAT: ["Expirat", "gri"], EPUIZAT: ["Epuizat", "galben"], STERS: ["Șters", "rosu"] };
let planuri = [];
let editatId = null; // null = cupon nou
let deStersId = null;

async function api(cale, metoda = "GET", corp) {
  const r = await fetch(cale, { method: metoda, headers: corp ? { "Content-Type": "application/json" } : {}, body: corp ? JSON.stringify(corp) : undefined });
  const date = r.status === 204 ? null : await r.json();
  if (!r.ok) throw Object.assign(new Error(date?.eroare ?? `Eroare ${r.status}`), { status: r.status, date });
  return date;
}

let ceas;
function mesaj(text, tip = "ok") {
  const el = $("mesaj");
  el.textContent = text;
  el.className = `mesaj ${tip}`;
  el.hidden = false;
  clearTimeout(ceas);
  ceas = setTimeout(() => (el.hidden = true), 5000);
}

const eticheta = (s) => `<span class="eticheta ${STARE[s][1]}">${STARE[s][0]}</span>`;

// ---- Get: lista ----
async function incarcaLista() {
  const cupoane = await api(`/api/cupoane${$("sterse").checked ? "?sterse=1" : ""}`);
  $("lista").innerHTML = cupoane.length
    ? cupoane
        .map(
          (c) => `<tr class="${c.stare === "STERS" ? "rand-sters" : ""}">
      <td><button class="legatura cod" data-detalii="${c.id}">${esc(c.cod)}</button></td>
      <td class="numar">${procent(c.reducereProcent)}</td>
      <td>${c.planDenumire ? `Planul ${esc(c.planDenumire)}` : "Orice plan plătit"}</td>
      <td>${zi(c.valabilPana)}</td>
      <td class="numar">${c.utilizari} / ${c.utilizariMaxime}</td>
      <td>${eticheta(c.stare)}</td>
      <td class="legaturi">${
        c.stare === "STERS"
          ? `<button class="legatura" data-restaurare="${c.id}">Restaurează</button>`
          : `<button class="legatura" data-editare="${c.id}">Modifică</button> <button class="legatura pericol" data-stergere="${c.id}">Șterge</button>`
      }</td>
    </tr>`,
        )
        .join("")
    : `<tr><td colspan="7" class="estompat">Nu există cupoane.</td></tr>`;
}

// ---- Get(id): detalii ----
async function arataDetalii(id) {
  const c = await api(`/api/cupoane/${id}`);
  const el = $("detalii");
  el.hidden = false;
  el.innerHTML = `<div class="antet-sectiune"><div><p class="eticheta-mica">GET /api/cupoane/${c.id}</p><h2 class="cod">${esc(c.cod)} ${eticheta(c.stare)}</h2></div>
    <button class="buton" data-inchide-detalii>Închide</button></div>
    <dl class="grila-detalii">
      <div><dt>Reducere</dt><dd>${procent(c.reducereProcent)}</dd></div>
      <div><dt>Valabil pentru</dt><dd>${c.planDenumire ? `Planul ${esc(c.planDenumire)} (${esc(c.planCod)})` : "Orice plan plătit"}</dd></div>
      <div><dt>Valabil până la</dt><dd>${zi(c.valabilPana)}</dd></div>
      <div><dt>Utilizări</dt><dd>${c.utilizari} din ${c.utilizariMaxime} (rămase ${c.utilizariRamase})</dd></div>
      <div><dt>Activ</dt><dd>${c.activ ? "Da" : "Nu"}</dd></div>
    </dl>`;
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ---- Post / Put: formularul ----
function golesteErori() {
  document.querySelectorAll("[data-eroare]").forEach((p) => (p.textContent = ""));
  $("formular-eroare").hidden = true;
}

async function deschideFormular(id) {
  editatId = id;
  golesteErori();
  const f = $("formular");
  f.reset();
  if (id === null) {
    $("formular-titlu").textContent = "Cupon nou";
    $("f-data").value = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
    $("f-max").value = 1;
    $("f-activ").checked = true;
  } else {
    const c = await api(`/api/cupoane/${id}`);
    $("formular-titlu").textContent = `Modifică cuponul ${c.cod}`;
    $("f-cod").value = c.cod;
    $("f-procent").value = c.reducereProcent;
    $("f-plan").value = c.planCod ?? "";
    $("f-data").value = c.valabilPana;
    $("f-max").value = c.utilizariMaxime;
    $("f-activ").checked = c.activ;
  }
  $("formular-dialog").showModal();
  $("f-cod").focus();
}

$("formular").addEventListener("submit", async (e) => {
  e.preventDefault();
  golesteErori();
  const corp = {
    cod: $("f-cod").value.trim(),
    reducereProcent: $("f-procent").value === "" ? null : Number($("f-procent").value),
    planCod: $("f-plan").value || null,
    valabilPana: $("f-data").value,
    utilizariMaxime: $("f-max").value === "" ? null : Number($("f-max").value),
    activ: $("f-activ").checked,
  };
  const buton = $("salveaza");
  buton.disabled = true;
  try {
    const c = editatId === null ? await api("/api/cupoane", "POST", corp) : await api(`/api/cupoane/${editatId}`, "PUT", corp);
    $("formular-dialog").close();
    mesaj(editatId === null ? `Cuponul ${c.cod} a fost adăugat (POST, 201).` : `Cuponul ${c.cod} a fost modificat (PUT, 200).`);
    await incarcaLista();
    await arataDetalii(c.id);
  } catch (err) {
    const erori = err.date?.erori ?? {};
    for (const [camp, text] of Object.entries(erori)) {
      const p = document.querySelector(`[data-eroare="${camp}"]`);
      if (p) p.textContent = text;
    }
    const general = $("formular-eroare");
    general.textContent = `${err.message} (HTTP ${err.status ?? "?"})`;
    general.hidden = false;
  } finally {
    buton.disabled = false;
  }
});

// ---- Delete ----
async function cereStergere(id) {
  const c = await api(`/api/cupoane/${id}`);
  deStersId = id;
  $("stergere-titlu").textContent = `Ștergi cuponul ${c.cod}?`;
  $("stergere-text").textContent = "Ștergerea este logică: cuponul nu mai apare în listă și nu mai poate fi folosit, dar rămâne în baza de date și poate fi restaurat.";
  $("stergere-dialog").showModal();
}

$("confirma-stergere").addEventListener("click", async () => {
  try {
    await api(`/api/cupoane/${deStersId}`, "DELETE");
    $("stergere-dialog").close();
    $("detalii").hidden = true;
    mesaj("Cuponul a fost șters (DELETE, 204).");
    await incarcaLista();
  } catch (err) {
    mesaj(err.message, "eroare");
  }
});

// ---- evenimente ----
document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.id === "nou") void deschideFormular(null);
  else if (b.dataset.detalii) void arataDetalii(b.dataset.detalii).catch((err) => mesaj(err.message, "eroare"));
  else if (b.dataset.editare) void deschideFormular(Number(b.dataset.editare)).catch((err) => mesaj(err.message, "eroare"));
  else if (b.dataset.stergere) void cereStergere(Number(b.dataset.stergere)).catch((err) => mesaj(err.message, "eroare"));
  else if (b.dataset.restaurare)
    void api(`/api/cupoane/${b.dataset.restaurare}/restaurare`, "POST")
      .then((c) => (mesaj(`Cuponul ${c.cod} a fost restaurat; este inactiv până îl activezi.`), incarcaLista()))
      .catch((err) => mesaj(err.message, "eroare"));
  else if ("inchide" in b.dataset) b.closest("dialog").close();
  else if ("inchideDetalii" in b.dataset) $("detalii").hidden = true;
});
$("sterse").addEventListener("change", () => void incarcaLista());

async function porneste() {
  api("/api/config").then((c) => document.querySelectorAll("[data-admin]").forEach((a) => (a.href = c.adresaAdmin + a.dataset.admin))).catch(() => {});
  planuri = (await api("/api/planuri")).filter((p) => Number(p.pretLunar) > 0);
  $("f-plan").innerHTML = `<option value="">Orice plan plătit</option>` + planuri.map((p) => `<option value="${p.cod}">${esc(p.denumire)}</option>`).join("");
  await incarcaLista();
}
porneste().catch((e) => mesaj(`Nu am putut încărca datele: ${e.message}`, "eroare"));
