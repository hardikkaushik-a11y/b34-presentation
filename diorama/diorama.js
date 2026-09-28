// B-34 public zone as a diorama: living, dining, kitchen, store, foyer, lobby.
//
// Everything placed here is Ar. Shivangi Kaushik's: walls from her Base DXF,
// every piece of furniture at the position and size she drew it (read out of the
// DXF by build/diorama/extract_layout.py, cut to this zone by build_zone.py).
// What is NOT hers is the look: finishes are concept options extending the
// palette of her five finished rooms, and they are labelled that way on the page.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { marble, wood, fabric, shutter, tambour, paint, terrazzo, leather, limewash, normalFrom } from './textures.js';

const zone = await (await fetch('../assets/diorama/zone.json')).json();
const [CX, CY] = zone.centre;
const CUT = zone.cut_height;
const CT = zone.counter.carcass, CTOP = zone.counter.carcass + zone.counter.top;

// plan (x, y) in metres -> three.js world (X, Z). Y is up.
const W = (x, y) => new THREE.Vector3(x - CX, 0, -(y - CY));

// ------------------------------------------------------------------ renderer
const host = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// Shadows are recomputed only when something changes (a finish, the sun, a moved
// piece), not every frame. The same trick Ryan Sael's room uses.
renderer.shadowMap.autoUpdate = false;
// the section cut, like slicing a model: nothing above door-head height is drawn.
// A renderer-wide plane, so it also applies inside the AO pass's own render.
// It sits 1 cm above CUT: the shell's walls stop at exactly CUT, and a wall cap lying
// on the clip plane gets clipped pixel by pixel at random, which strobes as you orbit.
renderer.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, -1, 0), CUT + 0.01)];
renderer.localClippingEnabled = true;
host.appendChild(renderer.domElement);
// Frames are drawn only when something changed (the camera, a finish, the sun, a
// moved piece); an idle page costs no GPU at all. wake(n) asks for n more frames.
let wakeFrames = 4;
const wake = (n = 3) => { wakeFrames = Math.max(wakeFrames, n); };
const dirtyShadows = () => { renderer.shadowMap.needsUpdate = true; wake(); };

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
const studioEnvironment = scene.environment;
scene.environmentIntensity = 0.68;
const roomEnvironments = new Map();
async function roomEnvironment(rid) {
  const tour = window.ROOMTOUR?.[rid], point = tour?.points?.[0];
  if (!point) return null;
  if (!roomEnvironments.has(rid)) {
    roomEnvironments.set(rid, new THREE.TextureLoader().loadAsync(`../assets/tour/${point.file}`).then(tex => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.mapping = THREE.EquirectangularReflectionMapping;
      const target = pmrem.fromEquirectangular(tex);
      tex.dispose();
      return { target, texture: target.texture, yaw: tour.yawOffset || 0 };
    }).catch(e => { console.warn(`Could not build ${rid} reflection environment`, e); return null; }));
  }
  return roomEnvironments.get(rid);
}
async function useRoomEnvironment(rid) {
  if (!rid) {
    scene.environment = studioEnvironment;
    scene.environmentRotation.set(0, 0, 0);
    wake();
    return;
  }
  const env = await roomEnvironment(rid);
  if (focused?.id !== rid || !env) return;
  scene.environment = env.texture;
  scene.environmentRotation.set(0, env.yaw, 0);
  wake();
}

// ------------------------------------------------------------------ camera
// depth range sized to the model (camera sits 40 m out, the flat is ~20 m across):
// a loose range starves depth precision and coincident surfaces shimmer
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 12, 70);
// seen from the balcony side: the north face is sliding glass, so nothing blocks the view in,
// and the curved kitchen bay becomes the backdrop instead of the obstruction
const ISO_AZ = THREE.MathUtils.degToRad(212), ISO_EL = THREE.MathUtils.degToRad(52);
camera.position.set(Math.sin(ISO_AZ) * Math.cos(ISO_EL), Math.sin(ISO_EL), Math.cos(ISO_AZ) * Math.cos(ISO_EL)).multiplyScalar(40);
camera.lookAt(0, 0.6, 0);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.6, 0);
controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.minPolarAngle = THREE.MathUtils.degToRad(12);
controls.maxPolarAngle = THREE.MathUtils.degToRad(72);
controls.minZoom = 0.45; controls.maxZoom = 5;
controls.screenSpacePanning = true;

// ------------------------------------------------------------------ lights
const hemi = new THREE.HemisphereLight(0xfff1e0, 0x2a221b, 0.32);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe9cf, 3.4);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.025;
Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 80 });
scene.add(sun, sun.target);
const fill = new THREE.DirectionalLight(0xfff3e6, 0); scene.add(fill, fill.target);
// the configurator's daylight takes over lighting when it loads (lightHooks.relight)
const lightHooks = { relight: null };
let studioOn = false;
function studio(on) {
  studioOn = on;
  if (lightHooks.relight) return lightHooks.relight();
  hemi.intensity = on ? 0.84 : 0.62;
  scene.environmentIntensity = on ? 0.88 : 0.68;
  fill.intensity = on ? 1.30 : 0.50;
  placeSun(150, on ? 58 : 38);
}
function placeSun(azDeg, elDeg) {
  const a = THREE.MathUtils.degToRad(azDeg), e = THREE.MathUtils.degToRad(elDeg);
  sun.position.set(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)).multiplyScalar(30);
  sun.target.position.set(0, 0, 0);
  dirtyShadows();
}
placeSun(150, 38);

// ------------------------------------------------------------------ materials
// Default finishes: extensions of her own palette, not her specification.
// Slot keys are what the configurator will swap.
const M = {};
// physical, so a finish can take sheen (fabric) or a clearcoat (polished stone,
// lacquer) when the configurator swaps it; at zero they cost what standard costs
function std(key, opts) { M[key] = new THREE.MeshPhysicalMaterial(opts); return M[key]; }
std('floor',    { map: marble({ base: 0xDCCFBC, vein: 0xA88E6E, tile: 0.8, seed: 21 }), roughness: 0.2, metalness: 0 });
std('walls',    { map: paint({ base: 0xEDE6DA }), roughness: 0.92 });
std('section',  { color: 0x2A2521, roughness: 0.9 });
std('sill',     { map: marble({ base: 0xD8CFBF, vein: 0xA8957C, tile: 1.2, joint: false, seed: 4 }), roughness: 0.3 });
std('plinth',   { color: 0x17130F, roughness: 0.75 });
std('top',      { map: marble({ base: 0xEEE9E0, vein: 0xB8AD9A, tile: 1.4, joint: false, veins: 7, seed: 31 }), roughness: 0.18 });
std('shutters', { map: shutter({ base: 0x8A7F72 }), roughness: 0.38 });
std('toekick',  { color: 0x3B332C, roughness: 0.7 });
std('fabric',   { map: fabric({ base: 0xB7A993 }), roughness: 0.95 });
std('accent',   { map: fabric({ base: 0x8C5A3C, seed: 8 }), roughness: 0.95 });
std('walnut',   { map: wood({ base: 0x6A4731, dark: 0x2E1C10, plank: 0.3, length: 1.8 }), roughness: 0.5 });
std('lacquer',  { map: paint({ base: 0xCBBFAC, seed: 2 }), roughness: 0.4 });
std('door',     { map: wood({ base: 0xA88F72, dark: 0x6E5843, plank: 0.9, length: 2.1, seed: 12 }), roughness: 0.6 });
std('brass',    { color: 0xC19A48, metalness: 1, roughness: 0.32 });
std('steel',    { color: 0xC7C9CB, metalness: 1, roughness: 0.28 });
std('darkglass',{ color: 0x0E0F10, metalness: 0.2, roughness: 0.06 });
std('screen',   { color: 0x070707, metalness: 0.1, roughness: 0.12, emissive: 0x05070a });
std('ceramic',  { color: 0xF3F1ED, roughness: 0.18 });
std('tambour',  { map: tambour({ base: 0x8A7F72 }), roughness: 0.4 });
std('tlt3wall', { map: marble({ base: 0xD8C9B0, vein: 0x9C8465, tile: 1.2, veins: 7, seed: 44 }), roughness: 0.16 });
std('terrazzo', { map: terrazzo({ base: 0xD9CDBA }), roughness: 0.3 });
std('washer',   { color: 0xEDEDEA, roughness: 0.35 });
// her Toilet 3 vanity: walnut by her spec, kept apart from the swappable woodwork
std('t3walnut', { map: M.walnut.map, roughness: 0.5 });
// Her bedroom models carry their own floors and wall faces, in the same place as the
// shell's. Push the shell's surfaces back in depth by a hair so hers always win
// instead of the two fighting (the flicker).
// Not the floor: it already sits 4 mm under hers, and the slope term grows with pixel
// size, so zoomed out it pushed the floor behind the plinth 1.7 cm below (black floor).
for (const k of ['walls', 'section', 'sill']) Object.assign(M[k], { polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 });
M.glass = new THREE.MeshPhysicalMaterial({ color: 0xdcebf0, roughness: 0.04, metalness: 0, transparent: true,
                                          opacity: 0.2, side: THREE.DoubleSide, depthWrite: false });

