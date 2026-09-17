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
5. `scripts/spark-concept.mjs` zet de mail als concept in Spark klaar, vanaf
   info@yerassimo.nl. Een dagelijkse achtergrondtaak op de Mac
   (`scripts/wekelijks-concept.sh`) haalt de nieuwe editie op en roept dat aan;
   staat de editie van deze week al klaar, dan doet hij niets.

Er is ook `scripts/stuur-mail.mjs`, dat via de Resend-API verstuurt vanuit een
GitHub Actions-workflow. Dat werkt zodra het domein nieuws.yerassimo.nl bij
Resend geverifieerd is; zolang dat niet zo is, loopt het versturen via Spark.

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
