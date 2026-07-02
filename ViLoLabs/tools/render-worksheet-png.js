#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────────────────
   ViLoLabs — render a real worksheet to PNG via headless Chrome
   ────────────────────────────────────────────────────────────────────────
   Used by the daily Pinterest bot. Loads a live /worksheets/<slug> URL,
   lets the page fully render (clipart trim, fitCells, decode), then
   screenshots ONLY the first worksheet page at A4 ratio.

   Usage:
     node tools/render-worksheet-png.js [slug] [out.png]
   Defaults:
     slug = free-printable-worksheets-grade-1-animals-1fejbeq
     out  = Resources/preview-worksheet-page1.png

   No npm install needed — uses the system Chrome via DevTools Protocol
   (the same engine puppeteer uses, just talked to over WebSocket).
   ──────────────────────────────────────────────────────────────────────── */
const { spawn } = require('child_process');
const http      = require('http');
const fs        = require('fs');
const path      = require('path');

const SLUG = process.argv[2] || 'free-printable-worksheets-grade-1-animals-1fejbeq';
const OUT  = process.argv[3] || path.join(__dirname, '..', '..', 'Resources', 'preview-worksheet-page1.png');
const URL  = 'https://vilolabs.in/sheets.html?w=' + SLUG;

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT   = 9222;

// helper: tiny JSON-RPC client over CDP (WebSocket)
const WebSocket = (() => { try { return require('ws'); } catch { return null; } })();

