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
│   ├── Website HTML/          ← MAIN DEPLOYABLE FOLDER (drag this to Netlify)
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
- **ViLo Worksheets** → `sheets.html` (fully functional tool)
- **ViLo Pulse** (blog) → `pulse.html` + posts in `/blog/` — LIVE, "Live" badge, 3 posts (gold prices, petrol ×2)
- **ViLo Tools** → `tools/` (Image-to-PDF live; PDF-to-image/resize/compress on the way)
- **Legal pages** — privacy.html, terms.html, cookies.html (all linked)
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
**Platform:** Netlify (free tier, no credit card)
**Method:** Drag and drop `Website HTML/` folder onto Netlify deploy zone
**Update process:** Edit files → drag folder again → live in 30 seconds
**Rollback:** Netlify Deploys tab → click old version → Publish deploy

**Future plan:** Migrate to Cloudflare Pages when adding PDFs/images
- Cloudflare Pages = unlimited bandwidth, fastest CDN, Mumbai/Chennai servers
- PDFs should go on Google Drive (not hosted on any web host)

## Domain
- **Chosen domain: `vilolabs.in`** (TLD is `.in`, NOT `.com`). Email: `hello@vilolabs.in`.
- Not yet registered — current live URL is `vilolabs.netlify.app` (placeholder used in sitemap + blog JSON-LD).
- Recommended registrar: **Porkbun** (card/PayPal, ~₹800/yr flat renewal, no upsells) OR
  **Hostinger** (UPI/netbanking if INR payment preferred). NOTE: Cloudflare Registrar does
  NOT support `.in` (ccTLD) — buy elsewhere, host/DNS on Cloudflare (see Infra plan below).
- DNS just needs to point to the host — works with any registrar (registrar ≠ host ≠ DNS)
- **LAUNCH-DAY DOMAIN SWITCH** (do only AFTER `vilolabs.in` DNS resolves): replace every
  `vilolabs.netlify.app` → `vilolabs.in` across `sitemap.xml`, ALL JSON-LD (homepage
  Organization/WebSite + every `/blog/*`), canonical tags, and og:url; switch the og:image meta from relative path to
  `https://vilolabs.in/assets/og-image.jpg`. Do NOT do this before DNS is live (dead-link SEO).

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
- When ready to activate:
  - **Netlify Forms**: add `netlify` attribute to `<form>` tag, done
  - **Formspree**: free 50 submissions/month, no card needed

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
- [ ] Use **Netlify Forms** (built-in, free 100 subs/mo) OR **Formspree** (free 50/mo). Never write a custom form handler.
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
- [ ] Create Netlify `_headers` file with: `Content-Security-Policy`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- [ ] Verify HTTPS-only (Netlify does this by default — confirm in dashboard).

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
- Do NOT commit or host PDFs directly on Netlify (bandwidth risk)
- Future plan: host PDFs on Google Drive, link from site

## Known Remaining Gaps (to fix when ready)
1. ✅ `og:image` / `twitter:image` — DONE, per-page BESPOKE cards (Option B). Each page points to its own 1200×630 card in `assets/og/` (e.g. `og/blog-gold-prices-india-2026.jpg`, `og/tool-qr-generator.jpg`, `og/home.jpg`). Design = real ViLo logo (`logo.svg`) + section label (PULSE/TOOLS/WORKSHEETS/LEGAL) + page title (auto-read from each page's `og:title`) + `vilolabs.in` footer. Absolute `https://vilolabs.netlify.app/...` URLs (switch to `.in` at launch).
   - Generic fallback `assets/og-image.jpg` still exists; the blog TEMPLATE + sample/trial pages use it, so a NEW blog post starts with the generic card.
   - **Cards are STATIC** — a new blog post needs its card regenerated (titles are auto-read, but rendering uses a browser canvas, not pure node). Regeneration = re-run the browser-canvas batch (ask Claude / future `tools/og-cards.html` generator). TRUE auto-per-post = Option C (Cloudflare Pages Function) — planned post-migration.
   - Still TODO: add `og:url` per page once domain is registered.
2. ✅ `sitemap.xml` — shipped (placeholder base URL — update when domain confirmed)
3. ✅ `robots.txt` — shipped
4. ✅ `<link rel="canonical">` — DONE on all 20 pages (static, placeholder `vilolabs.netlify.app` base — included in the launch-day domain switch). pSEO slug pages still set their own canonical via JS.
5. Contact form backend — use Netlify Forms or Formspree
6. Newsletter backend — use Mailchimp or ConvertKit free tier
7. Social media URLs — when accounts are created. Drop URLs into the `sameAs` array of the homepage Organization JSON-LD (clear template + activation note already embedded in `index.html` head — search for "TO ACTIVATE SOCIAL PROFILES"). Also flip the hidden `display:none` on the footer + contact "Follow" blocks. ONLY add real, claimed URLs that link back; fake/speculative `sameAs` hurts knowledge-panel trust.
8. Real email (hello@vilolabs.com) — when email is set up ✅ spelling confirmed: vilolabs.com

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

**Status:** documented but not built — needs Cloudflare hosting first.
9. ✅ Coming Soon cards — DONE: "Project Five" placeholder removed; Lab grid is ViLo Tools (live) + ViLo Apps (coming)

## Developer Notes
- **Do NOT rewrite the full file** — always use targeted edits (Edit tool)
- **Grep before editing** — find exact line numbers first
- SVG illustrations are inline in index.html (lines ~380–910) — avoid touching these
- The file is 1300+ lines — read in slices of 50–100 lines at a time
- All legal pages share the same CSS pattern — copy from privacy.html as template
- sheets.html is a copy — original source is `Worksheet/WebCode HTML/sheets.html`
