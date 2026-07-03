/*  ViLoLabs — Cloudflare Pages Function · /worksheets/<slug>
 *  ─────────────────────────────────────────────────────────
 *  Per-slug SEO meta + share-preview customization for the worksheet share
 *  URLs. Streams sheets.html from the asset bundle and uses HTMLRewriter
 *  to inject slug-specific title / description / canonical / og:* / twitter:*
 *  into the head BEFORE the response reaches the client. Scrapers (Pinterest,
 *  WhatsApp, Facebook, X) don't run JS, so without this each pin/preview
 *  would land on a generic "Smart Worksheet Generator" snippet.
 *
 *  RANKING STRATEGY (decided 2026-06-28): /sheets is the single Google
 *  ranking target — it has visible keyword content + matching JSON-LD baked
 *  into sheets.html itself. Every /worksheets/<slug> URL gets `noindex,
 *  follow` from this Function. The slug URLs exist for sharing only; we
 *  never compete with ourselves. The `indexable_presets` allowlist in
 *  seo-keywords.json stays in place for Pinterest pin targeting + future
 *  re-enablement, but the Function does NOT promote curated slugs to
 *  index right now.
 *
 *  STRUCTURED DATA: The Function does NOT inject any JSON-LD. All four
 *  schemas (LearningResource, HowTo, FAQPage, BreadcrumbList) live as
 *  inline <script> tags in sheets.html where matching visible content
 *  exists. Adding more JSON-LD here would duplicate those signals.
 *
 *  Slug parsing + template rendering MUST stay byte-for-byte identical to
 *  assets/worksheet-seo.js (WSeo) so the SSR meta matches what the client
 *  hydrates to. If you change WSeo, change this file too.
 *
 *  Failure mode: any unparseable slug, any keyword-load failure, any render
 *  exception → fall through to plain sheets.html. Never breaks the page.
 *
 *  Local test:
 *    cd "ViLoLabs/Website HTML" && npx wrangler pages dev .
 *    curl -s http://localhost:8788/worksheets/<slug> | grep -E "<title>|robots|og:title|canonical"
 */

let _kw = null;

// BUGFIX (2026-07-03): env.ASSETS.fetch() needs a Request built against the
// REAL incoming request's origin — a fake placeholder host ('https://
// placeholder/...') worked in local `wrangler pages dev` (which is lenient
// about the ASSETS binding's origin) but silently failed on Cloudflare's
// real edge runtime, making loadKeywords() always return null in production.
// That cascaded into every /worksheets/<slug> URL 404ing (see the `if (!kw)
// return env.ASSETS.fetch(request)` fallback below) — this was invisible
// during local testing because local testing never hit the real bug path.
// Mirror the same URL-construction pattern already used for the working
// /worksheet fetch: build relative to request.url, not a placeholder.
async function loadKeywords(env, request) {
  if (_kw) return _kw;
  try {
    const res = await env.ASSETS.fetch(new Request(new URL('/assets/seo-keywords.json', request.url), request));
    if (!res.ok) return null;
    _kw = await res.json();
    return _kw;
  } catch { return null; }
}

/* ── mulberry32 — must match WSeo.mulberry32 exactly ──────────────── */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickFrom(arr, seed, salt = 0) {
  if (!arr || !arr.length) return null;
  const rnd = mulberry32(seed + salt);
  return arr[Math.floor(rnd() * arr.length)];
}

function fill(tpl, vars) {
  return String(tpl).replace(/\{(\w+)\}/g, (_, k) => vars[k] != null ? vars[k] : '');
}

function honestTemplates(templates, isMixed) {
  if (!isMixed) return templates;
  const clean = templates.filter(t => !t.includes('{category}'));
  return clean.length ? clean : templates;
}

/* ── slug parse — mirrors WSeo.parseSlugWith ──────────────────────── */
function parseSlug(slug, kw) {
  if (!slug || typeof slug !== 'string') return null;
  const tokens = slug.split('-').filter(Boolean);
  if (tokens.length < 3) return null;
  const id = tokens[tokens.length - 1];
  if (!/^[a-z0-9]{4,7}$/.test(id)) return null;
  const joined = tokens.slice(0, -1).join('-');

  const actSlugs = Object.entries(kw.activities)
    .filter(([k, v]) => !k.startsWith('_') && v && v.slug)
    .map(([key, v]) => ({ key, slug: v.slug }))
    .sort((a, b) => b.slug.length - a.slug.length);

  let actMatch = null;
  for (const a of actSlugs) {
    if (joined.startsWith(a.slug + '-') || joined === a.slug) { actMatch = a; break; }
  }
  if (!actMatch) return null;
  let rest = joined.slice(actMatch.slug.length).replace(/^-/, '');

  const gradeSlugs = Object.entries(kw.grades)
    .filter(([k, v]) => !k.startsWith('_') && v && v.slug)
    .map(([key, v]) => ({ key, slug: v.slug }))
    .sort((a, b) => b.slug.length - a.slug.length);

  let gradeMatch = null;
  for (const g of gradeSlugs) {
    if (rest.startsWith(g.slug + '-') || rest === g.slug) { gradeMatch = g; break; }
  }
  if (!gradeMatch) return null;
  rest = rest.slice(gradeMatch.slug.length).replace(/^-/, '');

  let catKey = 'mix';
  if (rest) {
    const found = Object.entries(kw.categories)
      .filter(([k, v]) => !k.startsWith('_') && v && v.slug)
      .find(([, v]) => v.slug === rest);
    if (found) catKey = found[0];
  }

  return {
    activity: actMatch.key,
    grade: gradeMatch.key,
    category: catKey,
    id,
    seed: parseInt(id, 36) >>> 0
  };
}

