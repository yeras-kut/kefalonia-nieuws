#!/usr/bin/env node
// Zet de nieuwste editie als concept klaar in Spark, vanaf info@yerassimo.nl.
// Werkt alleen op de Mac zelf, met Spark Desktop open: de spark-CLI praat via
// IPC met de app en heeft geen eigen mailverbinding.
//
// Gebruik: node scripts/spark-concept.mjs [--toon] [--versturen]
//   --toon       schrijf de markdown naar stdout, maak geen concept
//   --versturen  meteen versturen in plaats van als concept klaarzetten

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const WORTEL = join(dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(readFileSync(join(WORTEL, 'instellingen.json'), 'utf8'));
const alleenTonen = process.argv.includes('--toon');
const versturen = process.argv.includes('--versturen');
const STAAT = join(WORTEL, '.laatst-verstuurd');

const NL_MAAND = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
const datum = iso => { const d = new Date(iso + 'T12:00:00'); return `${d.getDate()} ${NL_MAAND[d.getMonth()]}`; };

const bestanden = readdirSync(join(WORTEL, 'edities')).filter(f => f.endsWith('.json')).sort().reverse();
if (!bestanden.length) { console.error('Geen edities gevonden.'); process.exit(1); }
const e = JSON.parse(readFileSync(join(WORTEL, 'edities', bestanden[0]), 'utf8'));

// Al gedaan? Dan niets. Zo kan de taak elke dag draaien zonder te herhalen.
if (!alleenTonen && existsSync(STAAT) && readFileSync(STAAT, 'utf8').trim() === e.editie) {
  console.log(`Editie ${e.editie} is al klaargezet. Niets te doen.`);
  process.exit(0);
}

// De mail is een aankondiging, niet de editie zelf: periode, intro, en de link.
// Alles wat de lezer verder wil weten staat op de pagina.
const regels = [
  `_${datum(e.periode.van)} tot en met ${datum(e.periode.tot)}_`,
  '',
  e.intro,
  '',
  `**[Lees de hele editie, met foto's](${cfg.paginaUrl})**`,
];

const body = regels.join('\n');

if (alleenTonen) { process.stdout.write(body + '\n'); process.exit(0); }

const args = ['draft', '--account', cfg.sparkAfzender];
for (const o of cfg.ontvangers) args.push('--to', o);
args.push('--subject', `Kefalonia Wekelijks — ${e.titel}`, '--body', body);

let uit;
try {
  uit = execFileSync('spark', args, { encoding: 'utf8' });
} catch (err) {
  console.error('spark draft mislukte. Draait Spark Desktop?');
  console.error(String(err.stdout || '') + String(err.stderr || ''));
  process.exit(1);
}
process.stdout.write(uit);

const id = (uit.match(/^ID:\s*(\d+)/m) || [])[1];

if (versturen && id) {
  try {
    console.log(execFileSync('spark', ['action', 'send', id], { encoding: 'utf8' }));
  } catch (err) {
    console.error('Versturen mislukte; het concept staat nog in Spark.');
    console.error(String(err.stdout || '') + String(err.stderr || ''));
    process.exit(1);
  }
}

writeFileSync(STAAT, e.editie + '\n');
console.log(`\nEditie ${e.editie} ${versturen ? 'verstuurd' : 'klaargezet als concept'}.`);
