#!/usr/bin/env node
// Keurt een editie voordat ze online gaat. Dit vangt de fouten die een
// machine kan zien; of de inhoud klopt met de bron, is werk voor de tweede
// lezer (zie CONTROLE.md).
// Gebruik: node scripts/keur-editie.mjs edities/2026-10-19.json [artikelen.txt]
// Met artikelen.txt erbij wordt ook gekeurd of van elk bericht de tekst is opgehaald.
// Sluit af met code 1 als er iets is dat publicatie in de weg staat.

import { readFileSync, existsSync } from 'node:fs';

const [pad, artikelenPad] = process.argv.slice(2);
if (!pad) { console.error('Gebruik: node scripts/keur-editie.mjs <editie.json> [artikelen.txt]'); process.exit(1); }

const fouten = [], waarschuwingen = [];
let e;
try { e = JSON.parse(readFileSync(pad, 'utf8')); }
catch (err) { console.error(`✗ ${pad} is geen geldige JSON: ${err.message}`); process.exit(1); }

const kort = s => String(s ?? '').replace(/\s+/g, ' ').slice(0, 50);
const berichten = (e.categorieen ?? []).flatMap(c => (c.items ?? []).map(i => ({ ...i, _waar: `${c.naam} › ${kort(i.kop)}` })));
const feitjes = (e.feitjes ?? []).map(f => ({ ...f, _waar: `feitje › ${kort(f.tekst)}` }));
const leuk = (e.leukEnOpvallend ?? []).map(f => ({ ...f, _waar: `leuk › ${kort(f.tekst)}` }));
const stukken = [...berichten, ...feitjes, ...leuk];

// ---- hoofdstructuur
for (const veld of ['editie', 'periode', 'titel', 'intro', 'categorieen', 'statistiek']) {
  if (!e[veld]) fouten.push(`veld "${veld}" ontbreekt`);
}
if (e.titel?.length > 70) fouten.push(`de titel is ${e.titel.length} tekens; hooguit 70. De rest hoort in hoofdpunten.`);
if (!Array.isArray(e.hoofdpunten) || e.hoofdpunten.length !== 3) fouten.push('er horen precies drie hoofdpunten te zijn');
for (const h of e.hoofdpunten ?? []) {
  if (!h.tekst) fouten.push('een hoofdpunt zonder tekst');
  if (!berichten.some(b => b.kop === h.bij)) fouten.push(`hoofdpunt "${kort(h.tekst)}" verwijst met "bij" niet naar de kop van een bericht`);
}
for (const c of e.categorieen ?? []) {
  if (!c.items?.length) fouten.push(`rubriek "${c.naam}" is leeg`);
  if (/ithak|ithaca|ιθάκ/i.test(c.naam)) fouten.push(`rubriek "${c.naam}": de nieuwsbrief gaat alleen over Kefalonia`);
}

// ---- elk stuk
const homepage = l => { try { const u = new URL(l); return u.pathname.replace(/\/+$/, '') === '' && !u.search; } catch { return true; } };
for (const s of stukken) {
  if (!s.tekst?.trim()) fouten.push(`${s._waar}: geen tekst`);
  if (!s.bron?.trim()) fouten.push(`${s._waar}: geen bron`);
  else if (/^divers/i.test(s.bron)) fouten.push(`${s._waar}: bron "${s.bron}" — noem de site van het gelinkte artikel`);
  if (!s.link) fouten.push(`${s._waar}: geen link`);
  else if (homepage(s.link)) fouten.push(`${s._waar}: de link is een homepage, niet het artikel`);
  else if (s.link.includes('news.google.com')) fouten.push(`${s._waar}: Google News-omleiding; gebruik de echte link die haal-artikel.mjs geeft`);
  if (/ChatGPT-Image|[-_]ai[-_.]|dall-?e|midjourney/i.test(s.foto?.url ?? '')) fouten.push(`${s._waar}: de foto lijkt een AI-plaatje`);
  if (s.foto && !s.foto.url) fouten.push(`${s._waar}: foto zonder url`);
}
for (const b of berichten) {
  if (!b.kop?.trim()) fouten.push(`${b._waar}: geen kop`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.datum ?? '')) fouten.push(`${b._waar}: geen datum (JJJJ-MM-DD, de datum van het artikel)`);
}
const koppen = berichten.map(b => b.kop);
for (const k of new Set(koppen.filter((k, i) => koppen.indexOf(k) !== i))) fouten.push(`twee berichten met dezelfde kop: "${kort(k)}"`);
const links = stukken.map(s => s.link).filter(Boolean);
for (const l of new Set(links.filter((l, i) => links.indexOf(l) !== i))) {
  waarschuwingen.push(`dezelfde link bij meer dan één stuk: ${l} — een feitje dat een bericht herhaalt, of twee voorvallen uit één artikel?`);
}

// ---- omvang: minder tekst is minder ruimte voor fouten
if (berichten.length > 22) waarschuwingen.push(`${berichten.length} berichten; de werkwijze vraagt er hooguit twintig`);
if (feitjes.length > 5) waarschuwingen.push(`${feitjes.length} feitjes; hooguit vijf`);
if (leuk.length > 3) waarschuwingen.push(`${leuk.length} lichte stukken; hooguit drie`);
for (const b of berichten) {
  if (b.tekst?.length > 900) waarschuwingen.push(`${b._waar}: ${b.tekst.length} tekens — is dit nog één voorval?`);
}

// ---- is van elk stuk het artikel gelezen?
if (artikelenPad) {
  if (!existsSync(artikelenPad)) fouten.push(`${artikelenPad} bestaat niet`);
  else {
    const gehaald = new Map();
    for (const blok of readFileSync(artikelenPad, 'utf8').split(/\n(?====== )/)) {
      const m = blok.match(/^\n?===== (\S+)\n([\s\S]*)$/);
      if (m) gehaald.set(m[1], !/^MISLUKT:/.test(m[2].trim()) && m[2].trim().length > 200 || gehaald.get(m[1]) === true);
    }
    for (const s of stukken) {
      if (!s.link) continue;
      if (!gehaald.has(s.link)) fouten.push(`${s._waar}: de tekst van dit artikel staat niet in ${artikelenPad}`);
      else if (!gehaald.get(s.link)) fouten.push(`${s._waar}: het ophalen van dit artikel is mislukt, dus het bericht is niet te controleren`);
    }
    if (e.weer?.link && !gehaald.get(e.weer.link)) fouten.push('weer: de tekst van het weerbericht is niet opgehaald');
  }
}

for (const w of waarschuwingen) console.log(`! ${w}`);
for (const f of fouten) console.log(`✗ ${f}`);
console.log(fouten.length
  ? `\n${fouten.length} fout(en): deze editie mag zo niet online.`
  : `\n✓ ${pad}: ${berichten.length} berichten, ${feitjes.length} feitjes, ${leuk.length} lichte stukken — gekeurd${waarschuwingen.length ? `, met ${waarschuwingen.length} opmerking(en)` : ''}.`);
process.exit(fouten.length ? 1 : 0);
