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
in `bronnen.json`. Controleer het logboek dat naar stderr gaat: als meer dan twee
bronnen mislukken, meld dat onderaan de editie in plaats van het stil te laten.

## 2. Filteren en ordenen

```sh
node scripts/overzicht.mjs ruwe-oogst.json > overzicht.txt
```

Dit haalt het landelijke en internationale nieuws eruit dat de lokale sites óók
publiceren, laat berichten die alleen over Ithaka gaan vallen, en zet berichten
over hetzelfde onderwerp bij elkaar. Bovenaan staat wat bij de meeste bronnen
terugkwam: dat een verhaal bij vijf sites staat, is het beste teken dat het
ertoe doet.

**Lees `overzicht.txt` helemaal, tot de laatste regel.** Het zijn een paar
honderd koppen. Wat je niet gelezen hebt, kun je ook niet kiezen, en het kleine
nieuws onderaan levert vaak de beste feitjes op. Het groeperen is grof (op
gedeelde woorden in de kop): of twee berichten echt over hetzelfde voorval gaan,
beslis je zelf bij het lezen.

Staat **hetzelfde voorval** bij meerdere bronnen, dan wordt dat één bericht.
Verschillende voorvallen blijven verschillende berichten, ook als ze op elkaar
lijken of in dezelfde week vielen; zie "Eén bericht, één gebeurtenis" hieronder.

## 2b. De artikelen zelf lezen

De oogst geeft per bericht alleen de titel en de eerste vier-, vijfhonderd tekens.
Dat is genoeg om te kiezen, niet om te schrijven. **Schrijf geen bericht, feitje
of agendapunt waarvan je het artikel niet helemaal gelezen hebt.** Haal de tekst
van alles wat je wilt opnemen op, met de nummers uit het overzicht:

```sh
node scripts/haal-artikel.mjs 3.1 3.2 17.1 44.2 > artikelen.txt
node scripts/haal-artikel.mjs 51.1 >> artikelen.txt      # later iets erbij
```

Dat geeft de volledige Griekse tekst, alinea voor alinea. Boven elk artikel
staat een regel `===== <adres>`: **dat adres is de `link` die in de editie
komt**, letterlijk overgenomen. Bij bronnen die via Google News binnenkomen
(InKefalonia, Kefalonitika Nea, Portoni) zoekt het script het echte adres van
het artikel op; een `news.google.com`-link hoort nooit in de editie.

Gebruik dit script en niet WebFetch: WebFetch geeft een samenvatting terug, en
dan vertaal je een samenvatting in plaats van het artikel. Meldt het script
`MISLUKT`, dan komt dat bericht niet in de editie, tenzij hetzelfde verhaal bij
een andere bron wel binnenkomt.

## 3. De editie schrijven

Schrijf `edities/JJJJ-MM-DD.json` (de datum van die maandag). Zie een bestaande
editie voor de precieze vorm. Wat er in moet:

- **titel** — kort, hooguit 70 tekens: het belangrijkste of opmerkelijkste
  bericht van de week in gewone woorden. Wat er gebeurde, niet een beeld ervan:
  "Lekkage in de sporthal van Argostoli", niet "de eerste regen vond elk lek
  terug". Geen "Nieuws week 38", en geen opsomming: de rest staat in de
  hoofdpunten.
- **hoofdpunten** — precies drie, elk één regel, die samen zeggen wat er deze
  week speelde. Elk hoofdpunt hoort bij een bericht in de editie: zet in `tekst`
  de regel en in `bij` de letterlijke `kop` van dat bericht, dan wordt het op de
  pagina een link ernaartoe. De kop zelf overnemen als tekst is prima. **Begin met iets positiefs of opmerkelijks als dat er is.**
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
  **Hooguit twintig berichten in totaal.** Kies wat een lezer die het eiland kent
  wil weten, en laat de rest liggen: de zoveelste persverklaring, condoleances,
  uitslagen van de vierde klasse. Elk bericht heeft `kop`, `datum`, `tekst`,
  `bron`, `link` en eventueel `foto`. `datum` is de datum van het artikel
  (JJJJ-MM-DD), zoals die in `artikelen.txt` bij `DATUM:` staat.
  Gebruikelijke rubrieken: Onderwijs, Zorg en veiligheid, Infrastructuur en verkeer,
  Veerboten, Cultuur en agenda, Aarde en natuur, Bestuur en politiek, Sport.