// ------------------------------------------------------------------ geometry helpers
function shapeFrom(outer, holes = []) {
  const s = new THREE.Shape(outer.map(([x, y]) => new THREE.Vector2(x - CX, y - CY)));
  for (const h of holes) s.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x - CX, y - CY))));
  return s;
}
// extrude a plan outline from z0 to z1 (metres above floor). ExtrudeGeometry
// groups: 0 = caps (top/bottom), 1 = sides.
function prism(outer, holes, z0, z1, mat, capMat) {
  const g = new THREE.ExtrudeGeometry(shapeFrom(outer, holes), { depth: Math.max(0.001, z1 - z0), bevelEnabled: false, curveSegments: 1 });
  g.rotateX(-Math.PI / 2); g.translate(0, z0, 0);
  const m = new THREE.Mesh(g, capMat ? [capMat, mat] : mat);
  m.castShadow = m.receiveShadow = true;
  return m;
}
const rbox = (w, h, d, r = 0.02) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3));
function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m;
}

// point-in-polygon on plan rings, for "which side of this unit is the wall"
function inRing(pt, ring) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
const solidWalls = zone.walls.filter(w => w.kind === 'masonry' || w.kind === 'partition' || w.kind.startsWith('masonry'));
const inWall = (pt) => solidWalls.some(w => inRing(pt, w.outer));
// unit vector (plan) from a piece toward its back wall, perpendicular to its long axis
function backDir(o) {
  const n = [-Math.sin(o.angle), Math.cos(o.angle)];
  for (const s of [1, -1]) {
    for (const k of [0.12, 0.25, 0.4]) {
      const p = [o.cx + n[0] * s * (o.d / 2 + k), o.cy + n[1] * s * (o.d / 2 + k)];
      if (inWall(p)) return [n[0] * s, n[1] * s];
    }
  }
  return [-n[0], -n[1]];
}

