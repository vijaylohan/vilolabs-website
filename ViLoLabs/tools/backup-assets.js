/*
 * backup-assets.js  —  ViLoLabs worksheet library
 * --------------------------------------------------------------
 * Snapshots the deployable asset folders BEFORE any build step can
 * touch them, so a bad build can always be rolled back.
 *
 * Backs up:  Website HTML/assets/library/   (clipart PNGs)
 *            Website HTML/assets/emoji/      (Fluent emoji SVGs)
 *
 * Snapshots go to  ViLoLabs/.asset-backups/<timestamp>/  — outside
 * "Website HTML/", so they are never deployed to Netlify.
 * The newest KEEP generations are kept; older ones are pruned.
 *
 * RUN:  node tools/backup-assets.js
 * --------------------------------------------------------------
 */
const fs   = require('fs');
const path = require('path');

const KEEP    = 5;   // how many snapshot generations to retain
const ASSETS  = path.join(__dirname, '..', 'Website HTML', 'assets');
const SOURCES = ['library', 'emoji'];
const ROOT    = path.join(__dirname, '..', '.asset-backups');

function countFiles(dir) {
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) n += countFiles(path.join(dir, e.name));
    else n++;
  }
  return n;
}

// timestamp like 2026-05-19T14-30-05  (filesystem-safe, sorts chronologically)
const stamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+$/, '');
const dest  = path.join(ROOT, stamp);

fs.mkdirSync(dest, { recursive: true });

let total = 0;
for (const name of SOURCES) {
  const src = path.join(ASSETS, name);
  if (!fs.existsSync(src)) {
    console.log('  (skip ' + name + '/ — not present)');
    continue;
  }
  fs.cpSync(src, path.join(dest, name), { recursive: true });
  const n = countFiles(src);
  total += n;
  console.log('  backed up ' + name + '/  (' + n + ' files)');
}

if (total === 0) {
  fs.rmSync(dest, { recursive: true });
  console.error('Nothing to back up — no asset folders found. Aborting.');
  process.exit(1);
}

// prune old generations, keep the newest KEEP
const gens = fs.readdirSync(ROOT)
  .filter(d => fs.statSync(path.join(ROOT, d)).isDirectory())
  .sort();                                  // chronological (timestamp names)
const stale = gens.slice(0, Math.max(0, gens.length - KEEP));
for (const d of stale) fs.rmSync(path.join(ROOT, d), { recursive: true });

console.log('Snapshot          : .asset-backups/' + stamp + '  (' + total + ' files)');
console.log('Generations kept  : ' + Math.min(gens.length, KEEP) + ' / ' + KEEP);
if (stale.length) console.log('Pruned old        : ' + stale.length);
