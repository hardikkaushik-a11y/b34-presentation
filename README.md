# B-34 - Interactive Project Presentation

**What this is for and where it is going: [GOAL.md](GOAL.md).** This file is how it
works; that one is why it exists.

Open `index.html` in any browser. No server, no install, no internet needed.
Everything is inside this folder.

If you would rather serve it (faster, and half the download if you ever host it):

```bash
python3 serve.py 8741      # then http://127.0.0.1:8741
```

## What it does

- **3D** - the whole flat as room volumes from ALD-01. Drag to orbit, right-drag to pan,
  scroll to zoom, hover for a name, click a room to open its panel.
- **Plan** - the ALD-01 drawing, full bleed.
- **Present** - fullscreen client deck, all 24 renders. Arrows or click, Esc to exit.
- **Room panel** - dimensions, design note, render thumbnails, lightbox.
- **Walk this room** - first person inside the real SketchUp model. WASD or arrows to
  move, mouse to look, Shift to stride, Esc to release the cursor, Exit to leave.
  On a phone: drag to look, joystick bottom-left.
- **360 tour** - stand inside a path-traced panorama of the room and step between
  viewpoints, the way a Matterport or CloudPano tour works. Drag to look, scroll to
  zoom, click a floor marker or press its number to move. The minimap top-right shows
  where you are. This is the photoreal view; the walkthrough is the spatial one.
- **Plan view** (button, or Tab while walking) - lifts the camera and clips the ceiling
  away so you see the whole room from above, then click any floor to stand there.
  Without it a visitor standing in the Master Bedroom never discovers that the seating
  area and window bay exist on the other side of the partition.

## Where the walkable rooms come from

The four bedrooms are **Ar. Shivangi Kaushik's own SketchUp models**, not a
reconstruction: her joinery, her furniture, her fixtures, her dimensions.

Pipeline, all of it in `build/`:

1. SketchUp exports **ASCII** FBX, which Blender cannot read. `assimp` converts it.
2. `detect_placeholders.py` finds the textures that are SketchUp's missing-texture
   checker (see below) so they can be dropped.
3. `fbx_optimise.py` relinks and dedupes the real textures, caps them at 256px,
   welds vertices, dissolves SketchUp's coplanar triangle soup, merges duplicate
   materials, joins by material, recentres the room on its floor, bakes a navigation
   grid, and exports Draco-compressed GLB.

```bash
./build/build_web_rooms.sh            # all four
./build/build_web_rooms.sh bed3       # just one
```

Set `SHARED=/path/to/exports` if the FBX files are not in `~/Downloads/B-34/Shared`.
Result: 495k to 930k triangles per room at 5 to 10 MB, 56 to 79 draw calls.

## The V-Ray materials problem, and how it is handled

Shivangi renders in V-Ray. A V-Ray material has no SketchUp equivalent, so FBX export
writes SketchUp's placeholder instead: a small checker with an arrow, tinted a random
pastel. That is why `GOLD METAL` arrived lavender and `GREY FABRIC` arrived green.

The build drops those maps. **`rooms-materials.js`** then supplies a colour per material.
Those colours are not invented: they are pixel samples taken out of her renders.

```bash
python3 build/sample_renders.py build/render_regions.json
```

`render_regions.json` names a rectangle per element in tenths of the image, so
`"headboard":[4.0,5.5,4.4,6.2]` is 40 to 44 percent across r14 and 55 to 62 percent
down. The script takes the median pixel of each rectangle. To re-sample after a new
render, move the rectangle and re-run.

### How the lighting is calibrated

Matching one surface is not enough, because how much light a surface gets depends on
which way it faces. The calibration is done against a whole frame instead.

Stand at r14's viewpoint in Bedroom 3 (back to the curtain wall, facing the headboard)
and compare the frame's statistics with the render's:

