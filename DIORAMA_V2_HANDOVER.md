# Diorama v2 - handover (branch `claude/diorama-v2-wip`)

Read this first, then the project handover Hardik keeps on his Mac (`CLAUDE_HANDOVER.md`,
he can upload it). This file is technical only: the repo is public, so no personal
details go in here.

## Where things stand (2026-09-28)

- `main` is live on GitHub Pages. Nothing on this branch is live.
- `/diorama/` is untouched by the v2 work (its `products.js` still carries the first,
  placeholder `alici` option from the previous commit).
- `/diorama-v2/` now has procedural bedrooms, a calmer default UI and a real Alici chair.

## Done in v2

### Bedrooms rebuilt (`diorama-v2/bedrooms.js`)

Her four bedroom GLBs are no longer loaded in v2. Each room is rebuilt from boxes,
extrusions and a few curves in the flat's style, at the positions, sizes and facing of
her design. Nothing copies her geometry.

- Positions and sizes: read from her GLBs by welding each mesh into connected pieces and
  taking their bounding boxes in plan metres (placed by `zone.json` `rooms[].model`).
  The coordinates sit in `bedrooms.js` as plan boxes, so they can be checked against the
  DXF when Hardik uploads it.
- Colours and details: from `assets/renders/*_hero_*.jpg`.
- Per room:
  - Bedroom 2: taupe bed wall with a backlit onyx arch, grey upholstered headboard, bed on
    a dark plinth, floating side tables, 4-door wardrobe with bronze bars, white desk and
    grey shell chair under the window, quilted bench, fluted-glass display cabinet,
    fluted panel, roman blind, rose rug, beige marble floor.
  - Bedroom 1: fluted panels either side of a gridded panel, tan leather framed
    headboard, 6-door grey wardrobe with star cut-outs, walnut desk and chair, floating
    fluted console with grey marble top, wall TV, walnut and black wall cabinet, leather
    ottoman, grey swirl rug, balcony-door curtain.
  - Bedroom 3: dark oak floor, grey channel headboard under a backlit wave panel, navy
    and grey bedding, floating white side tables, 5-door grey wardrobe with one sine
    groove, white desk on black legs with a drawer pedestal and black shelves, walnut
    chair, taupe drapes.
  - Master: grey marble floor, full-width cream channel headboard wall with a light line,
    king bed, grey side tables, agate rug, 16-drawer chest with dark marble top,
    backlit mirror, TV on the partition, cream 4-door wardrobe, study with desk, grey
    wall cabinet and open walnut shelves, low cabinet, two cognac leather shell chairs
    and a stone drum table, grey-green drapes.
- TVs are real boxes now: a 3 cm body on a wall bracket, a glossy screen.
- Tall pieces stop at the section cut with a dark cap, like the walls.
- Weight: bedroom geometry went from about 2.79 M triangles and 218 textures (GLBs) to
  about 168 k triangles and 15 textures. No GLB downloads.
- Open question answered by default: the rebuilt rooms stay locked to her finishes
  (own floors, own materials, not in the configurator's slots, not movable). Walls stay
  on the flat's paint. Ask Hardik if he wants them configurable.
- Known simplifications, to check with her:
  - Bedroom 3's drapes hang straight across the window opening at y 13.44. In her model
    they follow a bay beyond the room line that the flat's shell does not model.
  - Shell walls come from the DXF shell, hers from a draft registration, so a few pieces
    were clamped a few cm to fit the shell (Bedroom 3 headboard, Master bed length).
  - Small props (books, vases, lamps, AC units) are left out.
- The near-wall trim in single-room view is now 70 cm deep (was 45), so a wardrobe on
  the camera side drops to knee height with its wall.
- `diorama-v2/rooms-materials.js` was removed (it only coloured her GLBs).

### Declutter (toward sael.net/interior)

- Moodboard cards and their threads are hidden by default; the eye button or N shows
  them.
- The sun's dashed arc and hour marks show only while the sun is hovered or dragged.
- Small rooms (toilets, store, walk-in, lobby, foyer) show their label only while the
  pointer is over them: 8 labels at once instead of 16.

### Alici chair (v2 `products.js`)

Read from the Living Shapes product page and its spec image (SKU LS-1087):
Rs 6,399 (MRP Rs 10,665), 20.75 W x 22.5 D x 33.25 H in (52.7 x 57.2 x 84.5 cm), seat
16.5 in to the cushion plus a 3 in cushion (49.5 cm), back 15 in above the seat, seat
depth 17 in, legs on a 15 x 15 in square, rust bouclé (100% polyester), metal legs in a
matt powder coat that matches the fabric, 5.8 kg, 120 kg capacity. Price is the site's
sale price on 2026-09-28 and can change. v2 now has its own builder with these.

## Still open

1. Hardik to review the rooms against her renders (`/diorama-v2/`, click each bedroom).
2. Locked vs configurable bedrooms (see above).
3. Phone layout of the diorama is still broken (labels pile up, panels overlap).
4. Her DXF and `assets/diorama/layout.json` would let the bedroom boxes be checked
   against the drawing instead of her draft-registered GLBs.
5. `/diorama/products.js` still has the placeholder Alici; port the v2 builder if v2 does
   not replace v1.

## Rules

- Never commit or push to `main` without Hardik's explicit yes in the current message.
- No em dashes in any output. Use a hyphen.
- Keep the scene light (he tests on an 8 GB M1 Mac and on phones).
