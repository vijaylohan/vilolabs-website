# ViLoLabs Worksheet — Activity Type Catalog & Generator Rules

Every activity variant across the 7 worksheet categories, with the rules the
generator MUST follow so it never produces a broken worksheet.

Aim: generated PDFs match the quality/structure of the sample worksheet PDFs.

---

## 1. SCIENCE — "Circle the [category]" (30 variants)

ONE template: 3×3 grid, 9 cells, each = image + text label. Child circles the
items belonging to the named category.

The 30 variants come in OPPOSITE PAIRS — build one content pool, swap roles:

| Variant | Correct items | Distractors (opposite) |
|---|---|---|
| Circle Things That Are Solid | solids | liquids/gases |
| Circle Things That Are Liquid | liquids | solids/gases |
| Circle Things That Are Gas | gas/vapor/wind | solids/liquids |
| Circle Things That Are Cold | cold things | hot things |
| Circle Things That Are Hot | hot things | cold things |
| Circle Things That Are Wet | wet things | dry things |
| Circle Things That Are Dry | dry things | wet things |
| Circle Things That Float | floating | sinking |
| Circle Things That Sink | sinking | floating |
| Circle Things That Bounce | bouncy (balls, yoyo) | non-bouncy |
| Circle Things That Breathe | living | non-living |
| Circle Things With Wheels | wheeled vehicles | non-wheeled |
| Circle Things That Fly | flying animals + aircraft | non-flying |
| Circle Living Things | living | non-living |
| Circle Non-Living Things | non-living | living |
| Circle Farm Animals | farm animals | wild animals |
| Circle Wild Animals | wild animals | farm animals |
| Circle Sea Animals | sea animals | land animals |
| Circle Birds | birds | non-bird animals |
| Circle Insects | insects | non-insect animals |
| Circle Flowers | flowers | non-flower plants/objects |
| Circle Plants | plants | objects/animals |
| Circle Dinosaurs | dinosaurs | modern animals |
| Circle Things Part Of Your Body | human body parts | animal body parts |
| Circle Things Part Of Your Face | facial features | non-face body parts |
| Circle Clothes To Keep You Warm | winter clothing | summer clothing |
| Circle Clothes To Keep You Cool | summer clothing | winter clothing |
| Circle Things You Need When It Rains | rain gear | non-rain items |
| Circle Things In The Sky | sky objects | ground objects |
| Circle Things In The Ocean | ocean things | non-ocean objects |

RULES:
- Exactly 9 cells, each = image + noun label.
- 3-4 correct answers + 3-4 distractors. NEVER 0 correct, NEVER 9 correct.
- Distractors = the OPPOSITE category, not random items.
- Never include an item whose category is ambiguous for that question.

---

## 2. CIRCLE THE TWO MATCHING PICTURES (1 variant)

Instruction (always): "Circle the Two Matching Pictures"
3×3 grid, 9 cells, thick red border, no labels.

RULES:
- 9 cells: exactly 1 identical pair (2 same) + 7 unique distractors.
- All 9 should be the SAME object class/theme (all cats, all hats) so it
  needs real visual discrimination.
- Exactly ONE pixel-identical pair — never accidental near-duplicates.

---

## 3. THINGS THAT GO TOGETHER (2 variants)

### 3a. Match Pairs — draw a line
Instruction: "Things That Go Together"
2 columns × 5 rows. Left = 5 items, Right = 5 items (SCRAMBLED).

RULES:
- Exactly 5 related pairs (bird+nest, key+lock, cow+milk, bee+honey...).
- Each left item has exactly ONE valid partner.
- Right column order MUST be shuffled.
- Relationship must be unambiguous — no item that matches two partners.

### 3b. Odd-One-Out — "Circle Picture That Does Not Belong"
Instruction: "Circle Picture That Does Not Belong."
4 row-boxes, 4 items per row.

RULES:
- Each row = 3 same-category items + 1 clear outsider.
- Odd one must be a DIFFERENT KIND of object (not just different color).
- Never a row where 2+ items could be the odd one.

---

## 4. SUDOKU (1 core mechanic, 2 sizes)

Picture Sudoku (Latin square — each row & column has each picture once).
Title banner: "SUDOKU" + theme. No sub-boxes.

| Variant | Grid | Images | Pre-filled | Cut strip |
|---|---|---|---|---|
| 4×4 | 16 cells | 4 distinct, ×4 each | ~10/16 | Yes |
| 6×6 | 36 cells | 6 distinct, ×6 each | ~22-24/36 | No |

RULES:
- Image count MUST equal grid side (4 images for 4×4, 6 for 6×6).
- Each image appears exactly N times. Valid UNIQUE solution.
- 4×4 renders a cut-out strip; 6×6 omits it.
- Always generate matching Answer Key.
- Images can be color variants of one object — visually distinct only.

