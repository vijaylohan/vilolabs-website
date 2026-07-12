#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────────────────
   ViLoLabs — render per-page OG (Open Graph) preview images
   ────────────────────────────────────────────────────────────────────────
   Snapshots each configured URL at 1200×630 (the OG spec) and saves as
   a compressed WebP under Website HTML/assets/og/og-<slug>.webp. Meta
   tags on each page then point at its own snapshot instead of the shared
   generic OG cards. Better social share previews on WhatsApp/FB/X.

   1200×630 is Facebook's recommended aspect ratio; WhatsApp, X, and
   Pinterest all handle this size well. Rendered at 2x devicePixelRatio
   for crispness on retina/mobile, then downscaled to 1200 wide in sharp
   so the on-disk file is small (~50-100 KB per page).

   Usage:
     node tools/render-og-images.js                       # render all
     node tools/render-og-images.js worksheet             # render one
   ──────────────────────────────────────────────────────────────────────── */
const { spawn } = require('child_process');
const http      = require('http');
const fs        = require('fs');
const path      = require('path');

const OUT_DIR = path.join(__dirname, '..', 'Website HTML', 'assets', 'og');
const CHROME  = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT    = 9224;
const sharp   = (() => { try { return require('sharp'); } catch { return null; } })();
const WebSocket = (() => { try { return require('ws'); } catch { return null; } })();
if (!WebSocket) { console.error('Need "ws" (devDep). Run: npm i --save-dev ws'); process.exit(1); }

// URL list — each entry becomes /assets/og/og-<name>.webp. Order matters
// for the CLI arg lookup below. Keep names URL-safe (no spaces/slashes).
const TARGETS = [
  { name: 'home',                    url: 'https://vilolabs.in/' },
  { name: 'worksheet',               url: 'https://vilolabs.in/worksheet' },
  { name: 'pulse',                   url: 'https://vilolabs.in/pulse' },
  { name: 'blog-gold-prices',        url: 'https://vilolabs.in/blog/gold-prices-india-2026' },
  { name: 'blog-petrol-india',       url: 'https://vilolabs.in/blog/petrol-prices-india-2025' },
  { name: 'blog-petrol-india-2026',  url: 'https://vilolabs.in/blog/petrol-prices-india-2026' },
  { name: 'blog-petrol-neighbors',   url: 'https://vilolabs.in/blog/petrol-prices-neighboring-countries-2026' },
  { name: 'blog-lpg-price',          url: 'https://vilolabs.in/blog/lpg-cylinder-price-2026' },
  { name: 'blog-electricity-tariff', url: 'https://vilolabs.in/blog/electricity-tariff-state-wise-2026' },
  { name: 'tools',                   url: 'https://vilolabs.in/tools' },
  { name: 'tool-qr-generator',       url: 'https://vilolabs.in/tools/qr-generator' },
  { name: 'tool-image-to-pdf',       url: 'https://vilolabs.in/tools/image-to-pdf' },
  { name: 'tool-pdf-to-image',       url: 'https://vilolabs.in/tools/pdf-to-image' },
  { name: 'tool-pdf-to-word',        url: 'https://vilolabs.in/tools/pdf-to-word' },
  { name: 'tool-merge-pdf',          url: 'https://vilolabs.in/tools/merge-pdf' },
  { name: 'tool-compress-pdf',       url: 'https://vilolabs.in/tools/compress-pdf' },
  { name: 'tool-compress-image',     url: 'https://vilolabs.in/tools/compress-image' },
  { name: 'tool-resize-image',       url: 'https://vilolabs.in/tools/resize-image' },
  { name: 'about',                   url: 'https://vilolabs.in/about' },
];