// ------------------------------------------------------------------ the shell
// One builder for both views: the whole flat, and a single room on its own plinth.
function buildShell(group, { plinth, floor, walls, glass }) {
  group.add(prism(plinth, [], -0.42, -0.021, M.plinth));    // like a physical model on a base
  for (const f of floor) group.add(prism(f.outer, f.holes, -0.024, -0.004, M.floor));
  for (const w of walls) {
    const k = w.kind;
    let mat = M.walls, cap = M.section;
    if (k.includes('sill')) { cap = M.sill; }
    else if (k.includes('door_leaf')) { mat = M.door; cap = M.door; }
    const cut = w.z1 >= CUT - 1e-6;          // cut by the section: a dark cap, as in a model
    const m = prism(w.outer, w.holes, w.z0, w.z1, mat, cut ? M.section : cap);
    const cx = w.outer.reduce((a, q) => a + q[0], 0) / w.outer.length, cy = w.outer.reduce((a, q) => a + q[1], 0) / w.outer.length;
    m.userData.wall = { z0: w.z0, z1: w.z1, cx, cy };
    group.add(m);
  }
  for (const g of glass) {
    const pos = [], idx = [];
    g.path.forEach(([x, y], i) => {
      const v = W(x, y);
      pos.push(v.x, g.z0, v.z, v.x, Math.min(g.z1, CUT), v.z);
      if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, M.glass); m.renderOrder = 2;
    const mid = g.path[Math.floor(g.path.length / 2)];
    m.userData.glass = { cx: mid[0], cy: mid[1] };
    group.add(m);
  }
  return group;
}
const shell = buildShell(new THREE.Group(), { plinth: zone.zone, floor: zone.floor, walls: zone.walls, glass: zone.glass });
scene.add(shell);

// ------------------------------------------------------------------ furniture
const pieces = new THREE.Group(); scene.add(pieces);

// a group positioned at a piece's oriented box, local +X along its long side,
// local +Z toward `front` (a plan unit vector) when one is given
function frame(o, front) {
  const g = new THREE.Group();
  const c = W(o.cx, o.cy); g.position.set(c.x, 0, c.z);
  if (front) g.rotation.y = Math.atan2(front[0], -front[1]);
  else g.rotation.y = o.angle;
  return g;
}

const B = {
  counter(p, opts = {}) {
    const g = new THREE.Group(), f = p.footprint;
    g.add(prism(f, [], 0, 0.1, M.toekick));
    g.add(prism(f, [], 0.1, CT, opts.front || M.shutters, M.section));
    g.add(prism(f, [], CT, CTOP, M.top));
    return g;
  },
  dishwasher(p) { return B.counter(p, { front: M.steel }); },
  unit(p) { return B.counter(p); },
  sink(p) {
    const o = p.obb, back = backDir(o), g = frame(o, [-back[0], -back[1]]);
    const w = Math.max(o.w, o.d), d = Math.min(o.w, o.d);
    g.add(mesh(new THREE.BoxGeometry(w, 0.004, d), M.steel, 0, CTOP + 0.002, 0));
    g.add(mesh(rbox(w * 0.48, 0.02, d * 0.78, 0.03), M.darkglass, -w * 0.2, CTOP + 0.001, 0.02));
    // tap at the back edge, over the bowl
    const tx = -w * 0.2, tz = -d / 2 + 0.05;
    g.add(mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.32, 16), M.steel, tx, CTOP + 0.16, tz));
    const arc = mesh(new THREE.TorusGeometry(0.09, 0.012, 10, 24, Math.PI), M.steel, tx, CTOP + 0.32, tz + 0.09);
    arc.rotation.y = Math.PI / 2; g.add(arc);
    return g;
  },
  hob(p) {
    const o = p.obb, back = backDir(o), g = frame(o, [-back[0], -back[1]]);
    const w = Math.max(o.w, o.d), d = Math.min(o.w, o.d);
    g.add(mesh(rbox(w * 0.96, 0.008, d * 0.94, 0.004), M.darkglass, 0, CTOP + 0.004, 0));
    // five burners, laid out as she drew them: four corners and a centre
    for (const [u, v] of [[-0.314, -0.225], [0.314, -0.225], [-0.314, 0.225], [0.314, 0.225], [0, 0]]) {
      const r = u || v ? 0.055 : 0.07;
      const ring = mesh(new THREE.TorusGeometry(r, 0.012, 8, 28), M.steel, u * w, CTOP + 0.018, v * d);
      ring.rotation.x = Math.PI / 2; g.add(ring);
      g.add(mesh(new THREE.CylinderGeometry(r * 0.45, r * 0.45, 0.012, 20), M.darkglass, u * w, CTOP + 0.016, v * d));
    }
    return g;
  },
  burners() { return new THREE.Group(); },          // drawn by hob()
  otg(p) {
    const g = B.counter(p), o = p.obb, back = backDir(o), fr = frame(o, [-back[0], -back[1]]);
    fr.add(mesh(rbox(0.5, 0.32, 0.4, 0.015), M.darkglass, 0, CTOP + 0.16, 0));
    fr.add(mesh(new THREE.BoxGeometry(0.34, 0.2, 0.004), M.screen, -0.05, CTOP + 0.16, 0.201));
    g.add(fr); return g;
  },
  appliance_garage(p) {
    const g = new THREE.Group();
    g.add(prism(p.footprint, [], CTOP, CTOP + 0.45, M.tambour, M.lacquer));
    return g;
  },
  fridge(p) {
    const o = p.obb, back = backDir(o), g = new THREE.Group(), H = p.height || 1.79;
    g.add(prism(p.footprint, [], 0, H, M.steel));
    const fr = frame(o, [-back[0], -back[1]]);
    const w = Math.max(o.w, o.d), d = Math.min(o.w, o.d);
    fr.add(mesh(new THREE.BoxGeometry(0.006, H - 0.08, 0.004), M.darkglass, 0, H / 2, d / 2 + 0.002));   // the side-by-side split
    for (const s of [-1, 1]) fr.add(mesh(new THREE.BoxGeometry(0.018, 0.9, 0.03), M.steel, s * 0.05, H * 0.55, d / 2 + 0.03));
    g.add(fr); return g;
  },
  sofa(p, seats = 4) {
    const o = p.obb;
    /* The DXF block's facing vectors carry a roughly 10 degree skew even though the
       four-seaters are drawn square to the two living-room walls. Preserve which way
       each sofa faces, but snap that direction to its dominant plan axis. */
    const front = seats === 4 && p.facing
      ? (Math.abs(p.facing[0]) >= Math.abs(p.facing[1])
          ? [Math.sign(p.facing[0]) || 1, 0]
          : [0, Math.sign(p.facing[1]) || 1])
      : p.facing;
    const g = frame(o, front), w = o.w, d = o.d;
    const arm = 0.14, back = 0.2, legH = 0.08;
    for (const sx of [-1, 1]) for (const sz of [-1, 1])
      g.add(mesh(new THREE.CylinderGeometry(0.018, 0.014, legH, 10), M.brass, sx * (w / 2 - 0.06), legH / 2, sz * (d / 2 - 0.06)));
    g.add(mesh(rbox(w, 0.2, d, 0.03), M.fabric, 0, legH + 0.1, 0));
    const cw = (w - 2 * arm) / seats;
    for (let i = 0; i < seats; i++)
      g.add(mesh(rbox(cw - 0.012, 0.13, d - back - 0.02, 0.045), M.fabric, -w / 2 + arm + cw * (i + 0.5), legH + 0.265, back / 2));
    g.add(mesh(rbox(w - 2 * arm, 0.44, back, 0.05), M.fabric, 0, legH + 0.2 + 0.22, -d / 2 + back / 2));
    for (let i = 0; i < seats; i++)
      g.add(mesh(rbox(cw - 0.02, 0.3, 0.12, 0.05), M.accent, -w / 2 + arm + cw * (i + 0.5), legH + 0.47, -d / 2 + back + 0.05));
    for (const s of [-1, 1]) g.add(mesh(rbox(arm, 0.36, d, 0.05), M.fabric, s * (w / 2 - arm / 2), legH + 0.18 + 0.1, 0));
    return g;
  },
  armchair(p) { return B.sofa(p, 1); },
  dining_chair(p) {
    const o = p.obb, g = frame(o, p.facing), w = Math.min(o.w, o.d) * 0.92, d = w;
    for (const sx of [-1, 1]) for (const sz of [-1, 1])
      g.add(mesh(new THREE.BoxGeometry(0.032, 0.45, 0.032), M.walnut, sx * (w / 2 - 0.03), 0.225, sz * (d / 2 - 0.03)));
    g.add(mesh(rbox(w, 0.05, d, 0.015), M.fabric, 0, 0.47, 0));
    g.add(mesh(rbox(w * 0.9, 0.4, 0.035, 0.015), M.walnut, 0, 0.47 + 0.23, -d / 2 + 0.03));
    return g;
  },
  stool(p) {
    const o = p.obb, c = W(o.cx, o.cy), g = new THREE.Group(); g.position.set(c.x, 0, c.z);
    g.add(mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.05, 32), M.fabric, 0, 0.66, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.64, 12), M.brass, 0, 0.32, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.19, 0.2, 0.015, 32), M.brass, 0, 0.008, 0));
    const ring = mesh(new THREE.TorusGeometry(0.14, 0.008, 8, 32), M.brass, 0, 0.3, 0); ring.rotation.x = Math.PI / 2; g.add(ring);
    return g;
  },
  dining_table(p) {
    const o = p.obb, g = new THREE.Group();
    g.add(prism(p.footprint, [], 0.73, 0.76, M.walnut));
    const fr = frame(o);
    for (const sx of [-1, 1]) for (const sz of [-1, 1])
      fr.add(mesh(new THREE.BoxGeometry(0.06, 0.73, 0.06), M.walnut, sx * (o.w / 2 - 0.14), 0.365, sz * (o.d / 2 - 0.12)));
    g.add(fr); return g;
  },
  coffee_table(p) {
    // her nesting set: three tops at stepped heights so the smaller ones slide under
    const a = p.obb.w * p.obb.d, h = a > 0.8 ? 0.42 : a > 0.3 ? 0.36 : 0.3;
    const g = new THREE.Group();
    g.add(prism(p.footprint, [], h - 0.025, h, a > 0.8 ? M.top : M.walnut));
    const c = W(p.obb.cx, p.obb.cy);
    g.add(mesh(new THREE.CylinderGeometry(0.05, 0.08, h - 0.025, 16), M.brass, c.x, (h - 0.025) / 2, c.z));
    return g;
  },
  bench(p) {
    const g = new THREE.Group();
    g.add(prism(p.footprint, [], 0.05, 0.38, M.walnut));
    g.add(prism(p.footprint, [], 0.38, 0.45, M.accent));
    return g;
  },
  tv_unit(p) {
    const o = p.obb, back = backDir(o), g = new THREE.Group();
    g.add(prism(p.footprint, [], 0.22, 0.52, M.walnut));
    const fr = frame(o, [-back[0], -back[1]]);
    // screen: implied by her electrical drawing (TV points, TV-wall lights), not by the plan
    fr.add(mesh(rbox(1.24, 0.71, 0.03, 0.006), M.screen, 0, 1.38, -o.d / 2 + 0.03));
    g.add(fr); return g;
  },
  shoe_rack(p) {
    const g = new THREE.Group();
    g.add(prism(p.footprint, [], 0.1, 1.0, M.lacquer, M.walnut));
    g.add(prism(p.footprint, [], 0, 0.1, M.toekick));
    return g;
  },
  wc(p) {
    const o = p.obb, back = backDir(o), g = frame(o, [-back[0], -back[1]]);
    g.add(mesh(rbox(0.36, 0.34, 0.5, 0.12), M.ceramic, 0, 0.4, 0.02));
    return g;
  },
  basin(p) {
    const o = p.obb, c = W(o.cx, o.cy), g = new THREE.Group();
    g.add(mesh(rbox(Math.max(o.w, 0.35), 0.14, Math.max(o.d, 0.3), 0.06), M.ceramic, c.x, 0.82, c.z));
    return g;
  },
  vanity(p) {
    const g = new THREE.Group(), t3 = p.room === 'tlt3';
    // Toilet 3 follows her written spec: walnut floating vanity, terrazzo counter
    g.add(prism(p.footprint, [], 0.45, 0.8, t3 ? M.t3walnut : M.walnut));
    g.add(prism(p.footprint, [], 0.8, 0.83, t3 ? M.terrazzo : M.top));
    return g;
  },
  side_table(p) {
    const o = p.obb, c = W(o.cx, o.cy), g = new THREE.Group(), r = Math.min(o.w, o.d) / 2;
    g.add(mesh(new THREE.CylinderGeometry(r, r, 0.03, 40), M.top, c.x, 0.5, c.z));
    g.add(mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.5, 16), M.brass, c.x, 0.25, c.z));
    return g;
  },
  cupboard(p) {
    const g = new THREE.Group();
    g.add(prism(p.footprint, [], 0, 0.1, M.toekick));
    g.add(prism(p.footprint, [], 0.1, 0.9, M.shutters));
    g.add(prism(p.footprint, [], 0.9, 0.93, M.top));
    return g;
  },
  washer(p) {
    // her label: two IFB front loaders, 60 x 60 x 90 cm, side by side
    const o = p.obb, back = backDir(o), g = frame(o, [-back[0], -back[1]]);
    const n = Math.max(1, Math.round(o.w / 0.6)), w = o.w / n;
    for (let i = 0; i < n; i++) {
      const x = -o.w / 2 + w * (i + 0.5);
      g.add(mesh(rbox(w - 0.02, 0.88, 0.58, 0.02), M.washer, x, 0.44, 0));
      const door = mesh(new THREE.TorusGeometry(0.17, 0.025, 12, 40), M.steel, x, 0.48, 0.3);
      g.add(door);
      g.add(mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.01, 40), M.darkglass, x, 0.48, 0.295).rotateX(Math.PI / 2));
    }
    return g;
  },
};

