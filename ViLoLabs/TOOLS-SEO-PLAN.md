# ViLoLabs — Tools SEO Improvement Plan

How to lift the 8 tool pages (`/tools/*`) the same way the worksheet cluster was
lifted: real keyword data first, honest content second, infra third. Written as
a handoff so any session (or a fresh chat) can execute a phase without
re-deriving context. Companion docs: `LANDING-PAGE-PLAYBOOK.md` (the method),
`CLAUDE.md` → pSEO section (the share-URL / indexable-preset architecture).

**Audit date 2026-07-12 — current state (already good, don't redo):**
per-page titles + meta descriptions, bespoke OG images (`assets/og/og-tool-*.webp`),
self-canonicals, FAQ visible + matching FAQPage JSON-LD, BreadcrumbList,
related-tools link rows, all 8 in sitemap, ~380–780 words body content each.
The gaps are below — in priority order.

---

## Phase 1 — Keyword data (DO FIRST; everything else depends on it)

**Owner: user (needs Keyword Planner login) + Claude (parsing).**

1. In Google Keyword Planner, get search volume for a seed list around ALL 8 tools:
   - image to pdf, jpg to pdf, photo to pdf converter
   - compress pdf, compress pdf to 100kb, compress pdf to 200kb, reduce pdf size
   - merge pdf, combine pdf, join pdf files
   - resize image, resize photo to 20kb, resize photo 200kb, photo resize for upsc,
     ssc photo resize, passport photo size
   - compress image, compress jpg, reduce image size in kb
   - qr code generator, upi qr code, wifi qr code, qr code for payment
   - pdf to word, pdf to doc converter
   - pdf to image, pdf to jpg, pdf to png
2. Export CSV (UTF-16, same format as the worksheet pulls) → drop in Downloads.
3. Claude parses it into `ViLoLabs/keyword-research-tools.json`
   (same categorized shape as `keyword-research-2026-07.json`) and produces
   `keyword-targets-tool-pages.json` with primary / exact-product-match /
   secondary / constructed-longtail tiers per tool.
   - Reuse the parsing approach: `Buffer.toString('utf16le')`, split on tabs,
     header at line index 2. Filter noise by INTENT (app/adult/brand terms out).
4. Word-presence audit each tool page against its tier list (the same
   stop-word-aware audit script used for worksheets). Target ≥80% of honest terms.

**Deliverable:** two JSONs + a per-page coverage report → drives Phases 2–4.

## Phase 2 — India-preset long-tail content (highest upside)

The resize tool already HAS UPSC/SSC/IBPS presets; compress-pdf/compress-image
serve the same exam-form need. Searches like "photo resize 20kb to 50kb for ssc"
are high-intent and India-heavy. Make that visible to Google:

1. On `resize-image.html`, `compress-image.html`, `compress-pdf.html`: add a
   visible content section ("Resize for government forms — UPSC, SSC, IBPS")
   with a short honest paragraph per preset: what size/KB the form wants, that
   the preset sets it in one click, that files never leave the device.
   Wording must come from Phase 1 data, not guesses.
2. Verify every claimed preset ACTUALLY exists in the tool UI first (honesty
   gate — same rule as worksheets: never promise what the tool doesn't do).
3. Keep it a content section on the existing page — do NOT create separate
   thin preset pages yet. Separate indexable preset pages are Phase 5 territory
   (needs the SSR Function + curated allowlist per CLAUDE.md pSEO plan).

## Phase 3 — Content depth + HowTo (cheap wins)

1. Deepen the thinnest pages (merge-pdf 382 words is the floor; audit ranks the
   rest). Add 150–250 genuinely useful words per weak page: when you'd use it,
   limits, privacy (client-side), quality notes. Natural language, no stuffing —
   the worksheet prose is the tone reference.
2. Add a visible "How to use" 3–4 step block to each tool page + matching HowTo
   JSON-LD. 🚨 STRUCTURED-DATA RULE (CLAUDE.md): HowTo/FAQPage JSON-LD is only
   allowed when the SAME steps are visible on the page. Steps must describe the
   real UI (verify button labels before writing).
3. Keep FAQ/LD in sync — any FAQ text edit must be mirrored in the JSON-LD block.

## Phase 4 — Cross-site internal links (30 min)

1. Blog posts → tools, where contextually honest (e.g. petrol/gold posts that
   mention documents could link compress-pdf; don't force irrelevant links).
2. Worksheet cluster → tools hub: one line on `/worksheet`'s page-info ("Need to
   compress or convert the PDF you just made? → /tools") and, if sensible, a
   tools chip in the landing pages' `.morelinks` row.
3. Homepage already links the hub — no change needed there.

## Phase 5 — Share-URL SSR Function (infra, medium priority)

Mirror of `functions/worksheets/[slug].js` for `/tools/<tool>/<slug>`:

1. Build `functions/tools/[tool]/[slug].js`: fetch the tool's static HTML via
   `env.ASSETS.fetch`, parse the slug with the SAME logic as `tools/tool-seo.js`
   (TSeo) — byte-for-byte, or previews drift from client hydration.
2. Inject per-slug `<title>/<meta description>/og:*/twitter:*` via HTMLRewriter;
   set `robots: noindex, follow` on ALL share slugs (single-hub strategy — tool
   pages are the ranking targets, share URLs are share primitives).
3. Do NOT emit JSON-LD from the Function; strip nothing unless duplicate-content
   testing shows a need (tool pages have no big shared About block like
   sheets.html did).
4. ⚠️ Check `_redirects` FIRST: the current `/tools/<tool>/<slug>` 200-rewrites
   must be REMOVED for the Function to run (a matching _redirects rule preempts
   Functions — this exact class of bug cost 5 hours once; read the warning
   comments in `_redirects` before touching anything).
5. Test locally with wrangler AND verify in production after deploy — local
   wrangler discovers Functions differently than the real edge (see CLAUDE.md
   "Root directory" warning).

## Phase 6 — Curated indexable preset pages (future, data-gated)

Only if Phase 1 data shows strong volume for specific presets (e.g. "upsc photo
resize"): hand-curate 3–5 preset slugs into an INDEXABLE_PRESETS allowlist,
served index,follow by the Phase 5 Function, added to sitemap. This is the
dormant CLAUDE.md pSEO plan — small, curated, never auto-scaled. Requires
Phase 5 shipped first. Don't start here.

---

## Verification checklist (every phase)
- [ ] curl each touched URL: 200, `index, follow` (pages) / `noindex, follow`
      (share slugs), correct canonical
- [ ] FAQ/HowTo JSON-LD text === visible text (grep both occurrences)
- [ ] word-presence audit re-run after edits
- [ ] no shared `.js`/`.css` edited without `node tools/stamp-assets.js`
- [ ] `node tools/build-sitemap.js` if any indexable URL added
- [ ] commit + push = deploy; spot-check production, not just wrangler

## Effort estimate
| Phase | Effort | Blocked by |
|---|---|---|
| 1 Keyword data | ~1h (user pull + parse) | user's Keyword Planner access |
| 2 India presets | ~1–2h | Phase 1 |
| 3 Depth + HowTo | ~2h (8 pages) | Phase 1 (wording) |
| 4 Internal links | ~30min | — |
| 5 SSR Function | ~2–3h incl. prod verify | — (independent) |
| 6 Preset pages | ~2h | Phases 1 + 5 |