async function main(){
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const filter = process.argv[2];
  const list = filter ? TARGETS.filter(t => t.name === filter) : TARGETS;
  if (!list.length) { console.error('No target matches "' + filter + '". Options: ' + TARGETS.map(t=>t.name).join(', ')); process.exit(1); }

  console.log('→ Launching Chrome (headless)…');
  const profile = path.join(require('os').tmpdir(), 'vilo-og-' + Date.now());
  fs.mkdirSync(profile, { recursive:true });
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    '--window-size=1200,630',
    '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + profile,
    'about:blank',
  ], { stdio:['ignore','pipe','pipe'] });

  await waitForPort(PORT, 15000);
  const targets = await httpJson('http://127.0.0.1:' + PORT + '/json');
  const target = targets.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
  if(!target) { chrome.kill(); throw new Error('No page target found'); }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let msgId = 0; const pending = new Map();
  const send = (method, params={}) => new Promise((res, rej) => {
    const id = ++msgId; pending.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const events = new Map();
  const on = (name, fn) => { events.set(name, [...(events.get(name)||[]), fn]); };

  await new Promise(r => ws.once('open', r));
  ws.on('message', raw => {
    const m = JSON.parse(raw);
    if (m.id && pending.has(m.id)) {
      const { res, rej } = pending.get(m.id); pending.delete(m.id);
      m.error ? rej(new Error(m.error.message)) : res(m.result);
    } else if (m.method && events.has(m.method)) {
      events.get(m.method).forEach(fn => fn(m.params));
    }
  });

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1200, height: 630, deviceScaleFactor: 2, mobile: false,
  });

  for (const t of list) {
    console.log('\n→', t.name, '  ' + t.url);
    try {
      // Wait for load, plus a fixed extra pause for fonts + any lazy images
      // near the top. 1500ms is plenty for static content-heavy pages —
      // adjust up if the /worksheet card icons look unloaded at capture.
      const loadedOnce = new Promise(res => on('Page.loadEventFired', () => res()));
      await send('Page.navigate', { url: t.url });
      await loadedOnce;
      await new Promise(r => setTimeout(r, 1500));

      const shot = await send('Page.captureScreenshot', {
        format: 'png',
        // Clip to just the 1200×630 viewport, not the full scrollable page —
        // OG previews are always cropped to this aspect by the social platforms
        // anyway, so capturing only the "above the fold" area guarantees no
        // wasted content ends up hidden below the crop.
        clip: { x: 0, y: 0, width: 1200, height: 630, scale: 2 },
        captureBeyondViewport: false,
      });
      const raw = Buffer.from(shot.data, 'base64');

      const outPath = path.join(OUT_DIR, 'og-' + t.name + '.webp');
      if (sharp) {
        const buf = await sharp(raw)
          .resize({ width: 1200 })       // downscale from 2400 (2x DPR) to 1200
          .webp({ quality: 82 })
          .toBuffer();
        fs.writeFileSync(outPath, buf);
        console.log('  ✓ ' + path.basename(outPath) + ' (' + Math.round(buf.length/1024) + ' KB)');
      } else {
        fs.writeFileSync(outPath.replace(/\.webp$/, '.png'), raw);
        console.log('  ✓ saved as PNG (install sharp for WebP)');
      }
    } catch (e) {
      console.error('  ✗ ' + t.name + ': ' + e.message);
    }
  }

  ws.close();
  chrome.kill();
  console.log('\n✓ Done.');
}

function waitForPort(port, ms){
  const start = Date.now();
  return new Promise((res, rej) => {
    (function tick(){
      const req = http.get('http://127.0.0.1:' + port + '/json/version', r => { r.resume(); res(); });
      req.on('error', () => {
        if (Date.now() - start > ms) return rej(new Error('Chrome DevTools port not responding'));
        setTimeout(tick, 200);
      });
    })();
  });
}
function httpJson(url){
  return new Promise((res, rej) => {
    http.get(url, r => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>res(JSON.parse(d))); }).on('error', rej);
  });
}

main().catch(e => { console.error('✗', e.message); process.exit(1); });
