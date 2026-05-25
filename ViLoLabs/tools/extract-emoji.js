/*
 * extract-emoji.js  —  ViLoLabs worksheet library
 * --------------------------------------------------------------
 * Copies the matching Microsoft Fluent "Color" SVG for every clipart
 * library entry into  assets/emoji/<category>/<name>.svg
 *
 * Matching order:  alias -> folder/cldr/tts name -> keyword ->
 *                  singular form. Uses each emoji's metadata.json.
 *
 * RUN:  node tools/extract-emoji.js
 * --------------------------------------------------------------
 */
const fs   = require('fs');
const path = require('path');

const SRC  = path.join(__dirname, '..', '..', 'Resources', 'Image creation', 'emoji',
                       'fluentui-emoji-main', 'fluentui-emoji-main', 'assets');
const LIB  = path.join(__dirname, '..', 'Website HTML', 'assets', 'library');
const DEST = path.join(__dirname, '..', 'Website HTML', 'assets', 'emoji');

if (!fs.existsSync(SRC)) {
  console.log('Fluent emoji source not found — skipping (emoji already in project).');
  process.exit(0);
}

const norm = s => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const sing = s => s.replace(/ies$/, 'y').replace(/s$/, '');   // simple singular

// hand aliases: our library name -> exact Fluent folder name
const ALIAS = {
  'apple':'Red apple', 'orange':'Tangerine', 'car':'Automobile', 'bee':'Honeybee',
  'moon':'Crescent moon', 'milk':'Glass of milk', 'tea':'Teacup without handle',
  'cake':'Birthday cake', 'cookies':'Cookie', 'biscuits':'Cookie',
  'cherry':'Cherries', 'hen':'Rooster', 'bluebird':'Bird', 'duckling':'Duck',
  'chick':'Baby chick', 'highland-cow':'Cow', 'leaf':'Fallen leaf',
  'tree':'Deciduous tree', 'pine-tree':'Evergreen tree', 'flower':'Blossom',
  'football':'Soccer ball', 'boat':'Sailboat', 'spaceship':'Rocket',
  'ufo':'Flying saucer', 'corn':'Ear of corn', 'school-bus':'Bus',
  'ice-cube':'Ice', 'sea-turtle':'Turtle', 'globe':'Globe showing europe-africa',
  'traffic-light':'Vertical traffic light', 'queen':'Princess', 'king':'Prince',
};

// NO-MATCH list: items that the keyword/fuzzy matcher used to mis-map to a
// completely wrong emoji (because Fluent's metadata.keywords array poisoned
// our index — e.g. "pirate" matched parrot because parrots are pirate-coded).
// These items become PNG-only — they get NO emoji file copied at all.
//
// Add a name here ONLY when:
//   1. There is no Fluent emoji for the concept, AND
//   2. The auto-matcher kept picking a wrong-but-tangentially-related emoji.
//
// You can verify a bad match by running: node tools/audit-emoji-dupes.js
// — anything cross-category and unrelated is a candidate.
const NEGATIVE = new Set([
  'pirate',           // got parrot (Fluent has no pirate emoji)
  'mask',             // got doctor (medical mask emoji is a separate concept)
  'fire-hose',        // got plain fire (no fire-hose in Fluent)
  'dog-house',        // got plain house
  'rocking-horse',    // got plain horse
  'dinosaur-egg',     // got chicken egg
  'bunting-flags',    // got single flag (these are multi-flag strings)
  'cricket-bat',      // got baseball bat
  'octopus-toy',      // got teddy-bear
  'rabbit-toy',       // got teddy-bear
  'robot-toy',        // got teddy-bear
  'bouncy-ball',      // got beach-ball (wrong concept)
  'birds-nest',       // got bluebird
  'sun-hat',          // got winter-hat (or vice versa — they conflict)
  'spray-can',        // got watering-can (or vice versa)
  'gift-box',         // got plain box (Fluent gift wrap is too holiday-specific)
  'bow-tie',          // got rope
  'iron',             // got waffle (Fluent has no household iron emoji)
]);

// build indexes from every emoji folder's metadata
const primary = {};   // folder / cldr / tts  -> folder
const keyword = {};   // keyword              -> folder (first wins)
for (const folder of fs.readdirSync(SRC)) {
  const dir = path.join(SRC, folder);
  if (!fs.statSync(dir).isDirectory()) continue;
  primary[norm(folder)] = folder;
  let meta = {};
  try { meta = JSON.parse(fs.readFileSync(path.join(dir, 'metadata.json'), 'utf8')); }
  catch (e) {}
  if (meta.cldr) primary[norm(meta.cldr)] = primary[norm(meta.cldr)] || folder;
  if (meta.tts)  primary[norm(meta.tts)]  = primary[norm(meta.tts)]  || folder;
  (meta.keywords || []).forEach(k => {
    const n = norm(k);
    if (!keyword[n]) keyword[n] = folder;
  });
}

