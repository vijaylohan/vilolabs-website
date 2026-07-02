# ViLoLabs Website — Project Context

## Who I Am
Solo independent developer based in India. Operating under the brand **ViLoLabs**.
No company/registered entity — individual developer. Budget-conscious, legally cautious.

## Project Structure
Two top folders: **ViLoLabs** = active dev/site/assets · **Resources** = reference-only.
```
E:\Website\
├── CLAUDE.md                  ← this file (project root)
├── .claude/launch.json        ← preview config (runs ViLoLabs/server.js)
│
├── ViLoLabs/                  ← ACTIVE PROJECT — dev, website, worksheets, assets
│   ├── Website HTML/          ← MAIN DEPLOYABLE FOLDER (Cloudflare Pages root)
│   │   ├── index.html         ← Main website
│   │   ├── sheets.html        ← ViLo Worksheets tool
│   │   ├── privacy/terms/cookies.html
│   │   ├── worksheet-sample-*.html, *-sample.html  ← worksheet samples
│   │   └── assets/
│   │       ├── library/       ← clipart PNG library (23 category folders)
│   │       ├── emoji/         ← Fluent Color emoji SVGs (extracted)
│   │       ├── pages/         ← page assets (maze/trace/coloring/dot-to-dot)
│   │       └── library.json   ← generated registry the web page reads
│   ├── tools/                 ← Node build scripts (build-all.js etc.)
│   ├── server.js              ← local dev server (port 3456)
│   ├── activity-catalog.md    ← worksheet activity spec
│   └── package.json, node_modules/
│
└── Resources/                 ← REFERENCE ONLY (not deployed, not in build)
    ├── Worksheet/             ← sample worksheet PDFs/PNGs
    ├── Image creation/        ← raw emoji download + old source images
    ├── library-originals-backup/  ← pre-processing image backups
    └── trials/                ← old prototype html files
```

## Asset / build workflow
- Add new images into the right `ViLoLabs/Website HTML/assets/library/<cat>/` folder
- Then run ONE command:  `cd ViLoLabs && node tools/build-all.js`
  (cleans backgrounds, matches emoji, updates lists, rebuilds library.json)

## ⚠️ Cache-busting shared JS/CSS (REQUIRED after editing them)
Cloudflare Pages hard-caps `.js`/`.css` at `max-age=14400` (4h) and `_headers`
CANNOT override it (verified). So after editing ANY shared front-end file —
`assets/share.js`, `assets/share.css`, `assets/db.js`, `worksheets/worksheet-seo.js`,
`tools/tool-seo.js`, `tools/shared.css`, `blog/shared/blog.css` — you MUST run:
```
node ViLoLabs/tools/stamp-assets.js
```
It stamps a content-hash `?v=<hash>` on every reference across all HTML, so the
new version reaches returning visitors INSTANTLY (the URL changes). Forgetting
this = pushed fixes don't reach returning users for up to 4h. HTML, JSON
(library.json, seo-keywords.json) and `_headers`-controlled files are already
always-revalidate, so only the shared JS/CSS need the stamp.
- `ViLoLabs/Website HTML/_headers` = cache policy + security headers (Cloudflare Pages).

## Running Local Preview
```powershell
# From E:\Website
node ViLoLabs/server.js
# Opens at http://localhost:3456
```
Preview is also wired up in Claude Code via `.claude/launch.json` — use the Preview pane.

## Design System
| Token | Value | Usage |
|-------|-------|-------|
| `--char` | `#1A1108` | Page background |
| `--cream` | `#F5F0E8` | Primary text |
| `--gold` | `#C8963C` | Accents, headings |
| `--gold2` | `#E8BC72` | Lighter gold highlights |
| `--brown3` | `#A07860` | Muted text |

**Fonts:** Cormorant Garamond (serif headings) + Outfit (body/UI)
**Style:** Dark luxury, premium minimal, gold accents throughout

