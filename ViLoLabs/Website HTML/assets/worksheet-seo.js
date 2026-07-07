/*  ViLoLabs Worksheets — SEO helper module
 *  ────────────────────────────────────────────────────────────
 *  Pure browser module (no build step). Loaded by sheets.html
 *  (to build a slug + redirect) and by /worksheets/index.html
 *  (to parse a slug + render the worksheet).
 *
 *  Exports (attached to window.WSeo):
 *    mulberry32(seed)            → seeded PRNG  (deterministic Math.random replacement)
 *    seedFromString(str)         → 32-bit int from any string (cyrb53 hash)
 *    newSeed()                   → fresh random 32-bit seed
 *    encodeId(seed)              → 4-char base-36 ID (collision-resistant for our scale)
 *    decodeId(id)                → seed integer from 4-char ID
 *    buildSlug({activity,grade,category,id})  → "addition-worksheets-grade-1-animals-a3f9"
 *    parseSlug(slug)             → {activity,grade,category,id} or null
 *    loadKeywords()              → Promise<keywords.json>   (cached)
 *    renderTitle({activity,grade,category,id}, kw)    → SEO <title>
 *    renderDesc({activity,grade,category,id}, kw)     → meta description
 *    renderH1({activity,grade,category,id}, kw)       → page H1
 *    renderBody({activity,grade,category,id}, kw)     → intro paragraph
 */
