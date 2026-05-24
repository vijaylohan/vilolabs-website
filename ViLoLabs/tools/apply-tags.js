/*
 * apply-tags.js  —  ViLoLabs worksheet image library
 * --------------------------------------------------------------
 * Brings every category's _images.md up to the full tag standard:
 *   1. Inserts a DEFAULTS line + TAG KEY into the header.
 *      (DEFAULTS = tags auto-applied to ANY image in that folder,
 *       even ones you drop in later with no TAGS line.)
 *   2. Applies per-image tag ENRICHMENT (buoyancy, moisture, etc.)
 *      by merging extra dimensions into the existing TAGS line.
 *
 * Re-runnable and idempotent. RUN:  node tools/apply-tags.js
 * --------------------------------------------------------------
 */
const fs   = require('fs');
const path = require('path');
const LIB  = path.join(__dirname, '..', 'Website HTML', 'assets', 'library');

// ---- per-folder DEFAULTS (auto-applied to every image in the folder) ----
const DEFAULTS = {
  animals:       'class:mammal | alive:living',
  birds:         'class:bird | alive:living',
  'body-parts':  'class:body-part | alive:living-part',
  buildings:     'class:building | alive:non-living | state:solid',
  clothing:      'class:clothing | alive:non-living',
  dinosaurs:     'class:dinosaur | alive:living',
  fantasy:       'class:fantasy',
  food:          'class:food | alive:non-living',
  fruits:        'class:fruit | alive:non-living | state:solid',
  household:     'class:object | alive:non-living | state:solid',
  insects:       'class:insect | alive:living',
  instruments:   'class:instrument | alive:non-living | state:solid',
  nature:        'class:object | alive:non-living',
  people:        'class:person | alive:living',
  plants:        'class:plant | alive:living',
  'sea-creatures':'class:sea-creature | alive:living | habitat:sea | can:swim',
  sports:        'class:sport-equipment | alive:non-living',
  stationery:    'class:object | alive:non-living | state:solid',
  symbols:       'class:symbol | alive:non-living',
  tools:         'class:tool | alive:non-living | state:solid',
  toys:          'class:toy | alive:non-living',
  vegetables:    'class:vegetable | alive:non-living | state:solid',
  vehicles:      'class:vehicle | alive:non-living',
};

// ---- per-image ENRICHMENT: extra tag dimensions merged into TAGS ----
// key = "folder/file.png", value = extra "k:v | k:v" merged over existing
const ENRICH = {
  // float / sink teaching examples
  'nature/leaf.png':        'moisture:dry | buoyancy:floats',
  'nature/log.png':         'moisture:dry | buoyancy:floats',
  'nature/rock.png':        'moisture:dry | buoyancy:sinks',
  'toys/rubber-duck.png':   'buoyancy:floats',
  'toys/beach-ball.png':    'buoyancy:floats',
  'vehicles/boat.png':      'buoyancy:floats',
  'vehicles/ship.png':      'buoyancy:floats',
  'tools/anchor.png':       'buoyancy:sinks',
  'tools/key.png':          'buoyancy:sinks',
  'tools/coins.png':        'buoyancy:sinks',
  'tools/anvil.png':        'buoyancy:sinks',
  'tools/hammer.png':       'buoyancy:sinks',
  // nature wet / dry
  'nature/rain.png':        'moisture:wet',
  'nature/pond.png':        'moisture:wet',
  'nature/puddle.png':      'moisture:wet',
  'nature/cloud.png':       'moisture:wet',
  'nature/steam.png':       'moisture:wet',
  'nature/snowflake.png':   'moisture:wet',
  'nature/snowman.png':     'moisture:wet',
  'nature/sun.png':         'moisture:dry',
  'nature/fire.png':        'moisture:dry',
  'nature/wind.png':        'moisture:dry',
  'nature/smoke.png':       'moisture:dry',
};

const TAGKEY =
  'TAG KEY (worksheet generator): state:solid|liquid|gas  temp:hot|cold|neutral  ' +
  'moisture:wet|dry|neutral  buoyancy:floats|sinks  habitat:farm|wild|home|sea|sky|garden  ' +
  'can:fly|swim|bounce|has-wheels|no-fly  season:winter-wear|summer-wear|rain-gear  ' +
  'pairWith:<folder/file.png>';

function parseTags(line) {
  const m = {};
  line.replace(/^TAGS:\s*/, '').split('|').forEach(p => {
    const [k, v] = p.trim().split(':');
    if (k && v) m[k] = v;
  });
  return m;
}
function mergeStr(into, str) {           // merge "k:v | k:v" into map
  if (!str) return;
  str.split('|').forEach(p => {
    const [k, v] = p.trim().split(':');
    if (k && v) into[k] = v;
  });
}

function process(cat) {
  const file = path.join(LIB, cat, '_images.md');
  if (!fs.existsSync(file) || !DEFAULTS[cat]) return null;
  let lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);

  // 1. insert DEFAULTS + TAG KEY after the Status line (once)
  if (!lines.some(l => l.startsWith('DEFAULTS:'))) {
    const si = lines.findIndex(l => l.startsWith('Status:'));
    if (si !== -1) {
      lines.splice(si + 1, 0,
        '',
        'DEFAULTS: ' + DEFAULTS[cat],
        '(Any image dropped in this folder inherits the DEFAULTS above; the per-image TAGS line adds the rest.)',
        '',
        TAGKEY);
    }
  }

  // 2. enrich each TAGS line: defaults + existing + per-image enrichment
  let enriched = 0;
  lines = lines.map((line, i) => {
    if (!line.startsWith('TAGS:')) return line;
    // find the image name from the nearest preceding "## " line
    let name = null;
    for (let j = i; j >= 0; j--) {
      const mm = lines[j].match(/^##\s+(\S+)/);
      if (mm) { name = mm[1]; break; }
    }
    const tags = {};
    mergeStr(tags, DEFAULTS[cat]);          // folder defaults (lowest priority)
    Object.assign(tags, parseTags(line));   // existing per-image tags
    if (name && ENRICH[cat + '/' + name]) { // enrichment (highest)
      mergeStr(tags, ENRICH[cat + '/' + name]);
      enriched++;
    }
    // stable order
    const order = ['class','alive','state','temp','moisture','buoyancy',
                   'habitat','can','season','pairWith'];
    const keys = Object.keys(tags).sort((a,b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia<0?99:ia) - (ib<0?99:ib);
    });
    return 'TAGS: ' + keys.map(k => k + ':' + tags[k]).join(' | ');
  });

  fs.writeFileSync(file, lines.join('\n'));
  return { cat, enriched };
}

const rows = [];
for (const cat of Object.keys(DEFAULTS)) {
  const r = process(cat);
  if (r) rows.push(r);
}
console.log('Updated ' + rows.length + ' folders with DEFAULTS + TAG KEY.');
rows.filter(r => r.enriched).forEach(r =>
  console.log('  ' + r.cat + ': ' + r.enriched + ' image(s) enriched'));
