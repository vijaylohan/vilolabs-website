# ViLoLabs SEO Work Plan — staged & prioritized

Created 2026-07-05 from a full-site audit (every page crawled + production checked).
Context: domain live since 2026-06-09 (~1 month old). On-page is ~85% right.
The real ranking constraints are **authority (backlinks) and time** — the plan
reflects that: cheap mechanical fixes first, then the compounding work.

Legend: 🤖 = Claude does it in a session · 👤 = user must do it (accounts/manual)
Effort: S < 1h · M = 1-3h · L = ongoing/recurring

---

## STAGE 0 — Measurement first (do before anything else)

You can't steer without data. Everything later gets judged by GSC numbers.

| # | Task | Who | Effort |
|---|------|-----|--------|
| 0.1 | Verify `vilolabs.in` in Google Search Console (DNS TXT via Cloudflare) | 👤 | S |
| 0.2 | Submit `sitemap.xml` in GSC → Sitemaps | 👤 | S |
| 0.3 | Request indexing for `/worksheet`, `/tools`, `/` (URL Inspection) | 👤 | S |
| 0.4 | Verify site in **Bing Webmaster Tools** (imports from GSC in 2 clicks; Bing/Copilot traffic is free) | 👤 | S |
| 0.5 | Baseline note: record impressions/clicks after 2 weeks for comparison | 👤 | S |

**Exit criteria:** GSC shows pages indexed + first query data flowing.

---

## STAGE 1 — Mechanical on-page fixes (one session, do immediately)

All confirmed bugs from the audit. Zero risk, pure win.

| # | Task | Who | Effort |
|---|------|-----|--------|
| 1.1 | **Fix sitemap 404**: `/blog/petrol-prices-india-2026` is in sitemap but file doesn't exist. Either restore the post or delete its `blog_posts` Supabase row (needs 👤 for the SQL) + rebuild sitemap | 🤖+👤 | S |
| 1.2 | **Un-dead-end `/worksheet`**: add contextual links in `.page-info` → `/tools` (e.g. "print to PDF? compress it"), `/pulse`, 2-3 specific tools | 🤖 | S |
| 1.3 | **Tool cross-links**: "Related tools" row (3-4 sibling links) on all 8 tool pages — compress-image↔resize-image↔image-to-pdf, merge-pdf↔compress-pdf↔pdf-to-word etc. | 🤖 | M |
| 1.4 | **Kill redirect hops**: index.html links `/about.html`, `/pulse.html`, `privacy.html` etc → all 308-redirect. Change every internal href to extensionless form across all pages | 🤖 | S |
| 1.5 | **`worksheets/index.html` stub**: add short real content + links to `/worksheet` (or noindex it — decide in session) | 🤖 | S |
| 1.6 | JSON-LD gaps: `Blog` schema on pulse.html, `AboutPage` on about.html | 🤖 | S |
| 1.7 | `pulse` sitemap `changefreq: daily` → `weekly` (match reality) | 🤖 | S |

**Exit criteria:** zero sitemap 404s, no internal 308 hops, every page ≥3 internal links in AND out.

---

## STAGE 2 — Content depth on money pages (1-2 sessions)

| # | Task | Who | Effort |
|---|------|-----|--------|
| 2.1 | **Beef up `/tools` hub** (656 → ~1,500+ words): per-tool sections, "why client-side/private" explainer, India-specific use cases (UPSC/SSC photo rules, UPI QR for shopkeepers, WhatsApp compress) — content must match the winnable long-tail queries | 🤖 | M |
| 2.2 | **India long-tail landing content on 2 strongest tools** (resize-image, qr-generator): visible FAQ sections targeting "resize photo to 200kb for ssc", "upi qr code for shop" etc. + matching FAQPage JSON-LD (visible content rule — never invisible) | 🤖 | M |
| 2.3 | Light keyword pass on worksheet `.page-info`: check GSC queries after 2-4 weeks, add missing phrasings users actually search ("nursery worksheets", "lkg worksheets pdf") — data-driven, not guessed | 🤖+👤 | M |

**Exit criteria:** /tools ≥1,500 words; 2 tool pages have query-matching FAQ blocks.

---

