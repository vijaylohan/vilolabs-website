#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────────────────
   ViLoLabs — daily Pinterest pin builder
   ──────────────────────────────────────────────────────────────────────
   For a given offset (0=today, 1=tomorrow, …), this:
     1. computes grade + theme + activity from the approved schedule rules
     2. mints a deterministic, self-contained /worksheets/<slug> URL
     3. screenshots that worksheet's page-1 via headless Chrome
     4. wraps it in the Plan-B branded pin chrome (1000×1500)
     5. writes pin.png + caption.txt + meta.json into
           Resources/pinterest-pins/YYYY-MM-DD/

   The pin is NOT posted anywhere — this script only PRODUCES the artefacts.
   The Pinterest API call is a separate step we wire up once Standard
   access is granted.

   Usage:
     node tools/pinterest-build-pin.js          # today
     node tools/pinterest-build-pin.js 1        # tomorrow
     node tools/pinterest-build-pin.js 2 …      # day after, etc.
   ────────────────────────────────────────────────────────────────────── */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

// ── Paths ──────────────────────────────────────────────────────────────
const ROOT      = path.resolve(__dirname, '..', '..');
const RESOURCES = path.join(ROOT, 'Resources', 'pinterest-pins');
const WEBROOT   = path.join(ROOT, 'ViLoLabs', 'Website HTML');
const RENDER_SHEET = path.join(__dirname, 'render-worksheet-png.js');
const CHROME    = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const KW        = require(path.join(WEBROOT, 'assets', 'seo-keywords.json'));

// ── Approved schedule rules ────────────────────────────────────────────
// Mon-Sat = Pre-KG → Class 4 (six grades, one per weekday)
// Sun = real Colouring Page (the standalone "colouring" level, not a grade)
// — Class 5 deliberately dropped from Pinterest rotation (less Pinterest-friendly
//   content; full Class 5 catalogue remains accessible on-site).
const START = new Date('2026-06-13T00:00:00');          // cycle anchor
const WEEKDAY_TO_GRADE = { 1:'prekg', 2:'kg', 3:'1', 4:'2', 5:'3', 6:'4', 0:'colouring' };
const GRADE_LABEL = {
  prekg:'Pre-KG', kg:'KG',
  '1':'Class 1', '2':'Class 2', '3':'Class 3', '4':'Class 4',
  colouring:''   // colouring is age-agnostic — no grade label in headline
};
const LEVEL_TOPICS = {
  prekg:['animals','fruits','insects','nature','toys','clothing','fantasy'],
  kg:   ['animals','fruits','vegetables','insects','nature','vehicles','toys','clothing','body-parts','birds','sea-creatures'],
  '1':  ['animals','fruits','vegetables','vehicles','food','insects','instruments','nature','stationery','birds','sea-creatures','people','plants','dinosaurs','household'],
  '2':  ['animals','food','vehicles','insects','instruments','nature','stationery','sports','plants','dinosaurs','household','tools','buildings','people'],
  '3':  ['animals','food','vehicles','nature','stationery','sports','symbols','tools','buildings','people','household','sea-creatures'],
  '4':  ['food','vehicles','nature','stationery','sports','symbols','tools','buildings','plants','dinosaurs','household'],
  // Colouring uses COL_TOPICS — concrete themes only (we dropped 'all',
  // because a slug without a theme parses as category='mix' which the
  // colouring renderer doesn't recognize → page stalls).
  colouring:['animals','fruits','objects']
};
const THEME_LABEL = {
  animals:'Animals', fruits:'Fruits', vegetables:'Vegetables', vehicles:'Vehicles', food:'Food',
  insects:'Insects', instruments:'Instruments', nature:'Nature', stationery:'Stationery',
  birds:'Birds', 'sea-creatures':'Sea Creatures', people:'People', plants:'Plants',
  dinosaurs:'Dinosaurs', household:'Household', toys:'Toys', clothing:'Clothing',
  fantasy:'Fantasy', 'body-parts':'Body Parts', sports:'Sports', symbols:'Symbols',
  tools:'Tools', buildings:'Buildings',
  // Colouring-only labels:
  all:'Surprise', objects:'Objects'
};

