# Auto-Capture Pipeline — Handoff Spec

Multi-session build. Start a **fresh Claude Code session** with this doc + `CLAUDE.md`.

---

## Goal (one sentence)

When a real visitor clicks **Share or Print** on a colouring / maze / sudoku worksheet (Math Master deferred — Amendment 4), automatically capture a preview image, save it, and expose it in the `#wsGallery` on `/worksheet` + the image sitemap — so Google Images gradually fills with genuine user-quality worksheet snapshots.

Fully documented existing context lives in `CLAUDE.md` → search for **"Image SEO (Google Images) — started 2026-07-02"** section. This spec is the concrete build plan.

---

## ⚠️ AMENDMENTS — codebase reality check + free-tier review (2026-07-05)

Reviewed against the live codebase and free-tier limits. These corrections OVERRIDE
anything below that contradicts them:

1. **File is `worksheet.html`, not `sheets.html`** — renamed on disk 2026-07-03
   (killed a rewrite loop; see `_redirects` warnings). Every "edit sheets.html"
   instruction below means `worksheet.html`.

2. **🚨 Serve images from OUR domain, not raw Supabase URLs.** Supabase Storage
   stays as the backend (locked decision unchanged), but sitemap + gallery `<img>`
   URLs must be `https://vilolabs.in/captures/<file>.webp`, served by a new tiny
   proxy Function `functions/captures/[file].js` that fetches from Supabase Storage
   and returns `Cache-Control: public, max-age=31536000, immutable` (filenames are
   content-unique so immutable is safe). Why both reasons are hard requirements:
   - **Free-tier egress:** Supabase free tier ≈ 5 GB egress/month. Gallery shows up
     to 50 images/visit (~2.5 MB) + Googlebot/Pinterest recrawls of 500 images —
     direct serving can blow the cap, and Supabase responds by PAUSING the project,
     which takes down worksheets/tool_shares/blog DB too. Cloudflare edge cache
     absorbs ~all traffic; Supabase gets ~1 fetch per image per edge location.
   - **Google trust:** image-sitemap images on a cross domain need that domain
     verified in Search Console — we can't verify supabase.co. Same-domain URLs
     are fully trusted.
   → `public_url` column stores the **vilolabs.in proxy URL**; add a `storage_path`
   lookup in the proxy Function.

3. **🚨 Gallery Function (Phase 5 Option A) must FAIL-OPEN + cache.** `/worksheet`
   is the site's single ranking page. The Function must: (a) serve the static HTML
   unmodified if the Supabase fetch fails or exceeds ~1.5 s timeout; (b) cache the
   capture list (`caches.default`, ~5 min TTL) so Supabase sees a few queries/hour,
   not one per pageview. Supabase outage must degrade to "gallery shows only the
   hero card", never a slow/broken page.

4. **Math Master is OUT of v1 scope.** `_wsCurrentConfig()` (worksheet.html:2072)
   returns `activity='mix'` for `curLvl==='mathmaster'` — the slug builder and the
   server-side slug parser have NO mathmaster shape, so every capture would be
   rejected anyway. v1 = **colouring, maze, sudoku only** (the three shapes WSeo
   parses cleanly). Revisit Math Master when it gets a real slug shape. Also: the
   client eligibility gate should read `window.curLvl` directly, NOT
   `_wsCurrentConfig().activity` — do not modify `_wsCurrentConfig` (SEO-critical).

5. **Retirement must NOT delete storage bytes immediately.** sitemap.xml refreshes
   nightly — deleting storage at retire time leaves Google crawling 404 images for
   up to ~24 h (soft-404 risk). Retire = set `retired_at` only. Hard-delete storage
   in the nightly job where `retired_at < now() - 48h`.

6. **Daily cap window = UTC** on BOTH client (`toISOString().slice(0,10)` is already
   UTC) and server (count `captured_at >= date_trunc('day', now() at time zone 'utc')`).
   Never mix IST/UTC or client and server caps disagree by 5.5 h.

7. **GitHub Action needs `permissions: contents: write`** in the workflow YAML —
   default `GITHUB_TOKEN` is read-only; the sitemap commit 403s without it. Keep the
   `git diff --quiet` guard (a no-change night must NOT commit → no wasted Pages
   build; nightly commits cost ~30 of the 500/month build quota).

