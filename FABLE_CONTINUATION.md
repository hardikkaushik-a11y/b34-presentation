# B-34 Fable continuation brief

## Start here

Hardik is helping his sister, Ar. Shivangi Kaushik of Studio Spindle. She is the architect. The client should receive one polished B-34 link that combines the accurate plan, spatial understanding, approved renders and photoreal room tours.

Repo:

```text
/Users/hardikkaushik/Downloads/B-34/web
https://github.com/hardikkaushik-a11y/b34-presentation.git
```

Local development:

```bash
cd /Users/hardikkaushik/Downloads/B-34/web
python3 serve.py 8746
open http://127.0.0.1:8746/
```

Public client URL after Hardik approves publishing:

```text
https://hardikkaushik-a11y.github.io/b34-presentation/
```

## Product decision already made

There must be one client-facing site.

- `index.html` is the client entry point.
- `cad-viewer.html` is the embedded CAD rendering engine used by the main page.
- `cad-review.html` redirects to `index.html?view=3d` so an old link cannot create a second competing experience.
- The main page offers 3D Plan, exact Plan, Present and Walk from one navigation bar.
- Bedroom 2 opens the premium V-Ray tour through the room drawer.
- Real-time bedroom material approximations are hidden from the client presentation because they are below the architect's V-Ray quality.

## What currently works

### Unified presentation

`index.html` contains:

- An accurate 3D plan loaded from the CAD-derived `assets/cad-draft/flat-cad.glb`
- The exact ALD-01 floor plan image
- A room list with approved render counts or `In progress`
- Render galleries and a fullscreen lightbox
- Fullscreen presentation mode
- An accurate neutral shell walk mode
- A client-safe empty state for unfinished rooms
- A V-Ray-only rule for showing photoreal tour buttons

### CAD spatial engine

`cad-viewer.html` contains:

- Orbit and top views
- Navigation inside the neutral shell
- CAD-derived room boundaries from `assets/cad-draft/flat-rooms.json`
- Four original furnished bedroom models for internal review
- Message commands from the parent presentation:
  - `{type:'b34', action:'orbit'}`
  - `{type:'b34', action:'top'}`
  - `{type:'b34', action:'walk'}`
  - `{type:'b34', action:'room', room:'bed2'}`

The embedded mode hides all technical review UI. The standalone file remains the workbench for production.

### Photoreal tour proof

`tour.html?room=bed2` is the first client-ready tour.

It uses:

- `assets/tour/bed2_pano_01.jpg`
- `assets/tour/bed2_pano_02.jpg`
- exact Ruby camera coordinates in `rooms-tour.js`
- calibrated arrival yaw, pitch and field of view
- named viewpoints, crossfade transitions and a clickable room plan

Read `OPUS_TOUR_HANDOVER.md` before changing the premium tour.

## Source hierarchy

Never average or reinterpret these sources.

1. ALD-01 drawing controls plan geometry and room placement.
2. Original SKP and FBX room files control designed-room geometry.
3. Approved architect renders control colours, finishes and visual intent.
4. V-Ray spherical panoramas control the final photoreal tour appearance.
5. Manufacturer BIM, CAD or 3D assets control exact branded products.
6. Anything unsupported by one of those sources is provisional and must be labelled.

## Current assets

### Spatial shell

- `assets/cad-draft/flat-cad.glb`
- `assets/cad-draft/flat-cad.blend`
- `assets/cad-draft/scene.json`
- `assets/cad-draft/navigation.json`
- `assets/cad-draft/flat-rooms.json`
- `assets/cad-draft/validation.json`

The shell has 61 wall regions and preserves the original room-model scale. Door head and window sill heights are provisional because the source CAD is 2D.

### Designed room geometry

- `assets/rooms/master.glb`
- `assets/rooms/bed1.glb`
- `assets/rooms/bed2.glb`
- `assets/rooms/bed3.glb`

These came from the architect's SketchUp exports. V-Ray shaders did not survive FBX export, so do not claim the real-time GLBs are photoreal or material-faithful.

### Approved visual references

- `assets/renders/` contains the architect render set used by the presentation.
- `project.js` maps render files to rooms.
- `rooms-materials.js` contains sampled fallback material colours for internal real-time review.

### Panoramas

- `rooms-tour.js` is the source of panorama filenames, capture coordinates and labels.
- Only a room with `source: 'vray'` is exposed as a premium client tour.
- Bedroom 2 is currently the only V-Ray source tour.
- Other panorama files are Cycles experiments and must not be marketed as architect-faithful V-Ray output.

## Exact next steps

### 1. Finish tours for the other designed bedrooms

For Master Bedroom, Bedroom 1 and Bedroom 3:

