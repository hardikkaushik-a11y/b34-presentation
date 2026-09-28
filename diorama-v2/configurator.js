// The configurator: swap finishes, move furniture, change the light.
//
// The mechanics follow Ryan Sael's "Set the Mood" (sael.net/interior): samples in a
// tray that go onto surfaces, furniture that can be picked up and turned, a sun that
// moves, and a meter that reads the room. Rebuilt here for B-34, in our own code.
//
// What this layer changes is the viewer's play, never Ar. Shivangi Kaushik's design:
// every finish is a concept option, every moved piece is marked as moved from her
// layout and can be put back, and her four bedrooms and Toilet 3 cannot be touched.
import { api } from './diorama.js';
import { createProducts } from './products.js';
import { marble, wood, fabric, shutter, paint, terrazzo, boucle, velvet, leather, limewash, travertine,
         normalFrom, swatchURL } from './textures.js';

const { THREE, M, B, zone, W, CX, CY, scene, camera, renderer, controls, pieces, pieceGroups, inRing, inWall, mesh, rbox } = api;
const V3 = THREE.Vector3, CUT = api.CUT;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ------------------------------------------------------------------ samples
// L = how light it is, warm = cool (-1) to warm (+1), soft = how soft it looks. The
// meter reads the room from these. Colours are concept options; the defaults are the
// palette the diorama already used, extended from her finished rooms.
const SAMPLES = [
  { id: 'teak',      cat: 'wood',   name: 'Teak',             c: 0x8A5A32, dark: 0x3E2413, L: .42, warm: .75, soft: .45 },
  { id: 'walnut',    cat: 'wood',   name: 'Walnut',           c: 0x6A4731, dark: 0x2E1C10, L: .32, warm: .5,  soft: .45 },
  { id: 'oak',       cat: 'wood',   name: 'Natural oak',      c: 0xB08F6A, dark: 0x6E5843, L: .6,  warm: .5,  soft: .45 },
  { id: 'ash',       cat: 'wood',   name: 'White ash',        c: 0xE0D3BE, dark: 0xB09E82, L: .84, warm: .15, soft: .4 },
  { id: 'smoked',    cat: 'wood',   name: 'Smoked oak',       c: 0x5A4636, dark: 0x2A1F17, L: .28, warm: .2,  soft: .4 },
  { id: 'wenge',     cat: 'wood',   name: 'Wenge',            c: 0x3A2B22, dark: 0x15100C, L: .15, warm: 0,   soft: .35 },
  { id: 'botticino', cat: 'stone',  name: 'Botticino marble', c: 0xDCCFBC, vein: 0xA88E6E, L: .8,  warm: .35, soft: .1, tile: 0.8 },
  { id: 'bianco',    cat: 'stone',  name: 'Bianco marble',    c: 0xEEE9E0, vein: 0xB8AD9A, veins: 7, L: .9, warm: .15, soft: .1 },
  { id: 'statuario', cat: 'stone',  name: 'Statuario marble', c: 0xF2F0EC, vein: 0x8F8D89, veins: 4, L: .94, warm: 0, soft: .05, cc: .6 },
  { id: 'travertine',cat: 'stone',  name: 'Travertine',       c: 0xD8C4A4, kind: 'travertine', L: .74, warm: .45, soft: .25 },
  { id: 'jaisalmer', cat: 'stone',  name: 'Jaisalmer stone',  c: 0xD3AF6E, vein: 0xB08A4E, veins: 2, L: .66, warm: .75, soft: .2, rough: .4, cc: .1 },
  { id: 'kota',      cat: 'stone',  name: 'Kota stone',       c: 0x7B847F, vein: 0x69716D, veins: 0, L: .44, warm: -.3, soft: .15, tile: 0.6, rough: .35, cc: .15 },
  { id: 'terrazzo',  cat: 'stone',  name: 'Terrazzo',         c: 0xD9CDBA, kind: 'terrazzo', L: .78, warm: .2, soft: .2 },
  { id: 'nero',      cat: 'stone',  name: 'Nero marquina',    c: 0x1F1E1D, vein: 0xE6E1D8, veins: 6, L: .1, warm: -.1, soft: .05, cc: .6 },
  { id: 'oat',       cat: 'fabric', name: 'Oat linen',        c: 0xB7A993, L: .66, warm: .35, soft: .75 },
  { id: 'ivory',     cat: 'fabric', name: 'Ivory bouclé',     c: 0xE9E2D4, kind: 'boucle', L: .88, warm: .2, soft: 1 },
  { id: 'grey',      cat: 'fabric', name: 'Grey wool',        c: 0x8E9094, L: .55, warm: -.2, soft: .75 },
  { id: 'rust',      cat: 'fabric', name: 'Rust wool',        c: 0x8C5A3C, L: .38, warm: .85, soft: .8 },
  { id: 'mustard',   cat: 'fabric', name: 'Mustard velvet',   c: 0xB8862A, kind: 'velvet', L: .52, warm: .9, soft: .9 },
  { id: 'olive',     cat: 'fabric', name: 'Olive velvet',     c: 0x5A5C37, kind: 'velvet', L: .3, warm: .2, soft: .9 },
  { id: 'ink',       cat: 'fabric', name: 'Ink velvet',       c: 0x263045, kind: 'velvet', L: .18, warm: -.6, soft: .9 },
  { id: 'cognac',    cat: 'fabric', name: 'Cognac leather',   c: 0x8E5530, kind: 'leather', L: .4, warm: .75, soft: .4 },
  { id: 'warmwhite', cat: 'paint',  name: 'Warm white',       c: 0xEDE6DA, L: .9,  warm: .25, soft: .3 },
  { id: 'chalk',     cat: 'paint',  name: 'Chalk white',      c: 0xF4F2EC, L: .95, warm: 0,   soft: .3 },
  { id: 'sand',      cat: 'paint',  name: 'Sand limewash',    c: 0xD8C3A2, kind: 'limewash', L: .76, warm: .55, soft: .5 },
  { id: 'sage',      cat: 'paint',  name: 'Sage',             c: 0xA3AD94, L: .66, warm: -.1, soft: .35 },
  { id: 'terracotta',cat: 'paint',  name: 'Terracotta',       c: 0xB06848, kind: 'limewash', L: .45, warm: .9, soft: .45 },
  { id: 'dusk',      cat: 'paint',  name: 'Dusty blue',       c: 0x7C8E9F, L: .55, warm: -.5, soft: .3 },
  { id: 'taupe',     cat: 'paint',  name: 'Taupe',            c: 0x8A7F72, L: .48, warm: .2,  soft: .3 },
  { id: 'forest',    cat: 'paint',  name: 'Deep green',       c: 0x33443A, L: .2,  warm: -.2, soft: .35 },
  { id: 'charcoal',  cat: 'paint',  name: 'Charcoal',         c: 0x3A3937, L: .17, warm: -.1, soft: .3 },
];
const SAMPLE = Object.fromEntries(SAMPLES.map(s => [s.id, s]));
const CATS = [['wood', 'Wood'], ['stone', 'Stone'], ['fabric', 'Fabric'], ['paint', 'Paint']];

// the surfaces a sample can go on, and which material each one drives
M.rug = new THREE.MeshPhysicalMaterial({ roughness: 0.95 });
const SLOTS = {
  floor:      { name: 'Floor', the: 'the floor', cats: ['wood', 'stone'], mat: 'floor' },
  walls:      { name: 'Walls', the: 'the walls', cats: ['paint', 'stone'], mat: 'walls' },
  joinery:    { name: 'Joinery fronts', the: 'kitchen and cupboard fronts', cats: ['paint', 'wood'], mat: 'shutters' },
  worktop:    { name: 'Worktops', the: 'worktops and table tops', cats: ['stone'], mat: 'top' },
  upholstery: { name: 'Upholstery', the: 'the sofas and chairs', cats: ['fabric'], mat: 'fabric' },
  accent:     { name: 'Cushions', the: 'cushions and bench seats', cats: ['fabric'], mat: 'accent' },
  woodwork:   { name: 'Woodwork', the: 'tables, chair frames and the TV unit', cats: ['wood'], mat: 'walnut' },
  doors:      { name: 'Doors', the: 'the doors', cats: ['wood', 'paint'], mat: 'door' },
  rug:        { name: 'Rugs', the: 'the rugs', cats: ['fabric'], mat: 'rug' },
};
const DEFAULTS = { floor: 'botticino', walls: 'warmwhite', joinery: 'taupe', worktop: 'bianco', upholstery: 'oat',
                   accent: 'rust', woodwork: 'walnut', doors: 'oak', rug: 'grey' };
const FIRST_SLOT = { wood: 'floor', stone: 'floor', paint: 'walls', fabric: 'upholstery' };
/* Client-facing floor and wall choices stay within the quiet material language of
   the project. The larger library remains available for joinery, worktops and soft
   furnishings, but saturated green, blue, yellow and novelty dark floors are not
   offered for the two largest surfaces. */
const CURATED_SURFACES = {
  floor: new Set(['teak', 'walnut', 'oak', 'ash', 'smoked',
                  'botticino', 'bianco', 'statuario', 'travertine', 'terrazzo']),
  walls: new Set(['warmwhite', 'chalk', 'sand', 'taupe',
                  'botticino', 'bianco', 'travertine'])
};
const allowedOn = (slot, id) => !CURATED_SURFACES[slot] || CURATED_SURFACES[slot].has(id);
const MAT2SLOT = new Map(Object.entries(SLOTS).map(([k, s]) => [M[s.mat], k]));
const LOCKED = new Set([M.tlt3wall, M.t3walnut, M.terrazzo]);

