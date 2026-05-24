/*
 * gen-page-prompts.js  —  ViLoLabs worksheet page assets
 * --------------------------------------------------------------
 * Generates 100-entry _images.md files for the 4 page-asset types:
 *   mazes · tracing · coloring pages · dot-to-dot
 *
 * Maze + Trace prompts come from theme data below.
 * Coloring + Dot-to-dot subjects are pulled from the clipart
 * library so they reuse names you already have.
 *
 * RUN:  node tools/gen-page-prompts.js
 * --------------------------------------------------------------
 */
const fs   = require('fs');
const path = require('path');
const PAGES = path.join(__dirname, '..', 'Website HTML', 'assets', 'pages');
const LIB   = path.join(__dirname, '..', 'Website HTML', 'assets', 'library');
const SEP   = '='.repeat(60);
const pretty = s => s.replace(/-/g, ' ');

// ---- pull subject names from the clipart library ----
function libNames(folders) {
  const out = [];
  for (const f of folders) {
    const md = path.join(LIB, f, '_images.md');
    if (!fs.existsSync(md)) continue;
    [...fs.readFileSync(md, 'utf8').matchAll(/^##\s+(\S+)/gm)]
      .forEach(m => out.push(m[1].replace(/\.png$/, '')));
  }
  return [...new Set(out)];
}

// ================= MAZE THEMES (20 x 5 = 100) =================
const MAZE = [
 ['jungle','green hedge',[['monkey','bunch of bananas'],['parrot','bird nest'],['baby tiger','mother tiger'],['frog','lily pond'],['toucan','fruit tree']]],
 ['ocean','coral',[['little fish','treasure chest'],['crab','seashell'],['baby turtle','sandy beach'],['dolphin','jumping hoop'],['octopus','underwater cave']]],
 ['space','metal',[['rocket','planet'],['astronaut','spaceship'],['alien','ufo'],['shooting star','moon'],['satellite','earth']]],
 ['farm','wooden fence',[['chick','hen'],['piglet','mud puddle'],['lamb','sheep'],['foal','horse'],['duckling','pond']]],
 ['dinosaur','rock',[['baby dinosaur','dinosaur egg'],['t-rex','big bone'],['pterodactyl','cliff nest'],['stegosaurus','leafy ferns'],['triceratops','dino herd']]],
 ['castle','stone',[['knight','castle'],['princess','tower'],['dragon','cave'],['king','golden throne'],['prince','crown']]],
 ['candyland','candy cane',[['child','giant lollipop'],['gingerbread man','candy house'],['gummy bear','candy jar'],['cupcake','birthday plate'],['ice cream','waffle cone']]],
 ['city','road',[['car','garage'],['bus','bus stop'],['bicycle','park'],['taxi','airport'],['truck','building site']]],
 ['garden','flower',[['bee','sunflower'],['butterfly','rose'],['ladybug','green leaf'],['snail','lettuce'],['worm','red apple']]],
 ['beach','sand',[['child','sandcastle'],['crab','sea'],['seagull','fish'],['starfish','rock pool'],['kid','ice cream stand']]],
 ['arctic','ice block',[['penguin','igloo'],['polar bear','fish hole'],['baby seal','mother seal'],['husky','sled'],['child','snowman']]],
 ['forest','tree trunk',[['squirrel','acorn'],['deer','pond'],['fox','den'],['owl','tree hollow'],['rabbit','burrow']]],
 ['desert','sandstone',[['camel','oasis'],['lizard','shady rock'],['snake','cactus'],['fennec fox','den'],['scorpion','rock']]],
 ['circus','rope',[['clown','circus tent'],['elephant','balance ball'],['lion','flaming hoop'],['acrobat','trapeze'],['seal','spinning ball']]],
 ['pirate','wooden plank',[['pirate','treasure chest'],['parrot','pirate ship'],['ship','island'],['crab','gold coins'],['captain','treasure map']]],
 ['fairy','mushroom',[['fairy','magic flower'],['unicorn','rainbow'],['gnome','toadstool house'],['butterfly','fairy castle'],['pixie','wishing pond']]],
 ['zoo','path',[['child','lion enclosure'],['zookeeper','monkey'],['kid','giraffe'],['family','elephant'],['visitor','penguin pool']]],
 ['playground','path',[['child','slide'],['kid','swing'],['ball','goal net'],['kite','open sky'],['child','sandbox']]],
 ['underwater-cave','rock',[['diver','treasure'],['fish','glowing pearl'],['eel','dark cave'],['shark','shipwreck'],['jellyfish','glowing light']]],
 ['winter','snow',[['child','snowman'],['sled','bottom of the hill'],['ice skater','frozen pond'],['reindeer','sleigh'],['kid','cozy cabin']]],
];

// ================= TRACE THEMES (20 x 5 = 100) =================
const TRACE = [
 ['jungle','jungle leaf'],['ocean','seashell'],['space','star'],['farm','farm animal'],
 ['dinosaur','baby dinosaur'],['candy','lollipop'],['vehicle','little car'],['garden','flower'],
 ['beach','beach ball'],['arctic','snowflake'],['forest','acorn'],['sport','ball'],
 ['fairy','magic wand'],['circus','balloon'],['weather','rainbow'],['fruit','apple'],
 ['bug','butterfly'],['bird','little bird'],['pet','puppy'],['school','pencil'],
];

function buildMaze() {
  const out = [];
  out.push('# Maze Puzzles — Image List (100)', '');
  out.push('ASSET TYPE: complete ready-made maze puzzle (the whole maze is the image).');
  out.push('SPEC: JPG or PNG, A4 portrait, 2480x3508 px (300 DPI).');
  out.push('Each file is a FINISHED maze — winding path, start character, goal,');
  out.push('all baked in. The engine adds only the title banner + footer, then');
  out.push('picks one at random per request.', '');
  out.push('NAMING: entry names have NO file extension. Save as .jpg OR .png.', '');
  out.push('DEFAULTS: class:page-asset | activity:maze | format:full-page');
  out.push('TAG KEY: theme:<word>  difficulty:easy|medium|hard', '');
  out.push(SEP, 'MAZES (100)', SEP, '');
  const diff = ['easy','easy','medium','medium','hard'];
  for (const [theme, wall, pairs] of MAZE) {
    pairs.forEach(([start, goal], i) => {
      out.push(`## ${theme}-maze-${i+1}`);
      out.push(`${pretty(theme)} maze — ${start} to ${goal}.`);
      out.push(`PROMPT: complete printable A4 maze puzzle for young children, ${theme} theme, one clear winding solvable path with bold ${wall} walls, a cute ${start} at the clearly marked START and a ${goal} at the clearly marked GOAL, friendly flat cartoon style, bright cheerful colors, no extra text, 2480x3508 pixels resolution`);
      out.push(`TAGS: class:page-asset | activity:maze | format:full-page | theme:${theme} | difficulty:${diff[i]}`, '');
    });
  }
  return out.join('\n').trimEnd() + '\n';
}

function buildTrace() {
  const out = [];
  out.push('# Tracing Worksheets — Image List (100)', '');
  out.push('ASSET TYPE: complete line-tracing worksheet page.');
  out.push('SPEC: JPG or PNG, A4 portrait, 2480x3508 px (300 DPI).');
  out.push('Each page has 3 to 5 horizontal tracing lines, each a different path');
  out.push('shape, each ending in a themed reward picture. The engine adds only');
  out.push('the title banner + footer.', '');
  out.push('NAMING: entry names have NO file extension. Save as .jpg OR .png.', '');
  out.push('DEFAULTS: class:page-asset | activity:trace | format:full-page');
  out.push('TAG KEY: theme:<word>  lines:3|4|5', '');
  out.push(SEP, 'TRACING PAGES (100)', SEP, '');
  const lineCounts = [3,4,5,4,5];
  for (const [theme, reward] of TRACE) {
    for (let i = 0; i < 5; i++) {
      const n = lineCounts[i];
      out.push(`## ${theme}-trace-${i+1}`);
      out.push(`${pretty(theme)} tracing — ${n} trace lines.`);
      out.push(`PROMPT: full page A4 line-tracing practice worksheet for young children, ${theme} theme, exactly ${n} horizontal tracing lines stacked evenly down the page, each line a different path shape (straight, wavy, curvy, zigzag, looping, bumpy), every line starts with an arrow marker and ends with a cute ${reward} reward picture, mix of solid and dashed guide lines, decorative ${theme} themed border, bright cheerful colors, no extra text, 2480x3508 pixels resolution`);
      out.push(`TAGS: class:page-asset | activity:trace | format:full-page | theme:${theme} | lines:${n}`, '');
    }
  }
  return out.join('\n').trimEnd() + '\n';
}

function buildColoring(names) {
  const pick = names.slice(0, 100);
  const out = [];
  out.push(`# Coloring Pages — Image List (${pick.length})`, '');
  out.push('ASSET TYPE: coloring worksheet (big blank outline + small corner reference).');
  out.push('SPEC: JPG or PNG, A4 portrait, 2480x3508 px (300 DPI).');
  out.push('One LARGE blank line-art outline fills the page to color in. A SMALL');
  out.push('fully-colored reference thumbnail sits in the top-right corner.', '');
  out.push('NAMING: entry names have NO file extension. Save as .jpg OR .png.', '');
  out.push('DEFAULTS: class:page-asset | activity:coloring | format:full-page');
  out.push('TAG KEY: subject:<word>', '');
  out.push(SEP, `COLORING PAGES (${pick.length})`, SEP, '');
  for (const name of pick) {
    const p = pretty(name);
    out.push(`## ${name}-coloring`);
    out.push(`Color the ${p} — large blank outline, small colored reference top-right.`);
    out.push(`PROMPT: A4 portrait coloring worksheet for young children, ONE large blank black and white line art outline of a cute cartoon ${p} filling most of the page with clear empty spaces ready to color in, thick bold clean black outlines, no shading, pure white background, in the TOP RIGHT corner a small fully colored reference thumbnail of the same ${p} in bright flat cartoon colors inside a thin rounded frame box, no text, no labels, 2480x3508 pixels resolution`);
    out.push(`TAGS: class:page-asset | activity:coloring | format:full-page | subject:${name}`, '');
  }
  return out.join('\n').trimEnd() + '\n';
}

function buildDots(names) {
  const pick = names.slice(0, 100);
  const out = [];
  out.push(`# Dot-to-Dot Pictures — Image List (${pick.length})`, '');
  out.push('ASSET TYPE: simple single-outline picture for dot-to-dot.');
  out.push('SPEC: JPG or PNG, square, 2000x2000 px minimum.');
  out.push('A clean smooth continuous outline. The engine places numbered dots');
  out.push('along the outline — so keep the shape simple with little inner detail.', '');
  out.push('NAMING: entry names have NO file extension. Save as .jpg OR .png.', '');
  out.push('DEFAULTS: class:page-asset | activity:dot-to-dot | format:half-page');
  out.push('TAG KEY: subject:<word>', '');
  out.push(SEP, `DOT-TO-DOT PICTURES (${pick.length})`, SEP, '');
  for (const name of pick) {
    const p = pretty(name);
    out.push(`## ${name}-dots`);
    out.push(`Dot-to-dot ${p} outline.`);
    out.push(`PROMPT: very simple bold black single-line outline of a cute cartoon ${p} for a children's dot-to-dot worksheet, smooth continuous outline shape, minimal inner detail, no color, no shading, pure white background, large and centered, no dots, no numbers, no text, 2000x2000 pixels resolution`);
    out.push(`TAGS: class:page-asset | activity:dot-to-dot | format:half-page | subject:${name}`, '');
  }
  return out.join('\n').trimEnd() + '\n';
}

// ---- subject pools from the library ----
const colorPool = libNames(['animals','birds','sea-creatures','fruits','vegetables',
  'vehicles','insects','dinosaurs','fantasy','toys','food','instruments']);
const dotPool   = libNames(['animals','birds','fruits','vehicles','sea-creatures',
  'insects','toys','dinosaurs','fantasy','vegetables','plants','instruments']);

fs.writeFileSync(path.join(PAGES,'scenes-maze','_images.md'),    buildMaze());
fs.writeFileSync(path.join(PAGES,'scenes-trace','_images.md'),   buildTrace());
fs.writeFileSync(path.join(PAGES,'coloring-pages','_images.md'), buildColoring(colorPool));
fs.writeFileSync(path.join(PAGES,'dot-to-dot','_images.md'),     buildDots(dotPool));

console.log('Generated page-asset prompt lists:');
console.log('  scenes-maze    : 100 maze prompts');
console.log('  scenes-trace   : 100 tracing prompts');
console.log('  coloring-pages : ' + Math.min(100,colorPool.length) + ' coloring prompts (pool ' + colorPool.length + ')');
console.log('  dot-to-dot     : ' + Math.min(100,dotPool.length) + ' dot-to-dot prompts (pool ' + dotPool.length + ')');
