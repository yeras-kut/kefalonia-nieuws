# Werkwijze voor de wekelijkse agent

Dit is de instructie die de cloud-agent elke maandagochtend volgt. Pas dit bestand
aan als je de nieuwsbrief anders wilt hebben — de agent leest het elke week opnieuw.

## Het gebied: Kefalonia

De nieuwsbrief gaat over **Kefalonia**, niet over Ithaka. Geen aparte rubriek
Ithaka, en geen berichten die alleen daar spelen — geen gemeenteraad van Vathy,
geen Ithakese festivals, geen toerismebeleid van het buureiland.

Eén uitzondering: bestuurlijk vormen de eilanden vaak één geheel, en dan gaat het
bericht ook over Kefalonia. De vicegouverneur van "Kefalonia en Ithaka", de
politiebezetting van beide eilanden, de veerverbindingen, het ziekenhuis van
Argostoli waar patiënten van Ithaka naartoe gaan: die horen er gewoon in. De
vuistregel is of een lezer op Kefalonia er iets aan heeft.

## 1. Nieuws ophalen

```sh
npm_config_yes=true node scripts/haal-nieuws.mjs 7 > ruwe-oogst.json
```

Dit levert een JSON met alle berichten van de afgelopen zeven dagen uit de bronnen
in `bronnen.json`. Er zit nog Ithakees nieuws in de oogst, omdat veel bronnen
beide eilanden bedienen; filter dat er bij het schrijven uit volgens de regel
hierboven. Controleer het logboek dat naar stderr gaat: als meer dan twee
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
dat is juist het signaal dat ze belangrijk zijn. Staat **hetzelfde voorval** bij
meerdere bronnen, dan wordt dat één bericht. Verschillende voorvallen blijven
verschillende berichten, ook als ze op elkaar lijken of in dezelfde week vielen;
zie "Eén bericht, één gebeurtenis" hieronder.

## 2b. De artikelen zelf lezen

De oogst geeft per bericht alleen de titel en de eerste vier-, vijfhonderd tekens.
Dat is genoeg om te kiezen, niet om te schrijven. **Schrijf geen bericht, feitje
of agendapunt waarvan je het artikel niet helemaal gelezen hebt.** Haal de tekst
van alles wat je wilt opnemen op:

```sh
node scripts/haal-artikel.mjs <link> <link> ... > artikelen.txt
```

Dat geeft de volledige Griekse tekst, alinea voor alinea. Gebruik dit script en
niet WebFetch: WebFetch geeft een samenvatting terug, en dan vertaal je een
samenvatting in plaats van het artikel. Meldt het script `MISLUKT`, dan komt dat
bericht niet in de editie, tenzij hetzelfde verhaal bij een andere bron wel
binnenkomt. Liever vijftien berichten die kloppen dan dertig waarvan de helft
uit een kopregel is afgeleid.

## 3. De editie schrijven

Schrijf `edities/JJJJ-MM-DD.json` (de datum van die maandag). Zie een bestaande
editie voor de precieze vorm. Wat er in moet:

- **titel** — geen "Nieuws week 38", maar de week in één zin gevat. Noem twee of
  drie concrete dingen, in gewone woorden: wat er gebeurde, niet een beeld ervan.
  "Lekkage in de sporthal van Argostoli", niet "de eerste regen vond elk lek terug". **Begin met iets positiefs of opmerkelijks als dat er is.**
  Een titel die opent met een sterfgeval of een ramp zet de hele editie in een
  toon die zelden klopt met wat er die week werkelijk speelde.
- **intro** — twee tot drie zinnen die de week samenvatten. Informatief, niet
  dramatisch. Zwaar nieuws mag erin, maar dan zakelijk en zonder opsmuk: schrijf
  "stond stil bij september 1943", niet "herdacht de slachting"; schrijf "het
  veulen heeft het niet gehaald", niet "zag het veulen sterven". Vermijd woorden
  die een groep wegzetten — "inwoners met een buitenlandse nationaliteit", niet
  "buitenlanders". De lezer moet na de intro weten wat er speelde, niet
  bedrukt raken.
- **categorieen** — alleen de categorieën die deze week echt iets te melden hebben.
  Verzin er geen om een lijstje vol te maken; een week met weinig nieuws mag kort.
  Gebruikelijke rubrieken: Onderwijs, Zorg en veiligheid, Infrastructuur en verkeer,
  Veerboten, Cultuur en agenda, Aarde en natuur, Bestuur en politiek, Sport.
