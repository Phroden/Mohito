// Mohito – ønskesiden. Snakker bare med /api/mohito* på samme adresse (Caddy sender det til Herah).
// Koden fra QR-adressen (?k=…) må være med på alt. Tekst fra gjestene settes alltid med textContent.
"use strict";

const $ = (id) => document.getElementById(id);
const STATES = ["loading", "nocode", "closed", "open", "done"];
const params = new URLSearchParams(location.search);
const KEY = "mohito";

// Koden huskes på mobilen, så siden virker om den åpnes igjen fra historikken uten ?k=
function store() { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } }
function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* privat modus: bare denne gangen */ } }
let state = store();
const code = (params.get("k") || state.k || "").trim();
if (params.get("k") && params.get("k") !== state.k) { state = { k: params.get("k"), mine: [], fra: state.fra || "" }; save(state); }
state.mine = Array.isArray(state.mine) ? state.mine : [];

let current = null; // åpen/stengt sist vi spurte
let doneShown = false;

function show(name) {
  for (const s of STATES) $(s).hidden = s !== name;
}

async function getJson(path) {
  const r = await fetch(path, { headers: { accept: "application/json" }, cache: "no-store" });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(d.error || "Noe gikk galt"), { status: r.status });
  return d;
}

// ---------------------------------------------------------------------------
// Åpen eller stengt
// ---------------------------------------------------------------------------
async function refresh() {
  if (!code) { show("nocode"); return; }
  let d;
  try { d = await getJson(`/api/mohito?k=${encodeURIComponent(code)}`); }
  catch { if (!current) show("closed"); return; } // uten nett: prøv igjen om litt
  $("kveld").textContent = d.kveld || "Mohito";
  const note = $("tekst");
  note.textContent = d.tekst || "";
  note.hidden = !d.tekst;
  if (!d.kode_ok) { state.mine = []; save(state); renderMine(); show("nocode"); current = "nocode"; return; }
  const next = d.aapen ? "open" : "closed";
  if (next !== current) {
    current = next;
    if (!(next === "open" && doneShown)) show(next);
  }
}

// ---------------------------------------------------------------------------
// Låtforslag
// ---------------------------------------------------------------------------
const laat = $("laat"), artist = $("artist"), list = $("forslag");
let searchTimer = null, searchSeq = 0, active = -1, items = [];

function closeSuggest() {
  list.hidden = true;
  list.replaceChildren();
  laat.setAttribute("aria-expanded", "false");
  laat.removeAttribute("aria-activedescendant");
  items = [];
  active = -1;
}

function pick(t) {
  laat.value = t.tittel;
  artist.value = t.artist;
  closeSuggest();
  $("hilsen").focus();
}

function renderSuggest(treff) {
  items = treff;
  active = -1;
  list.replaceChildren(...treff.map((t, i) => {
    const li = document.createElement("li");
    li.id = `forslag-${i}`;
    li.setAttribute("role", "option");
    const b = document.createElement("b");
    b.textContent = t.tittel;
    const s = document.createElement("span");
    s.textContent = t.album ? `${t.artist} · ${t.album}` : t.artist;
    li.append(b, s);
    // mousedown (ikke click), så feltet ikke mister fokus og lukker lista først
    li.addEventListener("mousedown", (e) => { e.preventDefault(); pick(t); });
    return li;
  }));
  list.hidden = !treff.length;
  laat.setAttribute("aria-expanded", String(!!treff.length));
}

function search() {
  clearTimeout(searchTimer);
  const q = `${laat.value} ${artist.value}`.trim();
  if (q.length < 2) { closeSuggest(); return; }
  searchTimer = setTimeout(async () => {
    const seq = ++searchSeq;
    try {
      const d = await getJson(`/api/mohito/sok?k=${encodeURIComponent(code)}&q=${encodeURIComponent(q)}`);
      if (seq === searchSeq && document.activeElement === laat) renderSuggest(d.treff || []);
    } catch { closeSuggest(); } // forslagene er bare en hjelp
  }, 280);
}

