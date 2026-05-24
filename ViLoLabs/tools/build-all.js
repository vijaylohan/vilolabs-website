/*
 * build-all.js  —  ViLoLabs worksheet library
 * --------------------------------------------------------------
 * ONE command to refresh everything after adding new images.
 *
 *   node tools/build-all.js
 *
 * Runs, in order:
 *   1. backup-assets.js     — snapshot library/ + emoji/ first
 *   2. make-transparent.js  — clean white/grey backgrounds
 *   3. extract-emoji.js     — match emoji (skips if download absent)
 *   4. update-md.js         — refresh _images.md done-status
 *   5. build-library.js     — rebuild assets/library.json
 *
 * Steps marked `critical` abort the build if they fail; the rest are
 * best-effort. A failed critical step never gets baked into output.
 * --------------------------------------------------------------
 */
const { execSync } = require('child_process');
const path = require('path');

// `critical` steps abort the build on failure — their output feeds the
// next step, so continuing past a failure would bake the breakage into
// library.json (e.g. a failed emoji match → emoji:null everywhere).
const steps = [
  ['Backing up assets',          'backup-assets.js',    true],
  ['Cleaning image backgrounds', 'make-transparent.js', false],
  ['Matching emoji',             'extract-emoji.js',    true],
  ['Updating image lists',       'update-md.js',        false],
  ['Building library.json',      'build-library.js',    true],
];

console.log('=== ViLoLabs library build ===');
for (const [label, script, critical] of steps) {
  console.log('\n> ' + label + ' ...');
  try {
    execSync('node "' + path.join(__dirname, script) + '"', { stdio: 'inherit' });
  } catch (e) {
    if (critical) {
      console.error('\n  ' + script + ' FAILED — aborting build so the '
        + 'failure is not baked into library.json. Fix the issue and re-run.');
      process.exit(1);
    }
    console.log('  (step had an issue — continuing)');
  }
}
console.log('\n=== Done. library.json is up to date. ===');