- **feitjes** — vijf tot acht opmerkelijke lokale weetjes. Ook hiervoor geldt
  alles onder "Nauwkeurigheid": één artikel per feitje, en niets erbij bedacht. Dit is het lievelingsstuk
  van de lezer, dus besteed er de meeste zorg aan. Goede feitjes zijn concreet,
  verrassend en klein: een raadselachtig krantenbericht uit 1937, het aantal agenten
  op Ithaka, een reddingsteam dat 's nachts uit Athene komt voor één veulen. Geen
  algemeenheden, geen samenvattingen van het grote nieuws.
- **foto's** — de oogst levert bij veel berichten een foto mee, in het veld `foto`
  (`url`, `bijschrift`). Neem die over bij het bericht waar hij bij hoort, en vul
  `bron` aan met de naam van de site. Kies daarnaast één **openingsfoto** voor
  bovenaan de editie: de sterkste foto van de week, bij voorkeur bij het verhaal
  dat ook de titel draagt. Zet die op `openingsfoto` in de hoofdstructuur.
  Berichten zonder foto zijn prima — de pagina vangt dat op. Neem nooit een foto
  bij een bericht waar hij niet bij hoort, en gebruik geen foto bij gevoelig
  nieuws zoals overlijdensberichten of ongelukken tenzij hij neutraal is.
  **Geen AI-plaatjes.** Kefalonia Magazine illustreert nieuws vaak met een
  gegenereerde afbeelding; je herkent ze aan `ChatGPT-Image` in de bestandsnaam.
  Die zijn geen verslag van wat er gebeurd is en horen niet in de editie. Kijk ook
  naar het jaar in het pad: `/uploads/2019/` bij nieuws van deze week is een oude
  archieffoto. Bij een gebouw of een dorp kan dat, bij een gebeurtenis niet.
- **agenda** — wat er de komende twee weken te doen is: feesten, raadsvergaderingen,
  concerten, wegafsluitingen.
