# Werkwijze voor de wekelijkse agent

Dit is de instructie die de cloud-agent elke maandagochtend volgt. Pas dit bestand
aan als je de nieuwsbrief anders wilt hebben — de agent leest het elke week opnieuw.

## 1. Nieuws ophalen

```sh
npm_config_yes=true node scripts/haal-nieuws.mjs 7 > ruwe-oogst.json
```

Dit levert een JSON met alle berichten van de afgelopen zeven dagen uit de bronnen
in `bronnen.json`. Controleer het logboek dat naar stderr gaat: als meer dan twee
bronnen mislukken, meld dat onderaan de editie in plaats van het stil te laten.

## 2. Filteren

Gebruik `scripts/relevantie.mjs` om het landelijke en internationale nieuws eruit
te halen dat de lokale sites óók publiceren:

```sh
node -e 'import("./scripts/relevantie.mjs").then(async ({filter})=>{
  const d=JSON.parse(require("fs").readFileSync("ruwe-oogst.json","utf8"));
  const f=filter(d.berichten);
  require("fs").writeFileSync("relevant.json",JSON.stringify(f,null,1));
  f.slice(0,180).forEach((b,i)=>console.log(`${i+1}. [${b.datum.slice(0,10)}|${b.bron}] ${b.titel}`));
})'
```

Lees die lijst helemaal door. Verhalen komen vaak bij vier of vijf bronnen terug —
dat is juist het signaal dat ze belangrijk zijn. Voeg ze samen tot één bericht.

## 3. De editie schrijven

Schrijf `edities/JJJJ-MM-DD.json` (de datum van die maandag). Zie een bestaande
editie voor de precieze vorm. Wat er in moet:

- **titel** — geen "Nieuws week 38", maar de week in één zin gevat. Noem twee of
  drie concrete dingen. Voorbeeld: "Een muziekschool, een aardbeving en het
  mysterie van de reus".
- **intro** — twee tot drie zinnen die de week samenvatten.
- **categorieen** — alleen de categorieën die deze week echt iets te melden hebben.
  Verzin er geen om een lijstje vol te maken; een week met weinig nieuws mag kort.
  Gebruikelijke rubrieken: Onderwijs, Zorg en veiligheid, Infrastructuur en verkeer,
  Veerboten, Cultuur en agenda, Aarde en natuur, Bestuur en politiek, Ithaka, Sport.
- **feitjes** — vijf tot acht opmerkelijke lokale weetjes. Dit is het lievelingsstuk
  van de lezer, dus besteed er de meeste zorg aan. Goede feitjes zijn concreet,
  verrassend en klein: een raadselachtig krantenbericht uit 1937, het aantal agenten
  op Ithaka, een reddingsteam dat 's nachts uit Athene komt voor één veulen. Geen
  algemeenheden, geen samenvattingen van het grote nieuws.
- **agenda** — wat er de komende twee weken te doen is: feesten, raadsvergaderingen,
  concerten, wegafsluitingen.
- **statistiek** — het aantal bronnen, gescande en relevante berichten.

### Toon

Nederlands, voor iemand die het eiland goed kent en er niet woont. Nuchter en
concreet, met ruimte voor droge humor waar het nieuws daarom vraagt. Geen
persbureau-Nederlands, geen uitroeptekens, geen "het belooft een prachtig
evenement te worden".

Plaats- en persoonsnamen in de gangbare Latijnse schrijfwijze (Lixouri, Argostoli,
Ithaka, Paliki, Ainos). Griekse instellingsnamen mogen blijven staan als er geen
goed Nederlands woord is (ΔΕΥΑΚ, EPAL), met een half woord uitleg erbij.

### Nauwkeurigheid

Schrijf alleen op wat in de bronnen staat. Twijfel je over een getal of een naam,
haal het artikel er dan bij met WebFetch. Noem bij elk bericht de bron en een
werkende link. Kun je een feit niet hard krijgen, laat het dan weg — er is elke
week meer dan genoeg.

## 4. Site bouwen en publiceren

```sh
node scripts/bouw-site.mjs
git add -A
git commit -m "Editie <datum>: <titel>"
git push
```

## 5. Mail versturen

De mail gaat via Resend. `instellingen.json` staat niet in de repo; schrijf hem
eerst met de waarden uit de opdracht. De API-sleutel komt uit de omgevings-
variabele `RESEND_API_KEY`.

```sh
node scripts/stuur-mail.mjs --proef   # controleer proef-mail.html
node scripts/stuur-mail.mjs           # versturen
```

## Let op bij het toevoegen van bronnen

De cloud-omgeving laat alleen verkeer door naar domeinen die op de witte lijst
staan. Zet je een nieuwe bron in `bronnen.json`, dan moet het domein ook bij de
netwerkinstellingen van de omgeving erbij — anders geeft die bron stilletjes een
403 en mis je hem. Het logboek van `haal-nieuws.mjs` laat zien welke bronnen
faalden; controleer dat elke week.

## 6. Afsluiten

Meld in één alinea: welke verhalen deze week het belangrijkst waren, hoeveel
berichten er gescand zijn, of alle bronnen werkten, en of de mail eruit is.
