# B-34 premium photoreal tour handover

## Read this first

Hardik is helping his sister, Ar. Shivangi Kaushik of Studio Spindle. She is the architect. The client deliverable is a premium interactive representation of B-34, a residential interior project in Dwarka, New Delhi.

The intended deliverables are:

1. A client-facing photoreal room tour for every designed room.
2. A cinematic photoreal project film after the designs are approved.
3. A connected whole-flat walkthrough after the remaining spaces have been designed and rendered.

Do not present the current real-time GLB materials as the final visual product. The architect's V-Ray output is the source of truth for lighting, materials and appearance.

## Honest technical definition

The premium room experience is a nodal 360 tour. Each node is a photoreal 2:1 equirectangular V-Ray panorama. Visitors can look freely in every direction and move between selected camera positions.

This is not unrestricted photoreal free walking. Pixels outside the panorama capture positions do not exist. Continuous arbitrary movement would require a fully baked real-time model, a splat or NeRF reconstruction with adequate source coverage, or cloud-rendered real-time ray tracing.

The nodal tour is the correct product for the available input. It preserves the architect's actual V-Ray appearance and is similar to premium property-tour experiences.

## Current proof

Bedroom 2 is the first premium proof.

Open locally:

```text
http://127.0.0.1:8746/tour.html?room=bed2
```

The existing presentation launches it through:

```text
Bedroom 2 -> 360 Tour
```

The experience currently provides:

- Full-screen photoreal panorama viewing
- A calibrated arrival composition for each panorama
- Pointer drag and touch drag to look around
- Mouse-wheel zoom
- Named viewpoint controls
- A clear movement marker
- Crossfade transitions between viewpoints
- A clickable room-plan panel
- Keyboard controls: left/right to change viewpoint, 1 and 2 to jump, Escape to close the plan
- Responsive desktop and mobile layout
- A return link to the main B-34 presentation

## Relevant files

- `tour.html` - standalone premium Bedroom 2 tour. Contains its CSS, Three.js viewer and interaction code.
- `index.html` - main B-34 presentation. Its Bedroom 2 `360 Tour` button routes to `tour.html?room=bed2`.
- `rooms-tour.js` - panorama filenames, room-space capture coordinates, labels and V-Ray source flag.
- `assets/tour/bed2_pano_01.jpg` - V-Ray panorama from the bed and wardrobe position.
- `assets/tour/bed2_pano_02.jpg` - V-Ray panorama from the bed, desk and window position.
- `project.js` - project and room metadata.
- `assets/lib/three.min.js` - local Three.js r128 build used by the viewer.
- `serve.py` - no-cache local development server.

## Bedroom 2 source data

`rooms-tour.js` contains:

```js
"bed2": {
  "label": "Bedroom 2",
  "yawOffset": -1.5708,
  "points": [
    {
      "file": "bed2_pano_01.jpg",
      "x": 0.925,
      "y": 0.355,
      "yaw": 0.0,
      "label": "Bed and wardrobe"
    },
    {
      "file": "bed2_pano_02.jpg",
      "x": 0.145,
      "y": -1.385,
      "yaw": -1.3614,
      "label": "Bed, desk and window"
    }
  ],
  "source": "vray"
}
```

The coordinates are the exact Ruby-script camera positions used in SketchUp. They are used to draw the room-plan markers. Do not replace them with guessed values.

## Panorama requirements

The current panoramas are 2048 x 1024 test renders. They prove the interaction but look soft when stretched across a desktop monitor.

Final room panoramas should be:

- Equirectangular spherical projection
- Exactly 2:1 aspect ratio
- 4096 x 2048 minimum
- 6144 x 3072 or 8192 x 4096 when a sharper desktop result is worth the render time
- JPEG at high quality or WebP after visual comparison
- Same V-Ray materials, lights, colour mapping and exposure as the approved hero renders
- Rendered from positions that cover different parts of the room

