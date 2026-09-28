# Diorama v2 - handover (branch `claude/diorama-v2-wip`)

Read this first, then the project handover Hardik keeps on his Mac (`CLAUDE_HANDOVER.md`,
he can upload it). This file is technical only: the repo is public, so no personal
details go in here.

## Where things stand (2026-09-28)

- `main` is live on GitHub Pages. Nothing on this branch is live.
- `diorama/products.js`: new dining chair option `alici` (Living Shapes "Bouclé Alici
  dining chair with metal", Rs 6,399 from a search result, marked down from Rs 10,665;
  https://livingshapes.in/products/boucle-alici-dining-chair-with-metal). The site was
  blocked from the build container, so dimensions and photos were never read and the
  builder reuses `boucle_black`. Needs: real W x D x H, seat height, metal finish,
  photos, then its own builder. Verify the price against the page.
- `diorama-v2/`: a copy of `diorama/` to rebuild the bedrooms in. It shares
  `diorama/lib/` (import map and Draco path point at `../diorama/lib/`). Otherwise
  identical to `diorama/` at this commit. Verified loading with no errors.

## The task for diorama-v2 (Hardik's brief)

1. Keep `/diorama/` untouched. All work happens in `/diorama-v2/`.
2. Remove the imported bedroom GLBs (master, bed1, bed2, bed3) from v2. They are her
   SketchUp exports and look inconsistent next to the procedural flat: TVs and similar
   pieces read as flat wall panels.
3. Recreate each bedroom from scratch in the flat's procedural style (the `B` builders
   in `diorama.js`, `rbox`, `prism`, the material set `M`), faithful to her design: same
   layout, positions, sizes, orientation and design intent. Do not copy her geometry.
4. Declutter the UI toward Ryan Sael's calm look (sael.net/interior): moodboard cards
   and threads hidden by default, sun arc only while dragging, fewer labels at once.
5. Open question for Hardik: in v2, do the rebuilt bedrooms stay locked to her
   finishes, or become configurable like the rest of the flat?

## Sources for her bedroom design

- `assets/rooms/{master,bed1,bed2,bed3}.glb`: her models. The node tree survives
  (600 to 900 named nodes per room), so per-piece bounding boxes can be read from
  accessor min/max plus node transforms. Draco-compressed, so vertex data needs a
  decoder, but bounds do not.
- The transforms that place each GLB in the flat: `zone.json` `rooms[].model` and
  `assets/cad-draft/scene.json`.
- `assets/renders/*_hero_*.jpg`: her renders, the authority on colours and finishes.
- `assets/tour/*_pano_*.jpg`: V-Ray panoramas of each bedroom.
- Best source, not in the repo: her DXF and `assets/diorama/layout.json` on Hardik's
  Mac. Ask him to upload them.

## Plan agreed

1. Extract a per-room piece inventory (type, centre, size, facing) from the GLBs,
   checked against the renders. Show it to Hardik before building.
2. Add the pieces to v2's data in the same shape as `zone.pieces`.
3. Write builders for the missing types (bed, wardrobe, TV, desk, lounge chair,
   curtains, dresser and so on).
4. Declutter pass.

## Rules

- Never commit or push to `main` without Hardik's explicit yes in the current message.
- No em dashes in any output. Use a hyphen.
- Keep the scene light (he tests on an 8 GB M1 Mac and on phones).
- The phone layout of the diorama is broken (labels pile up, panels overlap). Known,
  not yet fixed.
