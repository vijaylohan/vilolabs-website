// Launcher for `wrangler pages dev` — exists because wrangler discovers
// the functions/ folder relative to its CWD, NOT relative to the static
// asset directory. Running this from .claude/launch.json keeps the cwd
// set to "ViLoLabs/Website HTML" so functions/worksheets/[slug].js is
// picked up. If port 8788 is already in use, this exits quietly and
// Claude_Preview reuses the existing instance.
const { spawn } = require('child_process');
const path = require('path');
const cwd = path.resolve(__dirname, '..', 'ViLoLabs', 'Website HTML');
const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
spawn(cmd, [
  '--prefix', '..',
  'wrangler', 'pages', 'dev', '.',
  '--port', '8788',
  '--compatibility-date=2025-01-01'
], { cwd, stdio: 'inherit', shell: true });