// Toilet 3: her spec says large-format beige veined marble to all walls. Clad the
// inside of its outline with thin marble panels up to the section cut.
const t3 = zone.rooms.find(r => r.id === 'tlt3');
if (t3) {
  const o = t3.outline, clad = new THREE.Group();
  for (let i = 0; i < o.length - 1; i++) {
    const a = W(...o[i]), b = W(...o[i + 1]), len = a.distanceTo(b);
    if (len < 0.1) continue;
    // built from the floor up so the cutaway can scale it like a wall
    const g = new THREE.BoxGeometry(len, CUT, 0.012); g.translate(0, CUT / 2, 0);
    const m = mesh(g, M.tlt3wall, (a.x + b.x) / 2, 0, (a.z + b.z) / 2);
    m.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
    m.userData.wall = { z0: 0, z1: CUT, cx: (o[i][0] + o[i + 1][0]) / 2, cy: (o[i][1] + o[i + 1][1]) / 2 };
    clad.add(m);
  }
  clad.userData.cladding = true;
  scene.add(clad);
}

// Every piece sits in a pivot at its own centre, so it can be picked up and turned
// about itself. Builders place geometry in plan coordinates; the inner group undoes
// the pivot's offset so nothing moves until the pivot does.
// Loose furniture can be moved; fitted joinery, appliances and sanitaryware cannot.
const MOVABLE = new Set(['sofa', 'armchair', 'dining_chair', 'dining_table', 'coffee_table', 'bench', 'stool', 'side_table']);
const pieceGroups = [];
function placePiece(p) {
  const build = B[p.type] || B.unit;
  const g = build(p);
  g.traverse(o => { o.userData.piece = p; });
  const c = W(p.obb.cx, p.obb.cy), pivot = new THREE.Group(), inner = new THREE.Group();
  pivot.position.set(c.x, 0, c.z); inner.position.set(-c.x, 0, -c.z);
  inner.add(g); pivot.add(inner);
  pivot.userData.home = p.home; pivot.userData.piece = p;
  p.movable = p.movable ?? MOVABLE.has(p.type);
  pieces.add(pivot); pieceGroups.push(pivot);
  return pivot;
}
for (const p of zone.pieces) placePiece(p);

// ------------------------------------------------------------------ her bedroom models
// The four bedrooms are Ar. Shivangi Kaushik's own 3D models, placed by the
// registration in assets/cad-draft/scene.json (a draft, anchored on wall faces),
// cut at the section height like everything else and trimmed to her room so their
// outer walls give way to the shell's. Materials use the corrections from
// rooms-materials.js, read the way the r128 walkthrough read them (hex as linear),
// so they look as they were signed off there.
const models = new THREE.Group(); scene.add(models);
const modelRoots = {};
/* Curtain parts identified from the actual room GLBs. Keep this explicit: broad
   material-name matching previously confused Bedroom 1's frosted joinery and
   Bedroom 2's fluted wardrobe with window dressing. */
