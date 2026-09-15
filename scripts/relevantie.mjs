// Bepaalt of een bericht echt over Kefalonia of Ithaka gaat.
// De lokale sites publiceren namelijk ook landelijk en internationaal nieuws.

const PLAATSEN = [
  // eiland en gemeenten
  'κεφαλονι', 'κεφαλλην', 'κεφαλονί', 'ιθάκη', 'ιθάκης', 'ιθακ',
  'αργοστόλι', 'αργοστολ', 'ληξούρι', 'ληξουρ', 'σάμη', 'σάμης',
  'παλική', 'παλικ', 'ερίσσου', 'έρισσος', 'πύλαρο', 'λειβαθ',
  'ελειό', 'πρόννο', 'φισκάρδο', 'βαθύ', 'βαθέως',
  // dorpen, stranden, natuur
  'σκάλα κεφ', 'άσσος', 'μύρτος', 'μυρτιώτ', 'αίνος', 'αίνου',
  'δρογκαράτη', 'μελισσάνη', 'κουρκουμελάτα', 'λούρδα', 'κατελειό',
  'πόρος κεφ', 'αγία ευφημία', 'πεσσάδα', 'σβορωνάτα', 'μηνιές',
  'τζαννάτα', 'μαρκόπουλο', 'διβαράτα', 'καραβόμυλος', 'αντίσαμος',
  // instellingen
  'μαντζαβινάτειο', 'δευακ', 'δ.ε.υ.α.κ', 'ιόνιο πανεπιστήμιο',
  'ιονίων νήσων', 'ιόνια νησιά', 'νοσοκομείο αργοστολίου',
  'παναγία δραπανιώτισσα', 'δραπανιώτισσα', 'μεραρχία άκουι', 'μεραρχίας άκουι',
  // latijns
  'kefaloni', 'cephaloni', 'ithaca', 'ithaki', 'argostoli', 'lixouri',
  'fiskardo', 'sami', 'poros', 'assos', 'myrtos',
];

// Onderwerpen die er voor een eilandbewoner toe doen, ook zonder plaatsnaam in de kop
const ONDERWERPEN = [
  'ακτοπλο', 'δρομολόγι', 'πλοίο', 'φέρι', 'ferry', 'αεροδρόμιο', 'πτήσ',
  'σεισμ', 'πυρκαγι', 'καιρό', 'δήμαρχο', 'δημοτικό συμβούλιο',
  'περιφέρεια', 'τουρισμ', 'ξενοδοχ', 'ελαιόλαδ', 'ρομπόλα', 'κρασ',
];

export function scoor(bericht) {
  const tekst = `${bericht.titel} ${bericht.samenvatting || ''}`.toLowerCase();
  const titel = bericht.titel.toLowerCase();

  let score = 0;
  const raak = [];

  for (const p of PLAATSEN) {
    if (titel.includes(p)) { score += 3; raak.push(p); }
    else if (tekst.includes(p)) { score += 2; raak.push(p); }
  }
  // Gemeentelijke bekendmakingen zijn per definitie lokaal
  if (bericht.soort === 'gemeente') score += 4;

  // Eilandonderwerpen tellen mee, maar alleen als opstapje
  if (score > 0) {
    for (const o of ONDERWERPEN) if (tekst.includes(o)) { score += 1; break; }
  }

  return { score, raak: [...new Set(raak)].slice(0, 4) };
}

export function filter(berichten, drempel = 2) {
  return berichten
    .map(b => ({ ...b, ...scoor(b) }))
    .filter(b => b.score >= drempel)
    .sort((a, b) => b.score - a.score || new Date(b.datum) - new Date(a.datum));
}
