/*  ViLoLabs — Cloudflare Pages Function · /worksheet
 *  ─────────────────────────────────────────────────────────
 *  Injects auto-captured worksheet snapshots into the #wsGallery on the
 *  worksheet hub, so genuine user-quality worksheet images accumulate on the
 *  ONE indexable page (never a separate gallery URL — see the HARD CEILING
 *  comment in worksheet.html). Same HTMLRewriter-over-env.ASSETS pattern as
 *  functions/worksheets/[slug].js.
 *
 *  🚨 /worksheet is the site's SINGLE Google ranking target. This Function must
 *  never make it slow or broken:
 *    - FAIL-OPEN: any Supabase error / >1.5s timeout → serve the static HTML
 *      unchanged (gallery shows just the hero card). Never a 5xx, never a hang.
 *    - CACHE: the capture list is edge-cached ~5 min, so Supabase sees a few
 *      queries/hour, not one per pageview.
 *    - Unlike the [slug] Function, this does NOT strip #pageInfo or JSON-LD —
 *      the hub keeps all its ranking content intact. It only APPENDS cards.
 *
 *  Local test:
 *    cd "ViLoLabs/Website HTML" && npx wrangler pages dev .
 *    curl -s http://localhost:8788/worksheet | grep -c "mini-card"
 */

const SUPABASE_URL  = 'https://nosskzzzkpadxakjbzdt.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc3Nrenp6a3BhZHhha2piemR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NzY3NTIsImV4cCI6MjA5NTE1Mjc1Mn0.pwBuchMlGi6KZ6vrYAfJtcQlraCdtB4DT1WKq9nnQ5I';
const LIST_TTL = 300;   // seconds — edge cache for the capture list
const MAX_CARDS = 500;  // matches the HARD CEILING in worksheet.html

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Edge-cached list of active captures. Returns [] on any failure (fail-open).
async function getCaptures(context) {
  const cache = caches.default;
  const key = new Request('https://vilolabs.in/__captures_list__');
  try {
    const cached = await cache.match(key);
    if (cached) return await cached.json();
  } catch { /* fall through to fetch */ }

  let rows = [];
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 1500);   // never let /worksheet hang
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/captured_worksheets` +
      `?select=slug,public_url,alt_text&retired_at=is.null&order=captured_at.desc&limit=${MAX_CARDS}`,
      { headers: { apikey: SUPABASE_ANON, Authorization: 'Bearer ' + SUPABASE_ANON }, signal: ctrl.signal }
    );
    clearTimeout(timer);
    if (res.ok) rows = await res.json();
  } catch {
    rows = [];   // timeout / network / abort → fail open
  }

  // Cache even an empty result briefly so a Supabase blip doesn't hammer it.
  try {
    const resp = new Response(JSON.stringify(rows), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=' + LIST_TTL },
    });
    context.waitUntil(cache.put(key, resp));
  } catch { /* caching is best-effort */ }
  return rows;
}

function cardHtml(row) {
  if (!row || !row.public_url || !row.slug) return '';
  const alt = escapeAttr(row.alt_text || 'Free printable worksheet from ViLo Worksheets');
  const url = escapeAttr(row.public_url);
  const gen = escapeAttr('/worksheets/' + row.slug);
  return (
    `<div class="mini-card">` +
      `<img src="${url}" loading="lazy" alt="${alt}">` +
      `<a href="${gen}" target="_blank" rel="noopener">Make this worksheet →</a>` +
    `</div>`
  );
}

export async function onRequest(context) {
  const { request, env } = context;

  // Always start from the real static hub HTML.
  const upstream = await env.ASSETS.fetch(new URL('/worksheet', request.url).toString());
  if (!upstream.ok || request.method !== 'GET') return upstream;

  let rows;
  try {
    rows = await getCaptures(context);
  } catch {
    return upstream;   // absolute belt-and-braces fail-open
  }
  if (!rows || !rows.length) return upstream;

  const cards = rows.map(cardHtml).join('');
  if (!cards) return upstream;

  return new HTMLRewriter()
    // Append capture cards AFTER the existing hero card, inside #wsGallery.
    // The inline see-more script in worksheet.html re-applies the 50-card cap
    // on load, so anything past 50 is CSS-hidden (still in the real HTML for
    // Googlebot). Everything stays on this one page — never a second URL.
    .on('#wsGallery', { element(el) { el.append(cards, { html: true }); } })
    .transform(upstream);
}
