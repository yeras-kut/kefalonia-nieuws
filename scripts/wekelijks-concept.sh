#!/usr/bin/env bash
# Zet de nieuwste editie als concept in Spark klaar.
#
# macOS start dit kort na het openen van de laptop en verder elk kwartier zolang
# hij aan staat. Het script is daarom zo gebouwd dat het in het normale geval
# binnen een fractie van een seconde stopt: is de editie die lokaal staat al
# klaargezet, en is er het afgelopen uur al bij GitHub gekeken, dan is er niets
# te doen en raakt het script het netwerk niet aan.
set -uo pipefail

# De map waarin dit script staat, zodat elke werkkopie zichzelf vindt.
MAP=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
GIT=/usr/bin/git
NODE="/Users/yerassimo/.local/bin/node"
# Volledige paden: launchd geeft een kale PATH zonder /usr/local/bin.
SPARK="/usr/local/bin/spark"
cd "$MAP" || exit 1

STAAT="$MAP/.laatst-verstuurd"
GEKEKEN="$MAP/.laatst-gekeken"

nieuwste_editie() {
  ls -1 edities/*.json 2>/dev/null | sort | tail -1 | sed 's|edities/||; s|\.json$||'
}

klaargezet=$( [ -f "$STAAT" ] && tr -d '[:space:]' < "$STAAT" || echo "" )
lokaal=$(nieuwste_editie)

# Recent gekeken én de lokale editie is al verstuurd: niets te doen.
if [ "$klaargezet" = "$lokaal" ] && [ -n "$lokaal" ] \
   && [ -f "$GEKEKEN" ] && [ "$(find "$GEKEKEN" -mmin -60 2>/dev/null)" ]; then
  exit 0
fi

echo "--- $(date '+%Y-%m-%d %H:%M') ---"

# Editie ophalen die de cloud-agent gepubliceerd heeft. Een losse wijziging in
# de map mag dit niet laten struikelen; dan gaan we door met wat er lokaal staat.
if "$GIT" fetch --quiet origin main 2>/dev/null; then
  touch "$GEKEKEN"
  "$GIT" merge --ff-only --quiet origin/main 2>/dev/null \
    || echo "kon niet bijwerken (lokale wijzigingen?) — verder met de lokale editie"
else
  echo "kon niet ophalen van GitHub — verder met de lokale editie"
fi

# Na het ophalen opnieuw kijken of er werk is
lokaal=$(nieuwste_editie)
if [ "$klaargezet" = "$lokaal" ]; then
  echo "Editie $lokaal is al klaargezet. Niets te doen."
  exit 0
fi

# Spark moet antwoorden. Procesnamen veranderen tussen versies, dus we vragen
# het de CLI zelf: reageert die niet, dan is de app dicht en proberen we later.
if ! "$SPARK" accounts >/dev/null 2>&1; then
  echo "Spark Desktop reageert niet — later opnieuw."
  exit 0
fi

"$NODE" scripts/spark-concept.mjs