const CURTAIN_MATERIALS = {
  master: new Set(['Two_Sided']),
  // Bedroom 1's material called "Plain_White_Sheer" is actually a low bed textile
  // (only 46 cm high), so hiding it removed part of the bed. Its balcony-door curtain
  // is added explicitly below because it is absent from the exported room model.
  bed1:   new Set(),
  bed2:   new Set(['Two_Sided_3', 'Plain_White_Sheer_3769679_28cm_2']),
  bed3:   new Set(['Two_Sided']),
};
const CURTAIN_MODE = { master: 'side', bed1: 'split', bed2: 'roman', bed3: 'side' };
const curtainMeshes = {}, curtainsOpen = new Set();
function addBed1BalconyCurtain(root) {
  // The narrow walk-in passage ends at the balcony opening. Local room coordinates
  // were measured from bed1.glb: x -1.68..-0.32, z about -3.63, floor at y 0.
  // Two gently folded panels read as fabric from the cutaway and can be hidden by
  // the same daylight control as the authored curtains in the other bedrooms.
  const material = new THREE.MeshPhysicalMaterial({
    name: 'B34_Bed1_Balcony_Curtain', color: 0xD8CEBF, roughness: 0.94,
    sheen: 0.55, sheenRoughness: 0.78, sheenColor: new THREE.Color(0xFFF7EA),
    transparent: true, opacity: 0.82, depthWrite: false, side: THREE.DoubleSide,
  });
  const panel = (x, phase) => {
    const g = new THREE.PlaneGeometry(0.67, 2.48, 18, 2), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) / 0.67 + 0.5;
      p.setZ(i, Math.sin((u * 8 + phase) * Math.PI) * 0.026);
    }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, material);
    m.position.set(x, 1.29, -3.58); m.castShadow = m.receiveShadow = true;
    m.userData.curtain = 'bed1'; m.userData.curtainRole = 'original';
    root.add(m);
  };
  panel(-1.335, 0); panel(-0.665, 0.5);
  const rod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.013, 0.013, 1.48, 18),
    new THREE.MeshPhysicalMaterial({ color: 0x66584A, metalness: 0.65, roughness: 0.32 })
  );
  rod.rotation.z = Math.PI / 2; rod.position.set(-1, 2.58, -3.555); rod.castShadow = true;
  root.add(rod);
}
function curtainMaterial(source, { sheer = false } = {}) {
  const m = physicalMaterial(source).clone();
  m.name += sheer ? '_open_sheer' : '_gathered';
  m.transparent = sheer;
  m.opacity = sheer ? 0.20 : 0.93;
  m.depthWrite = !sheer;
  m.roughness = sheer ? 0.95 : Math.max(0.82, m.roughness);
  m.metalness = 0;
  m.sheen = sheer ? 0.2 : 0.58;
  m.sheenRoughness = 0.82;
  if (sheer) m.color.setHex(0xEAE4D9, THREE.LinearSRGBColorSpace);
  m.side = THREE.DoubleSide;
  return m;
}
function makeOpenCurtains(root, rid, originals) {
  if (!originals.length || CURTAIN_MODE[rid] !== 'side') return [];
  const box = new THREE.Box3();
  for (const o of originals) box.union(new THREE.Box3().setFromObject(o));
  if (box.isEmpty()) return [];
  const size = box.getSize(new THREE.Vector3()), centre = box.getCenter(new THREE.Vector3());
  const alongX = size.x >= size.z, width = alongX ? size.x : size.z;
  const depth = alongX ? size.z : size.x, height = size.y;
  const fabricSource = [].concat(originals[0].material)[0];
  const group = new THREE.Group();
  group.name = `B34_${rid}_OpenCurtains`;
  group.userData.curtain = rid; group.userData.curtainRole = 'proxy';
  const panelW = Math.max(0.22, width * 0.18);
  for (const side of [-1, 1]) {
    const g = new THREE.PlaneGeometry(panelW, height * 0.96, 16, 12), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) / panelW + 0.5, v = p.getY(i) / height + 0.5;
      p.setZ(i, Math.sin((u * 9 + side * 0.35) * Math.PI) * 0.035 + Math.sin(v * Math.PI) * 0.018);
    }
    g.computeVertexNormals();
    const panel = new THREE.Mesh(g, curtainMaterial(fabricSource));
    if (alongX) panel.position.set(centre.x + side * (width - panelW) * 0.5, centre.y, centre.z);
    else { panel.rotation.y = Math.PI / 2; panel.position.set(centre.x, centre.y, centre.z + side * (width - panelW) * 0.5); }
    panel.castShadow = panel.receiveShadow = true;
    panel.userData.curtain = rid; panel.userData.curtainRole = 'proxy';
    group.add(panel);
  }
  // Keep a light sheer across the glass. Opening the drapes should reveal the view,
  // not erase every trace of the designed window treatment.
  const sheer = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.96, height * 0.94), curtainMaterial(fabricSource, { sheer: true }));
  if (alongX) sheer.position.set(centre.x, centre.y, centre.z - Math.max(0.015, depth * 0.08));
  else { sheer.rotation.y = Math.PI / 2; sheer.position.set(centre.x - Math.max(0.015, depth * 0.08), centre.y, centre.z); }
  sheer.receiveShadow = true; sheer.userData.curtain = rid; sheer.userData.curtainRole = 'proxy'; sheer.userData.curtainPart = 'sheer';
  group.add(sheer); group.visible = false; root.add(group);
  return [group];
}
function rememberCurtainBase(o) {
  if (o.userData.curtainBase) return;
  const h = new THREE.Box3().setFromObject(o).getSize(new THREE.Vector3()).y;
  o.userData.curtainBase = { position: o.position.clone(), scale: o.scale.clone(), height: h };
}
function registerCurtains(root, rid) {
  const wanted = CURTAIN_MATERIALS[rid], found = [];
  if (wanted) root.traverse(o => {
    if (!o.isMesh) return;
    const names = [].concat(o.material).map(m => m?.name).filter(Boolean);
    if (o.userData.curtain === rid || names.some(n => wanted.has(n))) {
      o.userData.curtain = rid;
      o.userData.curtainRole ||= 'original';
      rememberCurtainBase(o); found.push(o);
    }
  });
  const proxies = makeOpenCurtains(root, rid, found);
  curtainMeshes[rid] = [...found, ...proxies];
  setCurtainsOnRoot(root, rid, curtainsOpen.has(rid));
  queueMicrotask(() => window.dispatchEvent(new Event('b34-curtains-ready')));
}
function setCurtainsOnRoot(root, rid, open) {
  if (!root) return;
  const mode = CURTAIN_MODE[rid];
  root.traverse(o => {
    if (o.userData.curtain !== rid) return;
    const role = o.userData.curtainRole || 'original';
    if (role === 'proxy') {
      // gathered drapes and a light sheer stand in for the curtains only while they
      // are open; closed, her own curtains show alone (both at once overlapped)
      if (o.isGroup) o.visible = open;
      if (o.userData.curtainPart === 'sheer' && o.material) o.material.opacity = 0.16;
      return;
    }
    const base = o.userData.curtainBase;
    if (!base) return;
    o.visible = true;
    o.position.copy(base.position); o.scale.copy(base.scale);
    if (!open) return;
    if (mode === 'side') { o.visible = false; return; }
    if (mode === 'split') {
      const left = base.position.x < -1;
      o.scale.x = base.scale.x * 0.34;
      o.position.x = base.position.x + (left ? -0.23 : 0.23);
    } else if (mode === 'roman') {
      o.scale.y = base.scale.y * 0.20;
      o.position.y = base.position.y + base.height * 0.40;
    }
  });
}
function setCurtainsOpen(rid, open) {
  if (!CURTAIN_MATERIALS[rid]) return;
  if (open) curtainsOpen.add(rid); else curtainsOpen.delete(rid);
  for (const root of [modelRoots[rid], lowCopies[rid]]) setCurtainsOnRoot(root, rid, open);
  dirtyShadows();
}
const hasCurtains = rid => !!curtainMeshes[rid]?.length;
const curtainRooms = () => Object.keys(curtainMeshes).filter(hasCurtains);
const draco = new DRACOLoader().setDecoderPath('./lib/draco/');
const gltf = new GLTFLoader().setDRACOLoader(draco);
const lin = (c, h) => c.setHex(h, THREE.LinearSRGBColorSpace);
const physicalMaterials = new WeakMap();
function physicalMaterial(source) {
  if (source.isMeshPhysicalMaterial) return source;
  if (physicalMaterials.has(source)) return physicalMaterials.get(source);
  const m = new THREE.MeshPhysicalMaterial();
  m.name = source.name;
  for (const k of ['map','alphaMap','aoMap','bumpMap','displacementMap','emissiveMap','envMap','lightMap',
                   'metalnessMap','normalMap','roughnessMap']) m[k] = source[k] || null;
  m.color.copy(source.color); m.emissive.copy(source.emissive);
  for (const k of ['roughness','metalness','bumpScale','displacementScale','displacementBias','emissiveIntensity',
                   'opacity','alphaTest','side','shadowSide','transparent','depthTest','depthWrite','vertexColors',
                   'flatShading','fog','polygonOffset','polygonOffsetFactor','polygonOffsetUnits']) {
    if (source[k] !== undefined) m[k] = source[k];
  }
  m.normalScale.copy(source.normalScale || new THREE.Vector2(1, 1));
  m.userData = { ...source.userData };
  physicalMaterials.set(source, m);
  return m;
}
function finishImported(m) {
  const n = m.name.toLowerCase();
  const fabricLike = /fabric|linen|sheer|curtain|cloth|uphol|velvet/.test(n);
  const leatherLike = /leather/.test(n);
  const stoneLike = /stone|marble|granite|travert|flooring|tile/.test(n);
  const woodLike = /wood|walnut|oak|teak|veneer/.test(n);
  const lacquerLike = /generic|lacquer|wardrobe|shutter/.test(n);
  if (fabricLike) {
    m.sheen = 0.48; m.sheenRoughness = 0.78;
    m.sheenColor.copy(m.color).lerp(new THREE.Color(0xFFF8EE), 0.38);
  } else if (leatherLike) {
    m.sheen = 0.16; m.sheenRoughness = 0.48; m.clearcoat = 0.1; m.clearcoatRoughness = 0.38;
  } else if (stoneLike) {
    m.clearcoat = 0.24; m.clearcoatRoughness = 0.18;
  } else if (woodLike) {
    m.clearcoat = 0.10; m.clearcoatRoughness = 0.34;
  } else if (lacquerLike && m.roughness < 0.7) {
    m.clearcoat = 0.13; m.clearcoatRoughness = 0.28;
  }
  const a = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  for (const t of [m.map, m.normalMap, m.roughnessMap, m.metalnessMap]) if (t) t.anisotropy = a;
}
// (A pass here once laid generated marble, limewash and wood grain over her flat
// colours. It made her rooms read as something she did not design and cost ~280
// extra textures, so her models now keep the colours in rooms-materials.js.)
function palette(root, rid) {
  const R = window.ROOMMAT || {};
  root.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = o.receiveShadow = true;
    const mats = [].concat(o.material).map(physicalMaterial);
    o.material = Array.isArray(o.material) ? mats : mats[0];
    for (const m of mats) {
      const exact = R.rooms?.[rid]?.[m.name];
      const vray = !exact && !m.map && R.vray?.[rid]?.[m.name];
      const e = exact || vray || (!m.map && R.common?.find(c => m.name.toLowerCase().includes(c.match)));
      if (e) {
        if (exact) m.map = null;
        lin(m.color, e.color);
        if (e.rough !== undefined) m.roughness = e.rough;
        if (e.metal) m.metalness = 1;
        if (e.emissive !== undefined && m.emissive) { lin(m.emissive, e.emissive); m.emissiveIntensity = e.glow === undefined ? 1 : e.glow; }
        if (e.opacity !== undefined) { m.transparent = true; m.opacity = e.opacity; m.depthWrite = false; }
      }
      const T = R.tune, tn = T && (T.rooms?.[rid]?.[m.name] || T.common?.find(t => m.name.toLowerCase().includes(t.match)));
      if (tn) {
        if (tn.rough !== undefined) m.roughness = tn.rough;
        if (tn.metal !== undefined) m.metalness = tn.metal;
        if (tn.color !== undefined) lin(m.color, tn.color);
        if (tn.env !== undefined) m.envMapIntensity = tn.env;
      }
      finishImported(m);
      if (m.envMapIntensity === undefined || m.envMapIntensity === 1)
        m.envMapIntensity = m.roughness < 0.3 ? 1.15 : m.clearcoat > 0 ? 0.62 : 0.38;
      m.side = THREE.DoubleSide;
      m.needsUpdate = true;
    }
  });
}
function clipTo(root, [x0, y0, x1, y1]) {
  const planes = [
    new THREE.Plane(new THREE.Vector3(1, 0, 0), -(x0 - CX)),
    new THREE.Plane(new THREE.Vector3(-1, 0, 0), x1 - CX),
    new THREE.Plane(new THREE.Vector3(0, 0, -1), CY - y0),
    new THREE.Plane(new THREE.Vector3(0, 0, 1), y1 - CY),
  ];
  root.traverse(o => { if (o.isMesh) for (const m of [].concat(o.material)) { m.clippingPlanes = planes; m.clipShadows = true; } });
}
const status = document.getElementById('status');
const modelRooms = zone.rooms.filter(r => r.model);
let loadedCount = 0;
const modelsReady = Promise.all(modelRooms.map(r => gltf.loadAsync(r.model.glb).then(g => {
  const root = g.scene;
  palette(root, r.id);
  if (r.id === 'bed1') addBed1BalconyCurtain(root);
  registerCurtains(root, r.id);
  const t = r.model.translation_xyz;
  root.position.set(t[0] - CX, t[1], t[2] + CY);
  root.rotation.set(...r.model.rotation_xyz);
  clipTo(root, r.model.clip_xy);
  root.traverse(o => { o.userData.model = r; });
  root.userData.home = r.id;
  root.visible = !focused || focused.id === r.id;
  models.add(root); modelRoots[r.id] = root;
  status.textContent = `Loading bedrooms ${++loadedCount} of ${modelRooms.length}`;
  if (loadedCount === modelRooms.length) setTimeout(() => status.textContent = '', 1800);
  dirtyShadows();
}).catch(e => { console.error(r.id, e); status.textContent = `Could not load ${r.name}: ${e.message}`; })));
status.textContent = `Loading bedrooms 0 of ${modelRooms.length}`;

