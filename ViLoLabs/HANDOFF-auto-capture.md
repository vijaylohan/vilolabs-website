# Auto-Capture Pipeline — Handoff Spec

Multi-session build. Start a **fresh Claude Code session** with this doc + `CLAUDE.md`.

---

## Goal (one sentence)

When a real visitor clicks **Share or Print** on a colouring / maze / sudoku / math-master worksheet, automatically capture a preview image, save it, and expose it in the `#wsGallery` on `/worksheet` + the image sitemap — so Google Images gradually fills with genuine user-quality worksheet snapshots.

Fully documented existing context lives in `CLAUDE.md` → search for **"Image SEO (Google Images) — started 2026-07-02"** section. This spec is the concrete build plan.

---

## Locked decisions (do NOT re-litigate)

| Decision | Choice | Why |
|---|---|---|
| Storage | **Supabase Storage** | Already connected via anon key; zero new infra; 500 × ~50 KB well within free tier |
| Trigger | **Share OR Print click** (not Generate) | Quality filter — proves user liked the sheet |
| Activity scope | **Colouring, Maze, Sudoku, Math Master** | All single-focus (verified thumbnail-friendly 2026-07-02) — never Class 1-5 mix sheets |
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
  public_url         text not null,          -- resolvable URL for sitemap + <img>
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
  activity — one of: colouring | maze | sudoku | mathmaster
  image    — Blob (WebP, ≤500 KB)
```

### Server-side validation (in order, all required)

```
1. Content-Type must be multipart/form-data
2. `activity` must be in the allowed set (colouring/maze/sudoku/mathmaster).
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
3. Get public URL from storage.
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
2. For each row: DELETE from Supabase Storage.
3. UPDATE captured_worksheets SET retired_at = now() WHERE id IN (...).
   (Soft-delete for audit — DO NOT hard-delete DB rows.)
```

**Why soft-delete DB rows:** if a bug ever incorrectly retires an image, we can un-retire from the DB. Storage is the only truly destroyed thing.

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
    const cfg = _wsCurrentConfig();  // already exists — returns {activity, grade, category}
    const ELIGIBLE = new Set(['colouring', 'maze', 'sudoku', 'mathmaster']);
    if (!ELIGIBLE.has(cfg.activity)) return;

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
    fd.append('activity', cfg.activity);
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

Add to the existing handlers, after the actual Share/Print action fires:

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

### Option A (simpler): server-side inject via Function

Extend `functions/worksheets/[slug].js` behaviour: for `/worksheet` requests (via a new Function at `functions/worksheet.js`), fetch active captures from Supabase and use HTMLRewriter to insert one `.mini-card` per capture into `#wsGallery`, before the closing `</div>`.

Trade-off: adds a Function invocation on every `/worksheet` visit (cost is negligible on Cloudflare's free tier at your traffic).

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

1. **CORS on the capture endpoint** — needs `Access-Control-Allow-Origin: https://vilolabs.in` header explicitly
2. **How to test the retirement logic before we actually hit 500** — probably lower the cap to 3 temporarily during dev
3. **What alt text to generate server-side** — needs a small template function using parsed slug params
4. **Whether captures from a specific slug should replace older captures of same slug** — the duplicate check above rejects. Reasonable, but user might want the opposite (freshness). Discuss.

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
