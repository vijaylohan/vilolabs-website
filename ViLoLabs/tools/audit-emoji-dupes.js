/*  Audit emoji folder for duplicate-content SVGs.
 *  Two clipart items pointing at the SAME emoji file = matcher bug.
 *  Run:  node tools/audit-emoji-dupes.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..', 'Website HTML', 'assets', 'emoji');
const hashes = {};

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const s = fs.statSync(p);
    if (s.isDirectory()) walk(p);
    else if (f.endsWith('.svg')) {
      const h = crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex');
      const rel = path.relative(ROOT, p).split(path.sep).join('/');
      (hashes[h] = hashes[h] || []).push(rel);
    }
  }
}

walk(ROOT);

// Legitimate same-emoji synonyms (Fluent has only ONE asset for the concept).
// Audit shouldn't flag these as bugs. Each entry is a set of filenames
// (relative paths) that are expected to share an SVG.
const KNOWN_SYNONYM_GROUPS = [
  ['animals/cow.svg', 'animals/highland-cow.svg'],
  ['birds/duck.svg', 'birds/duckling.svg', 'toys/rubber-duck.svg'],
  ['birds/hen.svg', 'birds/rooster.svg'],
  ['food/biscuits.svg', 'food/cookies.svg'],
  ['instruments/maracas.svg', 'toys/maracas.svg'],
  ['people/princess.svg', 'people/queen.svg'],
  ['people/prince.svg', 'people/king.svg'],
  ['sea-creatures/crab.svg', 'sea-creatures/hermit-crab.svg'],
  ['vehicles/rocket.svg', 'vehicles/spaceship.svg'],
];

function isKnownSynonymGroup(group) {
  const sorted = [...group].sort();
  return KNOWN_SYNONYM_GROUPS.some(known => {
    const ks = [...known].sort();
    if (ks.length !== sorted.length) return false;
    return ks.every((v, i) => v === sorted[i]);
  });
}

const dups = Object.values(hashes).filter(arr => arr.length > 1);
const synonymDups = dups.filter(isKnownSynonymGroup);
const suspectDups = dups.filter(g => !isKnownSynonymGroup(g));

if (synonymDups.length) {
  console.log('Known synonym groups (OK — same Fluent source by design):');
  synonymDups.forEach(g => console.log('  ✓ ' + g.join('  =  ')));
  console.log('');
}
if (suspectDups.length) {
  console.log('⚠ SUSPECT duplicates (likely wrong matches — add to NEGATIVE):');
  suspectDups.forEach(g => console.log('  ✗ ' + g.join('  =  ')));
  console.log('');
  process.exit(1);
} else {
  console.log('✓ No suspect duplicates. Library matches look clean.');
}