// ------------------------------------------------------------------ finishes
// A finish is a colour texture plus a relief map read off it, and physical values:
// fabrics get sheen, polished stone and lacquer a clearcoat. Pattern and scale follow
// the surface: wood on a floor is laid planks, on a table it is long grain.
const texCache = new Map();
function finishFor(s, slot) {
  const key = s.id + ':' + slot;
  if (texCache.has(key)) return texCache.get(key);
  const seed = [...s.id].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) & 0xffff;
  let map, rough = 0.6, cc = 0, ccr = 0.2, sheen = 0, sheenR = 0.6, ns = 0.4, str = 2;
  if (s.cat === 'wood') {
    const o = { base: s.c, dark: s.dark, seed };
    if (slot === 'floor') { map = wood({ ...o, plank: 0.19, length: 1.6, ends: true }); rough = 0.36; cc = 0.25; ns = 0.35; }
    else if (slot === 'joinery') { map = wood({ ...o, plank: 0.6, length: 0.9 }); rough = 0.45; cc = 0.1; }
    else if (slot === 'doors') { map = wood({ ...o, plank: 0.9, length: 2.1 }); rough = 0.55; }
    else { map = wood({ ...o, plank: 0.3, length: 1.8 }); rough = 0.5; cc = 0.12; }
    str = 2.5;
  } else if (s.cat === 'stone') {
    const tile = slot === 'floor' ? (s.tile || 0.8) : slot === 'walls' ? 1.2 : 1.4, joint = slot !== 'worktop';
    if (s.kind === 'travertine') { map = travertine({ base: s.c, tile, seed }); rough = 0.5; }
    else if (s.kind === 'terrazzo') { map = terrazzo({ base: s.c, tile: 0.6, seed }); rough = 0.32; cc = 0.2; }
    else { map = marble({ base: s.c, vein: s.vein, tile, joint, veins: s.veins ?? 5, seed }); rough = s.rough ?? 0.18; cc = s.cc ?? 0.4; ccr = 0.08; }
    ns = 0.2; str = 1.5;
  } else if (s.cat === 'fabric') {
    const k = s.kind || 'weave';
    map = k === 'boucle' ? boucle({ base: s.c, seed }) : k === 'velvet' ? velvet({ base: s.c, seed })
        : k === 'leather' ? leather({ base: s.c, seed }) : fabric({ base: s.c, seed });
    rough = k === 'leather' ? 0.5 : 0.92;
    sheen = k === 'velvet' ? 1 : k === 'leather' ? 0 : 0.45; sheenR = k === 'velvet' ? 0.35 : 0.7;
    cc = k === 'leather' ? 0.2 : 0; ns = k === 'velvet' ? 0.3 : 0.9; str = k === 'boucle' ? 5 : 3.5;
  } else {
    if (slot === 'joinery') { map = shutter({ base: s.c, seed }); rough = 0.36; cc = 0.25; ns = 0.5; str = 3; }
    else if (s.kind === 'limewash') { map = limewash({ base: s.c, seed }); rough = 0.95; ns = 0.5; str = 3; }
    else { map = paint({ base: s.c, seed }); rough = slot === 'doors' ? 0.55 : 0.9; ns = 0.3; str = 3; }
  }
  const f = { map, normalMap: normalFrom(map, str), rough, cc, ccr, sheen, sheenR, ns,
              sheenColor: new THREE.Color(s.c).lerp(new THREE.Color(0xffffff), 0.45) };
  texCache.set(key, f);
  return f;
}

const state = { f: {}, t: 10.5, c: {}, p: {} };
const DEFAULT_T = 10.5;
function setSlot(slot, id) {
  const s = SAMPLE[id], m = M[SLOTS[slot].mat];
  if (!s) return;
  const f = finishFor(s, slot);
  m.map = f.map; m.normalMap = f.normalMap; m.normalScale.set(f.ns, f.ns);
  m.color.set(0xffffff); m.metalness = 0; m.roughness = f.rough;
  m.clearcoat = f.cc; m.clearcoatRoughness = f.ccr;
  m.sheen = f.sheen; m.sheenRoughness = f.sheenR; m.sheenColor.copy(f.sheenColor);
  m.needsUpdate = true;
  state.f[slot] = id;
  api.wake();
}

// ------------------------------------------------------------------ new pieces
// What the Furniture tray adds. None of these are in her layout; they are marked
// "added here" wherever they appear.
M.shade = new THREE.MeshPhysicalMaterial({ color: 0xEFE4CF, roughness: 0.9, side: THREE.DoubleSide, emissive: 0xFFB35C, emissiveIntensity: 0 });
M.leaf = new THREE.MeshPhysicalMaterial({ color: 0x3C5A32, roughness: 0.5, sheen: 0.4, sheenColor: new THREE.Color(0x9DBB84), side: THREE.DoubleSide });
M.leaf2 = new THREE.MeshPhysicalMaterial({ color: 0x55743F, roughness: 0.55, sheen: 0.3, sheenColor: new THREE.Color(0xA9C58E), side: THREE.DoubleSide });
M.pot = new THREE.MeshPhysicalMaterial({ color: 0xA9694A, roughness: 0.85 });
M.soil = new THREE.MeshStandardMaterial({ color: 0x2A2019, roughness: 1 });
function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function at(p) { const g = new THREE.Group(), c = W(p.obb.cx, p.obb.cy); g.position.set(c.x, 0, c.z); g.rotation.y = p.obb.angle; return g; }
B.sofa3 = (p) => B.sofa(p, 3);
B.rug = (p) => {
  const g = at(p), o = p.obb;
  const r = mesh(rbox(o.w, 0.014, o.d, 0.006), M.rug, 0, 0.007, 0); r.castShadow = false; g.add(r);
  return g;
};
B.pouf = (p) => {
  const g = at(p), r = Math.min(p.obb.w, p.obb.d) / 2;
  const m = mesh(new THREE.SphereGeometry(1, 40, 20), M.accent, 0, 0.21, 0); m.scale.set(r, 0.21, r); g.add(m);
  return g;
};
B.floor_lamp = (p) => {
  const g = at(p);
  g.add(mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.025, 40), M.brass, 0, 0.0125, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.011, 0.011, 1.42, 12), M.brass, 0, 0.72, 0));
  const shade = mesh(new THREE.CylinderGeometry(0.17, 0.22, 0.3, 40, 1, true), M.shade, 0, 1.5, 0);
  shade.castShadow = false; g.add(shade);
  const light = new THREE.PointLight(0xFFB766, 0, 5.5, 2); light.position.set(0, 1.4, 0); light.userData.lamp = true;
  g.add(light);
  return g;
};
B.plant = (p) => {
  const g = at(p), r = rng(p.id.split('').reduce((a, ch) => a + ch.charCodeAt(0), 3));
  g.add(mesh(new THREE.CylinderGeometry(0.19, 0.14, 0.36, 36), M.pot, 0, 0.18, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.175, 0.175, 0.02, 36), M.soil, 0, 0.35, 0));
  const leafGeo = new THREE.SphereGeometry(1, 12, 8);
  for (let i = 0; i < 26; i++) {
    const a = r() * Math.PI * 2, h = 0.55 + r() * 0.85, out = 0.08 + r() * 0.26 * (h / 1.4);
    const stem = mesh(new THREE.CylinderGeometry(0.006, 0.008, h - 0.3, 5), M.leaf2, Math.cos(a) * out / 2, 0.35 + (h - 0.35) / 2, Math.sin(a) * out / 2);
    stem.rotation.z = -Math.cos(a) * out / h; stem.rotation.x = Math.sin(a) * out / h; stem.castShadow = false; g.add(stem);
    const leaf = mesh(leafGeo, r() < 0.5 ? M.leaf : M.leaf2, Math.cos(a) * out, h, Math.sin(a) * out);
    leaf.scale.set(0.07 + r() * 0.03, 0.008, 0.15 + r() * 0.06);
    leaf.rotation.set(-0.5 - r() * 0.5, -a + Math.PI / 2, 0, 'YXZ');
    g.add(leaf);
  }
  return g;
};
const CATALOGUE = [
  { type: 'sofa3', name: 'Sofa', w: 2.1, d: 0.92 },
  { type: 'armchair', name: 'Armchair', w: 0.85, d: 0.85 },
  { type: 'coffee_table', name: 'Coffee table', w: 1.1, d: 0.6 },
  { type: 'side_table', name: 'Side table', w: 0.5, d: 0.5 },
  { type: 'pouf', name: 'Pouf', w: 0.55, d: 0.55 },
  { type: 'bench', name: 'Bench', w: 1.3, d: 0.42 },
  { type: 'dining_chair', name: 'Dining chair', w: 0.5, d: 0.5 },
  { type: 'stool', name: 'Bar stool', w: 0.45, d: 0.45 },
  { type: 'rug', name: 'Rug', w: 2.4, d: 1.7 },
  { type: 'floor_lamp', name: 'Floor lamp', w: 0.45, d: 0.45 },
  { type: 'plant', name: 'Plant', w: 0.6, d: 0.6 },
];

// ------------------------------------------------------------------ real products
// Kohler basins and rain showers, the balcony and washroom tiles, dining sets: see
// products.js. Their choices sit in state.p (keys like 'basin.tlt1'), in the link.
const PR = createProducts(api);