```js
function s2l(c){c=c/255;return c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4);}
const gl=wrend.getContext(), cv=wrend.domElement;
wrend.render(wscene,wcam);
const b=new Uint8Array(cv.width*cv.height*4);
gl.readPixels(0,0,cv.width,cv.height,gl.RGBA,gl.UNSIGNED_BYTE,b);
let L=[],sat=0,n=0;
for(let y=0;y<cv.height;y+=6)for(let x=0;x<cv.width;x+=6){
  const i=(y*cv.width+x)*4, r=b[i],g=b[i+1],bl=b[i+2];
  L.push(0.2126*s2l(r)+0.7152*s2l(g)+0.0722*s2l(bl));
  sat+=(Math.max(r,g,bl)-Math.min(r,g,bl))/Math.max(1,Math.max(r,g,bl)); n++;
}
L.sort((a,b)=>a-b);
({mean:L.reduce((a,b)=>a+b,0)/L.length, median:L[L.length>>1], sat:sat/n})
```

Her renders, measured the same way: r14 mean 0.265 sat 0.178, r00 mean 0.330 sat 0.215,
r22 mean 0.298 sat 0.274, r11 mean 0.386 sat 0.161. At r14's viewpoint the walkthrough
lands at mean 0.247, median 0.234, sat 0.141. Exposure is then lifted so the average
across all four rooms tracks the average across her four renders rather than
overfitting to Bedroom 3.

The warm sun against a blue sky is deliberate and is where most of the colour comes
from. Near white lights were why every room read grey.

`rooms` entries match a material name exactly and win. `common` is a substring
fallback and only touches materials whose placeholder map was stripped.

Textures that came through for real - the oak floor, the marble, the linens, the props -
are untouched.

## Editing the presentation - `project.js`

Never touch `index.html`.

```js
{
  id:"bed1", name:"Bedroom 1", group:"sleeping",   // sleeping|living|service|wet
  dims:"9'-11\" x 13'-9\"",
  plan:{x:0.00, y:1.00, w:3.02, d:4.19},           // metres, from the drawing origin
  note:"Tan upholstered headboard, ...",
  shots:["r22.jpg","r23.jpg"],                     // files in assets/renders/
  glb:"bed1.glb"                                   // omit and the Walk button hides
}
```

`slideOrder` sets the Present order; any room with renders left out of it is appended.

## The 360 tour

Real-time WebGL cannot do global illumination, which is most of what separates the
walkthrough from a render. The tour sidesteps it: the panoramas are path-traced offline
in Cycles, so what you look at is a finished render, not a live approximation.

```bash
python3 build/render_room_panos.py bed3 /tmp/panos/bed3 8 2048 96   # ~15 min a room
python3 build/make_tour.py /tmp/panos bed3                          # writes rooms-tour.js
```

`render_room_panos.py` picks the camera positions itself: it flood fills out from the
room's spawn point so it never wanders into the corridor, erodes the region so no camera
sits in a doorway, and keeps the positions at least 0.9 m apart. It writes
`positions.json` beside the images, and `make_tour.py` reads that rather than
recomputing, so the hotspots always match where the shots were actually taken.

Two things that went wrong and are worth not repeating. Sampling the most extreme
walkable cells put the first camera outside the building, rendering the bedroom's
exterior wall against the sky. And a panorama texture is an ordinary map on the sphere's
UVs, not an `EquirectangularReflectionMapping` env map, which is why it is set to
`UVMapping` in `trLoad`.

Panoramas are rendered by `build/render_panorama.py`, calibrated against r14 at mean
luminance 0.231 against her 0.265. Not V-Ray: her shaders died in the FBX export. What
this is, is her geometry and her palette with real bounce light. If true V-Ray quality
is wanted later, Shivangi renders the same 8 positions in her own file with a
**VR Spherical Panorama** camera at 4096x2048 and the files swap straight in.

## Realism passes

The walkthrough is a real-time approximation of a V-Ray render, not a V-Ray render.
Four things narrow the gap:

1. **Ambient occlusion and bloom.** `assets/lib/pp/` holds the Three.js SAO and Unreal
   Bloom passes; `buildComposer()` in index.html wires them. AO darkens where surfaces
   meet, which is the one part of global illumination the eye insists on, and bloom
   lifts the window and the LED coves. Note the composer's render targets are forced to
   `sRGBEncoding`: r128 leaves them linear, which silently drops tone mapping and leaves
   the whole image dark and flat.
