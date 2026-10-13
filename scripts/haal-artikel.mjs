#!/usr/bin/env node
// Haalt de volledige tekst van een of meer artikelen op, in het Grieks zoals
// het er staat. De oogst geeft alleen de titel en de eerste regels; wie daar
// een bericht van schrijft, vult de rest zelf in. Dit script is er om dat te
// voorkomen.
// Gebruik: node scripts/haal-artikel.mjs <link of nummer> [...]
// Een nummer als 12.3 is het derde bericht van onderwerp 12 uit overzicht.txt
// (opgezocht in relevant.json in de huidige map).

import { readFileSync, existsSync } from 'node:fs';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';

const ontcijfer = s => s
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(d))
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&laquo;/g, '«').replace(/&raquo;/g, '»')
  .replace(/&hellip;/g, '…').replace(/&nbsp;/g, ' ');

// Alinea's blijven alinea's: wie wat zei en in welke volgorde moet leesbaar blijven.
const alineas = html => ontcijfer(html
  .replace(/<(script|style|figure|iframe)[\s\S]*?<\/\1>/gi, '')
  .replace(/<\/(p|h[1-6]|li|blockquote|div)>|<br\s*\/?>/gi, '\n')
  .replace(/<[^>]+>/g, ''))
  .split('\n').map(r => r.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');

async function haal(url, json) {
  const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return json ? r.json() : r.text();
}

// Google News geeft een omleiding in plaats van het artikel. Achter die
// omleiding zit een ondertekend verzoek; hiermee vragen we het echte adres op.
// Lukt het niet, dan is het bericht niet te controleren en hoort het er niet in.
async function echteLink(link) {
  const id = new URL(link).pathname.split('/').pop();
  const pagina = await haal(`https://news.google.com/rss/articles/${id}`);
  const sg = pagina.match(/data-n-a-sg="([^"]+)"/)?.[1];
  const ts = pagina.match(/data-n-a-ts="([^"]+)"/)?.[1];
  if (!sg || !ts) throw new Error('Google News gaf geen ondertekening');
  const vraag = [[['Fbv4je', JSON.stringify(['garturlreq',
    [['X', 'X', ['X', 'X'], null, null, 1, 1, 'US:en', null, 1, null, null, null, null, null, 0, 1],
      'X', 'X', 1, [1, 1, 1], 1, 1, null, 0, 0, null, 0], id, Number(ts), sg]), null, 'generic']]];
  const r = await fetch('https://news.google.com/_/DotsSplashUi/data/batchexecute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', 'User-Agent': UA },
    body: 'f.req=' + encodeURIComponent(JSON.stringify(vraag)),
    signal: AbortSignal.timeout(30000),
  });
  const adres = (await r.text()).match(/\[\\"garturlres\\",\\"(.*?)\\"/)?.[1];
  if (!adres) throw new Error('Google News gaf het echte adres niet prijs');
  return adres;
}

async function artikel(link) {
  const u = new URL(link);
  const slug = u.pathname.split('/').filter(Boolean).pop();

  // De meeste bronnen draaien op WordPress; daar geeft de API de kale tekst.
  // Staat er een nummer in plaats van een slug in de link, dan is dat het bericht-ID.
  const vraag = /^\d+$/.test(slug) ? `include=${slug}` : `slug=${slug}`;
  try {
    const [p] = await haal(`${u.origin}/wp-json/wp/v2/posts?${vraag}&_fields=date,title,content`, true);
    if (p?.content?.rendered) {
      return { titel: alineas(p.title.rendered), datum: p.date, tekst: alineas(p.content.rendered) };
    }
  } catch { /* geen WordPress, of de API staat dicht: dan de pagina zelf */ }

  const html = await haal(link);
  const kern = html.match(/<article[\s\S]*?<\/article>/i)?.[0] ?? html;
  const titel = alineas(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '');
  const stukken = [...kern.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map(m => alineas(m[1])).filter(Boolean);
  return { titel, datum: '', tekst: stukken.join('\n') };
}

const vragen = process.argv.slice(2);
if (vragen.length === 0) {
  console.error('Gebruik: node scripts/haal-artikel.mjs <link of nummer> [...]');
  process.exit(1);
}

// Nummers uit het overzicht omzetten naar links
const groepen = existsSync('relevant.json') ? JSON.parse(readFileSync('relevant.json', 'utf8')) : [];
const alsLink = v => {
  const m = v.match(/^(\d+)\.(\d+)$/);
  if (!m) return v;
  const b = groepen.find(g => g.onderwerp === +m[1])?.berichten[+m[2] - 1];
  if (!b) throw new Error(`nummer ${v} staat niet in relevant.json`);
  return b.link;
};

for (const vraag of vragen) {
  try {
    let link = alsLink(vraag);
    if (link.includes('news.google.com')) link = await echteLink(link);
    // Deze regel is het adres dat in de editie bij `link` hoort.
    console.log(`\n===== ${link}`);
    const a = await artikel(link);
    if (!a.tekst) throw new Error('geen tekst gevonden');
    console.log(`TITEL: ${a.titel}\nDATUM: ${a.datum}\n\n${a.tekst}`);
  } catch (e) {
    if (!/^https?:/.test(vraag) || vraag.includes('news.google.com')) console.log(`\n===== ${vraag}`);
    // Hardop melden: een bericht waarvan de tekst niet binnenkwam mag niet geschreven worden.
    console.log(`MISLUKT: ${e.message}`);
  }
}