// ------------------------------------------------------------------ furniture rules
// A piece has to stand inside a room that is open to change (not her bedrooms, not
// Toilet 3), clear of the walls, and not through another piece. Pairs that already
// overlap in her drawing (the nesting tables, chairs tucked under the table) may keep
// doing so. Moves snap to 10 cm from where the piece started, so a piece she lined up
// with a wall stays lined up; turns go in 15 degree steps.
const OPEN = zone.rooms.filter(r => !r.designed);
const area = (ring) => Math.abs(ring.reduce((a, [x, y], i) => { const [x2, y2] = ring[(i + 1) % ring.length]; return a + x * y2 - x2 * y; }, 0) / 2);
function roomAt(x, y) { return zone.rooms.filter(r => inRing([x, y], r.outline)).sort((a, b) => area(a.outline) - area(b.outline))[0] || null; }
function corners(q, w, d, shrink = 0) {
  const c = Math.cos(q.angle), s = Math.sin(q.angle), hw = Math.max(0.01, w / 2 - shrink), hd = Math.max(0.01, d / 2 - shrink);
  return [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([u, v]) => [q.cx + u * c - v * s, q.cy + u * s + v * c]);
}
function samples(q, w, d, shrink) {
  const k = corners(q, w, d, shrink), pts = [...k, [q.cx, q.cy]];
  for (let i = 0; i < 4; i++) pts.push([(k[i][0] + k[(i + 1) % 4][0]) / 2, (k[i][1] + k[(i + 1) % 4][1]) / 2]);
  return pts;
}
function overlap(A, Bq) {
  for (const P of [A, Bq]) for (let i = 0; i < 4; i++) {
    const [x1, y1] = P[i], [x2, y2] = P[(i + 1) % 4], nx = y1 - y2, ny = x2 - x1;
    let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
    for (const [x, y] of A) { const t = x * nx + y * ny; a0 = Math.min(a0, t); a1 = Math.max(a1, t); }
    for (const [x, y] of Bq) { const t = x * nx + y * ny; b0 = Math.min(b0, t); b1 = Math.max(b1, t); }
    if (a1 <= b0 || b1 <= a0) return false;
  }
  return true;
}
const pose = (p) => p.pose || (p.pose = { cx: p.obb.cx, cy: p.obb.cy, angle: p.obb.angle });
const pairKey = (a, b) => a.id < b.id ? a.id + '|' + b.id : b.id + '|' + a.id;
const allowed = new Set();
for (let i = 0; i < zone.pieces.length; i++) for (let j = i + 1; j < zone.pieces.length; j++) {
  const a = zone.pieces[i], b = zone.pieces[j];
  if (overlap(corners(a.obb, a.obb.w, a.obb.d, 0.02), corners(b.obb, b.obb.w, b.obb.d, 0.02))) allowed.add(pairKey(a, b));
}
function fits(p, q) {
  if (!samples(q, p.obb.w, p.obb.d, 0.05).every(pt => OPEN.some(r => inRing(pt, r.outline)) && !inWall(pt))) return false;
  if (p.type === 'rug') return true;
  const mine = corners(q, p.obb.w, p.obb.d, 0.02);
  for (const g of pieceGroups) {
    const o = g.userData.piece;
    if (o === p || g.userData.removed || o.type === 'rug' || allowed.has(pairKey(p, o))) continue;
    if (overlap(mine, corners(pose(o), o.obb.w, o.obb.d, 0.02))) return false;
  }
  return true;
}
function setPose(pivot, q) {
  const p = pivot.userData.piece;
  p.pose = { cx: q.cx, cy: q.cy, angle: q.angle };
  const c = W(q.cx, q.cy);
  pivot.position.set(c.x, 0, c.z);
  pivot.rotation.y = q.angle - p.obb.angle;
  p.moved = !p.added && (Math.abs(q.cx - p.obb.cx) > 1e-3 || Math.abs(q.cy - p.obb.cy) > 1e-3 || Math.abs(q.angle - p.obb.angle) > 1e-3);
  // a moved piece belongs to the room it now stands in; one in place keeps her room
  const r = (p.moved || p.added) && roomAt(q.cx, q.cy);
  pivot.userData.home = r ? r.id : p.home;
}
function refreshVisibility() {
  const f = api.focused, members = f ? (f.members || [f.id]) : null;
  for (const g of pieceGroups) g.visible = !g.userData.removed && (!members || members.includes(g.userData.home));
}
const rectRing = (o) => { const k = corners(o, o.w, o.d); return [...k, k[0]]; };
let addN = 0;
function addPiece(type, q) {
  const c = CATALOGUE.find(i => i.type === type);
  if (!c) return null;
  const o = { cx: q.cx, cy: q.cy, w: c.w, d: c.d, angle: 0 };
  const p = { id: 'add' + (++addN), type, name: c.name, obb: o, footprint: rectRing(o), facing: null,
              added: true, movable: true, home: roomAt(q.cx, q.cy)?.id || null, room: null };
  const pivot = api.placePiece(p);
  setPose(pivot, { cx: q.cx, cy: q.cy, angle: q.angle || 0 });
  if (type === 'floor_lamp') relight();
  return pivot;
}
function dropAdded(g) {
  pieces.remove(g);
  pieceGroups.splice(pieceGroups.indexOf(g), 1);
}

