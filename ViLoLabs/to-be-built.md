# ViLoLabs — To Be Built

A running list of planned features, activities, and improvements.
Add to this file as ideas come up. Strike through when shipped.

---

## 🗓️ SATURDAY RELEASE — 2026-10-17 (one push, everything together)

Everything below is ready or planned locally; nothing is live until this push.
**Schedule:** image library work continues until Wednesday; **BUILDING starts Wednesday
2026-10-14** (code changes below); Saturday = final test + push.

- [ ] **Image library** — already QC'd + built locally (`library.json`): +116 new pictures,
      9 upgraded (emoji → drawing), knife replaced; colouring pages 25 → 64 (status 2026-10-15).
      Emoji set frozen (`tools/emoji-allowlist.json`) — no new emoji go live.
- [x] **Shape questions** — build activities 8a–8g from `activity-catalog.md` §8
      (find shape, count corners, which shape has N corners, match, names, shapes
      around us, count sides), age-matched via `ACT_POOLS`, English + Hindi.
      Also fix the existing `shape-id` Hindi bug (English hint line + English shape name).
      DONE locally 2026-10-16 (keys: shape-corners, shape-sides, shape-which, shape-match,
      shape-name, shape-real; shape-id now level-matched + translated). Pools: Pre-KG
      +match · KG +corners, match · Cl1 +corners, which, names, real · Cl2 +sides, which,
      names, real (sides replaces corners at Cl2) · Cl3 +sides, which. 3,600 test builds,
      0 wrong answers. Shapes-around-us pictures hand-checked (REAL_SHAPE in worksheet.html).
- [x] **Fruit tastes** — ✅ DONE locally 2026-10-15 (guava, papaya, pomegranate, blueberry, lychee = sweet; kiwi/plum/coconut deliberately untagged) — add the 8 new fruits (guava, papaya, pomegranate, coconut,
      kiwi-fruit, blueberry, lychee, plum) to `FRUIT_TASTE` in `worksheet.html`
      so the "sweet or sour?" activity can use them.
- [ ] **Contact details** — (Vijay: do this one LAST) — update the website's contact details.
      ⚠️ Need the actual details from Vijay first (email? phone? which ones to show?).
      Places to update: index.html contact section + footer "@" link (currently
      "coming soon" `.na`), privacy/terms/cookies contact lines, and the homepage
      Organization JSON-LD if an email is added. If the CONTACT FORM goes live too,
      the Tier 1 checklist in CLAUDE.md applies (Turnstile, consent checkbox,
      privacy.html paragraph) — that's a bigger job, decide separately.
- [x] ✅ DONE locally 2026-10-15 (+ TRAIT_AMBIGUOUS guard: frog/crocodile/beaver/hippo/polar-bear never shown as wrong answers) — **Teach existing questions the new pictures** (data-only, quick — `worksheet.html`):
      - healthy-or-treat: HEALTHY += salad, soup, rice · TREAT += donut, lollipop, pizza
        (leave sandwich & noodles out — ambiguous)
      - hungry-thirsty: HUNGRY_FOOD += pizza, sandwich, rice, noodles, soup, salad, donut
      - animal-trait: TRAIT_FLY += bat, crow, pigeon, eagle, woodpecker, kingfisher, robin ·
        TRAIT_WATER += frog, crocodile, beaver · TRAIT_NOLEGS += snake
      - use-for (USE_FOR_GROUP ~line 1826): new groups clean (broom, soap, bucket) · light
        (lantern) · sleep (bed) · time (wall-clock) · look-far (telescope). Code touch-points:
        add the group names to `groups=[…]` in `case 'use-for'` (~line 4675), and labels
        `uf_clean/uf_light/uf_sleep/uf_time/uf_lookfar` in BOTH string tables (EN ~line 833:
        CLEAN / SEE IN THE DARK / SLEEP / TELL THE TIME / SEE FAR AWAY · HI ~line 923:
        साफ़ करना / अंधेरे में देखना / सोना / टाइम देखना / दूर तक देखना).
        Distractor pool there = animals/food/fruits/vegetables only → household distractors
        never collide with the new household answers ✓.
      - Lists to edit (all in worksheet.html): FRUIT_TASTE ~1817 · HUNGRY_FOOD ~1823 ·
        TRAIT_FLY/WATER/NOLEGS ~1827–1829 · HEALTHY_FOODS/TREAT_FOODS ~4514 (inside
        `case 'healthy-or-treat'`).
      - FRUIT_TASTE += 8 new fruits (item above)
      ("what-category" and "where-does-it-live" pick up new pictures automatically.)