(function () {
  'use strict';

  /* ── Seeded PRNG (mulberry32) — 32-bit, very fast, fine for shuffles ── */
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

  /* ── 53-bit hash for string → seed ── */
  function seedFromString(str) {
    let h1 = 0xdeadbeef ^ 0, h2 = 0x41c6ce57 ^ 0;
    for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    return (h1 >>> 0);
  }

  function newSeed() {
    // pick a fresh seed using browser entropy (not from the seeded PRNG)
    return (Math.random() * 0x100000000) >>> 0;
  }

  /* ── 7-char base-36 ID (LOSSLESS roundtrip of full 32-bit seed) ──
   * A 32-bit seed in base36 is at most 7 chars ("zik0zj" = 4294967295).
   * Earlier we kept only last 4 chars to "look cleaner" — that was lossy:
   * decode(encode(seed)) !== seed, so /worksheets/<slug> in a new tab built
   * a different worksheet than the originating session. 7 chars guarantees
   * round-trip identity, costs 3 extra URL chars, and gives 4.3B unique IDs.
   */
  function encodeId(seed) {
    return (seed >>> 0).toString(36).padStart(7, '0');
  }

  function decodeId(id) {
    return parseInt(id, 36) >>> 0;
  }

  /* ── slug build / parse ── */
  // SLUG SHAPE:  {activitySlug}-{gradeSlug}-{categorySlug}-{id4}
  // categorySlug is optional in URL (used to be cleaner). When absent, parser
  // treats it as 'mix'. id4 is always the last token.
  function buildSlug({ activitySlug, gradeSlug, categorySlug, id }) {
    const parts = [activitySlug, gradeSlug];
    if (categorySlug && categorySlug !== 'mix') parts.push(categorySlug);
    parts.push(id);
    return parts.join('-');
  }

  function parseSlug(slug) {
    if (!slug || typeof slug !== 'string') return null;
    const tokens = slug.split('-').filter(Boolean);
    if (tokens.length < 3) return null;
    const id = tokens[tokens.length - 1];
    // Accept 4-7 char IDs: 7 = new lossless format, 4 = legacy (still parses,
    // but the restored worksheet will differ from the original — those URLs
    // were created before the lossless fix and we can't recover their seeds).
    if (!/^[a-z0-9]{4,7}$/.test(id)) return null;
    // Walk activity slugs from longest to shortest to find a match.
    // Then grade is the next 1-2 tokens, category is the rest (or 'mix').
    // We rely on the keywords.json being loaded to know valid slugs — so parsing
    // happens *after* loadKeywords(). See parseSlugWith().
    return { rawTokens: tokens.slice(0, -1), id };
  }

  function parseSlugWith(slug, kw) {
    const base = parseSlug(slug);
    if (!base || !kw) return null;
    const tokens = base.rawTokens;
    const joined = tokens.join('-');

    // 1. find longest activity slug match at start
    const actSlugs = Object.entries(kw.activities)
      .map(([key, v]) => ({ key, slug: v.slug }))
      .sort((a, b) => b.slug.length - a.slug.length);
    let actMatch = null;
    for (const a of actSlugs) {
      if (joined.startsWith(a.slug + '-') || joined === a.slug) {
        actMatch = a;
        break;
      }
    }
    if (!actMatch) return null;
    let rest = joined.slice(actMatch.slug.length).replace(/^-/, '');

    // 2. find grade slug match
    // colouring/sudoku/maze all share the literal grade slug "for-kids", so a
    // plain first-match loop always resolves to whichever key sorts first
    // ('colouring') no matter which activity was actually matched — silently
    // turning every maze/sudoku share URL into a colouring worksheet on restore.
    // Fix: among tied candidates, prefer the grade whose KEY equals the already-
    // matched activity's key (always correct by construction — those three
    // modes set gradeKey===activityKey). Numeric grades (1-5, prekg, kg) have
    // unique slugs, so this never changes their resolution.
    const gradeSlugs = Object.entries(kw.grades)
      .map(([key, v]) => ({ key, slug: v.slug }))
      .sort((a, b) => b.slug.length - a.slug.length);
    const gradeCandidates = gradeSlugs.filter(g => rest.startsWith(g.slug + '-') || rest === g.slug);
    const gradeMatch = gradeCandidates.find(g => g.key === actMatch.key) || gradeCandidates[0] || null;
    if (!gradeMatch) return null;
    rest = rest.slice(gradeMatch.slug.length).replace(/^-/, '');

    // 3. remainder (if any) is category slug
    let catKey = 'mix';
    if (rest) {
      const found = Object.entries(kw.categories).find(([, v]) => v.slug === rest);
      if (found) catKey = found[0];
    }

    return {
      activity: actMatch.key,
      grade: gradeMatch.key,
      category: catKey,
      id: base.id,
      seed: decodeId(base.id)
    };
  }

  /* ── validate: guards the slug-collision rule documented in seo-keywords.json
   *   (see "_grades_comment"). The parseSlugWith tie-break assumes that whenever
   *   two grade keys share a slug, at least one of them has key === some activity
   *   key. If someone later adds e.g. grades.beginner = {slug:"for-kids"} without
   *   matching an activity, share URLs would silently open the wrong worksheet.
   *   This runs once per load and logs a loud console warning — cheap early
   *   detection so the misconfig never reaches production silently. ── */
  function validateKeywords(kw) {
    if (!kw || !kw.grades || !kw.activities) return;
    const actKeys = new Set(Object.keys(kw.activities).filter(k => !k.startsWith('_')));
    // KNOWN-SAFE collisions (approved by the current design): each key here shares
    // its grade slug with the other two AND has key === activity key, so the
    // parseSlugWith tie-break can always resolve correctly. If you ADD a new grade
    // to this slug, add its key here too — and make sure it matches an activity.
    const ALLOWED_TIE = { 'for-kids': new Set(['colouring', 'sudoku', 'maze']) };
    const bySlug = {};
    for (const [k, v] of Object.entries(kw.grades)) {
      if (k.startsWith('_') || !v || !v.slug) continue;
      (bySlug[v.slug] = bySlug[v.slug] || []).push(k);
    }
    for (const [slug, keys] of Object.entries(bySlug)) {
      if (keys.length < 2) continue;
      const allowed = ALLOWED_TIE[slug];
      const isApproved = allowed && keys.every(k => allowed.has(k));
      const rescuable = keys.every(k => actKeys.has(k));
      if (!isApproved || !rescuable) {
        console.warn('[WSeo] slug-collision risk: grade slug "' + slug + '" is shared by keys [' + keys.join(', ') + ']. Share URLs using this slug can silently resolve to the wrong worksheet. Either give each grade a unique slug, or (if intentional) ensure every tied key has key === an activity key AND add it to ALLOWED_TIE in assets/worksheet-seo.js. See _grades_comment in seo-keywords.json.');
      }
    }
  }

  /* ── keywords.json loader (cached) ── */
  let _kwCache = null;
  let _kwPromise = null;
  function loadKeywords() {
    if (_kwCache) return Promise.resolve(_kwCache);
    if (_kwPromise) return _kwPromise;
    // Absolute path — the data files live in /assets/ (deliberately OUTSIDE
    // /worksheets/, so the /worksheets/* slug rewrite can never swallow them).
    const url = '/assets/seo-keywords.json';
    _kwPromise = fetch(url + '?v=' + Date.now())
      .then(r => r.json())
      .then(j => { _kwCache = j; try { validateKeywords(j); } catch (e) {} return j; })
      .catch(() => null);
    return _kwPromise;
  }

  /* ── pick from array using seed (deterministic) ── */
  function pickFrom(arr, seed, salt = 0) {
    if (!arr || !arr.length) return null;
    const rnd = mulberry32(seed + salt);
    return arr[Math.floor(rnd() * arr.length)];
  }

  /* ── template interpolation ── */
  function fill(template, vars) {
    return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] != null ? vars[k] : '');
  }

  function buildVars(config, kw) {
    const g = kw.grades[config.grade] || kw.grades['1'];
    const a = kw.activities[config.activity] || kw.activities['mix'];
    const c = kw.categories[config.category] || kw.categories['mix'];
    const seed = decodeId(config.id);
    return {
      activity: pickFrom(a.names, seed, 1),
      grade:    pickFrom(g.names, seed, 2),
      category: pickFrom(c.names, seed, 3),
      ages:     g.ages || ''
    };
  }

  // When category is 'mix', filter out templates that mention {category} —
  // otherwise the title would falsely claim a single theme the sheet doesn't have.
  function honestTemplates(templates, isMixed) {
    if (!isMixed) return templates;
    const clean = templates.filter(t => !t.includes('{category}'));
    return clean.length ? clean : templates;
  }

  function renderTitle(config, kw) {
    const vars = buildVars(config, kw);
    const tpls = honestTemplates(kw.title_templates, config.category === 'mix');
    const tpl = pickFrom(tpls, decodeId(config.id), 4);
    return fill(tpl, vars);
  }

  function renderDesc(config, kw) {
    const vars = buildVars(config, kw);
    const tpls = honestTemplates(kw.description_templates, config.category === 'mix');
    const tpl = pickFrom(tpls, decodeId(config.id), 5);
    return fill(tpl, vars);
  }

  function renderH1(config, kw) {
    const vars = buildVars(config, kw);
    const tpls = honestTemplates(kw.h1_templates, config.category === 'mix');
    const tpl = pickFrom(tpls, decodeId(config.id), 6);
    return fill(tpl, vars);
  }

  function renderBody(config, kw) {
    const vars = buildVars(config, kw);
    const tpls = honestTemplates(kw.body_intros, config.category === 'mix');
    const tpl = pickFrom(tpls, decodeId(config.id), 7);
    return fill(tpl, vars);
  }

  /* ── expose ── */
  window.WSeo = {
    mulberry32,
    seedFromString,
    newSeed,
    encodeId,
    decodeId,
    buildSlug,
    parseSlug,
    parseSlugWith,
    loadKeywords,
    renderTitle,
    renderDesc,
    renderH1,
    renderBody
  };
})();
