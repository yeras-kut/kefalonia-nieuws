#!/usr/bin/env bash
# Zet de gegevens uit instellingen.json als secrets in de GitHub-repo, zodat de
# workflow de mail kan versturen. De waarden worden nergens afgedrukt.
set -euo pipefail
cd "$(dirname "$0")/.."

REPO="yeras-kut/kefalonia-nieuws"
BESTAND="instellingen.json"

[ -f "$BESTAND" ] || { echo "instellingen.json ontbreekt."; exit 1; }
SLEUTEL=$(node -p "require('./$BESTAND').resendSleutel || ''")
[ -n "$SLEUTEL" ] || { echo "Geen resendSleutel in $BESTAND. Vul die eerst in."; exit 1; }

gh secret set RESEND_API_KEY  --repo "$REPO" --body "$SLEUTEL"
gh secret set MAIL_ONTVANGERS --repo "$REPO" --body "$(node -p "require('./$BESTAND').ontvangers.join(',')")"
gh secret set MAIL_AFZENDER   --repo "$REPO" --body "$(node -p "require('./$BESTAND').afzender")"

echo
echo "Klaar. In de repo staan nu:"
gh secret list --repo "$REPO"