// ------------------------------------------------------------------ cutaway
// Like a physical model: walls on the side facing you drop to knee height so the
// room reads, walls on the far side stay at full section height. A wall counts as
// "facing you" if stepping 0.7 m from it toward the camera leaves the zone (or, when
// one room is isolated, leaves that room). Only re-done when the set changes.
const LOW = 0.42;
let focused = null, focusGroup = null, lastKey = '';
const focusHooks = [];
function activeShell() { return focusGroup || shell; }
// Dead zone: walls only re-flip once the view has turned a clear 8 degrees since the
// last flip. Without it, the orbit's easing hovers on a threshold and the walls, and
// the shadows they cast, flutter up and down.
let lastAz = null;
function cutaway(force) {
  const az = Math.atan2(camera.position.x - controls.target.x, camera.position.z - controls.target.z);
  if (!force && lastAz !== null) {
    let dAz = Math.abs(az - lastAz); if (dAz > Math.PI) dAz = 2 * Math.PI - dAz;
    if (dAz < THREE.MathUtils.degToRad(8)) return;
  }
  lastAz = az;
  const ring = focused ? focused.outline : zone.zone;
  const reach = focused ? 0.45 : 0.7;
  const d = new THREE.Vector3().subVectors(camera.position, controls.target); d.y = 0; d.normalize();
  const px = d.x, py = -d.z;
  // the active shell's walls and glass, plus Toilet 3's marble cladding
  const cands = [...activeShell().children, ...(t3clad && t3clad.visible ? t3clad.children : [])];
  const low = [];
  cands.forEach((m, i) => {
    const info = m.userData.wall || m.userData.glass;
    if (info && !inRing([info.cx + px * reach, info.cy + py * reach], ring)) low.push(i);
  });
  const side = focused ? `${Math.sign(Math.round(px * 2.5))}${Math.sign(Math.round(py * 2.5))}` : '';
  const key = (focused ? focused.id : '*') + side + low.join(',');
  if (key === lastKey && !force) return;
  lastKey = key;
  if (focused?.model) modelCut(focused.id);
  const set = new Set(low);
  cands.forEach((m, i) => {
    if (m.userData.wall) {
      const w = m.userData.wall, h = set.has(i) ? Math.min(LOW, w.z1) : w.z1;
      m.scale.y = w.z0 > 0 ? (set.has(i) ? 0 : 1) : h / w.z1;
      m.visible = m.scale.y > 0.001;
    } else if (m.userData.glass) m.visible = !set.has(i);
  });
  dirtyShadows();
}
controls.addEventListener('change', () => cutaway());

