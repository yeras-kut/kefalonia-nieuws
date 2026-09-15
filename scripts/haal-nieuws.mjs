#!/usr/bin/env node
// Haalt al het Kefalonia/Ithaka-nieuws van de afgelopen week op.
// Gebruik: node scripts/haal-nieuws.mjs [dagen] > ruwe-oogst.json

import { readFileSync } from 'node:fs';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';
const DAGEN = Number(process.argv[2] || 7);
const SINDS = new Date(Date.now() - DAGEN * 864e5);
const bronnen = JSON.parse(readFileSync(new URL('../bronnen.json', import.meta.url), 'utf8'));

const schoon = s => String(s ?? '')
  .replace(/<!\[CDATA\[|\]\]>/g, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(d))
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&apos;|&#039;|&#8217;/g, "'")
  .replace(/&laquo;/g, '«').replace(/&raquo;/g, '»')
  .replace(/&hellip;/g, '…').replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ').trim();

async function haal(url, { json = false } = {}) {
  const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return json ? r.json() : r.text();
}

// WordPress REST API — volledige weekdekking, met paginering
// De foto's halen we apart op: `_embed` maakt het antwoord vele malen groter,
// terwijl één extra verzoek per honderd berichten hetzelfde oplevert.
async function wordpress({ naam, host, soort }) {
  const items = [];
  const na = SINDS.toISOString().slice(0, 19);
  for (let pagina = 1; pagina <= 4; pagina++) {
    const url = `https://${host}/wp-json/wp/v2/posts?after=${na}&per_page=100&page=${pagina}`
      + `&orderby=date&order=desc&_fields=date,link,title,excerpt,featured_media`;
    let batch;
    try { batch = await haal(url, { json: true }); }
    catch (e) { if (pagina === 1) throw e; break; }
    if (!Array.isArray(batch) || batch.length === 0) break;
    for (const p of batch) {
      items.push({
        bron: naam, soort,
        titel: schoon(p.title?.rendered),
        link: p.link,
        datum: p.date,
        samenvatting: schoon(p.excerpt?.rendered).slice(0, 500),
        _fotoId: p.featured_media || 0,
      });
    }
    if (batch.length < 100) break;
  }

  // Foto's erbij zoeken
  const ids = [...new Set(items.map(i => i._fotoId).filter(Boolean))];
  const fotos = new Map();
  for (let i = 0; i < ids.length; i += 90) {
    const groep = ids.slice(i, i + 90);
    try {
      const media = await haal(
        `https://${host}/wp-json/wp/v2/media?include=${groep.join(',')}&per_page=100`
        + `&_fields=id,source_url,alt_text,caption,media_details`, { json: true });
      for (const m of media || []) {
        const maten = m.media_details?.sizes || {};
        // medium_large (768px) is ruim genoeg voor de pagina en scheelt laadtijd
        const bron = maten.medium_large?.source_url || maten.large?.source_url || m.source_url;
        if (!bron) continue;
        fotos.set(m.id, {
          url: bron,
          groot: m.source_url,
          breedte: maten.medium_large?.width || m.media_details?.width || null,
          hoogte: maten.medium_large?.height || m.media_details?.height || null,
          bijschrift: schoon(m.caption?.rendered).slice(0, 200) || schoon(m.alt_text).slice(0, 200),
        });
      }
    } catch { /* foto's zijn mooi meegenomen, geen reden om de oogst te laten mislukken */ }
  }

  for (const i of items) {
    const f = fotos.get(i._fotoId);
    if (f) i.foto = f;
    delete i._fotoId;
  }
  return items;
}

// Google News RSS — vangt de bronnen die achter Cloudflare zitten, plus landelijk nieuws
async function googlenews({ naam, query }) {
  const q = encodeURIComponent(`${query} when:${DAGEN}d`);
  const xml = await haal(`https://news.google.com/rss/search?q=${q}&hl=el&gl=GR&ceid=GR:el`);
  const blokken = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => m[1]);
  return blokken.map(b => {
    const veld = t => { const m = b.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)); return m ? schoon(m[1]) : ''; };
    const titelRuw = veld('title');
    const scheiding = titelRuw.lastIndexOf(' - ');
    return {
      bron: naam, soort: 'nieuws',
      titel: scheiding > 20 ? titelRuw.slice(0, scheiding) : titelRuw,
      uitgever: scheiding > 20 ? titelRuw.slice(scheiding + 3) : '',
      link: (b.match(/<link>([\s\S]*?)<\/link>/) || [])[1]?.trim() || '',
      datum: new Date(veld('pubDate') || Date.now()).toISOString(),
      samenvatting: veld('description').slice(0, 400),
    };
  });
}

const taken = [
  ...bronnen.wordpress.map(b => ({ b, fn: wordpress })),
  ...bronnen.googlenews.map(b => ({ b, fn: googlenews })),
];

const resultaten = await Promise.allSettled(taken.map(({ b, fn }) => fn(b)));

const alles = [];
const logboek = [];
resultaten.forEach((r, i) => {
  const naam = taken[i].b.naam;
  if (r.status === 'fulfilled') {
    alles.push(...r.value);
    logboek.push({ bron: naam, status: 'ok', aantal: r.value.length });
  } else {
    logboek.push({ bron: naam, status: 'mislukt', fout: String(r.reason?.message || r.reason) });
  }
});

// Dubbele berichten eruit: zelfde titel of zelfde link
const gezien = new Set();
const uniek = alles
  .filter(i => i.titel && i.link)
  .filter(i => new Date(i.datum) >= SINDS)
  .filter(i => {
    const sleutel = i.titel.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '').slice(0, 60);
    if (gezien.has(sleutel)) return false;
    gezien.add(sleutel);
    return true;
  })
  .sort((a, b) => new Date(b.datum) - new Date(a.datum));

process.stdout.write(JSON.stringify({
  opgehaald: new Date().toISOString(),
  periode: { van: SINDS.toISOString(), tot: new Date().toISOString() },
  logboek,
  aantal: uniek.length,
  berichten: uniek,
}, null, 2));

console.error(`\nBronnen: ${logboek.filter(l => l.status === 'ok').length}/${logboek.length} gelukt`);
for (const l of logboek) console.error(`  ${l.status === 'ok' ? '✓' : '✗'} ${l.bron}: ${l.aantal ?? l.fout}`);
console.error(`Unieke berichten deze week: ${uniek.length}`);