8. **Cheap abuse hardening:** the Function should reject requests whose `Origin`
   header isn't `https://vilolabs.in` (curl can spoof it, but it stops drive-by
   browser abuse for free). The 5/day global cap remains the real ceiling. CORS
   headers are NOT needed — the endpoint is same-origin only; do not add
   `Access-Control-Allow-Origin` at all (resolves open question #1 below).

9. **Capture element & honesty:** capture `.ws-page.act` (page 1 of N). Alt text
   must describe it as a *sample page* of the worksheet, be unique per capture
   (built from parsed slug params — theme + activity + grade), never a numbered
   template like "coloring page 2". No promo/watermark overlay baked into the
   captured image (Pinterest rejects text-overlay spam; the raw sheet pins clean).

10. **Three commit buttons, not two:** `↗ Share` (`onToolbarShare`), `🖨 Print`
    (`doBrowserPrint`), `⬇ PDF` (`doPrint`) — worksheet.html:529-536. Hook
    `_wsMaybeCapture()` into all three, right next to the existing
    `_wsPushIfCommitted()` calls (same commit-signal pattern).

Verified safe: no CSP in `_headers` (nothing blocks `/api/capture`); no `/api/*`
rule in `_redirects` (Function won't be preempted); `_wsCurrentMeta` is set before
the sheet becomes interactive, so slug is always available at commit time.

---

## Locked decisions (do NOT re-litigate)

| Decision | Choice | Why |
|---|---|---|
| Storage | **Supabase Storage** | Already connected via anon key; zero new infra; 500 × ~50 KB well within free tier. **Amendment 2: images are SERVED via a vilolabs.in proxy Function, never raw supabase.co URLs** |
| Trigger | **Share OR Print click** (not Generate) | Quality filter — proves user liked the sheet |
| Activity scope | **Colouring, Maze, Sudoku** (Math Master deferred — see Amendment 4) | All single-focus (verified thumbnail-friendly 2026-07-02) — never Class 1-5 mix sheets |
| Daily cap | **5 new captures per day** | Hard ceiling; prevents spam even under abuse |
| Total ceiling | **500 images ever** | Documented at `sheets.html` search "HARD CEILING" — **retire oldest** when full, never just hide |
| Sitemap refresh | **Nightly GitHub Actions** | Simplest and safest — no runtime file writes, ~24h indexing delay is acceptable |
| Client landing URL | Every gallery image links to `/worksheets/<slug>` in a new tab | User's own decision — better UX than making the whole thumbnail clickable |
| The 500-total gallery display cap | First 50 visible + See more/Show less toggle already built | See `sheets.html` search "wsGallery" — infrastructure is dormant, waiting for auto-capture to populate it |

## What NOT to build

- ❌ Cloudflare R2 (rejected — Supabase Storage picked)
- ❌ Live/dynamic sitemap generation (rejected — nightly cron picked)
- ❌ Client-only capture that trusts browser-side cap check (server MUST re-validate everything)
- ❌ On-demand image generation via Cloudflare Browser Rendering ($$ paid API, not needed)
- ❌ A separate `/worksheets/generated` gallery page — hard-documented as forbidden in `sheets.html` (breaks single-ranking-page strategy)

---

## Phase 1 — Supabase Schema (session 1, ~30 min)

### Table: `captured_worksheets`

```sql
create table captured_worksheets (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null,          -- e.g. "coloring-pages-for-kids-animals-a3f9k2x"
  activity           text not null,          -- 'colouring' | 'maze' | 'sudoku' | 'mathmaster'
  storage_path       text not null,          -- e.g. "captured/2026-07-05/a3f9k2x.webp"
  public_url         text not null,          -- vilolabs.in/captures/... proxy URL (Amendment 2) for sitemap + <img>
  alt_text           text not null,          -- descriptive, keyword-appropriate
  captured_at        timestamptz default now(),
  retired_at         timestamptz             -- null while active; set when retired past 500
);

create index captured_worksheets_active_recent
  on captured_worksheets (captured_at desc)
  where retired_at is null;

create index captured_worksheets_daily_count
  on captured_worksheets (captured_at)
  where retired_at is null;
```

### Supabase Storage bucket

- Bucket name: `worksheet-captures`
- **Public: YES** (Google needs to fetch images directly)
- File size limit: 500 KB per upload (generous; a properly rendered WebP is ~50 KB)
- Allowed MIME types: `image/webp` only

### RLS policies

- **INSERT / SELECT / UPDATE**: `service_role` only. Never expose write access to the anon key.
- Function will use a service-role JWT (stored as Cloudflare Pages env var, not in git).

### User action required

Log into Supabase dashboard → SQL Editor → paste the CREATE TABLE + INDEX above → Run. Then Storage → New bucket → the config above.

---

## Phase 2 — Cloudflare Pages Function receiver (session 1-2)

### File: `functions/api/capture.js`

**Path** → responds to `POST https://vilolabs.in/api/capture`

### Environment variables (Cloudflare Pages settings)

- `SUPABASE_URL` — already known
- `SUPABASE_SERVICE_ROLE_KEY` — **user must add** (Supabase dashboard → Settings → API → service_role key). NOT the anon key.

### Request contract

```
POST /api/capture
Content-Type: multipart/form-data

fields:
  slug     — e.g. "coloring-pages-for-kids-animals-a3f9k2x"
  activity — one of: colouring | maze | sudoku   (mathmaster deferred — Amendment 4)
  image    — Blob (WebP, ≤500 KB)
```

### Server-side validation (in order, all required)

```
1. Content-Type must be multipart/form-data
2. `activity` must be in the allowed set (colouring/maze/sudoku — Amendment 4).
   Reject 400 otherwise. This is the honesty check — mix worksheets never eligible.
3. `slug` must parse via the same WSeo.parseSlugWith logic as [slug].js Function.
   Reject 400 on parse failure.
4. Rate limit — count captured_worksheets WHERE captured_at >= today AND retired_at IS NULL.
   If >= 5, reject 429.
5. Duplicate check — count captured_worksheets WHERE slug = ? AND retired_at IS NULL.
   If exists, reject 409 (idempotent — same worksheet can't be added twice).
6. Image validation — verify magic bytes are WebP header (RIFF ... WEBP).
   Never trust Content-Type alone.
7. Size check — reject > 500 KB.
```

### Storage + DB write (atomic-ish)

```
1. Upload blob to Supabase Storage → captured/YYYY-MM-DD/<slug-id-part>.webp
2. If storage upload fails, return 500. No DB row inserted.
3. Build public_url = https://vilolabs.in/captures/<filename>.webp (proxy URL — Amendment 2).
4. Insert row into captured_worksheets with public_url + alt_text.
   Alt text generated server-side from parsed slug params (e.g. "Dog animal coloring page").
5. If insert fails, DELETE the storage upload (compensating action). Return 500.
6. Check total active count (retired_at IS NULL).
   If > 500, retire the oldest (see next section).
7. Return 200 with { publicUrl, id }.
```

### Retirement logic (when > 500)

```
1. SELECT id, storage_path FROM captured_worksheets
   WHERE retired_at IS NULL
   ORDER BY captured_at ASC
   LIMIT (count - 500);
2. UPDATE captured_worksheets SET retired_at = now() WHERE id IN (...).
   (Soft-delete for audit — DO NOT hard-delete DB rows.)
3. Do NOT delete storage here (Amendment 5). The nightly job hard-deletes
   storage for rows WHERE retired_at < now() - interval '48 hours' — this
   keeps sitemap-listed images resolvable until the next sitemap refresh
   has removed them (avoids Google crawling 404 images).
```

**Why soft-delete DB rows:** if a bug ever incorrectly retires an image, we can un-retire from the DB (within 48h, before the storage sweep).

---

## Phase 3 — Client-side capture in `worksheet.html` (session 2)

### Where to hook

Currently in `sheets.html` (now served as `worksheet.html` on disk since 2026-07-03 rename):

- Search for **`_currentSheetUrl()`** — the function that produces the Share URL. This runs on Share button click. Adjacent to it is Print button handling.
- Both Share and Print handlers need to also call a new `_wsMaybeCapture()` function.

### The `_wsMaybeCapture()` function (new)

```javascript
async function _wsMaybeCapture() {
  try {
    // 1. Feature gate — check current activity is eligible
    // Amendment 4: gate on curLvl DIRECTLY, not _wsCurrentConfig().activity
    // (mathmaster maps to 'mix' there; do not modify _wsCurrentConfig — SEO-critical)
    const ELIGIBLE = new Set(['colouring', 'maze', 'sudoku']);
    if (!ELIGIBLE.has(curLvl)) return;

    // 2. Local daily-cap check (soft — server re-validates)
    const today = new Date().toISOString().slice(0, 10);
    const lsKey = '_wsCaptureCount_' + today;
    const count = parseInt(localStorage.getItem(lsKey) || '0', 10);
    if (count >= 5) return;

    // 3. Reuse the SAME html2canvas call the PDF export uses
    const el = document.querySelector('.ws-page.act');
    if (!el) return;
    const cv = await html2canvas(el, {
      scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false,
    });

    // 4. Convert canvas → WebP blob at moderate quality
    const blob = await new Promise(res => cv.toBlob(res, 'image/webp', 0.82));
    if (!blob || blob.size > 500 * 1024) return;

    // 5. POST to Function endpoint
    const meta = _wsCurrentMeta;  // already exists — has slug
    const fd = new FormData();
    fd.append('slug', meta.slug);
    fd.append('activity', curLvl);
    fd.append('image', blob, meta.slug + '.webp');

    const res = await fetch('/api/capture', { method: 'POST', body: fd });
    if (res.ok) {
      localStorage.setItem(lsKey, String(count + 1));
    }
    // Silent failure on non-2xx — this is a background enhancement, not
    // core functionality. User's Share/Print still works normally.
  } catch { /* silent — never interfere with user's Share/Print action */ }
}
```

### Wiring into Share and Print handlers

Three commit buttons exist (worksheet.html:529-536, Amendment 10): `↗ Share`
(`onToolbarShare`), `🖨 Print` (`doBrowserPrint`), `⬇ PDF` (`doPrint`). Hook all
three, right next to their existing `_wsPushIfCommitted()` calls. Add after the
actual Share/Print/PDF action fires:

```javascript
// Fire-and-forget capture. Don't await — user shouldn't wait for our snapshot.
_wsMaybeCapture();
```

**Do NOT await.** The user's Share/Print is the primary action and must not be delayed.

---

## Phase 4 — Nightly sitemap rebuild via GitHub Actions (session 3)

### File: `.github/workflows/nightly-sitemap.yml`

```yaml
name: Nightly sitemap rebuild
on:
  schedule:
    - cron: '30 20 * * *'   # 2am IST daily
  workflow_dispatch:         # manual trigger button in GitHub UI

permissions:
  contents: write        # Amendment 7 — default GITHUB_TOKEN is read-only; push 403s without this

jobs:
  rebuild:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - name: Regenerate sitemap
        run: cd ViLoLabs && node tools/build-sitemap.js
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      - name: Commit if changed
        run: |
          cd "ViLoLabs/Website HTML"
          if git diff --quiet sitemap.xml; then
            echo "no changes"; exit 0
          fi
          git config user.name "nightly-bot"
          git config user.email "actions@vilolabs.in"
          git add sitemap.xml
          git commit -m "nightly: refresh sitemap with new captured images"
          git push
```

### `build-sitemap.js` extension (add a new section)

After the existing STATIC + blog handling, before writing the file:

```javascript
console.log('\n> Fetching captured worksheets from Supabase ...');
const captures = await fetchAll(
  'captured_worksheets',
  'slug,public_url,alt_text,captured_at,retired_at'
);
const active = captures.filter(c => !c.retired_at);
active.forEach(c => {
  allEntries.push({
    loc: '/worksheet',    // ALL captures list under /worksheet's URL entry
    // (they visually live on that page's mini-gallery)
    images: [{ loc: c.public_url, caption: c.alt_text }],
  });
});
```

**Important:** each capture becomes an ADDITIONAL `<url>` entry pointing at `/worksheet` with a nested image. Google's spec allows multiple `<url>` entries with the same `<loc>` when each carries different `<image:image>` children. This is how sites with 1000+ images on one page structure their image sitemaps.

Alternative if that pattern is flagged: consolidate all images under ONE `/worksheet` entry with many `<image:image>` children (up to 1000). Both work; batching is cleaner XML.

---

## Phase 5 — Gallery rendering (session 3)

The `#wsGallery` in `sheets.html` currently has ONE `.mini-card` (the hero). Auto-captured images need to render as additional cards.

### Option A (simpler): server-side inject via Function — CHOSEN

New Function at `functions/worksheet.js`: fetch active captures from Supabase and use HTMLRewriter to insert one `.mini-card` per capture into `#wsGallery`, before the closing `</div>`.

**Amendment 3 requirements (non-negotiable — `/worksheet` is the site's only ranking page):**
- FAIL-OPEN: if the Supabase fetch errors or exceeds ~1.5 s, serve the static HTML unmodified (gallery = hero card only). Never a 5xx, never a hang.
- CACHE: cache the capture list via `caches.default` (~5 min TTL) so Supabase sees a few queries/hour, not one per pageview.
- Each injected card carries its unique server-generated alt text and a "Generate this worksheet" link to its `/worksheets/<slug>` (new tab).

Trade-off: adds a Function invocation on every `/worksheet` visit (cost is negligible on Cloudflare's free tier at your traffic).

### Also in this phase: the image proxy Function (Amendment 2)

`functions/captures/[file].js` — GET `/captures/<file>.webp` → fetch from Supabase Storage → return with `Cache-Control: public, max-age=31536000, immutable` + `Content-Type: image/webp`. 404 if the file doesn't exist. This is what makes every image URL same-domain (Google/GSC trust) and keeps Supabase egress near zero (Cloudflare edge cache absorbs traffic).

### Option B (harder): nightly regenerate `sheets.html`

Extend the GitHub Action to also modify `sheets.html` — insert the captured cards into `#wsGallery`. Requires HTML parsing in Node.

Recommend Option A. Less risk of breaking `sheets.html` via automated HTML rewrites.

---

## Testing plan (session 3-4)

Every phase needs verification steps that DO NOT require deploying to production first (yesterday's Function bug taught us that lesson expensively).

### Local testing before push

- `wrangler pages dev` runs Functions locally with an .env-based service key
- Mock Supabase Storage via a simple in-memory fake for local testing
- Assert every failure mode returns the correct HTTP status
- Assert daily cap works with time mocking

### First production test

- After first deploy, MANUALLY trigger a capture by opening a share URL for a colouring worksheet and clicking Print
- Watch Cloudflare Pages logs (Functions tab) for the request
- Check Supabase table → should have exactly 1 row
- Check Storage → should have exactly 1 WebP
- Trigger the GitHub Action manually (`workflow_dispatch`) → should regenerate sitemap and include the new image
- Verify sitemap.xml on production → new `<image:image>` entry present

### Ongoing monitoring

- After first live captures start happening, watch Supabase table for a week — any bad data types, malformed slugs, unexpected volumes
- Watch Google Search Console → Coverage → Images tab → new images should appear within 2-4 weeks

---

## Rollback plan

If anything breaks in production:

1. **Client-side**: comment out the `_wsMaybeCapture()` call in Share/Print handlers, commit, push. Function stays deployed but never called → no data collected. Zero user impact.
2. **Server-side**: delete the Function file, commit, push. `/api/capture` returns 404 → client's silent-fail path activates → user's Share/Print unaffected.
3. **Data**: Supabase table + Storage bucket stay intact. Can re-enable anytime by uncommenting.

**No irreversible actions** anywhere in this pipeline. This is deliberate.

---

## Known unresolved things (address in build sessions)

1. ~~CORS on the capture endpoint~~ — RESOLVED (Amendment 8): endpoint is same-origin
   only; do NOT add CORS headers. Instead reject requests whose `Origin` header
   isn't `https://vilolabs.in`.
2. **How to test the retirement logic before we actually hit 500** — probably lower the cap to 3 temporarily during dev
3. **What alt text to generate server-side** — small template using parsed slug params; must be unique per capture and describe the image as a *sample page* (Amendment 9); never numbered templates
4. **Whether captures from a specific slug should replace older captures of same slug** — the duplicate check above rejects. Reasonable, but user might want the opposite (freshness). Discuss.
5. **Pinterest near-duplicate images** — colouring/maze sheets from the same category can look visually near-identical to Pinterest's image hasher. Consider server-side rejecting a capture when the last N captures share the same activity+category. Decide the N in session 2.

---

## Session breakdown

| Session | Scope | Deliverable |
|---|---|---|
| **1** (~2h) | Phase 1 Supabase + user runs SQL + Phase 2 skeleton Function that just receives + saves | POST works locally, one manual test to prod |
| **2** (~2h) | Phase 3 client-side capture + wiring into Share/Print | First real user-triggered capture in production DB |
| **3** (~2h) | Phase 4 GitHub Action + Phase 5 gallery rendering | End-to-end: capture → DB → sitemap → gallery |
| **4** (~1h) | Testing, monitoring setup, docs | Production stable, monitoring in place |

Total realistic estimate: **~7 hours across 4 sessions**, spread over 1-2 weeks.

---

## First action in next session

Start the next Claude session with:

> Load `HANDOFF-auto-capture.md`. Then load `CLAUDE.md`. We're building the auto-capture pipeline. Start Session 1 — Supabase schema. Give me the exact SQL script to paste into Supabase.

That's the entry point — everything else follows from there.