1. Render 2 to 4 distinct V-Ray spherical panoramas per room.
2. Use 4096 x 2048 for final delivery. A 2048 x 1024 test is acceptable for checking position only.
3. Keep the original V-Ray lights, materials, exposure and colour mapping.
4. Save exact camera coordinates and scene headings from SketchUp.
5. Copy the files to `assets/tour/`.
6. Add them to `rooms-tour.js` with `source: 'vray'`.
7. Store `arrivalYaw`, `arrivalPitch` and `arrivalFov` per point.
8. Generalise `tour.html` so all V-Ray rooms use the same premium interface.
9. Test every arrival composition from a first-time client's perspective.

Do not use multiple panoramas from the same physical position. A spherical panorama already contains every heading.

### 2. Design the unfinished areas with Fable

Use Fable as a production assistant, not as an unsupervised author of the flat.

For living, dining, kitchen, store, lobby, balcony and unfinished wet areas:

1. Read the exact CAD room boundary and openings.
2. Read the architect's brief, product shortlist, ceiling height, plumbing and electrical constraints.
3. Produce a plan-first proposal with furniture clearances and circulation.
4. Stop for architect review before detailed modelling.
5. Build the approved geometry in isolated collections or files per room.
6. Use exact products where assets exist.
7. Produce clay checkpoints before applying materials.
8. Produce V-Ray-ready material and lighting instructions or work directly in the V-Ray source environment when available.
9. Export approved geometry for the unified flat.
10. Add approved renders and panoramas to the existing web data files.

Fable may propose alternatives, automate modelling and prepare assets. It must not silently decide dimensions, finishes, products or fixed-service locations.

### 3. Exact-product workflow

For each real product:

```json
{
  "brand": "Jaquar",
  "model": "exact catalogue model",
  "category": "sanitaryware",
  "dimensions_mm": [0, 0, 0],
  "finish": "approved finish",
  "source_url": "manufacturer page",
  "asset_file": "products/brand-model.glb",
  "approval": "architect-approved"
}
```

Priority order for assets:

1. Manufacturer BIM or CAD model
2. Manufacturer SketchUp, 3ds Max, FBX or OBJ model
3. Verified retailer model with dimensions checked against the manufacturer
4. A simplified proxy with exact outer dimensions, explicitly marked as a proxy

Keep product data in `assets/cad-draft/products-draft.json` until approved, then move approved entries into a stable product manifest.

### 4. Cinematic film

The current proposal is in `assets/cad-draft/cinematic-plan.json`.

Required production method:

1. Use only approved designed geometry.
2. Select 6 to 10 hero compositions.
3. Validate one representative moving shot before rendering the whole film.
4. Use restrained dolly, lateral reveal and arc moves.
5. Render image sequences with checkpoints so failed runs resume at the first missing frame.
6. Assemble a 30 to 60 second film with cuts.
7. Use no voiceover or music unless requested later.
8. Generative video can be tested as a separate interpretation, but reject geometry drift, changing joinery, altered products or finish changes.

Do not turn the still renders into a Ken Burns slideshow and call it a walkthrough.

### 5. Whole-flat finished walkthrough

Do this only after the remaining areas are designed and approved.

- Merge approved room models into the CAD shell at original scale.
- Resolve actual openings between room exports and the shell.
- Bake lighting for real-time use or retain V-Ray panoramas as the photoreal layer.
- Validate one connected collision grid from entrance through every finished room.
- Keep a floor-plan map and room jump controls.

## Presentation rules

- One public URL.
- No developer notes, downloads, validation links or source-status jargon in the client UI.
- `In progress` is enough for unfinished spaces.
- Do not expose approximate real-time materials as photoreal.
- The 3D plan explains space. The V-Ray panoramas explain appearance.
- The exact 2D drawing remains available beside both.
- Mobile is a required delivery surface.

## Pascal status

Pascal was researched but is not used by the live B-34 site. The current experience is hand-built with Three.js, CAD-derived GLB assets and V-Ray panoramas. Do not introduce Pascal unless it replaces a specific proven limitation and survives a small isolated proof first.

## Files to treat carefully

These files may contain local work that predates the unified presentation pass:

- `assets/cad-draft/flat-cad.blend`
- `assets/cad-draft/flat-cad.glb`
- `assets/cad-draft/flat-rooms.json`
- `rooms-materials.js`

Do not regenerate or overwrite them casually. Compare `git status` and `git diff` before any commit.

## Verification checklist

Before publishing:

- Load `/` and confirm the 3D CAD plan appears.
- Select Plan and confirm the exact ALD-01 drawing appears.
- Select an unfinished room and confirm it says `Design in progress`.
- Select Bedroom 2 and confirm the `360 Tour` button appears.
- Open the Bedroom 2 tour and test both viewpoints.
- Confirm other bedrooms show renders but do not expose non-V-Ray panorama tours.
- Test desktop and phone widths.
- Open `/cad-review.html` and confirm it redirects to the unified site.
- Check the console for errors.

## Do not claim

- That the whole flat is designed.
- That the current neutral CAD shell is a finished visualisation.
- That the Cycles panoramas match the architect's V-Ray output.
- That the current room GLBs preserve V-Ray shaders.
- That the cinematic film has been completed.
- That Pascal powers the live site.