// ------------------------------------------------------------------ daylight
// The sun follows its real path over Delhi (latitude 28.6 N, equinox, solar noon at
// about 12:20 IST), turned into the plan by her north arrow. Both are approximate.
// After dark there is no fixture light to show (her ceiling plan is not in yet), so the
// flat gets a generic warm fill and any floor lamps added here switch on.
const LAT = THREE.MathUtils.degToRad(28.6), NOON = 12.35;
const NORTH = (() => { const [x, y] = zone.north_sheet || [0, 1], l = Math.hypot(x, y); return [x / l, y / l]; })();
function sunAt(t) {
  const H = THREE.MathUtils.degToRad((t - NOON) * 15);
  const el = Math.asin(Math.cos(LAT) * Math.cos(H));
  const az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(LAT)) + Math.PI;     // compass bearing, clockwise from north
  return { el: THREE.MathUtils.radToDeg(el), az };
}
function planDir(az) {
  const [nx, ny] = NORTH, c = Math.cos(az), s = Math.sin(az);
  return [nx * c + ny * s, -nx * s + ny * c];
}
const glow = new THREE.HemisphereLight(0xFFC88E, 0x2A1D12, 0); scene.add(glow);
// a low sun sweeps the flat at a slant; widen the shadow box so the far rooms stay in it
Object.assign(api.sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13 });
api.sun.shadow.camera.updateProjectionMatrix();
const SUNSET = new THREE.Color(0xFFA062), NIGHTSKY = new THREE.Color(0x46557A);
function relight() {
  const { el, az } = sunAt(state.t), studio = api.studioOn;
  const day = smooth(-5, 8, el), low = 1 - smooth(3, 32, el);
  let [px, py] = planDir(az), sunEl = Math.max(el, 3);
  if (el > -1.5) {
    api.sun.color.setHex(0xFFF1DE).lerp(SUNSET, low * low * 0.8);
    api.sun.intensity = 3.6 * smooth(-1.5, 10, el);
  } else {                                     // the moon, on the sun's path 12 h behind
    const m = sunAt(state.t - 12);
    [px, py] = planDir(m.az); sunEl = Math.max(m.el, 3);
    api.sun.color.setHex(0x9DB0D6); api.sun.intensity = 0.4 * smooth(-1.5, -7, el) * smooth(-2, 12, m.el);
  }
  api.placeSun(THREE.MathUtils.radToDeg(Math.atan2(px, -py)), sunEl);
  // The sun does the modelling; ambient stays low so rooms keep their contrast. A
  // single room gets a camera-side fill so her deeper bedrooms still read.
  api.hemi.intensity = (studio ? 0.72 : 0.48) * (0.4 + 0.6 * day);
  api.hemi.color.setHex(0xFFF1E0).lerp(NIGHTSKY, 1 - day);
  scene.environmentIntensity = (studio ? 0.72 : 0.52) * (0.4 + 0.6 * day);
  api.fill.intensity = studio ? 1.0 * (0.45 + 0.55 * day) : 0;
  glow.intensity = (1 - day) * (studio ? 0.7 : 0.55);
  pieces.traverse(o => { if (o.userData.lamp) o.intensity = (1 - day) * 4.5; });
  M.shade.emissiveIntensity = (1 - day) * 1.8;
  renderer.toneMappingExposure = 1 + (1 - day) * 0.15;
  api.dirtyShadows();
}
api.lightHooks.relight = relight;
const clock = (t) => { const h = Math.floor(t), m = Math.round((t - h) * 60); return `${String(h + (m === 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
const TIMES = [['Morning', 7.5, 'sunrise'], ['Midday', 12.35, 'sun'], ['Evening', 17.6, 'lamp'], ['Night', 21, 'moon']];

// ------------------------------------------------------------------ mood
const PRESETS = [
  { id: 'original', name: 'Original', sub: 'mid-morning', f: DEFAULTS, t: 10.5 },
  { id: 'cozy', name: 'Cozy', sub: 'golden hour', t: 17.3,
    f: { floor: 'teak', walls: 'sand', joinery: 'oak', worktop: 'travertine', upholstery: 'oat', accent: 'rust', woodwork: 'teak', doors: 'teak', rug: 'rust' } },
  { id: 'bright', name: 'Bright', sub: 'midday', t: 12.35,
    f: { floor: 'statuario', walls: 'chalk', joinery: 'chalk', worktop: 'statuario', upholstery: 'ivory', accent: 'oat', woodwork: 'ash', doors: 'ash', rug: 'ivory' } },
  { id: 'moody', name: 'Moody', sub: 'after dark', t: 19.4,
    f: { floor: 'smoked', walls: 'taupe', joinery: 'charcoal', worktop: 'nero', upholstery: 'ink', accent: 'mustard', woodwork: 'wenge', doors: 'smoked', rug: 'olive' } },
];
const WEIGHT = { floor: 0.3, walls: 0.34, joinery: 0.08, worktop: 0.04, upholstery: 0.12, accent: 0.04, woodwork: 0.08 };
function meter() {
  let L = 0, warm = 0, soft = 0;
  for (const [k, w] of Object.entries(WEIGHT)) { const s = SAMPLE[state.f[k]]; L += s.L * w; warm += s.warm * w; soft += s.soft * w; }
  const { el } = sunAt(state.t);
  const high = smooth(10, 50, el), golden = el > -2 ? Math.exp(-((el - 8) ** 2) / 110) : 0, dark = 1 - smooth(-5, 6, el);
  const bright = L * 0.75 + high * 0.55;
  const cozy = (warm * 0.5 + 0.5) * 0.55 + soft * 0.3 + golden * 0.6;
  const moody = (1 - L) * 0.85 + dark * 0.75;
  const raw = [cozy, bright, moody].map(v => Math.max(0.02, v) ** 2.5), sum = raw.reduce((a, b) => a + b);
  const pct = raw.map(v => Math.round(v / sum * 100));
  pct[pct.indexOf(Math.max(...pct))] += 100 - pct.reduce((a, b) => a + b);
  return pct;
}
function reading(pct) {
  const { el } = sunAt(state.t), n = (k) => SAMPLE[state.f[k]].name;
  const light = el < -2 ? 'lamplight after dark' : el < 14 ? 'a low gold sun' : el > 48 ? 'the high midday sun' : 'soft sun from the side';
  const mood = ['cozy', 'bright', 'moody'][pct.indexOf(Math.max(...pct))];
  return `<b>${n('walls')} walls</b>, a <b>${n('floor').toLowerCase()} floor</b> and ${light}. It reads <em class="${mood}">${mood}</em>.`;
}

// ------------------------------------------------------------------ state, undo, link
function serialize() {
  const s = {}, f = {}, m = {}, x = [], a = [];
  for (const k in SLOTS) if (state.f[k] !== DEFAULTS[k]) f[k] = state.f[k];
  const r3 = (v) => Math.round(v * 1000) / 1000, deg = (q) => Math.round(THREE.MathUtils.radToDeg(q.angle) * 10) / 10;
  for (const g of pieceGroups) {
    const p = g.userData.piece, q = pose(p);
    if (p.added) { a.push([p.type, r3(q.cx), r3(q.cy), deg(q)]); continue; }
    if (g.userData.removed) x.push(p.id);
    else if (p.moved) m[p.id] = [r3(q.cx), r3(q.cy), deg(q)];
  }
  if (Object.keys(f).length) s.f = f;
  const pp = {}; for (const k in PR.DEFAULTS) if (state.p[k] && state.p[k] !== PR.DEFAULTS[k]) pp[k] = state.p[k];
  if (Object.keys(pp).length) s.p = pp;
  if (Math.abs(state.t - DEFAULT_T) > 1e-3) s.t = Math.round(state.t * 100) / 100;
  const c = Object.keys(state.c).filter(rid => state.c[rid]);
  if (c.length) s.c = c;
  if (Object.keys(m).length) s.m = m;
  if (x.length) s.x = x;
  if (a.length) s.a = a;
  return s;
}
function applyState(s, { furniture = true } = {}) {
  deselect();
  for (const k in SLOTS) { const id = s.f?.[k] || DEFAULTS[k]; if (state.f[k] !== id) setSlot(k, id); }
  state.t = s.t ?? DEFAULT_T;
  const open = new Set(s.c || []);
  for (const rid of ['master', 'bed1', 'bed2', 'bed3']) {
    state.c[rid] = open.has(rid);
    api.setCurtainsOpen(rid, state.c[rid]);
  }
  if (furniture) {
    for (const g of [...pieceGroups]) if (g.userData.piece.added) dropAdded(g);
    for (const g of pieceGroups) {
      const p = g.userData.piece, mv = s.m?.[p.id];
      setPose(g, mv ? { cx: mv[0], cy: mv[1], angle: THREE.MathUtils.degToRad(mv[2]) } : { cx: p.obb.cx, cy: p.obb.cy, angle: p.obb.angle });
      g.userData.removed = !!s.x?.includes(p.id);
    }
    for (const [type, cx, cy, d] of s.a || []) addPiece(type, { cx, cy, angle: THREE.MathUtils.degToRad(d) });
  }
  state.p = { ...PR.DEFAULTS, ...(s.p || {}) };
  PR.apply(state.p);
  if (furniture) { arrangeChairs(s.m || {}); refreshVisibility(); }
  relight();
}
// a round table seats its chairs around it; any chair the viewer placed stays put
function arrangeChairs(userMoves = {}) {
  const table = pieceGroups.find(g => g.userData.piece.type === 'dining_table')?.userData.piece;
  if (!table) return;
  const chairs = pieceGroups.filter(g => g.userData.piece.type === 'dining_chair' && !g.userData.removed &&
    Math.hypot(g.userData.piece.obb.cx - table.obb.cx, g.userData.piece.obb.cy - table.obb.cy) < 1.6);
  const round = state.p.table === 'travertine_round';
  const poses = round ? PR.roundChairPoses(table, chairs.map(g => g.userData.piece)) : null;
  chairs.forEach((g, i) => {
    const p = g.userData.piece;
    if (userMoves[p.id]) return;
    setPose(g, round ? poses[i] : { cx: p.obb.cx, cy: p.obb.cy, angle: p.obb.angle });
    p.moved = false;                   // part of the table choice, not a move
  });
  api.dirtyShadows();
}
const b64 = { enc: (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
              dec: (s) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))) };
let undoStack = [], redoStack = [], current = null;
function writeHash() {
  const s = serialize(), url = location.pathname + location.search + (Object.keys(s).length ? '#s=' + b64.enc(JSON.stringify(s)) : '');
  history.replaceState(null, '', url);
}
function commit() {
  const now = JSON.stringify(serialize());
  if (now === current) return refresh();
  if (current !== null) undoStack.push(current);
  redoStack = []; current = now;
  writeHash(); anchorAz = null; refresh();
}
function stepHistory(from, to) {
  if (!from.length) return;
  to.push(current); current = from.pop();
  applyState(JSON.parse(current)); writeHash(); refresh();
}
let pendingCommit = 0;
const commitSoon = () => { clearTimeout(pendingCommit); pendingCommit = setTimeout(commit, 450); };

// ------------------------------------------------------------------ picking
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), el = renderer.domElement;
const floorPlane = new THREE.Plane(new V3(0, 1, 0), 0);
function setRay(e) {
  const r = el.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
}
const floorAt = (e) => { setRay(e); return ray.ray.intersectPlane(floorPlane, new V3()); };
const shown = (o) => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
const pivotOf = (o) => { while (o && o.parent !== pieces) o = o.parent; return o; };
function pickPiece(e) {
  setRay(e);
  const h = ray.intersectObject(pieces, true).find(h => h.object.isMesh && shown(h.object));
  return h ? pivotOf(h.object) : null;
}
function pickSurface(e) {
  setRay(e);
  const objs = [api.activeShell(), pieces, api.models, ...scene.children.filter(o => o.userData.cladding)];
  const h = ray.intersectObjects(objs, true).find(h => h.object.isMesh && h.face && shown(h.object));
  if (!h) return null;
  if (h.object.userData.model) return { locked: `Finishes in ${h.object.userData.model.name} are fixed` };
  const mat = Array.isArray(h.object.material) ? h.object.material[h.face.materialIndex] : h.object.material;
  if (LOCKED.has(mat)) return { locked: 'Finishes in Toilet 3 are fixed' };
  return { slot: MAT2SLOT.get(mat) || null, pivot: pivotOf(h.object), point: h.point };
}
const overCanvas = (e) => document.elementFromPoint(e.clientX, e.clientY) === el;

// ------------------------------------------------------------------ selection
const outline = new THREE.LineLoop(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xC9A227, depthTest: false, transparent: true }));
outline.renderOrder = 20; outline.visible = false; outline.frustumCulled = false; scene.add(outline);
function drawOutline(p, q, ok = true) {
  outline.geometry.setFromPoints(corners(q, p.obb.w + 0.1, p.obb.d + 0.1).map(([x, y]) => W(x, y).setY(0.025)));
  outline.material.color.setHex(ok ? 0xC9A227 : 0xD2553F);
  outline.visible = true;
  api.wake();
}
let sel = null;           // { pivot } or { slot }
let glowSlot = null;
function highlight(slot) {
  if (glowSlot) { const m = M[SLOTS[glowSlot].mat]; m.emissive.setHex(0); m.emissiveIntensity = 1; }
  glowSlot = slot;
  api.wake();
}
api.frameHooks.push(() => {
  if (sel?.pivot && !shown(sel.pivot)) deselect();       // its room was closed
  if (!glowSlot) return;
  const m = M[SLOTS[glowSlot].mat];
  m.emissive.setHex(0xC9A227); m.emissiveIntensity = 0.1 + 0.07 * Math.sin(performance.now() / 180);
  return true;                                            // keep drawing while it pulses
});
function selectPiece(g) {
  sel = { pivot: g }; highlight(null);
  drawOutline(g.userData.piece, pose(g.userData.piece));
  showCard(); refresh();
}
function selectSlot(slot, point = null) {
  sel = { slot, point }; outline.visible = false; highlight(slot);
  const cats = SLOTS[slot].cats;
  if (!cats.includes(tab)) setTab(cats[0]); else renderTray();
  hideCard(); refresh();
  toast(`${SLOTS[slot].name}: pick a ${cats.join(' or ')} sample below, or drag one onto it`);
}
function deselect() { sel = null; outline.visible = false; highlight(null); hideCard(); renderTray(); refresh(); api.wake(); }

function turn(g, deg) {
  const p = g.userData.piece, q0 = pose(p), q = { ...q0, angle: q0.angle + THREE.MathUtils.degToRad(deg) };
  if (!fits(p, q)) return toast('No room to turn it there');
  setPose(g, q); drawOutline(p, q); api.dirtyShadows(); commitSoon(); showCard();
}
function putBack(g) {
  const p = g.userData.piece;
  const q = { cx: p.obb.cx, cy: p.obb.cy, angle: p.obb.angle };
  setPose(g, q); g.userData.removed = false; refreshVisibility();
  drawOutline(p, q); api.dirtyShadows(); commit(); showCard();
}
function takeOut(g) {
  const p = g.userData.piece;
  if (p.added) dropAdded(g); else { g.userData.removed = true; g.visible = false; }
  if (p.type === 'floor_lamp') relight();
  deselect(); api.dirtyShadows(); commit();
  toast(p.added ? `${p.name} removed` : `${p.name} taken out. Reset furniture brings it back`);
}

// ------------------------------------------------------------------ canvas: drag furniture
let drag = null;
el.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  const g = pickPiece(e);
  if (g && g.userData.piece.movable) {
    controls.enabled = false;                // capture phase: runs before the orbit controls
    const f = floorAt(e) || g.position.clone();
    drag = { g, p: g.userData.piece, start: { ...pose(g.userData.piece) }, x0: e.clientX, y0: e.clientY, moved: false,
             off: f.clone().sub(g.position), turn: 0 };
    try { el.setPointerCapture(e.pointerId); } catch {}
  } else drag = { none: true, x0: e.clientX, y0: e.clientY };
}, true);
el.addEventListener('pointermove', (e) => {
  if (drag?.g) {
    if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 4) return;
    if (!drag.moved) { drag.moved = true; sel = { pivot: drag.g }; hideCard(); highlight(null); }
    api.tip.hidden = true; el.style.cursor = 'grabbing';
    moveTo(drag, floorAt(e));
    return;
  }
  if (!drag) el.style.cursor = pickPiece(e)?.userData.piece.movable ? 'grab' : '';
}, true);
function moveTo(d, f) {
  if (!f) return;
  const raw = f.sub(d.off), rx = raw.x + CX, ry = CY - raw.z, st = d.start;
  const q = { cx: st.cx + Math.round((rx - st.cx) / 0.1) * 0.1, cy: st.cy + Math.round((ry - st.cy) / 0.1) * 0.1,
              angle: st.angle + THREE.MathUtils.degToRad(d.turn) };
  const ok = fits(d.p, q);
  if (ok) { setPose(d.g, q); d.ok = true; api.dirtyShadows(); }
  drawOutline(d.p, q, ok);
  d.lastF = f.add(d.off);
}
el.addEventListener('wheel', (e) => {
  if (!drag?.g || !drag.moved) return;
  e.preventDefault(); e.stopImmediatePropagation();
  drag.turn += Math.sign(e.deltaY) * 15;
  moveTo(drag, drag.lastF?.clone());
}, { capture: true, passive: false });
el.addEventListener('pointerup', (e) => {
  const d = drag; drag = null;
  controls.enabled = true; el.style.cursor = '';
  if (!d) return;
  if (d.g) {
    try { el.releasePointerCapture(e.pointerId); } catch {}
    if (d.moved) { drawOutline(d.p, pose(d.p)); if (d.p.added) d.p.home = d.g.userData.home; commit(); selectPiece(d.g); }
    else if (api.focused) selectPiece(d.g);
    return;
  }
  // a plain click on a surface, in a single-room view, picks it for a sample
  if (!api.focused || Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > 5) return;
  const s = pickSurface(e);
  if (!s) return deselect();
  if (s.locked) { deselect(); return toast(s.locked); }
  if (s.slot) selectSlot(s.slot, s.point); else deselect();
}, true);

// ------------------------------------------------------------------ the interface
const $ = (sel, root = document) => root.querySelector(sel);
const ui = document.createElement('div'); ui.id = 'ui';
const ICON = {
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
  redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>',
  save: '<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  hide: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14"/><path d="M12 17h.01"/>',
  sunrise: '<path d="M12 3v3"/><path d="m5.6 8.6 1.4 1.4"/><path d="m18.4 8.6-1.4 1.4"/><path d="M3 16h18"/><path d="M7 16a5 5 0 0 1 10 0"/><path d="M8 20h8"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  lamp: '<path d="M8 3h8l3 8H5l3-8Z"/><path d="M12 11v8"/><path d="M8 21h8"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>',
  curtains: '<path d="M5 3v18M19 3v18M5 5h14"/><path d="M6 5c4 3 4 11 0 14M18 5c-4 3-4 11 0 14"/>',
};
const icon = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICON[k]}</svg>`;
ui.innerHTML = `
  <section class="panel mood">
    <div class="presets">${PRESETS.map((p, i) => `<button class="preset" data-p="${p.id}" title="Key ${i + 1}">
      <span class="chips">${['walls', 'floor', 'upholstery', 'accent'].map(k => `<i style="background:#${new THREE.Color(SAMPLE[p.f[k]].c).getHexString()}"></i>`).join('')}</span>
      <b>${p.name}</b><small>${p.sub}</small></button>`).join('')}</div>
    <div class="meter">${['Cozy', 'Bright', 'Moody'].map(n => `<div class="m"><small>${n}</small><b>0%</b><span><i></i></span></div>`).join('')}</div>
    <p class="read"></p>
    <button class="layout-reset" hidden>Reset furniture</button>
  </section>
  <nav class="tools">
    <button data-t="undo" title="Undo (⌘Z)">${icon('undo')}</button><button data-t="redo" title="Redo (⇧⌘Z)">${icon('redo')}</button>
    <span></span>
    <button data-t="save" title="Save an image">${icon('save')}</button><button data-t="link" title="Copy a link to this setup">${icon('link')}</button>
    <button data-t="hide" title="Show or hide the moodboard (N)">${icon('hide')}</button><button data-t="reset" title="Reset the view (R)">${icon('reset')}</button>
    <button data-t="help" title="How it works (?)">${icon('help')}</button>
  </nav>
  <section class="panel daylight">
    <header><small>Daylight</small><b class="clock"></b></header>
    <div class="times">${TIMES.map(([n, t, ic]) => `<button data-time="${t}">${icon(ic)}<span><b>${n}</b><small>${clock(t)}</small></span></button>`).join('')}</div>
    <input type="range" min="6" max="22" step="0.05" aria-label="Time of day">
    <button class="curtain-toggle" hidden>${icon('curtains')}<span><b>Open curtains</b><small>More daylight</small></span></button>
    <p class="fine">Sun path for Delhi, approximate. Drag the sun along its arc.</p>
  </section>
  <section class="panel dock">
    <div class="tabs">${CATS.map(([k, n]) => `<button data-cat="${k}">${n}</button>`).join('')}<span class="sep"></span><button data-cat="furniture">Furniture</button><button data-cat="products">Products</button>
      <span class="target" hidden><span></span><button title="Clear">×</button></span></div>
    <div class="tray"></div>
  </section>
  <div class="panel card" hidden><div class="who"><b></b></div>
    <button data-c="turn">Turn</button><button data-c="back">Put back</button><button data-c="out">Take out</button></div>
  <div class="toast" hidden></div>
  <dialog class="help">
    <button class="x" title="Close">×</button>
    <h2>Play with the flat</h2>
    <p>Try finishes, move the furniture and watch the light change through the day. Nothing here is permanent: undo, or reset the furniture, at any time.</p>
    <h3>Finishes</h3>
    <p>Drag a sample from the tray onto a surface and it previews in place; let go to keep it. Or open a room, click a surface, then click a sample. Wood goes on floors, woodwork, fronts and doors; stone on floors, walls and worktops; paint on walls, fronts and doors; fabric on upholstery, cushions and rugs.</p>
    <h3>Furniture</h3>
    <p>Drag any loose piece to move it. It snaps in 10 cm steps and will not go into a wall, another piece or the bedrooms. Scroll while dragging to turn it. Click a piece for Turn, Put back and Take out. The Furniture tab adds pieces: click one to drop it in view, or drag it into a room. Kitchen units, wardrobes and bathroom fittings are fixed.</p>
    <h3>Light</h3>
    <p>The sun follows its path over Delhi through the day. Move the slider or pick a time. After dark the flat gets a warm evening light, and any floor lamp you added switches on.</p>
    <h3>Mood</h3>
    <p>The meter reads the room as you change it: pale surfaces and high sun read bright, warm soft materials and low gold light read cozy, dark surfaces and night read moody. A rule of thumb, not a science.</p>
    <h3>Keys</h3>
    <p class="keys">1-4 presets · [ ] move the sun · N show the moodboard · , . turn the selected piece · Delete take it out · ⌘Z undo · / hide the interface · R reset the view · Esc deselect</p>
  </dialog>`;
document.body.appendChild(ui);

let tab = 'wood';
let thumbsStarted = false;
function setTab(k) {
  tab = k;
  if (k === 'furniture' && !thumbsStarted) { thumbsStarted = true; setTimeout(makeThumbs, 50); }
  ui.querySelectorAll('.tabs [data-cat]').forEach(b => b.classList.toggle('on', b.dataset.cat === k));
  renderTray();
}
ui.querySelectorAll('.tabs [data-cat]').forEach(b => b.onclick = () => { if (!b.classList.contains('off')) setTab(b.dataset.cat); });
$('.target button', ui).onclick = () => deselect();

const swatchImg = new Map();
function swatchFor(s) {
  if (!swatchImg.has(s.id)) swatchImg.set(s.id, swatchURL(finishFor(s, FIRST_SLOT[s.cat]).map, 112));
  return swatchImg.get(s.id);
}
function renderTray() {
  const tray = $('.tray', ui);
  tray.innerHTML = '';
  if (tab === 'products') return renderProducts(tray);
  if (tab === 'furniture') {
    for (const c of CATALOGUE) {
      const b = document.createElement('button');
      b.className = 'item'; b.dataset.type = c.type;
      b.innerHTML = `<span class="pic">${c.thumb ? `<img src="${c.thumb}" alt="">` : ''}</span><small>${c.name}</small>`;
      wireCatalogue(b, c);
      tray.appendChild(b);
    }
    return;
  }
  const destination = sel?.slot || FIRST_SLOT[tab];
  const list = SAMPLES.filter(s => s.cat === tab && allowedOn(destination, s.id));
  list.forEach((s, i) => {
    const b = document.createElement('button');
    b.className = 'sw'; b.dataset.id = s.id;
    b.innerHTML = `<span class="pic"></span><small>${s.name}</small>`;
    wireSample(b, s);
    tray.appendChild(b);
    // generating a finish takes a moment; do them one after another so the page stays smooth
    setTimeout(() => { $('.pic', b).style.backgroundImage = `url(${swatchFor(s)})`; }, 30 * i);
  });
  refresh();
}

// samples: click to apply to the selected surface, or drag onto any surface
function applySample(id, slot) {
  const s = SAMPLE[id];
  if (!SLOTS[slot].cats.includes(s.cat)) return toast(`${SLOTS[slot].name} take ${SLOTS[slot].cats.join(' or ')}, not ${s.cat}`);
  if (!allowedOn(slot, id)) return toast(`${s.name} is not offered for ${SLOTS[slot].the}`);
  applyFinish(slot, id, sel?.slot === slot ? sel.point : null); commit();
  toast(`${s.name} on ${SLOTS[slot].the}`);
}
function wireSample(b, s) {
  let d = null;
  b.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch {}
    d = { x0: e.clientX, y0: e.clientY, moved: false, slot: null, prev: null, ghost: null };
  });
  b.addEventListener('pointermove', (e) => {
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 5) return;
    if (!d.moved) {
      d.moved = true;
      d.ghost = document.createElement('div'); d.ghost.className = 'ghost';
      d.ghost.style.backgroundImage = `url(${swatchFor(s)})`; document.body.appendChild(d.ghost);
    }
    d.ghost.style.transform = `translate(${e.clientX - 28}px, ${e.clientY - 28}px)`;
    const ok = (slot) => slot && SLOTS[slot].cats.includes(s.cat) && allowedOn(slot, s.id);
    let slot = null, point = null;
    const card = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('.mb-card');
    if (card && ok(card.dataset.slot)) { slot = card.dataset.slot; point = boardAnchor(slot); }
    else if (overCanvas(e)) { const h = pickSurface(e); if (ok(h?.slot)) { slot = h.slot; point = h.point; } }
    d.ghost.classList.toggle('ok', !!slot);
    if (slot === d.slot) { if (d.patch && point && !card) d.patch.u.uCenter.value.copy(point); api.wake(); return; }
    if (d.slot) { setSlot(d.slot, d.prev); stopSpread(d.slot); }        // take the previous preview off
    d.slot = slot; d.point = point; d.patch = null; highlight(slot);
    if (slot) {
      d.prev = state.f[slot];
      const oldMap = M[SLOTS[slot].mat].map;
      setSlot(slot, s.id);
      // over the room: a patch of the sample under the pointer; over a card: the whole surface
      if (!card) d.patch = startSpread(slot, oldMap, point, { r0: 0.55, hold: true });
    }
  });
  const end = () => {
    if (!d) return;
    const dd = d; d = null; dd.ghost?.remove(); highlight(sel?.slot || null);
    if (!dd.moved) return applySample(s.id, sel?.slot && SLOTS[sel.slot].cats.includes(s.cat) ? sel.slot : FIRST_SLOT[s.cat]);
    if (dd.slot) {
      if (dd.patch) releaseSpread(dd.patch);
      commit(); toast(`${s.name} on ${SLOTS[dd.slot].the}`);
    }
  };
  b.addEventListener('pointerup', end);
  b.addEventListener('pointercancel', () => { if (d?.slot) { setSlot(d.slot, d.prev); stopSpread(d.slot); } end(); });
}

