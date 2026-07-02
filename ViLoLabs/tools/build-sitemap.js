/*
 * build-sitemap.js  —  ViLoLabs sitemap generator
 * --------------------------------------------------------------
 * Pulls every worksheet slug + tool_share slug from Supabase,
 * merges with the curated static page list, writes:
 *   Website HTML/sitemap.xml
 *
 *   node tools/build-sitemap.js
 *
 * Override the base URL when the real domain is live:
 *   SITE_BASE=https://vilolabs.com node tools/build-sitemap.js
 *
 * Sitemap protocol caps:
 *   - 50,000 URLs per sitemap file
 *   - 50 MB uncompressed
 * For >40k URLs we automatically split into a sitemap index. We're
 * nowhere near that limit yet; the split logic is dormant until needed.
 * --------------------------------------------------------------
 */
const fs   = require('fs');
const path = require('path');

const SITE_BASE = (process.env.SITE_BASE || 'https://vilolabs.in').replace(/\/$/, '');
const OUT       = path.join(__dirname, '..', 'Website HTML', 'sitemap.xml');
const KW_PATH   = path.join(__dirname, '..', 'Website HTML', 'assets', 'seo-keywords.json');

const SUPABASE_URL  = 'https://nosskzzzkpadxakjbzdt.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc3Nrenp6a3BhZHhha2piemR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NzY3NTIsImV4cCI6MjA5NTE1Mjc1Mn0.pwBuchMlGi6KZ6vrYAfJtcQlraCdtB4DT1WKq9nnQ5I';

const PAGE_SIZE = 1000;  // Supabase REST default max per request

// ── Curated static pages (kept hardcoded — these don't live in any DB) ──
// priority/changefreq tuned to signal hierarchy to Google.
const STATIC = [
  { loc: '/',                         priority: '1.0',  changefreq: 'weekly'  },
  { loc: '/about',                      priority: '0.7',  changefreq: 'monthly' },
  // /worksheet is the primary ranking target — has visible content + HowTo +
  // FAQPage JSON-LD baked into sheets.html (which is rewritten under the
  // /worksheet URL via _redirects). Every /worksheets/<slug> URL serves the
  // same HTML but with robots:noindex,follow set by the Pages Function, so
  // /worksheet is the only indexable URL in the worksheets cluster. The old
  // /sheets URL 301-redirects to /worksheet for backward compatibility.
  { loc: '/worksheet',                priority: '1.0',  changefreq: 'weekly',
    // Google Image Sitemap extension — one entry per real <img> on the page.
    // caption doubles as the image's descriptive text for Google (separate
    // from the on-page alt attribute, but should say the same thing).
    images: [
      { loc: '/assets/hero/worksheet-picker.webp',
        caption: 'ViLo Worksheets generator — pick a level from Pre-KG to Class 5, plus Colouring, Sudoku, Maze, and Math Master. Unlimited free generations, 5 to 15 pages each.' },
    ] },
  { loc: '/worksheets/',              priority: '0.6',  changefreq: 'monthly' },
  { loc: '/tools',                      priority: '0.9',  changefreq: 'weekly'  },
  { loc: '/app',                        priority: '0.7',  changefreq: 'monthly' },
  { loc: '/pulse',                      priority: '0.9',  changefreq: 'daily'   },
  { loc: '/tools/image-to-pdf',         priority: '0.85', changefreq: 'monthly' },
  { loc: '/tools/merge-pdf',            priority: '0.85', changefreq: 'monthly' },
  { loc: '/tools/resize-image',         priority: '0.85', changefreq: 'monthly' },
  { loc: '/tools/compress-image',       priority: '0.85', changefreq: 'monthly' },
  { loc: '/tools/compress-pdf',         priority: '0.85', changefreq: 'monthly' },
  { loc: '/tools/qr-generator',         priority: '0.85', changefreq: 'monthly' },
  { loc: '/tools/pdf-to-word',          priority: '0.85', changefreq: 'monthly' },
  { loc: '/privacy',                    priority: '0.3',  changefreq: 'yearly'  },
  { loc: '/terms',                      priority: '0.3',  changefreq: 'yearly'  },
  { loc: '/cookies',                    priority: '0.3',  changefreq: 'yearly'  },
];

// ── Fetch paginated table from Supabase ─────────────────────────
async function fetchAll(table, columns) {
  const rows = [];
  let from = 0;
  for (;;) {
    const url = SUPABASE_URL + '/rest/v1/' + table +
      '?select=' + encodeURIComponent(columns) +
      '&order=created_at.asc';
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON,
        Authorization: 'Bearer ' + SUPABASE_ANON,
        Range: from + '-' + (from + PAGE_SIZE - 1),
        'Range-Unit': 'items',
        Prefer: 'count=exact',
      },
    });
    if (!res.ok) {
      throw new Error(table + ' fetch failed: HTTP ' + res.status + ' — ' + await res.text());
    }
    const page = await res.json();
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return rows;
}

