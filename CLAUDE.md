# Mohito – mohito.frodewerner.no

Ønskesiden for musikkønsker. Statiske filer (`site/`), ingen byggesteg. Backend er Herah (repoet `data`, `api/mohito.ts`, DJ-lista i `api/public/mohito.js`).

## Struktur
- `site/index.html`, `site/app.js`, `site/style.css`, `site/favicon.svg` – siden. Tilstander: henter / uten kode / stengt / åpen / sendt, og «Dine ønsker».
- `server/mohito.caddy` – Caddy: filene fra `/var/www/mohito`, `/api/mohito*` til Herah på 127.0.0.1:8080, CSP og andre hoder.
- `server/install.sh` – kopierer filene og Caddy-fila på serveren.

## API (Herah, samme adresse)
- `GET /api/mohito?k=` → `{ kode_ok, aapen, kveld, tekst }`
- `GET /api/mohito/sok?k=&q=` → `{ treff: [{ tittel, artist, album }] }` (Deezer via Herah; tomt ved feil)
- `POST /api/mohito/onske {k, laat, artist?, hilsen?, fra?, nettside}` → `{ ok, id, antall }` (`nettside` = felle for roboter, Origin må være samme vert)
- `GET /api/mohito/status?k=&ids=` → `{ status: { id: "venter" | "spilt" } }`

## Regler
- All tekst på norsk.
- Streng CSP: ingen inline-skript, ingen `style`-attributter i HTML, ingen eksterne skrifter/skript. Tekst fra brukere settes med `textContent`.
- Øk `?v=` på `app.js`/`style.css` i `index.html` når de endres.
- Ingen hemmeligheter eller data i repoet. Koden i QR-adressen lagres bare i Herah.
- Sjekk på mobilstørrelse i nettleser.
