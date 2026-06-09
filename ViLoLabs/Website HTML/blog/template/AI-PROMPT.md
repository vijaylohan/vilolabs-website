# ViLo Pulse — Blog Post Generation Prompt

**How to use this:**
1. Open any AI tool (ChatGPT, Claude, Gemini, Perplexity — whatever).
2. Paste the entire prompt below into the chat.
3. At the bottom, type your topic (e.g. "Gold prices across India 2026" or "LPG cylinder prices state-wise").
4. The AI returns a complete `.html` file.
5. Save it to `E:\Website\ViLoLabs\Website HTML\blog\<your-slug>.html`
6. Ask your dev assistant to push to web — say *"push the new blog post to github"*.

---

## ⚠️ HOW TO PREVIEW THE FILE BEFORE PUSHING

**Do NOT double-click the .html file.** That opens it via `file://` and the CSS won't load — you'll see plain white text.

**Correct way:** Start the local dev server first, then visit via http://localhost.

```powershell
# From E:\Website
node ViLoLabs/server.js
# Then open: http://localhost:3456/blog/<your-slug>.html
```

The dev server is also wired into Claude Code's Preview pane — just ask "show me /blog/<slug>.html in preview".

If the page looks plain white through `http://localhost:3456/...`, then something IS broken in the file. If it only looks white when double-clicking, that's normal — fix is to use the server.

---

## THE PROMPT (copy everything below this line)

