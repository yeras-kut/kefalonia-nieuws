#!/usr/bin/env bash
# Haalt de nieuwste editie op en zet hem als concept in Spark.
# Wordt door macOS dagelijks gestart; het script doet zelf niets als de editie
# van deze week al klaargezet is, dus een gemiste maandag wordt de dag erna
# ingehaald.
set -uo pipefail
cd "/Users/yerassimo/Desktop/Claude-projecten/Wekelijks nieuws kefalonia" || exit 1

echo "--- $(date '+%Y-%m-%d %H:%M') ---"

# Nieuwe editie ophalen die de cloud-agent gepubliceerd heeft
/usr/bin/git pull --rebase --quiet origin main || { echo "git pull mislukte"; exit 1; }

# Spark moet draaien; anders morgen opnieuw
if ! pgrep -qx "Spark" && ! pgrep -qf "Spark.app"; then
  echo "Spark Desktop draait niet — morgen opnieuw."
  exit 0
fi

/Users/yerassimo/.local/bin/node scripts/spark-concept.mjs