if (!WebSocket) {
  console.error('Need the "ws" package. Installing locally…');
  const npm = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['install', '--no-save', '--no-audit', '--no-fund', '--silent', 'ws'],
    { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
  npm.on('close', code => {
    if (code !== 0) { console.error('npm install ws failed.'); process.exit(1); }
    // re-exec self after install
    spawn(process.execPath, process.argv.slice(1), { stdio: 'inherit' }).on('close', c => process.exit(c));
  });
  return;
}

async function main(){
  // 1. Launch headless Chrome with remote debugging on PORT
  console.log('→ Launching Chrome (headless)…');
  const profile = path.join(require('os').tmpdir(), 'vilo-chrome-profile-' + Date.now());
  fs.mkdirSync(profile, { recursive:true });
  const chrome = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    '--window-size=900,1300',
    '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + profile,
    'about:blank',
  ], { stdio:['ignore','pipe','pipe'] });

  // 2. Wait for DevTools port
  await waitForPort(PORT, 15000);

  // 3. Get the WS endpoint for the first target
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

  // 4. Enable + navigate
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 900, height: 1300, deviceScaleFactor: 2, mobile: false,
  });

  console.log('→ Loading', URL);
  await send('Page.navigate', { url: URL });
  await new Promise(res => on('Page.loadEventFired', () => res()));

  // 5. Wait for the worksheet to render — mode-aware.
  // Two phases:
  //
  // (a) REQUIRED: basic markers — active page + slug-meta set + library loaded.
  //     Means buildAll() finished and the page is in the DOM.
  //
  // (b) MODE-AWARE PAINT WAIT:
  //     · GRADE mode (curLvl != 'colouring'): wait for _wsReady — fires after
  //       paintImages() has trimmed every clipart via canvas + img.decode().
  //       This is the *real* ready signal; it's what we want.
  //     · COLOURING mode: _wsReady never fires (the lazy-loaded big PNG stalls
  //       the decode chain), so wait for the single .col-png to be complete.
  //
  // Cap each at 20s. After the cap, capture anyway — worst case a partial
  // image, never a failed pin.
  console.log('→ Waiting for worksheet to render…');
  await waitFor(ws, send, `
    (function(){
      const screen = document.querySelector('.ws-page.act');
      const meta   = (typeof _wsCurrentMeta !== 'undefined') && _wsCurrentMeta && _wsCurrentMeta.slug;
      const libOk  = (typeof LIB !== 'undefined') && LIB && LIB.length > 0;
      return !!(screen && meta && libOk);
    })()
  `, 25000);

  try {
    await waitFor(ws, send, `
      (function(){
        const isCol = (typeof curLvl !== 'undefined') && curLvl === 'colouring';
        if (isCol) {
          // colouring: the big subject PNG is what matters
          const cp = document.querySelector('.col-png, .col-main-svg, .col-main-wrap img');
          return !!(cp && (cp.tagName === 'svg' || cp.complete));
        }
        // grade mode: the real pre-warm flag works here
        return (typeof _wsReady !== 'undefined') && _wsReady === true;
      })()
    `, 20000);
  } catch (_) { /* timeout — capture what we have */ }

  // FINAL paint-readiness gate: only check `naturalWidth > 0` (the image has
  // been decoded into the browser's image cache). DON'T check `.complete` —
  // paintImages() re-sets img.src as part of trimming, which flips .complete
  // back to false even when the underlying decoded image is already painted
  // on screen. Our previous strict check rejected these and captured early.
  try {
    await waitFor(ws, send, `
      (function(){
        const screen = document.querySelector('.ws-page.act');
        if (!screen) return false;
        const imgs = [...screen.querySelectorAll('img')];
        return imgs.length === 0 || imgs.every(i => i.naturalWidth > 0);
      })()
    `, 8000);
  } catch (_) { /* still capture */ }

  // 6. Switch into PDFMODE — the exact same state the site uses for PDF export.
  //    This is the key fix: PREVIEW mode renders cells small (560px container)
  //    which fitCells then shrinks further. PDF mode uses A4 dimensions
  //    (794×1123 per page) — fitCells gets the proper room, content renders
  //    at full size. This mirrors what the user sees when they print.
  console.log('→ Switching to pdfmode (A4 layout) + re-running paint/fit…');
  await evalJson(send, `
    (async function(){
      // (a) un-zoom the preview container — pdfmode wants native px
      const c = document.getElementById('wsContainer');
      if (c) c.style.zoom = '';
      // (b) flip into pdfmode — triggers the A4-sized CSS
      document.body.classList.add('pdfmode');
      // (c) wait for CSS to settle (matches sheets.html's own delay)
      await new Promise(r=>setTimeout(r, 350));
      // (d) re-run the paint pipeline at the new dimensions
      try { await document.fonts.ready; } catch(e){}
      try { await Promise.all([...document.querySelectorAll('.ws-page img')]
        .map(i=>i.complete?0:new Promise(res=>{i.onload=i.onerror=res;}))); } catch(e){}
      try { if (typeof paintImages    === 'function') await paintImages(document);    } catch(e){}
      try { if (typeof paintShadows   === 'function') await paintShadows(document);   } catch(e){}
      try { if (typeof paintMazeIcons === 'function') await paintMazeIcons(document); } catch(e){}
      await new Promise(r=>setTimeout(r, 60));
      // (e) fitCells twice (second pass guarantees stable layout)
      try { fitCells(); } catch(e){}
      await new Promise(r=>setTimeout(r, 100));
      try { fitCells(); } catch(e){}
      await new Promise(r=>setTimeout(r, 100));
      return true;
    })()
  `);

  // 7. Capture via html2canvas (THE SAME LIBRARY THE SITE USES FOR PDF EXPORT).
  //    Why: native Chrome screenshots read the GPU-composited frame buffer.
  //    Some trimmed-image data-URLs are decoded into the DOM but not yet
  //    composited at the moment we capture, so they appear blank in native
  //    screenshots even though the user sees them fine on screen and in PDF.
  //    html2canvas re-rasterizes the DOM directly (same path as the PDF
  //    export) — so what we save matches what the user prints.
  console.log('→ Capturing via html2canvas (PDF-grade fidelity)…');
  const dataUrl = await evalJson(send, `
    (async function(){
      if (typeof html2canvas !== 'function') return { err: 'html2canvas not loaded' };
      const el = document.querySelector('.ws-page.act');
      if (!el) return { err: 'no .ws-page.act' };
      try {
        const cv = await html2canvas(el, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false,
          imageTimeout: 0,
        });
        return { ok: cv.toDataURL('image/png'), w: cv.width, h: cv.height };
      } catch (e) {
        return { err: String(e) };
      }
    })()
  `);
  if (dataUrl.err) throw new Error('html2canvas: ' + dataUrl.err);
  console.log('→ Captured ' + dataUrl.w + '×' + dataUrl.h);
  const base64 = dataUrl.ok.replace(/^data:image\/png;base64,/, '');
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, Buffer.from(base64, 'base64'));
  const kb = Math.round(fs.statSync(OUT).size / 1024);
  console.log('✓ Saved', OUT, '(' + kb + ' KB)');

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
// BUGFIX: the expr passed in is always an async IIFE call, i.e. it returns a
// Promise. Without `awaitPromise:true`, CDP evaluates 'JSON.stringify(<pending
// Promise>)' SYNCHRONOUSLY (before the promise settles) — Promise objects have
// no enumerable own properties, so this always serializes to the literal
// string "{}", discarding whatever the async function actually resolves to.
// awaitPromise:true tells CDP to wait for the promise to settle FIRST, and
// returnByValue:true then gives us the resolved value directly — no need to
// manually JSON.stringify/parse at all.
async function evalJson(send, expr){
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
  return r.result.value;
}
async function waitFor(ws, send, expr, timeoutMs){
  const start = Date.now();
  while(true){
    const r = await send('Runtime.evaluate', { expression: expr });
    if (r.result && r.result.value === true) return;
    if (Date.now() - start > timeoutMs) throw new Error('waitFor timeout: ' + expr.slice(0,60));
    await new Promise(res => setTimeout(res, 250));
  }
}

main().catch(e => { console.error('✗', e.message); process.exit(1); });
