# Mohito – mohito.frodewerner.no

Ønskesiden for musikkønsker. Statiske filer (`site/`), ingen byggesteg. Backend er Herah (repoet `data`, `api/mohito.ts`, DJ-lista i `api/public/mohito.js`).

## Struktur
- `site/index.html`, `site/app.js`, `site/style.css`, `site/favicon.svg` – siden. Tilstander: henter / uten kode / stengt / åpen / sendt, og «Dine ønsker».
- `site/img/topp-{800,1200,2000}.{webp,jpg}` – toppbildet på ønskesiden (DJ-hunden), beskåret fra Frodes bilde (uten skjermdump-tekst og hjemmestrek). `<picture>` med srcset, gradient ned i bakgrunnen.
- `site/skjerm.html` + `site/skjerm.js` – skjermsiden (`/skjerm?s=…`, Caddy: `try_files {path} {path}.html`): QR-koden stort på iPad/TV, uten Herah. Henter hvert 15. s (følger åpen/stengt og ny kode), holder skjermen våken, fullskjerm og utskrift.
- `server/mohito.caddy` – Caddy: filene fra `/var/www/mohito`, `/api/mohito*` til Herah på 127.0.0.1:8080, CSP og andre hoder.
- `server/install.sh` – kopierer filene og Caddy-fila på serveren.

## API (Herah, samme adresse)
- `GET /api/mohito?k=` → `{ kode_ok, aapen, kveld, tekst }`
- `GET /api/mohito/sok?k=&q=` → `{ treff: [{ tittel, artist, album }] }` (Deezer via Herah; tomt ved feil)
- `POST /api/mohito/onske {k, laat, artist?, hilsen?, fra?, nettside}` → `{ ok, id, antall }` (`nettside` = felle for roboter, Origin må være samme vert)
- `GET /api/mohito/skjerm?s=` → `{ aapen, aapen_til, kveld, host, qr }` (QR som SVG; egen skjermlenke fra Mohito i Herah)
- `GET /api/mohito/status?k=&ids=` → `{ status: { id: "venter" | "spilt" } }`

## Regler
- All tekst på norsk.
- Streng CSP: ingen inline-skript, ingen `style`-attributter i HTML, ingen eksterne skrifter/skript. Tekst fra brukere settes med `textContent`.
- Øk `?v=` på `app.js`/`style.css` i `index.html` når de endres.
- Ingen hemmeligheter eller data i repoet. Koden i QR-adressen lagres bare i Herah.
- Sjekk på mobilstørrelse i nettleser.