// catalogue: click to drop a piece into view, or drag it into a room
function freeSpotNear(p, cx, cy) {
  for (let r = 0; r <= 3.5; r += 0.1) {
    const n = Math.max(1, Math.round(2 * Math.PI * r / 0.1));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, q = { cx: cx + Math.cos(a) * r, cy: cy + Math.sin(a) * r, angle: 0 };
      if (fits(p, q)) return q;
    }
  }
  return null;
}
function wireCatalogue(b, c) {
  let d = null;
  b.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch {}
    d = { x0: e.clientX, y0: e.clientY, moved: false, g: null, ok: false };
  });
  b.addEventListener('pointermove', (e) => {
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 5) return;
    d.moved = true;
    if (!overCanvas(e)) return;
    const f = floorAt(e);
    if (!f) return;
    const cx = f.x + CX, cy = CY - f.z;
    if (!d.g) { d.g = addPiece(c.type, { cx, cy, angle: 0 }); d.g.visible = true; d.drag = { g: d.g, p: d.g.userData.piece, start: { cx, cy, angle: 0 }, off: new V3(), turn: 0 }; }
    moveTo(d.drag, f); d.ok = d.ok || d.drag.ok;
  });
  b.addEventListener('pointerup', () => {
    if (!d) return;
    const dd = d; d = null;
    if (!dd.moved) return addInView(c);
    if (!dd.g) return;
    if (!dd.ok) { dropAdded(dd.g); outline.visible = false; if (c.type === 'floor_lamp') relight(); return toast('It needs free floor in an open room'); }
    const p = dd.g.userData.piece; p.home = dd.g.userData.home;
    refreshVisibility(); commit(); selectPiece(dd.g); toast(`${c.name} added`);
  });
}
function addInView(c) {
  const t = controls.target, probe = { obb: { w: c.w, d: c.d }, type: c.type, id: 'probe' };
  const q = freeSpotNear(probe, t.x + CX, CY - t.z);
  if (!q) return toast('No free floor near the middle of the view');
  const g = addPiece(c.type, q); refreshVisibility(); api.dirtyShadows(); commit(); selectPiece(g);
  toast(`${c.name} added`);
}

