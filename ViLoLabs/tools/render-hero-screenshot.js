#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────────────────
   ViLoLabs — render the /worksheet level-picker screen as a hero image
   ────────────────────────────────────────────────────────────────────────
   One-time asset (not part of the daily automation). Captures the setup
   screen — all level cards (Pre-KG through Math Master) + page slider +
   Generate button — as a clean PNG for the "Sample Worksheets" gallery
   section and potential og:image use.

   Unlike render-worksheet-png.js, this does NOT need html2canvas/pdfmode —
   the setup screen is a normal DOM view, so a native CDP screenshot is
   pixel-accurate and much simpler.

   Usage:
     node tools/render-hero-screenshot.js [out.png] [url]
   Defaults:
     out = Resources/hero-worksheet-picker.png
     url = https://vilolabs.in/worksheet
   ──────────────────────────────────────────────────────────────────────── */
const { spawn } = require('child_process');
const http      = require('http');
const fs        = require('fs');
const path      = require('path');

const OUT = process.argv[2] || path.join(__dirname, '..', '..', 'Resources', 'hero-worksheet-picker.png');
const URL = process.argv[3] || 'https://vilolabs.in/worksheet';
const sharp = (() => { try { return require('sharp'); } catch { return null; } })();

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT   = 9223; // different port from render-worksheet-png.js so both can run independently

const WebSocket = (() => { try { return require('ws'); } catch { return null; } })();
if (!WebSocket) { console.error('Need the "ws" package (already a devDependency).'); process.exit(1); }

async function main(){
  console.log('→ Launching Chrome (headless)…');
  const profile = path.join(require('os').tmpdir(), 'vilo-hero-' + Date.now());
  fs.mkdirSync(profile, { recursive:true });
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    '--window-size=1200,1600',
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
    width: 1200, height: 1600, deviceScaleFactor: 2, mobile: false,
  });

  console.log('→ Loading', URL);
  await send('Page.navigate', { url: URL });
  await new Promise(res => on('Page.loadEventFired', () => res()));

  // Fonts + card icons need a moment to settle. Fixed delay is fine here —
  // this is a static screen, no client-side generation to wait for.
  await new Promise(r => setTimeout(r, 1200));

  // Inject a branded badge banner right above the level cards — makes the
  // image self-explanatory: this isn't a fixed worksheet library, it
  // generates a fresh one every click, in a flexible page count (5-15).
  // Uses the site's own fonts/colors (already loaded) so it looks native,
  // not like a pasted-on sticker. Lives only in this throwaway headless
  // browser tab — never touches the real site.
  await send('Runtime.evaluate', {
    expression: `(function(){
      const label = document.querySelector('#setupScreen .step-lbl');
      if (!label) return;
      const badge = document.createElement('div');
      badge.id = '__heroBadge';
      badge.style.cssText = [
        'background:linear-gradient(135deg,#C8963C,#E8BC72)',
        'color:#1A1108','font-family:Nunito,sans-serif','font-weight:800',
        'font-size:1.05rem','text-align:center','padding:0.7rem 1.2rem',
        'border-radius:14px','margin:0 0 1rem','box-shadow:0 6px 18px rgba(200,150,60,.35)',
      ].join(';');
      badge.textContent = '🔄 Unlimited free generations — every click makes a brand-new worksheet, 5 to 15 pages each';
      label.parentNode.insertBefore(badge, label);
    })()`,
  });
  await new Promise(r => setTimeout(r, 200)); // let layout settle

  // Clip covers: badge → level label → card grid → page-count slider.
  // Stops before the Generate button + safety disclaimer — this stays a
  // focused "here's what the tool does" product shot.
  const clipResult = await send('Runtime.evaluate', {
    expression: `(function(){
      const badge = document.getElementById('__heroBadge');
      const grid  = document.querySelector('#setupScreen .lvl-grid');
      const pcWrap= document.getElementById('pcWrap');
      if (!badge || !grid || !pcWrap) return null;
      const br = badge.getBoundingClientRect();
      const gr = grid.getBoundingClientRect();
      const pr = pcWrap.getBoundingClientRect();
      const x = Math.min(br.x, gr.x, pr.x);
      const y = br.y;
      const width  = Math.max(br.right, gr.right, pr.right) - x;
      const height = pr.bottom - y;
      return JSON.stringify({ x, y, width, height });
    })()`,
    returnByValue: true,
  });
  // NOTE: deliberately NOT padding the DOM clip rect itself — expanding the
  // capture area picks up whatever real content happens to sit just outside
  // the badge/grid/slider (stray text, the Generate button edge), since nothing
  // in the live page guarantees clear space there. Margin is added cleanly
  // after capture instead, by padding the image with a solid background color.
  const clip = clipResult.result.value ? JSON.parse(clipResult.result.value) : null;

  console.log('→ Capturing screenshot…');
  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    clip: clip ? { x: clip.x, y: clip.y, width: clip.width, height: clip.height, scale: 2 } : undefined,
    captureBeyondViewport: true,
  });

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const rawPng = Buffer.from(shot.data, 'base64');

  // Convert to WebP for the web-facing copy (30-50% smaller than PNG at
  // visually identical quality). Screenshot device pixel ratio was 2x, so
  // downscale to 1x here — the source has plenty of resolution to spare and
  // a smaller file loads faster without looking soft on normal displays.
  if (sharp) {
    // Clean solid-color margin added AFTER capture (not by expanding the
    // screenshot's source rect — see note above). MARGIN is in the final
    // downscaled-image's pixel space, applied after the 2x->1x resize.
    const MARGIN = 28;
    const BG = '#F7F3EE'; // matches sheets.html body background (--cream)
    const meta = await sharp(rawPng).metadata();
    const targetWidth = Math.round(meta.width / 2);
    const webpBuf = await sharp(rawPng)
      .resize({ width: targetWidth })
      .extend({ top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN, background: BG })
      .webp({ quality: 82 })
      .toBuffer();
    const webpOut = OUT.replace(/\.png$/i, '.webp');
    fs.writeFileSync(webpOut, webpBuf);
    const webpKb = Math.round(webpBuf.length / 1024);
    console.log('✓ Saved', webpOut, '(' + webpKb + ' KB, WebP, ' + targetWidth + 'px wide)');
  } else {
    fs.writeFileSync(OUT, rawPng);
    const kb = Math.round(rawPng.length / 1024);
    console.log('✓ Saved', OUT, '(' + kb + ' KB, PNG — install sharp for WebP)');
  }

  ws.close();
  chrome.kill();
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