```
You are writing a blog post for ViLo Pulse — the data-driven blog section of ViLoLabs, an Indian website
built by a solo developer for Indian readers. I need you to produce a COMPLETE, self-contained .html file
ready to drop into the blog folder. No partial output, no placeholders — full file from <!DOCTYPE html>
to </html>.

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT — STRICT
═══════════════════════════════════════════════════════════════

- Output the raw .html content directly. NO markdown wrapping (no ```html, no ``` at the start or end).
- NO commentary before or after the file. The first line of your reply must be <!DOCTYPE html>.
- NO suggested-filename comment at the top. The user picks the filename.

═══════════════════════════════════════════════════════════════
HARD RULES — VIOLATING ANY OF THESE BREAKS THE LAYOUT
═══════════════════════════════════════════════════════════════

1. EXACT REQUIRED <head> BLOCK — copy this verbatim, only change the <title>, descriptions, and og:* values:

   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
   <link rel="stylesheet" href="/blog/shared/blog.css">
   <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>
   <script src="/assets/db.js"></script>

   ❌ DO NOT use /assets/blog.css — the correct path is /blog/shared/blog.css
   ❌ DO NOT add <meta property="og:url"> with a guessed domain
   ❌ DO NOT add a canonical link tag

2. EXACT REQUIRED NAV — copy verbatim:

   <nav class="blog-nav">
     <a class="blog-nav-brand" href="/">ViLoLabs <span>/ Pulse</span></a>
     <a class="blog-nav-back" href="/pulse.html">← Back to Pulse</a>
   </nav>

   ❌ DO NOT make blog-nav-brand a <div> — it MUST be an <a> linking to /
   ❌ DO NOT use /blog/index.html for the back link — that page does not exist

3. EXACT REQUIRED FOOTER — copy verbatim:

   <footer class="post-footer">
     <div class="post-footer-brand">ViLoLabs / ViLo Pulse</div>
     <p>Independent analysis for the curious Indian reader. No paywalls, no spam.</p>
     <p>© 2026 ViLoLabs · <a href="/privacy.html">Privacy</a> · <a href="/terms.html">Terms</a></p>
   </footer>

   ❌ DO NOT add a personal name. Just "ViLoLabs".

4. USE EXACTLY THESE CSS CLASS NAMES — invent nothing, blog.css only styles these:

   Top:         #read-progress, .blog-nav, .blog-nav-brand, .blog-nav-back
   Hero:        .post-hero, .post-category, .post-title, .post-subtitle, .post-meta, .post-meta-dot
   Skim bar:    .skim-bar, .skim-bar-inner, .skim-stat, .skim-stat-num, .skim-stat-label
   Layout:      .post-layout, .post-body, .wide-block
   TL;DR:       .tldr, .tldr-label
   Charts:      .chart-card, .chart-title, .chart-note, .chart-wrap, .two-chart-grid
   Insights:    .insight-grid, .insight-card.green-top, .insight-card.red-top,
                .insight-card.blue-top, .insight-num, .insight-label, .insight-state
   Callouts:    .callout.info, .callout-icon
   Data table:  .data-table-wrap, .data-table
   Share:       .share-bar, .share-label, .share-btn.whatsapp, .share-btn.twitter, .share-btn.copy
   FAQ:         .faq-item, .faq-q, .faq-icon, .faq-a
   Disclosure:  .disclosure
   References:  .references, .references-title, .references-list (ordered list <ol>), .references-note
   Sidebar:     .post-sidebar, .sb-card, .sb-title, .toc, .toc-link,
                .sb-affiliate, .sb-btn, .sb-disclosure, .sb-tool-link
   Footer:      .post-footer, .post-footer-brand

5. NO INLINE STYLES on .post-title <em>, paragraphs, or any text element.
   blog.css already styles <em> in gold. Just use plain <em>your phrase</em>.

   ❌ <em style="color:#C8963C;">phrase</em>
   ✅ <em>phrase</em>

6. FAQ TOGGLE FUNCTION — copy this version EXACTLY (uses .open class, not style.display):

   function toggleFaq(el){
     const ans = el.nextElementSibling;
     const isOpen = ans.classList.contains('open');
     document.querySelectorAll('.faq-a').forEach(a => a.classList.remove('open'));
     document.querySelectorAll('.faq-q').forEach(q => q.classList.remove('open'));
     if (!isOpen) { ans.classList.add('open'); el.classList.add('open'); }
   }

   ❌ DO NOT use ans.style.display='block' — blog.css uses the .open class for animation.

7. EVERY DATA POINT MUST BE VERIFIED AGAINST AT LEAST 2 INDEPENDENT SOURCES.
   - Tier 1 (use one): Official govt / regulator websites (OGRA, NOC, STCB, CPC, NDRC, PPAC, IOCL,
     RBI, IBJA for gold, CGD for gas, state electricity boards).
   - Tier 2 (cross-verify): Established aggregators / news (Goodreturns, BankBazaar, CarDekho,
     GlobalPetrolPrices, country-specific news sites with date stamps).
   ❌ NEVER cite as sources: Reddit, Quora, Twitter/X, Instagram, Facebook, random blogs,
       listicles, "community discussions", AI summaries, anything pre-2025 for current data.

8. WRITING TONE — sound human, slightly imperfect, Indian English:
   - First-person occasional ("I pulled the data and was surprised...").
   - Short paragraphs (2-4 sentences). Mix a longer one occasionally for rhythm.
   - Conversational connectors: "So here's the thing." "That's it." "Let me explain."
   - Don't be afraid of mild grammar imperfections that real writers make.
   - Reference relatable Indian context (Wagah border, UPI, OMC, GST, Andhra-Telangana split,
     Akshaya Tritiya, wedding season, etc).
   - NO corporate language. NO "in conclusion". NO "let us delve into". NO "navigate the landscape".
   - NO em-dash overuse. Prefer simple commas and periods.

9. FILE STRUCTURE (exact order):

   <!DOCTYPE html><html lang="en"><head>...[the exact head block above]...</head>
   <body>
     <div id="read-progress"></div>
     <nav class="blog-nav">...</nav>
     <header class="post-hero">
       <div class="post-category">Category · Subcategory</div>
       <h1 class="post-title">Headline with <em>gold-emphasised phrase</em> here</h1>
       <p class="post-subtitle">One sentence what this post is about.</p>
       <div class="post-meta">
         <span>By ViLo Pulse</span><span class="post-meta-dot">·</span>
         <span>Month Year</span><span class="post-meta-dot">·</span>
         <span>⏱ X min read</span><span class="post-meta-dot">·</span>
         <span>📊 Interactive</span>
       </div>
     </header>
     <div class="skim-bar">
       <div class="skim-bar-inner">
         [4 .skim-stat blocks, each with .skim-stat-num and .skim-stat-label]
       </div>
     </div>
     <div class="post-layout">
       <article>
         <div class="post-body">
           [TL;DR block with .tldr and .tldr-label]
           [3-4 intro paragraphs]
         </div>
         <div class="wide-block"><div class="chart-card">[main bar chart canvas]</div></div>
         <div class="post-body">
           [.insight-grid with 4 cards]
           [first h2 deep-dive section, 2-4 paragraphs]
           [optional .callout.info]
         </div>
         <div class="wide-block">
           <div class="two-chart-grid">
             <div class="chart-card">[donut canvas]</div>
             <div class="chart-card">[comparison bar canvas]</div>
           </div>
         </div>
         <div class="post-body">
           [3-4 more h2 sections with content]
         </div>
         <div class="wide-block"><div class="chart-card">[full sortable .data-table]</div></div>
         <div class="post-body">
           [concluding h2 "So why is X this way?" section]
           [.share-bar block with WhatsApp/Twitter/Copy buttons]
           [4-5 .faq-item blocks]
           [.disclosure block]
         </div>
         <div class="post-body">
           [.references block with .references-title, <ol class="references-list">, .references-note]
         </div>
       </article>
       <aside class="post-sidebar">
         [4 .sb-card blocks: Contents (ToC), Affiliate slot, Free Tools, More on Pulse]
       </aside>
     </div>
     <footer class="post-footer">...</footer>
     <script>...[register with ViloDB + Chart.js setup + table render + share + scroll + FAQ toggle + copy link]...</script>
   </body></html>

10. CHARTS — Chart.js 4.4.3 from CDN. Patterns:
    - Bar chart for ranked country/state data: indexAxis:'y', sorted, top item highlighted in #C8963C.
    - Donut for breakdowns: cutout:'60%', legend at bottom.
    - Comparison bar for vs-reference: green for lower, red for higher.
    - Colours: green #4CAF50 / amber #FF9800 / red #F44336 / gold #C8963C
    - Font 'Outfit', size 10-12.

11. DATA TABLE — sortable on every column. Format:
    <table class="data-table">
      <thead><tr id="tableHead"></tr></thead>
      <tbody id="tableBody"></tbody>
    </table>
    Built in <script>. Each row: rank, item, sub-label, main-value (bold ₹), delta (coloured), badge.

12. FAQ — exactly 4 to 5 questions a normal Indian reader would actually search.
    Format:
    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(this)">Question text? <span class="faq-icon">+</span></div>
      <div class="faq-a">Answer in 2-4 conversational sentences.</div>
    </div>

13. SIDEBAR — exactly 4 cards in this order:
    (a) Contents — ToC with <a class="toc-link" href="#section-id"> for each h2
    (b) Affiliate slot — relevant product. Use .sb-card.sb-affiliate. Include .sb-disclosure.
    (c) Free Tools — links to:
        /tools/qr-generator.html
        /tools/resize-image.html
        /tools/compress-pdf.html
    (d) More on Pulse — link to EXISTING posts only:
        /blog/petrol-prices-india-2025.html
        /blog/petrol-prices-neighboring-countries-2026.html
        /blog/gold-prices-india-2026.html
    ❌ DO NOT invent post URLs that don't exist (e.g. "upi-vs-credit-card-2026.html").

14. AT TOP OF MAIN <script>, INCLUDE pSEO REGISTRATION (the slug MUST match the filename):

    if (window.ViloDB) {
      ViloDB.saveBlogPost(
        '<slug-matching-filename-without-html>',
        '<post title>',
        '<post description, ~150 chars>',
        '<category — india | money | tech | lifestyle>'
      );
    }

15. ★ MANDATORY: STRUCTURED DATA (JSON-LD) — paste this block before </head>.
    Fill in the article-specific fields. Every post needs ALL THREE schemas
    (Article + BreadcrumbList + FAQPage) inside a single @graph wrapper.

    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Article",
          "@id": "https://vilolabs.in/blog/<slug>.html#article",
          "headline": "<exact post title>",
          "description": "<meta description, ~150 chars>",
          "url": "https://vilolabs.in/blog/<slug>.html",
          "datePublished": "<YYYY-MM-DD>",
          "dateModified": "<YYYY-MM-DD>",
          "inLanguage": "en-IN",
          "articleSection": "<category · subcategory>",
          "keywords": "<comma-separated relevant search phrases>",
          "author": {
            "@type": "Organization",
            "name": "ViLoLabs",
            "url": "https://vilolabs.in/about.html"
          },
          "publisher": {
            "@type": "Organization",
            "name": "ViLoLabs",
            "url": "https://vilolabs.in/",
            "logo": { "@type": "ImageObject", "url": "https://vilolabs.in/favicon.svg" }
          },
          "mainEntityOfPage": { "@type": "WebPage", "@id": "https://vilolabs.in/blog/<slug>.html" }
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://vilolabs.in/" },
            { "@type": "ListItem", "position": 2, "name": "Pulse", "item": "https://vilolabs.in/pulse.html" },
            { "@type": "ListItem", "position": 3, "name": "<short post title for breadcrumb>" }
          ]
        },
        {
          "@type": "FAQPage",
          "mainEntity": [
            { "@type": "Question", "name": "<exact FAQ question text from body>",
              "acceptedAnswer": { "@type": "Answer", "text": "<plain-text answer, no HTML>" } }
            /* one Question entry per FAQ item in the post body — must match exactly */
          ]
        }
      ]
    }
    </script>

    Why mandatory: this unlocks FAQ rich-snippet accordions, breadcrumb display,
    and Article eligibility for Google News/Discover. Posts without it rank
    significantly lower on data-comparison search queries.

16. ★ MANDATORY: AD SLOT PLACEHOLDERS — insert at TWO positions. BOTH must be
    INSIDE <article> (NOT outside .post-layout) and each wrapped in a
    .wide-block so they horizontally align with the chart-cards and with
    each other. Use class="ad-slot preview" so they're visible during dev.

    (a) Top — first child inside <article>, before the first .post-body:
        <article>
          <div class="wide-block">
            <div class="ad-slot preview" data-size="728×90 leaderboard" data-position="top"></div>
          </div>
          <div class="post-body">
            [TL;DR + intro paragraphs]
          </div>
          ...

    (b) Bottom — after FAQ section, before .disclosure. Must close the
        current .post-body first, then a fresh wide-block, then reopen
        a .post-body if more content follows:
          [FAQ items]
        </div><!-- close .post-body -->
        <div class="wide-block">
          <div class="ad-slot preview" data-size="728×90 leaderboard" data-position="bottom"></div>
        </div>
        <div class="post-body">
          <div class="disclosure">...</div>
          ...

    Behaviour: blog.css renders them as gold-bordered dashed boxes saying
    "Ad slot · 728×90 leaderboard". When real ad code is dropped in later,
    change class to "ad-slot live" and place the AdSense/sponsor HTML
    inside the div. They auto-hide on print/PDF.

    ⚠️ Why both inside <article>: if the top slot is placed OUTSIDE
    .post-layout, it centers in the full window width while the bottom
    slot centers in the article column — looks visually asymmetric.
    Keep both inside <article> so they share the same parent context.

17. ★ MANDATORY: AFFILIATE CARD COMING-SOON STATE — for now, every .sb-affiliate
    sidebar card MUST have the coming-soon class:

    <div class="sb-card sb-affiliate coming-soon">  ← include 'coming-soon'
      <div class="sb-title">💰 [Topic] Deals</div>
      <p>...</p>
      <a class="sb-btn" href="#">Shop on Amazon →</a>
      <div class="sb-disclosure">Affiliate link — we may earn a small commission at no extra cost to you.</div>
    </div>

    Behaviour: card is blurred + dimmed with a "Coming soon" badge overlay.
    Layout space is preserved so when affiliate is activated (remove the
    coming-soon class), nothing shifts.

═══════════════════════════════════════════════════════════════
ABOUT VILOLABS BRAND (for consistency)
═══════════════════════════════════════════════════════════════

- Dark luxury theme. Gold accents (#C8963C). Cream text (#F5F0E8).
- Fonts: Cormorant Garamond (serif headings), Outfit (sans body) — already loaded.
- Voice: confident but not arrogant. Curious. Not afraid to say "I was wrong" or "the data surprised me".
- Audience: Indian reader, 25-45, mildly informed, wants to learn in 10 minutes without fluff.
- No politics. No religion. No bashing of any group. Data > opinion.

═══════════════════════════════════════════════════════════════
DELIVERABLE
═══════════════════════════════════════════════════════════════

A single complete .html file. Nothing before <!DOCTYPE html>. Nothing after </html>.
No markdown wrapping. No commentary. Raw HTML text only.

═══════════════════════════════════════════════════════════════
MY TOPIC FOR THIS POST:
═══════════════════════════════════════════════════════════════

[REPLACE THIS LINE WITH YOUR TOPIC]
Example: "Gold prices across India in 2026 — state-wise comparison with making charges and GST breakdown"
Example: "LPG cylinder prices state-wise — why some states subsidise more than others"
Example: "Electricity tariffs by state in India — who pays the most per unit"

Use real verified May 2026 data. Find official sources first, then cross-check.
The slug for this post should be: [SUGGEST A SHORT URL-SAFE SLUG, LOWERCASE, HYPHENS ONLY]
```

