# Diorama - handover (current worktree branch `codex/diorama-additions`)

## Update - 2026-09-30 (2): WCs face the room, designer walls behind the showers, bedroom floors fixed

- **WCs** (`diorama.js`, `B.wc`): all four faced along their wall. The builder used `backDir()`, which looks for a wall beside a piece's short side (right for counters), but a WC's wall is at the end of its long side (the pan projects from the wall). It now finds that end, faces away from it, and sits the pan's back on the wall face (the four CAD WCs all meet a wall 5 cm past one end).
- **Designer walls** (`products.js`): the highlight tile goes on the wall the shower stands against, not behind the basin. One rule picks the shower's wall for both the mixer and the highlight: the nearest wall at least 50 cm long; in a corner (two walls within 5 cm) the longer one. Stored as `wallEdge` on the shower piece. Checked T2 (edge 2), T3 (edge 1), T4 (edge 1): highlight and mixer share the wall.
- **White bedroom floors** (`housefloor.js`): the bedrooms' knee-height cutaway copy clones every material, and a clone dropped the marble shader, so the copy painted the floor plain white over the marble. The house-marble material now re-applies itself on `clone()`. Also: honed finish (roughness 0.42, light clearcoat), and colours set so that under the model's sun (every floor is sunlit because the ceiling is cut) the stone renders at the photo's brightness, a step darker than the walls (measured floor luma was 194, walls 173-186, before).

## Update - 2026-09-30: The floor is locked to the flat's own marble

- `diorama/housefloor.js` (new): the real floor, recreated from a site photo, as a per-pixel material on world position (no image, so no slab repeats): beige-taupe body, fleecy white cloudlets 3-7 cm stretched across the slab, a fine brown crackle web with some red-cast veins, a few long veins, 60 x 90 cm slabs with hairline joints. Detail finer than a pixel fades to its average so it cannot shimmer. Colours read off the photo (camera greyed/dimmed it; hues kept, exposure lifted).
- `diorama/diorama.js`: `M.floor` and every bedroom floor material (`*_floor`) use it. Bedroom 3's dark oak and the other bedroom floor finishes are gone.
- `diorama/configurator.js`: every floor slot (`floor`, `<room>.floor`) is `locked`: `setSlot` refuses it, `allowedOn` returns false (so presets, drag, click and links cannot change it), it is not made `spreadable`, clicking it toasts "The floor is the flat's own marble". A hidden sample `house` names it for the meter and the mood line. Wood and stone samples with no surface chosen now go to woodwork and worktops, not the floor.
- `assets/diorama/reference/house-floor.jpg`: a 240 px crop of the photo, used only as the floor's swatch icon.
- Washroom and balcony tile inlays (`products.js`) still sit on top of it; they are separate choices.
- Not modelled: the photo also shows a red double border strip with a small diamond inset; where it runs in the flat is unknown.
- Checked: all five floor materials carry it with no texture map; presets, a link asking for teak/statuario, the tray and the moodboard card all leave it unchanged; eye-level walk view compared against the photo; no console errors.

## Update - 2026-09-29: White wall-hung WCs (published on `origin/main`)

