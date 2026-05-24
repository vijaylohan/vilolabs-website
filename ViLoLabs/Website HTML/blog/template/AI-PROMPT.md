# ViLo Pulse — Blog Post Generation Prompt

**How to use this:**
1. Open any AI tool (ChatGPT, Claude, Gemini, Perplexity — whatever).
2. Paste the entire prompt below into the chat.
3. At the bottom, type your topic (e.g. "Gold prices across India 2026" or "LPG cylinder prices state-wise").
4. The AI returns a complete `.html` file.
5. Save it to `E:\Website\ViLoLabs\Website HTML\blog\<your-slug>.html`
6. Ask your dev assistant (me) to push to web — say *"push the new blog post to github"*.

---

## THE PROMPT (copy everything below this line)

```
You are writing a blog post for ViLo Pulse — the data-driven blog section of ViLoLabs, an Indian website
built by a solo developer for Indian readers. I need you to produce a COMPLETE, self-contained .html file
ready to drop into the blog folder. No partial output, no placeholders — full file from <!DOCTYPE html>
to </html>.

═══════════════════════════════════════════════════════════════
HARD RULES — VIOLATING ANY OF THESE BREAKS THE LAYOUT
═══════════════════════════════════════════════════════════════

1. USE EXACTLY THESE CSS CLASS NAMES (do not invent your own — blog.css only styles these):

   Top-level:           #read-progress, .blog-nav, .blog-nav-brand, .blog-nav-back
   Hero:                .post-hero, .post-category, .post-title, .post-subtitle, .post-meta, .post-meta-dot
   Skim bar:            .skim-bar, .skim-bar-inner, .skim-stat, .skim-stat-num, .skim-stat-label
   Layout:              .post-layout, .post-body, .wide-block
   Highlight box:       .tldr, .tldr-label
   Charts:              .chart-card, .chart-title, .chart-note, .chart-wrap, .two-chart-grid
   Insight cards:       .insight-grid, .insight-card.green-top, .insight-card.red-top, .insight-card.blue-top,
                        .insight-num, .insight-label, .insight-state
   Callouts:            .callout.info, .callout-icon
   Data table:          .data-table-wrap, .data-table (use <th onclick="sortTable(i)"> for sortable)
   Share:               .share-bar, .share-label, .share-btn.whatsapp, .share-btn.twitter, .share-btn.copy
   FAQ:                 .faq-item, .faq-q (with onclick="toggleFaq(this)"), .faq-icon, .faq-a
   Disclosure:          .disclosure
   References:          .references, .references-title, .references-list (use <ol>), .references-note
   Sidebar:             .post-sidebar, .sb-card, .sb-title, .toc, .toc-link
                        .sb-affiliate, .sb-btn, .sb-disclosure, .sb-tool-link
   Footer:              .post-footer, .post-footer-brand

2. EVERY DATA POINT MUST BE VERIFIED AGAINST AT LEAST 2 INDEPENDENT SOURCES.
   - Tier 1 sources (use one): Official government / regulator websites (e.g. OGRA, NOC, STCB, PPAC, IOCL,
     RBI, IBJA for gold, CGD for gas, state electricity boards).
   - Tier 2 sources (cross-verify): Established aggregators / news (Goodreturns, BankBazaar, CarDekho,
     GlobalPetrolPrices, official news outlets with date stamps).
   - Reject: Twitter/X infographics, listicles, anything older than 60 days for fast-moving prices.
   - If sources disagree by >5%, find a third source.
   - List every source used in the References section with working URLs.

3. WRITING TONE — sound human, slightly imperfect, Indian English:
   - First-person occasional ("I pulled the data and was surprised...")
   - Short paragraphs (2-4 sentences). Mix in some longer ones for rhythm.
   - Conversational connectors: "So here's the thing." "That's it." "Let me explain."
   - Don't be afraid of mild grammar imperfections that real writers make.
   - Reference relatable Indian context (Wagah border, UPI, OMC, GST, Andhra-Telangana split, etc.).
   - NO corporate language, NO "in conclusion", NO "let us delve into".
   - NO em-dash overuse — use sparingly. Prefer simple commas and periods.

4. FILE STRUCTURE (in this exact order):
   <!DOCTYPE html>, <head> with title + meta + og:* + fonts + blog.css + chart.js CDN + /assets/db.js
   <body>
     <div id="read-progress"></div>
     <nav.blog-nav>
     <header.post-hero>
     <div.skim-bar> with .skim-bar-inner > 4 .skim-stat blocks
     <div.post-layout>
       <article>
         <div.post-body> — TL;DR + intro paragraphs (3-4)
         <div.wide-block> — first big chart (bar chart usually)
         <div.post-body> — insight cards + first narrative section + callout
         <div.wide-block> — two-chart-grid (donut + comparison)
         <div.post-body> — 3-4 more narrative sections with h2 + h3
         <div.wide-block> — full data table (sortable)
         <div.post-body> — concluding section + share bar + FAQ (4-5 items) + disclosure
         <div.post-body> — References (ordered list with 6-9 sources)
       </article>
       <aside.post-sidebar> — 4 .sb-card blocks: Contents (ToC), Affiliate slot, Free Tools, More on Pulse
     </div>
     <footer.post-footer>
     <script> — register with ViloDB.saveBlogPost, render charts (Chart.js 4.4.3 inline), table, share links, ToC active scroll, FAQ toggle, copy link
   </body>

5. CHARTS — always use Chart.js 4.4.3 from CDN. Use these patterns:
   - Bar chart for ranked country/state data: indexAxis:'y', sorted, India highlighted in #C8963C (gold).
   - Donut chart for breakdowns (taxes, components): cutout:'60%', legend at bottom.
   - Vertical bar for vs-reference comparisons: green for cheaper/lower, red for more/higher.
   - Colours: green #4CAF50 / amber #FF9800 / red #F44336 / gold #C8963C
   - Font family 'Outfit', size 10-12px.

6. DATA TABLE — sortable on every column. Format:
   <table.data-table>
     <thead><tr id="tableHead"></tr></thead>
     <tbody id="tableBody"></tbody>
   </table>
   Built dynamically in <script>. Each row: rank, item (bold), local-value, INR/main value (bold),
   delta-vs-reference (coloured), badge for cheapest/costliest.

7. FAQ — exactly 4 to 5 questions. They must be questions a normal Indian reader would actually search
   for, not corporate Q&A. Format:
   <div.faq-item>
     <div.faq-q onclick="toggleFaq(this)">Question text? <span.faq-icon>+</span></div>
     <div.faq-a>Answer in 2-4 sentences, conversational.</div>
   </div>

8. SIDEBAR (.post-sidebar) — 4 cards in this order:
   (a) Contents — ToC linking to each h2 section by id
   (b) Affiliate slot — relevant product (Amazon/Cred/credit card/etc.) with .sb-disclosure
   (c) Free Tools — links to /tools/qr-generator.html, /tools/resize-image.html, /tools/compress-pdf.html
   (d) More on Pulse — link to /blog/petrol-prices-india-2025.html and any other related post

9. FOOTER (exact text):
   <footer.post-footer>
     <div.post-footer-brand>ViLoLabs / ViLo Pulse</div>
     <p>Independent analysis for the curious Indian reader. No paywalls, no spam.</p>
     <p>© 2026 ViLoLabs · <a href="/privacy.html">Privacy</a> · <a href="/terms.html">Terms</a></p>
   </footer>

10. AT TOP OF MAIN <script>, INCLUDE THIS pSEO REGISTRATION:
    if (window.ViloDB) {
      ViloDB.saveBlogPost(
        '<your-slug>',
        '<post title>',
        '<post description, 150 chars>',
        '<category — india | money | tech | lifestyle>'
      );
    }

═══════════════════════════════════════════════════════════════
SECTION RECIPE — every data-comparison post has this shape
═══════════════════════════════════════════════════════════════

(A) HERO — one strong headline with <em>gold-coloured emphasis</em> on a contrasting phrase.
    Subtitle in plain language. 4 meta items (author + date + read time + interactive badge).

(B) SKIM BAR — 4 numbers a busy reader can grab in 5 seconds. Make them concrete (with units, ₹ signs).

(C) TL;DR (.tldr block) — 3 bullets, each starts with <strong>punchy one-liner.</strong>

(D) OPENING (3-4 paragraphs in .post-body) — a real-world hook, why this post exists,
    "I pulled the data and found..." style intro.

(E) FIRST CHART (.wide-block > .chart-card) — main bar chart with all data ranked.

(F) INSIGHT CARDS (4 cards in .insight-grid) — key takeaways with .green-top, .red-top, .blue-top variants.

(G) DEEP-DIVE SECTIONS (3-5 h2 sections in .post-body):
    - Each h2 has a unique id matching the ToC.
    - Each section: 2-4 paragraphs + optional h3 sub-sections.
    - Use <strong> liberally for the punch words.
    - One <em>italic phrase</em> per section max.

(H) SECOND CHART BLOCK (.wide-block > .two-chart-grid) — donut + comparison bar.

(I) MORE NARRATIVE SECTIONS — context, why-this-matters, what-the-future-looks-like.

(J) FULL DATA TABLE (.wide-block > .chart-card with .data-table-wrap) — sortable, every row.

(K) CONCLUSION SECTION ("So why is X this way?" — answer-the-implicit-question framing).

(L) SHARE BAR (.share-bar) — WhatsApp + Twitter + Copy link.

(M) FAQ (4-5 items, conversational).

(N) DISCLOSURE BOX (.disclosure) — data note + affiliate transparency.

(O) REFERENCES (.references with .references-list <ol>) — 6-9 sources with working URLs.

═══════════════════════════════════════════════════════════════
ABOUT VILOLABS BRAND (for consistency)
═══════════════════════════════════════════════════════════════

- Dark luxury theme. Gold accents (#C8963C). Cream text (#F5F0E8).
- Fonts: Cormorant Garamond (headings serif), Outfit (body sans-serif). Already loaded via blog.css.
- Voice: confident but not arrogant. Curious. Not afraid to say "I was wrong" or "the data surprised me".
- Audience: Indian reader, 25-45, mildly informed, wants to learn in 10 minutes without fluff.
- No politics. No religion. No bashing of any group. Data > opinion.

═══════════════════════════════════════════════════════════════
DELIVERABLE
═══════════════════════════════════════════════════════════════

Output: a single complete .html file. Nothing else. No commentary before or after.
Wrap in a single ```html code block so I can copy-paste it cleanly.

Required filename suggestion at the top of your output (as a comment):
<!-- SAVE THIS AS: /blog/<your-suggested-slug>.html -->

═══════════════════════════════════════════════════════════════
MY TOPIC FOR THIS POST:
═══════════════════════════════════════════════════════════════

[REPLACE THIS LINE WITH YOUR TOPIC]
Example: "Gold prices across India in 2026 — state-wise comparison with making charges and GST breakdown"
Example: "LPG cylinder prices state-wise — why some states subsidise more than others"
Example: "Electricity tariffs by state in India — who pays the most per unit"

Use real verified May 2026 data. Find official sources first, then cross-check.
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

## ONCE YOU'VE SAVED THE FILE

Just say to your dev assistant: **"I added a new blog post at `<filename>`. Please push it to GitHub and update Pulse landing page."**

The assistant will:
1. Verify the file uses the correct CSS classes (quick check)
2. Add it as a new card on `/pulse.html` (with the latest post moved to Featured)
3. Move the older Featured post to a regular card
4. Commit + push to GitHub
5. Live on Netlify within 1-2 minutes
