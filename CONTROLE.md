# Opdracht voor de tweede lezer

Je controleert een editie van een Nederlandstalige wekelijkse nieuwsbrief over
het Griekse eiland Kefalonia, vlak voordat ze online gaat. Iemand anders heeft
haar geschreven. Jouw werk is haar naast de Griekse bronteksten te leggen en
alles te verbeteren wat niet klopt.

Dit bestaat omdat het eerder misging: berichten bevatten verbanden die de
schrijver zelf had gelegd, details die in geen artikel stonden, en losse
voorvallen die onder één link aan elkaar waren geplakt. Een jongen botste op een
paard dat door zijn eigenaar aan een touw werd meegevoerd; een week later stond
er dat het bij de weg van de wilde paarden van de Ainos was gebeurd. Een moeder
werd een uitspraak in de mond gelegd die het omgekeerde was van wat ze zei. Ga
er dus niet van uit dat een zin klopt omdat hij aannemelijk klinkt.

Je krijgt twee bestanden:

- de editie: `edities/<datum>.json`
- de brontekst: `artikelen.txt`, met per artikel een regel `===== <adres>`,
  de titel, de datum en de volledige Griekse tekst

Lees eerst in `WERKWIJZE.md` de delen "Het gebied", "De kop zegt wat er gebeurd
is", "Eén bericht, één gebeurtenis", "Vloeiend Nederlands" en "Nauwkeurigheid".
Dat zijn de regels waaraan de editie moet voldoen.

## Wat je doet

Loop elk bericht, elk feitje en elk stuk onder `leukEnOpvallend` af, en daarna
`titel`, `hoofdpunten`, `intro`, `weer`, `agenda` en de bijschriften van foto's.

1. Zoek in `artikelen.txt` het artikel met hetzelfde adres als de `link`. Staat
   het er niet, of staat er `MISLUKT`, haal het dan op met
   `node scripts/haal-artikel.mjs <link> >> artikelen.txt`. Lukt dat niet, dan
   gaat het stuk eruit. Gebruik geen WebFetch: dat geeft een samenvatting.
2. Leg elke zin van het Nederlandse stuk naast het Griekse artikel. Zoek naar:
   - beweringen die niet in het gelinkte artikel staan;
   - zelfgelegde verbanden met een ander bericht of een eerdere week ("vorige
     week", "dezelfde week", "precies daar");
   - bijzonderheden die er niet staan: plaats, weg, dag, tijd, leeftijd,
     nationaliteit, functie, oorzaak;
   - weggelaten voorbehoud: een voorstel als besluit, een vraag als feit, een
     schatting als telling, een beschuldiging zonder afzender;
   - eigen conclusies, oordelen en grapjes van de schrijver;
   - getallen die afwijken, en percentages met een verkeerde grondslag;
   - vertaalfouten, ook in familieverhoudingen, functies en citaten;
   - inhoud die uit een ander artikel komt dan de link.
3. Controleer of het bericht over één voorval gaat. Staan er meerdere in, dan
   blijft het voorval van de link staan en vervalt de rest.
4. Controleer de kop: een gewone mededeling van wat er gebeurd is, zonder
   beeldspraak, die klopt met de tekst eronder.
5. Lees het als Nederlands. Een zin waarover je struikelt of die niet op de
   vorige aansluit, schrijf je korter en gewoner opnieuw.
6. Berichten die alleen op Ithaka spelen gaan eruit.
7. Kijk bij elke foto of hij bij het bericht hoort: geen ander dorp, geen
   archiefbeeld bij een gebeurtenis, geen AI-plaatje.

Verbeter wat niet klopt rechtstreeks in de editie. Stukken die goed zijn laat
je ongemoeid: herschrijf niet om het herschrijven. **Twijfel je of iets in de
bron staat, dan staat het er voor dit doel niet: haal het weg in plaats van te
gokken.** Voeg geen nieuwe onderwerpen toe.

Pas daarna `titel`, `hoofdpunten` en `intro` aan zodat ze kloppen met de
verbeterde berichten. Elk hoofdpunt moet in `bij` de letterlijke kop van een
bericht hebben; heb je een kop veranderd, verander `bij` dan mee. Een agendapunt
waarvan je de datum of tijd niet in een artikel terugvindt, gaat eruit.

## Grenzen

- Wijzig alleen het editiebestand. Houd de structuur en de veldnamen aan, en
  laat `editie`, `periode` en `statistiek` staan.
- Niet committen, niet pushen, de site niet bouwen.
- Draai aan het eind `node scripts/keur-editie.mjs edities/<datum>.json artikelen.txt`
  en los op wat het als fout meldt.

## Wat je terugmeldt

Kort, in het Nederlands:

- per gewijzigd stuk: de kop, wat er stond, wat de bron zegt, en wat je deed.
  Maak onderscheid tussen feitelijke fouten en stijl;
- wat je verwijderd hebt en waarom;
- wat je niet hebt kunnen controleren;
- hoeveel stukken je bekeek en hoeveel ongewijzigd bleven.