## STAGE 3 — Publishing cadence (ongoing — the compounding lever)

The blog is the only asset that compounds. Data-driven India posts (gold/petrol
pattern) are exactly what earns links + rankings. Target: **2-3 posts/month, sustainable**.

| # | Task | Who | Effort |
|---|------|-----|--------|
| 3.1 | Decide the content calendar: monthly updates of gold/petrol data posts + 1 new evergreen data post/month (LPG prices, electricity tariffs, school fees data, FD rates comparison…) | 👤+🤖 | S |
| 3.2 | Write posts in sessions (data verified per blog_data_integrity rules — 2+ sources, Tier-1 govt data) | 🤖+👤 | L |
| 3.3 | Each new post: OG card render, sitemap auto-picks it up, internal links from/to related posts + relevant tool ("calculate your fuel cost" → blog) | 🤖 | S/post |
| 3.4 | Refresh the 2 existing petrol/gold posts monthly (fresh data = fresh crawls = "updated 2026-XX" trust) | 🤖+👤 | S/month |

**Exit criteria:** 3 consecutive months hitting cadence; posts appearing in GSC queries.

---

## STAGE 4 — Authority / backlinks (ongoing — the actual ranking unlock)

A 1-month-old domain with ~0 backlinks ranks for nothing competitive. Even
10-20 real links change everything. Ordered by effort-to-payoff:

| # | Task | Who | Effort |
|---|------|-----|--------|
| 4.1 | **Pinterest activation** — infra already built (`pinterest-build-pin.js`, 28-day scheduler, domain verification meta tag). Claim the domain in Pinterest dashboard, start the daily pin schedule. Captured worksheet images = pin inventory. NOTE: point pins at `/worksheets/<slug>` share URLs per spam-safety design | 👤+🤖 | M then L |
| 4.2 | **Directory submissions** (free, legit): AlternativeTo, Product Hunt launch for ViLo Tools/Worksheets, ToolFinder-type lists, India startup directories | 👤 | M |
| 4.3 | **Community answers** — Reddit (r/india, r/IndianParents, r/Teachers), Quora India: answer real "free worksheet/tool" questions with genuine help + link where relevant. Never spam; 2-3 quality answers/week | 👤 | L |
| 4.4 | **Data-post outreach**: when a gold/petrol post is fresh, share to relevant subreddits/FB groups/X; data journalism gets picked up organically | 👤 | S/post |
| 4.5 | Later (month 3+): guest data posts / collaborations with India personal-finance bloggers | 👤 | L |

**Exit criteria:** first 10 referring domains in GSC/Bing links report.

---

## STAGE 5 — Monitor & iterate (monthly loop, starts after Stage 0 data exists)

| # | Task | Who | Effort |
|---|------|-----|--------|
| 5.1 | Monthly GSC review session: which queries get impressions but no clicks (title/desc tweaks), which pages stall (content gaps), Core Web Vitals once data exists (worksheet.html is 300 KB — watch it) | 🤖+👤 | S/month |
| 5.2 | Check Google Images: captured worksheet images appearing? (expect first signs 4-8 weeks after Stage 0) | 👤 | S |
| 5.3 | Quarterly: re-run the site audit (this doc's checklist) | 🤖 | S |

---

## What NOT to do (agreed constraints)

- ❌ No separate gallery/landing pages competing with `/worksheet` (single-hub strategy is settled)
- ❌ No invisible JSON-LD (FAQ/HowTo must match visible content — manual-action risk)
- ❌ No indexing user-generated share slugs (noindex stays)
- ❌ No paid link buying / PBNs — poison for a new domain
- ❌ No chasing generic "compress pdf" head terms with content — unwinnable vs SmallPDF; the India long tail is the lane
- ❌ Don't judge anything before ~6-8 weeks of GSC data — new-domain patience

## Reality check on timeline

- Weeks 1-2: indexing settles, first impressions in GSC
- Months 1-3: long-tail queries start appearing (worksheet + India tool queries)
- Months 3-6: if cadence + links happen, meaningful clicks; Google Images worksheet traffic
- Month 6+: compounding. The site's outcome is decided by Stages 3+4 discipline, not by more on-page tinkering.