- **weer** — een kort algemeen weerbericht voor de week die komt: twee of drie
  zinnen, met temperatuur en wind, en vooral het kantelpunt ("vanaf dinsdag draait
  het"). Geen dag-voor-dagtabel; de lezer wil het gevoel van de week. De bronnen
  publiceren bijna dagelijks een weerstuk (zoek op `kairos` in de oogst); pak het
  meest recente en kijk vooruit, niet terug. Velden: `tekst`, `bron`, `link` en
  eventueel `foto`. Staat er geen weerbericht in de oogst, laat het veld dan weg —
  de pagina en de mail slaan het blok dan over. Dit is het enige stuk dat ook in
  de mail zelf komt, want een link is te laat voor het weer.
- **leukEnOpvallend** — twee tot vier lichte berichten die onderaan de editie
  staan, mét foto: een eiland dat op de landelijke televisie komt, een duikploeg
  die de haven schoonmaakt, het verhaal achter een kerk waar deze week feest is.
  Verschil met **feitjes**: feitjes zijn eenregelige weetjes zonder foto bovenaan,
  dit zijn kleine verhalen van een paar zinnen met een foto erbij. Neem hier geen
  bericht op dat al in een rubriek staat. Velden: `tekst`, `bron`, `link`, `foto`.
- **statistiek** — het aantal bronnen, gescande en relevante berichten.

### Toon

Nederlands, voor iemand die het eiland goed kent en er niet woont. Nuchter en
concreet. Geen persbureau-Nederlands, geen uitroeptekens, geen "het belooft een
prachtig evenement te worden". En geen eigen grapjes of slotzinnen: staat de
humor in het artikel, dan mag je hem overbrengen; staat hij er niet, dan voeg je
hem niet toe. "De club riep op samen vanaf nul te beginnen; dat is letterlijk
gelukt" is een grap van de schrijver over een ploeg die met 0-7 verloor, en
hoort er dus niet in.

### De kop zegt wat er gebeurd is

Een kop is een gewone mededeling: wie of wat, en wat ermee is. De lezer moet aan
de kop alleen kunnen zien waar het bericht over gaat.

- Niet "De eerste regen vond alles terug", wel "Sporthal van Argostoli lekt
  opnieuw bij regen".
- Niet "Het rooster van Patras–Sami–Ithaka houdt op 18 oktober op", wel
  "Vaarschema Patras–Sami loopt tot 18 oktober, nog geen vervolg bekend".
- Niet "1.667 panden in de veiling, en twee streken die niets met elkaar te
  maken hebben", wel "Sinds 2018 kwamen 1.667 panden in een veiling".

Geen beeldspraak, geen woordspel, geen kop die pas na het lezen te begrijpen is.

### Eén bericht, één gebeurtenis

Hier ging het mis, en het is de reden dat teksten onsamenhangend werden. Een
bericht gaat over **één voorval uit één artikel** (of uit meerdere artikelen over
datzelfde voorval). Plak geen losse berichten aan elkaar omdat ze een thema
delen. Lekkage in de sporthal, een ondergelopen boulevard, een natte schoolingang
en uitgevallen verkeerslichten zijn vier berichten, of één bericht plus drie die
je weglaat — nooit één alinea onder één link, want dan klopt de bronvermelding
voor driekwart van de tekst niet.

Dat geldt ook voor het aanhaken van iets anders aan het eind: geen "los daarvan
publiceerde ...", geen "dezelfde week stond er ook ...", geen "vorige week was
het nog ...". Is het tweede onderwerp de moeite waard, dan krijgt het een eigen
bericht met een eigen link. Zo niet, dan vervalt het.

**Opbouw van een bericht:** eerst wat er gebeurd is, waar en wanneer. Dan de
bijzonderheden in de volgorde waarin ze elkaar verklaren. Dan wie er wat over
zegt, en als laatste wat er nog komt. Drie tot vijf zinnen is meestal genoeg.
Elke zin sluit aan op de vorige; een lezer die het artikel niet kent, moet het
bericht in één keer kunnen volgen. Lange opsommingen van namen en functies
horen er niet in: noem alleen wie nodig is om het bericht te begrijpen.

### Vloeiend Nederlands

Dit is het onderdeel waar het in de praktijk misgaat. Je vertaalt uit het Grieks,
en dat is te zien als je niet oppast. Lees elke zin hardop voor je hem laat staan:
struikel je, dan struikelt de lezer ook.

**Vertaal alles, of leg het in een half woord uit.** Laat nooit een Griekse term
staan die een Nederlandse lezer niet kent. Niet "Eparch Sardeli" maar "Smaragda
Sardeli, bestuurder voor Ithaka". Niet "de onderprefect" maar "de vicegouverneur
van de regio". Niet "Odos Souidias" maar "de Zwedenstraat". Afkortingen krijgen
één keer hun betekenis: "EMAK, de Griekse reddingsbrigade", "het TEI, de
technische hogeschool die Lixouri kwijtraakte". Partijnamen en clubs idem:
"Laïki Syspirosi, de lijst van de communistische partij".

**Geen telegramstijl die betekenis kost.** "Renovatie bijna klaar, bezetting niet"
laat de lezer raden. Schrijf op wat je bedoelt: "De verbouwing is bijna af, maar
er zijn nog steeds te weinig artsen."

**Let op woorden met een lading.** Een ramp heeft geen "verjaardag" — schrijf
"83 jaar na". Mensen "sterven" niet in een kop als "overleden" ook kan. En
schrijf over mensen zoals je over je buren zou schrijven.

**Laat het oordeel aan de lezer.** Niet "de vraag die de lokale pers stelt is de
enige die telt", niet "wat op zichzelf al iets zegt over de ambitie". Meld wat er
gebeurde en wie wat vindt; de lezer trekt zelf zijn conclusie. Een droge
constatering mag, een preek niet.

**Plaatsnamen zonder Griekse accenten.** Farakláta wordt Faraklata, Lixoúri wordt
Lixouri. Gebruik de gangbare Latijnse schrijfwijze: Argostoli, Ithaka, Paliki,
Ainos, Sami, Poros, Fiskardo.

**Namen van personen** krijgen er bij eerste vermelding bij wie ze zijn. "Makis
Theotokatos" zegt niemand iets; "journalist Makis Theotokatos" wel.

### Links

Gebruik altijd de **directe link naar het artikel**, zoals die in de oogst staat
bij `link`. Nooit de homepage van de site. Een lezer die op de bronvermelding
klikt moet bij het verhaal uitkomen, niet op een voorpagina waar het bericht een
dag later al weggezakt is. Behandelt een bericht meerdere bronnen, kies dan de
bron met het uitgebreidste artikel en link daarheen.

### Nauwkeurigheid

Je taak is vertalen en samenvatten, niet duiden. **Elke bewering in een bericht
moet aan te wijzen zijn in het artikel waar de link naartoe gaat.** Kun je de zin
niet aanwijzen, dan gaat hij eruit. Kun je een feit niet hard krijgen, laat het
dan weg — er is elke week meer dan genoeg.

**Leg zelf geen verbanden.** Niet tussen twee berichten uit dezelfde week, niet
met een bericht uit een eerdere editie, en niet met wat je over het eiland weet.
Het voorbeeld waar dit op terugvoert: in september botste een jongen op een step
op een paard dat door zijn eigenaar aan een touw werd meegevoerd. Een week later
stond er een bericht dat de halfwilde paarden van de Ainos in Platies liepen. De
editie zette daar "precies bij die weg botste vorige week een zeventienjarige op
een paard" achter. Dat stond in geen van beide artikelen (het artikel over Platies
noemt niet eens een weg), en het maakte van een paard met een eigenaar een paard van de Ainos. Een verband
mag er alleen in als de bron het zelf legt, en dan met de bron erbij.