function findFolder(name) {
  const n = norm(name);
  if (ALIAS[name] && fs.existsSync(path.join(SRC, ALIAS[name]))) return ALIAS[name];
  let f = primary[n] || keyword[n] || primary[sing(n)] || keyword[sing(n)];
  if (f) return f;
  // fallback: for compound names try each word (last word first)
  if (name.includes('-')) {
    const parts = name.split('-');
    for (const w of [parts[parts.length-1], parts[0]]) {
      const wn = norm(w);
      f = primary[wn] || keyword[wn] || primary[sing(wn)] || keyword[sing(wn)];
      if (f) return f;
    }
  }
  return null;
}
// people/profession emoji store SVGs under <folder>/Default/Color/
function colorSvg(folder) {
  for (const sub of ['Color', 'Default/Color']) {
    const cdir = path.join(SRC, folder, sub);
    if (fs.existsSync(cdir)) {
      const svg = fs.readdirSync(cdir).find(f => f.endsWith('.svg'));
      if (svg) return path.join(cdir, svg);
    }
  }
  return null;
}

// Build into a temp dir, then swap — so a mid-run failure (e.g. a
// locked file) can never destroy assets/emoji/ with nothing to replace it.
const TMP = DEST + '.tmp';
if (fs.existsSync(TMP)) fs.rmSync(TMP, { recursive: true });

let copied = 0; const missing = [];
for (const cat of fs.readdirSync(LIB)) {
  const catDir = path.join(LIB, cat);
  if (!fs.statSync(catDir).isDirectory()) continue;
  const md = path.join(catDir, '_images.md');
  if (!fs.existsSync(md)) continue;

  const names = [...fs.readFileSync(md, 'utf8').matchAll(/^##\s+(\S+)/gm)]
                  .map(m => m[1].replace(/\.png$/, ''));
  for (const name of names) {
    if (NEGATIVE.has(name)) { missing.push(cat + '/' + name + ' (NEGATIVE list)'); continue; }
    const folder = findFolder(name);
    const src = folder && colorSvg(folder);
    if (!src) { missing.push(cat + '/' + name); continue; }
    const outDir = path.join(TMP, cat);
    fs.mkdirSync(outDir, { recursive: true });
    fs.copyFileSync(src, path.join(outDir, name + '.svg'));
    copied++;
  }
}

// ── Duplicate-content guard ─────────────────────────────────────
// If two clipart items point at the SAME emoji SVG (byte-identical), one of
// them is almost certainly a wrong match. Some legitimate synonyms are OK
// (cow/highland-cow, duck/duckling), so we only WARN here — adding the bad
// match to NEGATIVE above is the proper fix.
const crypto = require('crypto');
const hashIndex = {};
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.svg')) {
      const h = crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex');
      const rel = path.relative(TMP, p).split(path.sep).join('/').replace(/\.svg$/, '');
      (hashIndex[h] = hashIndex[h] || []).push(rel);
    }
  }
})(TMP);
const dups = Object.values(hashIndex).filter(arr => arr.length > 1);
if (dups.length) {
  console.warn('\n⚠  Duplicate-content emoji detected (possible wrong match):');
  dups.forEach(g => console.warn('   ' + g.join(' === ')));
  console.warn('   Review with: node tools/audit-emoji-dupes.js');
  console.warn('   Fix by adding the bad name to NEGATIVE in tools/extract-emoji.js\n');
}

// Count SVGs in a folder tree (recursively).
function countSvg(dir) {
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) n += countSvg(p);
    else if (e.name.endsWith('.svg')) n++;
  }
  return n;
}

// Regression guard — never let a rebuild silently shrink the asset set.
// If the fresh build has noticeably fewer emoji than what's already on
// disk, something went wrong (bad match, missing source) — keep the old
// folder untouched and bail loudly instead of swapping in the loss.
const oldCount = countSvg(DEST);
const newCount = countSvg(TMP);
if (oldCount > 0 && newCount < oldCount * 0.9) {
  fs.rmSync(TMP, { recursive: true });
  console.error('\nREGRESSION GUARD: new build has ' + newCount + ' emoji but '
    + 'assets/emoji/ already has ' + oldCount + '.');
  console.error('Refusing to swap — existing assets kept untouched. '
    + 'Check the Fluent emoji source and _images.md, then re-run.');
  process.exit(1);
}

// All copies succeeded and the count looks sane — swap into place.
// (Generational backups are handled by tools/backup-assets.js, which
//  build-all.js runs before any destructive step.)
if (fs.existsSync(DEST)) fs.rmSync(DEST, { recursive: true });
fs.renameSync(TMP, DEST);

console.log('Emoji SVGs copied : ' + copied + ' / ' + (copied + missing.length));
console.log('No emoji match    : ' + missing.length);
console.log('Destination       : assets/emoji/');
if (missing.length) {
  console.log('\nUnmatched (likely no Fluent emoji exists):');
  console.log('  ' + missing.join(', '));
}