Do not render multiple panoramas from nearly identical camera positions. A spherical image captures all headings from one position, so a different heading from the same location produces duplicate coverage.

## Viewer architecture

The viewer creates an inward-facing Three.js sphere:

```js
const geometry = new THREE.SphereGeometry(100, 72, 48);
geometry.scale(-1, 1, 1);
const sphere = new THREE.Mesh(
  geometry,
  new THREE.MeshBasicMaterial({ color: 0x17130f })
);
sphere.rotation.y = -Math.PI / 2;
```

Each panorama is loaded as a normal colour texture:

```js
t.mapping = THREE.UVMapping;
t.encoding = THREE.sRGBEncoding;
```

Do not use `THREE.EquirectangularReflectionMapping` on the visible sphere. That mapping is for environment maps and previously produced a blank or incorrectly mapped panorama.

The visible sphere uses `MeshBasicMaterial` because the V-Ray panorama already contains all lighting and shading. Adding browser lights would be incorrect.

## Arrival-view calibration

The panorama contains the entire room, but a client initially sees only the current camera field of view. Every viewpoint therefore needs a deliberately selected arrival yaw, pitch and field of view.

The Bedroom 2 proof currently uses:

```js
const arrivalYaw = [0, -0.65];
const arrivalPitch = [-0.035, -0.26];
const arrivalFov = [68, 76];
```

Meaning:

- Viewpoint 1 lands centred on the bed and arched headboard.
- Viewpoint 2 lands with the bed on the left and the desk/window on the right.

Calibrate visually in the actual browser viewport. Do not derive these values only from the SketchUp scene heading. The equirectangular image seam, Three.js sphere orientation and desired client composition are separate concerns.

Recommended future data structure:

```js
{
  file: "master_pano_01.jpg",
  x: 0.5,
  y: -0.8,
  label: "Bed and headboard",
  arrivalYaw: -0.25,
  arrivalPitch: -0.08,
  arrivalFov: 70
}
```

Move the Bedroom 2 hardcoded arrays into the point objects when generalising the viewer.

## Transition logic

The viewer preloads the second panorama after opening the first. On movement:

1. The warm dark veil fades in.
2. The panorama texture changes while covered.
3. The calibrated arrival camera is applied.
4. The veil fades out.
5. Labels, controls and plan markers update.

This avoids showing texture loading or an abrupt visual teleport.

The current transition code is in `go(i, initial)` inside `tour.html`.

## Interaction design decisions

The previous tour felt like a technical prototype because:

- The visitor entered through a CAD-style dashboard and drawer.
- It opened facing a wardrobe instead of the room's hero view.
- The only movement hotspot could start outside the visible camera frame.
- The old minimap displayed positions but was not clickable.
- Labels such as `Point 1 of 2` exposed implementation language.
- Viewpoint transitions were abrupt.

The replacement treats the room as the product:

- Immediate full-screen imagery
- Minimal Studio Spindle identity
- Human-readable scene labels
- Always-visible viewpoint navigation
- A spatial movement control
- An optional plan instead of a permanently visible technical diagram
- Quiet ivory, sand and bronze interface colours taken from the bedroom palette

Do not add generic dashboard cards, metrics, gradients or decorative UI. The panorama should remain the dominant visual element.

## Adding the next room

Use this sequence for Master Bedroom, Bedroom 1 and Bedroom 3:

1. Render 2 to 4 V-Ray spherical panoramas from distinct positions.
2. Name them consistently, for example `master_pano_01.jpg`.
3. Copy them into `assets/tour/`.
4. Add exact capture coordinates and descriptive labels to `rooms-tour.js`.
5. Set `source: "vray"` for that room.
6. Generalise `tour.html` to read `room` from the query string.
7. Pull the room title and dimensions from `project.js`.
8. Store arrival yaw, pitch and FOV on each panorama point.
9. Update the main presentation route so every V-Ray room opens the premium tour.
10. Test every initial view, movement transition and plan marker as a first-time client.

