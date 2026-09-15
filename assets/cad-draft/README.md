# B-34 CAD review checkpoint

Open /cad-review.html through the local web server. It is a separate draft; the existing index.html and public deployment are unchanged.

## What exists

- flat-cad.blend: editable shell, built from polygonized architectural CAD edges plus an explicitly traced exterior floor outline.
- flat-cad.glb: the same shell for the browser.
- scene.json: CAD origin, metre conversion, wall polygons, room regions, assumptions and all four original-scale bedroom transforms. This JSON plus the existing GLBs is the combined scene artifact; there is no need to recompress or duplicate the 36 MB of bedroom models.
- registration-and-paths.png: existing GLB sections over CAD and the shell connectivity paths.
- navigation.json: shell collision grid, 10 cm cells, 18 cm clearance radius, four-neighbour BFS routes from entrance.
- products-draft.json: seven bathroom records and three CAD product specifications. Exact model identifiers exist for the LG dishwasher/fridge; installation, revision and purchase approval still need confirmation. IFB and V-Guard model unknown. No product meshes or world-space product hotspots have been invented.
- panorama-integration.json: 13 candidate saved-scene slots for future mono V-Ray panoramas; camera coordinates and image yaw deliberately remain null until verified.
- cinematic-plan.json: eight shot compositions totalling 60 seconds. This is a production plan, not a rendered film.
- checkpoint.json: asset sizes and SHA-256 checksums.

## Evidence and limits

Base DXF $INSUNITS is 1 (inches). All coordinates use 0.0254 metres per inch. Resolved INSERT block geometry before interpreting doors/windows. Architectural lines are selected from RH-RCC BRICK, not furniture or annotation layers. This yields 60 closed polygonized regions; window sill treatment and heights are assumptions, not CAD elevations.

The full floor perimeter is manually traced along CAD exterior vertices, including the curved kitchen and facade recesses. It is not a convex hull. Bedroom 2's open facade linework required a provisional closure informed by ALD-01; review this segment before promoting the shell. A 2D plan alone does not establish ceiling, sill or lintel heights. No ceiling geometry or invented furniture has been added to unfinished spaces.

Critical discrepancy: Master MTEXT label says 11 ft wide; explicit DIMENSION 652DE measures 120 inches (10 ft). The existing model is closer to that measured CAD span. Do not resolve this by scaling furniture. Other checks: Bedroom 1 CAD width 118.88 inches and depth 165 inches; Bedroom 2 width 132 inches; Bedroom 3 width 119.706 inches. Read dimension values rather than printed room-label text where they conflict, and keep the conflict visible for architect review.

Model placement uses two wall-face anchors per room, selected from the actual GLB sections. Rotations zero: imported model axes already match the displayed sheet orientation. No room is stretched or mirrored. This preserves headboards on sheet-left for Master/BR1/BR2 and sheet-right for BR3. The Master study continues far to sheet-right. Small overlap/door details remain a registration-review issue; the composed draft is not a merged watertight construction model.

The shell BFS reaches dining, lobby and the four bedroom targets. It excludes furniture and keeps door leaves open. This proves shell connectivity only. In the review page, 'Walk shell from entrance' shows the neutral shell. Room buttons load an actual model and use its existing local furniture collision grid. A fully continuous furnished flat still needs doorway registration and unified collision validation, plus the remaining approved interiors.

Materials in the browser use existing room colour substitutions under a new simple review light rig. They are approximate. They have NOT been validated as photoreal or a 1:1 match to the architect's renders. Final V-Ray panoramas remain the faithful seated/standing 360 deliverable. They do not provide unrestricted six-degree-of-freedom movement between photographs.

## Reproduce / resume

From B-34:
    web/build/cad_shell/.venv/bin/python web/build/cad_shell/extract.py
    web/build/cad_shell/.venv/bin/python web/build/cad_shell/build_data.py
    /Applications/Blender.app/Contents/MacOS/Blender --background --python web/build/cad_shell/build_blender.py
    python3 web/build/cad_shell/prepare_delivery.py
    python3 web/serve.py 8746

The room geometry inspection files already exist in web/build/cad_shell. Only rerun inspect_rooms.py through Blender if the source GLBs change. Do not rerun the original FBX conversion scripts: their old Shared path is stale and the GLBs are already available.

Next useful work: resolve the Master dimension conflict and Bedroom 2 facade closure; quantify door registration and validate a combined furniture-aware route; integrate the first V-Ray panorama using measured camera position/yaw. Keep the current viewer intact until those checks pass.

## Combined collision check

A conservative test now exists in combined-navigation-check.json, using the transformed source furniture grids within the traced CAD room regions. Bedroom 3 is reachable from the shell; Master, Bedroom 1 and Bedroom 2 spawn cells are individually free but not reachable from the entrance. This is why the draft keeps whole-shell walking and individual-room walking separate. Resolve door-leaf / registration / grid-clearance differences before claiming a continuous furnished walkthrough. Do not remove walls just to force the test to pass.