- **feitjes** — drie tot vijf opmerkelijke lokale weetjes. Ook hiervoor geldt
  alles onder "Nauwkeurigheid": één artikel per feitje, en niets erbij bedacht.
  Een feitje herhaalt geen bericht dat al in een rubriek staat. Dit is het lievelingsstuk
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
- **leukEnOpvallend** — twee of drie lichte berichten die onderaan de editie
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

**Agendapunten** komen ook uit een artikel dat je gelezen hebt. Staat een datum
of tijd niet in de tekst, dan komt het punt er niet in.

Noem bij elk bericht de bron en de directe link. Voor de editie online gaat,
leest een tweede lezer haar na (stap 4) en wordt ze gekeurd (stap 5).

## 4. Een tweede lezer

Wie een tekst geschreven heeft, leest eroverheen wat hij er zelf in gestopt
heeft. Laat de editie daarom controleren door een verse agent die jouw
overwegingen niet kent, voordat ze online gaat.

Start een subagent (Agent- of Task-tool) met als opdracht, en niets meer dan dit:

> Lees `CONTROLE.md` in deze map en voer het uit op `edities/<datum>.json`, met
> `artikelen.txt` als brontekst.

Geef hem niet mee wat jij van de editie vindt of welke stukken volgens jou
lastig waren. Hij past de editie zelf aan en meldt wat hij veranderd heeft.
Neem zijn correcties over zonder ze terug te draaien; ben je het met een
correctie oneens, dan gaat de betwiste zin eruit. Heb je geen tool om een
subagent te starten, voer `CONTROLE.md` dan zelf uit, als aparte ronde nadat de
hele editie geschreven is, en meld in de afsluiting dat er geen tweede lezer was.

## 5. Keuren

```sh
node scripts/keur-editie.mjs edities/<datum>.json artikelen.txt
```

Dit controleert wat een machine kan zien: of elk bericht een bron, een datum en
een directe link heeft, of van elk gelinkt artikel de tekst is opgehaald, of de
titel kort genoeg is en de hoofdpunten naar een bericht wijzen, en of er geen
AI-plaatje of Ithaka-rubriek in zit. **Publiceer alleen als dit script zonder
fouten eindigt.** Regels met een uitroepteken zijn opmerkingen: lees ze en
beslis. Krijg je een fout niet opgelost, dan gaat het betreffende bericht eruit.

## 6. Site bouwen en publiceren

```sh
node scripts/bouw-site.mjs
git add -A
git commit -m "Editie <datum>: <titel>"
git push
```

## 7. De mail

Daar hoef je niets voor te doen, en je moet er ook niets voor doen. De push van
een nieuw editiebestand start op GitHub de workflow die de mail verstuurt; de
wachtwoorden staan daar en niet in deze omgeving. Draai `stuur-mail.mjs` niet
zelf en schrijf geen `instellingen.json`.

De mail gaat alleen uit bij een **nieuw** bestand in `edities/`. Verbeter je
later iets in een bestaande editie, dan wordt de pagina bijgewerkt maar gaat er
geen mail uit. Zet in dat geval `"verbeterd": "JJJJ-MM-DD"` in de editie; de
pagina toont dan dat ze is aangepast.

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
Portoni) leveren een `news.google.com`-omleiding als link. `haal-artikel.mjs`
zoekt het echte adres op en haalt het artikel daar. Daarvoor moeten ook
`inkefalonia.gr`, `kefalonianea.gr` en `portoni.gr` op de witte lijst van de
omgeving staan; geeft het script bij die sites `MISLUKT`, meld dat dan in de
afsluiting en neem het verhaal van een bron die wel binnenkomt.

## 8. Afsluiten

Meld in één alinea: welke verhalen deze week het belangrijkst waren, hoeveel
berichten er gescand zijn, of alle bronnen werkten, wat de tweede lezer
veranderd heeft, en of de keuring zonder fouten was.