// Her models carry their own walls. In single-room view the model is drawn twice:
// a copy kept below knee height across the whole room, and the original with its
// camera-facing edge trimmed off above that. The walls on your side drop, the rest
// (her headboard walls, wardrobes) stay at full height, and the trim follows the
// camera. clipShadows keeps the dropped walls from still casting shadow.
const lowCopies = {};
function modelCut(rid) {
  const root = modelRoots[rid], r = zone.rooms.find(q => q.id === rid);
  if (!root || !r) return;
  const [x0, y0, x1, y1] = r.model.clip_xy;
  const d = new THREE.Vector3().subVectors(camera.position, controls.target); d.y = 0; d.normalize();
  const px = d.x, py = -d.z, IN = 0.45;
  const X0 = x0 + (px < -0.2 ? IN : 0), X1 = x1 - (px > 0.2 ? IN : 0);
  const Y0 = y0 + (py < -0.2 ? IN : 0), Y1 = y1 - (py > 0.2 ? IN : 0);
  const planes = [
    new THREE.Plane(new THREE.Vector3(1, 0, 0), -(X0 - CX)), new THREE.Plane(new THREE.Vector3(-1, 0, 0), X1 - CX),
    new THREE.Plane(new THREE.Vector3(0, 0, -1), CY - Y0), new THREE.Plane(new THREE.Vector3(0, 0, 1), Y1 - CY)];
  root.traverse(o => { if (o.isMesh) for (const m of [].concat(o.material)) { m.clippingPlanes = planes; m.clipShadows = true; } });
  if (!lowCopies[rid]) {
    const low = root.clone(true);
    const lp = [
      new THREE.Plane(new THREE.Vector3(1, 0, 0), -(x0 - CX)), new THREE.Plane(new THREE.Vector3(-1, 0, 0), x1 - CX),
      new THREE.Plane(new THREE.Vector3(0, 0, -1), CY - y0), new THREE.Plane(new THREE.Vector3(0, 0, 1), y1 - CY),
      new THREE.Plane(new THREE.Vector3(0, -1, 0), LOW)];
    const cloneMat = (m) => { const c = m.clone(); c.clippingPlanes = lp; c.clipShadows = true; return c; };
    low.traverse(o => { if (o.isMesh) o.material = Array.isArray(o.material) ? o.material.map(cloneMat) : cloneMat(o.material); });
    models.add(low); lowCopies[rid] = low;
  }
  for (const [id, low] of Object.entries(lowCopies)) low.visible = id === rid;
  dirtyShadows();
}
function modelUncut() {
  for (const low of Object.values(lowCopies)) low.visible = false;
  for (const r of zone.rooms.filter(q => q.model)) if (modelRoots[r.id]) clipTo(modelRoots[r.id], r.model.clip_xy);
  dirtyShadows();
}

// ------------------------------------------------------------------ focus: one room alone
const focusCache = {};
const ringCentre = (r) => { const n = r.length - 1; let x = 0, y = 0; for (let i = 0; i < n; i++) { x += r[i][0]; y += r[i][1]; } return [x / n, y / n]; };
const ringRadius = (r, c) => Math.max(...r.map(([x, y]) => Math.hypot(x - c[0], y - c[1])));
let tween = null;
// the whole-flat view direction, in plan terms, undoing the 32 degree offset flyTo adds
const HOME_FROM = (() => { const a = ISO_AZ - THREE.MathUtils.degToRad(32); return [Math.sin(a), -Math.cos(a)]; })();
// Screen margins the interface panels cover, in px; the configurator keeps them current.
const safe = { left: 0, right: 0, top: 0, bottom: 0 };
// Frame a plan ring (floor to section cut) into the part of the screen the panels
// leave free, as seen from camera offset `off`: returns the orbit target and zoom.
function fitView(ring, off) {
  const f = off.clone().normalize().negate();
  const right = new THREE.Vector3().crossVectors(f, new THREE.Vector3(0, 1, 0)).normalize();
  const up = new THREE.Vector3().crossVectors(right, f).normalize();
  let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
  for (const [x, y] of ring) for (const h of [0, CUT]) {
    const p = W(x, y).setY(h), u = p.dot(right), v = p.dot(up);
    u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v);
  }
  const w = host.clientWidth, h = host.clientHeight, fw = camera.right - camera.left, fh = camera.top - camera.bottom;
  const freeW = Math.max(200, w - safe.left - safe.right), freeH = Math.max(200, h - safe.top - safe.bottom);
  const zoom = Math.min(controls.maxZoom, Math.max(controls.minZoom,
    0.94 * Math.min((freeW / w) * fw / (u1 - u0), (freeH / h) * fh / (v1 - v0))));
  const tu = (u0 + u1) / 2 - ((safe.left - safe.right) / 2) * fw / (w * zoom);
  const tv = (v0 + v1) / 2 - ((safe.bottom - safe.top) / 2) * fh / (h * zoom);
  const s = (0.6 - up.y * tv) / f.y;             // slide along the view line to target height 0.6 m
  const t = right.clone().multiplyScalar(tu).add(up.clone().multiplyScalar(tv)).add(f.clone().multiplyScalar(s));
  return { t, zoom };
}
function flyTo(ring, fromPlan) {
  const off0 = camera.position.clone().sub(controls.target), len = off0.length();
  let off1 = off0.clone();
  if (fromPlan) {
    // a three-quarter view from that side: rotate 32 degrees off the axis, 52 up
    const a = Math.atan2(fromPlan[0], -fromPlan[1]) + THREE.MathUtils.degToRad(32), el = ISO_EL;
    off1 = new THREE.Vector3(Math.sin(a) * Math.cos(el), Math.sin(el), Math.cos(a) * Math.cos(el)).multiplyScalar(len);
  }
  const { t, zoom } = fitView(ring, off1);
  tween = { t0: performance.now(), from: controls.target.clone(), to: t, z0: camera.zoom, z1: zoom, off0, off1, len };
}
const titleK = document.getElementById('t-k'), titleH = document.getElementById('t-h'), credit = document.getElementById('credit');
const back = document.getElementById('back');
// rooms that open into each other (foyer, living, dining) focus as one space
const spaces = Object.fromEntries((zone.spaces || []).map(s => [s.id, s]));
async function focusRoom(r) {
  if (!r) return;
  if (r.space) r = spaces[r.space];
  focused = r;
  const members = r.members || [r.id];
  if (!focusCache[r.id]) focusCache[r.id] = buildShell(new THREE.Group(), { plinth: r.island, floor: r.floor, walls: r.walls, glass: r.glass });
  focusGroup = focusCache[r.id];
  if (!focusGroup.parent) scene.add(focusGroup);
  for (const g of Object.values(focusCache)) g.visible = g === focusGroup;
  shell.visible = false;
  for (const g of pieceGroups) g.visible = members.includes(g.userData.home) && !g.userData.removed;
  for (const [id, root] of Object.entries(modelRoots)) root.visible = members.includes(id);
  if (t3clad) t3clad.visible = members.includes('tlt3');
  labels.forEach(l => l.el.hidden = true);
  titleK.textContent = 'B-34 · Dwarka · The flat'; titleH.textContent = r.name;
  back.hidden = false;
  flyTo(r.island, r.view_from);
  studio(true);
  if (r.model && !modelRoots[r.id]) { status.textContent = `Loading ${r.name}…`; await modelsReady; }
  useRoomEnvironment(r.id);
  lastKey = ''; cutaway(true);
  for (const hook of focusHooks) hook(focused);
}
function showFlat() {
  focused = null; focusGroup = null;
  for (const g of Object.values(focusCache)) g.visible = false;
  shell.visible = true;
  for (const g of pieceGroups) g.visible = !g.userData.removed;
  for (const root of Object.values(modelRoots)) root.visible = true;
  if (t3clad) t3clad.visible = true;
  labels.forEach(l => l.el.hidden = false);
  titleK.textContent = 'B-34 · Dwarka'; titleH.textContent = 'The flat';
  back.hidden = true;
  flyTo(zone.zone, HOME_FROM);
  useRoomEnvironment(null);
  studio(false); modelUncut();
  lastKey = ''; cutaway(true);
  for (const hook of focusHooks) hook(null);
}
back.onclick = showFlat;
addEventListener('keydown', e => { if (e.key === 'Escape' && focused) showFlat(); });

