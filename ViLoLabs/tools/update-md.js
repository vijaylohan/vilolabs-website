/*
 * update-md.js  —  ViLoLabs worksheet image library
 * --------------------------------------------------------------
 * Scans every category folder, checks which images exist on disk,
 * and rewrites each _images.md into a clean DONE / TO CREATE list.
 *
 * - Entries whose .png exists on disk  -> DONE section (✅ marked)
 * - Entries with no file yet           -> TO CREATE section
 * - Preserves each entry's description, PROMPT and TAGS lines.
 *
 * Run for ALL folders:   node tools/update-md.js
 * Run for one folder:    node tools/update-md.js clothing
 * --------------------------------------------------------------
 */
const fs   = require('fs');
const path = require('path');

const LIB = path.join(__dirname, '..', 'Website HTML', 'assets', 'library');
const SEP = '='.repeat(60);
const only = process.argv[2];   // optional single-folder name

function rewrite(catDir) {
  const file = path.join(catDir, '_images.md');
  if (!fs.existsSync(file)) return null;

  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const titleLine = lines.find(l => /^#\s/.test(l)) || '# Image List';
  const specLines = lines.filter(l => /^SPEC:/.test(l) || /^See /.test(l));

  // parse entries
  const entries = [];
  let cur = null;
  for (const l of lines) {
    const m = l.match(/^##\s+(\S+)/);
    if (m) { if (cur) entries.push(cur); cur = { name: m[1], body: [] }; continue; }
    if (!cur) continue;
    if (l.startsWith(SEP) || /^(TO CREATE|PHASE \d|DONE)\b/.test(l.trim()) || l.trim() === '') continue;
    cur.body.push(l);
  }
  if (cur) entries.push(cur);

  const files   = fs.readdirSync(catDir);
  const done    = entries.filter(e => files.includes(e.name));
  const todo    = entries.filter(e => !files.includes(e.name));

  const out = [];
  out.push(titleLine.replace(/\(\d+\)/, `(${entries.length})`));
  out.push('');
  specLines.forEach(l => out.push(l));
  out.push(`Status: ${done.length} done · ${todo.length} to create.`);
  out.push('');
  out.push(SEP); out.push(`DONE (${done.length})`); out.push(SEP); out.push('');
  done.forEach(e => { out.push('## ' + e.name + '   ✅ DONE'); out.push(e.body.join('\n')); out.push(''); });
  if (todo.length) {
    out.push(SEP); out.push(`TO CREATE (${todo.length})`); out.push(SEP); out.push('');
    todo.forEach(e => { out.push('## ' + e.name); out.push(e.body.join('\n')); out.push(''); });
  }

  fs.writeFileSync(file, out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n');
  return { cat: path.basename(catDir), total: entries.length, done: done.length, todo: todo.length };
}

const rows = [];
for (const cat of fs.readdirSync(LIB)) {
  if (only && cat !== only) continue;
  const catDir = path.join(LIB, cat);
  if (!fs.statSync(catDir).isDirectory()) continue;
  const r = rewrite(catDir);
  if (r) rows.push(r);
}

console.log('category        total  done  to-create');
console.log('-----------------------------------------');
let t = 0, d = 0;
for (const r of rows) {
  const bar = r.done === r.total ? '  ✅' : '';
  console.log(r.cat.padEnd(15) + String(r.total).padEnd(7) + String(r.done).padEnd(6) + r.todo + bar);
  t += r.total; d += r.done;
}
console.log('-----------------------------------------');
console.log('TOTAL'.padEnd(15) + String(t).padEnd(7) + String(d).padEnd(6) + (t - d));