- [x] ✅ DONE locally 2026-10-15 (A+B: page slice de-dup + library top-up; odd from different family; ODD_LOOKALIKE + ODD_GROUP_OK) — **BUG FIX — "Odd one out" shows 4 identical pictures** (reported 2026-10-12, Pre-KG
      toys theme, 4 spinning tops). Cause: themed pools may be as small as 12–15 pictures
      (`themed.length>=12`, worksheet.html ~line 3228). Page slice is built at ~line 3254:
      `allItems.slice(start,start+16).concat(allItems.slice(0, 16-(POOL_TARGET-start)))` —
      when the pool has < 16 pictures the concat re-adds the first ones → DUPLICATES inside
      one page's 16 items. `case 'odd-one-out'` (~line 4034) then uses i0 ×3 + i1, and
      if i0 and i1 are the same picture all 4 match.
      Context: parents NEVER pick a theme — Pre-KG/KG are always given a RANDOM theme, Class
      1–5 a random theme 65% of the time (`_wsThemesViable`, ~line 2170, threshold ≥12).
      **DECIDED FIX = A + B (2026-10-12):**
      **A. Top up the theme pool:** use all of the theme's pictures first, then fill from the
      whole library (same png/emoji mode) so every page always has 16 DIFFERENT pictures —
      never re-add pictures already in the slice. Compare by image path (5 names exist in 2
      sections with different pictures: kite, lantern, maracas, puddle, telescope). Sheet
      still feels themed; duplicates become impossible for every activity.
      **B. Odd one out from outside the theme:** the odd picture always comes from a
      clearly DIFFERENT category (never toy-car among vehicles, fruit among food), same
      png/emoji mode. Pre-KG: 3 identical theme pictures + 1 other-category picture.
      KG+: 3 DIFFERENT pictures of the theme + 1 other-category picture ("which is not a
      toy?") — teaches grouping. Keep a final guard: odd image ≠ others, else re-pick.
- [x] ✅ DONE locally 2026-10-15 — **BUG FIX — Pattern "what comes next?" reference line is tiny and stacked top-to-
      bottom** (reported 2026-10-12, seen in PDF; same on screen). Cause: `case 'pattern-ab'`
      (~line 4053) prints a hint line `${a} ${b} ${a} ${b} ${a} → ___?` at font-size .62rem,
      where a/b are `<img class="wimg">`; `.wimg` is `display:block` (CSS line 150) → each
      picture becomes its own line, ~10px tall. Fix: show the reference LEFT-TO-RIGHT and
      readable — e.g. wrap the hint pictures in a flex row with `display:inline-block` and a
      real size (~24–28px), or drop the hint line (the big row above already shows the
      pattern). Check pattern-abc and any other line that puts `.e` pictures inside text.
- [x] **BUILT locally 2026-10-16:** one cached theme decision (_wsCfg) drives pictures + header + page labels + slug (mismatch bug FIXED); 1–3 themes, AUTOMATIC combos (user 2026-10-16: any 2–3 themes from the class list, rules THEME_NEVER + no family overlap; ~200+ different combos per class; KG/Pre-KG ~39% one / 30% two / 31% three themes; Class 1-5 ~30/22/23% + ~25% mixed; pages take turns); families animals/food (THEME_MEMBERS); LEVEL_TOPICS expanded (+weather, space, people, buildings…; weather added to seo-keywords.json); related top-up (THEME_RELATED); visit memory = seed shopping (localStorage vl-ws-recent, up to 12 dry runs ≈11 ms each, picks the least-repeating seed — sheet stays 100% seed-decided, share links exact); multi-theme slugs `…-birds-fruits-and-transport-<id>` in worksheet-seo.js + functions/worksheets/[slug].js (old slugs parse as before; an old link's named theme now wins on restore). 6-sheet visit repeats: Pre-KG 36%→15%, KG 47%→35%, Cl1 44%→34%, Cl3 41%→25%; theme repeats → 0. Remaining repeats come from fixed small pools (fruit-or-veg, shapes, pairs…).
- [x] **FRESHNESS UPGRADE — every Generate click in one visit must feel new** (agreed
      2026-10-12; generator logic only, no page/UI change). Problem measured: library has
      588 pictures / 28 sections, but a themed sheet draws from ~25 pictures (10 pages ≈ 160
      slots → heavy repeats), and LEVEL_TOPICS (~line 1034) never offers many sections
      (Pre-KG: only 7 themes — never vehicles, birds, vegetables, food, sea creatures…).
      1. **1–3 themes per sheet.** Mix of sheet types, e.g. ~⅓ single theme, ~⅓ 2–3
         themes, ~⅓ fully mixed. Multi-theme sheets ALTERNATE pages between their themes
         (each page stays focused; name stays honest — every named theme really appears,
         roughly equal share). Use a HAND-PICKED list of sensible combos (animals+birds,
         fruits+vegetables, toys+clothing, vehicles+buildings, sea-creatures+weather,
         animals+fruits+vehicles…), never odd ones (dinosaurs+stationery).
      2. **Names:** "Kindergarten · Animals, Fruits & Vehicles"; slug
         `free-printable-worksheets-{grade}-animals-fruits-and-vehicles-{seed}`. Teach
         `worksheet-seo.js` + `functions/worksheets/[slug].js` the multi-theme format; old
         single-theme / mix slugs MUST keep parsing (existing share links). Gallery alt text
         (`galleryAlt`) already turns the theme part into words automatically — re-check.
      3. **Theme families (bigger pools, names still true):** animals = animals + birds +
         sea creatures + insects · food = food + fruits + vegetables · transport = vehicles ·
         school = stationery · home = household + toys (names `transport`/`school` already
         exist in seo-keywords.json).
      4. **More themes per level (B):** add the newly complete sections to LEVEL_TOPICS
         where age-appropriate. Weather + shapes (+ any other new theme) need a
         seo-keywords.json category entry first, or names/previews fall back to "mix".
      5. **Visit memory (C) — the key to freshness:** remember (localStorage, per browser)
         the pictures, themes and question types used in the last few generated sheets;
         prefer unused ones on the next Generate. Never block — fall back gracefully when
         a pool is small. Share-link restore must ignore this memory (same seed → same sheet).
      6. **Top-up (D, see odd-one-out fix A):** if a page runs short, fill from the same
         family first, then a related one.
      Note: very old share links may show slightly different pictures after this (already
      true whenever the library grows) — acceptable; their names/URLs keep working.
      7. **EXISTING BUG to fix here (found 2026-10-15, live too):** URL slug theme, page
         header and actual pictures can disagree — e.g. URL `…preschool-fruits…`, header
         "Pre-KG · Fun Mix", pictures = animals (also seen: KG "fruits" URL with sea animals).
         The slug's category (`_wsCurrentConfig`, ~line 2179) and the theme used to pick
         pictures/header appear to be chosen separately. One single theme decision must drive
         slug + header + share preview + pictures.
- [ ] **SHRINK LIBRARY PICTURES — TEST FIRST, THEN DECIDE** (agreed 2026-10-12; needed
      with the freshness upgrade, which makes sheets use 100+ distinct pictures).
      Facts: 590 library PNGs, avg ~800 KB (457 MB) at 1024 px. Largest on-sheet size =
      Pre-KG `m` 7rem = 112 CSS px (~3 cm); PDF export renders at html2canvas scale:2 →
      max ~224 px per picture in any PDF; sharpest phones ~336 px. Plan: resize to **512 px**
      (fit inside, keep transparency) + PNG palette compression (sharp: palette:true,
      quality ~90, effort 10) → ~70–90 KB each, SAME file names/format (no code change).
      Quick test 2026-10-12 at 400 px: tiger 756→47 KB, pizza 1373→51 KB, jupiter 1223→34 KB,
      visually identical. Colouring pages + emoji SVGs NOT touched.
      **Step 1 (Wednesday): proof test** — generate the SAME worksheet locally twice (current
      vs 512 px pictures), export both PDFs, show Vijay side by side zoomed in. Only if he
      sees no difference → step 2. **Step 2:** add a shrink step to build-all.js after
      make-transparent (new pictures shrink automatically); originals stay in
      Resources/library-originals-backup/ (never uploaded).
      ✅ DONE 2026-10-12: dashed sticker-ring remnants removed from 18 pictures (tent,
      school, space-helmet, constellation [real dotted lines kept], galaxy, telescope,
      meteor, satellite, mercury, venus, saturn, comet, jupiter, mars, apron, jeans, gloves,
      pajamas) — small loose MID-GREY bits only; verified unchanged after build.
- [x] **FIXED locally 2026-10-16:** emoji nuts pair skipped in `libPairs`; picture sheets
      now use PNG pairs (real nuts); pairs/pictures not yet used on the sheet come first, so
      "Goes together" no longer repeats on long sheets (80 test sheets: 0 repeats, 0 bolts).
      + 25 new pairs (`EXTRA_PAIRS` in worksheet.html, all pictures checked by eye):
      picture sheets 10 → 34 pairs, emoji sheets 6 → 18. Pairs whose emoji is wrong are
      picture-only (rain, bamboo, doctor, bowl, screw, fire-truck emojis are wrong matches).
- [x] **BUG — squirrel paired with MECHANICAL nuts** (reported 2026-10-15). In the
      "things that go together" pairing, squirrel ↔ nuts; in EMOJI mode `food/nuts` uses
      the nut-and-bolt hardware emoji (known wrong emoji — see library findings memory), so
      a child sees squirrel + a metal nut. Remove THIS match (or make it picture-mode only,
      where nuts = real peanuts/nuts) while making sure already-built / shared sheets still
      restore (same seed → same sheet; don't reorder or remove items in pools other code
      indexes by position). Check where the pair lives (pairWith tags in library.json /
      _images.md and any THINGS_TOGETHER-style map in worksheet.html).
- [ ] **INVESTIGATE — Supabase usage tables never update** (reported 2026-10-15). The
      "tools used" (`tool_usage`) and "tools shared" (`tool_shares`) data always show the
      same old rows from long ago. Check: is `trackUsage()` / `saveToolShare()` (assets/db.js)
      actually called by the tool pages; do inserts fail silently (RLS/anon policy, CSP
      connect-src, wrong table name); where is the data viewed. Fix so new usage records.
      (db.js is a shared file → run stamp-assets.js after editing.)
- [ ] **INVESTIGATE — colouring generator's script-drawn pictures** (reported 2026-10-15).
      Colouring sheets mix real PNG pages (66) with legacy SVG subjects drawn by code
      (`COL_LIB`, worksheet.html ~line 1150, `buildColouringAll` ~2600) — and each generated
      colouring sheet ends up including at least one of these code-drawn pictures, which look
      weaker than the real pages. Options to evaluate: drop SVG subjects now that 66 real
      pages exist; or only use them when the real pool is too small; or improve the SVG
      drawings. Keep share-link restore working for existing colouring slugs.
- [x] **New question types W7–W11** (below) — at least W7 Land/Water/Air and W5 Day/Night — W7 + W5 DONE locally 2026-10-15
      (W8–W11 follow in a later update.)
- [x] **Fair picture mixing** (2026-10-15, local) — `shuffle()` was a biased sort; now seeded Fisher-Yates so new pictures (end of library.json) get picked. Old share links regenerate with different pictures (same level/type) — user accepted.
- [x] **BUILT locally 2026-10-16** — banner `#wnBar`, popup `#wnModal`, card `#loveCard`
      (worksheet.html; JS block before the final `applyLang()`). Banner shows every visit until
      "See what's new" is opened, then hidden from the next visit (user decision 2026-10-16) and retires 2026-11-17. Card: on EVERY Generate/New
      (user decision 2026-10-16), 10 s, pauses on hover/touch, not shown
      when opening a shared link. Find-the-Word line `#wnWord` is hidden — un-hide when
      word search ships. Shares the `/worksheet` hub link (wa.me, facebook sharer,
      Instagram = phone share sheet / desktop copy-link).
- [x] **"What's new" banner + popup** (requested 2026-10-16; approved front-end change).
      Slim gold banner at the TOP of the worksheet generator page (not on printed sheets /
      PDF, not on `/worksheets/<slug>` share-restore views? → decide). Click → small, clean
      popup listing the upgrades in plain words, in the language picked at the top (EN/HI).
      Close button + click-outside + Esc; remember "seen" in localStorage (try/catch) so the
      banner shrinks/hides after the visitor has read it; banner retired after ~30 days.
      Must meet the professional UI bar. Draft wording:
      - Banner EN (v2, dark update bar): badge "● NEW UPDATE" · "We've upgraded the engine behind every worksheet" · "Smarter pictures · Intelligent questions · New thinking skills" · button "See what's new →"
      - Banner HI (v2): "नया अपडेट" · "हमने हर वर्कशीट के पीछे का इंजन अपग्रेड किया है" · "स्मार्ट तस्वीरें · समझदार सवाल · सोचने की नई कुशलताएँ" · "देखें क्या नया है →"
      - Popup title EN: "What's new in ViLo Worksheets" · HI: "ViLo वर्कशीट में क्या नया है"
      - Popup subtitle EN: "We've upgraded the engine behind every worksheet."
        HI: "हमने हर वर्कशीट के पीछे का इंजन अपग्रेड किया है।"
      - Popup (2026-10-16): highlighted "New section" box at the top — Find the Word + "Enjoy our new section!" + Try it → button (selects the card); separate list line removed.
      - Popup points EN (v3 — headline-only, all bold, no explanation lines):
        • **Smarter picture engine for fresher, more varied worksheets**
        • **Intelligent question builder, tuned to every class level**
        • **New thinking skills: sorting, grouping and real-world reasoning**
        • **Sharper visual puzzles that build true observation skills**
        • **Find the Word: age-adaptive word-search puzzles** (only if it ships)
        • **Same promise: free, private and sign-up free**
      - Popup points HI:
        • **ताज़ा और विविध वर्कशीट के लिए स्मार्ट पिक्चर इंजन**
        • **हर कक्षा के हिसाब से समझदार सवाल-निर्माता**
        • **सोचने की नई कुशलताएँ: छाँटना, समूह बनाना और रोज़मर्रा की समझ**
        • **और तेज़ दृश्य पहेलियाँ, जो सच्ची परख सिखाती हैं**
        • **शब्द खोज: उम्र के हिसाब से बदलने वाली पहेलियाँ** (अगर तैयार हो)
        • **वही वादा: मुफ़्त, निजी और बिना साइन-अप**
- [x] **"Share the love" nudge during generation** (requested 2026-10-16; approved front-end
      change). While the progress bar runs, a small card slides in at the side/bottom — never
      covering the worksheet, never blocking, auto-fades, closable, NOT in print/PDF. Don't
      show it on every generate (e.g. 1 in 3, or once per visit) so it stays warm, not naggy.
      Three small branded buttons of the `/worksheet` link: **WhatsApp** (wa.me link),
      **Facebook** (sharer link), **Instagram** (Instagram has NO web share link → on phones
      open the native share sheet, on desktop copy the link + "Link copied — paste it in your
      Instagram story or bio" toast). Use the official brand icons/colours, small and tidy.
      Wording v2 (2026-10-16): must be readable in ≤5 seconds — generation takes only a few
      seconds. ONE short line + the 3 logo buttons (the logos say WhatsApp/Instagram/Facebook,
      so the text doesn't repeat them). TIMING (decided 2026-10-16): card stays 10 s total
      (keeps showing after the sheet is ready), ✕ to close early, timer pauses while the
      mouse is over it / it's being touched, ONCE per visit. Progress bar is NOT slowed down
      — it runs at natural speed (no fake waiting). Rotate one line per show:
      - EN: "💛 Free for every child. Share it with a parent friend."
      - EN: "💛 Know a parent who'd love this? Share it."
      - EN: "💛 One share helps one more child learn."
      - HI: "💛 हर बच्चे के लिए मुफ़्त। किसी दोस्त से शेयर करें।"
      - HI: "💛 किसी माता-पिता को ये पसंद आएगा? शेयर करें।"
      - HI: "💛 आपका एक शेयर, एक और बच्चे की पढ़ाई।"
      - EN/HI #4 (2026-10-16): "💛 Sharing is caring — help us reach more parents." / "💛 शेयर करना ही केयर करना है — और माता-पिता तक पहुँचाएँ।"
      - What's-new popup also has a share box above "Start creating": "💛 Sharing is caring — help us grow and reach a bigger community of parents." + WhatsApp/Instagram/Facebook buttons
      - Generator page share boxes (2026-10-16): Share-button box headline = "💛 Sharing is caring — help us grow and reach more parents."; box under the worksheet = "Sharing is caring 💛 Help another parent and help us grow — share this worksheet." (keys shareCare / shareNudge, EN+HI); phones get a "💛 Thank you — sharing is caring!" toast with the system share sheet.
- [x] **BUILT locally 2026-10-16** — mode card "Find the Word" + age slider 6–12 + answer-key switch (#wsrOptsSec); buildWordSearchAll + _wsrMake in worksheet.html; word library assets/word-search-words.json (FINAL 2026-10-17 after Claude review on Vijay's request: 2,125 words, 796 meanings; also removed angel, troop, pirate, county. Earlier 2,129 words after 2026-10-16 difficulty review: age 11 = 6–7 letters, no everyday lists; age 12+ = 15×15, 6–8 letters incl. adv8 (154 eight-letter words, all with meanings); naval/quart/gallon removed; avg word length 9→12+: 4.6/5.2/6.4/6.6; word-meanings.json = 796. Earlier: 1,978 words: + adv5/adv6/adv7 big US/UK/India school vocabulary for ages 10–12+ added 2026-10-16 → age 10 ≈1,430, age 11–12+ ≈1,630 words, 100+ pages before a repeat; no -ise/-ize, no country-specific meanings; knight+title also removed. Earlier: 823 words after 2026-10-16 safety review removed ginger, beaver, nuts, weed, knife, tank, temple; pic3/pic4 picture words for ages 6–7, easy3–5, more4–7); every word exactly once (8-direction scan), blocklist WSR_BLOCK (~70 rude/unkind/violent strings) — strict rule: a blocked string anywhere in 8 directions re-rolls unless it lies inside ONE listed word read the same way (catches filler accidents AND word-meets-word); 2,100-puzzle independent check = 0 hits, no word-inside-word, young ages no overlaps, forward-only (↗ from 10); no repeats within a sheet (age 6: 36 picture words + 16 hand-checked Fluent emoji (MIT) in assets/emoji/wordsearch/ — emoji used on their OWN pages after real pictures run out, never mixed on a page; 15-page age-6 repeats 39 → 24 of 75; age 7: 100 picture words + 21 emoji spare). DIAGONAL CAP (2026-10-17): max diagonal words per page = age 8:2, 9:3, 10:4, 11:4, 12+:5 (WSR_AGE.diag) — before, a page could have 9 of 10 diagonal (frustrating). Word counts per page reviewed = comfortable vs school norms. WORDS TO KNOW strip (2026-10-16): every puzzle page ages 9+ shows the page's 3 hardest words + meanings in the spare space under the grid (grid size unchanged; measured ≥167px spare). TRICKY WORDS PAGE (option D, 2026-10-16): switch "Add a ‘Tricky words’ meanings page" (ages 9+, default off, seed bit 32) → ONE extra page before the answer key: up to 30 hardest words of the sheet (cap lowered 2026-10-16 so text can be big: word 1.04rem, meaning .94rem) that have a meaning (assets/word-meanings.json, 644 hand-written child-friendly meanings, no UK/US spelling), A–Z, subtitle "N of the harder words… Easy words are not listed", honesty tip, own promo (never the same tool as the key page). Fits A4 at 30 (longest meaning ≤50 chars → one line). Meanings reviewed: ONE clear meaning each (no "x, or y"), abstract words given simple examples. Ages 6–7 are LOCKED to 5 pages (user 2026-10-16; slider greyed + note) → no repeats at all. Setup screen: selected card/class button = lift + dark ring + gold glow + ✓ badge, other cards fade.; visit memory via seed shopping; age + answer-key ride in the seed low 5 bits → share links reopen identical; slug word-search-puzzles-for-kids-<id> (word-search-for-kids is taken by the mixed-sheet activity); seo-keywords activity+grade wordsearch, ALLOWED_TIE += wordsearch; EN+HI. NOT in Google-Images auto-capture yet: functions/api/capture.js ALLOWED + the DB check constraint on captured_worksheets.activity must both allow "wordsearch" first (needs a Supabase SQL change by Vijay).
- [x] **Find the Word (word search) mode** — build W6 below: new mode card + age slider
      (6 → 12), forward-only words, picture clues ages 6–7, answer page with circles +
      promo, EN + HI instructions, no-repeat memory. Includes the **word library**
      (`assets/word-search-words.json`, ~300–500 words per age band) — Vijay skims the
      list once before it goes live. ⚠️ Largest item (~1–2 sessions) — do it LAST so the
      rest can still ship if it isn't finished; then it goes in the next push.
- [ ] **Test locally** — every class level, English + Hindi, picture + emoji sheets,
      word search at every age, print/PDF; then commit + push; then check the live site.

**Order of work on Saturday:** 1) fruit tastes + teach existing questions the new
pictures (quick) → 2) contact details (needs Vijay's details) → 3) shape questions →
4) W7 Land/Water/Air + W5 Day/Night (if time) → 5) word search + word library →
6) test → push.

---

## Worksheet Activities (New)

These are new activity types to add to the worksheet generator (`sheets.html`).

---

### W1. Math Crossword

**What it is:** A crossword grid where every answer is a number. Clues are simple
arithmetic (addition, subtraction, multiplication depending on grade). Child solves
the sums and writes the digits into the crossword boxes — one digit per cell.

**Layout:** Single crossword grid, 5×5 or 6×6. Across clues listed below, Down
clues listed beside. An answer key page accompanies each worksheet.

**Rules:**
- All clues have a single, unambiguous numeric answer.
- Across answers and Down answers intersect correctly (shared digit cells agree).
- Clue difficulty matches grade: addition only for Grade 1–2; subtraction added
  for Grade 3; multiplication for Grade 4–5.
- Never a clue whose answer is 0 or negative (keep it positive for children).
- Every cell in the grid is covered by at least one across or one down answer.

**Grades:** 2 – 5 (Grade 1 can do addition-only variant with teacher guidance; Pre-KG/KG cannot read clues or write digits)

---

### W2. Identify the Object

**What it is:** An image of an object is shown. Child identifies it in an age-appropriate way.

**Layout varies by grade — children cannot read before Grade 1:**
- **Pre-KG:** NOT suitable — child cannot read or write the name. Skip this activity for Pre-KG.
- **KG:** Show the image + 3 *picture* choices below (not word choices) — child circles the matching picture. No text involved.
- **Grade 1:** Show the image + 3 word choices — child circles the correct word. Words must be simple (3–4 letters, phonetic).
- **Grade 2+:** Image only, blank write-in line below — child writes the name independently.

**Rules:**
- Image must be unambiguous — one clear, common object a child would know.
- KG picture-choice distractors must be from the same category (3 animals, or 3 fruits) — different enough to tell apart visually.
- Grade 1 word distractors: same category, simple spelling — e.g. cat / dog / hen, not cat / elephant / rhinoceros.
- Never use a distractor that could also be a correct answer.

**Grades:** KG – 5 (Pre-KG excluded — no reading or writing ability)

---

### W3. Number–Object Matching (Match the Number)

**What it is:** Left column shows numbers (digits or number words). Right column
shows groups of objects or animals (e.g. 3 ducks, 5 apples). Child draws a line
from each number to the group with that many objects.

**Layout:**
- 2-column layout, 5 rows.
- Left: the numeral (e.g. "3") or number word (e.g. "three") in a box.
- Right: a small illustration showing that exact count of items, column shuffled.
- Child draws lines to match.

**Rules:**
- Exactly 5 pairs. Each number appears once on the left, each count once on the
  right.
- Right column MUST be shuffled relative to left — never same order.
- Object counts are distinct — no two rows use the same count.
- Image groups must be clearly countable (items not overlapping).
- For KG: numerals 1–5, picture groups only (no number words).
- For Grade 1–2: numbers 1–10. Grade 3+: numbers up to 20 or use number words.

**Grades:** KG – 3 (Pre-KG cannot reliably recognise or match numerals)

---

### W4. Name the Picture (Syllable Boxes)

**What it is:** A picture is shown at the top. Below it are 2 or 3 empty boxes
arranged horizontally, one per syllable of the object's name. Child writes one
syllable per box to spell out the word.

**Examples:**
- Cat → [ C ] [ A ] [ T ]  ← 3 letter boxes (one letter per box variant)
- Ap-ple → [ Ap ] [ ple ]  ← 2 syllable boxes
- Ba-na-na → [ Ba ] [ na ] [ na ]  ← 3 syllable boxes
- Ele-phant → [ E ] [ le ] [ phant ]  ← 3 syllable boxes

**Two sub-variants:**
- **Letter boxes** (simpler): one box per letter — good for 3-letter words (cat, dog, sun).
- **Syllable boxes** (harder): one box per syllable — good for 2–3 syllable words.

**Layout:**
- Top: large image of the object or animal.
- Bottom: row of 2 or 3 equally-sized boxes. Box count matches the word length
  (letters) or syllable count depending on the variant.
- Optional: faint dotted guide lines inside each box for writing.

**Rules:**
- 2-box variant: only use 2-syllable words (apple, tiger, mango, rabbit...).
- 3-box variant: only use 3-syllable or 3-letter words (elephant, banana, cat, dog...).
- Word must be a common, recognisable object or animal that matches the image.
- Never use words with silent letters for the letter-box variant (keep it phonetic).
- Image must unambiguously show the object — no abstract or dual-meaning images.

**Grades:** Grade 1 – 3 (KG and Pre-KG cannot read or write words/syllables; Grade 1 does letter-box only with 3-letter phonetic words; Grade 2–3 does syllable boxes)

---

### W5. Science Sort (formerly W6)

**What it is:** A sorting / classification activity. A set of images is shown and
the child places (or circles / writes) each item into the correct category. Each
page focuses on one property with exactly two opposing categories.

**Category pairs (each is its own worksheet variant):**

| Variant | Category A | Category B | Library ready? |
|---------|-----------|-----------|---------------|
| Solid or Liquid? | Solid | Liquid | ✅ solid: rock, bread, ice-cube, apple, coins etc. / liquid: milk, juice, tea, honey, jam, rain |
| Flying or Walking? | Flying | Walking | ✅ flying: birds + insects / walking: animals folder (35) |
| Living or Non-Living? | Living | Non-Living | ✅ living: animals/birds/insects/plants / non-living: household/vehicles/tools |
| Hot or Cold? | Hot | Cold | ✅ hot: fire, sun, lava, volcano, tea, kettle, steak / cold: snowflake, snowman, ice-cube, ice-cream, mittens, scarf, earmuffs |
| Floats or Sinks? | Floats | Sinks | ✅ floats: boat, leaf, log, apple, orange, duck, feather / sinks: rock, anchor, anvil, coins, key, iron, hammer |
| Farm or Wild? | Farm Animal | Wild Animal | ✅ farm: cow, horse, pig, sheep, goat, donkey, hen, rooster, duck, goose / wild: lion, tiger, elephant, giraffe, zebra, bear, wolf |
| Land or Water? | Land animal | Water / sea animal | ✅ land: animals folder (35) / water: sea-creatures folder (19) |
| Day or Night? | Seen in daytime | Seen at night | ⚠ day: sun, rainbow, sunflower, butterfly (~5) / night: moon, star, owl, candle — only 4. Need: bat, firefly, pajamas/bed, telescope (4+ new images) |

**Layout:**
- Top: bold question banner (e.g. "Is it Solid or Liquid?")
- Middle: 6–8 images in a row or grid — each image has a blank box or two-column
  drop zone below it.
- Bottom: two labelled columns ("Solid" / "Liquid") — child writes the name or
  draws a line from the image to the correct column.

**Two sub-variants:**
- **Sort & Write** (Grade 1+): child writes the object name in the correct column.
- **Circle the Category** (Pre-KG / KG): two word choices printed under each image;
  child circles the correct one (e.g. "Solid   Liquid" under a picture of water).

**Rules:**
- Exactly 6–8 items per page. Always an even split (3–4 per side) — never all in
  one category.
- Items must be unambiguous for that property — no edge-case objects (e.g. ice is
  fine for solid, but avoid foam / jelly which children may debate).
- Distractors come from the OPPOSITE category only — not random objects.
- Image must clearly depict the object so the child can identify it without the label.
- For "Flying or Walking?" — only use animals (no vehicles). Flying = birds, insects,
  bats. Walking = mammals, reptiles, amphibians.
- For "Living or Non-Living?" — use a clear mix: animals + plants on one side;
  furniture, vehicles, rocks on the other.
- For "Land or Water?" — land side uses `animals/` folder (35 land animals); water
  side uses `sea-creatures/` folder (19 creatures). Library coverage is good. ✅
- For "Day or Night?" — ⚠ library too thin for a reliable split right now.
  Day side: sun, sunny, rainbow + a few daytime insects/flowers (~4–5 images).
  Night side: moon, star, owl — only 3 clear "night" items.
  **Need to add before building:** bat, firefly, lantern/lamp, pajamas/bed,
  telescope, cricket/moth, night-sky scene (6–8 new images minimum).

**Grades:** KG – 3
- Pre-KG: excluded — cannot read category labels or write names
- KG: Circle variant only — two picture labels (not words) or teacher reads the question aloud; child circles each image under the correct column header
- Grade 1–3: Sort & Write variant — child writes the object name in the correct column

---

### W6. Find the Word (Word Search) — NEW MODE (agreed 2026-10-10 → in SATURDAY 2026-10-17 release list)

**What it is:** A standalone mode card next to Maze and Sudoku (same pattern: age slider,
page-count, fresh puzzle on every Generate, optional answer page). Each page = a letter
grid with hidden words + the list of words to find above it.

**Difficulty by age** (slider starts at age 6 — NO age 5; age 6 = the simplest level):
| Age | Grid | Words to find | Word length | Directions |
|---|---|---|---|---|
| 6 | 6×6 | 5 | 3 letters | → ↓ |
| 7 | 7×7 | 6 | 3–4 | → ↓ |
| 8 | 8×8 | 8 | 3–5 | → ↓ ↘ |
| 9 | 10×10 | 10 | 4–5 | → ↓ ↘ |
| 10 | 11×11 | 12 | 4–6 | → ↓ ↘ ↗ |
| 11–12 | 12×12–14×14 | 12–15 | 5–7 | → ↓ ↘ ↗ |

**NO backward words (decided 2026-10-10):** every word reads forwards — never ← ↑ ↖ ↙
(reversed letters). ↗ is allowed from age 10 because it still reads left-to-right.
Difficulty grows through grid size, word count and word length instead.

**Words:** MIXED (no themed puzzles — decided). Minimum 3 letters (2-letter words occur
by accident in random filler → several "answers", key looks wrong).

**Pictures only up to age 7** (decided 2026-10-10): ages 6–7 show the clipart picture
beside each word (uses the 184 spelling-ready library words). **Age 8+ = words only.**

**Word library (needed — the sample repeated words because its lists were tiny: 13
picture words / ~90 words):** build `assets/word-search-words.json` — a curated list of
everyday + classroom vocabulary, grouped by age and length, aiming ~300–500 words per age
band so repeats are rare. Sources to draw from (vocabulary common to state, national and
international boards): high-frequency/sight-word lists (Dolch, Fry), Cambridge Young
Learners wordlists (Starters/Movers/Flyers), and everyday topics taught in primary
classes everywhere (home, school, body, food, animals, weather, transport, jobs, places,
time, feelings, nature, science basics). Rules for the list:
- Nouns/verbs/adjectives a child of that age actually knows; no proper nouns, no slang.
- Avoid words with British/American spelling differences (colour/color, centre/center,
  favourite) — a child may know the other spelling and "not find" it.
- No words that could read as rude or scary; reviewed once by Vijay (skim, not author).
- Built by us from these references (word lists are vocabulary, not copied text).

**No repeats:** a word never appears twice in one generated set (across all its pages),
and the generator avoids the words used in the last few generations in that browser
(localStorage memory, like a "recently used" list) so clicking Generate again feels fresh.

**Generator rules (correctness):**
- Every listed word appears EXACTLY ONCE in the grid (scan all 8 directions after fill —
  even though words are only PLACED forwards, a filler accident can spell one backwards).
- Filler letters must never spell a rude/unsafe word in any direction — scan against a
  blocklist, re-roll filler on a hit.
- Young bands: no overlapping words; older bands may share letters at crossings.
- Grid cell size sized for print legibility (A4; ~11 mm cells at 14×14).

**Last page:** answer key — same grid(s), each word circled with a rounded outline
(optional toggle, like Maze's answer-key switch) + the classic promo block for other tools.

**Hindi:** UI/instructions in Hindi ("छिपे हुए शब्द ढूँढो और उन पर सर्कल बनाओ"), words stay
ENGLISH in v1 — Devanagari matras/conjuncts don't split cleanly into grid cells; a Hindi
word search needs its own design later.

**SEO:** single-activity mode → clean slug shape `word-search-for-kids-{seed}` (fits the
HONESTY constraint like maze/sudoku). Not in keyword research yet — check volume first.

**Existing:** the tiny 5×5 `word-search` inside Class 2–5 mix sheets stays as is.
**Effort:** ~1–2 sessions (reuse Maze mode slider/page plumbing).

---

### W7–W11. Question types unlocked by the new pictures (added 2026-10-11)

All are MIX-sheet activities (join `ACT_POOLS`, picked at random, age-matched), English +
Hindi, png- and emoji-mode aware (fall back to another activity if too few pictures exist
in the current mode — same guard pattern as `use-for` / `hungry-thirsty`).

| # | Question | How it works | Pictures | Ages |
|---|---|---|---|---|
| **W7** | **Land, water or air?** | Sort 6 vehicles into 3 columns by where they travel | land: bus, train, truck, van, tram, car, taxi, tractor… · water: boat, ship, submarine · air: airplane, helicopter, hot-air-balloon, rocket | KG – Class 1 |
| **W8** | **Wild, farm or pet animal?** | Sort / circle by habitat tag (`habitat:wild/farm/home`) | animals section (tags already set) | KG – Class 2 |
| **W9** | **Which one is a reptile?** (or bird / mammal / amphibian) | Circle the one(s) of the asked group among 4–6 | reptile: snake, tortoise, crocodile, sea-turtle · amphibian: frog · birds · mammals | Class 2 – 3 |
| **W10** | **Things that keep us clean** | Circle the hygiene items among mixed household things | soap, tap, towel, toothbrush, toothpaste, comb, bucket | KG – Class 1 |
| **W11** | **Hot or cold food?** | Sort food & drinks by `temp` tag | hot: soup, rice, noodles, tea, pizza · cold: salad, ice-cream, juice, ice-cube | KG – Class 1 |

**W5 Day or Night** (Science Sort above) is now UNBLOCKED — bat, lantern, telescope, bed
were made 2026-10-09/11 (night: bat, owl, moon, star, lantern, telescope, bed, sleeping-child ·
day: sun, sunny, butterfly, kite, sunflower…). Firefly/moth still missing — not required.

**Correctness rules:** every picture belongs to exactly ONE answer group (no ambiguous items:
e.g. duck = land AND water → excluded from W7-style sorts; frog = amphibian, never "reptile");
never show a group with 0 correct pictures; W9 uses scientific groups only from Class 2.

**Hindi labels (draft, WhatsApp-teacher style):** ज़मीन / पानी / हवा · जंगली / फार्म /
पालतू जानवर · रेंगने वाले जानवर (रेप्टाइल) · हमें साफ़ रखने वाली चीज़ें · गरम या ठंडा खाना.

---

### W12. Chart Master — printable picture charts (agreed 2026-10-12; after Saturday)

**What:** A4 printable charts built from the picture library. Samples (look approved):
`Resources/trials/fruits-chart-sample.png`, `chart-sample-az.png`, `chart-sample-veg.png`,
`chart-sample-ani.png`; renderer prototype logic = pastel rounded cards, bold name, Hindi
name below (font: Nirmala UI renders Devanagari correctly), ViLo footer + URL.

**Name:** "Chart Master" in-product (matches Math Master). Page title for SEO:
"Free Printable Picture Charts for Kids — Fruits, Animals, A to Z (English & Hindi)".
**Where:** own page `/charts` (separate search intent: "fruits name chart", "alphabet chart";
must not compete with /worksheet) + a card linking to it from /worksheet. Check keyword
volume first. NOTE: this is a NEW page/UI — approved front-end work, not a generator-only fix.

**Selection flow:**
1. What chart? Picture chart · A to Z · Numbers 1–20
2. Topic (picture chart only): one card per COMPLETE section (≥12 pictures) with counts
3. Language: English · English + हिंदी
4. Size: Big cards (12/page) · Standard (20/page) · Everything (all pictures, extra pages)
→ Make my chart → preview → Download PDF · Print · Share (same pipeline as worksheets).

**UI QUALITY BAR (Vijay, 2026-10-12): the selection UI must look neat, clean and professional —
"made by a high-grade professional".** Concretely: same design language as the existing
/worksheet picker (cards, spacing, fonts, colours) so it feels like one product; generous
whitespace; one clear step at a time with a visible progress line (1 · 2 · 3 · 4); real
picture thumbnails on topic cards (not emoji); consistent card sizes and alignment; clear
selected state; smooth but subtle transitions; one obvious primary button; fully responsive
(phone first — most parents are on mobile); no clutter, no jargon, no walls of text. Review
on phone + desktop screenshots with Vijay before launch.

**Rules:**
- Fresh on every click: shuffled order + card colours (like worksheets).
- English-only uses INTERNATIONAL names (Eggplant, Bell pepper); English + Hindi uses Indian
  English (Brinjal, Capsicum, Chilli) + Hindi below. Needs a per-picture name table
  (en-intl, en-in, hi) — Hindi names reviewed once by Vijay before launch.
- A to Z: pictures were too small in the 1-page sample → picture beside the letter, or 2 pages
  (A–M, N–Z), or landscape. Choose a word per letter that has a good picture (Q=Queen,
  X=Xylophone, Y=Yo-yo, U=Umbrella, I=Igloo…).
- Numbers 1–20: number + word (+ Hindi) + that many pictures to count.
- Same footer/branding + user-awareness tip ("check the names before printing") as other tools.
- **Web address must be clearly visible, never faded (Vijay, 2026-10-12):** footer URL in
  BOLD dark brown `#3D2B1F` (~13:1 contrast on cream — readable in colour AND black-and-white
  prints), ~46px at 192dpi, with a small gold globe mark (leave a little space before the
  text); gold `#C8963C` only for the rule line/mark, never for the URL text (2.6:1 — too faint).
  On chart pages the URL should be the page's own address (vilolabs.in/charts).
  Sample with the new footer: `Resources/trials/chart-sample-veg.png`.

---

## Other Ideas (Worksheet)

- **Colour by Letter** — colour each region based on a letter-colour key (A=red, B=blue…)
- **Mirror the Image** — half of a simple symmetrical image is given; child draws the other half on a grid
- **What Comes Next?** — sequences of shapes/patterns; child draws the next 2 items
- **Which Is Bigger / Smaller?** — compare pairs of objects; child circles the bigger (or smaller) one
- **How Many Sides?** — shapes shown, child writes the number of sides/corners

---

## Website / Platform

*(Add planned site features here as they come up)*

---

## Infrastructure

*(Add planned technical work here)*

---

*Last updated: 2026-06-01*