---

## WHERE TO SAVE THE OUTPUT

The AI will return a file. Save it as:

```
E:\Website\ViLoLabs\Website HTML\blog\<your-slug>.html
```

Use a URL-safe slug — lowercase, hyphens only, no spaces or special characters.

**Examples of good slugs:**
- `gold-prices-india-2026.html`
- `lpg-cylinder-prices-state-wise-2026.html`
- `electricity-tariffs-india-2026.html`

⚠️ **The slug in `ViloDB.saveBlogPost(...)` MUST match the filename** (minus the .html extension).
Otherwise the sitemap won't pick it up correctly.

## ONCE YOU'VE SAVED THE FILE

1. **Preview locally first:** open `http://localhost:3456/blog/<your-filename>` in your browser
   (start the server with `node ViLoLabs/server.js` from `E:\Website` if not already running).
2. **Check:** dark theme loaded? Hero looks right? Charts render? Sidebar visible?
3. **If looks right, tell your dev assistant:** *"I added a new blog post at `<filename>`. Please push it to GitHub and update Pulse landing page."*

The assistant will:
1. Verify the file uses the correct CSS classes (quick scan)
2. Fix any obvious AI mistakes (markdown wrappers, wrong paths, made-up links)
3. Update `/pulse.html` (new post → Featured, older Featured → regular card)
4. Bump the "Posts live" counter
5. Update the sidebar Latest Posts
6. Commit + push to GitHub
7. Live on Netlify within 1-2 minutes
