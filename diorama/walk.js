// Walk mode: stand in the flat at eye height and look around.
//
// The idea comes from Aswin Nair's Construct (construct.aswinnair.com): drag to look
// around, tap the floor to walk there, WASD on a keyboard. Rebuilt here for B-34, in
// our own code. The model view cuts the flat at door-head height like a physical
// model; walking, the walls rise to the ceiling, lintels close over the doors and
// windows, a ceiling goes on, and the door leaves stand open so you can walk through.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const CEIL = 2.85, EYE = 1.55, RADIUS = 0.22, SPEED = 1.4;

export function createWalk(api, { onChange } = {}) {
  const { scene, renderer, zone, W, CX, CY, CUT, M, prism, inWall, inRing } = api;

  // ---------------------------------------------------------------- camera and passes
  const cam = new THREE.PerspectiveCamera(64, 1, 0.05, 80);
  cam.rotation.order = 'YXZ';
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, cam));
  const gtao = new GTAOPass(scene, cam, 1, 1);
  gtao.updateGtaoMaterial({ radius: 0.3, distanceExponent: 1.3, thickness: 1.0, scale: 1.0, samples: 12 });
  gtao.blendIntensity = 0.7;
  composer.addPass(gtao);
  composer.addPass(new SMAAPass());
  composer.addPass(new OutputPass());
  const size = (w, h) => { cam.aspect = w / h; cam.updateProjectionMatrix(); composer.setSize(w, h); };
  api.resizeHooks.push(size);
  size(api.host.clientWidth, api.host.clientHeight);

  // ---------------------------------------------------------------- the rooms made whole
  // Lintels over every opening the model view leaves open above door height, and a
  // ceiling over the flat. Built once, shown only while walking.
  const extras = new THREE.Group(); extras.visible = false; scene.add(extras);
  M.ceiling = new THREE.MeshPhysicalMaterial({ color: 0xF4F1EB, roughness: 0.95 });
  for (const ring of [zone.zone, ...api.walkFloors.slice(-1).map(f => f.outer)]) {
    const c = prism(ring, [], CEIL, CEIL + 0.06, M.ceiling); c.receiveShadow = true; extras.add(c);
  }
  const lintel = (outer) => { const m = prism(outer, [], CUT, CEIL, M.walls, M.section); extras.add(m); };
  for (const w of zone.walls) {
    if (w.z0 > 0 || w.z1 >= CUT - 1e-6 && !w.kind.includes('door')) continue;
    if (w.kind.includes('door')) {
      // a door leaf is drawn as a thin slab: its lintel takes the wall's depth
      const xs = w.outer.map(p => p[0]), ys = w.outer.map(p => p[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), T = 0.2;
      const ring = x1 - x0 > y1 - y0
        ? [[x0, (y0 + y1) / 2 - T / 2], [x1, (y0 + y1) / 2 - T / 2], [x1, (y0 + y1) / 2 + T / 2], [x0, (y0 + y1) / 2 + T / 2]]
        : [[(x0 + x1) / 2 - T / 2, y0], [(x0 + x1) / 2 + T / 2, y0], [(x0 + x1) / 2 + T / 2, y1], [(x0 + x1) / 2 - T / 2, y1]];
      lintel([...ring, ring[0]]);
    } else lintel(w.outer);                       // over a window: the sill's own footprint
  }
  // Bedroom 3's bay (added in diorama.js) has glass but no wall above it: close it too
  const band = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), nx = -dy / l * 0.06, ny = dx / l * 0.06;
    lintel([[a[0] - nx, a[1] - ny], [b[0] - nx, b[1] - ny], [b[0] + nx, b[1] + ny], [a[0] + nx, a[1] + ny], [a[0] - nx, a[1] - ny]]); };
  for (const [a, b] of [[[8.40, 14.392], [10.60, 14.392]], [[10.60, 14.392], [10.60, 13.65]], [[10.60, 13.65], [11.61, 13.65]], [[8.42, 13.427], [8.42, 14.392]]]) band(a, b);
  const glow = new THREE.AmbientLight(0xFFF3E6, 0); scene.add(glow);

  // what walk mode changes on the rest of the scene, remembered so it can be put back
  let saved = null;
  function raise() {
    saved = { clip: renderer.clippingPlanes, walls: [], exposure: renderer.toneMappingExposure };
    renderer.clippingPlanes = [];
    const tall = (m) => m.userData.wall && m.userData.wall.z0 === 0 && m.userData.wall.z1 >= CUT - 1e-6;
    const walls = [...api.shell.children, ...scene.children.filter(o => o.userData.cladding && !o.userData.rooms).flatMap(o => o.children)];
    for (const m of walls) {
      if (!m.userData.wall && !m.userData.glass) continue;
      saved.walls.push([m, m.scale.y, m.visible]);
      m.visible = true; m.scale.y = 1;
      if (m.userData.wall?.kind?.includes('door')) m.visible = false;        // doors stand open
      else if (tall(m)) m.scale.y = CEIL / m.userData.wall.z1;
    }
    for (const g of scene.children) if (g.userData.cladding) g.visible = !g.userData.off;
    extras.visible = true; glow.intensity = 0.55;
    api.dirtyShadows();
  }
  function lower() {
    if (!saved) return;
    renderer.clippingPlanes = saved.clip;
    for (const [m, sy, v] of saved.walls) { m.scale.y = sy; m.visible = v; }
    renderer.toneMappingExposure = saved.exposure;
    extras.visible = false; glow.intensity = 0; saved = null;
    api.dirtyShadows();
  }

  // ---------------------------------------------------------------- where you can stand
  const walkable = (x, y) => api.walkFloors.some(f => inRing([x, y], f.outer) && !f.holes.some(h => inRing([x, y], h)));
  const clear = (x, y) => walkable(x, y) && !inWall([x, y]) &&
    [0, 1, 2, 3, 4, 5, 6, 7].every(k => { const a = k * Math.PI / 4; return !inWall([x + Math.cos(a) * RADIUS, y + Math.sin(a) * RADIUS]); });
  const pos = { x: 0, y: 0 };
  let yaw = 0, pitch = -0.05;
  function place() {
    const c = W(pos.x, pos.y);
    cam.position.set(c.x, EYE, c.z);
    cam.rotation.set(pitch, yaw, 0);
    const r = api.roomAt(pos.x, pos.y);
    if (r) onChange?.(r);
  }
  // one step, sliding along a wall rather than stopping dead against it
  function step(dx, dy) {
    if (clear(pos.x + dx, pos.y + dy)) { pos.x += dx; pos.y += dy; return true; }
    if (Math.abs(dx) > 1e-4 && clear(pos.x + dx, pos.y)) { pos.x += dx; return true; }
    if (Math.abs(dy) > 1e-4 && clear(pos.x, pos.y + dy)) { pos.y += dy; return true; }
    return false;
  }
  // camera yaw 0 looks down world -z, which is plan +y
  const forward = () => [-Math.sin(yaw), Math.cos(yaw)];

  // ---------------------------------------------------------------- input
  const el = renderer.domElement, keys = new Set();
  let down = null, glide = null, on = false;
  const marker = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.2, 40), new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.7, depthWrite: false }));
  marker.rotation.x = -Math.PI / 2; marker.visible = false; marker.renderOrder = 5; scene.add(marker);
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const aim = (e) => { const r = el.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam); };
  // the floor point a tap asks for: where the ray meets the floor, or just short of
  // whatever it meets first
  function target(e) {
    aim(e);
    const vis = (o) => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
    const hit = ray.intersectObjects(scene.children, true).find(h => h.object.isMesh && vis(h.object) && h.object !== marker && !h.object.userData.curtain && h.object.material !== M.glass);
    let p = hit ? hit.point.clone() : ray.ray.intersectPlane(floor, new THREE.Vector3());
    if (!p) return null;
    if (p.y > 0.3) {                            // a wall or a piece: stop 40 cm short, on the floor
      const back = ray.ray.direction.clone().setY(0).normalize().multiplyScalar(-0.4);
      p.add(back).setY(0);
    }
    return { x: p.x + CX, y: CY - p.z };
  }
  const onDown = (e) => { if (!on || e.button !== 0) return; e.stopImmediatePropagation(); down = { x: e.clientX, y: e.clientY, yaw, pitch, moved: false }; try { el.setPointerCapture(e.pointerId); } catch {} };
  const onMove = (e) => {
    if (!on) return;
    e.stopImmediatePropagation();
    if (down) {
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      if (!down.moved && Math.hypot(dx, dy) < 4) return;
      down.moved = true; marker.visible = false;
      // the view turns the way you drag: right looks right, up looks up
      yaw = down.yaw - dx * 0.0045; pitch = Math.max(-1.2, Math.min(1.2, down.pitch - dy * 0.0045));
      place(); api.wake(2);
      return;
    }
    const t = target(e);
    marker.visible = !!t && walkable(t.x, t.y);
    if (marker.visible) { const c = W(t.x, t.y); marker.position.set(c.x, 0.02, c.z); }
    api.wake(2);
  };
  const onUp = (e) => {
    if (!on) return;
    e.stopImmediatePropagation();
    const d = down; down = null;
    if (!d || d.moved) return;
    const t = target(e);
    if (t && walkable(t.x, t.y)) glide = t;
  };
  for (const [n, f] of [['pointerdown', onDown], ['pointermove', onMove], ['pointerup', onUp]]) el.addEventListener(n, f, true);
  const MOVE = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']);
  addEventListener('keydown', (e) => {
    if (!on || e.target.closest?.('input, textarea')) return;
    const k = e.key.toLowerCase();
    if (k === 'escape') { e.stopImmediatePropagation(); exit(); return; }
    if (MOVE.has(k)) { keys.add(k); glide = null; e.preventDefault(); e.stopImmediatePropagation(); api.wake(2); }
  }, true);
  addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()), true);
  addEventListener('blur', () => keys.clear());

  // ---------------------------------------------------------------- each frame
  let last = performance.now();
  api.frameHooks.push(() => {
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!on) return false;
    let moved = false;
    if (keys.has('arrowleft')) { yaw += 1.6 * dt; moved = true; }
    if (keys.has('arrowright')) { yaw -= 1.6 * dt; moved = true; }
    const [fx, fy] = forward(), rx = fy, ry = -fx;       // right is forward turned clockwise
    let mx = 0, my = 0;
    if (keys.has('w') || keys.has('arrowup')) { mx += fx; my += fy; }
    if (keys.has('s') || keys.has('arrowdown')) { mx -= fx; my -= fy; }
    if (keys.has('d')) { mx += rx; my += ry; }
    if (keys.has('a')) { mx -= rx; my -= ry; }
    if (mx || my) { const l = Math.hypot(mx, my); step(mx / l * SPEED * dt, my / l * SPEED * dt); moved = true; }
    if (glide) {
      const gx = glide.x - pos.x, gy = glide.y - pos.y, l = Math.hypot(gx, gy), s = Math.min(l, 1.8 * dt);
      if (l < 0.03 || !step(gx / l * s, gy / l * s)) glide = null;
      else {                                   // turn gently toward where you are going
        const want = Math.atan2(-gx, gy);
        let dyaw = want - yaw; dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw));
        if (l > 0.6) yaw += dyaw * Math.min(1, 3 * dt);
      }
      moved = true;
    }
    // Bedroom 3's sliding door opens as you come up to it
    if (Math.hypot(pos.x - 8.42, pos.y - 13.9) < 1.4) api.setDoor(1);
    if (moved) place();
    return moved;
  });

  // ---------------------------------------------------------------- in and out
  let before = null;
  // start inside the room on screen (or the foyer), facing its longest open view
  function start(room) {
    const r = room?.members ? api.zone.rooms.find(q => q.id === room.members[0]) : room || zone.rooms.find(q => q.id === 'entrance');
    let [x, y] = r.label_xy;
    if (!clear(x, y)) {
      outer: for (let rad = 0.1; rad < 2; rad += 0.1) for (let k = 0; k < 16; k++) {
        const a = k * Math.PI / 8, px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad;
        if (clear(px, py)) { x = px; y = py; break outer; }
      }
    }
    pos.x = x; pos.y = y;
    let best = 0;
    for (let k = 0; k < 16; k++) {
      const a = k * Math.PI / 8, dx = -Math.sin(a), dy = Math.cos(a);
      let d = 0; while (d < 8 && walkable(x + dx * d, y + dy * d) && !inWall([x + dx * d, y + dy * d])) d += 0.1;
      if (d > best) { best = d; yaw = a; }
    }
    // then step back from that view, so you arrive looking into the room, not at a wall
    const [fx, fy] = forward();
    for (let k = 0; k < 18 && clear(pos.x - fx * 0.1, pos.y - fy * 0.1) && clear(pos.x - fx * 0.4, pos.y - fy * 0.4); k++) { pos.x -= fx * 0.1; pos.y -= fy * 0.1; }
    pitch = -0.08;
  }
  function enter() {
    if (on) return;
    before = api.focused;
    const room = api.focused;
    if (api.focused) api.showFlat();           // every room visible, nothing cut away
    api.walking = on = true;
    raise();
    start(room);
    place();
    api.useView({ camera: cam, composer });
    document.body.classList.add('walking');
    api.dirtyShadows();
  }
  function exit() {
    if (!on) return;
    on = false; api.walking = false; keys.clear(); glide = null; marker.visible = false;
    lower();
    api.useView(null);
    document.body.classList.remove('walking');
    const back = before; before = null;
    if (back) api.focusRoom(back); else { api.showFlat(); }
  }
  return { enter, exit, get on() { return on; } };
}
