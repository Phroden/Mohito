#!/usr/bin/env bash
# Installerer eller oppdaterer ønskesiden på Herah-serveren. Kjøres som root fra repoet:
#   cd /root/mohito && git pull && bash server/install.sh
# Trygt å kjøre på nytt. Krever at Herah (data-api) er installert og at DNS for mohito.frodewerner.no peker hit.
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "Kjør som root"; exit 1; }
SRC="$(cd "$(dirname "$0")/.." && pwd)"
WWW=/var/www/mohito

echo "==> Filene til $WWW"
mkdir -p "$WWW"
rsync -a --delete "$SRC/site/" "$WWW/" 2>/dev/null || { rm -rf "$WWW"/*; cp -r "$SRC/site/." "$WWW/"; }
chmod -R a+rX "$WWW"

echo "==> Caddy"
mkdir -p /etc/caddy/sites
cp "$SRC/server/mohito.caddy" /etc/caddy/sites/mohito.caddy
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null
systemctl reload caddy

echo "==> Sjekker"
sleep 2
if curl -fsS https://mohito.frodewerner.no/api/mohito >/dev/null 2>&1; then
  echo "Ønskesiden svarer: https://mohito.frodewerner.no"
else
  echo "Svarer ikke ennå. Sjekk DNS for mohito.frodewerner.no og at Herah er oppdatert (data-update)."
fi