// room labels over the flat; click one to isolate that room
const labelHost = document.getElementById('labels');
const labels = zone.rooms.filter(r => !['store', 'wiw'].includes(r.id) || true).map(r => {
  const el = document.createElement('button');
  el.className = 'room' + (r.model ? ' designed' : '');
  el.textContent = r.name;
  el.onclick = () => focusRoom(r);
  labelHost.appendChild(el);
  return { r, el, p: W(...r.label_xy).setY(1.0) };
});
const tmp = new THREE.Vector3();
function placeLabels() {
  if (focused) return;
  const w = host.clientWidth, h = host.clientHeight;
  for (const l of labels) {
    tmp.copy(l.p).project(camera);
    l.el.style.transform = `translate(${(tmp.x * 0.5 + 0.5) * w}px, ${(-tmp.y * 0.5 + 0.5) * h}px) translate(-50%, -50%)`;
  }
}

// click on the floor of a room (a click, not an orbit drag) to isolate it
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let downAt = null;
renderer.domElement.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', e => {
  if (!downAt || focused) return;
  if (Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.ray.intersectPlane(floorPlane, new THREE.Vector3());
  if (!hit) return;
  const px = hit.x + CX, py = CY - hit.z;
  const cands = zone.rooms.filter(q => inRing([px, py], q.outline));
  if (!cands.length) return;
  const area = (ring) => Math.abs(ring.reduce((a, [x, y], i) => { const [x2, y2] = ring[(i + 1) % ring.length]; return a + x * y2 - x2 * y; }, 0) / 2);
  focusRoom(cands.sort((a, b) => area(a.outline) - area(b.outline))[0]);
});

let t3clad = scene.children.find(o => o.userData.cladding) || null;

// ------------------------------------------------------------------ post
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const gtao = new GTAOPass(scene, camera, 1, 1);
gtao.updateGtaoMaterial({ radius: 0.35, distanceExponent: 1.4, thickness: 1.0, scale: 1.0, samples: 16 });
gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
gtao.blendIntensity = 0.85;
composer.addPass(gtao);
composer.addPass(new SMAAPass());
composer.addPass(new OutputPass());

// ------------------------------------------------------------------ sizing
const zoneR = Math.max(...zone.zone.map(([x, y]) => Math.hypot(x - CX, y - CY)));
function resize() {
  const w = host.clientWidth, h = host.clientHeight, a = w / h;
  // fit the flat whatever the window shape: landscape fits height, portrait fits width
  if (a >= 1) { const hh = zoneR * 0.74; camera.top = hh; camera.bottom = -hh; camera.left = -hh * a; camera.right = hh * a; }
  else { const hw = zoneR * 0.92; camera.left = -hw; camera.right = hw; camera.top = hw / a; camera.bottom = -hw / a; }
  camera.updateProjectionMatrix();
  renderer.setSize(w, h); composer.setSize(w, h);
}
addEventListener('resize', resize); resize();

// ------------------------------------------------------------------ hover
const tip = document.getElementById('tip');
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let hovered = null;
renderer.domElement.addEventListener('pointermove', (e) => {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const shown = (o) => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
  const hit = ray.intersectObjects([pieces, models], true).find(h => shown(h.object) && (h.object.userData.piece || h.object.userData.model));
  const u = hit?.object.userData || {};
  const key = u.piece || u.model || null;
  if (key !== hovered) {
    hovered = key;
    if (u.piece) {
      const p = u.piece;
      tip.innerHTML = `<b>${p.name}</b>` + (p.movable && focused ? '<i>Drag to move · click for options</i>' : '');
      tip.hidden = false;
    } else if (u.model) {
      tip.innerHTML = `<b>${u.model.name}</b>${focused ? '' : '<i>Click to open this room</i>'}`;
      tip.hidden = false;
    } else tip.hidden = true;
  }
  if (key) { tip.style.left = e.clientX + 14 + 'px'; tip.style.top = e.clientY + 14 + 'px'; }
});
renderer.domElement.addEventListener('pointerleave', () => { tip.hidden = true; hovered = null; });

// ------------------------------------------------------------------ loop
cutaway(true);
dirtyShadows();
controls.addEventListener('change', () => wake());
addEventListener('resize', () => wake());
renderer.setAnimationLoop(() => {
  let moving = !!tween;
  if (tween) {
    const k = Math.min(1, (performance.now() - tween.t0) / 800), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    controls.target.lerpVectors(tween.from, tween.to, e);
    const off = tween.off0.clone().lerp(tween.off1, e).setLength(tween.len);
    camera.position.copy(controls.target).add(off);
    camera.zoom = tween.z0 + (tween.z1 - tween.z0) * e; camera.updateProjectionMatrix();
    if (k >= 1) tween = null;
  }
  if (controls.update()) moving = true;
  // a hook that throws must never stop the model from drawing
  for (const f of frameHooks) { try { if (f()) wake(1); } catch (e) { if (!f.failed) console.error(e); f.failed = true; } }
  if (moving) wake(1);
  if (wakeFrames <= 0 || api.hold) return;
  wakeFrames--;
  if (fill.intensity) { fill.position.copy(camera.position); fill.target.position.copy(controls.target); }
  placeLabels();
  composer.render();
});
document.body.classList.add('ready');

// what the configurator (configurator.js) builds on
const frameHooks = [];
export const api = {
  THREE, scene, camera, renderer, composer, controls, host, M, B, zone, W, CX, CY, CUT,
  inRing, inWall, prism, mesh, rbox, pieces, pieceGroups, placePiece, models, modelRoots,
  sun, hemi, fill, placeSun, dirtyShadows, wake, lightHooks, frameHooks, tip, spaces, safe,
  focusHooks, setCurtainsOpen, hasCurtains, curtainRooms,
  fitView, focusRoom, showFlat, activeShell, resetView: () => (focused ? focusRoom(focused) : showFlat()),
  get focused() { return focused; }, get studioOn() { return studioOn; },
};
window.__diorama = api;
