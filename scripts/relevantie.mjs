// Bepaalt of een bericht echt over Kefalonia gaat.
// De lokale sites publiceren namelijk ook landelijk en internationaal nieuws.

// Grieks zonder accenten en in kleine letters, zodat "ΣΑΜΗ", "Σάμη" en "σάμης"
// hetzelfde woord zijn. Koppen staan vaak in hoofdletters, en die hebben geen accenten.
export const plat = s => String(s ?? '').normalize('NFD').replace(/\p{M}/gu, '')
  .toLowerCase().replace(/ς/g, 'σ');

// Alle termen staan hier al zonder accenten. Ze passen aan het begin van een
// woord, zodat verbuigingen meetellen ("ληξουρ" vangt Ληξούρι en Ληξουρίου) maar
// een term niet midden in een ander woord raak is.
const PLAATSEN = [
  // eiland en gemeenten — Ithaka staat er bewust niet bij: de nieuwsbrief gaat
  // over Kefalonia, en wat beide eilanden raakt noemt Kefalonia vanzelf.
  'κεφαλονι', 'κεφαλλην', 'κεφαλλον', 'αργοστολ', 'ληξουρ', 'σαμη', 'σαμησ',
  'παλικ', 'ερισ', 'πυλαρ', 'λειβαθ', 'λιβαθ', 'ελειο', 'προνν', 'ομαλων', 'θηναι',
  // dorpen, stranden, natuur
  'φισκαρδ', 'σκαλα κεφ', 'σκαλασ κεφ', 'ασσο ', 'ασσοσ', 'ασσου', 'μυρτο ', 'μυρτοσ', 'μυρτου', 'μυρτιωτ',
  'αινο ', 'αινου', 'αινοσ', 'δρογκαρατ', 'μελισσαν', 'κουρκουμελατ', 'λουρδα',
  'κατελει', 'ποροσ κεφ', 'πορου κεφ', 'πορο κεφ', 'αγια ευφημια', 'αγιασ ευφημιασ',
  'πεσσαδ', 'σβορωνατ', 'μηνιεσ', 'μηνιων', 'τζαννατ', 'διβαρατ', 'καραβομυλ', 'αντισαμ',
  'φαρακλατ', 'λακηθρ', 'μεταξατ', 'ραζατ', 'βαλσαματ', 'φραγκατ', 'λασση',
  'ξι κεφ', 'πετανο', 'κουταβ', 'λιθοστρωτ',
  // instellingen en vaste namen
  'μαντζαβινατ', 'δευακ', 'δ.ε.υ.α.κ', 'νοσοκομειο αργοστολ', 'νοσοκομειο κεφαλ',
  'δραπανιωτισσ', 'μεραρχια ακουι', 'μεραρχιασ ακουι', 'αγιου γερασιμου', 'αγιοσ γερασιμοσ',
  'κεφαλοσ', 'βεργωτ', 'ε.π.σ.κ.ι', 'επσκι', 'κεφιαπ',
  // de regio: bestuur, Europees geld en vervoer raken het eiland ook
  'ιονιων νησων', 'ιονια νησια', 'ιονιο πανεπιστημιο',
  // latijns
  'kefaloni', 'kefalloni', 'cephaloni', 'argostoli', 'lixouri', 'fiskardo',
];

// Onderwerpen die er voor een eilandbewoner toe doen, ook zonder plaatsnaam in de kop
const ONDERWERPEN = [
  'ακτοπλο', 'δρομολογι', 'πλοιο', 'φερι', 'ferry', 'αεροδρομι', 'πτησ',
  'σεισμ', 'πυρκαγι', 'καιρο', 'δημαρχ', 'δημοτικο συμβουλιο',
  'περιφερει', 'τουρισμ', 'ξενοδοχ', 'ελαιολαδ', 'ρομπολα', 'κρασ',
];

const ontsnap = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const alsPatroon = termen => termen.map(t => [t.trim(), new RegExp(`(?<![\\p{L}\\p{N}])${ontsnap(t.trimEnd())}${t.endsWith(' ') ? '(?![\\p{L}\\p{N}])' : ''}`, 'u')]);
const PLAATS_RE = alsPatroon(PLAATSEN);
const ONDERWERP_RE = alsPatroon(ONDERWERPEN);

export function scoor(bericht) {
  const titel = plat(bericht.titel);
  const tekst = `${titel} ${plat(bericht.samenvatting)}`;

  let score = 0;
  const raak = [];

  for (const [naam, re] of PLAATS_RE) {
    if (re.test(titel)) { score += 3; raak.push(naam); }
    else if (re.test(tekst)) { score += 2; raak.push(naam); }
  }
  // Gemeentelijke bekendmakingen zijn per definitie lokaal
  if (bericht.soort === 'gemeente') score += 4;

  // Eilandonderwerpen tellen mee, maar alleen als opstapje
  if (score > 0 && ONDERWERP_RE.some(([, re]) => re.test(tekst))) score += 1;

  return { score, raak: [...new Set(raak)].slice(0, 4) };
}

export function filter(berichten, drempel = 2) {
  return berichten
    .map(b => ({ ...b, ...scoor(b) }))
    .filter(b => b.score >= drempel)
    .sort((a, b) => b.score - a.score || new Date(b.datum) - new Date(a.datum));
}
