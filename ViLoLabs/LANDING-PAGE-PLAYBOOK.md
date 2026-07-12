# ViLoLabs — Worksheet Landing-Page Playbook

How to add a new dedicated worksheet category page (e.g. `/worksheets/tracing`,
`/worksheets/coloring`) so it ranks, funnels equity to `/worksheet`, and never
reads as thin or spammy. Follow every step; skipping the honesty or interlink
steps is how a page becomes a liability.

Existing pages built to this spec (use as reference/templates):
`worksheets/sudoku.html`, `worksheets/maze.html`, `worksheets/math.html`,
`worksheets/activity-worksheets.html`.

---

## The strategy in one line
Each landing page targets ONE keyword cluster, embeds real Generate links into
the tool, and links back to `/worksheet`. `/worksheet` stays the single ranking
hub; landing pages are satellites that feed it link equity while catching
specific long-tail searches.

---

## Step 1 — Keyword research (never guess)
- Data lives in `ViLoLabs/keyword-research-2026-07.json` (raw, categorized) and
  `ViLoLabs/keyword-targets-landing-pages.json` (per-page primary/secondary/
  long-tail tiers). Re-pull from Google Keyword Planner periodically — it ages.
- **Filter for intent, not just the word.** "sudoku" (500k) is mostly people
  wanting to *play* online, not print for kids. Keep only kid/print/worksheet/
  grade-context terms. See `keyword-research-curated.json` for the cleaned pass.
- Build long-tails from a proven base word + proven modifiers ("for kids",
  "printable", "pdf", "for class X", "preschool", "easy/hard"). The modifiers'
  real frequency is provable in the CSVs.

## Step 2 — HONESTY CHECK (do this before writing a word)
The generator must genuinely produce what the page promises. Verify in
`worksheet.html`:
- **Single-focus, safe to headline:** colouring, maze, sudoku (each builds a
  whole sheet of that one activity).
- **Mix, NOT a single skill:** prekg/kg/grade-1..5 build ~20 mixed activities →
  only honest as "activity pack / variety", never "multiplication worksheets".
- **Math Master (mm-*):** addition + subtraction across grades, multiplication
  only at Class 5, **no division at all**. Never claim division or word problems.
- If the generator can't deliver a promised theme/filter, either fix the
  generator first or don't promise it. (Colouring theme-filtering is currently
  unimplemented — PNG pages ignore the topic; don't build theme cards until fixed.)
- Answer keys: maze has one; sudoku and math do NOT. Don't claim keys we lack.

Write the honest exclusions down — they become the FAQ ("no division yet") and a
trust feature, not something to hide.

## Step 3 — Deep-link mechanics
- Slug shape = `<activity-slug>-<grade-slug>-<category?>-<id>`. Activity + grade
  slugs live in `assets/seo-keywords.json`. `id` = `[a-z0-9]{4,7}`.
  - sudoku → `sudoku-for-kids-<id>`  (grade slug "for-kids")
  - maze → `maze-worksheets-for-kids-<id>`
  - math → `math-worksheets-<grade>-<id>` (grade = preschool|kindergarten|grade-1..5)
  - mix → `free-printable-worksheets-<grade>-<id>`
- Extra controls pass as query params, read in `worksheet.html`'s
  `_wsRestoreFromUrl` block: `&size=2|4|6` (sudoku), `&shape=<name>` + `&age=4..12`
  (maze), `&pages=5..15` (all). Add new params there — NEVER touch
  `_wsCurrentConfig` (SEO-critical).
- Verify a deep-link actually generates the right thing (see Step 10).

## Step 4 — Page structure (avoid the template trap)
Google's scaled-content spam policy targets pages that are one skeleton with
words swapped. So **each page must have a genuinely different layout**:
- sudoku = 3 difficulty cards (grid sizes) · maze = 7 shape tiles · math =
  7-grade ladder · mix = grade chips + activity showcase.
- Reuse only the shared chrome (nav, footer, `/tools/shared.css`, the design
  tokens, the `.pg-pick` slider, the `.morelinks` row). Everything in between —
  the picker cards, the prose, the FAQ — is written fresh per page.

Required sections, top to bottom:
1. nav + breadcrumb (Home / Worksheets / <Name>)
2. hero: eyebrow, H1 (primary keyword), a **realistic reference image** (SVG
   mockup or real capture — not a schematic), lead paragraph, trust badges
3. `.use-tip` awareness note (page-specific, honest)
4. `.pg-pick` page-count slider (5–15)
5. the generate UI (cards/tiles/chips) — as crawlable anchors (Step 7)
6. a short helper line + a hub CTA
7. ~400–550 words of hand-written prose in 3–4 `<h2>` sections
8. 4-question FAQ with matching visible answers
9. `.morelinks` interlink row (Step 8)
10. footer with disclaimer