// the card for a selected piece
const card = $('.card', ui);
function showCard() {
  const g = sel?.pivot; if (!g) return hideCard();
  const p = g.userData.piece;
  $('.who b', card).textContent = p.name;
  card.querySelector('[data-c="back"]').hidden = !p.moved;
  card.hidden = false;
}
function hideCard() { card.hidden = true; }
card.querySelector('[data-c="turn"]').onclick = () => sel?.pivot && turn(sel.pivot, 90);
card.querySelector('[data-c="back"]').onclick = () => sel?.pivot && putBack(sel.pivot);
card.querySelector('[data-c="out"]').onclick = () => sel?.pivot && takeOut(sel.pivot);

// presets, daylight, tools
ui.querySelectorAll('.preset').forEach(b => b.onclick = () => applyPreset(PRESETS.find(p => p.id === b.dataset.p)));
function applyPreset(p) {
  const c = controls.target.clone().setY(0);
  for (const k in SLOTS) { const id = p.f[k] || DEFAULTS[k]; if (state.f[k] !== id) applyFinish(k, id, c); }
  refresh(); animateTime(p.t);
}
const range = $('.daylight input', ui);
range.oninput = () => { timeAnim = null; state.t = +range.value; relight(); refresh(); };
range.onchange = () => commit();
ui.querySelectorAll('[data-time]').forEach(b => b.onclick = () => animateTime(+b.dataset.time));
const curtainBtn = $('.curtain-toggle', ui);
function refreshCurtains() {
  const rid = api.focused?.id;
  const rooms = rid ? (api.hasCurtains(rid) ? [rid] : []) : api.curtainRooms();
  curtainBtn.hidden = !rooms.length;
  if (!rooms.length) return;
  const open = rooms.every(id => !!state.c[id]);
  curtainBtn.setAttribute('aria-pressed', String(open));
  $('b', curtainBtn).textContent = open ? (rid ? 'Restore curtains' : 'Restore all curtains') : (rid ? 'Open curtains' : 'Open all curtains');
  $('small', curtainBtn).textContent = open ? 'Show the designed dressing' : 'Let in more daylight';
  curtainBtn.classList.toggle('on', open);
}
curtainBtn.onclick = () => {
  const rid = api.focused?.id;
  const rooms = rid ? (api.hasCurtains(rid) ? [rid] : []) : api.curtainRooms();
  if (!rooms.length) return;
  const open = !rooms.every(id => !!state.c[id]);
  for (const id of rooms) { state.c[id] = open; api.setCurtainsOpen(id, open); }
  refreshCurtains(); commit();
  toast(open ? (rid ? 'Curtains opened for this room' : 'Curtains opened across the flat') : (rid ? 'Curtains restored' : 'Curtains restored across the flat'));
};
api.focusHooks.push(refreshCurtains);
addEventListener('b34-curtains-ready', refreshCurtains);
$('.layout-reset', ui).onclick = () => {
  for (const g of [...pieceGroups]) if (g.userData.piece.added) dropAdded(g);
  for (const g of pieceGroups) { const p = g.userData.piece; setPose(g, { cx: p.obb.cx, cy: p.obb.cy, angle: p.obb.angle }); g.userData.removed = false; }
  refreshVisibility(); deselect(); relight(); commit(); toast('Furniture reset');
};
const help = $('dialog.help', ui);
$('.x', help).onclick = () => help.close();
const TOOL = {
  undo: () => stepHistory(undoStack, redoStack),
  redo: () => stepHistory(redoStack, undoStack),
  save: () => {
    outline.visible = false; highlight(null);
    api.composer.render();
    const a = document.createElement('a');
    a.download = 'B-34-flat.png'; a.href = el.toDataURL('image/png'); a.click();
    if (sel?.pivot) drawOutline(sel.pivot.userData.piece, pose(sel.pivot.userData.piece));
    if (sel?.slot) highlight(sel.slot);
  },
  link: async () => { try { await navigator.clipboard.writeText(location.href); toast('Link copied. It opens this exact setup'); } catch { toast('Copy the address bar: it holds this setup'); } },
  hide: () => document.body.classList.toggle('clean'),
  board: () => { document.body.classList.toggle('no-board'); api.wake(); },
  reset: () => api.resetView(),
  help: () => help.showModal(),
};
ui.querySelectorAll('.tools [data-t]').forEach(b => b.onclick = () => TOOL[b.dataset.t === 'hide' ? 'board' : b.dataset.t]());

addEventListener('keydown', (e) => {
  if (e.target.closest?.('input[type=text], textarea') || help.open) return;
  const k = e.key;
  if ((e.metaKey || e.ctrlKey) && k.toLowerCase() === 'z') { e.preventDefault(); TOOL[e.shiftKey ? 'redo' : 'undo'](); return; }
  if (k === 'Escape' && sel) { e.stopImmediatePropagation(); deselect(); return; }
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (k >= '1' && k <= '4') applyPreset(PRESETS[+k - 1]);
  else if (k === '[' || k === ']') animateTime(Math.min(22, Math.max(6, (timeAnim?.to ?? state.t) + (k === ']' ? 0.5 : -0.5))), 450);
  else if (k === 'n' || k === 'N') TOOL.board();
  else if ((k === ',' || k === '.') && sel?.pivot) turn(sel.pivot, k === '.' ? 15 : -15);
  else if ((k === 'Delete' || k === 'Backspace') && sel?.pivot) takeOut(sel.pivot);
  else if (k === '/') TOOL.hide();
  else if (k === 'r' || k === 'R') TOOL.reset();
  else if (k === '?') TOOL.help();
}, true);

let toastT = 0;
function toast(msg) {
  const t = $('.toast', ui);
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2600);
}

function refresh() {
  refreshBoard();
  const pct = meter();
  ui.querySelectorAll('.meter .m').forEach((m, i) => { $('b', m).textContent = pct[i] + '%'; $('span i', m).style.width = pct[i] + '%'; });
  $('.read', ui).innerHTML = reading(pct);
  const used = new Set(Object.values(state.f));
  ui.querySelectorAll('.sw').forEach(b => {
    b.classList.toggle('used', used.has(b.dataset.id));
    b.title = Object.entries(state.f).filter(([, v]) => v === b.dataset.id).map(([k]) => SLOTS[k].name).join(', ');
  });
  for (const b of ui.querySelectorAll('.preset')) {
    const p = PRESETS.find(q => q.id === b.dataset.p);
    b.classList.toggle('on', Object.keys(SLOTS).every(k => state.f[k] === p.f[k]) && Math.abs(state.t - p.t) < 0.3);
  }
  $('.clock', ui).textContent = clock(state.t);
  range.value = state.t;
  ui.querySelectorAll('[data-time]').forEach(b => b.classList.toggle('on', Math.abs(+b.dataset.time - state.t) < 0.3));
  $('[data-t="undo"]', ui).disabled = !undoStack.length;
  $('[data-t="redo"]', ui).disabled = !redoStack.length;
  const changed = pieceGroups.filter(g => g.userData.piece.added || g.userData.piece.moved || g.userData.removed).length;
  const lr = $('.layout-reset', ui);
  lr.hidden = !changed; lr.textContent = `Reset furniture (${changed} changed)`;
  const cats = sel?.slot ? SLOTS[sel.slot].cats : null;
  ui.querySelectorAll('.tabs [data-cat]').forEach(b => b.classList.toggle('off', !!cats && !cats.includes(b.dataset.cat)));
  const tg = $('.target', ui);
  tg.hidden = !sel?.slot;
  if (sel?.slot) $('span', tg).textContent = `for ${SLOTS[sel.slot].the}`;
  if (sel?.pivot && !card.hidden) showCard();
  refreshCurtains();
}