function paramsForDate(date){
  const wd = date.getDay();
  const grade = WEEKDAY_TO_GRADE[wd];
  const pool = [...LEVEL_TOPICS[grade]].sort();
  // Count how many times this grade has appeared since START up to (but not
  // including) `date` — that's the rotation index into the theme pool.
  let appearance = 0;
  const d = new Date(START);
  while (d < date) {
    if (WEEKDAY_TO_GRADE[d.getDay()] === grade) appearance++;
    d.setDate(d.getDate() + 1);
  }
  const theme = pool[appearance % pool.length];
  // Sunday = standalone colouring level; Mon–Sat = grade-mix worksheet.
  const activity = (grade === 'colouring') ? 'colouring' : 'mix';
  return { grade, theme, activity,
    gradeLabel: GRADE_LABEL[grade],
    themeLabel: THEME_LABEL[theme] || theme };
}

// Deterministic 32-bit seed from a date (so a given day always reproduces
// the same worksheet — anyone who shares the link still sees the same sheet).
// Uses LOCAL date (matches the folder name) so the seed doesn't shift across
// UTC midnight while it's still "the same day" locally.
function seedForDate(date){
  const stamp = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  return crypto.createHash('md5').update(stamp).digest().readUInt32BE(0);
}

// SLUG SHAPE: {activitySlug}-{gradeSlug}-{categorySlug?}-{id7}
// "Themeless" themes are omitted from the URL: 'mix' on grade days,
// 'all' on colouring days (= "surprise theme" — engine picks the mix).
function buildSlug({ grade, theme, activity }, seed){
  const a = KW.activities[activity].slug;
  const g = KW.grades[grade].slug;
  const omitTheme = (theme === 'mix' || theme === 'all');
  const c = omitTheme ? null : KW.categories[theme].slug;
  const id = (seed >>> 0).toString(36).padStart(7, '0');
  const parts = [a, g];
  if (c) parts.push(c);
  parts.push(id);
  return parts.join('-');
}

// Pinterest caption — written for SEO inside Pinterest's search, friendly tone.
function buildCaption({ gradeLabel, themeLabel, activity, theme }, url){
  const themeLc = themeLabel.toLowerCase();
  const gradeOneWord = (gradeLabel || 'Kids').replace(/\s/g,'');
  const themeOneWord = themeLabel.replace(/\s/g,'');

  let leadLine;
  if (activity === 'colouring') {
    leadLine = (theme === 'all')
      ? `Free printable colouring pages for kids — a fresh mix of cute subjects to colour. Print straight from the browser, no sign-up.`
      : `Free printable ${themeLc.toLowerCase()} colouring pages for kids — print straight from the browser. No sign-up.`;
  } else {
    leadLine = `Free printable ${gradeLabel} worksheet on ${themeLc} — a fresh 5-page set with colourful illustrations. No sign-up.`;
  }

  const colourHash = (activity === 'colouring') ? '#FreeColouringPages #ColouringPagesForKids' : '';
  return [
    leadLine,
    '',
    `Print it free: ${url}`,
    '',
    'Made in India with care at vilolabs.in 🪔',
    '',
    `#FreePrintables ${colourHash} #${gradeOneWord}Worksheets #${themeOneWord}Worksheets #HomeschoolPrintables #TeacherResources #PrintableActivities #KidsLearning #IndianMoms #IndianTeachers #ViLoLabs`.replace(/\s+/g,' '),
  ].join('\n');
}

