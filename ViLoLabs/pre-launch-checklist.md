# ViLoLabs — Launch Plan & Checklist

**🪔 Launch date: Tuesday, 9 June 2026** — confirmed by user.
Decision: *all* technical work happens **on Jun 9 itself**. Jun 7 + Jun 8 = rest.

Last update: 2026-06-06.

---

## 🟢 INFRASTRUCTURE STATUS (as of Jun 6, 2026)

All plumbing **complete**. Site is live but **invisible** (canonical URLs still
point to `vilolabs.netlify.app`, sitemap not yet submitted to Google).

- ✅ Domain `vilolabs.in` registered at Hostinger
- ✅ Nameservers point to Cloudflare (`amber.ns.cloudflare.com`, `dakota.ns.cloudflare.com`)
- ✅ DNS propagated worldwide (verified via 1.1.1.1 and 8.8.8.8)
- ✅ Cloudflare Pages project `vilolabs-website` — auto-deploys from
      `github.com/vijaylohan/vilolabs-website` on push to `main`
- ✅ Build output directory: `ViLoLabs/Website HTML`
- ✅ HTTPS cert issued (subject: `vilolabs.in`, covers `www` via SAN)
- ✅ Apex `https://vilolabs.in/` serves the site
- ✅ `www.vilolabs.in` → apex 308 redirect (Cloudflare Redirect Rule, method-preserving)
- ✅ Pretty-URL rewrites (`/worksheets/<slug>`, `/tools/<tool>/<slug>`) working
      after `_redirects` fix (target directory paths, not explicit `.html`)
- ✅ All 15 main pages return 200 on the real domain
- ✅ Share component (`/assets/share.{css,js}`) deployed
- ✅ GitHub repo synced with local (commits: `c380443` infra batch, `77c710d` redirects fix)

---

## 🪔 LAUNCH-DAY SEQUENCE (Tuesday Jun 9, 2026)

User: do your rituals → say "Go" → I execute the prepared batch.
Claude: every step below is pre-scripted. Nothing experimental on launch day.

### Step 1 — User says "Go" (after rituals)

### Step 2 — Domain switch batch (Claude executes, ~3 min)

**PRE-STAGED INVENTORY (scanned 2026-06-06) — exact, not improvised:**

**TIER 1 — MANDATORY domain swap: `https://vilolabs.netlify.app` → `https://vilolabs.in`**
140 occurrences across 24 files. This single find-replace handles canonical
domains, sitemap `<loc>`, JSON-LD `@id`/`url`, `og:image`, `twitter:image`,
`PROMO_BASE` in sheets.html, and the robots.txt `Sitemap:` line all at once.

Exact occurrence counts per file:
```
index.html ............................... 10   sitemap.xml .............. 23
about.html ................................ 3   robots.txt ............... 1
app.html .................................. 3   sheets.html .............. 4
pulse.html ................................ 3   tools.html ............... 11
privacy.html / terms.html / cookies.html .. 3 each
blog/petrol-prices-india-2025.html ....... 11
blog/petrol-prices-neighboring-...-2026 .. 11
blog/gold-prices-india-2026.html ......... 11
blog/template/data-comparison.html ........ 2   blog/template/AI-PROMPT.md . 8
worksheets/index.html ..................... 2
tools/{image-to-pdf,compress-pdf,compress-image,merge-pdf,pdf-to-word,
       resize-image,qr-generator}.html .... 4 each (28 total)
```
NOTE: `og:image` is ALREADY absolute (`.../assets/og/home.jpg` etc.) — the
checklist's old "relative→absolute" note was stale. Domain swap is all it needs.
NOTE: `worksheet-seo.js` / `tool-seo.js` have NO hardcoded netlify URLs (verified) —
they build URLs from `location.origin`, so they auto-follow the real domain. No edit needed.

**TIER 2 — SHOULD (same day, after Tier 1, verify each with curl): drop `.html` from SEO URLs.**
Canonicals currently use `.html` (e.g. `vilolabs.in/sheets.html`) but Cloudflare
308-redirects `/sheets.html` → `/sheets`. A canonical pointing at a redirecting URL
is a minor SEO smell. Fix = strip `.html` so canonical == the final served URL.
Apply ONLY to canonical tags + sitemap `<loc>` + JSON-LD `url`/`@id` (NOT to
`og:image` .jpg paths, NOT to internal `href=` links, NOT to asset paths):
- `vilolabs.in/about.html`  → `vilolabs.in/about`
- `vilolabs.in/sheets.html` → `vilolabs.in/sheets`
- `vilolabs.in/blog/<x>.html` → `vilolabs.in/blog/<x>`
- `vilolabs.in/tools/<x>.html` → `vilolabs.in/tools/<x>`
- homepage canonical stays `vilolabs.in/`
Verify: each canonical URL must return 200 directly (not 308) via curl.
FALLBACK: if any Tier-2 edit looks risky at launch, ship Tier-1 only — a
canonical→308 is a smell, not a breakage. Tier-1 alone is a valid launch state.

**TIER 3 — NICE (same-day if time, else post-launch): add `og:url` per page.**
`og:url` is currently MISSING on every real page (only in AI-PROMPT.md template doc).
Add `<meta property="og:url" content="<same value as that page's canonical>">`
right after each canonical line. For JS-driven slug pages (worksheets/index.html,
sheets.html) set og:url alongside where canonical is set in JS.
Not a launch blocker — share cards work without it (they fall back to canonical).