**Verzin geen bijzonderheden.** Geen wegnummer, plaats, dag, leeftijd, functie of
oorzaak die niet in het artikel staat. Schrijft de bron "vandaag", reken dan de
dag uit met de publicatiedatum; kun je dat niet, schrijf dan "deze week".

**Houd de slag om de arm van de bron vast.** Een voorstel is geen besluit, een
vraag is geen feit, een beschuldiging is geen vaststelling. Schrijft iemand dat
er "een bord zou moeten komen", dan is er niemand iets gevraagd. Schrijft de bron
dat het aflopen van een vaarschema "op zich niet bewijst dat de lijn stopt", dan
staat dat voorbehoud ook in het bericht, en zeker in de kop en de agenda.
Meningen en beschuldigingen krijgen altijd een afzender: "volgens de
oppositielijst ANASA", "de bouwvakkersvereniging spreekt van".

**Trek geen eigen conclusie.** Niet "de conclusie is duurdere kaartjes", niet
"de vraag is wie het pand mag gebruiken", niet "en met de winter op komst
waarschijnlijk niet de laatste" — tenzij het artikel het zo zegt, en dan zeg je
erbij wie.

**Getallen met hun grondslag.** Neem bij een percentage over waarvan het een
percentage is, en bij een cijfer van wanneer het is. "In Erisos vond 48 procent
een koper" is fout als het gaat om 48 procent van de panden die daadwerkelijk
geveild werden; "18 procent besteed" hoort "volgens cijfers van mei 2026" te
krijgen als dat erbij staat. Reken zelf niets door of bij elkaar op, behalve wat
het artikel al optelt.

**Vertaal wat er staat.** Bij twijfel over een woord: kies de letterlijke
betekenis boven de mooiere. Χαλίκια is grind, geen "stenen". Citaten vertaal je
volledig en zonder ze aan te scherpen; vat je een uitspraak samen, dan zonder
aanhalingstekens.

**Controle voor je publiceert.** Loop de editie na het schrijven één keer langs
met `artikelen.txt` ernaast, bericht voor bericht, en ook de titel, de intro, de
feitjes en de agenda. Streep per bericht weg: elke zin die je niet in het artikel
terugvindt, elke zin die uit een ander artikel komt dan de link, en elke zin
waarin jij iets vindt. Lees het daarna als Nederlands: struikel je over een zin
of snap je niet hoe hij op de vorige volgt, schrijf hem dan korter en gewoner
opnieuw. Noem bij elk bericht de bron en een werkende link.

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

Let op het verschil tussen twee soorten 403. `CONNECT tunnel failed, 403` komt van
de witte lijst: het domein ontbreekt daar. Een kale `HTTP 403` komt van de site
zelf, die het IP-adres van de sandbox weigert. Dat tweede kun je niet oplossen met
de witte lijst. Zo verging het `efimeridakefalonia.gr`, dat lokaal prima werkt maar
in de cloud dichtblijft; die bron is er daarom weer uit gehaald. Het scheelde weinig,
want zijn berichten stonden vrijwel allemaal ook bij een van de andere bronnen.

Bronnen die alleen via Google News binnenkomen (InKefalonia, Kefalonitika Nea,
Portoni) leveren een `news.google.com`-omleiding als link in plaats van het artikel
zelf. Die link werkt voor de lezer, maar zoek eerst of hetzelfde verhaal bij een
bron staat die je rechtstreeks ophaalt, en link dan daarheen.

## 6. Afsluiten

Meld in één alinea: welke verhalen deze week het belangrijkst waren, hoeveel
berichten er gescand zijn, of alle bronnen werkten, en of de mail eruit is.