---

## 5. NUMBER ACTIVITIES (12 activity types)

| Type | Instruction | Key rule |
|---|---|---|
| 5a Missing Numbers | "Write the missing numbers." | Contiguous sequence, each blank uniquely solvable |
| 5b Dot to Dot | "DOT TO DOT" | Consecutive dots no gaps; include colored reference image |
| 5c Trace the Numbers | "TRACE THE NUMBERS" | 1 numeral/row, dashed guides, solid model first |
| 5d Connect Number to Word | "CONNECT THE NUMBER TO ITS WORD" | Right column scrambled; 5 pairs |
| 5e Color the Numbers | "COLOR THE NUMBERS" | 5 hollow numeral outlines, free coloring |
| 5f Color by Numbers | "COLOR BY NUMBERS" | EVERY key number used in picture & vice versa |
| 5g Circle Matching Number | "CIRCLE THE MATCHING NUMBER" | Every row has >=1 match of target |
| 5h Count and Write | "COUNT AND WRITE" | Drawn quantity = answer; 1 box per object type |
| 5i Count and Connect | "COUNT AND CONNECT" | Counts distinct; right column scrambled |
| 5j Choose the Right Answer | "CHOOSE THE RIGHT ANSWER" | True count must be one of 3 choices |
| 5k Find and Color | "Color the box according to the color code." | Both key numbers appear in grid |
| 5l Number Poster | "NUMBERS 0-9" / "1-20" | Display only; shown quantity = numeral |

---

## 6. 50 MAZES (3 maze types)

| Type | Description | Rule |
|---|---|---|
| 6a Scene Maze | Path through illustrated scene, start char -> goal object | Exactly 1 solvable path |
| 6b Shape Maze | Maze inside a shape outline (heart, star, animal...) | 1 path; clear entry/exit arrows |
| 6c Tangle Maze | 4 animals top -> 4 foods bottom, crossing lines | 4 correct pairs; paths must cross |

---

## 7. TRACE THE PATH (2 variants)

### 7a. Multi-Row Tracing — 5 horizontal trace lines per page
- Solid lines (easier) = arrow start marker
- Dashed lines (harder) = dot start marker
- Each line ends in a themed reward picture; mix path shapes.

### 7b. Single Scene Tracing — 1 wide path through illustrated scene
- Start = character, end = goal object. Winding/angular/looping.

Both always titled "Trace the Path."

---

## CROSS-CUTTING SAFETY RULES (apply to the generator)

1. CATEGORY-PRESENCE GUARD — never emit an instruction with an empty answer
   set. "Circle the Gas" requires >=3 gas-tagged images in the 9-cell pool.
2. UNIQUE-ANSWER GUARD — Matching = 1 identical pair; Sudoku = 1 valid
   solution; Maze = 1 path. No accidental extra solutions.
3. KEY/REGION CONSISTENCY — Color by Numbers: every key number used, every
   picture region's number in the key.
4. NON-EMPTY MATCH GUARD — Circle the Matching Number: every row >=1 match.
5. COUNT-EQUALS-ANSWER GUARD — counting activities: drawn count = answer.
6. SCRAMBLE GUARD — all line-matching: right column never same order as left.
7. CONTIGUOUS-SEQUENCE GUARD — number sequences have no gaps.
8. FIXED CELL COUNTS — Science & Matching = 9 cells. Sudoku images = grid
   side. Things Together = 5 pairs or 4×4. Trace multi-row = 5 rows.
   Tangle maze = 4 pairs.

---

## IMPLICATION: IMAGE LIBRARY NEEDS PROPERTY TAGS

For the CATEGORY-PRESENCE GUARD to work, every library image must carry
property tags. The generator filters images by tag to fill each activity.

Required tag dimensions per image:
- state: solid | liquid | gas
- temperature: hot | cold | neutral
- moisture: wet | dry | neutral
- buoyancy: floats | sinks | n/a
- alive: living | non-living
- habitat: farm | wild | sea | sky | n/a
- class: mammal | bird | insect | fish | reptile | dinosaur | plant |
         flower | vehicle | clothing | food | object | body-part | tool
- can: fly | bounce | has-wheels | breathe   (multi-value flags)
- season: winter-wear | summer-wear | rain-gear | n/a
- pairWith: <image-id>   (for Things That Go Together)
- oddGroup: <category-id> (for odd-one-out grouping)

Example:
  "animals/bee.png": {
    name: "Bee", class: "insect", alive: "living", habitat: "sky",
    can: ["fly"], pairWith: "food/honey.png"
  }
  "nature/ice-cube.png": {
    name: "Ice cube", state: "solid", temperature: "cold",
    buoyancy: "floats", alive: "non-living", class: "object"
  }

Without these tags the Science and Things-Together activities cannot be
generated safely. Tagging is the foundation step.