- `diorama/diorama.js` replaces the pill-shaped WC placeholder in all four washrooms with a tapered wall-hung ceramic body, a separate slim closed seat/lid, a fine rim seam, and hinges. It preserves the CAD-derived position and facing of each fixture. Basin and tile materials are unchanged.
- The Master washroom's four supplied renders show a white closed-seat WC with a tapered underside. Kohler India's [Trace wall-hung WC](https://www.kohler.co.in/p/toilets/trace-wall-hung-toilet-with-skirted-trapway-ec20217in-s) is a close visual reference, and Kohler's project catalogue lists a 362 x 544 mm footprint. The procedural geometry is an approximation, not a confirmed Kohler SKU or factory model. No WC has yet been selected for Toilets 1, 2, or 4.
- Checked Toilets 1 to 4 in the local diorama, including a close angled look at Toilet 3. `node --check diorama/diorama.js`, `git diff --check`, and the browser console error check passed. Walk mode loaded, but Toilet 4's entry camera began very close to a wall; that pre-existing camera framing needs a separate review.

## Update - 2026-09-29: Room and washroom door travel

- `diorama/diorama.js` maps CAD door leaves to the rooms on either side. Click a visible door to focus the adjoining room, including Bedroom 1/Toilet 1, Bedroom 2/Toilet 2, Master/Toilet 3, Lobby/Toilet 4, and the additional Toilet 1, 2, 3 and 4 connections shown in the drawing. Bedroom 3/Lobby is linked too.
- The plan has thresholds but no rendered leaf at the Lobby/Master, Lobby/Bedroom 2, and Foyer/Bedroom 1 entries. Those now have styled clickable leaves. The shared living area includes Toilet 4's dining-side leaf when isolated.
- The door opens briefly before changing the focused room. Walk mode still hides door leaves and uses its existing pathfinding through the flat; `diorama/walk.js` was not changed.
- Local browser checks covered Master to Toilet 3, Toilet 3 to Toilet 2, Toilet 2 to Bedroom 2, Bedroom 2 to Toilet 2, Bedroom 1 to Toilet 1, Toilet 4 to Lobby, dining to Toilet 4, and Lobby to Bedroom 2. `node --check` and `git diff --check` pass.

## Update - 2026-09-29: Bedroom 2 wardrobe crop

- The earlier follow-up commit `f4df5a4` shortened a provisional sill wall, but the user's screenshot showed the door-side wardrobe still looked cropped. That sill edit has been removed.
- In `diorama/diorama.js`, `modelCut('bed2')` expands the full model clip box to include the wardrobe. The knee-height duplicate now uses those same expanded bounds; before, it still used the narrower registered bounds.
- Fresh local page load brings up the controls. Do not claim the visual crop is resolved until checked from the user's entry-side camera angle.

Read this first, then the project handover Hardik keeps on his Mac (`CLAUDE_HANDOVER.md`,
he can upload it). This file is technical only: the repo is public, so no personal
details go in here.

## Where things stand (2026-09-28)

- `main` is live on GitHub Pages. Nothing on this branch is live until it is merged.
- On this branch the v2 work **is** `/diorama/`: Hardik asked for v2 to become the
  original, so the old `/diorama/` files were replaced and `/diorama-v2/` was removed.
  `diorama/lib/` is the same three.js copy as before (its `draco/` folder is no longer
  used by the diorama; the main pages use `assets/lib/draco/`).

## Done

### Bedrooms rebuilt (`diorama/bedrooms.js`)

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
- Bedrooms are configurable (Hardik's call): each room has its own finish slots,
  `<room>.floor/walls/feature/upholstery/accent/joinery/woodwork/rug`, starting from
  her finishes (samples Beige marble, Dove grey marble, Dark oak, Dove grey linen, Stone
  linen, Blush bouclé, Navy linen, Linen white, Pebble grey, Greige and three rug
  patterns). In a bedroom the tray, presets and mood meter act on that room; Original
  puts her finishes back. Wall paint is per room (panels on her walls where masonry
  stands). Beds, chairs, benches, side tables, rugs and the lounge set are movable;
  wardrobes, desks and wall-hung tables are fixed obstacles.
- Each bedroom floor is cut out of the flat's floor (no second surface), and floors cast
  no shadow: both were causes of the flicker, as was a flush table top and
  semi-transparent drapes.
- Known simplifications, to check with her:
  - Bedroom 3's drapes hang straight across the window opening at y 13.44. In her model
    they follow a bay beyond the room line that the flat's shell does not model.
  - Shell walls come from the DXF shell, hers from a draft registration, so a few pieces
    were clamped a few cm to fit the shell (Bedroom 3 headboard, Master bed length).
  - Small props (books, vases, lamps, AC units) are left out.
- The near-wall trim in single-room view is now 70 cm deep (was 45), so a wardrobe on
  the camera side drops to knee height with its wall.
- `rooms-materials.js` was removed from the diorama (it only coloured her GLBs).

### Declutter (toward sael.net/interior)

- Moodboard cards and their threads are hidden by default; the eye button or N shows
  them.
- The sun's dashed arc and hour marks show only while the sun is hovered or dragged.
- Small rooms (toilets, store, walk-in, lobby, foyer) show their label only while the
  pointer is over them: 8 labels at once instead of 16.

### Alici chair (`diorama/products.js`)

Read from the Living Shapes product page and its spec image (SKU LS-1087):
Rs 6,399 (MRP Rs 10,665), 20.75 W x 22.5 D x 33.25 H in (52.7 x 57.2 x 84.5 cm), seat
16.5 in to the cushion plus a 3 in cushion (49.5 cm), back 15 in above the seat, seat
depth 17 in, legs on a 15 x 15 in square, rust bouclé (100% polyester), metal legs in a
matt powder coat that matches the fabric, 5.8 kg, 120 kg capacity. Price is the site's
sale price on 2026-09-28 and can change. It has its own builder with these.

### Later the same day

- Sun and moon path: one track read left to right, 6 am to 6 am. Sun's arch from
  sunrise (06:21) to sunset (18:21) on the left, the moon's to the next sunrise on the
  right; the time slider runs 06:00 to 06:00. Shown while the sun is hovered or dragged.
- Curtains: at rest each room shows her dressing (drapes gathered at the sides over a
  sheer; Bedroom 2's roman blind half down). The curtain button draws them: drapes close
  across, the blind rolls fully down to the sill.
- Bedroom 2: the fluted piece between the window and the corner is a slim two-door
  handleless wardrobe with fluted fronts, set into the window bay's depth (front at
  x 14.88 so the shell's provisional sill sits behind it).
- Balcony: the washing-machine end (the drawing's `wiw` room) opens and reads as part
  of the balcony (space `balcony-all`); its separate label is gone.
- Kitchen appliances follow her labels and the maker's pages: LG GL-B257HMC3 fridge in
  Matte Black PCM with a pocket-handle band, 913 x 735 x 1790 mm; LG DFB532FP
  dishwasher, freestanding, Platinum Silver, control strip with a centre pocket handle,
  600 x 600 x 850 mm. Prices are not on LG's pages and are not shown.


### Bedroom 3 to the balcony

- Her window bay (floor, glass, drapes along it) is added past the drawing's room line,
  the strip beside it becomes balcony floor, and a thin black-framed sliding door stands
  between them. Hover names it; a click slides it open and takes you through, both ways.

### Phone layout (up to 700 px wide)

- Title top left, tools cut to walk, link and help, the time of day as a slim bar under
  them, then a row of room chips (Whole flat plus every room) that scrolls sideways and
  follows the room on screen. Floating labels, the back button, the sky arc and the
  board are hidden. The finishes panel is a bottom sheet, the piece card sits above it,
  and `measureSafe` in `configurator.js` fits the model between the chips and the sheet.

### Startup speed and phones

- Relief (normal) maps are made the first time a finish goes on a surface, not for tray
  swatches, and texture canvases are kept in memory (`willReadFrequently`) because the
  relief maps read them back. The controls now appear about 2 s after load instead of
  8 to 9 s (desktop Chromium), about 6.6 s instead of 14 s with the CPU slowed 4x.
- Walk mode builds its render passes the first time you walk, not at load.
- Phones (`api.lite`: coarse pointer, screen 500 px or less on its short side): pixel
  ratio capped at 1.5, a 2048 shadow map, no ambient occlusion pass, in plan or walk.
- If the controls have not appeared 45 s after the model, the page says so with the
  error it caught (inline script in `index.html`), instead of showing only the model.

### Borrowed from Construct (construct.aswinnair.com), rebuilt in our own code

- Walk mode (`diorama/walk.js`, the walking figure in the toolbar): eye height 1.55 m in
  the room on screen. Drag to look, tap the floor to walk there, WASD or arrow keys, Esc
  or Back to plan. Walls rise to a 2.85 m ceiling, lintels close over doors and windows,
  door leaves are hidden so doorways are open, the Bedroom 3 sliding door opens as you
  come near. No collision with furniture, only walls.
- Walking between rooms: `walk.js` builds a 10 cm grid of where you can stand (on a
  floor, 20 cm clear of any masonry wall) the first time you walk, and a tap walks an
  A* route through the doorways, pulled straight wherever the line is clear. The shared
  floor in `zone.json` has thin holes at door thresholds (lobby to master and bedroom 2,
  the bedroom 3 door); walking ignores holes under 40 cm across. All 210 room to room
  routes resolve. On touch a tap may wobble 12 px and still count as a tap.
- Room areas: the title shows the open room's floor area (m² and sq ft) and the flat's
  total (about 184.5 m², 1,986 sq ft, from the drawing's room outlines, not surveyed);
  labels show each room's area on hover.
- Furniture moves: pieces pull flush to a wall within 15 cm, Option (Alt) places freely,
  a dot beside a selected piece turns it (15 degree steps, free with Option), the reason
  a move is refused shows by the pointer, and the card shows the piece's size in metres
  and feet and inches.
- Library: 15 more pieces (pooja unit, bookshelf, sideboard, console, study desk, desk
  chair, nightstand, dresser, ottoman, chaise, sun lounger, floor vase, upright piano,
  crib, shoe cabinet) wearing the flat's shared finishes, and a search box.

## Still open

1. Hardik to review the rooms against her renders (`/diorama/`, click each bedroom).
2. Real products for bedroom pieces (beds, chairs, lamps) need names from her or a
   sourcing pass; none are invented.
3. Walk mode has no on-screen movement buttons on phones; tap to walk and drag to look
   cover it for now.
4. Her DXF and `assets/diorama/layout.json` would let the bedroom boxes be checked
   against the drawing instead of her draft-registered GLBs.

## Rules

- Standing instruction from Hardik (2026-09-28): when he asks for a change, ship it live,
  i.e. commit, push the branch and fast-forward `main`, without asking again. Anything he
  did not ask for still needs his yes before it goes to `main`.
- No em dashes in any output. Use a hyphen.
- Keep the scene light (he tests on an 8 GB M1 Mac and on phones).
