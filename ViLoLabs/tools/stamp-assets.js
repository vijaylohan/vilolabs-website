#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────────────────────
   ViLoLabs — asset cache-busting stamper
   ----------------------------------------------------------------------------
   WHY: Cloudflare Pages hard-caps .js/.css at max-age=14400 (4h) and _headers
   can't override it. So a pushed JS/CSS fix wouldn't reach returning visitors
   for up to 4h. This stamps a content-hash query (?v=<hash>) on the shared
   script/style references in every HTML file. When a shared file's CONTENT
   changes, its hash changes → the URL changes → browsers fetch it fresh
   immediately. Unchanged files keep their hash → still cached (no waste).

   RUN before deploying whenever a shared JS/CSS file changed:
       node tools/stamp-assets.js
   then commit + push as usual. (Safe to run every time — it's a no-op if
   nothing changed.)
   ────────────────────────────────────────────────────────────────────────── */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..', 'Website HTML');

// Shared assets that are loaded across many pages → basename : file location
const ASSETS = {
  'share.js':         'assets/share.js',
  'share.css':        'assets/share.css',
  'db.js':            'assets/db.js',
  'worksheet-seo.js': 'assets/worksheet-seo.js',
  'tool-seo.js':      'tools/tool-seo.js',
  'shared.css':       'tools/shared.css',
  'blog.css':         'blog/shared/blog.css',
};

function hash(p){
  return crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex').slice(0, 8);
}

// Compute the current content-hash for each shared asset that exists.
const ver = {};
for (const [base, rel] of Object.entries(ASSETS)) {
  const fp = path.join(ROOT, rel);
  if (fs.existsSync(fp)) ver[base] = hash(fp);
}

// Walk all .html files.
const htmlFiles = [];
(function walk(d){
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f), s = fs.statSync(p);
    if (s.isDirectory()) { if (f === 'node_modules') continue; walk(p); }
    else if (f.endsWith('.html')) htmlFiles.push(p);
  }
})(ROOT);

let filesChanged = 0, refsStamped = 0;
for (const p of htmlFiles) {
  let txt = fs.readFileSync(p, 'utf8');
  const before = txt;
  for (const [base, v] of Object.entries(ver)) {
    const esc = base.replace(/\./g, '\\.');
    // Match a reference ending in this basename inside src="" / href="" (abs or
    // relative path), with or without an existing ?v=... → re-stamp to current hash.
    // Lookahead (?=["']) ensures we don't match longer names (e.g. share.json).
    const re = new RegExp('([\\/"\\\'])' + esc + '(\\?v=[0-9a-fA-F]+)?(?=["\\\'])', 'g');
    txt = txt.replace(re, (m, pre) => { refsStamped++; return pre + base + '?v=' + v; });
  }
  if (txt !== before) { fs.writeFileSync(p, txt); filesChanged++; }
}

console.log('Asset versions:', ver);
console.log(`Stamped ${refsStamped} references across ${filesChanged} files (of ${htmlFiles.length} scanned).`);
