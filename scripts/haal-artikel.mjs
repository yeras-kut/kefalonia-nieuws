#!/usr/bin/env node
// Haalt de volledige tekst van een of meer artikelen op, in het Grieks zoals
// het er staat. De oogst geeft alleen de titel en de eerste regels; wie daar
// een bericht van schrijft, vult de rest zelf in. Dit script is er om dat te
// voorkomen.
// Gebruik: node scripts/haal-artikel.mjs <link> [<link> ...]

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

const links = process.argv.slice(2);
if (links.length === 0) {
  console.error('Gebruik: node scripts/haal-artikel.mjs <link> [<link> ...]');
  process.exit(1);
}

for (const link of links) {
  console.log(`\n===== ${link}`);
  try {
    const a = await artikel(link);
    if (!a.tekst) throw new Error('geen tekst gevonden');
    console.log(`TITEL: ${a.titel}\nDATUM: ${a.datum}\n\n${a.tekst}`);
  } catch (e) {
    // Hardop melden: een bericht waarvan de tekst niet binnenkwam mag niet geschreven worden.
    console.log(`MISLUKT: ${e.message}`);
  }
}