## Site Sections (index.html)
1. Nav — sticky, glassmorphism on scroll, mobile hamburger
2. Hero — two-column, SVG illustration, CTA buttons
3. Ticker — scrolling marquee strip
4. Tools ("Live Tools") — ViLo Worksheets (01) + ViLo Pulse (02) + ViLo Tools (03) — all live
5. Coming Soon ("The Lab") — ViLo Apps (04, coming soon) ONLY (Tools moved up to Live Tools)
6. About — quote, body, values cards
7. Newsletter — email signup (coming soon overlay)
8. Stats strip — animated counters
9. Contact — form (coming soon overlay) + contact info
10. Footer — brand, links, social icons, legal

## What's "Coming Soon" (not yet live)
- **ViLo Apps** (Android apps) — `app.html`, "Coming Soon" card
- **Newsletter form** — has frosted overlay, not functional yet (branded "ViLo Pulse" — Pulse/Signal are the same)
- **Contact form** — has frosted overlay, not functional yet
- **hello@vilolabs.com** — marked "soon", not active
- **Social media** (Twitter/X, LinkedIn, Instagram) — all marked "soon"

## What's Live and Working
- **ViLo Worksheets** → `sheets.html` (fully functional generator, slug-share via Supabase, Math Master + Picture Math + 4 circle-the-right-one activities + colouring + tracing + maze + dot-to-dot + mix, page-count selector 5–15, page-1 promo-QR block, ready bar, in-print legibility tuned)
- **ViLo Pulse** (blog) → `pulse.html` + posts in `/blog/` — LIVE, "Live" badge, 3 posts (gold prices, petrol ×2)
- **ViLo Tools** → `tools.html` hub + 8 tools live: Image-to-PDF, PDF-to-Image, PDF-to-Word, Merge-PDF, Compress-PDF, Compress-Image, Resize-Image, QR-Generator
- **Legal pages** — privacy.html, terms.html, cookies.html (all linked)
- **Pinterest infra** — `tools/pinterest-build-pin.js` (daily pin renderer) + `tools/gen-pinterest-schedule.js` (28-day plan generator); Pinterest domain verification meta tag in `<head>`
- **Sitemap** — generated by `tools/build-sitemap.js` (17 static + curated worksheets + tool shares)
- All navigation scroll links
- Particle animation, cursor (desktop only), scroll reveals
- Stats counter animation
- Back-to-top button
- Mobile responsive layout

## CSS Architecture
- All styles are in a single `<style>` block in index.html
- Premium UI overhaul block added at end of style tag (clearly marked)
- Key CSS classes:
  - `.na` — unavailable/greyed out, pointer-events:none
  - `.na-wrap` / `.na-badge` — "soon" badge wrapper
  - `.cs-wrap` / `.cs-overlay` — coming soon frosted overlay on sections
  - `.rv` / `.rvl` / `.rvr` — scroll reveal animations
  - `.btn-mag` / `.btn-fill` / `.btn-outline` — button styles
  - `.tool-row` — two-column tool layout
  - `.coming-card` — coming soon project cards