// ------------------------------------------------------------------ motion: finishes spread
// A new finish spreads across its surface from where it landed, the way Ryan Sael's
// room does it: each swappable material keeps the previous map for a moment, and a
// front growing from the drop point reveals the new one behind a soft warm edge.
// While a sample is held over a surface, a patch of it shows under the pointer.
const spreads = [];
function spreadable(m) {
  if (m.userData.spread) return m.userData.spread;
  const u = { uOld: { value: null }, uOldT: { value: new THREE.Matrix3() }, uCenter: { value: new V3() },
              uR: { value: 0 }, uOn: { value: 0 } };
  m.userData.spread = u;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = 'varying vec3 vSpreadW;\nvarying vec2 vSpreadUv;\n' + sh.vertexShader
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSpreadUv = uv;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvSpreadW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = 'uniform sampler2D uOld;\nuniform mat3 uOldT;\nuniform vec3 uCenter;\nuniform float uR;\nuniform float uOn;\nvarying vec3 vSpreadW;\nvarying vec2 vSpreadUv;\n'
      + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      if (uOn > 0.5) {
        float k = smoothstep(uR - 0.2, uR, distance(vSpreadW, uCenter));
        vec3 prev = texture2D(uOld, (uOldT * vec3(vSpreadUv, 1.0)).xy).rgb;
        diffuseColor.rgb = mix(diffuseColor.rgb, prev, k) + vec3(1.0, 0.8, 0.45) * (1.0 - abs(k * 2.0 - 1.0)) * 0.3;
      }`);
  };
  m.customProgramCacheKey = () => 'spread';
  m.needsUpdate = true;
  return u;
}
function startSpread(slot, oldMap, center, { r0 = 0, hold = false } = {}) {
  const m = M[SLOTS[slot].mat], u = spreadable(m);
  stopSpread(slot);
  if (!oldMap || oldMap === m.map || !center) return null;
  oldMap.updateMatrix();
  u.uOld.value = oldMap; u.uOldT.value.copy(oldMap.matrix); u.uCenter.value.copy(center);
  u.uR.value = r0; u.uOn.value = 1;
  const sp = { slot, u, r0, t0: performance.now(), dur: api.focused ? 1150 : 1700, rMax: api.focused ? 10 : 26 };
  if (!hold) spreads.push(sp);
  api.wake();
  return sp;
}
function releaseSpread(sp) { sp.t0 = performance.now(); spreads.push(sp); api.wake(); }
function stopSpread(slot) {
  const u = M[SLOTS[slot].mat].userData.spread;
  if (!u) return;
  u.uOn.value = 0; u.uOld.value = null;
  for (let i = spreads.length - 1; i >= 0; i--) if (spreads[i].slot === slot) spreads.splice(i, 1);
  api.wake();
}
function applyFinish(slot, id, center) {
  const oldMap = M[SLOTS[slot].mat].map;
  setSlot(slot, id);
  startSpread(slot, oldMap, center || controls.target.clone().setY(0));
}
api.frameHooks.push(() => {
  if (!spreads.length) return;
  const now = performance.now();
  for (let i = spreads.length - 1; i >= 0; i--) {
    const sp = spreads[i], k = Math.min(1, (now - sp.t0) / sp.dur), e = 1 - Math.pow(1 - k, 3);
    sp.u.uR.value = sp.r0 + (sp.rMax - sp.r0) * e;
    if (k >= 1) { sp.u.uOn.value = 0; sp.u.uOld.value = null; spreads.splice(i, 1); }
  }
  return true;
});

// ------------------------------------------------------------------ motion: time travels
// Picking a time moves the sun along its arc to it, with the light's colour and
// strength following, instead of jumping there.
let timeAnim = null;
const easeIO = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
function animateTime(to, dur) {
  const from = state.t;
  if (Math.abs(to - from) < 0.01) { timeAnim = null; commit(); return; }
  timeAnim = { from, to, t0: performance.now(), dur: dur ?? Math.min(2400, 800 + Math.abs(to - from) * 150) };
  api.wake();
}
api.frameHooks.push(() => {
  if (!timeAnim) return;
  const k = Math.min(1, (performance.now() - timeAnim.t0) / timeAnim.dur);
  state.t = timeAnim.from + (timeAnim.to - timeAnim.from) * easeIO(k);
  relight(); refresh();
  if (k >= 1) { timeAnim = null; commit(); }
  return true;
});

// ------------------------------------------------------------------ the sun's arc
// The day's path of the sun drawn over the model, rising and setting where it really
// does for Delhi. The sun (or after dark the moon, which rides the same path twelve
// hours behind at this season) sits on it and can be dragged along it.
const SVGNS = 'http://www.w3.org/2000/svg', RISE = NOON - 6, SET = NOON + 6;
const sky = document.createElementNS(SVGNS, 'svg');
sky.setAttribute('class', 'sky');
sky.innerHTML = '<g class="links"></g><path class="arc"/><g class="ticks"></g>'
  + '<g class="orb"><circle class="halo" r="24"/><circle class="disc" r="9"/></g>';
ui.prepend(sky);
const orb = sky.querySelector('.orb');
const ringStats = (ring) => {
  let x = 0, y = 0; for (const [a, b] of ring) { x += a; y += b; } x /= ring.length; y /= ring.length;
  return { c: W(x, y), R: Math.max(...ring.map(([a, b]) => Math.hypot(a - x, b - y))) };
};
// Seen from this camera the sun's true path runs nearly edge-on (it would draw as a
// line through the flat), so the arc is drawn as an arch over the model on screen.
// Sunrise sits on the side where east actually is in the current view; the light
// itself always comes from the true direction.
function toScreen(v) {
  const q = v.clone().project(camera), r = el.getBoundingClientRect();
  return [r.left + (q.x * 0.5 + 0.5) * r.width, r.top + (-q.y * 0.5 + 0.5) * r.height];
}
function skyArc() {
  const f = api.focused, ring = f ? f.island : zone.zone, { c, R } = ringStats(ring);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [a, b] of ring) for (const h of [0, CUT]) {
    const [x, y] = toScreen(W(a, b).setY(h));
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  const [ex] = toScreen(c.clone().add(new V3(...(([px, py]) => [px, 0, -py])(planDir(Math.PI / 2))).multiplyScalar(R)));
  const [wx] = toScreen(c.clone().add(new V3(...(([px, py]) => [px, 0, -py])(planDir(-Math.PI / 2))).multiplyScalar(R)));
  const top = Math.max(140, y0 - 36), base = y0 + (y1 - y0) * 0.42;
  return { cx: (x0 + x1) / 2, cy: base, rx: (x1 - x0) * 0.56, ry: Math.max(60, base - top), eastRight: ex > wx };
}
function arcAt(t, A) {                       // screen point for a time between sunrise and sunset
  const u = Math.min(1, Math.max(0, (t - RISE) / (SET - RISE))), a = Math.PI * (A.eastRight ? u : 1 - u);
  return [A.cx + Math.cos(a) * A.rx, A.cy - Math.sin(a) * A.ry];
}
let sunDrag = null;
orb.addEventListener('pointerdown', (e) => {
  e.preventDefault(); e.stopPropagation();
  try { orb.setPointerCapture(e.pointerId); } catch {}
  sunDrag = { moon: state.t > SET }; timeAnim = null;
  document.body.classList.add('sun-live');
});
// the arc is only drawn while the sun is in hand (or the pointer rests on it)
orb.addEventListener('pointerenter', () => document.body.classList.add('sun-live'));
orb.addEventListener('pointerleave', () => { if (!sunDrag) document.body.classList.remove('sun-live'); });
orb.addEventListener('pointermove', (e) => {
  if (!sunDrag) return;
  const A = skyArc();
  let best = RISE, bd = Infinity;
  for (let t = RISE; t <= SET; t += 0.05) {
    const [x, y] = arcAt(t, A), d = Math.hypot(x - e.clientX, y - e.clientY);
    if (d < bd) { bd = d; best = t; }
  }
  state.t = sunDrag.moon ? Math.min(22, Math.max(SET, best + 12)) : best;
  relight(); refresh();
});
const endSunDrag = () => { if (sunDrag) { sunDrag = null; document.body.classList.remove('sun-live'); commit(); } };
orb.addEventListener('pointerup', endSunDrag);
orb.addEventListener('pointercancel', endSunDrag);

// ------------------------------------------------------------------ the moodboard
// A card per surface, floating over the model, each tied by a thread to where that
// finish is in the room: what the room is made of, at a glance. Click a card to pick
// the surface; drop a sample on a card to put it there.
const BOARD = ['walls', 'floor', 'upholstery', 'woodwork', 'joinery', 'worktop'];
const board = document.createElement('div');
board.className = 'board';
board.innerHTML = BOARD.map(k => `<button class="mb-card" data-slot="${k}"><span class="pic"></span><b></b><small>${SLOTS[k].name}</small></button>`).join('');
ui.prepend(board);
board.querySelectorAll('.mb-card').forEach(c => {
  const slot = c.dataset.slot;
  c.onclick = () => selectSlot(slot, boardAnchor(slot));
  c.onpointerenter = () => { if (!sel?.slot) highlight(slot); };
  c.onpointerleave = () => { if (!sel?.slot) highlight(null); };
});
let anchors = {}, anchorAz = null, anchorKey = '';
function computeAnchors() {
  const tgt = controls.target, toward = new V3().subVectors(tgt, camera.position).setY(0).normalize();
  const best = {}, box = new THREE.Box3(), c = new V3();
  const offer = (slot, pt, score) => { if (!best[slot] || score < best[slot].score) best[slot] = { pt, score }; };
  for (const root of [api.activeShell(), pieces]) root.traverse(o => {
    if (!o.isMesh || !shown(o)) return;
    const mats = [].concat(o.material);
    for (const slot of BOARD) {
      if (!mats.includes(M[SLOTS[slot].mat])) continue;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      box.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); box.getCenter(c);
      if (slot === 'floor') offer(slot, new V3(tgt.x, 0, tgt.z), 0);
      else if (slot === 'walls') {
        if (!o.userData.wall || o.scale.y < 0.99 || box.max.y < 2) continue;      // a full-height wall
        // the far side of the room faces the viewer
        offer(slot, new V3(c.x, 1.5, c.z), -c.clone().sub(tgt).setY(0).dot(toward) + 0.2 * c.distanceTo(tgt));
      } else offer(slot, new V3(c.x, box.max.y, c.z), c.distanceTo(tgt));
    }
  });
  anchors = Object.fromEntries(Object.entries(best).map(([k, v]) => [k, v.pt]));
}
function boardAnchor(slot) { return anchors[slot] || controls.target.clone().setY(0); }
function refreshBoard() {
  board.querySelectorAll('.mb-card').forEach(c => {
    const slot = c.dataset.slot, s = SAMPLE[state.f[slot]];
    if (c.dataset.id !== s.id) { c.dataset.id = s.id; $('.pic', c).style.backgroundImage = `url(${swatchFor(s)})`; $('b', c).textContent = s.name; }
    c.classList.toggle('on', sel?.slot === slot);
  });
  anchorKey = '';                    // re-lay on the next frame
}
api.focusHooks.push((f) => {
  document.body.classList.toggle('locked-room', !!(f && !f.members && f.model));
  anchorAz = null; anchorKey = '';
});
function layoutOverlay() {
  const rect = el.getBoundingClientRect();
  const az = Math.atan2(camera.position.x - controls.target.x, camera.position.z - controls.target.z);
  const key = [camera.position.x, camera.position.z, camera.position.y, camera.zoom, controls.target.x, controls.target.z,
               state.t, rect.width, rect.height, api.focused?.id, document.body.className].map(v => typeof v === 'number' ? v.toFixed(3) : v).join('|');
  if (key === anchorKey) return;
  sky.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);
  // the arc and its hour marks
  const A = skyArc(), pts = [];
  for (let t = RISE; t <= SET + 1e-6; t += 0.1) pts.push(arcAt(t, A));
  sky.querySelector('.arc').setAttribute('d', 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(' ')).join(' L'));
  const [rx, ry] = arcAt(RISE, A), [sx, sy] = arcAt(SET, A);
  sky.querySelector('.ticks').innerHTML = [8, 10, 12, 14, 16].map(h => { const [x, y] = arcAt(h + NOON - 12, A); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2"/>`; }).join('')
    + `<text x="${rx.toFixed(1)}" y="${(ry + 16).toFixed(1)}">${clock(RISE)}</text><text x="${sx.toFixed(1)}" y="${(sy + 16).toFixed(1)}">${clock(SET)}</text>`;
  const day = state.t >= RISE && state.t <= SET, moonT = state.t - 12, night = moonT >= RISE && moonT <= SET;
  orb.style.display = day || night ? '' : 'none';
  orb.classList.toggle('moon', !day);
  if (day || night) { const [x, y] = arcAt(day ? state.t : moonT, A); orb.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`); }
  // the board: recompute where each finish is when the view swings round
  if (anchorAz === null || Math.abs(Math.atan2(Math.sin(az - anchorAz), Math.cos(az - anchorAz))) > 0.4) { computeAnchors(); anchorAz = az; }
  const cards = [...board.children];
  const live = cards.filter(c => anchors[c.dataset.slot]).map(c => ({ c, p: toScreen(anchors[c.dataset.slot]) })).sort((a, b) => a.p[0] - b.p[0]);
  cards.forEach(c => { c.hidden = !anchors[c.dataset.slot]; });
  const title = document.querySelector('.title').getBoundingClientRect(), tools = $('.tools', ui).getBoundingClientRect();
  const x0 = Math.max(api.safe.left, title.right) + 18, x1 = Math.min(innerWidth - api.safe.right, tools.left) - 18;
  const CW = 84, step = Math.max(CW + 4, Math.min(104, (x1 - x0) / Math.max(1, live.length))), start = (x0 + x1) / 2 - (step * live.length) / 2;
  const lines = [];
  live.forEach(({ c, p }, i) => {
    const x = start + step * i + (step - CW) / 2, y = 16;
    c.style.transform = `translate(${x.toFixed(1)}px, ${y}px)`;
    lines.push(`<line x1="${(x + CW / 2).toFixed(1)}" y1="${y + 104}" x2="${p[0].toFixed(1)}" y2="${p[1].toFixed(1)}"/><circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.5"/>`);
  });
  sky.querySelector('.links').innerHTML = lines.join('');
  anchorKey = key;                   // only once everything above has succeeded
}
api.frameHooks.push(() => { layoutOverlay(); });
addEventListener('resize', () => { anchorKey = ''; anchorAz = null; });

