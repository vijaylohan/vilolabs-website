/*  ViLoLabs Tools — SEO helper module (mirror of WSeo for worksheets)
 *  ──────────────────────────────────────────────────────────────────
 *  Pure browser module (no build step). Loaded by every tool .html
 *  that supports sharing. Reads tool-seo-keywords.json once, then:
 *
 *    matchPreset(tool, config)       → preset key or null
 *    buildToolSlug(tool, presetKey)  → "indian-passport-photo-9x4k2m"
 *    parseToolSlug(slug)             → { presetKey, id }
 *    renderTitle(tool, presetKey)    → "<title> string"
 *    renderDesc / renderH1           → meta + h1
 *    loadKeywords()                  → Promise<JSON> (cached)
 *
 *  Conventions:
 *    - Slug = {preset-slug}-{6-char-base36-id}
 *    - 6-char id = ~2.1B combinations; collision-resistant for our scale
 *    - All keyword/preset lookup is by exact key match (deterministic)
 */
(function () {
  'use strict';

  /* ── 6-char base36 ID (lossless from a 32-bit seed) ── */
  function newId() {
    // 36^6 = 2,176,782,336 — fits in 32 bits comfortably
    const n = Math.floor(Math.random() * 2176782336);
    return n.toString(36).padStart(6, '0');
  }

  /* ── keywords.json loader (cached, cache-busted on reload) ── */
  let _kwCache = null;
  let _kwPromise = null;
  function loadKeywords() {
    if (_kwCache) return Promise.resolve(_kwCache);
    if (_kwPromise) return _kwPromise;
    // Resolve URL relative to this script — works whether host page is
    // /tools/<name>.html or /tools/<name>/<slug>
    const url = (location.pathname.includes('/tools/'))
      ? '/tools/tool-seo-keywords.json'
      : 'tools/tool-seo-keywords.json';
    _kwPromise = fetch(url + '?v=' + Date.now())
      .then(r => r.json())
      .then(j => { _kwCache = j; return j; })
      .catch(() => null);
    return _kwPromise;
  }

  /* ── Preset matcher ──
   * Returns the preset KEY when all keys in preset.match equal those in config.
   * Returns null if nothing matches (caller uses tool.fallback then).
   */
  // Keys starting with `_` are metadata/grouping markers in the JSON, not real presets.
  function _realPresetEntries(presets) {
    return Object.entries(presets || {}).filter(([k, v]) => !k.startsWith('_') && v && v.match);
  }

  function matchPreset(toolKey, config, kw) {
    if (!kw || !kw.tools || !kw.tools[toolKey]) return null;
    for (const [key, p] of _realPresetEntries(kw.tools[toolKey].presets)) {
      const m = p.match;
      let ok = true;
      for (const k of Object.keys(m)) {
        if (config[k] !== m[k]) { ok = false; break; }
      }
      if (ok) return key;
    }
    return null;
  }

  /* ── Slug build / parse ──
   * opts.unique = true  → append a 6-char ID (use for tools with unique
   *                       per-share payload like QR codes)
   * opts.unique = false → canonical preset URL (use for resize/compress
   *                       presets where multiple users hit the same config)
   */
  function buildToolSlug(toolKey, presetKey, kw, opts) {
    const tool = kw && kw.tools && kw.tools[toolKey];
    const isReal = tool && tool.presets && tool.presets[presetKey]
      && !presetKey.startsWith('_') && tool.presets[presetKey].match;
    const slugBase = isReal ? presetKey
      : (tool && tool.fallback && tool.fallback.slug) || 'custom';
    if (opts && opts.unique) return slugBase + '-' + newId();
    return slugBase;
  }

  // Returns { presetKey, id } where id may be null (canonical slug).
  // Tries exact match first (canonical), then strips trailing 4-7 char id (unique).
  function parseToolSlug(toolKey, slug, kw) {
    if (!slug) return null;
    const tool = kw && kw.tools && kw.tools[toolKey];
    if (!tool) return null;
    const presetKeys = _realPresetEntries(tool.presets).map(([k]) => k)
      .concat(tool.fallback ? [tool.fallback.slug] : [])
      .sort((a, b) => b.length - a.length);

    // 1. Canonical match — slug is exactly a preset key
    for (const key of presetKeys) {
      if (slug === key) return { presetKey: key, id: null };
    }
    // 2. Unique match — slug = presetKey + '-' + id  (id is 4-7 lowercase alphanum)
    const m = slug.match(/^(.+)-([a-z0-9]{4,7})$/);
    if (m) {
      const candidate = m[1];
      for (const key of presetKeys) {
        if (candidate === key) return { presetKey: key, id: m[2] };
      }
      // Unknown preset — treat as fallback with the parsed id
      return { presetKey: (tool.fallback && tool.fallback.slug) || null, id: m[2] };
    }
    return null;
  }

  /* ── Deterministic pick from array using id as seed ── */
  function pickFrom(arr, idStr, salt) {
    if (!arr || !arr.length) return null;
    let h = 0;
    const s = idStr + (salt || '');
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    }
    return arr[Math.abs(h) % arr.length];
  }

  function fill(template, vars) {
    return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] != null ? vars[k] : '');
  }

  function presetName(toolKey, presetKey, kw) {
    const tool = kw && kw.tools && kw.tools[toolKey];
    if (!tool) return '';
    const p = tool.presets && tool.presets[presetKey];
    if (p && p.names && p.names.length) return p.names[0];
    if (tool.fallback) return tool.fallback.name;
    return tool.displayName || '';
  }

  function renderTitle(toolKey, presetKey, id, kw) {
    const tool = kw && kw.tools && kw.tools[toolKey];
    if (!tool) return 'ViLoLabs';
    const tpl = pickFrom(tool.title_templates || ['{preset}'], id || presetKey || '', 't');
    return fill(tpl, { preset: presetName(toolKey, presetKey, kw) });
  }

  function renderDesc(toolKey, presetKey, id, kw) {
    const tool = kw && kw.tools && kw.tools[toolKey];
    if (!tool) return '';
    const tpl = pickFrom(tool.description_templates || ['{preset}'], id || presetKey || '', 'd');
    return fill(tpl, { preset: presetName(toolKey, presetKey, kw) });
  }

  function renderH1(toolKey, presetKey, id, kw) {
    const tool = kw && kw.tools && kw.tools[toolKey];
    if (!tool) return '';
    const tpl = pickFrom(tool.h1_templates || ['{preset}'], id || presetKey || '', 'h');
    return fill(tpl, { preset: presetName(toolKey, presetKey, kw) });
  }

  /* ── Expose ── */
  window.TSeo = {
    newId,
    loadKeywords,
    matchPreset,
    buildToolSlug,
    parseToolSlug,
    presetName,
    renderTitle,
    renderDesc,
    renderH1
  };
})();
