# Kefalonia Wekelijks

Elke maandagochtend een samenvatting van het nieuws van Kefalonia en Ithaka,
als webpagina en als mail.

## Hoe het werkt

1. `scripts/haal-nieuws.mjs` haalt het nieuws van de afgelopen zeven dagen op bij
   alle bronnen in `bronnen.json` — via de WordPress-API van de lokale sites en
   via Google News voor de bronnen die achter Cloudflare zitten.
2. `scripts/relevantie.mjs` filtert het landelijke en internationale nieuws eruit
   dat die sites óók publiceren, en houdt over wat echt over de eilanden gaat.
3. Claude leest de oogst en schrijft er een editie van: `edities/JJJJ-MM-DD.json`.
4. `scripts/bouw-site.mjs` maakt daar `index.html` en het archief van.
5. De push van de editie start de workflow `.github/workflows/stuur-nieuwsbrief.yml`.
   Die verstuurt de mail met `scripts/stuur-mail.mjs` via Gmail (smtp.gmail.com),
   vanaf het adres in secret `GMAIL_GEBRUIKER`, met een app-wachtwoord in secret
   `GMAIL_APP_WACHTWOORD`. De Mac hoeft er niet voor aan te staan. Er gaat pas
   echt mail uit als repo-variabele `MAIL_ACTIEF` op `ja` staat.

Zonder Gmail-secrets valt `stuur-mail.mjs` terug op Resend (dat nooit werkend
geverifieerd is geraakt). Er is ook nog `scripts/spark-concept.mjs`, dat de mail
als concept in Spark zet via een achtergrondtaak op de Mac
(`nl.yerassimo.kefalonia-concept`, uit een tweede werkkopie in
`~/Library/Application Support/kefalonia-nieuws`). Die taak staat uit sinds de
Gmail-route er is; de plist staat als `.plist.uit` in `~/Library/LaunchAgents`.

Stap 1 tot en met 5 draaien elke maandag automatisch in een cloud-agent.

## Zelf draaien

```sh
node scripts/haal-nieuws.mjs 7 > ruwe-oogst.json
# editie schrijven in edities/
node scripts/bouw-site.mjs
node scripts/stuur-mail.mjs --proef   # proef-mail.html bekijken
node scripts/stuur-mail.mjs           # echt versturen
```

## Instellingen

`instellingen.json` bevat de afzender, de ontvangers en de URL van de pagina; de
Resend-sleutel komt uit `RESEND_API_KEY`. Dat bestand staat in `.gitignore`.
`bronnen.json` bevat de bronlijst — daar kun je bronnen bij zetten of uit halen.