// ── XML escape for <loc> values ─────────────────────────────────
function xml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry({ loc, lastmod, priority, changefreq, images }) {
  const parts = ['<url>', '<loc>' + xml(SITE_BASE + loc) + '</loc>'];
  if (lastmod)    parts.push('<lastmod>' + lastmod.slice(0, 10) + '</lastmod>');
  if (changefreq) parts.push('<changefreq>' + changefreq + '</changefreq>');
  if (priority)   parts.push('<priority>' + priority + '</priority>');
  // Google Image Sitemap extension (image:image inside the page's <url>).
  // https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps
  // Requirement: the image MUST actually be referenced (as a real <img> or
  // CSS background) on the page at `loc` — a sitemap entry alone is not
  // enough for Google to index it.
  if (Array.isArray(images)) {
    images.forEach(img => {
      parts.push('<image:image><image:loc>' + xml(SITE_BASE + img.loc) + '</image:loc>' +
        (img.caption ? '<image:caption>' + xml(img.caption) + '</image:caption>' : '') +
        '</image:image>');
    });
  }
  parts.push('</url>');
  return '  ' + parts.join('');
}

(async function main() {
  console.log('=== ViLoLabs sitemap build ===');
  console.log('Base URL: ' + SITE_BASE);

  // Worksheet share URLs (every /worksheets/<slug>) are deliberately NOT
  // added to the sitemap. They're served by the Cloudflare Pages Function
  // with robots:noindex,follow — the single ranking target is /sheets (in
  // STATIC above). Putting noindex URLs in the sitemap = mixed signal that
  // Google penalizes. The `indexable_presets` allowlist in seo-keywords.json
  // is kept as a Pinterest pin targeting list + future re-enablement hook,
  // but it doesn't feed the sitemap right now.
  const worksheets = [];

  console.log('\n> Fetching tool_shares from Supabase ...');
  let shares = [];
  try {
    shares = await fetchAll('tool_shares', 'slug,tool,created_at');
    console.log('  ' + shares.length + ' tool share URLs');
  } catch (e) {
    console.error('  FAILED: ' + e.message);
  }

  console.log('\n> Fetching blog_posts from Supabase ...');
  let blogPosts = [];
  try {
    blogPosts = await fetchAll('blog_posts', 'slug,category,published_at');
    console.log('  ' + blogPosts.length + ' blog post URLs');
  } catch (e) {
    console.error('  FAILED: ' + e.message);
    console.error('  Sitemap will be built WITHOUT blog posts.');
  }

  // ── Build entries ──
  const allEntries = [];

  // Static pages (no lastmod — they're hand-curated, signals high authority)
  STATIC.forEach(s => allEntries.push(s));

  // Curated worksheets — small handful of hand-picked ranking targets, so
  // priority is high (0.85) and changefreq is weekly (we want recrawls).
  worksheets.forEach(w => allEntries.push({
    loc: '/worksheets/' + w.slug,
    lastmod: w.created_at,
    priority: '0.85',
    changefreq: 'weekly',
  }));

  // Tool preset URLs — ONLY URLs that real users have generated (DB rows).
  // We deliberately do NOT pre-list every possible preset from the catalog.
  // Each indexed URL must have a real transaction behind it — zero doorway-page risk.
  // Pretty URL: /tools/<tool>/<slug>  (matches _redirects + dev server SPA fallback)
  shares.forEach(s => allEntries.push({
    loc: '/tools/' + s.tool + '/' + s.slug,
    lastmod: s.created_at,
    priority: '0.6',
    changefreq: 'monthly',
  }));

  // Blog posts — high priority, weekly changefreq (data posts get updated)
  blogPosts.forEach(b => allEntries.push({
    loc: '/blog/' + b.slug,
    lastmod: b.published_at,
    priority: '0.8',
    changefreq: 'weekly',
  }));

  const total = allEntries.length;
  console.log('\n> Writing sitemap.xml (' + total + ' URLs)');

  if (total > 45000) {
    console.warn('  WARNING: approaching 50,000 URL cap. Sitemap index split needed soon.');
  }

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!-- ViLoLabs sitemap — generated ' + new Date().toISOString() + ' by tools/build-sitemap.js -->',
    '<!-- ' + STATIC.length + ' static · ' + worksheets.length + ' worksheets · ' + shares.length + ' tool shares -->',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    allEntries.map(urlEntry).join('\n'),
    '</urlset>',
    '',
  ].join('\n');

  fs.writeFileSync(OUT, body);
  console.log('  written: ' + OUT);
  console.log('  size:    ' + (fs.statSync(OUT).size / 1024).toFixed(1) + ' KB');
  console.log('\n=== Done ===');
})().catch(e => {
  console.error('\nFATAL: ' + e.message);
  process.exit(1);
});
