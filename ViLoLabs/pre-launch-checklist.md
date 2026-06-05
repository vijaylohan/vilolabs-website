# ViLoLabs — Pre-Launch Checklist

Run through this before deploying `Website HTML/` to the live domain.
Last audit: 2026-06-03.

---

## ⚠️ DO RIGHT BEFORE GOING LIVE (don't forget!)

### 1. Move orphan sample/trial files OUT of the deploy folder
These 10 files sit in `ViLoLabs/Website HTML/` but are **unlinked, unpolished
prototypes/demos**. They would ship as public, crawlable URLs and look sloppy.
Move them to `Resources/trials/` (reference-only, never deployed) just before launch.

> **Reminder to Claude:** before any "move to live / deploy" step, STOP and ask the
> user whether to move these 10 files first. Do not deploy with them in place.

Files to move (none are linked from any production page — verified):
- `math-crossword-sample.html`        ← this-session demo
- `chai-reward-popup-sample.html`     ← this-session demo
- `app-icons-sample.html`             ← this-session demo (icons already applied to app.html)
- `share-bar-sample.html`             ← this-session demo (share component already shipped to /assets/share.*)
- `worksheet-sample-emoji.html`       ← older prototype
- `worksheet-sample-png.html`         ← older prototype
- `matching-sample.html`              ← older prototype
- `matching-trial.html`               ← older prototype
- `maze-trial.html`                   ← older prototype
- `maze-trial-26.html`                ← older prototype
- `mixed-sample.html`                 ← older prototype

Effect: those URLs 404 on the live site (good — hides unfinished demos); files are
preserved in `Resources/trials/` for future reference. Fully reversible.

NOTE: CLAUDE.md project structure lists `worksheet-sample-*.html` / `*-sample.html`
as "worksheet samples" living in `Website HTML/`. Confirm with the user whether the
worksheet-sample ones are meant to be public before moving those specific files.

---

## 🔴 ALREADY FIXED (2026-06-03 audit)

- ✅ **Petrol-blog 404 slug.** Post registered in Supabase as `petrol-prices-india-2026`
  (line ~835) while the file is `petrol-prices-india-2025.html` → `/blog/petrol-prices-india-2026`
  would 404. Aligned slug + `sitemap.xml` to `2025` (the real, working slug). Title text
  about "2026 data" left intact.
- ✅ **app.html emoji → branded SVG icons.** 6 emoji (📝🧠🛠️✨▶️📥) replaced with gold
  line-icons matching the brand.

---

## 🟢 LAUNCH-DAY DOMAIN SWITCH (do ONLY after `vilolabs.in` DNS resolves)

Do NOT do this before DNS is live (dead-link SEO). One batched job:
- [ ] Replace every `vilolabs.netlify.app` → `vilolabs.in` across:
  - `sitemap.xml`
  - ALL canonical tags (every page)
  - ALL JSON-LD (homepage Organization/WebSite + every `/blog/*` article)
  - `og:url` / `og:image` / `twitter:image` meta
- [ ] Add `og:url` per page (currently missing).
- [ ] Switch `og:image` from relative path → absolute `https://vilolabs.in/assets/og-image.jpg`.

---

## 🟡 DEFER (not launch blockers — wire up when ready)

- [ ] **Contact form** — currently fakes success. Use Netlify Forms / Formspree + Turnstile.
- [ ] **Newsletter form** — currently fakes success. Same approach.
- [ ] **Social `sameAs`** links (Twitter/LinkedIn/Instagram) — add to homepage Organization
      JSON-LD + un-hide footer/contact "Follow" blocks ONLY when real accounts exist.
- [ ] **PWA manifest** (`site.webmanifest` + icons) — optional; 10-min export of existing logo.
- [ ] **hello@vilolabs.in** — currently "soon"; activate when email is set up.

---

## ✅ VERIFIED HEALTHY (2026-06-03)

- No console errors / failed network requests (index, sheets).
- No `vilolabs.com` / `violabs` typos — all `.in`.
- `robots.txt` + `sitemap.xml` present and valid.
- Legal pages (privacy/terms/cookies) clean.

## 🔎 VERIFY ON REAL NETLIFY DEPLOY (can't test locally)

Local `server.js` doesn't replicate `_redirects`, so confirm on the live deploy:
- [ ] `/worksheets/<slug>` pretty URLs resolve + set their own canonical (logic is correct).
- [ ] `/tools/<tool>/<slug>` share URLs resolve + restore config.
- [ ] `/blog/<slug>` (extensionless) serves the right `.html` (Netlify drop-`.html`).
