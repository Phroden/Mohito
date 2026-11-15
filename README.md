# Mohito 🍹

Musikkønsker når Frode spiller. Gjestene skanner en QR-kode, ønsker seg en låt (med forslag mens de skriver),
og ønsket dukker opp i lista i Herah – som bare Frode ser.

- **Ønskesiden** (dette repoet): statiske filer i `site/` på `mohito.frodewerner.no`.
- **Backend**: Herah (`api/mohito.ts` i repoet `data`). Caddy sender `/api/mohito*` dit.
- **DJ-lista**: i Herah under Apper → **Mohito** (`#/mohito`): åpne/stenge, QR-kode (også stor og til utskrift),
  ønskene med antall, hilsener og om låta finnes i VINYL DB (BPM og toneart). «✓ Spilt» / «Hopp over».

## Slik brukes det
1. Åpne Mohito i Herah, skriv navnet på kvelden og trykk **Åpne for ønsker** (stenger av seg selv etter valgt antall timer).
2. **Vis QR stort** på en skjerm, eller skriv den ut.
3. Ønskene kommer inn i lista. Like låter slås sammen («×3»).
4. **Ny kode** gjør gamle QR-koder ugyldige.

## Installere på serveren
1. DNS: A-post for `mohito.frodewerner.no` til samme server som Herah.
2. Oppdater Herah (`data-update`), så finnes `/api/mohito*`.
3. `git clone https://github.com/Phroden/mohito /root/mohito && bash /root/mohito/server/install.sh`

## Personvern og sikkerhet
- Uten riktig kode i QR-adressen (`?k=…`) og uten at lista er åpen, tas ingenting imot.
- Navn og hilsen er valgfritt. Ønskene vises aldri offentlig og er skjult for KI i Herah.
- Låtforslagene hentes av Herah fra Deezers åpne søk – gjestens mobil snakker bare med mohito.frodewerner.no.
- Streng CSP (ingen inline-skript eller -stil), `Referrer-Policy: no-referrer` (koden lekker ikke), `noindex`.
