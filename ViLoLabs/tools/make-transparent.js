/*
 * make-transparent.js  —  ViLoLabs worksheet image tool
 * --------------------------------------------------------------
 * Batch-removes the white background from every clipart image in
 * assets/library/ and saves it as a transparent PNG.
 *
 * How it works: a flood-fill starts from the 4 image borders and
 * clears every near-white pixel CONNECTED to the edge. White areas
 * INSIDE the subject (belly, eyes) are kept, because the bold black
 * outline blocks the fill from reaching them.
 *
 * - Handles .png AND .jpg/.jpeg input. Output is always .png.
 * - Originals are backed up to  library-originals-backup/  first
 *   (nothing is ever deleted).
 *
 * RUN:  node tools/make-transparent.js
 * --------------------------------------------------------------
 */
const fs   = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const jpeg = require('jpeg-js');

const LIB    = path.join(__dirname, '..', 'Website HTML', 'assets', 'library');
const BACKUP = path.join(__dirname, '..', '..', 'Resources', 'library-originals-backup');
const TOL    = 236;   // R,G,B all >= TOL  => treated as background white

// ---- decode any supported image to {width,height,data:RGBA} ----
function decode(file) {
  const buf = fs.readFileSync(file);
  if (path.extname(file).toLowerCase() === '.png') {
    const p = PNG.sync.read(buf);
    return { width: p.width, height: p.height, data: p.data };
  }
  const j = jpeg.decode(buf, { useTArray: true, formatAsRGBA: true });
  return { width: j.width, height: j.height, data: j.data };
}

// ---- flood-fill transparency from the borders ----
function makeTransparent(img) {
  const { width: w, height: h, data } = img;
  const isBg = (i) => {
    if (data[i + 3] === 0) return true;                       // already clear
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (r >= TOL && g >= TOL && b >= TOL) return true;        // near-white bg
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx - mn < 32 && mx >= 140) return true;               // soft grey ground shadow
    return false;
  };
  const seen  = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) { stack.push(x, 0, x, h - 1); }
  for (let y = 0; y < h; y++) { stack.push(0, y, w - 1, y); }
  let cleared = 0;
  while (stack.length) {
    const y = stack.pop(), x = stack.pop();
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const p = y * w + x;
    if (seen[p]) continue;
    seen[p] = 1;
    const i = p * 4;
    if (!isBg(i)) continue;
    data[i + 3] = 0;
    cleared++;
    stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
  }
  return cleared;
}

// ---- write RGBA buffer as a PNG ----
function writePNG(file, img) {
  const out = new PNG({ width: img.width, height: img.height });
  out.data = Buffer.from(img.data);
  fs.writeFileSync(file, PNG.sync.write(out));
}

// ---- main ----
function run() {
  if (!fs.existsSync(LIB)) { console.error('Library folder not found:', LIB); process.exit(1); }
  let done = 0, skipped = 0, converted = 0;
  const leftoverJpgs = [];

  for (const cat of fs.readdirSync(LIB)) {
    const catDir = path.join(LIB, cat);
    if (!fs.statSync(catDir).isDirectory()) continue;

    for (const fname of fs.readdirSync(catDir)) {
      const ext = path.extname(fname).toLowerCase();
      if (!['.png', '.jpg', '.jpeg'].includes(ext)) continue;
      const src  = path.join(catDir, fname);
      const base = path.basename(fname, ext);
      const dest = path.join(catDir, base + '.png');

      // back up the original once
      const bDir = path.join(BACKUP, cat);
      fs.mkdirSync(bDir, { recursive: true });
      const bFile = path.join(bDir, fname);
      if (!fs.existsSync(bFile)) fs.copyFileSync(src, bFile);

      try {
        const img = decode(src);
        const cleared = makeTransparent(img);
        writePNG(dest, img);
        if (ext !== '.png') { converted++; leftoverJpgs.push(src); }
        if (cleared > 0) done++; else skipped++;
        console.log(`  ${cat}/${base}.png  — ${cleared} px cleared`);
      } catch (e) {
        console.log(`  ! FAILED ${cat}/${fname}: ${e.message}`);
      }
    }
  }

  console.log('\n--------------------------------------------');
  console.log(`Background removed : ${done}`);
  console.log(`Already clean      : ${skipped}`);
  console.log(`JPG -> PNG converted: ${converted}`);
  console.log(`Originals backed up : ${BACKUP}`);
  if (leftoverJpgs.length) {
    console.log('\nThese .jpg files are now replaced by .png — you can delete them:');
    leftoverJpgs.forEach(f => console.log('  ' + f));
  }
  console.log('--------------------------------------------');
}

run();