### Step 3 — Orphan file cleanup (Claude executes, ~1 min)
Move 11 unlinked sample/trial files OUT of `ViLoLabs/Website HTML/` → `Resources/trials/`:

- `math-crossword-sample.html`
- `chai-reward-popup-sample.html`
- `app-icons-sample.html`
- `share-bar-sample.html`
- `worksheet-sample-emoji.html`
- `worksheet-sample-png.html`
- `matching-sample.html`
- `matching-trial.html`
- `maze-trial.html`
- `maze-trial-26.html`
- `mixed-sample.html`

`Resources/` is already in `.gitignore` → files preserved locally, never deploy.
Effect: those URLs 404 publicly, hiding unfinished demos. Reversible.

### Step 4 — Commit + push (Claude executes, ~30 sec)
One single batched commit:
```
Launch: domain switch (netlify.app → vilolabs.in) + orphan cleanup

- All canonicals, sitemap, JSON-LD, og:url, og:image, twitter:image,
  robots.txt sitemap line, sheets.html PROMO_BASE → vilolabs.in.
- Added og:url per page (was missing on most).
- og:image switched from relative → absolute vilolabs.in URLs.
- Moved 11 unlinked sample/trial files to Resources/trials (not deployed).
```
Push to GitHub `main` → Cloudflare Pages auto-deploys in ~30 sec.

### Step 5 — Verify (Claude executes, ~2 min)
Re-run silent curl suite on `vilolabs.in`:
- Every key page returns 200
- Every canonical now reads `https://vilolabs.in/...`
- Sitemap `<loc>` entries all point to `vilolabs.in`
- www → apex 308 still works
- Pretty-URL rewrites still resolve
- No 404s introduced by the orphan move
- Share component still loads + sends `vilolabs.in` URLs

### Step 6 — Claude reports: "Site is officially home at vilolabs.in" ✅

### Step 7 — User: first visit 🙏
Open `https://vilolabs.in/` in a fresh browser tab. **First sight, save for this moment.**

### Step 8 — Submit to Google Search Console (Claude walks user through, ~5 min)
1. Go to `search.google.com/search-console`
2. Add property → URL prefix → `https://vilolabs.in/`
3. Verify via DNS TXT record (Cloudflare DNS handles it instantly)
4. Once verified → **Sitemaps** → submit `https://vilolabs.in/sitemap.xml`
5. That's the moment Google starts indexing — *the digital ribbon-cutting.*

### Step 9 — First share / first social
User decides where and how. WhatsApp family group, Twitter, LinkedIn, wherever.
Share component now sends `vilolabs.in` URLs by default — every share helps SEO.

### Step 10 — Done. 🎉

---

## 📅 BETWEEN NOW AND LAUNCH

### Sat Jun 6 → Mon Jun 8 — user: REST
- ❌ Don't visit `https://vilolabs.in/` in a browser (save first visit for Jun 9)
- ❌ Don't share the URL with anyone
- ❌ Don't post on social

### Claude does silently (read-only, no commits):
- **Sat Jun 7**: silent curl verification pass on `vilolabs.in` — confirm everything serves correctly on the real domain
- **Sun Jun 8**: pre-stage the Step 2 + Step 3 edit plan in working memory — every find-and-replace ready to fire as one batch. **No commits, no pushes. Nothing touches the live site.**

---

## 🟡 DEFER (not launch blockers — post-Jun 9)

- [ ] **Contact form** — currently fakes success. Use Netlify Forms / Formspree + Turnstile.
- [ ] **Newsletter form** — currently fakes success. Same approach.
- [ ] **Social `sameAs`** links (Twitter/LinkedIn/Instagram) — add to homepage Organization
      JSON-LD + un-hide footer/contact "Follow" blocks ONLY when real accounts exist.
- [ ] **PWA manifest** (`site.webmanifest` + icons) — optional; 10-min export of existing logo.
- [ ] **hello@vilolabs.in** — currently "soon"; activate when email is set up (Zoho Mail free / Hostinger / Google Workspace). Will need MX + SPF + DKIM + DMARC records added to Cloudflare DNS at that point.

---

## ✅ VERIFIED HEALTHY (2026-06-06)

- All 15 main pages return 200 on `vilolabs.in` (homepage, sheets, blog ×3, tools ×2, app, about, pulse, legal ×3, sitemap, robots)
- HTTPS cert valid + active
- `www.vilolabs.in/anything` 308-redirects to `vilolabs.in/anything` (path + query string preserved)
- Pretty URL rewrites: `/worksheets/<slug>` and `/tools/<tool>/<slug>` serve correct landing pages
- Share component (`/assets/share.{js,css}`) loads on every surface
- No `vilolabs.com` / `violabs` typos remain — all `.in`
- Legal pages (privacy/terms/cookies) clean, no stray emoji
- Petrol-blog slug 404 bug fixed (sitemap + JS aligned to `2025`)
- app.html emoji → branded SVG icons (6 swaps)

---

## 🔴 ALREADY FIXED THIS WEEK

- ✅ Petrol-blog slug 404 (sitemap + JS aligned to working `2025` slug)
- ✅ app.html emoji → branded SVG icons
- ✅ Worksheet header: Name/Date/Score lines with writable space, no auto-printed date
- ✅ Worksheet `size-order` activity: picks distinct objects per instance
- ✅ Worksheet `sort` activity: groups by real category (no more "A"/"B" labels)
- ✅ Branded share component with native-share, "create your own" tail, EN+HI labels, Supabase DB-register preserved
- ✅ `_redirects` for Cloudflare Pages (target directory paths, not explicit `.html`)
