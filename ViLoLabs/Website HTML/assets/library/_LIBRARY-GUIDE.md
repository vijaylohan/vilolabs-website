# ViLoLabs Image Library — Master Guide

How to build the worksheet image library. Read this once, then work folder
by folder. Each category folder has its own `_images.md` listing every
image to create.

---

## IMAGE SPEC (applies to EVERY image)

| Setting | Value |
|---|---|
| **Format** | PNG (transparent background) — NOT JPEG |
| **Canvas** | 1024 × 1024 px, square |
| **Subject** | Centered, fills ~80% of the canvas |
| **Background** | Transparent (no white box, no scene) |
| **Style** | Flat cartoon clipart, bold black outline, bright flat colors |
| **Shadow** | None |
| **Text** | None |

Why PNG: worksheets place images on colored cells/scenes — transparency
lets the image sit cleanly. JPEG leaves a white box and fuzzy outlines.

---

## STYLE + FRAMING PHRASE (already inside every prompt)

Every prompt in the `_images.md` files ends with:

> `transparent background, bold black outline, bright flat colors, full body, front view, centered, children's worksheet style, no shadow, no text, square 1:1 frame, subject centered, even margin all sides, subject fills 80 percent of canvas`

The FRAMING part matters: it forces every image — tall (giraffe) or wide
(turtle) — into the same square 1:1 canvas, centred, with even margin, the
subject sized to ~80% of the frame. This keeps every image visually
consistent so they line up neatly in worksheet grids.

When you export: set the tool to a SQUARE size — 1024 × 1024 px PNG.
Do not crop afterwards — the even margin is intentional.

---

## HOW TO WORK

1. Open a category folder (e.g. `animals/`).
2. Open its `_images.md` file.
3. For each entry: copy the PROMPT into your AI image tool
   (Ideogram / Bing Image Creator / DALL-E).
4. Download as PNG, transparent background.
5. Save into that folder with the EXACT filename listed (e.g. `bear.png`).
6. Lowercase, hyphens-not-spaces. Mark it ✅ DONE in the md if you like.

---

## NAMING RULES

- Lowercase only: `bear.png` not `Bear.png`
- Hyphens for spaces: `highland-cow.png` not `highland cow.png`
- Match the filename in `_images.md` exactly — the generator looks it up.

---

## PROPERTY TAGS

Each entry has a TAGS line. These feed the worksheet generator so it can
build activities like "Circle the Gas" safely. You don't create anything
for tags — they'll be copied into `library.json` later. Just leave them.

Tag meanings:
- `class` — mammal/bird/insect/fish/fruit/vegetable/vehicle/object etc.
- `alive` — living / non-living
- `habitat` — farm / wild / sea / sky / home / n-a
- `state` — solid / liquid / gas (for Science)
- `temp` — hot / cold / neutral
- `can` — fly / bounce / has-wheels / swim (abilities)
- `pairWith` — the partner image for "Things That Go Together"

---

## CATEGORY FOLDERS (23) + counts

HIGH priority (build first — used most):
  animals (33) · birds (21) · insects (12) · sea-creatures (19)
  fruits (13) · vegetables (15)

MEDIUM priority:
  food (30) · household (38) · vehicles (19) · nature (21)
  plants (19) · clothing (23) · toys (14)

LOW priority:
  buildings (19) · stationery (19) · people (21) · instruments (14)
  sports (8) · tools (13) · body-parts (13) · dinosaurs (9)
  fantasy (6) · symbols (27)

## PREBUILT FOLDERS (full-page activities — not library images)

  prebuilt/mazes/ · prebuilt/sudoku/ · prebuilt/trace/ · prebuilt/science/

These hold complete worksheet-page images, made individually. They do NOT
use the library. Different workflow — handled separately.
