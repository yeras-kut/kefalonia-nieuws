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
5. `scripts/stuur-mail.mjs` maakt de mail en verstuurt hem via Resend naar de
   ontvangers.

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