// ------------------------------------------------------------------ products tab
// The choices for what is on screen: the dining set in the living space, the basin,
// shower and finish in a washroom, tiles on the balcony and in the master washroom.
const METAL = { chrome: '#D9DCDF', bronze: '#7E5C3E', black: '#1E1E1E', gold: '#C9A35C' };
const productThumbs = new Map();
function productPic(key, id) {
  const k = key.split('.')[0];
  if (k === 'finish') return `background:${METAL[id]}`;
  if (k === 't3walls' || k === 'balconyFloor' || k === 'balconyWall') {
    if (k === 't3walls' && id === 'marble') return `background-image:url(${swatchURL(M.tlt3wall.map, 112)})`;
    if (k === 'balconyFloor' && id === 'plain') return `background-image:url(${swatchURL(M.floor.map, 112)})`;
    if (k === 'balconyWall' && id === 'paint') return `background-image:url(${swatchURL(M.walls.map, 112)})`;
    const name = { geode: 'geode', emerald: 'emerald', patterned: 'encaustic', plain: 'plainGrey' }[id];
    return `background-image:url(${swatchURL(PR.tile(name).map, 112)})`;
  }
  const t = productThumbs.get(k + ':' + id);
  return t ? `background-image:url(${t})` : '';
}
function visibleGroups() {
  const f = api.focused, members = f ? (f.members || [f.id]) : null;
  return PR.GROUPS.filter(g => members ? g.rooms.some(r => members.includes(r)) : ['table', 'chair', 'balconyFloor', 'balconyWall'].includes(g.key));
}
function renderProducts(tray) {
  const groups = visibleGroups();
  if (!groups.length) { tray.innerHTML = '<p class="pnote">Nothing to choose in this room yet. Open the living space, a washroom or the balcony.</p>'; return; }
  for (const g of groups) {
    const box = document.createElement('div'); box.className = 'pgroup';
    box.innerHTML = `<small>${g.label}</small><div class="opts"></div>`;
    for (const o of g.options) {
      const b = document.createElement('button');
      b.className = 'popt' + ((state.p[g.key] || PR.DEFAULTS[g.key]) === o.id ? ' on' : '');
      b.innerHTML = `<span class="pic" style="${productPic(g.key, o.id)}"></span><b>${o.name}</b>${o.note ? `<small>${o.note}</small>` : ''}`;
      b.onclick = () => chooseProduct(g, o);
      box.querySelector('.opts').appendChild(b);
    }
    tray.appendChild(box);
  }
  if (!api.focused) tray.insertAdjacentHTML('beforeend', '<p class="pnote">Open a washroom for its basin, shower and finish.</p>');
  makeProductThumbs(groups);
}
function chooseProduct(g, o) {
  state.p[g.key] = o.id;
  PR.apply(state.p);
  if (g.key === 'table') arrangeChairs(JSON.parse(current || '{}').m || {});
  commit(); renderTray();
  toast(`${g.label}: ${o.name}`);
}
let thumbBusy = false;
async function makeProductThumbs(groups) {
  if (thumbBusy) return;
  const todo = groups.flatMap(g => g.options.map(o => [g.key, o.id])).filter(([k, id]) => {
    const kk = k.split('.')[0]; return ['table', 'chair', 'basin', 'shower'].includes(kk) && !productThumbs.has(kk + ':' + id);
  });
  if (!todo.length) return;
  thumbBusy = true;
  const tr = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  tr.setPixelRatio(2); tr.setSize(76, 60); tr.toneMapping = THREE.ACESFilmicToneMapping;
  const ts = new THREE.Scene();
  ts.add(new THREE.HemisphereLight(0xFFF4E6, 0x3A3028, 1.6));
  const dl = new THREE.DirectionalLight(0xFFFFFF, 2.4); dl.position.set(2, 4, 3); ts.add(dl);
  const cam = new THREE.PerspectiveCamera(26, 76 / 60, 0.05, 60);
  for (const [key, id] of todo) {
    const t = PR.thumbPiece(key, id); if (!t) continue;
    const g = t.build(t.p); ts.add(g);
    const box = new THREE.Box3().setFromObject(g), ctr = box.getCenter(new V3()), R = box.getSize(new V3()).length() / 2;
    cam.position.copy(ctr).add(new V3(0.85, 0.9, 1.15).normalize().multiplyScalar(R / Math.sin(THREE.MathUtils.degToRad(13)) * 0.92));
    cam.lookAt(ctr); tr.render(ts, cam);
    productThumbs.set(key.split('.')[0] + ':' + id, tr.domElement.toDataURL());
    ts.remove(g);
    await new Promise(r => setTimeout(r, 0));
  }
  tr.dispose(); tr.forceContextLoss();
  thumbBusy = false;
  if (tab === 'products') renderTray();
}
api.focusHooks.push(() => { if (tab === 'products') renderTray(); });

// ------------------------------------------------------------------ furniture thumbnails
// Each catalogue piece is rendered once, on a small separate renderer, then thrown away.
async function makeThumbs() {
  const tr = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  tr.setPixelRatio(2); tr.setSize(76, 60); tr.toneMapping = THREE.ACESFilmicToneMapping;
  const ts = new THREE.Scene();
  ts.add(new THREE.HemisphereLight(0xFFF4E6, 0x3A3028, 1.5));
  const dl = new THREE.DirectionalLight(0xFFFFFF, 2.4); dl.position.set(2, 4, 3); ts.add(dl);
  const cam = new THREE.PerspectiveCamera(26, 76 / 60, 0.05, 60);
  for (const c of CATALOGUE) {
    const o = { cx: CX, cy: CY, w: c.w, d: c.d, angle: 0 };
    const g = B[c.type]({ id: 'thumb-' + c.type, type: c.type, name: c.name, obb: o, footprint: rectRing(o), facing: null });
    ts.add(g);
    const box = new THREE.Box3().setFromObject(g), ctr = box.getCenter(new V3()), R = box.getSize(new V3()).length() / 2;
    cam.position.copy(ctr).add(new V3(0.85, 0.8, 1.15).normalize().multiplyScalar(R / Math.sin(THREE.MathUtils.degToRad(13)) * 0.92));
    cam.lookAt(ctr);
    tr.render(ts, cam);
    c.thumb = tr.domElement.toDataURL();
    ts.remove(g);
    const img = ui.querySelector(`.item[data-type="${c.type}"] .pic`);
    if (img) img.innerHTML = `<img src="${c.thumb}" alt="">`;
    await new Promise(r => setTimeout(r, 0));
  }
  tr.dispose(); tr.forceContextLoss();
}

// the camera frames each space into the screen the panels leave free
function measureSafe() {
  const w = innerWidth, h = innerHeight, r = (q) => { const e = $(q, ui); return e && getComputedStyle(e).display !== 'none' ? e.getBoundingClientRect() : null; };
  const mood = r('.mood'), day = r('.daylight'), dock = r('.dock');
  api.safe.left = mood ? mood.right * 0.85 : 20;
  api.safe.right = day ? (w - day.left) * 0.85 : 20;
  api.safe.top = 70;
  api.safe.bottom = dock ? h - dock.top + 10 : 20;
}
addEventListener('resize', () => { measureSafe(); });

// ------------------------------------------------------------------ start
for (const k in SLOTS) setSlot(k, DEFAULTS[k]);
let initial = {};
if (location.hash.startsWith('#s=')) { try { initial = JSON.parse(b64.dec(location.hash.slice(3))); } catch { initial = {}; } }
applyState(initial);
current = JSON.stringify(serialize());
setTab('wood');
refresh();
document.body.classList.add('configurator');
// Calm by default, like Ryan Sael's room: the moodboard cards and their threads wait
// behind the eye button (or N).
document.body.classList.add('no-board');
for (const k in SLOTS) spreadable(M[SLOTS[k].mat]);
// compile the finishes' shaders in parallel before drawing with them, instead of
// stalling the page on the first frame
api.hold = true;
renderer.compileAsync(scene, camera).catch(() => {}).finally(() => { api.hold = false; measureSafe(); api.resetView(); });
window.__config = { state, SAMPLES, SLOTS, setSlot, applyState, serialize, fits, pose, sunAt, relight, addPiece };
