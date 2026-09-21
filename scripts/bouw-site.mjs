#!/usr/bin/env node
// Bouwt de website uit alle bestanden in edities/.
// index.html = nieuwste editie, archief/<datum>.html = alle oudere.

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const WORTEL = join(dirname(fileURLToPath(import.meta.url)), '..');
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const NL_MAAND = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
const langeDatum = iso => {
  const d = new Date(iso + 'T12:00:00');
  return `${d.getDate()} ${NL_MAAND[d.getMonth()]} ${d.getFullYear()}`;
};

const STIJL = `
:root{
  --inkt:#12212e; --inkt-zacht:#4a5d6e; --papier:#fbf9f4; --kaart:#fff;
  --lijn:#e3ddd0; --zee:#1a5f8a; --zee-licht:#e8f1f7; --accent:#c2703d;
  --schaduw:0 1px 2px rgba(18,33,46,.05),0 8px 24px -12px rgba(18,33,46,.15);
}
@media (prefers-color-scheme:dark){
  :root{
    --inkt:#e8e4dc; --inkt-zacht:#9aa8b4; --papier:#11181f; --kaart:#18222b;
    --lijn:#2a3742; --zee:#6cb6e0; --zee-licht:#1a2831; --accent:#e09a6b;
    --schaduw:0 1px 2px rgba(0,0,0,.3),0 8px 24px -12px rgba(0,0,0,.5);
  }
}
*{box-sizing:border-box}
body{margin:0;background:var(--papier);color:var(--inkt);
  font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  -webkit-font-smoothing:antialiased}
.omslag{max-width:44rem;margin:0 auto;padding:0 1.25rem 5rem}
header.kop{padding:3.5rem 0 2rem;border-bottom:2px solid var(--inkt);margin-bottom:2.5rem}
.merk{font-size:.75rem;letter-spacing:.16em;text-transform:uppercase;color:var(--zee);
  font-weight:700;margin:0 0 1rem}
h1{font-family:Georgia,"Times New Roman",serif;font-size:clamp(1.9rem,5.5vw,2.9rem);
  line-height:1.15;margin:0 0 .75rem;letter-spacing:-.015em;font-weight:700}
.periode{color:var(--inkt-zacht);font-size:.9rem;margin:0}
.intro{font-size:1.15rem;line-height:1.6;color:var(--inkt-zacht);margin:1.5rem 0 0;
  font-family:Georgia,serif;font-style:italic}
h2{font-family:Georgia,serif;font-size:1.35rem;margin:0;letter-spacing:-.01em}
.rubriek{margin:0 0 3rem}
.rubriek-kop{display:flex;align-items:center;gap:.6rem;padding-bottom:.6rem;
  border-bottom:1px solid var(--lijn);margin-bottom:1.5rem}
.rubriek-kop .teken{font-size:1.2rem;line-height:1}
article.bericht{margin:0 0 2rem}
figure{margin:.9rem 0 .6rem}
figure img{display:block;width:100%;height:auto;max-height:15rem;object-fit:cover;
  border-radius:10px;background:var(--zee-licht)}
figcaption{font-size:.78rem;color:var(--inkt-zacht);margin-top:.35rem;line-height:1.4}
.opening{margin:0 0 2.5rem}
.opening figure,figure.opening{margin:0 0 2.5rem}
.opening img{max-height:24rem;border-radius:14px}
.opening figcaption{font-size:.82rem}
article.bericht h3{font-size:1.05rem;margin:0 0 .4rem;line-height:1.35;font-weight:650}
article.bericht p{margin:0 0 .5rem}
.herkomst{font-size:.8rem;color:var(--inkt-zacht)}
.herkomst a{color:var(--zee);text-decoration:none;border-bottom:1px solid transparent}
.herkomst a:hover{border-bottom-color:var(--zee)}
.feitjes{background:var(--zee-licht);border-radius:12px;padding:1.75rem;margin:0 0 3rem;
  border:1px solid var(--lijn)}
.feitjes h2{margin-bottom:1rem}
.feitjes ul{margin:0;padding:0;list-style:none}
.feitjes li{padding:.7rem 0;border-top:1px solid var(--lijn);display:flex;gap:.75rem}
.feitjes li:first-of-type{border-top:0;padding-top:0}
.feitjes li::before{content:"◆";color:var(--accent);flex:none;font-size:.7rem;line-height:1.9}
.weer{display:flex;gap:1.25rem;align-items:flex-start;background:var(--kaart);
  border:1px solid var(--lijn);border-left:3px solid var(--accent);border-radius:12px;
  padding:1.5rem;margin:0 0 3rem;box-shadow:var(--schaduw)}
.weer .tekst{flex:1 1 auto;min-width:0}
.weer h2{margin:0 0 .5rem;font-size:1.05rem}
.weer p{margin:0 0 .5rem}
.weer figure{flex:0 0 11rem;margin:0}
.weer figure img{border-radius:8px}
@media (max-width:34rem){
  .weer{flex-direction:column-reverse}
  .weer figure{flex:none;width:100%}
}
.leuk{margin:0 0 3rem}
.leuk .item{display:flex;gap:1.25rem;align-items:flex-start;padding:1.25rem 0;
  border-top:1px solid var(--lijn)}
.leuk .item:first-of-type{border-top:0}
.leuk .item p{margin:0 0 .4rem}
.leuk figure{flex:0 0 10rem;margin:0}
.leuk figure img{border-radius:8px}
@media (max-width:34rem){
  .leuk .item{flex-direction:column}
  .leuk figure{flex:none;width:100%;order:2}
}
.agenda{margin:0 0 3rem}
.agenda ol{margin:0;padding:0;list-style:none}
.agenda li{display:flex;gap:1rem;padding:.75rem 0;border-bottom:1px solid var(--lijn);
  align-items:baseline}
.agenda .wanneer{flex:0 0 8.5rem;font-weight:650;color:var(--zee);font-size:.88rem}
footer{border-top:1px solid var(--lijn);padding-top:1.75rem;color:var(--inkt-zacht);font-size:.85rem}
footer a{color:var(--zee)}
.archieflijst{margin:2rem 0 0;padding:0;list-style:none}
.archieflijst li{padding:.55rem 0;border-bottom:1px solid var(--lijn)}
.archieflijst a{color:var(--zee);text-decoration:none;font-weight:600}
.archieflijst .bijschrift{color:var(--inkt-zacht);font-weight:400}
.terug{display:inline-block;margin-bottom:1.5rem;color:var(--zee);text-decoration:none;font-size:.9rem}
@media print{
  body{background:#fff}
  .feitjes{background:#f6f6f6}
  .weer{box-shadow:none}
  header.kop{padding-top:0}
}
`;

