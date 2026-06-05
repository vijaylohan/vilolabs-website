// Remove white/light-grey backgrounds from OG icon PNGs.
// Restores from assets/og/icons/_originals/ each run, then re-cleans.
// Pixels above luma threshold AND low saturation become transparent.
// A feather band gives a soft edge to avoid hard halos.
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const DIR = path.join(__dirname, '..', 'Website HTML', 'assets', 'og', 'icons');
const BACKUP = path.join(DIR, '_originals');

const TARGETS = [
  'worksheets.png','tools.png','image-to-pdf.png','merge-pdf.png',
  'resize-image.png','compress-image.png','compress-pdf.png','qr-generator.png'
];

// Stronger thresholds — must clear faint grey, but preserve light gold pixels.
// Gold (E8BC72) avg luma ≈ 175, saturation ≈ 118 → well below FULL_BG_MIN with high sat.
const FULL_BG_MIN = 215;  // ≥ this avg luma + low sat → fully transparent
const SOFT_BG_MIN = 195;  // SOFT..FULL → feather (partial alpha)
const SAT_MAX = 22;       // greyness threshold

function clean(file) {
  const inPath = path.join(DIR, file);
  const bak = path.join(BACKUP, file);
  if (!fs.existsSync(bak)) return { file, status: 'no-backup' };
  // restore original, then clean fresh
  fs.copyFileSync(bak, inPath);

  const png = PNG.sync.read(fs.readFileSync(inPath));
  const { data } = png;
  let cleared = 0, feathered = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2];
    const luma = (r + g + b) / 3;
    const sat = Math.max(r,g,b) - Math.min(r,g,b);

    if (luma >= FULL_BG_MIN && sat <= SAT_MAX) {
      data[i+3] = 0; cleared++;
    } else if (luma >= SOFT_BG_MIN && sat <= SAT_MAX) {
      const t = (luma - SOFT_BG_MIN) / (FULL_BG_MIN - SOFT_BG_MIN);
      const newAlpha = Math.round(data[i+3] * (1 - t));
      if (newAlpha < data[i+3]) { data[i+3] = newAlpha; feathered++; }
    }
  }

  fs.writeFileSync(inPath, PNG.sync.write(png));
  return { file, cleared, feathered };
}

console.log('Restoring originals and stripping backgrounds...\n');
TARGETS.forEach(f => {
  const r = clean(f);
  if (r.status === 'no-backup') console.log('  SKIP ' + f + ' (no backup)');
  else console.log('  ✓ ' + r.file.padEnd(22) + ' cleared=' + r.cleared.toString().padStart(7) + '  feathered=' + r.feathered.toString().padStart(6));
});
console.log('\nDone. Originals preserved in: ' + BACKUP);
