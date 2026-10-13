#!/usr/bin/env node
// Maakt van de ruwe oogst één leeslijst: alleen wat over Kefalonia gaat, en
// berichten over hetzelfde onderwerp bij elkaar. Bovenaan staat wat bij de
// meeste bronnen terugkwam. De hele lijst wordt getoond, niet een bovenste deel:
// wat buiten beeld valt kan de schrijver ook niet kiezen.
// Gebruik: node scripts/overzicht.mjs ruwe-oogst.json > overzicht.txt
//          (schrijft daarnaast relevant.json, met de groepen erin)

import { readFileSync, writeFileSync } from 'node:fs';
import { filter, plat } from './relevantie.mjs';

const pad = process.argv[2] || 'ruwe-oogst.json';
const oogst = JSON.parse(readFileSync(pad, 'utf8'));
const relevant = filter(oogst.berichten);

// Woorden die in bijna elke kop staan zeggen niets over het onderwerp.
const LOOS = new Set(['κεφαλονια', 'κεφαλονιασ', 'κεφαλλονια', 'κεφαλληνιασ', 'αργοστολι', 'αργοστολιου',
  'ληξουρι', 'ληξουριου', 'βιντεο', 'εικονεσ', 'φωτογραφιεσ', 'φωτο', 'photos', 'video', 'δειτε']);
const woorden = b => new Set(plat(b.titel).split(/[^\p{L}\p{N}]+/u).filter(w => w.length > 3 && !LOOS.has(w)));

// Twee berichten horen bij elkaar als hun koppen voor de helft uit dezelfde
// woorden bestaan. Dat is grof, en het mag grof zijn: het is een leeshulp.
// Of het echt hetzelfde voorval is, beslist de schrijver bij het lezen.
const groepen = [];
for (const b of relevant) {
  const w = woorden(b);
  let thuis = null;
  if (w.size >= 3) {
    for (const g of groepen) {
      const gedeeld = [...w].filter(x => g.woorden.has(x)).length;
      if (gedeeld / Math.min(w.size, g.woorden.size) >= 0.5 && gedeeld >= 3) { thuis = g; break; }
    }
  }
  if (thuis) thuis.berichten.push(b);
  else groepen.push({ woorden: w, berichten: [b] });
}

const bronnenVan = g => new Set(g.berichten.flatMap(b => [b.uitgever || b.bron, ...(b.ookBij || [])]));
const nieuwste = g => Math.max(...g.berichten.map(b => +new Date(b.datum)));
groepen.sort((a, b) => bronnenVan(b).size - bronnenVan(a).size || nieuwste(b) - nieuwste(a));

const regels = [
  `Oogst van ${oogst.periode.van.slice(0, 10)} tot ${oogst.periode.tot.slice(0, 10)}: ${oogst.aantal} berichten gescand, ${relevant.length} over Kefalonia, in ${groepen.length} onderwerpen.`,
  `Achter elk onderwerp staat bij hoeveel bronnen het stond. Elke regel: nummer | datum | bron | kop.`,
  `De tekst van een bericht haal je op met het nummer: node scripts/haal-artikel.mjs 12.3 45.1`,
  '',
];
groepen.forEach((g, n) => {
  const bronnen = bronnenVan(g).size;
  regels.push(`#${n + 1}${bronnen > 1 ? `  [${bronnen} bronnen]` : ''}`);
  g.berichten.sort((a, c) => new Date(a.datum) - new Date(c.datum));
  g.berichten.forEach((b, i) => {
    const ook = b.ookBij?.length ? `  (zelfde kop ook bij ${b.ookBij.join(', ')})` : '';
    regels.push(`  ${n + 1}.${i + 1} | ${b.datum.slice(0, 10)} | ${b.uitgever || b.bron} | ${b.titel}${b.foto ? ' [foto]' : ''}${ook}`);
  });
  regels.push('');
});

writeFileSync('relevant.json', JSON.stringify(groepen.map((g, n) => ({
  onderwerp: n + 1, bronnen: [...bronnenVan(g)], berichten: g.berichten,
})), null, 1));
process.stdout.write(regels.join('\n'));
console.error(`${relevant.length} berichten in ${groepen.length} onderwerpen; ${groepen.filter(g => bronnenVan(g).size > 2).length} stonden bij drie of meer bronnen.`);