// ── PIN HTML template (Plan B mockup, with placeholders) ───────────────
function buildPinHtml({ headline, sheetSrc, grade, theme, activity }){
  // Note: sheetSrc must be a path relative to the pin.html file (we save them
  // side-by-side in the same date directory).
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8">
<title>ViLoLabs Pin — ${headline}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,500;1,600&family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--cream:#F5F0E8;--gold:#C8963C;--gold2:#E8BC72;--char:#1A1108;--char2:#241710;--ink:#1f1305}
body{font-family:'Outfit',sans-serif;background:transparent;display:flex;justify-content:center;align-items:flex-start}
.pin{width:1000px;height:1500px;background:linear-gradient(180deg,#FDFAF5 0%,#F5EFE0 100%);
  position:relative;overflow:hidden;display:flex;flex-direction:column}
.sparkle{position:absolute;color:var(--gold);opacity:.32;font-family:'Cormorant Garamond',serif;pointer-events:none}
.pin-top{padding:42px 60px 18px;text-align:center;flex-shrink:0;position:relative}
.brand{font-family:'Cormorant Garamond',serif;font-weight:700;font-size:38px;color:var(--char);letter-spacing:.5px;line-height:1}
.brand em{font-style:normal;color:var(--gold)}
.kicker{font-size:12px;letter-spacing:.32em;text-transform:uppercase;color:var(--gold);margin-top:10px;font-weight:700}
.gold-rule{display:flex;align-items:center;justify-content:center;gap:14px;margin:18px auto 10px;width:340px}
.gold-rule::before,.gold-rule::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,transparent,var(--gold),transparent)}
.gold-rule-dot{width:5px;height:5px;border-radius:50%;background:var(--gold)}
.headline{font-family:'Cormorant Garamond',serif;font-weight:600;font-size:68px;line-height:1;color:var(--char);padding:0 30px}
.headline em{font-style:italic;color:var(--gold)}
.sub{margin-top:14px;font-size:18px;color:#5a4530;font-weight:500;letter-spacing:.04em}
.trust{display:flex;gap:8px;justify-content:center;margin-top:16px;flex-wrap:wrap}
.pill{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#7a510c;background:#fff;border:1.5px solid var(--gold);border-radius:99px;padding:5px 14px}
.sheet-stage{height:790px;padding:14px 80px 4px;display:flex;align-items:center;justify-content:center;position:relative;flex-shrink:0}
.sheet-frame{height:100%;aspect-ratio:794/1123;background:#fff;border-radius:14px;border:4px solid #fff;
  box-shadow:0 22px 56px rgba(0,0,0,.22),0 0 0 1px rgba(0,0,0,.05);overflow:hidden;position:relative}
.sheet-frame img{display:block;width:100%;height:100%;object-fit:cover;object-position:top center}
.tape{position:absolute;width:120px;height:28px;background:linear-gradient(180deg,#E8BC72,#C8963C);
  opacity:.85;top:14px;left:-22px;transform:rotate(-12deg);box-shadow:0 2px 6px rgba(0,0,0,.2);z-index:2}
.page-badge{position:absolute;right:34px;top:30px;background:var(--char);color:var(--gold2);
  padding:8px 14px;border-radius:99px;font-size:12px;font-weight:800;letter-spacing:.12em;
  border:1.5px solid var(--gold);box-shadow:0 4px 14px rgba(0,0,0,.3);z-index:2}
.cta{background:linear-gradient(180deg,#1A1108 0%,#0e0904 100%);padding:32px 60px 36px;text-align:center;
  color:#fff;flex-shrink:0;border-top:2px solid var(--gold)}
.cta-eyebrow{font-size:13px;letter-spacing:.3em;text-transform:uppercase;color:var(--gold);font-weight:600;margin-bottom:10px}
.cta-text{font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:600;line-height:1.15;color:#fff}
.cta-text em{font-style:italic;color:var(--gold2)}
.cta-btn{margin-top:18px;font-size:17px;font-weight:800;color:var(--char);letter-spacing:.05em;
  display:inline-block;padding:13px 34px;border-radius:99px;
  background:linear-gradient(180deg,var(--gold2),var(--gold));box-shadow:0 6px 20px rgba(200,150,60,.45)}
.cta-url{margin-top:12px;font-size:12px;color:rgba(245,240,232,.55);letter-spacing:.12em;font-weight:600}
</style></head><body>
<div class="pin">
  <span class="sparkle" style="top:46px;left:54px;font-size:30px">✦</span>
  <span class="sparkle" style="top:84px;right:62px;font-size:20px">✧</span>
  <span class="sparkle" style="bottom:480px;left:38px;font-size:18px">✦</span>
  <span class="sparkle" style="bottom:540px;right:42px;font-size:24px">✧</span>
  <div class="pin-top">
    <div class="brand">ViLo<em>Labs</em></div>
    <div class="kicker">Free Printable Worksheets · Built in India</div>
    <div class="gold-rule"><span class="gold-rule-dot"></span></div>
    <h1 class="headline">${escapeHtml((grade ? grade + ' ' : '') + theme)} <em>${activity === 'colouring' ? 'Colouring Page' : 'Worksheet'}</em></h1>
    <p class="sub">A fresh 5-page set — print straight from the browser</p>
    <div class="trust">
      <span class="pill">✓ FREE</span><span class="pill">✓ NO SIGN-UP</span><span class="pill">✓ INSTANT PDF</span>
    </div>
  </div>
  <div class="sheet-stage">
    <div class="sheet-frame">
      <span class="tape"></span>
      <span class="page-badge">PAGE 1 OF 5</span>
      <img src="${sheetSrc}" alt="ViLoLabs ${escapeHtml(grade)} ${escapeHtml(theme)} worksheet">
    </div>
  </div>
  <div class="cta">
    <div class="cta-eyebrow">Print it free in 10 seconds</div>
    <div class="cta-text">Made fresh at <em>vilolabs.in</em></div>
    <span class="cta-btn">→ Tap to print this worksheet</span>
    <div class="cta-url">VILOLABS.IN/WORKSHEETS</div>
  </div>
</div>
</body></html>`;
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

// ── Headless Chrome: capture file:// URL to PNG at given viewport ──────
function renderToPng(url, outPng, w, h){
  const profile = path.join(require('os').tmpdir(), 'vilo-pinbot-' + Date.now() + '-' + Math.random().toString(36).slice(2,8));
  fs.mkdirSync(profile, { recursive: true });
  const r = spawnSync(CHROME, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    `--window-size=${w},${h}`,
    `--user-data-dir=${profile}`,
    `--screenshot=${outPng}`,
    '--virtual-time-budget=8000',
    url
  ], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error('Chrome failed: ' + (r.stderr || r.stdout || 'unknown'));
}

// ── Main ───────────────────────────────────────────────────────────────
async function main(){
  const offset = parseInt(process.argv[2] || '0', 10);
  const date = new Date(); date.setHours(0,0,0,0);
  date.setDate(date.getDate() + offset);
  // Local-date YYYY-MM-DD (NOT toISOString, which converts to UTC and
  // can shift the folder name by a day relative to what the user sees).
  const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;

  const p = paramsForDate(date);
  const seed = seedForDate(date);
  const slug = buildSlug(p, seed);
  const url  = `https://vilolabs.in/worksheets/${slug}`;
  const headline = `${p.gradeLabel} ${p.themeLabel}`;

  const outDir = path.join(RESOURCES, dateStr);
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`\n🪔  Pinterest pin for ${date.toDateString()}`);
  console.log(`    grade    : ${p.gradeLabel}`);
  console.log(`    theme    : ${p.themeLabel}`);
  console.log(`    activity : ${p.activity}`);
  console.log(`    slug     : ${slug}`);
  console.log(`    url      : ${url}\n`);

  console.log('→ [1/3] Rendering worksheet page 1 from live site…');
  const sheetPng = path.join(outDir, 'sheet.png');
  const r1 = spawnSync('node', [RENDER_SHEET, slug, sheetPng], { stdio: 'inherit' });
  if (r1.status !== 0) throw new Error('worksheet render failed');

  console.log('→ [2/3] Building pin HTML template…');
  const pinHtml = buildPinHtml({
    headline, sheetSrc: 'sheet.png',
    grade: p.gradeLabel, theme: p.themeLabel, activity: p.activity,
  });
  const pinHtmlPath = path.join(outDir, 'pin.html');
  fs.writeFileSync(pinHtmlPath, pinHtml);

  console.log('→ [3/3] Rendering pin chrome to 1000×1500…');
  const pinPng = path.join(outDir, 'pin.png');
  const fileUrl = 'file:///' + pinHtmlPath.replace(/\\/g,'/');
  renderToPng(fileUrl, pinPng, 1000, 1500);

  const caption = buildCaption(p, url);
  fs.writeFileSync(path.join(outDir, 'caption.txt'), caption);

  fs.writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify({
    date: dateStr, weekday: date.toDateString().split(' ')[0],
    grade: p.gradeLabel, theme: p.themeLabel, activity: p.activity,
    slug, url, seed, headline,
  }, null, 2));

  const px = fs.statSync(pinPng).size;
  console.log(`\n✓  Pin ready · ${outDir}`);
  console.log(`    pin.png      ${Math.round(px/1024)} KB (1000×1500)`);
  console.log(`    caption.txt  ${fs.readFileSync(path.join(outDir,'caption.txt'),'utf8').length} chars`);
  console.log(`    meta.json    schedule + slug + url`);
  console.log(`    sheet.png    (worksheet page 1, used by pin.png)`);
}

main().catch(e => { console.error('\n✗', e.message); process.exit(1); });