2. **Textures at 512px.** 256 was too soft on the oak, the marble and the fabrics; 1024
   pushed Bedroom 1 to 27 MB for detail you cannot see, because the largest surfaces are
   placeholder-replaced flat colours with no texture at all. 512 is the balance.
3. **Environment maps built from her renders.** `build/make_env.py` samples horizontal
   bands out of each room's own render and writes `assets/rooms/<room>_env.jpg`. Before
   this, every gloss, marble and metal surface reflected a grey procedural gradient.
4. **Baked global illumination** - written, working, not shipped. See below.

### Baked lightmaps: where this actually stands

`build/bake_lightmaps.py` bakes Cycles GI into lightmaps and rides them through glTF in
the occlusion slot, which is the only standard way to carry a second UV set. index.html
moves it to `material.lightMap` on load and drops the fake lighting it replaces.

It works end to end and it is fast: **54 seconds for a whole room** at 512px and 128
samples, 30 objects, 604k triangles. Not the "days" first estimated.

Two things block shipping it, both about texel density rather than the bake:

- Meshes are joined by material, so one mesh can hold the entire bed and headboard.
  Packed into one atlas its islands get almost no texels and the margin bleeds black,
  which is what the first bake looked like.
- Sizing the atlas by surface area fixes that, but then a room needs thirty separate
  1024px lightmaps and the page freezes loading them.

The fix is one shared atlas per room rather than one per object, so the whole room packs
into a single 2048 or 4096 map. That is a few hours of work, not days. The baker and a
baked sample are kept so it can be picked up from here.

## Accuracy

Exact: all four bedrooms are her model, so layout, joinery and dimensions are whatever
the drawing set says. Footprints match ALD-01.

Approximate: the colour of any surface that was V-Ray-only, per the table above. The
lighting is a real-time rig in `index.html` (`wBuildImported`), not her V-Ray lighting,
so it reads brighter and flatter than the renders.

Saturation still runs about twenty percent under her renders (0.14 against 0.18). That
is the charcoal bedding and the ikat accent cushions: they are separate V-Ray materials
that did not survive the export, so there is nothing in the model carrying that colour.

Known colour gaps:

- Bedroom 3's charcoal pillow shams and the throw draped over the bed are in r14 but
  not here. The shams share a material with the white bedding, so there is nothing to
  tell them apart.
- Small props, books and ornaments keep their SketchUp colours. They are too small to
  be worth sampling individually.

Either Shivangi assigns real SketchUp materials to those faces (about ten minutes per
room, and it fixes the export permanently), or add a rule to `rooms-materials.js`. To
find the material name under any surface, stand in front of it and run one line in the
browser console:

```js
const r=new THREE.Raycaster();
r.setFromCamera(new THREE.Vector2(0,0),wcam);
r.intersectObject(wscene,true)[0].object.material.name
```

Not included: the exports carry each bedroom plus its ensuite and wardrobe, so you can
walk into those too. Living, dining, kitchen and the common toilets have no model and no
renders yet. `build/b34rooms.py` still holds the earlier hand-authored rooms if you ever
need a room nobody has modelled.

## Notes

- `serve.py` is optional, only if a browser blocks local files:
  `python3 serve.py 8741` then http://127.0.0.1:8741
- **Why each room ships twice.** `assets/rooms/bed1.glb` is the real file. Browsers
  forbid `XMLHttpRequest` against `file://`, which is exactly how the glTF loader fetches,
  so a double-clicked page could load the site but never a room. A `<script src>` is
  allowed, so each room also ships as `bed1.glb.js`, the same bytes in base64. The page
  picks the `.glb` over http and the `.glb.js` from `file://`. Same geometry either way,
  verified at 493,627 triangles through both paths. The Draco decoder is inlined in
  `assets/lib/draco/draco_inline.js` for the same reason.
- Folder is ~78 MB because of that duplication. If you are only ever going to serve it,
  delete `assets/rooms/*.glb.js` and it drops to ~36 MB.
