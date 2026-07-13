# ViLoLabs Tools — Feature Gaps (Keyword-Driven Backlog)

High-volume search terms discovered in Keyword Planner audits whose **intent
the current tool cannot satisfy honestly**. Adding these features would
unlock the corresponding keyword clusters without breaking our honesty rule
(never claim what the tool can't do — see `LANDING-PAGE-PLAYBOOK.md` and
CLAUDE.md → "STRUCTURED DATA SAFETY" and "honesty" notes).

Sorted by value ÷ effort. Companion: `TOOLS-SEO-PLAN.md` (SEO-only pass on
existing features) — this doc is the *feature build* backlog.

Last audited: 2026-07-13 (batches 1 + 2, 7 of 8 tool CSVs pulled).

---

## 🥇 High value / low-medium effort — build these first

### 1. Compress PDF — target-KB mode ⭐⭐⭐
**Keywords locked out today:** "compress pdf to 100kb," "compress pdf to
200kb," "compress pdf to 500kb," "compress pdf for upsc," "compress pdf for
ssc" — each surfaces as high-volume in India. Currently the tool only
exposes Light/Medium/Strong quality presets; users can't say "hit 100 KB."

**Build:** target-KB loop — same pattern the resize-image tool already
uses. Iterate JPEG quality on embedded photos (and, if still over, downscale
photo dimensions in a second pass) until file ≤ target, else stop at
minimum-quality output and warn honestly.

**Complexity:** MEDIUM. The compression primitive already exists (pdf-lib +
JPEG re-encode). New: a size-fit outer loop + a target-KB UI field with
presets (100/200/500 KB, 1 MB).

**Honest limit:** we should be upfront in the UI/FAQ — if the PDF is mostly
text (no photos to shrink), we can't hit an arbitrary KB target. Show the
"can't shrink further" message we already have on the quality path.

**Unlock:** ~5 direct target-KB terms + all UPSC/SSC/exam-form long-tails
that combine "for [exam] under [KB]." Very India-relevant.

### 2. Resize Image — cm / inch units ⭐⭐
**Keywords locked out today:** "resize image in cm," "resize photo in cm,"
"passport photo 3.5x4.5 cm," "photo resize in inches." Government-form
specs are typically stated in cm; the tool only takes pixels/percent/KB.

**Build:** unit dropdown next to the width/height inputs (px | cm | inch).
Convert to pixels internally at 300 DPI (or a chosen DPI). Show the
resulting pixel size back to the user for transparency.

**Complexity:** LOW. Two-line conversion, one dropdown, one small
"1 cm = 118 px @ 300 DPI" hint.

**Honest limit:** none — this is a pure UX unlock. Feature is a truthful
superset of what's there now.

**Unlock:** 50k+/mo for the "in cm" cluster + all the "passport 3.5x4.5"
searches that dominate Indian exam-form traffic.

### 3. Merge PDF — add "split" companion ⭐⭐
**Keywords locked out today:** "split and combine pdf," "split pdf," "extract
pages from pdf," "pdf splitter." Small but real, and a genuine one-two combo
with merge.

**Build:** either extend Merge PDF with a "split" tab or ship a
`/tools/split-pdf` sibling. pdf-lib exposes `.copyPages()` — trivial.

**Complexity:** LOW. Two UI states (whole PDF → page range picker → download
individual PDFs or a ZIP), reuse existing drop-zone.

**Honest limit:** none.

**Unlock:** modest, but comes with genuine cross-linking benefit — Merge and
Split naturally link to each other in copy.

### 4. QR Generator — bulk mode ⭐
**Keywords locked out today:** "bulk qr code generator," "generate multiple
qr codes." ~50k/mo — smaller than the compress/resize wins but recognizably
real.

**Build:** paste a textarea list (one URL/text per line), generate all QRs,
download as a ZIP. Reuse the single-QR renderer in a loop; JSZip already
loaded on the pdf-to-image tool — copy that dep.

**Complexity:** LOW. Textarea + loop + ZIP.

**Honest limit:** none.

**Unlock:** the bulk cluster + potential B2B share ("I generated 200 QRs
for our event…").

---

## 🥈 High value / high effort — plan carefully before building

### 5. PDF to Word — scanned-PDF OCR support ⭐⭐⭐ (big lift)
**Keywords locked out today:** "scanned pdf to word," "ocr pdf to word,"
"image pdf to word," "handwritten pdf to word." Huge volume. Today our tool
only text-extracts from native PDFs — scanned PDFs return empty text.

**Build:** Tesseract.js in the browser. Render each PDF page (we already
know how — pdf-to-image does it), run OCR over the canvas per page,
concatenate the recognised text into the DOCX.

**Complexity:** HIGH. Tesseract.js is ~10 MB, English + Hindi model files
another few MB each, and OCR is slow (multi-second per page). Needs a
progress bar, a language picker, and honest "OCR results depend on scan
quality" copy in the UI. Runs entirely client-side, which matches our
privacy model — that's the win over competitors.

**Honest limit:** OCR is never 100% accurate — every generated .doc must
carry a "please review — OCR is imperfect" note in the UI (existing
awareness-tip pattern). Bad scans → garbage output; can't hide that.

**Unlock:** the biggest single keyword cluster locked out on the tool
today. Would fundamentally change PDF-to-Word's usefulness.

### 6. Compress Image — target-KB mode
**Status:** may already exist — need to verify. The Resize Image tool has a
target-KB mode; the *dedicated* Compress Image tool should too if it doesn't.
If missing, same LOW-effort target-KB loop as resize.

**Complexity:** LOW if the primitive exists — just wire the UI.
**Honesty limit:** same as resize (can't guarantee arbitrary target with
poor input).
**Unlock:** the same India exam-form terms compress-pdf would unlock, on
the image side.

---

## 🥉 Low priority / caveat-heavy

### 7. QR Generator — QR reader / scanner
**Keywords showing up:** "qr code scanner," "qr code reader" — these are
generator-vs-reader intent mismatches, not gaps in our tool. Users typing
"scanner" want their camera to read a QR; that's a different product.
Don't build. Just ignore this intent in copy edits.

### 8. Merge PDF — merge JPG to PDF
**Keywords:** "merge jpg to pdf" — this is exactly what Image to PDF does.
Cross-link between the two tools when relevant, but don't rebuild it
inside Merge PDF.

---

## How to use this doc

- When starting a feature build sprint: pull from the top of the list; each
  entry has enough scope to plan a single ticket.
- When editing a tool page for SEO: DO NOT claim any keyword whose
  corresponding row here is unbuilt. Add it to the copy only *after* the
  feature ships and is verified.
- When new Keyword Planner data comes in: audit against tool pages, add any
  new "high-volume + not-doable-today" cluster as a new row here.