function buildVars(config, kw) {
  const g = kw.grades[config.grade] || kw.grades['1'];
  const a = kw.activities[config.activity] || kw.activities['mix'];
  const c = kw.categories[config.category] || kw.categories['mix'];
  return {
    activity: pickFrom(a.names, config.seed, 1),
    grade:    pickFrom(g.names, config.seed, 2),
    category: pickFrom(c.names, config.seed, 3),
    ages:     g.ages || ''
  };
}

function renderTitle(config, kw, vars) {
  const tpls = honestTemplates(kw.title_templates, config.category === 'mix');
  return fill(pickFrom(tpls, config.seed, 4), vars);
}
function renderDesc(config, kw, vars) {
  const tpls = honestTemplates(kw.description_templates, config.category === 'mix');
  return fill(pickFrom(tpls, config.seed, 5), vars);
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const SITE_ORIGIN = 'https://vilolabs.in';

export async function onRequest(context) {
  const { request, env, params } = context;
  const slug = params.slug;

  // Stream the worksheet hub HTML from the asset bundle. We fetch /worksheet
  // (NOT /sheets, NOT /sheets.html). Reason: the _redirects file 301-redirects
  // /sheets → /worksheet, and /worksheet 200-rewrites to /sheets internally to
  // serve sheets.html. Fetching /worksheet hits the rewrite (200) directly,
  // returning the HTML body. Fetching /sheets would hit the 301 and break the
  // Function (upstream.ok is false on 3xx so we'd serve the redirect, not HTML).
  const sheetsReq = new Request(new URL('/worksheet', request.url), request);
  const upstream = await env.ASSETS.fetch(sheetsReq);
  if (!upstream.ok) return upstream;

  const kw = await loadKeywords(env, request);
  if (!kw) return env.ASSETS.fetch(request);

  const parsed = parseSlug(slug, kw);
  if (!parsed) {
    // Slug doesn't match the share-URL pattern (e.g., hub pages like
    // /worksheets/coloring, /worksheets/maze, /worksheets/tracing). Hand off
    // to the static asset pipeline, which serves the matching hub HTML file
    // (worksheets/<slug>.html) via Pages Pretty URLs. Falls through to a 404
    // if no matching file exists, which is also correct.
    return env.ASSETS.fetch(request);
  }

  let title, desc, vars;
  try {
    vars  = buildVars(parsed, kw);
    title = renderTitle(parsed, kw, vars);
    desc  = renderDesc(parsed, kw, vars);
  } catch {
    return upstream;
  }
  if (!title || !desc) return upstream;

  const canonicalUrl = `${SITE_ORIGIN}/worksheets/${slug}`;

  // All share URLs are noindex,follow. /sheets is the single ranking target;
  // every /worksheets/<slug> exists for sharing only and never competes for
  // search positions. "follow" still passes link-equity from any incoming
  // pin / backlink into /sheets via the in-page hub navigation.
  const headInjection = [
    `<meta name="description" content="${escapeAttr(desc)}">`,
    `<meta name="robots" content="noindex, follow">`,
    `<meta property="og:type" content="article">`,
    `<meta property="og:title" content="${escapeAttr(title)}">`,
    `<meta property="og:description" content="${escapeAttr(desc)}">`,
    `<meta property="og:site_name" content="ViLoLabs">`,
    `<meta property="og:locale" content="en_IN">`,
    `<meta name="twitter:title" content="${escapeAttr(title)}">`,
    `<meta name="twitter:description" content="${escapeAttr(desc)}">`
  ].join('\n');

  return new HTMLRewriter()
    .on('title',                            { element(el) { el.setInnerContent(title); } })
    .on('link[rel="canonical"]',            { element(el) { el.setAttribute('href', canonicalUrl); } })
    .on('meta[property="og:url"]',          { element(el) { el.setAttribute('content', canonicalUrl); } })
    .on('head',                             { element(el) { el.append('\n' + headInjection + '\n', { html: true }); } })
    // Pinterest spam safety: remove the visible About/FAQ section + all its
    // JSON-LD on share URLs. The section is identical across every slug URL
    // and would make Pinterest see "different URLs, same destination wrapper".
    // The shared LearningResource / HowTo / FAQPage / BreadcrumbList JSON-LD
    // in <head> describes /worksheet (the hub) — keeping it on share URLs
    // would also be a duplicate-content signal. The Function-injected per-
    // slug meta tags in the head stay; that's what makes share previews
    // unique per pin. /worksheet (no Function) keeps everything intact.
    .on('#pageInfo',                                { element(el) { el.remove(); } })
    .on('script[type="application/ld+json"]',       { element(el) { el.remove(); } })
    .transform(upstream);
}
