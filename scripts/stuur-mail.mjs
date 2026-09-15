#!/usr/bin/env node
// Maakt de mail van de nieuwste editie en stuurt hem naar de Make-webhook.
// Gebruik:  node scripts/stuur-mail.mjs            (verstuurt)
//           node scripts/stuur-mail.mjs --proef    (schrijft alleen proef-mail.html)

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const WORTEL = join(dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(readFileSync(join(WORTEL, 'instellingen.json'), 'utf8'));
const proef = process.argv.includes('--proef');

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const NL_MAAND = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
const langeDatum = iso => { const d = new Date(iso + 'T12:00:00'); return `${d.getDate()} ${NL_MAAND[d.getMonth()]}`; };

const bestanden = readdirSync(join(WORTEL, 'edities')).filter(f => f.endsWith('.json')).sort().reverse();
const e = JSON.parse(readFileSync(join(WORTEL, 'edities', bestanden[0]), 'utf8'));
const paginaUrl = cfg.paginaUrl;

// E-mail wil tabellen en inline stijlen; div+class is te wisselvallig per client.
const INKT = '#12212e', ZACHT = '#4a5d6e', ZEE = '#1a5f8a', LIJN = '#e3ddd0', PAPIER = '#fbf9f4';
const rij = inhoud => `<tr><td style="padding:0 28px">${inhoud}</td></tr>`;

const rubrieken = e.categorieen.map(c => `
  <p style="margin:26px 0 10px;font:700 12px/1.4 Arial,sans-serif;letter-spacing:.12em;
     text-transform:uppercase;color:${ZEE}">${esc(c.emoji || '')} ${esc(c.naam)}</p>
  ${c.items.map(i => `
  <p style="margin:0 0 12px;font:15px/1.55 Georgia,serif;color:${INKT}">
    <strong style="font-size:15px">${esc(i.kop)}</strong><br>
    <span style="color:${ZACHT};font:14px/1.55 Arial,sans-serif">${esc(i.tekst)}</span>
    ${i.link ? `<br><a href="${esc(i.link)}" style="color:${ZEE};font:12px Arial,sans-serif;text-decoration:none">${esc(i.bron)} →</a>` : ''}
  </p>`).join('')}`).join('');

const feitjes = e.feitjes?.length ? `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#e8f1f7;border-radius:10px;margin:8px 0 4px">
    <tr><td style="padding:18px 20px">
      <p style="margin:0 0 10px;font:700 12px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:${ZEE}">Opmerkelijk</p>
      ${e.feitjes.map(f => `<p style="margin:0 0 9px;font:14px/1.5 Arial,sans-serif;color:${INKT}">
        <span style="color:#c2703d">&#9670;</span> ${esc(f.tekst)}</p>`).join('')}
    </td></tr>
  </table>` : '';

const agenda = e.agenda?.length ? `
  <p style="margin:26px 0 10px;font:700 12px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:${ZEE}">📅 Op de kalender</p>
  <table width="100%" cellpadding="0" cellspacing="0">
    ${e.agenda.map(a => `<tr>
      <td style="padding:6px 12px 6px 0;font:700 13px Arial,sans-serif;color:${ZEE};white-space:nowrap;vertical-align:top">${esc(a.datum)}</td>
      <td style="padding:6px 0;font:14px/1.45 Arial,sans-serif;color:${INKT}">${esc(a.wat)}</td>
    </tr>`).join('')}
  </table>` : '';

const html = `<!doctype html>
<html lang="nl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(e.titel)}</title></head>
<body style="margin:0;padding:0;background:${PAPIER}">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${PAPIER}">
<tr><td align="center" style="padding:24px 12px">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;
    border:1px solid ${LIJN};border-radius:14px;overflow:hidden">

    <tr><td style="padding:30px 28px 0">
      <p style="margin:0 0 12px;font:700 11px Arial,sans-serif;letter-spacing:.16em;
         text-transform:uppercase;color:${ZEE}">Kefalonia &amp; Ithaka &middot; Wekelijks</p>
      <h1 style="margin:0 0 8px;font:700 26px/1.2 Georgia,serif;color:${INKT}">${esc(e.titel)}</h1>
      <p style="margin:0;font:13px Arial,sans-serif;color:${ZACHT}">
        ${esc(langeDatum(e.periode.van))} tot en met ${esc(langeDatum(e.periode.tot))}</p>
      <p style="margin:16px 0 0;font:italic 16px/1.55 Georgia,serif;color:${ZACHT}">${esc(e.intro)}</p>
    </td></tr>

    ${rij(feitjes)}
    ${rij(rubrieken)}
    ${rij(agenda)}

    <tr><td align="center" style="padding:28px">
      <a href="${esc(paginaUrl)}" style="display:inline-block;background:${ZEE};color:#fff;
        font:700 15px Arial,sans-serif;text-decoration:none;padding:13px 28px;border-radius:8px">
        Lees de hele editie online</a>
      <p style="margin:12px 0 0;font:12px Arial,sans-serif;color:${ZACHT}">
        Handig om door te sturen: <a href="${esc(paginaUrl)}" style="color:${ZEE}">${esc(paginaUrl)}</a></p>
    </td></tr>

    <tr><td style="padding:18px 28px 26px;border-top:1px solid ${LIJN}">
      <p style="margin:0;font:12px/1.5 Arial,sans-serif;color:${ZACHT}">
        Automatisch samengesteld uit ${e.statistiek?.bronnen ?? '?'} Kefalonische en Ithakese bronnen.
        Elke maandagochtend opnieuw.</p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;

// Platte tekst voor clients die geen HTML tonen
const tekst = [
  `KEFALONIA & ITHAKA — WEKELIJKS`,
  e.titel,
  `${langeDatum(e.periode.van)} t/m ${langeDatum(e.periode.tot)}`,
  '', e.intro, '',
  ...(e.feitjes?.length ? ['OPMERKELIJK', ...e.feitjes.map(f => `  - ${f.tekst}`), ''] : []),
  ...e.categorieen.flatMap(c => [c.naam.toUpperCase(), ...c.items.map(i => `  - ${i.kop}\n    ${i.tekst}`), '']),
  ...(e.agenda?.length ? ['OP DE KALENDER', ...e.agenda.map(a => `  ${a.datum}: ${a.wat}`), ''] : []),
  `Hele editie online: ${paginaUrl}`,
].join('\n');

const lading = {
  onderwerp: `Kefalonia Wekelijks — ${e.titel}`,
  ontvangers: cfg.ontvangers.join(','),
  html, tekst,
  editie: e.editie,
  paginaUrl,
};

if (proef) {
  writeFileSync(join(WORTEL, 'proef-mail.html'), html);
  console.log(`Proef geschreven naar proef-mail.html (${(html.length / 1024).toFixed(1)} kB)`);
  console.log(`Onderwerp: ${lading.onderwerp}`);
  console.log(`Aan: ${lading.ontvangers}`);
} else {
  const r = await fetch(cfg.webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lading),
  });
  const antwoord = await r.text();
  if (!r.ok) { console.error(`Versturen mislukt: HTTP ${r.status} — ${antwoord}`); process.exit(1); }
  console.log(`Mail aangeboden aan Make: ${antwoord}`);
}
