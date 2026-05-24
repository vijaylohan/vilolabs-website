/*
 * split-phases.js  —  ViLoLabs worksheet image library
 * --------------------------------------------------------------
 * Rewrites every category's _images.md, splitting the image list
 * into PHASE 1 (create now ~50%) and PHASE 2 (create later ~50%).
 *
 * - Entries already DONE (marked, or a .png exists on disk) are
 *   detected and always placed in PHASE 1.
 * - PHASE 1 is filled to ~50% of the total with not-done entries.
 * - Goal: create only half the images now — enough to build and
 *   test the worksheet logic — and finish the rest later.
 *
 * RUN:  node tools/split-phases.js
 * --------------------------------------------------------------
 */
const fs   = require('fs');
const path = require('path');

const LIB = path.join(__dirname, '..', 'Website HTML', 'assets', 'library');
const SEP = '============================================================';

function parse(file, catDir) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  // header = everything before the first "## "
  const firstIdx = lines.findIndex(l => /^##\s+/.test(l));
  const titleLine = lines.find(l => /^#\s+/.test(l)) || '# Image List';
  const specLines = [];
  for (const l of lines.slice(0, firstIdx)) {
    if (/^SPEC:/.test(l) || /^See /.test(l)) specLines.push(l);
  }

  const entries = [];
  let cur = null;
  for (let i = firstIdx; i < lines.length; i++) {
    const l = lines[i];
    const m = l.match(/^##\s+(\S+)/);
    if (m) {
      if (cur) entries.push(cur);
      cur = { name: m[1], body: [] };
      continue;
    }
    if (!cur) continue;
    if (l.startsWith(SEP) || /^(TO CREATE|PHASE \d|DONE)\b/.test(l.trim())) continue;
    if (l.trim() === '') continue;
    cur.body.push(l);
  }
  if (cur) entries.push(cur);

  // detect done
  for (const e of entries) {
    e.done = fs.existsSync(path.join(catDir, e.name));
  }
  return { titleLine, specLines, entries };
}

function emit(entry) {
  const head = '## ' + entry.name + (entry.done ? '   ✅ DONE' : '');
  return head + '\n' + entry.body.join('\n');
}

function rewrite(file, catDir) {
  const { titleLine, specLines, entries } = parse(file, catDir);
  const total = entries.length;

  // done entries first, then not-done (keep original order within each)
  const done    = entries.filter(e => e.done);
  const notDone = entries.filter(e => !e.done);

  const p1Target = Math.ceil(total / 2);
  const phase1 = [...done];
  while (phase1.length < p1Target && notDone.length) phase1.push(notDone.shift());
  const phase2 = notDone;

  const out = [];
  out.push(titleLine.replace(/\(\d+\)/, `(${total})`));
  out.push('');
  specLines.forEach(l => out.push(l));
  out.push(`Status: ${done.length} done · PHASE 1: ${phase1.length} images (create now) · PHASE 2: ${phase2.length} images (create later).`);
  out.push('');
  out.push(SEP);
  out.push(`PHASE 1 — CREATE NOW (${phase1.length})`);
  out.push(SEP);
  out.push('Create these first — enough data to build and test the worksheet logic.');
  out.push('');
  phase1.forEach(e => { out.push(emit(e)); out.push(''); });
  out.push(SEP);
  out.push(`PHASE 2 — CREATE LATER (${phase2.length})`);
  out.push(SEP);
  out.push('');
  phase2.forEach(e => { out.push(emit(e)); out.push(''); });

  fs.writeFileSync(file, out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n');
  return { cat: path.basename(catDir), total, done: done.length, p1: phase1.length, p2: phase2.length };
}

let rows = [];
for (const cat of fs.readdirSync(LIB)) {
  const catDir = path.join(LIB, cat);
  if (!fs.statSync(catDir).isDirectory()) continue;
  const file = path.join(catDir, '_images.md');
  if (!fs.existsSync(file)) continue;
  rows.push(rewrite(file, catDir));
}

console.log('category        total  done  PHASE-1(now)  PHASE-2(later)');
console.log('-------------------------------------------------------------');
let t = 0, p1 = 0, p2 = 0;
for (const r of rows) {
  console.log(r.cat.padEnd(15) + String(r.total).padEnd(7) + String(r.done).padEnd(6) + String(r.p1).padEnd(14) + r.p2);
  t += r.total; p1 += r.p1; p2 += r.p2;
}
console.log('-------------------------------------------------------------');
console.log('TOTAL'.padEnd(15) + String(t).padEnd(7) + ' '.padEnd(6) + String(p1).padEnd(14) + p2);