laat.addEventListener("input", search);
laat.addEventListener("blur", () => setTimeout(closeSuggest, 120));
laat.addEventListener("keydown", (e) => {
  if (list.hidden || !items.length) return;
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    active = (active + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
    [...list.children].forEach((li, i) => li.setAttribute("aria-selected", String(i === active)));
    laat.setAttribute("aria-activedescendant", `forslag-${active}`);
  } else if (e.key === "Enter" && active >= 0) {
    e.preventDefault();
    pick(items[active]);
  } else if (e.key === "Escape") closeSuggest();
});

// ---------------------------------------------------------------------------
// Sende
// ---------------------------------------------------------------------------
const form = $("form"), err = $("error"), send = $("send");
$("fra").value = state.fra || "";

function fail(msg) {
  err.textContent = msg;
  err.hidden = false;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  err.hidden = true;
  closeSuggest();
  const body = {
    k: code,
    laat: laat.value.trim(),
    artist: artist.value.trim(),
    hilsen: $("hilsen").value.trim(),
    fra: $("fra").value.trim(),
    nettside: form.elements.nettside.value,
  };
  if (!body.laat) { fail("Skriv hvilken låt du ønsker deg."); laat.focus(); return; }
  send.disabled = true;
  send.textContent = "Sender …";
  try {
    const r = await fetch("/api/mohito/onske", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      if (r.status === 403) refresh();
      throw new Error(d.error || "Ønsket kom ikke fram. Prøv igjen.");
    }
    state.fra = body.fra;
    if (!state.mine.some((m) => m.id === d.id)) state.mine.unshift({ id: d.id, laat: body.laat, artist: body.artist, at: Date.now() });
    state.mine = state.mine.slice(0, 20);
    save(state);
    $("done-song").textContent = body.artist ? `${body.laat} – ${body.artist}` : body.laat;
    const c = $("done-count");
    c.textContent = d.antall > 1 ? `Du er nummer ${d.antall} som ønsker deg denne!` : "";
    c.hidden = !(d.antall > 1);
    laat.value = artist.value = $("hilsen").value = "";
    doneShown = true;
    show("done");
    renderMine();
    $("again").focus();
  } catch (x) {
    fail(x.message === "Failed to fetch" ? "Fikk ikke kontakt. Sjekk nettet og prøv igjen." : x.message);
  } finally {
    send.disabled = false;
    send.textContent = "Send ønsket";
  }
});

$("again").addEventListener("click", () => {
  doneShown = false;
  current = null;
  show("loading");
  refresh().then(() => { if (current === "open") laat.focus(); });
});

// ---------------------------------------------------------------------------
// Dine ønsker: «I køen» eller «Spilt 🎉» (siste 12 timer)
// ---------------------------------------------------------------------------
let statuses = {};
function renderMine() {
  const recent = state.mine.filter((m) => Date.now() - m.at < 12 * 3600_000);
  $("mine").hidden = !recent.length;
  $("mine-list").replaceChildren(...recent.map((m) => {
    const li = document.createElement("li");
    const t = document.createElement("span");
    t.className = "mine-song";
    const b = document.createElement("b");
    b.textContent = m.laat;
    t.append(b, m.artist ? ` – ${m.artist}` : "");
    const s = document.createElement("span");
    const played = statuses[m.id] === "spilt";
    s.className = `pill${played ? " played" : ""}`;
    s.textContent = played ? "Spilt 🎉" : "I køen";
    li.append(t, s);
    return li;
  }));
}

async function refreshMine() {
  const ids = state.mine.filter((m) => Date.now() - m.at < 12 * 3600_000).map((m) => m.id);
  if (!ids.length || !code) return;
  try {
    const d = await getJson(`/api/mohito/status?k=${encodeURIComponent(code)}&ids=${ids.join(",")}`);
    statuses = d.status || {};
    renderMine();
  } catch { /* prøver igjen senere */ }
}

// ---------------------------------------------------------------------------
// Start, og sjekk igjen av og til (siden åpner seg av seg selv)
// ---------------------------------------------------------------------------
renderMine();
refresh();
refreshMine();
setInterval(() => { if (!document.hidden) refresh(); }, 20_000);
setInterval(() => { if (!document.hidden) refreshMine(); }, 30_000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) { refresh(); refreshMine(); } });
