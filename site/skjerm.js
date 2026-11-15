// Mohito – skjermsiden (/skjerm?s=…): QR-koden for gjestene på en iPad, TV eller ekstra skjerm, uten Herah.
// Henter fra Herah hvert 15. sekund, så den følger med når lista åpnes/stenges eller koden byttes.
"use strict";

const $ = (id) => document.getElementById(id);
const s = new URLSearchParams(location.search).get("s") || "";
let lastQr = "";

function show({ kicker, title, sub, qr, host }) {
  $("kveld").textContent = kicker || "Mohito";
  $("title").textContent = title;
  $("sub").textContent = sub || "";
  $("sub").hidden = !sub;
  $("host").textContent = host || "";
  $("host").hidden = !host;
  if (qr && qr !== lastQr) {
    lastQr = qr;
    $("qr").src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr)}`;
  }
  $("qrbox").hidden = !qr;
  document.body.classList.toggle("has-qr", !!qr);
}

async function refresh() {
  if (!s) {
    show({ title: "Mangler skjermlenka", sub: "Åpne skjermlenka fra Mohito i Herah («Kopier skjermlenke»)." });
    return;
  }
  try {
    const r = await fetch(`/api/mohito/skjerm?s=${encodeURIComponent(s)}`, { cache: "no-store", headers: { accept: "application/json" } });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { show({ title: "Skjermlenka virker ikke", sub: d.error || "Kopier en ny lenke fra Mohito i Herah." }); return; }
    if (d.aapen) show({ kicker: d.kveld, title: "Ønsk deg en låt!", sub: "Skann QR-koden med kameraet på mobilen", qr: d.qr, host: d.host });
    else show({ kicker: d.kveld, title: "Ønskelista åpner snart 🍹", sub: "Her kommer QR-koden når DJ-en tar imot ønsker." });
  } catch {
    // uten nett: behold det som vises, og prøv igjen
  }
}

// Skjermen skal ikke sovne (iPad, mobil). Må bes om på nytt når siden blir synlig igjen.
let lock = null;
async function keepAwake() {
  try { if ("wakeLock" in navigator && !document.hidden) lock = await navigator.wakeLock.request("screen"); } catch { /* ikke støttet */ }
}

// Knappene forsvinner når musa/fingeren er i ro
let idle = null;
function wake() {
  document.body.classList.add("tools-on");
  clearTimeout(idle);
  idle = setTimeout(() => document.body.classList.remove("tools-on"), 3000);
}
for (const ev of ["mousemove", "touchstart", "keydown"]) document.addEventListener(ev, wake, { passive: true });

const full = $("full");
if (!document.documentElement.requestFullscreen) full.hidden = true;
full.addEventListener("click", () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen().catch(() => {});
});
$("print").addEventListener("click", () => window.print());

refresh();
keepAwake();
wake();
setInterval(refresh, 15_000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) { refresh(); keepAwake(); } });