// Foto's staan op de servers van de bronnen. Gaat er een stuk, dan verdwijnt
// het kader in plaats van een gebroken plaatje te tonen.
function plaatje(foto, { klasse = '', toonBron = false } = {}) {
  if (!foto?.url) return '';
  // De bron staat bij een bericht al onder de tekst; hem in het bijschrift
  // herhalen leest als een fout. Alleen bij de openingsfoto hoort hij erbij.
  const bij = [foto.bijschrift, toonBron ? foto.bron : null].filter(Boolean).join(' · ');
  return `<figure${klasse ? ` class="${klasse}"` : ''}>
    <img src="${esc(foto.url)}" alt="${esc(foto.bijschrift || '')}" loading="lazy"
      referrerpolicy="no-referrer" onerror="this.closest('figure').remove()">
    ${bij ? `<figcaption>${esc(bij)}</figcaption>` : ''}
  </figure>`;
}

function paginaHtml(editie, { isIndex, archief }) {
  const { titel, intro, periode, categorieen = [], feitjes = [], agenda = [],
          statistiek, openingsfoto, weer, leukEnOpvallend = [] } = editie;

  const rubrieken = categorieen.map(c => `
    <section class="rubriek">
      <div class="rubriek-kop"><span class="teken">${esc(c.emoji || '')}</span><h2>${esc(c.naam)}</h2></div>
      ${c.items.map(i => `
      <article class="bericht">
        <h3>${esc(i.kop)}</h3>
        <p>${esc(i.tekst)}</p>
        ${plaatje(i.foto)}
        <p class="herkomst">${i.link ? `<a href="${esc(i.link)}" target="_blank" rel="noopener">${esc(i.bron)}</a>` : esc(i.bron)}</p>
      </article>`).join('')}
    </section>`).join('');

  const feitjesBlok = feitjes.length ? `
    <section class="feitjes">
      <h2>Opmerkelijk</h2>
      <ul>${feitjes.map(f => `<li><span>${esc(f.tekst)}${f.link ? ` <a class="herkomst" href="${esc(f.link)}" target="_blank" rel="noopener">(${esc(f.bron)})</a>` : ''}</span></li>`).join('')}</ul>
    </section>` : '';

  // Het weer staat bovenaan: het is het enige stuk dat over de week gaat die
  // nog komt, en de lezer die het eiland kent kijkt er als eerste naar.
  const weerBlok = weer?.tekst ? `
    <section class="weer">
      <div class="tekst">
        <div class="rubriek-kop"><span class="teken">\u26c5</span><h2>Het weer deze week</h2></div>
        <p>${esc(weer.tekst)}</p>
        ${weer.bron ? `<p class="herkomst">${weer.link ? `<a href="${esc(weer.link)}" target="_blank" rel="noopener">${esc(weer.bron)}</a>` : esc(weer.bron)}</p>` : ''}
      </div>
      ${plaatje(weer.foto)}
    </section>` : '';

  const agendaBlok = agenda.length ? `
    <section class="agenda">
      <div class="rubriek-kop"><span class="teken">📅</span><h2>Op de kalender</h2></div>
      <ol>${agenda.map(a => `<li><span class="wanneer">${esc(a.datum)}</span><span>${esc(a.wat)}</span></li>`).join('')}</ol>
    </section>` : '';

  // Onderaan, met foto's: dit zijn kleine verhalen, geen eenregelige weetjes.
  // Daarin verschilt het van "Opmerkelijk" bovenaan.
  const leukBlok = leukEnOpvallend.length ? `
    <section class="leuk">
      <div class="rubriek-kop"><span class="teken">\u2728</span><h2>Leuk &amp; opvallend</h2></div>
      ${leukEnOpvallend.map(i => `
      <div class="item">
        <div class="tekst">
          <p>${esc(i.tekst)}</p>
          <p class="herkomst">${i.link ? `<a href="${esc(i.link)}" target="_blank" rel="noopener">${esc(i.bron)}</a>` : esc(i.bron)}</p>
        </div>
        ${plaatje(i.foto)}
      </div>`).join('')}
    </section>` : '';

  const archiefBlok = (isIndex && archief.length > 1) ? `
    <section class="agenda">
      <div class="rubriek-kop"><span class="teken">📚</span><h2>Eerdere weken</h2></div>
      <ul class="archieflijst">${archief.filter(a => a.editie !== editie.editie).map(a =>
        `<li><a href="archief/${esc(a.editie)}.html">${esc(a.titel)}</a> <span class="bijschrift">— ${esc(langeDatum(a.editie))}</span></li>`).join('')}</ul>
    </section>` : '';

  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow, noarchive">
<title>${esc(titel)} — Kefalonia Wekelijks</title>
<meta name="description" content="${esc(intro).slice(0, 160)}">
<meta property="og:title" content="${esc(titel)}">
<meta property="og:description" content="${esc(intro).slice(0, 200)}">
<meta property="og:type" content="article">
<style>${STIJL}</style>
</head>
<body>
<div class="omslag">
  ${isIndex ? '' : '<a class="terug" href="../index.html">← Naar de laatste editie</a>'}
  <header class="kop">
    <p class="merk">Kefalonia · Wekelijks</p>
    <h1>${esc(titel)}</h1>
    <p class="periode">Het nieuws van ${esc(langeDatum(periode.van))} tot en met ${esc(langeDatum(periode.tot))}</p>
    ${intro ? `<p class="intro">${esc(intro)}</p>` : ''}
  </header>
  ${plaatje(openingsfoto, { klasse: 'opening', toonBron: true })}
  ${weerBlok}
  ${feitjesBlok}
  ${rubrieken}
  ${agendaBlok}
  ${leukBlok}
  ${archiefBlok}
  <footer>
    <p>Samengesteld uit ${statistiek?.bronnen ?? '?'} Kefalonische bronnen${statistiek?.berichtenGescand ? `, ${statistiek.berichtenGescand} berichten gescand` : ''}. Elke maandagochtend ververst.</p>
    <p>Klopt er iets niet, of mist er een bron? Laat het weten.</p>
  </footer>
</div>
</body>
</html>`;
}

// ---- bouwen ----
const bestanden = readdirSync(join(WORTEL, 'edities')).filter(f => f.endsWith('.json')).sort().reverse();
if (bestanden.length === 0) { console.error('Geen edities gevonden in edities/'); process.exit(1); }

const alle = bestanden.map(f => JSON.parse(readFileSync(join(WORTEL, 'edities', f), 'utf8')));
const nieuwste = alle[0];

mkdirSync(join(WORTEL, 'archief'), { recursive: true });
writeFileSync(join(WORTEL, 'index.html'), paginaHtml(nieuwste, { isIndex: true, archief: alle }));
for (const e of alle) {
  writeFileSync(join(WORTEL, 'archief', `${e.editie}.html`), paginaHtml(e, { isIndex: false, archief: alle }));
}
writeFileSync(join(WORTEL, '.nojekyll'), '');

console.log(`index.html gebouwd uit editie ${nieuwste.editie} — "${nieuwste.titel}"`);
console.log(`archief: ${alle.length} editie(s)`);
