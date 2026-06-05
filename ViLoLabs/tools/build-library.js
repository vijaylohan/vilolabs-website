/*
 * build-library.js  —  ViLoLabs worksheet generator
 * --------------------------------------------------------------
 * Scans the asset folders and compiles ONE registry file:
 *   Website HTML/assets/library.json
 *
 * The worksheet web page reads ONLY this file. Re-run whenever
 * you add/remove images — it rebuilds from whatever is on disk.
 *
 *   items : clipart library  (assets/library/<cat>/<name>.png)
 *   pages : page assets      (assets/pages/<type>/<name>.jpg|png)
 *
 * Each item carries: tags (DEFAULTS + per-image TAGS), png path,
 * emoji path — whichever exist. Missing ones are null.
 *
 * RUN:  node tools/build-library.js
 * --------------------------------------------------------------
 */
const fs   = require('fs');
const path = require('path');

const ASSETS = path.join(__dirname, '..', 'Website HTML', 'assets');
const LIB    = path.join(ASSETS, 'library');
const EMOJI  = path.join(ASSETS, 'emoji');
const PAGES  = path.join(ASSETS, 'pages');
const OUT    = path.join(ASSETS, 'library.json');

// ─────────────────────────────────────────────────────────────────
// LIBRARY_VERSION — bump ONLY when you intentionally reorganize the
// library in a way that breaks old /worksheets/<slug> URLs (e.g. mass
// rename, mass delete, category restructure). Bumping disables the
// append-only guard for ONE build, then the new order becomes the
// new permanent baseline.
//
// Every worksheet row in Supabase is tagged with the LIBRARY_VERSION
// active when it was generated. Future code can replay old URLs
// against a frozen snapshot of the old library.
//
// HISTORY:
//   1 — public launch baseline (2026-05-29). Clean reset before the
//       vilolabs.in domain goes live. The pre-launch worksheets table was
//       truncated in Supabase (only dev/test rows existed), so the earlier
//       dev versions (old 1–8: initial baseline, symbol renames, NEGATIVE
//       emoji list, typo fixes, plus the large image-library expansion) are
//       collapsed into this single fresh baseline. No public /worksheets/<slug>
//       URLs existed yet, so nothing breaks.
// ─────────────────────────────────────────────────────────────────
const LIBRARY_VERSION = 1;

const prettify = s => s.split(/[-_]/)
  .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

function parseTags(str) {
  const m = {};
  str.split('|').forEach(p => {
    const i = p.indexOf(':');
    if (i > 0) m[p.slice(0, i).trim()] = p.slice(i + 1).trim();
  });
  return m;
}