## Deployment
**Platform:** Cloudflare Pages (free tier, unlimited bandwidth, India edge in Mumbai/Chennai). Migrated off Netlify on launch.
**Method:** Git-connected — push to `main` and Cloudflare Pages auto-builds + deploys.
**Update process:** `git commit` + `git push` → live in ~30 seconds.
**Rollback:** Cloudflare Pages dashboard → Deployments → pick previous deploy → "Rollback to this deployment".
**Critical files in the Pages root:**
- `_headers` — security headers + cache policy (note Pages' hard 4h cap on `.js`/`.css`, see cache-busting block above)
- `_redirects` — pretty-URL rewrites for `/worksheets/<slug>` and `/tools/<tool>/<slug>` (read the in-file warnings before editing — every rule there was learned from a production bug)

## Domain
- **Live on `vilolabs.in`** (TLD `.in`). Email: `hello@vilolabs.in` (not provisioned yet — alias still TBD).
- Launched + domain-switched: commit `219be47` — every `vilolabs.netlify.app` → `vilolabs.in` across sitemap, JSON-LD, canonicals, og:url, og:image.
- DNS on Cloudflare (free). Registrar = Porkbun / Hostinger (Cloudflare Registrar does NOT sell `.in`).
- Three roles stay separate: **Registrar** (who you renew with) ≠ **DNS** (Cloudflare) ≠ **Host** (Cloudflare Pages).

## Infrastructure & Scaling Plan (future-ready, pick-once-never-migrate)
**Guiding principle:** choose a base whose *static* tier and *dynamic/backend* tier are the
SAME platform, so going from static → server-side never forces a re-platform. Stay free while
static; add paid pieces only when a real need appears. Keep the "client-side first, files never
leave the device" philosophy — most tools need NO backend.

**Three separate roles (never conflate):**
- **Registrar** = who you pay yearly for the name (Porkbun / Hostinger). ~₹800/yr.
- **DNS** = phonebook pointing name → host (Cloudflare, free).
- **Host** = where files live (Cloudflare Pages, free).
You can buy the domain ANYWHERE and still host free on Cloudflare. Connect by changing the
registrar's nameservers to Cloudflare's (adds the domain to Cloudflare's free plan). Hosting
stays ₹0; only the registrar renewal costs money.

**Chosen base: Cloudflare** (free tier generous, India edge = Mumbai/Chennai, cheapest at scale)
| Need | Service | Notes |
|------|---------|-------|
| Static site (now) | **Cloudflare Pages** | free, unlimited bandwidth, free auto-SSL, 500 builds/mo |
| Server logic / APIs / non-static pages | **Workers / Pages Functions** | add backend WITHOUT moving hosts |
| File / PDF / image hosting at scale | **R2 storage** | *zero egress fees* — proper replacement for the Google-Drive PDF workaround |
| Database + Auth | **Supabase** (already wired in via `assets/db.js`) | Postgres + Auth + RLS; never roll own auth |
| Bot protection on forms | **Cloudflare Turnstile** | free, already in security checklist |
| AI-powered tools (future) | **Workers AI** | run models at edge, pay-per-use |
| Payments (future) | **Razorpay** (India-first) | UPI/cards; never see card numbers |

**Phased rollout (don't over-build early):**
- Phase 0 (now): Static on Pages + Supabase. Cost = domain only.
- Phase 1 (forms live): Pages Function or Formspree + Turnstile. ~free.
- Phase 2 (host files/PDFs): move to R2 (no egress fees). cheap.
- Phase 3 (accounts/payments): Supabase Auth + Razorpay. pay at real usage.

**Honest ceiling:** Workers are great for light/medium serverless. For HEAVY long-running
compute (big video/ML jobs) add ONE cheap box (Hetzner VPS / Google Cloud Run) alongside
Cloudflare — edge case; avoid by keeping tools client-side.

**Cost reality:** ~₹800/year (domain) until real scale; everything else free-tier, pay-as-you-grow.

## Forms (not yet wired up)
- Contact form: `handleContact()` in index.html — currently fakes success
- Newsletter: `handleNewsletter()` in index.html — currently fakes success
- When ready to activate (on Cloudflare Pages):
  - **Cloudflare Pages Function** (`functions/contact.js`) → forward to Resend/Postmark; pair with Turnstile
  - **Formspree**: free 50 submissions/month, no card needed (zero-code alternative)

## Legal Pages
All three pages protect the operator as an individual developer:
- Liability capped at ₹1,000
- "As Is / As Available" disclaimer
- India governing law (IT Act 2000)
- Solo developer declared upfront
- No warranty of any kind

## User-awareness principle (always apply on new pages/tools)
Every page or tool that generates output the user might rely on (PDFs, images, QR codes, worksheets, extracted text, calculations) MUST include:
1. **Visible in-context tip** at the point of action — gold ⓘ icon, "Tools can make mistakes" lead, page-specific advice (e.g. "scan the QR with your phone before printing"). Use `.use-tip` class (tools/shared.css) for tool pages, `.gen-tip` on sheets.html.
2. **Footer disclaimer** — italic, low-contrast, sits under © line. `.disclaimer` class in shared.css; inline-styled on index/app/sheets.
3. **Hide visible tips from print/PDF** — add the tip's class to existing `@media print` and `.pdfmode` rules so they don't appear on printed worksheets or generated documents.

Wording must be page-specific (not generic). Don't be alarmist — italic, muted styling, gold ⓘ. The brand promise is "reliable, repeatable, responsible" — responsible = honest about limits. See `memory/principle_transparency.md` for the full pattern.

## User-data readiness checklist (DO NOT SKIP when going beyond static)

Today the site is **100% static, no user data leaves the device**. The threat model is correspondingly tiny. The moment we accept ANY user input that crosses the network — even one email — the checklist below applies. Walk through it in order; don't skip a tier.

### Tier 1 — Contact / newsletter form goes live
- [ ] Use **Cloudflare Pages Function** (write thin `functions/contact.js` → Resend/Postmark) OR **Formspree** (free 50/mo, zero code). Never write a custom auth-laden form handler.
- [ ] Add a hidden honeypot field: `<input name="bot-field" style="display:none">`. Reject submissions where it's filled.
- [ ] Add **Cloudflare Turnstile** (free, invisible captcha) on the form. ~30 min.
- [ ] Update privacy.html: add a paragraph stating what email is collected, why, and how to unsubscribe / delete.
- [ ] Add an "I agree to the privacy policy" checkbox on the form (required, default unchecked). Log timestamp + IP of the submission.
- [ ] Add `/contact` email address that handles deletion requests. Actually act on them.

### Tier 2 — User accounts / saved data
- [ ] Decide: can this be solved with **localStorage / IndexedDB** (browser-only, no server, no risk)? If yes, do that. No further checklist needed.
- [ ] If you need real cloud storage: use **Supabase** or **Firebase**. Never roll your own auth.
- [ ] Never store passwords. The provider does bcrypt/argon2 — that's their job.
- [ ] Enable email verification. Required.
- [ ] Turn on rate limiting on login/signup in the provider dashboard.
- [ ] Supabase: write **Row Level Security** policies so the DB enforces who sees what. Don't rely on app code.
- [ ] Provider SDK handles `HttpOnly`, `Secure`, `SameSite=Lax` cookies — verify these are set, don't override.

### Tier 3 — Payments / paid plans
- [ ] Use **Razorpay** (India-first) or **Stripe** (international). Never see card numbers — embed their iframe.
- [ ] Verify webhook signatures on every callback. The provider docs show how.
- [ ] Provider handles PCI compliance.
- [ ] Add a refund policy page (legal requirement in India for online transactions).

### Tier 4 — File uploads accepted to server
- [ ] Whitelist MIME types AND check magic bytes server-side. Never trust file extension.
- [ ] Enforce max file size server-side (not just client-side).
- [ ] Virus scan uploads — **Cloudinary** scans automatically, or run ClamAV on a Cloudflare R2 worker.
- [ ] Serve uploaded files from a different subdomain than the app. No execute permissions on the bucket.

### Always — add the day forms go live
- [x] `_headers` file at Cloudflare Pages root with: `Content-Security-Policy`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()` — **shipped**, audit when adding forms to make sure CSP `connect-src` allows the form endpoint.
- [x] HTTPS-only (Cloudflare Pages default, force-redirect HTTP).

### Privacy law triggers — know when which applies
| Law | Trigger | Minimum response |
|---|---|---|
| **India DPDP Act 2023** | ANY personal data of Indian users | Consent at collection, stated purpose, deletion on request, breach notice within 72h |
| **GDPR** | ANY EU user (residency, not citizenship) | All of above + right-to-access + data portability + named lawful basis |
| **CCPA** | California user + you "sell" data | "Do not sell my data" link (you don't sell, so just declare it) |

**Practical minimum** when collecting anything: consent checkbox on every form, log consent timestamp+IP, honour deletion requests within 30 days.

### Pre-launch hardening (already shipped 2026-05-20)
The static site has the following in place — keep them in place during any rebuild:
- `robots.txt` (blocks aggressive SEO scrapers and AI training crawlers; references sitemap)
- `sitemap.xml` (14 pages, placeholder base URL — update when domain is registered)
- **SRI hashes** with `crossorigin="anonymous"` on every CDN script (pdf-lib, pdf.js, qrcode-generator, jsPDF, html2canvas). If a CDN ever gets compromised, browsers refuse the tampered script instead of running it on users.
- Filename HTML-escaping in tool UIs (image-to-pdf, merge-pdf) — closes the self-XSS hole in `alt` / `innerHTML` paths.

## PDF Strategy
- Sample PDFs are in `Worksheet/Sample/` — large files (17–27 MB each)
- Do NOT commit or host PDFs directly in the Pages bundle (build-time bloat, cold-cache hit on India edge)
- Cloudflare Pages bandwidth is unlimited, but R2 is the right home for static PDF assets when we ship them (zero egress, signed URLs available)

## Known Remaining Gaps (to fix when ready)
1. ✅ `og:image` / `twitter:image` — DONE, per-page BESPOKE cards. Each page points to its own 1200×630 card in `assets/og/`. Absolute URLs now use `https://vilolabs.in/...`.
   - Generic fallback `assets/og-image.jpg` still exists; the blog TEMPLATE + sample/trial pages use it, so a NEW blog post starts with the generic card.
   - **Cards are STATIC** — a new blog post needs its card regenerated (titles are auto-read, but rendering uses a browser canvas, not pure node). Regeneration = re-run the browser-canvas batch (ask Claude / future `tools/og-cards.html` generator). TRUE auto-per-post = Option C (Cloudflare Pages Function) — see pSEO section, same Function does both.
2. ✅ `sitemap.xml` — shipped, generated by `tools/build-sitemap.js`, base URL `https://vilolabs.in/`.
3. ✅ `robots.txt` — shipped.
4. ✅ `<link rel="canonical">` — DONE on all static pages with `https://vilolabs.in/` base. **pSEO slug pages still set their own canonical via JS only** — the missing Cloudflare Pages Function is the fix (see pSEO section).
5. Contact form backend — Cloudflare Pages Function (`functions/contact.js`) or Formspree.
6. Newsletter backend — Mailchimp or ConvertKit free tier.
7. Social media URLs — when accounts are created. Drop URLs into the `sameAs` array of the homepage Organization JSON-LD (clear template + activation note already embedded in `index.html` head — search for "TO ACTIVATE SOCIAL PROFILES"). Also flip the hidden `display:none` on the footer + contact "Follow" blocks. ONLY add real, claimed URLs that link back; fake/speculative `sameAs` hurts knowledge-panel trust.
8. Real email (`hello@vilolabs.in`) — when email is set up.
9. ✅ Pinterest domain verification — meta tag in `<head>` of `index.html` (commit `a447985`). Account claim still TODO inside the Pinterest dashboard.
10. **🚨 BIGGEST OPEN SEO GAP — server-rendered per-slug meta.** No `functions/` folder exists yet. Without it, every `/worksheets/<slug>` URL serves identical static HTML; per-slug meta is JS-only. This is what's causing Pinterest's spam classifier to flag pin destinations as duplicates, AND what's keeping Google from indexing curated slugs as distinct pages. See pSEO section — building `functions/worksheets/[slug].js` is the single highest-leverage SEO work left.

## pSEO — server-side rendering plan (post-Cloudflare migration)
The dynamic slug pages today set their title/description/canonical via JavaScript:
- `/worksheets/<slug>` — handled by `worksheets/worksheet-seo.js` (WSeo)
- `/tools/<tool>/<slug>` — handled by `tools/tool-seo.js` (TSeo)
This means social scrapers (WhatsApp, Facebook, X) and slow-rendering crawlers see only
the generic page meta, NOT the per-slug meta. Google's JS rendering does eventually
pick it up, but it's slower and riskier than server-rendered HTML.

**The fix (post-Cloudflare migration):**
- Build a **Cloudflare Pages Function** at `functions/worksheets/[slug].js` (and `functions/tools/[tool]/[slug].js`).
- On request, function reads the slug, fetches the curated keyword/preset from Supabase or a static JSON map, injects the right `<title>`/`<meta>`/`<link rel=canonical>`/`og:image` into the static HTML shell, returns it.
- Browser-side JS still runs for the interactive experience — but the **first response** is fully SEO-correct.
- Same approach used by Vercel/Cloudflare for ISR-style static sites.

**Curated indexable slugs (the other half):**
- Today, every `/tools/<tool>/<slug>` generated by a user creates a Supabase row, which the sitemap picks up. That's "user-generated indexable URL" territory — risky for thin-content penalties.
- Solution: maintain a hand-curated allowlist of **high-value canonical preset slugs** (e.g. `upi-payment-qr-shop`, `indian-passport-photo-resize`, `a4-portrait-pdf`, `compress-for-email`, `addition-worksheets-grade-1-animals`) → these are the ONLY slugs added to sitemap.xml + given a server-rendered page + marked `index, follow`.
- All other dynamic slugs (random-seed worksheets, one-off tool shares) get `<meta name="robots" content="noindex">` — they still work for the user, just don't pollute the index.
- Where: extend `worksheets/worksheet-seo.js` + `tools/tool-seo.js` with an `INDEXABLE_PRESETS` map; have the Pages Functions only inject `index, follow` when the slug matches that map.

**Status:** SSR Function shipped at `functions/worksheets/[slug].js`. Reads `<slug>`, parses via the same logic as `assets/worksheet-seo.js`, looks up `assets/seo-keywords.json`, uses `HTMLRewriter` to inject per-slug `<title>` / `<meta description>` / `<link rel="canonical">` / `og:*` / `twitter:*` / `LearningResource` JSON-LD into the streamed `sheets.html`. Replaced the old `/worksheets/* → /sheets 200` rewrite in `_redirects` (DO NOT re-add — it would preempt the Function). Same pattern for `functions/tools/[tool]/[slug].js` is still TODO.

**Index gate (the "tier" mechanism):** `seo-keywords.json.indexable_presets` is the hand-curated allowlist. Slugs in it get `robots: index, follow` from the Function + appear in `sitemap.xml` via `tools/build-sitemap.js`. Every other parseable slug (every user-generated share URL, every variant seed) gets `robots: noindex, follow` — protects against duplicate-content drag while keeping share UX intact. Client-side regenerate path in `sheets.html` calls `_wsSyncSeoMeta(absUrl, title, desc, isIndexable)` which re-syncs every meta tag including robots to whatever the new URL deserves.

**🚨 HONESTY CONSTRAINT on indexable_presets (hard-won — read before adding any new entry):**
The engine in `sheets.html` only produces SINGLE-ACTIVITY worksheets for `colouring`, `maze`, `sudoku` modes. Every other mode (`prekg`, `kg`, `grade-1` through `grade-5`) produces a MIX worksheet containing ~20 different activity types. See `_wsCurrentConfig()` at sheets.html:1839 and the "HONESTY" comment block. **Consequence for SEO:** an indexable slug must match what `_wsCurrentConfig()` actually returns for that mode. Adding e.g. `letter-tracing-preschool-...` to the allowlist breaks the restore loop — `_wsCurrentConfig` returns activity='mix' for prekg → engine builds a mix sheet → `_wsUpdateUrlAfterGenerate` rebuilds the slug as `free-printable-worksheets-preschool-...` → URL silently morphs → Google measures bounce → demotion. Only these slug shapes are safe to put in the allowlist:
- `coloring-pages-for-kids-{category}-{seed}` (colouring + animals/fruits/objects)
- `maze-worksheets-for-kids-{seed}` (maze, no category)
- `sudoku-for-kids-{seed}` (sudoku, no category)
- `free-printable-worksheets-{grade-slug}-{category}-{seed}` (mix at any grade, any valid category from LEVEL_TOPICS)
- `free-printable-worksheets-{grade-slug}-{seed}` (mix at any grade, no theme — 35% of grade-1-5 sheets)

To target high-volume single-activity queries like "letter tracing worksheet pdf" or "addition worksheet class 1", we'd need to ADD single-activity modes to sheets.html (call it a "letter-tracing-only at prekg" engine path). That's a 1-2 week build per mode — deferred Year-1 work, not Week-1.

**🚨 STRUCTURED DATA SAFETY (hard-won — read before re-adding JSON-LD types):**
Google's docs explicitly require `FAQPage` and `HowTo` JSON-LD to have **matching visible content on the page**. Emitting them invisibly is classified as "spammy structured data" and can trigger a manual action that demotes the entire domain. We tried this once (Move 2.2 → 2.3) and rolled it back. **Current architecture (as of 2026-07-02):** all JSON-LD (`LearningResource`, `HowTo`, `FAQPage`, `BreadcrumbList`) lives as static `<script>` tags directly in `sheets.html`'s `<head>`, matched by real visible content in the `.page-info` section below the generator. The Cloudflare Function at `functions/worksheets/[slug].js` (for `/worksheets/<slug>` share URLs) emits **zero JSON-LD of its own** — it only swaps `<title>`/`<meta description>`/`og:*`/`twitter:*` for the share-preview, and actively **strips** the `.page-info` section + all JSON-LD `<script>` tags from share URLs via `HTMLRewriter` (see the `#pageInfo` and `script[type="application/ld+json"]` removal handlers). This keeps every share URL's visible content genuinely unique per Pinterest pin (no shared "About" wrapper across pins) while keeping structured data 100% truthful (it only describes `/worksheet`, the one page it actually lives on).

**RANKING-TARGET STRATEGY (decided 2026-06-28, URL renamed 2026-07-01):**
Concentrate ranking effort on **one** home/hub URL — `/worksheet` (the pretty-URL for `sheets.html`; old `/sheets` and `/sheets.html` 301-redirect to it, see `_redirects`). Every `/worksheets/<slug>` URL is `noindex,follow` forever — share primitive only, never a ranking target. Reason: a single content-rich page is dramatically easier to rank than scattered curated slugs, link equity concentrates, and the user experience matches search intent ("free worksheets" → land on a page WITH the generator embedded, not a slug-specific result).
- The visible keyword content + matching `HowTo` + `FAQPage` JSON-LD lives on `/worksheet` directly, below the generator UI (tool stays above-the-fold; content lives below for crawlers).
- The 10-entry `indexable_presets` allowlist in `seo-keywords.json` is dormant — kept only as a possible Pinterest pin-targeting list, not read by the Function or sitemap builder anymore.
- All Pinterest pins should point at `/worksheet` (the canonical hub) — never at a `/sheets` URL (dead redirect target for a fresh Pinterest pin, looks like link rot to their spam classifier).

— END OF pSEO SECTION —

## Image SEO (Google Images) — started 2026-07-02

**Goal:** get worksheet preview pictures appearing in Google Images search, all funneling back to `/worksheet` (never a separate page — see "why not a separate gallery page" below).

**Shipped so far:**
- `tools/render-hero-screenshot.js` — one-time script, captures the `/worksheet` level-picker screen (all 11 activity cards + page-count slider) as a branded thumbnail. Injects a gold badge ("Unlimited free generations — every click makes a brand-new worksheet, 5 to 15 pages each") via a temporary DOM insert before capture, crops tight to badge+cards+slider, pads with a clean solid-color margin via `sharp` (NOT by expanding the capture rect — expanding the rect picks up stray neighboring text/buttons; padding after capture is the safe way). Outputs WebP.
- **Real bug fixed** in `tools/render-worksheet-png.js` (the daily Pinterest pin renderer): `evalJson()` was missing `awaitPromise:true` on the CDP `Runtime.evaluate` call, so it was serializing the pending Promise (`JSON.stringify(pendingPromise)` → literal `"{}"`) instead of waiting for the async capture to resolve. This silently broke the html2canvas capture step. Fixed — now uses `awaitPromise:true` + `returnByValue:true`, no manual `JSON.stringify`/`JSON.parse` needed.
- **`assets/hero/worksheet-picker.webp`** — the finished hero image, small (128px `.mini-card` thumbnail, ~50KB), lives in a `.mini-gallery` container inside `.page-info` on `/worksheet`, right after the "Worksheet types we support" chip list.
- **Image sitemap support** added to `tools/build-sitemap.js` — `STATIC` entries can now carry an `images: [{loc, caption}]` array; `urlEntry()` emits Google's `<image:image>` extension nested inside the `/worksheet` `<url>` block. `xmlns:image` namespace added to the `<urlset>` tag.

**The 50/500 gallery-cap architecture (documented in-code at `sheets.html`, search for "CAP handling" and "HARD CEILING" comments near `#wsGallery`):**
- First 50 `.mini-card` tiles show immediately; a "See more worksheets" / "Show less" toggle button (`_wsToggleGallery()`) reveals/hides the rest via a CSS class (`mg-hidden`), never a fetch — Googlebot doesn't click buttons, so anything gated behind a click-triggered fetch would never get crawled. Every card that exists stays physically present in the real HTML at all times.
- **Hard ceiling: 500 cards max, ever, all on `/worksheet`.** When automation adds a new card past 500, it must **retire the oldest one** first (remove from HTML + sitemap + Supabase) — never just hide it. 500 is inside Google's documented image-sitemap limit (1,000 images per `<url>` entry).
- **Why not a separate `/worksheets/generated` gallery page:** would need its own `index,follow` status for its images to be trusted by Google Images, creating a second indexable URL competing with `/worksheet` — breaks the single-ranking-page strategy above. Also breaks "Google Images click lands directly on the tool" (would land on the gallery page instead, one extra hop away).

**NOT yet built — the auto-capture pipeline (paused 2026-07-02, resume here):**
Trigger: a real visitor clicks **Share or Print** (not every Generate click — that's the quality filter) on a **Colouring, Maze, or Sudoku** worksheet (single-focus activities only — matches the existing single-vs-mix HONESTY constraint above; Math Master inclusion undecided, ask before building). Capped at **5 new captures per day**.

Planned architecture (not started):
1. New Supabase table for captured-image metadata (image URL, alt text, source worksheet slug, activity type, captured timestamp) — **I only have the public anon key in this codebase, not admin/service-role access.** Creating the table requires the user to run one SQL script in the Supabase dashboard themselves.
2. Image storage: **undecided** — Supabase Storage (already connected, zero new setup) vs Cloudflare R2 (zero egress, but needs new bucket + token setup first). Revisit next session.
3. Capture step: reuse the `html2canvas` call `sheets.html` already runs for PDF export — trigger it at the moment of Share/Print click, upload the resulting image blob client-side.
4. A new Cloudflare Pages Function receives the upload, re-validates activity type + daily cap + 500-total cap server-side (client-side checks alone aren't trustworthy), stores the image, retires the oldest card if at 500.
5. `/worksheet`'s gallery section needs to become **dynamic** (Function-rendered per request, same `HTMLRewriter` pattern as `functions/worksheets/[slug].js`) instead of static HTML, so new captures appear without a manual `git push`.
6. Sitemap also needs a dynamic or periodically-regenerated path to pick up new images automatically.

Each gallery card should carry a small "Generate this worksheet" link underneath pointing at that image's real `/worksheets/<slug>` URL (opens in a new tab) — proposed by the user as clearer than making the whole thumbnail clickable.

— END OF IMAGE SEO SECTION —

## Developer Notes
- **Do NOT rewrite the full file** — always use targeted edits (Edit tool)
- **Grep before editing** — find exact line numbers first
- SVG illustrations are inline in index.html (lines ~380–910) — avoid touching these
- The file is 1300+ lines — read in slices of 50–100 lines at a time
- All legal pages share the same CSS pattern — copy from privacy.html as template
- sheets.html is a copy — original source is `Worksheet/WebCode HTML/sheets.html`