Suggested query-string selection:

```js
const roomId = new URLSearchParams(location.search).get('room') || 'bed2';
const data = window.ROOMTOUR?.[roomId];
const room = window.PROJECT.rooms.find(r => r.id === roomId);
```

The current `tour.html` intentionally focuses on Bedroom 2 so the product quality could be proven before generalisation.

## Main-presentation launch hook

The staged `index.html` change is deliberately small:

```js
$('#dtour').onclick = () => {
  const r = P.rooms.find(x => x.id === activeId);
  if (!r) return;
  if (r.id === 'bed2' && (window.ROOMTOUR || {})[r.id]?.source === 'vray') {
    location.href = 'tour.html?room=bed2';
    return;
  }
  enterTour(r);
};
```

When more V-Ray rooms are ready, replace the Bedroom 2 condition with a generic source check and route using the selected room id.

## Local development and validation

Run:

```bash
cd /Users/hardikkaushik/Downloads/B-34/web
python3 serve.py 8746
```

Open:

```text
http://127.0.0.1:8746/index.html
http://127.0.0.1:8746/tour.html?room=bed2
```

JavaScript parse check:

```bash
python3 - <<'PY'
from pathlib import Path
s = Path('tour.html').read_text()
script = s.rsplit('<script>', 1)[1].split('</script>', 1)[0]
Path('/tmp/b34-tour-check.js').write_text(script)
PY
node --check /tmp/b34-tour-check.js
```

Required manual test:

1. Bedroom 2 opens centred on the bed.
2. The movement control changes to the second panorama.
3. The second panorama shows the bed, desk and window without requiring rotation.
4. Both bottom viewpoint buttons work.
5. Room Plan opens and both numbered markers are clickable.
6. Drag, scroll and touch controls work.
7. Project returns to `index.html`.
8. Mobile controls do not cover the primary composition.

## Current limitations

- Source panoramas are only 2048 x 1024, so they are visibly soft at fullscreen desktop size.
- The window is intentionally bright in the supplied V-Ray image. Fix this in V-Ray if the architect wants exterior detail. Do not fake it in CSS.
- Only Bedroom 2 has architect-rendered V-Ray panoramas in the web project.
- Other room panoramas currently came from the experimental Blender/Cycles pipeline and do not match the architect's V-Ray quality.
- Pascal Editor is not used in this implementation.
- The full apartment cannot yet be photoreal because living, dining, kitchen, lobby and circulation designs are unfinished or lack final V-Ray panoramas.

## Do not touch without checking first

There are unrelated uncommitted local changes in:

- `cad-review.html`
- `rooms-materials.js`
- `assets/cad-draft/flat-cad.blend`
- `assets/cad-draft/flat-cad.glb`
- `assets/cad-draft/flat-rooms.json`
- An unstaged `index.html` environment-map change

They are separate from the premium-tour commit. Do not stage, revert or overwrite them while continuing this work.

## Exact recommended next steps

1. Verify the published Bedroom 2 proof after GitHub Pages updates.
2. Replace the two test images with final 4096 x 2048 V-Ray panoramas when available.
3. Generalise `tour.html` for query-selected rooms.
4. Render and integrate the Master Bedroom next because its second seating/desk zone requires multiple positions.
5. Add Bedroom 1 and Bedroom 3.
6. Only after all designed bedrooms work, connect them to the whole-flat plan.
7. Treat cinematic video as a separate output generated from approved designs and selected hero views.

## Quality bar

The viewer is ready only when a first-time client can:

- Understand where they are immediately
- See the room's strongest composition without dragging
- Discover how to move within two seconds
- Reach every designed zone without hunting for a hidden hotspot
- Return to the project overview without using browser navigation
- Use the experience comfortably on desktop and mobile

The interface should disappear behind the architect's work. The V-Ray panorama is the product.