// parse an _images.md -> { defaults:{}, entries:[{name,tags}] }
function parseMd(file) {
  let defaults = {};
  const entries = [];
  let cur = null;
  for (const l of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (l.startsWith('DEFAULTS:')) defaults = parseTags(l.slice(9));
    const h = l.match(/^##\s+(\S+)/);
    if (h) { if (cur) entries.push(cur); cur = { name: h[1].replace(/\.png$/, ''), tags: {} }; continue; }
    if (cur && l.startsWith('TAGS:')) cur.tags = parseTags(l.slice(5));
  }
  if (cur) entries.push(cur);
  return { defaults, entries };
}

// ---------- clipart library ----------
const items = [];
for (const cat of fs.readdirSync(LIB)) {
  const catDir = path.join(LIB, cat);
  if (!fs.statSync(catDir).isDirectory()) continue;

  const mdFile = path.join(catDir, '_images.md');
  const md = fs.existsSync(mdFile) ? parseMd(mdFile) : { defaults: {}, entries: [] };
  const byName = {};
  md.entries.forEach(e => byName[e.name] = e);

  const diskNames = new Set(
    fs.readdirSync(catDir).filter(f => f.endsWith('.png')).map(f => f.slice(0, -4)));

  // union of catalog entries + files actually on disk (disk-only = auto-picked)
  const allNames = new Set([...md.entries.map(e => e.name), ...diskNames]);

  for (const name of allNames) {
    const e = byName[name];
    const tags = Object.assign({}, md.defaults, e ? e.tags : {});
    const hasPng   = diskNames.has(name);
    const hasEmoji = fs.existsSync(path.join(EMOJI, cat, name + '.svg'));
    items.push({
      id: cat + '/' + name,
      category: cat,
      name,
      label: prettify(name),
      tags,
      png:   hasPng   ? `assets/library/${cat}/${name}.png` : null,
      emoji: hasEmoji ? `assets/emoji/${cat}/${name}.svg`   : null,
      inCatalog: !!e,
    });
  }
}

// ---------- page assets ----------
const pages = [];
if (fs.existsSync(PAGES)) {
  for (const type of fs.readdirSync(PAGES)) {
    const tDir = path.join(PAGES, type);
    if (!fs.statSync(tDir).isDirectory()) continue;

    const mdFile = path.join(tDir, '_images.md');
    const md = fs.existsSync(mdFile) ? parseMd(mdFile) : { defaults: {}, entries: [] };

    const fileByBase = {};
    fs.readdirSync(tDir).filter(f => /\.(png|jpe?g)$/i.test(f))
      .forEach(f => { fileByBase[f.replace(/\.(png|jpe?g)$/i, '')] = f; });

    const seen = new Set();
    for (const e of md.entries) {
      seen.add(e.name);
      const file = fileByBase[e.name];
      pages.push({
        id: type + '/' + e.name,
        type, name: e.name, label: prettify(e.name),
        tags: Object.assign({}, md.defaults, e.tags),
        file: file ? `assets/pages/${type}/${file}` : null,
        inCatalog: true,
      });
    }
    // files on disk not listed in the .md (auto-picked)
    for (const base in fileByBase) {
      if (seen.has(base)) continue;
      pages.push({
        id: type + '/' + base,
        type, name: base, label: prettify(base),
        tags: Object.assign({}, md.defaults),
        file: `assets/pages/${type}/${fileByBase[base]}`,
        inCatalog: false,
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────────
// Append-only guard
// ─────────────────────────────────────────────────────────────────
// Worksheet URLs encode a seed that picks items by INDEX from these
// arrays. If an existing item's index shifts, every old /worksheets/
// <slug> URL that landed on that index now renders different content.
//
// Rule: existing items must keep their index. New items append.
// Removals/reorders → abort, force the human to bump LIBRARY_VERSION.
//
// Skipped on:
//   - first build (no previous library.json)
//   - LIBRARY_VERSION bumped (operator opted into reorganize)
let prev = null;
if (fs.existsSync(OUT)) {
  try { prev = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch {}
}
const prevVer = prev && prev.libraryVersion;
const versionBumped = prev && prevVer != null && prevVer !== LIBRARY_VERSION;

function enforceAppendOnly(newList, prevList, label) {
  if (!prevList || !prevList.length) return newList;
  const prevIdx = new Map();
  prevList.forEach((it, i) => prevIdx.set(it.id, i));

  const newIds = new Set(newList.map(it => it.id));
  const removed = prevList.filter(it => !newIds.has(it.id));
  if (removed.length) {
    console.error('\n  BUILD ABORTED — ' + label + ': ' + removed.length + ' item(s) removed:');
    removed.slice(0, 8).forEach(it => console.error('    - ' + it.id));
    if (removed.length > 8) console.error('    ... and ' + (removed.length - 8) + ' more');
    console.error('\n  Removing items BREAKS existing /worksheets/<slug> URLs that');
    console.error('  picked them. If this is intentional, bump LIBRARY_VERSION at the');
    console.error('  top of tools/build-library.js (current: ' + LIBRARY_VERSION + ').');
    process.exit(1);
  }

  // Existing items first (in their previous order), new items appended
  const kept = [], fresh = [];
  newList.forEach(it => prevIdx.has(it.id) ? kept.push(it) : fresh.push(it));
  kept.sort((a, b) => prevIdx.get(a.id) - prevIdx.get(b.id));
  return kept.concat(fresh);
}

let finalItems = items, finalPages = pages;
if (prev && !versionBumped) {
  finalItems = enforceAppendOnly(items, prev.items, 'items');
  finalPages = enforceAppendOnly(pages, prev.pages, 'pages');
} else if (versionBumped) {
  console.log('  LIBRARY_VERSION bumped (' + prevVer + ' → ' + LIBRARY_VERSION + ')');
  console.log('  append-only guard SKIPPED for this build (intentional reorganize)');
}

// ---------- maze narrative pairs ----------
// Validates tools/maze-pairs.json against the final items list, drops
// broken pairs with a warning, and emits the validated set to
// library.json as `mazePairs`. sheets.html reads it from there —
// no hardcoded list in the rendering layer.
const PAIRS_FILE = path.join(__dirname, 'maze-pairs.json');
let validPairs = [];
if (fs.existsSync(PAIRS_FILE)) {
  const cfg = JSON.parse(fs.readFileSync(PAIRS_FILE, 'utf8'));
  const itemByName = {};
  finalItems.forEach(it => { if (it && it.name) itemByName[it.name] = it; });
  const broken = [];
  (cfg.pairs || []).forEach(([s, g]) => {
    const sItem = itemByName[s], gItem = itemByName[g];
    if (!sItem || !gItem) { broken.push([s, g, sItem?'':'seeker-missing', gItem?'':'goal-missing']); return; }
    validPairs.push([s, g]);
  });
  if (broken.length) {
    console.warn('\n⚠  maze-pairs.json: ' + broken.length + ' broken pair(s) dropped:');
    broken.forEach(b => console.warn('   ✗ ' + b[0] + ' → ' + b[1] + '   (' + b[2] + ' ' + b[3] + ')'));
    console.warn('   Either add the missing item to /assets/library/, or remove the pair from tools/maze-pairs.json\n');
  }
} else {
  console.warn('  tools/maze-pairs.json not found — library.json will have no mazePairs.');
}

// ---------- write registry ----------
const registry = {
  generated: new Date().toISOString(),
  libraryVersion: LIBRARY_VERSION,
  counts: {
    items:          finalItems.length,
    itemsWithPng:   finalItems.filter(i => i.png).length,
    itemsWithEmoji: finalItems.filter(i => i.emoji).length,
    itemsRenderable:finalItems.filter(i => i.png || i.emoji).length,
    pages:          finalPages.length,
    pagesWithFile:  finalPages.filter(p => p.file).length,
    mazePairs:      validPairs.length,
  },
  items: finalItems,
  pages: finalPages,
  mazePairs: validPairs,
};
fs.writeFileSync(OUT, JSON.stringify(registry));

const c = registry.counts;
console.log('Built assets/library.json');
console.log('  clipart items   : ' + c.items +
            '  (png ' + c.itemsWithPng + ' · emoji ' + c.itemsWithEmoji +
            ' · renderable ' + c.itemsRenderable + ')');
console.log('  page assets     : ' + c.pages + '  (file present ' + c.pagesWithFile + ')');
console.log('  file size       : ' + (fs.statSync(OUT).size / 1024).toFixed(1) + ' KB');
