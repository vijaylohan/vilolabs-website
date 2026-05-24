const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3456;
const ROOT = path.join(__dirname, 'Website HTML');

const mime = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

http.createServer((req, res) => {
  // Strip query string and hash before resolving the file path —
  // fetch('foo.json?v=123') must read foo.json, not foo.json?v=123
  const clean = req.url.split('?')[0].split('#')[0];
  const decoded = decodeURIComponent(clean);
  let filePath = path.join(ROOT, decoded === '/' ? 'index.html' : decoded);
  let ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (!err) {
      res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain' });
      return res.end(data);
    }
    // ── SPA fallback for /worksheets/<slug> ────────────────────────
    // Mirrors the production Netlify _redirects rule
    //   /worksheets/*    /worksheets/index.html    200
    // so paste-into-new-tab works locally too.
    if (decoded.startsWith('/worksheets/') && !ext) {
      const fallback = path.join(ROOT, 'worksheets', 'index.html');
      return fs.readFile(fallback, (e2, d2) => {
        if (e2) { res.writeHead(404); return res.end('Not found'); }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(d2);
      });
    }
    // ── SPA fallback for /tools/<tool>/<slug> ──────────────────────
    // Mirrors Netlify _redirects so pretty tool-share URLs work locally.
    //   /tools/resize-image/indian-passport-photo-9x4k2m
    //     → /tools/resize-image.html
    const tm = decoded.match(/^\/tools\/([a-z0-9-]+)\/[^/?#]+\/?$/);
    if (tm && !ext) {
      const toolName = tm[1];
      const fallback = path.join(ROOT, 'tools', toolName + '.html');
      return fs.readFile(fallback, (e3, d3) => {
        if (e3) { res.writeHead(404); return res.end('Not found'); }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(d3);
      });
    }
    res.writeHead(404);
    res.end('Not found');
  });
}).listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
