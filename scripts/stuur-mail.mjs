#!/usr/bin/env node
// Maakt de mail van de nieuwste editie en verstuurt hem via Resend.
// Gebruik:  node scripts/stuur-mail.mjs            (verstuurt)
//           node scripts/stuur-mail.mjs --proef    (schrijft alleen proef-mail.html)
//
// De API-sleutel komt uit de omgevingsvariabele RESEND_API_KEY, of anders uit
// instellingen.json. Die sleutel hoort nooit in de repo.

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

const knop = (bijschrift = '') => `
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:6px 0 2px">
    <a href="${esc(paginaUrl)}" style="display:inline-block;background:${ZEE};color:#fff;
      font:700 15px Arial,sans-serif;text-decoration:none;padding:13px 28px;border-radius:8px">
      Lees de hele editie, met foto's</a>
    ${bijschrift ? `<p style="margin:10px 0 0;font:12px/1.5 Arial,sans-serif;color:${ZACHT}">${bijschrift}</p>` : ''}
  </td></tr></table>`;

// Alleen de openingsfoto gaat mee. Mailprogramma's blokkeren externe plaatjes
// standaard; één gemist kader leest een stuk beter dan twintig.
const opening = e.openingsfoto?.url ? `
  <img src="${esc(e.openingsfoto.url)}" width="564" alt="${esc(e.openingsfoto.bijschrift || '')}"
    style="display:block;width:100%;max-width:564px;height:auto;border-radius:10px;border:0">
  ${e.openingsfoto.bijschrift || e.openingsfoto.bron ? `<p style="margin:6px 0 0;font:12px/1.4 Arial,sans-serif;color:${ZACHT}">
    ${esc([e.openingsfoto.bijschrift, e.openingsfoto.bron].filter(Boolean).join(' \u00b7 '))}</p>` : ''}` : '';

// De mail geeft de hoogtepunten: de feitjes voluit, en van de rest alleen de
// koppen, zodat je in één oogopslag ziet wat er speelde. De volledige verhalen
// met alle foto's staan op de pagina.
const rubrieken = `
  <p style="margin:26px 0 12px;font:700 12px/1.4 Arial,sans-serif;letter-spacing:.12em;
     text-transform:uppercase;color:${ZEE}">Verder deze week</p>
  ${e.categorieen.map(c => `
  <p style="margin:0 0 14px;font:14px/1.6 Arial,sans-serif;color:${INKT}">
    <strong style="color:${ZACHT};font:700 12px Arial,sans-serif;letter-spacing:.06em;
      text-transform:uppercase">${esc(c.emoji || '')}&nbsp;&nbsp;${esc(c.naam)}</strong><br>
    ${c.items.map(i => esc(i.kop)).join('<br>')}
  </p>`).join('')}`;

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

    ${opening ? rij(`<div style="margin:20px 0 4px">${opening}</div>`) : ''}
    ${rij(feitjes)}
    ${rij(`<div style="margin:18px 0 6px">${knop()}</div>`)}
    ${rij(rubrieken)}
    ${rij(agenda)}

    <tr><td style="padding:24px 28px 28px">
      ${knop(`Alle verhalen voluit, met de foto's erbij. Handig om door te sturen:<br>
        <a href="${esc(paginaUrl)}" style="color:${ZEE}">${esc(paginaUrl)}</a>`)}
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
  'VERDER DEZE WEEK', '',
  ...e.categorieen.flatMap(c => [c.naam.toUpperCase(), ...c.items.map(i => `  - ${i.kop}`), '']),
  ...(e.agenda?.length ? ['OP DE KALENDER', ...e.agenda.map(a => `  ${a.datum}: ${a.wat}`), ''] : []),
  `Hele editie online: ${paginaUrl}`,
].join('\n');

const onderwerp = `Kefalonia Wekelijks — ${e.titel}`;

if (proef) {
  writeFileSync(join(WORTEL, 'proef-mail.html'), html);
  console.log(`Proef geschreven naar proef-mail.html (${(html.length / 1024).toFixed(1)} kB)`);
  console.log(`Onderwerp: ${onderwerp}`);
  console.log(`Afzender:  ${cfg.afzender}`);
  console.log(`Aan:       ${cfg.ontvangers.join(', ')}`);
  process.exit(0);
}

// De sleutel kan op twee manieren komen:
//  - lokaal: uit RESEND_API_KEY of instellingen.json, en wij zetten de header
//  - in de cloud: helemaal niet. De agent-proxy van Anthropic plakt de
//    Authorization-header er pas aan vast nadat het verzoek de sandbox verlaten
//    heeft, zodat de agent de sleutel nooit ziet. Dan moeten wij hem weglaten.
const sleutel = process.env.RESEND_API_KEY || cfg.resendSleutel || '';
const headers = { 'Content-Type': 'application/json' };
if (sleutel) headers.Authorization = `Bearer ${sleutel}`;
else console.log('Geen sleutel in de omgeving — de agent-proxy wordt geacht hem toe te voegen.');

const r = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    from: cfg.afzender,
    to: cfg.ontvangers,
    subject: onderwerp,
    html,
    text: tekst,
  }),
});

const antwoord = await r.json().catch(() => ({}));
if (!r.ok) {
  console.error(`Versturen mislukt: HTTP ${r.status} — ${JSON.stringify(antwoord)}`);
  if (r.status === 401) {
    console.error('401 betekent dat er geen geldige sleutel bij het verzoek zat. Draai je lokaal,');
    console.error('vul dan resendSleutel in instellingen.json. Draai je in de cloud, controleer dan');
    console.error('de API credential op de omgeving: host api.resend.com, header Authorization, prefix Bearer.');
  }
  process.exit(1);
}
console.log(`Mail verstuurd naar ${cfg.ontvangers.join(', ')} — id ${antwoord.id}`);