## Step 5 — SEO meta (head)
- `<title>` and `<meta description>` — primary keyword first, honest, ≤ ~60 /
  ~155 chars.
- `<meta name="robots" content="index, follow">` (landing pages ARE indexable —
  unlike share slugs which the Function marks noindex).
- `<link rel="canonical" href="https://vilolabs.in/worksheets/<name>">` (self).
- `og:*` + `twitter:*` — title/desc/url/image. Use `/assets/og/og-worksheet.webp`
  until a bespoke card is rendered (Step 11).

## Step 6 — Keyword weaving (natural, honest)
- Google matches by the WORDS in a query, not exact phrase order — "printable
  sudoku" on the page ranks for "sudoku printable". Audit by word-presence, not
  substring (see the audit snippet the pages were built with).
- Weave the highest-volume terms into real sentences. Never stuff — a personal
  byline + keyword-stuffed blocks is exactly what got flagged as "scam" before.
- It's fine (correct) to leave terms uncovered when covering them would lie
  ("with answers" when there's no key; "division" when math has none).
- The `<meta name="keywords">` tag is low-value (Google ignores it) but harmless
  — include the exact target phrases there.

## Step 7 — Crawlable Generate links
- Every Generate control is a real `<a href="/worksheet?w=<slug-with-fixed-seed>&...">`
  anchor — NOT an onclick-only button. Crawlers follow it into `/worksheet`,
  which canonicalises to `/worksheet`, concentrating equity on the hub.
- Progressive enhancement: `onclick="return goX(event, ...)"` swaps in a fresh
  random id + the current slider page count so each visitor gets a unique sheet.
  Pattern: `if(e&&e.preventDefault) e.preventDefault(); location.href=url; return false;`

## Step 8 — Interlinking (the long-term SEO engine)
- Bottom of every landing page: a `.morelinks` row linking to the OTHER landing
  pages + `/worksheet`. This builds a topic cluster Google reads as a real,
  connected site (not isolated thin pages) and spreads equity.
- `/worksheet` links back out: the "Popular worksheet pages" block in its
  `.page-info` section lists all landing pages. Keep it updated when adding one.
- Result: bidirectional cluster, all roads leading to `/worksheet`.

## Step 9 — Sitemap
- Add the page to `STATIC` in `tools/build-sitemap.js` (priority 0.9,
  changefreq monthly, with an `images:[{loc,caption}]` entry).
- Run `node tools/build-sitemap.js`, confirm the `<loc>` appears.
- Do NOT add `/worksheets/<share-slug>` URLs — those are noindex by design.

## Step 10 — Verify (before commit)
Run local wrangler (`.claude/launch.json` → "wrangler") and check:
- `curl -s -o /dev/null -w "%{http_code}" .../worksheets/<name>` → 200
- page serves `content="index, follow"` + correct canonical
- a deep-link actually generates the promised worksheet (load
  `/worksheet?w=<slug>&pages=10` in the browser, assert `pg-num`, level label,
  page count via `javascript_tool`)
- keyword word-presence audit ≥ ~80% of honest targets
- screenshot the landing page — layout distinct, reference image realistic

## Step 11 — OG image (polish, can follow later)
- Render a bespoke 1200×630 card via `tools/render-og-images.js` (add the URL to
  its `TARGETS`), output to `assets/og/og-<name>.webp`, then point the page's
  `og:image`/`twitter:image` + the sitemap image at it.

## Step 12 — Cache-bust if shared assets changed
- If you edited any shared `.js`/`.css` (`assets/share.js`, `tools/shared.css`,
  etc.), run `node tools/stamp-assets.js` (Cloudflare hard-caps those 4h).
- Pure new HTML pages don't need it (HTML is always-revalidate).

---

## Anti-thin / anti-spam checklist (the non-negotiables)
- [ ] Genuinely different layout from the other landing pages
- [ ] 400+ words of unique, hand-written prose (not templated)
- [ ] Every claim is true of the actual generator output
- [ ] FAQ answers are visible on the page AND mirrored in JSON-LD (no invisible
      FAQPage/HowTo — that's a manual-action risk)
- [ ] No personal-name byline, no keyword-stuffed blocks
- [ ] Real crawlable links in + out (cluster), all funnelling to `/worksheet`
- [ ] In the sitemap, index,follow, self-canonical

## Current status (2026-07-12)
- Live-ready: sudoku, maze, math, activity-worksheets (built, verified locally,
  in sitemap, interlinked). Not yet committed/deployed as of writing.
- Deferred: coloring (needs the generator theme-filter fix first — Step 2).
- Bespoke OG cards for the 4 pages: not yet rendered (using the shared card).
