// The four bedrooms, rebuilt in the flat's own procedural style.
//
// Ar. Shivangi Kaushik designed these rooms; their SketchUp exports looked out of place
// next to the procedural flat (TVs read as flat wall panels, finishes were baked flat).
// Nothing here copies her geometry. Every piece is drawn fresh from boxes, extrusions
// and a few curves, at the position, size, facing and finish of her design: positions
// and sizes were read off the bounding boxes of her room models (placed in the flat by
// zone.json), colours and details off her V-Ray renders in assets/renders.
//
// All coordinates below are plan metres, the same frame as zone.json: x to the sheet's
// right, y to the sheet's top. Heights are metres above the finished floor.
//
// Her finishes are the defaults, not a lock. Each room owns a set of finish slots
// (floor, walls, feature wall, upholstery, accents, wardrobe fronts, woodwork, rug) that
// the configurator swaps per room, and its loose furniture (beds, chairs, benches, side
// tables, rugs) is placed as ordinary movable pieces. Wall-fixed joinery stays put and
// is handed back as obstacles, so moved furniture cannot go through it.
import * as THREE from 'three';
import { marble, fabric, leather, normalFrom } from './textures.js';

export function buildBedrooms({ W, CUT, mesh, rbox, prism, M, zone, inWall, inRing }) {
  // ---------------------------------------------------------------- materials
  // Fixed bits (bedding, metals, glass, screens, lights) are made here; the surfaces a
  // viewer can change are the per-room slot materials made by slots() below.
  const phys = (o) => new THREE.MeshPhysicalMaterial({ roughness: 0.7, ...o });
  const weave = fabric({ base: 0xF2F0EC, seed: 51 }), weaveN = normalFrom(weave, 3.5);
  const hide = leather({ base: 0xF4F0EA, seed: 53 }), hideN = normalFrom(hide, 2.5);
  const cloth = (c, o = {}) => phys({ color: c, map: weave, normalMap: weaveN, normalScale: new THREE.Vector2(0.6, 0.6),
    roughness: 0.93, sheen: 0.45, sheenRoughness: 0.7, sheenColor: new THREE.Color(c).lerp(new THREE.Color(0xffffff), 0.45), ...o });
  function patternedFabric(base, colors) {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d'); x.fillStyle = '#' + new THREE.Color(base).getHexString(); x.fillRect(0, 0, 256, 256);
    x.lineCap = 'square'; x.lineJoin = 'miter';
    for (let row = -1; row < 6; row++) for (let col = -1; col < 6; col++) {
      const ox = col * 54 + (row % 2 ? 27 : 0), oy = row * 48;
      colors.forEach((color, i) => {
        const r = 21 - i * 5; x.strokeStyle = '#' + new THREE.Color(color).getHexString(); x.lineWidth = 6 - i;
        x.beginPath(); x.moveTo(ox, oy + 24 - r); x.lineTo(ox + r, oy + 24); x.lineTo(ox, oy + 24 + r); x.lineTo(ox - r, oy + 24); x.closePath(); x.stroke();
      });
    }
    const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping; map.repeat.set(1.8, 1.8); map.anisotropy = 8;
    return phys({ map, normalMap: weaveN, normalScale: new THREE.Vector2(0.45, 0.45), roughness: 0.92,
      sheen: 0.42, sheenRoughness: 0.72, sheenColor: new THREE.Color(0xF1E7D8) });
  }
  const skin = (c, o = {}) => phys({ color: c, map: hide, normalMap: hideN, normalScale: new THREE.Vector2(0.4, 0.4),
    roughness: 0.48, clearcoat: 0.15, clearcoatRoughness: 0.4, ...o });
  const lacq = (c, r = 0.42, cc = 0.12) => phys({ color: c, roughness: r, clearcoat: cc, clearcoatRoughness: 0.3 });
  const glow = (c, i = 1.2) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i, roughness: 1 });
  const sheer = () => phys({ color: 0xF1ECE3, roughness: 0.95, transparent: true, opacity: 0.38, depthWrite: false, side: THREE.DoubleSide });
  const drape = (c) => cloth(c, { side: THREE.DoubleSide });
  const stone = (base, vein, o = {}) => marble({ base, vein, joint: false, veins: 6, tile: 1.2, ...o });

  const K = {
    linen:    cloth(0xF3F1EC),
    bronze:   phys({ color: 0x8A6A4A, metalness: 1, roughness: 0.35 }),
    gold:     phys({ color: 0xC4A05A, metalness: 1, roughness: 0.3 }),
    chrome:   phys({ color: 0xD8DADC, metalness: 1, roughness: 0.18 }),
    black:    phys({ color: 0x1C1B1A, roughness: 0.5 }),
    blackMetal: phys({ color: 0x1E1D1C, metalness: 0.6, roughness: 0.45 }),
    groove:   phys({ color: 0x3A3632, roughness: 0.8 }),
    white:    lacq(0xF1EFEA, 0.38),
    tvBody:   phys({ color: 0x151515, roughness: 0.35, metalness: 0.3 }),
    screen:   phys({ color: 0x060708, roughness: 0.08, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05 }),
    mirror:   phys({ color: 0xE9ECEE, metalness: 1, roughness: 0.04 }),
    led:      glow(0xFFD9A6, 1.6),
    heritage: patternedFabric(0xC9BBA5, [0x6F7969, 0x9A5737, 0x4A382E]),
    roseIkat: patternedFabric(0xD7C6B7, [0xB98068, 0xEEE2D1, 0x92776B]),
    sageWeave: patternedFabric(0xDDD8CB, [0x9C9D8F, 0xC1BBAE, 0x7C8077]),
    section:  M.section,
  };

  // ---------------------------------------------------------------- per-room finish slots
  // One material per surface per room, registered in M as `${room}_${slot}`. `def` is
  // the configurator sample that reproduces her finish; the colour here only shows until
  // the configurator lays the finishes on.
  const slotDefs = [];
  function slots(rid, defs) {
    const S = {};
    for (const [base, [def, color]] of Object.entries(defs)) {
      const key = `${rid}_${base}`;
      const soft = base === 'upholstery' || base === 'accent' || base === 'woodwork';
      M[key] = phys({ color, roughness: base === 'floor' ? 0.25 : 0.7, side: soft ? THREE.DoubleSide : THREE.FrontSide });
      S[base] = M[key];
      slotDefs.push({ rid, base, mat: key, def });
    }
    return S;
  }

  // ---------------------------------------------------------------- pieces and obstacles
  const pieces = [], obstacles = [];
  // a loose piece the viewer can move: `draw(G)` adds its parts, in plan position, to G
  function movable(rid, id, name, type, [x0, x1, y0, y1], draw) {
    pieces.push({
      id: `${rid}-${id}`, type, name, room: rid, home: rid, movable: true, facing: null,
      obb: { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, d: y1 - y0, angle: 0 },
      footprint: [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]],
      build: () => { const G = new THREE.Group(); draw(G); return G; },
    });
  }
  const fixed = (rid, [x0, x1, y0, y1]) => obstacles.push({ room: rid, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, d: y1 - y0, angle: 0 });

  // ---------------------------------------------------------------- helpers
  const FACES = { 'x+': [1, 0], 'x-': [-1, 0], 'y+': [0, 1], 'y-': [0, -1] };
  const add = (g, geo, mat, x = 0, y = 0, z = 0) => { const m = mesh(geo, mat, x, y, z); g.add(m); return m; };
  const box = (g, w, h, d, x, y, z, mat, r = 0.008) => add(g, rbox(w, h, d, r), mat, x, y, z);
  // A group standing on a plan box: local +Z points to `face` (the piece's front),
  // local X runs across it. w = size across, d = size front to back. Local +X is plan
  // +x for 'y-', -x for 'y+', +y for 'x+' and -y for 'x-'.
  function frame(root, [x0, x1, y0, y1], face) {
    const f = typeof face === 'string' ? FACES[face] : face;
    const g = new THREE.Group(), c = W((x0 + x1) / 2, (y0 + y1) / 2);
    g.position.set(c.x, 0, c.z); g.rotation.y = Math.atan2(f[0], -f[1]);
    root.add(g);
    const alongX = Math.abs(f[0]) > Math.abs(f[1]);
    return { g, w: alongX ? y1 - y0 : x1 - x0, d: alongX ? x1 - x0 : y1 - y0 };
  }
  // A dark cap where a tall piece meets the section cut, like the cut walls.
  const cap = (g, w, d, z = 0) => box(g, w, 0.006, d, 0, CUT - 0.003, z, K.section, 0.001);
  const top = (h) => Math.min(h, CUT - 0.006);
  function curve(g, pts, r, mat) {
    const c = new THREE.CatmullRomCurve3(pts);
    const m = add(g, new THREE.TubeGeometry(c, Math.max(24, pts.length * 6), r, 6, false), mat);
    m.castShadow = false; return m;
  }
  // an extruded outline in the piece's own plane (x across, y up), `t` thick, set at z
  function slab(g, shapePts, t, z, mat) {
    const s = new THREE.Shape(shapePts.map(([x, y]) => new THREE.Vector2(x, y)));
    const geo = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 1 });
    geo.translate(0, 0, z - t / 2);
    return add(g, geo, mat);
  }
  // vertical flutes: a scalloped profile extruded upward, one mesh
  function flutes(g, w, z0, z1, zBack, pitch, depth, mat) {
    const s = new THREE.Shape(), t = 0.012, n = Math.max(1, Math.round(w / pitch)), p = w / n;
    s.moveTo(-w / 2, 0); s.lineTo(-w / 2, t);
    for (let i = 0; i < n; i++) for (let k = 1; k <= 6; k++) s.lineTo(-w / 2 + p * (i + k / 6), t + depth * Math.sin(Math.PI * k / 6));
    s.lineTo(w / 2, 0); s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: z1 - z0, bevelEnabled: false, curveSegments: 1 });
    geo.rotateX(Math.PI / 2); geo.translate(0, z1, zBack);
    return add(g, geo, mat);
  }
  function rug(root, b, mat) {
    const { g, w, d } = frame(root, b, 'y+');
    box(g, w, 0.012, d, 0, 0.006, 0, mat, 0.005).castShadow = false;
  }
  // Laid in a hole cut in the flat's floor (see floors below), at the same level: one
  // surface, never two fighting.
  function floor(root, ring, mat) {
    const m = prism(ring, [], -0.024, -0.004, mat); m.castShadow = false; root.add(m);
  }
  // Paint panels on her walls, 12 mm proud, only where masonry stands behind the room's
  // outline (not across doors or windows). Built from the floor up to the cut so the
  // cutaway can drop them with the walls, like Toilet 3's marble.
  function cladding(rid, ring, mat) {
    const G = new THREE.Group(); G.userData.cladding = true; G.userData.room = rid;
    for (let i = 0; i < ring.length - 1; i++) {
      const a = ring[i], b = ring[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (len < 0.1) continue;
      const ux = (b[0] - a[0]) / len, uy = (b[1] - a[1]) / len;
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const inward = inRing([mid[0] - uy * 0.05, mid[1] + ux * 0.05], ring) ? [-uy, ux] : [uy, -ux];
      const step = 0.05, n = Math.floor(len / step);
      let run = null;
      const flush = (t1) => {
        if (run === null) return;
        const t0 = run, l = t1 - t0; run = null;
        if (l < 0.1) return;
        const c = (t0 + t1) / 2, px = a[0] + ux * c + inward[0] * 0.007, py = a[1] + uy * c + inward[1] * 0.007;
        const geo = new THREE.BoxGeometry(l, CUT, 0.012); geo.translate(0, CUT / 2, 0);
        const A = W(a[0], a[1]), Bv = W(b[0], b[1]), pos = W(px, py);
        const m = mesh(geo, mat, pos.x, 0, pos.z);
        m.rotation.y = -Math.atan2(Bv.z - A.z, Bv.x - A.x);
        m.userData.wall = { z0: 0, z1: CUT, cx: a[0] + ux * c, cy: a[1] + uy * c };
        G.add(m);
      };
      for (let k = 0; k <= n; k++) {
        const t = Math.min(len, (k + 0.5) * step), q = [a[0] + ux * t - inward[0] * 0.08, a[1] + uy * t - inward[1] * 0.08];
        if (inWall(q)) { if (run === null) run = Math.max(0, t - step / 2); }
        else flush(Math.min(len, t - step / 2));
      }
      flush(len);
    }
    return G;
  }

  // ---------------------------------------------------------------- furniture
  // Platform bed: recessed dark plinth, upholstered base, mattress, duvet over the
  // front two thirds, a throw across the foot, pillows leaning on the headboard.
  function bed(root, s) {
    const { g, w, d } = frame(root, s.box, s.face);
    const bt = s.baseTop ?? 0.32, pl = s.plinth ? 0.07 : 0, hi = s.headInset ?? 0;
    if (s.plinth) box(g, w - 0.18, pl, d - 0.18, 0, pl / 2, 0, s.plinth, 0.004);
    box(g, w, bt - pl, d - hi, 0, pl + (bt - pl) / 2, hi / 2, s.base, s.baseR ?? 0.05);
    const mt = s.mattressTop ?? bt + 0.22, mw = w - 0.07, md = d - hi - 0.08, mz = hi / 2 + 0.01;
    box(g, mw, mt - bt, md, 0, (bt + mt) / 2, mz, K.linen, 0.06);
    const dd = md * 0.68;
    box(g, mw + 0.05, 0.13, dd, 0, mt - 0.045, mz + md / 2 - dd / 2 + 0.02, s.duvet || K.linen, 0.05);
    if (s.throw) box(g, mw + 0.07, 0.1, s.throwD ?? 0.44, 0, mt - 0.02, mz + md / 2 - (s.throwD ?? 0.44) / 2 - 0.04, s.throw, 0.04);
    if (s.runner) box(g, mw + 0.08, 0.1, 0.22, 0, mt - 0.012, mz + md / 2 - 0.62, s.runner, 0.04);
    const n = s.pillows ?? 2, pw = Math.min(0.72, (mw - 0.12) / n - 0.03), zp = -d / 2 + hi + 0.26;
    for (let i = 0; i < n; i++) {
      const p = box(g, pw, 0.15, 0.42, -mw / 2 + 0.06 + (i + 0.5) * (mw - 0.12) / n, mt + 0.1, zp, s.pillow || K.linen, 0.065);
      p.rotation.x = -0.42;
    }
    if (s.pillows2) for (let i = 0; i < 2; i++) {
      const p = box(g, pw * 0.8, 0.13, 0.36, (i ? 1 : -1) * mw / 4.2, mt + 0.1, zp + 0.18, s.pillows2, 0.06);
      p.rotation.x = -0.32;
    }
    if (s.cushion) { const c = box(g, 0.48, 0.3, 0.12, 0, mt + 0.15, zp + 0.3, s.cushion, 0.05); c.rotation.x = -0.28; }
    return g;
  }
  // Vertical channel tufting, the headboard wall of three of her rooms.
  function channels(g, w, h, d, y0, z, pitch, mat) {
    const n = Math.max(1, Math.round(w / pitch)), cw = w / n;
    box(g, w, h, d * 0.4, 0, y0 + h / 2, z - d * 0.3, mat, 0.01);
    for (let i = 0; i < n; i++) box(g, cw - 0.007, h - 0.012, d, -w / 2 + cw * (i + 0.5), y0 + h / 2, z, mat, Math.min(0.04, cw / 2 - 0.004));
  }
  // Full-height wardrobe: shadow-gap plinth, carcass, doors with real gaps, handles.
  function wardrobe(root, s) {
    const { g, w, d } = frame(root, s.box, s.face);
    const H = top(s.h), pl = 0.1, n = s.doors, dw = w / n, fz = d / 2 - 0.011;
    box(g, w - 0.03, pl, d - 0.07, 0, pl / 2, -0.035, K.black, 0.003);
    box(g, w, H - pl, d - 0.024, 0, pl + (H - pl) / 2, -0.012, s.mat, 0.004);
    const loft = s.loft && s.loft < H ? s.loft : null;
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + dw * (i + 0.5);
      if (loft) {
        box(g, dw - 0.005, loft - pl - 0.004, 0.02, x, pl + (loft - pl) / 2, fz, s.mat, 0.004);
        box(g, dw - 0.005, H - loft - 0.006, 0.02, x, loft + (H - loft) / 2, fz, s.mat, 0.004);
      } else box(g, dw - 0.005, H - pl - 0.006, 0.02, x, pl + (H - pl) / 2, fz, s.mat, 0.004);
    }
    if (s.h > CUT) cap(g, w, d);
    const seams = []; for (let i = 1; i < n; i += 2) seams.push(-w / 2 + dw * i);
    if (s.handle === 'bar') for (const x of seams) for (const sx of [-1, 1])
      box(g, 0.016, s.hl ?? 0.7, 0.02, x + sx * 0.035, s.hy ?? 1.0, fz + 0.022, s.handleMat || K.bronze, 0.006);
    if (s.handle === 'star') for (const x of seams) {
      const pts = [];
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, r = k % 2 ? 0.024 : 0.1; pts.push([Math.sin(a) * r, Math.cos(a) * r]); }
      const star = slab(g, pts, 0.004, fz + 0.011, K.groove); star.position.set(x, s.hy ?? 1.0, 0);
    }
    if (s.wave) {                      // her bedroom 3 doors: one sine groove across all five
      const pts = [];
      for (let i = 0; i <= 60; i++) { const u = i / 60, x = -w / 2 + 0.03 + u * (w - 0.06); pts.push(new THREE.Vector3(x, s.wave.y + s.wave.a * Math.sin(u * Math.PI * 2 * s.wave.k + s.wave.p), fz + 0.011)); }
      curve(g, pts, 0.011, K.groove);
    }
    return g;
  }
  // Flush warm-taupe doors from the room renders. The Master Bedroom uses the
  // fluted insert band; Bedroom 2 keeps the same quiet palette with a plain leaf.
  function designerDoor(root, { box: bounds, face, fluted = false, mat }) {
    const doorMat = mat || lacq(0xB8AD9C, 0.58, 0.03), trimMat = lacq(0xA99D8B, 0.62, 0.02);
    const { g, w, d } = frame(root, bounds, face), H = top(2.42), fz = d / 2 + 0.014;
    g.userData.roomDoor = true;
    box(g, w, H, 0.025, 0, H / 2, fz, doorMat, 0.003);
    box(g, w + 0.07, 0.035, 0.035, 0, H - 0.02, fz - 0.008, trimMat, 0.003);
    for (const sx of [-1, 1]) box(g, 0.035, H, 0.035, sx * (w / 2 + 0.018), H / 2, fz - 0.008, trimMat, 0.003);
    if (fluted) flutes(g, w - 0.08, 0.72, 1.02, fz + 0.016, 0.033, 0.009, trimMat);
    const hx = w / 2 - 0.15;
    const hub = add(g, new THREE.CylinderGeometry(0.026, 0.026, 0.026, 16), K.bronze, hx, 0.93, fz + 0.035); hub.rotation.x = Math.PI / 2;
    const lever = add(g, new THREE.CylinderGeometry(0.012, 0.012, 0.13, 12), K.bronze, hx - 0.055, 0.93, fz + 0.052); lever.rotation.z = Math.PI / 2;
    return g;
  }
  // Bedside table: a body (floating or on the floor), a drawer line, a knob.
  function bedside(root, s) {
    const { g, w, d } = frame(root, s.box, s.face);
    const h = s.z1 - s.z0;
    box(g, w, h, d, 0, s.z0 + h / 2, 0, s.body, 0.01);
    if (s.topMat) box(g, w + 0.004, 0.02, d + 0.004, 0, s.z1 + 0.01, 0, s.topMat, 0.004);
    if (s.cubby) {                      // open shelf under the drawer
      box(g, w - 0.05, s.cubby, 0.02, 0, s.z0 + 0.03 + s.cubby / 2, d / 2 - 0.02, K.black, 0.003);
      box(g, w - 0.05, s.cubby - 0.02, d - 0.06, 0, s.z0 + 0.03 + s.cubby / 2, 0.0, K.black, 0.003);
    }
    box(g, w - 0.03, 0.004, 0.004, 0, s.z1 - (s.drawer ?? 0.1), d / 2 + 0.001, K.groove, 0.001);
    if (s.knob) add(g, new THREE.SphereGeometry(0.012, 12, 8), s.knob, 0, s.z1 - (s.drawer ?? 0.1) / 2, d / 2 + 0.01);
    return g;
  }
  // A proper wall TV: a 3 cm deep body standing off a bracket, a glass screen, a lip.
  function tv(root, s) {
    const { g, d } = frame(root, s.box, s.face), w = s.w, h = s.z1 - s.z0, zb = -d / 2 + 0.03;
    box(g, 0.3, 0.2, 0.03, 0, s.z0 + h / 2, zb - 0.015, K.blackMetal, 0.004);
    box(g, w, h, 0.028, 0, s.z0 + h / 2, zb + 0.014, K.tvBody, 0.004);
    add(g, new THREE.PlaneGeometry(w - 0.014, h - 0.014), K.screen, 0, s.z0 + h / 2, zb + 0.0285);
    return g;
  }
  // Walnut desk chair of her study corners: splayed legs, white seat, a curved rail.
  function walnutChair(root, b, face, wood, seat = K.white) {
    const { g } = frame(root, b, face);
    for (const [x, z, h] of [[-0.2, 0.18, 0.44], [0.2, 0.18, 0.44], [-0.2, -0.18, 0.8], [0.2, -0.18, 0.8]]) {
      const l = add(g, new THREE.CylinderGeometry(0.014, 0.018, h, 10), wood, x, h / 2, z);
      l.rotation.x = z > 0 ? 0.05 : -0.1;
    }
    box(g, 0.44, 0.05, 0.42, 0, 0.44, 0.01, wood, 0.012);
    box(g, 0.4, 0.04, 0.38, 0, 0.485, 0.02, seat, 0.018);
    add(g, new THREE.CylinderGeometry(0.42, 0.42, 0.12, 24, 1, true, Math.PI - 0.55, 1.1), wood, 0, 0.72, 0.22);
    return g;
  }
  // A shell armchair: open curved back, seat cushion, legs. `lining` inside the shell.
  function shellChair(root, b, face, s) {
    const { g } = frame(root, b, face);
    const R = s.r, y0 = s.seat, legs = s.legs;
    for (const [x, z] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
      const l = add(g, new THREE.CylinderGeometry(s.leg ?? 0.012, s.leg ?? 0.012, y0 - 0.05, 10), legs, x * R * 0.62, (y0 - 0.05) / 2, z * R * 0.62);
      l.rotation.set(z * 0.08, 0, -x * 0.08);
    }
    box(g, R * 1.7, s.seatH ?? 0.09, R * 1.65, 0, y0 + (s.seatH ?? 0.09) / 2 - 0.03, 0.02, s.seatMat, 0.04);
    const H = s.back - y0, open = s.open ?? Math.PI * 1.1, mid = Math.PI;       // shell centred on the back (-z)
    add(g, new THREE.CylinderGeometry(R, R * 0.96, H, 36, 1, true, mid - open / 2, open), s.shellMat, 0, y0 + H / 2, 0);
    // the torus lies in XY from angle 0; turned flat, angle phi lands on the
    // cylinder's theta = pi/2 - phi, so start it at the shell's far end
    const rim = add(g, new THREE.TorusGeometry(R, 0.022, 8, 36, open), s.shellMat, 0, s.back, 0);
    rim.rotation.set(Math.PI / 2, 0, Math.PI / 2 - mid - open / 2);
    if (s.lining) add(g, new THREE.CylinderGeometry(R - 0.03, R - 0.05, H - 0.06, 36, 1, true, mid - open / 2 + 0.08, open - 0.16), s.lining, 0, y0 + (H - 0.06) / 2 + 0.02, 0);
    if (s.cushion) { const c = box(g, 0.4, 0.28, 0.1, 0, y0 + 0.22, -R * 0.55, s.cushion, 0.045); c.rotation.x = -0.2; }
    return g;
  }
  // Curtains: `path` is a run of plan points. At rest, as in her renders, the drapes
  // are gathered at the run's ends over a light sheer; drawn (the daylight panel's
  // curtain button), they close across the whole run.
  function curtains(root, rid, path, s) {
    const z0 = s.z0 ?? 0.02, z1 = top(s.z1 ?? CUT), H = z1 - z0;
    const open = new THREE.Group(); open.userData.curtain = rid; open.userData.curtainRole = 'proxy'; open.visible = false;
    const panel = (a, b, mat, amp, folds, role, into) => {
      const A = W(...a), Bv = W(...b), len = A.distanceTo(Bv);
      const geo = new THREE.PlaneGeometry(len, H, Math.max(8, Math.round(len * folds * 4)), 1), p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin((p.getX(i) / len) * Math.PI * 2 * Math.max(1, Math.round(len * folds))) * amp);
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, mat);
      m.position.set((A.x + Bv.x) / 2, z0 + H / 2, (A.z + Bv.z) / 2);
      m.rotation.y = -Math.atan2(Bv.z - A.z, Bv.x - A.x);
      m.castShadow = m.receiveShadow = true;
      m.userData.curtain = rid; m.userData.curtainRole = role;
      (into || root).add(m);
      return m;
    };
    const dm = drape(s.color), sm = sheer();
    for (let i = 1; i < path.length; i++) panel(path[i - 1], path[i], dm, 0.03, 5, 'original');
    // at rest: a sheer along the run, the drapes gathered into 30 cm bunches at the ends
    for (let i = 1; i < path.length; i++) {
      const sh = panel(path[i - 1], path[i], sm, 0.012, 3, 'proxy', open); sh.userData.curtainPart = 'sheer';
    }
    const bunch = (p, q) => {
      const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy), k = Math.min(0.3, l) / l;
      panel(p, [p[0] + dx * k, p[1] + dy * k], dm, 0.045, 9, 'proxy', open);
    };
    for (const [a, b] of s.gather || [[0, 1], [path.length - 1, path.length - 2]]) bunch(path[a], path[b]);
    root.add(open);
  }
  function romanBlind(root, rid, b, face, s) {
    const { g, w, d } = frame(root, b, face), z1 = top(s.z1), H = z1 - s.z0;
    const geo = new THREE.PlaneGeometry(w, H, 1, 24), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const v = (p.getY(i) / H + 0.5) * 4; p.setZ(i, Math.pow(Math.abs(Math.sin(v * Math.PI)), 0.6) * 0.035); }
    geo.computeVertexNormals();
    const m = add(g, geo, drape(s.color), 0, s.z0 + H / 2, -d / 2 + 0.02);
    m.material.side = THREE.DoubleSide;
    m.userData.curtain = rid; m.userData.curtainRole = 'original';
    m.userData.fullDrop = z1 - (s.sill ?? 0.95);        // drawn: from its head down to the sill
    return g;
  }

  // ================================================================ Bedroom 2
  // Taupe panelled bed wall with a backlit white onyx arch, grey upholstered bed on a
  // dark plinth, floating bedside tables, a four-door wardrobe, a white desk under the
  // window, a quilted bench, a fluted-glass display cabinet by the door.
  function bedroom2() {
    const R = new THREE.Group(), rid = 'bed2';
    const S = slots(rid, { floor: ['beigemarble', 0xE3D4C3], walls: ['warmwhite', 0xEDE6DA], feature: ['greige', 0xB9AD9D],
      upholstery: ['dove', 0xBAB6AF], accent: ['blush', 0xC9A897], joinery: ['linen', 0xE4DED3], doors: ['taupe', 0x978D80], rug: ['rosewash', 0xCDBDB2] });
    floor(R, ring(rid), S.floor);
    // bed wall: taupe panel, onyx arch with a warm edge light
    {
      const { g } = frame(R, [11.724, 11.75, 4.22, 7.07], 'x+');
      box(g, 2.85, top(2.45), 0.026, 0, top(2.45) / 2, 0, S.feature, 0.004);
      cap(g, 2.85, 0.026);
      const a = [], r = 1.0, spring = 1.36;
      a.push([-r, 0.9]);
      for (let i = 0; i <= 32; i++) { const t = Math.PI - (i / 32) * Math.PI; a.push([Math.cos(t) * r, Math.min(CUT - 0.006, spring + Math.sin(t) * r)]); }
      a.push([r, 0.9]);
      slab(g, a, 0.02, 0.023, phys({ map: stone(0xEFEAE1, 0xC9BCA8, { veins: 9, seed: 63 }), roughness: 0.25, clearcoat: 0.3, emissive: 0x3A2A18, emissiveIntensity: 0.25 }));
    }
    for (const y of [[6.61, 7.06], [4.24, 4.69]]) {
      bedside(R, { box: [11.75, 12.20, ...y], face: 'x+', z0: 0.38, z1: 0.56, body: lacq(0xCFC8BC, 0.5), knob: K.bronze, drawer: 0.12 });
      fixed(rid, [11.75, 12.20, ...y]);
    }
    wardrobe(R, { box: [12.07, 14.50, 3.05, 3.65], face: 'y+', h: 2.45, doors: 4, mat: S.joinery, handle: 'bar', hl: 0.62, hy: 1.05 });
    fixed(rid, [12.07, 14.50, 3.05, 3.65]);
    designerDoor(R, { box: [14.772, 14.887, 6.681, 7.429], face: 'x-', mat: S.doors });
    // desk under the window: white top on a side panel, a drawer rail
    {
      const { g, w } = frame(R, [14.56, 15.07, 3.67, 4.89], 'x-');
      box(g, w, 0.035, 0.51, 0, 0.755, 0, K.white, 0.006);
      box(g, 0.03, 0.74, 0.5, -w / 2 + 0.015, 0.37, 0, K.white, 0.004);
      box(g, w - 0.4, 0.1, 0.46, 0.18, 0.69, -0.01, K.white, 0.004);
      fixed(rid, [14.56, 15.07, 3.67, 4.89]);
    }
    // Between the window and the corner: a slim two-door wardrobe with fluted fronts,
    // set into the window bay's depth, handleless, quiet against the wall. Its front
    // comes forward to 14.88 so the shell's provisional window sill stays behind it.
    {
      const bx = [14.88, 15.40, 5.55, 6.36], { g, w, d } = frame(R, bx, 'x-'), H = top(2.73), pl = 0.08, fz = d / 2 - 0.02;
      box(g, w - 0.02, pl, d - 0.06, 0, pl / 2, -0.03, K.black, 0.003);
      box(g, w, H - pl, d - 0.03, 0, pl + (H - pl) / 2, -0.015, S.joinery, 0.004);
      for (const sx of [-1, 1]) {
        const f = flutes(g, w / 2 - 0.004, pl + 0.003, H - 0.003, fz - 0.012, 0.032, 0.008, S.joinery);
        f.position.x = sx * w / 4;
      }
      cap(g, w, d);
      fixed(rid, bx);
    }
    romanBlind(R, rid, [15.00, 15.077, 3.67, 5.47], 'x-', { z0: 1.67, z1: 2.36, color: 0xE3DCCD });

    movable(rid, 'rug', 'Rug', 'rug', [12.90, 14.42, 4.42, 6.85], G => rug(G, [12.90, 14.42, 4.42, 6.85], S.rug));
    // bed with its headboard: grey upholstered, white leather piping, two cushions
    movable(rid, 'bed', 'Bed', 'bed', [11.75, 13.96, 4.70, 6.62], G => {
      const { g } = frame(G, [11.75, 11.90, 4.70, 6.59], 'x+');
      box(g, 1.89, 0.84, 0.08, 0, 0.66, -0.035, skin(0xEDEAE4), 0.03);
      for (const sx of [-1, 1]) box(g, 0.9, 0.74, 0.09, sx * 0.47, 0.64, 0.02, S.upholstery, 0.04);
      bed(G, { box: [11.90, 13.96, 4.70, 6.62], face: 'x+', plinth: K.black, base: S.upholstery, baseTop: 0.3,
               mattressTop: 0.54, throw: cloth(0xC4BDB0), runner: K.sageWeave, pillows: 2, pillows2: K.linen, cushion: K.heritage });
    });
    movable(rid, 'chair', 'Desk chair', 'chair', [14.14, 14.69, 3.77, 4.34], G =>
      shellChair(G, [14.14, 14.69, 3.77, 4.34], 'x+', { r: 0.26, seat: 0.47, back: 0.82, open: Math.PI * 1.15,
        legs: K.gold, leg: 0.01, seatMat: S.upholstery, shellMat: S.upholstery }));
    // quilted bench on dark legs
    movable(rid, 'bench', 'Bench', 'bench', [12.81, 14.16, 7.66, 8.16], G => {
      const { g, w, d } = frame(G, [12.81, 14.16, 7.66, 8.16], 'y-');
      for (const sx of [-1, 1]) {
        box(g, 0.04, 0.2, d - 0.08, sx * (w / 2 - 0.1), 0.11, 0, K.blackMetal, 0.01);
        box(g, 0.04, 0.02, d - 0.08, sx * (w / 2 - 0.1), 0.012, 0, K.blackMetal, 0.006);
      }
      box(g, w - 0.04, 0.05, d - 0.06, 0, 0.225, 0, K.blackMetal, 0.01);
      const n = 11;
      for (let i = 0; i < n; i++) box(g, (w - 0.02) / n - 0.006, 0.15, d - 0.02, -w / 2 + 0.01 + (w - 0.02) / n * (i + 0.5), 0.325, 0, K.roseIkat, 0.05);
    });
    // display cabinet by the door: black frame, fluted glass, lit inside
    movable(rid, 'cabinet', 'Display cabinet', 'cabinet', [14.45, 14.77, 7.63, 8.01], G => {
      const { g, w, d } = frame(G, [14.45, 14.77, 7.63, 8.01], 'x-');
      box(g, w, 1.72, d, 0, 0.86, 0, K.blackMetal, 0.006);
      box(g, w - 0.03, 1.66, d - 0.03, 0, 0.86, 0.004, glow(0xF6E2C4, 0.55), 0.004);
      const fl = flutes(g, w - 0.03, 0.04, 1.68, d / 2 - 0.012, 0.022, 0.006, phys({ color: 0xDCE3E2, roughness: 0.25, transmission: 0.6, transparent: true, opacity: 0.55 }));
      fl.castShadow = false;
    });
    cladRooms[rid] = cladding(rid, ring(rid), S.walls);
    return R;
  }

  // ================================================================ Bedroom 1
  // Tan leather framed headboard on a gridded panel between two fluted walls, a
  // six-door grey wardrobe with star cut-outs, a walnut desk and a floating fluted
  // console along the TV wall, a leather ottoman.
  function bedroom1() {
    const R = new THREE.Group(), rid = 'bed1';
    const S = slots(rid, { floor: ['beigemarble', 0xE6DBCC], walls: ['warmwhite', 0xEDE6DA], feature: ['greige', 0xB9AE9F],
      upholstery: ['stone', 0xD6CDBF], accent: ['cognac', 0x9A5A34], joinery: ['pebble', 0xB8B3AC], doors: ['taupe', 0x978D80], woodwork: ['walnut', 0x6A4731],
      rug: ['swirl', 0xD9D6D1] });
    floor(R, ring(rid), S.floor);
    // bed wall: fluted greige panels either side of a gridded panel
    {
      for (const [a, b] of [[2.60, 4.00], [5.87, 6.83]]) {
        const { g, w } = frame(R, [0.224, 0.25, a, b], 'x+');
        flutes(g, w, 0, top(2.6), -0.013, 0.04, 0.012, S.feature); cap(g, w, 0.03);
      }
      const { g, w } = frame(R, [0.224, 0.25, 4.00, 5.87], 'x+');
      const H = top(2.6), frameMat = lacq(0xBDB4A8, 0.6, 0), panel = lacq(0xEFEBE3, 0.7, 0);
      box(g, w, H, 0.02, 0, H / 2, -0.003, panel, 0.003);
      for (const x of [-w / 2, -w / 6, w / 6, w / 2]) box(g, 0.035, H, 0.03, x, H / 2, 0.004, frameMat, 0.004);
      for (const y of [1.25, 1.95]) box(g, w, 0.035, 0.03, 0, y, 0.004, frameMat, 0.004);
      cap(g, w, 0.03);
    }
    wardrobe(R, { box: [0.224, 0.83, 6.83, 9.71], face: 'x+', h: 2.72, doors: 6, mat: S.joinery, handle: 'star', hy: 1.0 });
    fixed(rid, [0.224, 0.83, 6.83, 9.71]);
    designerDoor(R, { box: [2.045, 2.09, 8.901, 9.693], face: 'x-', mat: S.doors });
    // TV wall: walnut desk, floating fluted console with a grey marble top, a TV
    {
      const { g, w, d } = frame(R, [2.78, 3.244, 5.68, 6.60], 'x-');
      box(g, w, 0.04, d, 0, 0.77, 0, S.woodwork, 0.008);
      for (const sx of [-1, 1]) {
        const l = add(g, new THREE.CylinderGeometry(0.016, 0.02, 0.75, 10), S.woodwork, sx * (w / 2 - 0.05), 0.375, d / 2 - 0.06);
        l.rotation.z = sx * -0.04;
      }
      box(g, w - 0.1, 0.06, 0.03, 0, 0.72, d / 2 - 0.04, S.woodwork, 0.006);
      fixed(rid, [2.78, 3.244, 5.68, 6.60]);
    }
    {
      const { g, w, d } = frame(R, [2.78, 3.244, 4.00, 5.68], 'x-');
      box(g, w, 0.15, d - 0.02, 0, 0.6, -0.01, S.joinery, 0.006);
      flutes(g, w, 0.525, 0.675, d / 2 - 0.02, 0.03, 0.01, S.joinery);
      box(g, w + 0.01, 0.025, d, 0, 0.69, 0, phys({ map: stone(0xD6D0C8, 0x8F877D, { seed: 73 }), roughness: 0.2, clearcoat: 0.4 }), 0.004);
      fixed(rid, [2.78, 3.244, 4.00, 5.68]);
    }
    tv(R, { box: [3.17, 3.244, 4.51, 5.50], face: 'x-', w: 0.99, z0: 1.07, z1: 1.66 });
    // wall cabinet over the desk: walnut fluted door, black open shelves
    {
      const { g, w, d } = frame(R, [2.94, 3.244, 5.68, 6.60], 'x-'), z0 = 1.42, H = top(2.49) - z0;
      // local x runs toward plan -y here: open shelves on the +y half (local x < 0)
      box(g, w / 2, H, d, -w / 4, z0 + H / 2, 0, K.black, 0.004);
      for (const k of [1, 2]) box(g, w / 2 - 0.03, 0.018, d - 0.02, -w / 4, z0 + H * k / 3, 0.01, S.woodwork, 0.003);
      box(g, w / 2, H, d - 0.02, w / 4, z0 + H / 2, -0.01, S.woodwork, 0.004);
      flutes(g, w / 2 - 0.01, z0 + 0.005, z0 + H - 0.005, d / 2 - 0.02, 0.025, 0.008, S.woodwork).position.x = w / 4;
      if (2.49 > CUT) cap(g, w, d);
    }
    curtains(R, rid, [[0.86, 9.66], [1.61, 9.66]], { color: 0xD8CEBF, gather: [[0, 1], [1, 0]] });

    movable(rid, 'rug', 'Rug', 'rug', [1.05, 2.57, 3.67, 6.11], G => rug(G, [1.05, 2.57, 3.67, 6.11], S.rug));
    // bed with its headboard: leather frame, two cushions
    movable(rid, 'bed', 'Bed', 'bed', [0.25, 2.12, 4.00, 5.88], G => {
      const { g } = frame(G, [0.25, 0.36, 4.00, 5.87], 'x+');
      box(g, 1.87, 1.12, 0.08, 0, 0.6, -0.015, S.accent, 0.035);
      for (const sx of [-1, 1]) box(g, 0.84, 0.86, 0.07, sx * 0.44, 0.58, 0.03, S.upholstery, 0.04);
      bed(G, { box: [0.36, 2.12, 4.00, 5.88], face: 'x+', base: S.upholstery, baseTop: 0.38, baseR: 0.09, plinth: S.woodwork,
               mattressTop: 0.6, throw: cloth(0xB9B1A7), runner: cloth(0x4A433D), pillows: 2, pillows2: K.linen, cushion: K.heritage });
    });
    for (const [i, y] of [[3.56, 4.01], [5.89, 6.34]].entries())
      movable(rid, `side${i + 1}`, 'Bedside table', 'side_table', [0.25, 0.69, ...y], G =>
        bedside(G, { box: [0.25, 0.69, ...y], face: 'x+', z0: 0.03, z1: 0.43, body: lacq(0xDAD4C9, 0.45), cubby: 0.16, knob: K.gold, drawer: 0.14 }));
    // oval leather ottoman on gold legs
    movable(rid, 'ottoman', 'Ottoman', 'bench', [0.69, 1.97, 2.47, 2.91], G => {
      const { g, w, d } = frame(G, [0.69, 1.97, 2.47, 2.91], 'y+');
      for (const sx of [-1, 1]) for (const sz of [-1, 1])
        add(g, new THREE.CylinderGeometry(0.012, 0.009, 0.14, 10), K.gold, sx * (w / 2 - 0.16), 0.07, sz * (d / 2 - 0.1));
      box(g, w, 0.31, d, 0, 0.29, 0, S.upholstery, 0.15);
    });
    movable(rid, 'chair', 'Desk chair', 'chair', [2.54, 3.04, 5.98, 6.49], G => walnutChair(G, [2.54, 3.04, 5.98, 6.49], 'x+', S.woodwork));
    cladRooms[rid] = cladding(rid, ring(rid), S.walls);
    return R;
  }

  // ================================================================ Bedroom 3
  // Dark oak floor, a wide grey channel headboard under a backlit wave panel, a
  // five-door grey wardrobe with one sine groove, a white desk on black legs with
  // black shelves, taupe drapes across the window bay.
  function bedroom3() {
    const R = new THREE.Group(), rid = 'bed3';
    const S = slots(rid, { floor: ['darkoak', 0x5E4A3A], walls: ['warmwhite', 0xEDE6DA], feature: ['pebble', 0xB5B0A9],
      upholstery: ['dove', 0xBAB6AF], accent: ['charcoal', 0x45484A], joinery: ['pebble', 0xB8B3AC], doors: ['taupe', 0x978D80], woodwork: ['walnut', 0x6A4731] });
    floor(R, floors.bed3, S.floor);
    // the floor runs on into her window bay, up to its glass and the sliding door
    floor(R, [[8.40, 13.427], [8.40, 14.392], [10.60, 14.392], [10.60, 13.65], [11.61, 13.65], [11.61, 13.218], [8.569, 13.218], [8.569, 13.427], [8.40, 13.427]], S.floor);
    // wave panel on the bed wall, lit along its crest
    {
      const { g, w } = frame(R, [11.57, 11.61, 9.336, 13.198], 'x-');
      // local x runs toward plan -y: from the bay (north, -w/2) to the desk wall (south)
      const zt = (u) => 1.28 + 0.62 * THREE.MathUtils.smoothstep(u, 0.18, 0.55) - 0.36 * Math.exp(-((u - 0.8) ** 2) / 0.006) + 0.5 * THREE.MathUtils.smoothstep(u, 0.84, 1.0);
      const pts = [[-w / 2, 0]], crest = [];
      for (let i = 0; i <= 80; i++) { const u = i / 80, h = Math.min(CUT - 0.006, zt(u)); pts.push([-w / 2 + u * w, h]); crest.push(new THREE.Vector3(-w / 2 + u * w, h + 0.004, 0.024)); }
      pts.push([w / 2, 0]);
      slab(g, pts, 0.035, 0, S.feature);
      curve(g, crest.filter(v => v.y < CUT - 0.02), 0.006, K.led);
    }
    {
      const { g, w } = frame(R, [11.46, 11.57, 10.34, 13.19], 'x-');
      channels(g, w, 1.1, 0.1, 0, 0, 0.19, S.upholstery);
      fixed(rid, [11.46, 11.57, 10.34, 13.19]);
    }
    for (const y of [[12.80, 13.18], [10.42, 10.98]]) {
      bedside(R, { box: [11.14, 11.46, ...y], face: 'x-', z0: 0.28, z1: 0.46, body: lacq(0xECE9E3, 0.45), drawer: 0.1 });
      fixed(rid, [11.14, 11.46, ...y]);
    }
    wardrobe(R, { box: [7.95, 8.569, 10.06, 12.52], face: 'x+', h: 2.46, doors: 5, mat: S.joinery,
                  wave: { y: 1.0, a: 0.13, k: 1.5, p: 0.4 } });
    fixed(rid, [7.95, 8.569, 10.06, 12.52]);
    designerDoor(R, { box: [7.474, 7.519, 10.08, 10.749], face: 'x+', mat: S.doors });
    // desk: white top on black steel legs, a two-drawer pedestal, black wall shelves
    {
      const { g, w, d } = frame(R, [8.57, 10.39, 9.336, 9.89], 'y+');
      box(g, w, 0.035, d, 0, 0.755, 0, K.white, 0.006);
      for (const sz of [-1, 1]) box(g, 0.025, 0.74, 0.025, -w / 2 + 0.03, 0.37, sz * (d / 2 - 0.04), K.blackMetal, 0.004);
      box(g, 0.025, 0.025, d - 0.08, -w / 2 + 0.03, 0.72, 0, K.blackMetal, 0.004);
      box(g, 0.46, 0.36, 0.5, w / 2 - 0.24, 0.21, 0, lacq(0xC9C6C1, 0.5), 0.01);
      for (const y of [0.12, 0.3]) box(g, 0.44, 0.004, 0.004, w / 2 - 0.24, y + 0.03, 0.251, K.groove, 0.001);
      for (const [x0, x1, y] of [[8.88, 10.10, 1.44], [8.88, 9.49, 1.76]]) {
        const u = (8.57 + 10.39) / 2 - (x0 + x1) / 2;
        box(g, x1 - x0, 0.025, 0.3, u, y, -d / 2 + 0.15, K.blackMetal, 0.004);
      }
      fixed(rid, [8.57, 10.39, 9.336, 9.89]);
    }
    // her drapes follow the bay: across the sliding door, along the north glass, round
    // the step
    curtains(R, rid, [[8.60, 13.46], [8.60, 14.33], [10.53, 14.33], [10.53, 13.72], [11.56, 13.72]],
             { color: 0x9A8D7E, gather: [[0, 1], [1, 0], [1, 2], [2, 1], [3, 4], [4, 3]] });

    movable(rid, 'bed', 'Bed', 'bed', [9.49, 11.46, 10.98, 12.82], G =>
      bed(G, { box: [9.49, 11.46, 10.98, 12.82], face: 'x-', base: S.upholstery, baseTop: 0.36, baseR: 0.06,
               plinth: K.black, mattressTop: 0.59, throw: cloth(0xC5CCD1), runner: cloth(0x3D4144), pillows: 2, pillow: cloth(0x3D4144), pillows2: K.linen }));
    movable(rid, 'chair', 'Desk chair', 'chair', [9.63, 10.11, 9.86, 10.32], G => walnutChair(G, [9.63, 10.11, 9.86, 10.32], 'y-', S.woodwork));
    cladRooms[rid] = cladding(rid, ring(rid), S.walls);
    return R;
  }

  // ================================================================ Master bedroom
  // Grey marble floor, a full-width cream channel headboard wall with a light line,
  // a king bed on an agate rug, a grey chest of drawers under a backlit mirror, a TV on
  // the partition, a cream four-door wardrobe, and a study lounge by the windows with
  // two leather shell chairs, a desk and a low cabinet.
  function master() {
    const R = new THREE.Group(), rid = 'master';
    const S = slots(rid, { floor: ['dovemarble', 0xDCD9D4], walls: ['warmwhite', 0xEDE6DA], upholstery: ['stone', 0xD6CDBF],
      accent: ['cognac', 0x8E5530], joinery: ['linen', 0xE4DED3], doors: ['taupe', 0x978D80], woodwork: ['walnut', 0x6A4731], rug: ['agate', 0xE7DCCB] });
    floor(R, ring(rid), S.floor);
    designerDoor(R, { box: [10.696, 11.61, 9.222, 9.336], face: 'y+', fluted: true, mat: S.doors });
    designerDoor(R, { box: [14.772, 14.887, 9.017, 9.781], face: 'x-', fluted: true, mat: S.doors });
    {
      const { g, w } = frame(R, [11.724, 11.83, 9.22, 12.07], 'x+');
      channels(g, w, 1.25, 0.1, 0, 0, 0.16, S.upholstery);
      box(g, w, 0.012, 0.02, 0, 1.262, -0.02, K.led, 0.002).castShadow = false;
      fixed(rid, [11.724, 11.83, 9.22, 12.07]);
    }
    // chest of drawers: sixteen drawers, gold knobs, a brown-grey marble top
    {
      const { g, w, d } = frame(R, [12.76, 14.74, 8.29, 8.79], 'y+'), body = lacq(0x91897E, 0.56, 0.05);
      box(g, w, 0.08, d - 0.04, 0, 0.04, -0.02, K.black, 0.004);
      box(g, w, 0.8, d - 0.02, 0, 0.48, -0.01, body, 0.004);
      const cols = 4, rows = 4, cw = w / cols, rh = 0.8 / rows;
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        const x = -w / 2 + cw * (i + 0.5), y = 0.08 + rh * (j + 0.5);
        box(g, cw - 0.006, rh - 0.006, 0.018, x, y, d / 2 - 0.009, body, 0.004);
        add(g, new THREE.SphereGeometry(0.014, 12, 8), K.gold, x, y, d / 2 + 0.008);
      }
      box(g, w + 0.01, 0.025, d + 0.01, 0, 0.9, 0, phys({ map: stone(0x857869, 0xD9D0C4, { seed: 93, veins: 8 }), roughness: 0.18, clearcoat: 0.5 }), 0.004);
      fixed(rid, [12.76, 14.74, 8.29, 8.79]);
    }
    // backlit mirror over the chest's east end
    {
      const { g, w } = frame(R, [14.03, 14.67, 8.29, 8.33], 'y+'), z0 = 0.98, H = top(2.39) - z0;
      box(g, w + 0.03, H + 0.03, 0.01, 0, z0 + H / 2, -0.012, K.led, 0.06).castShadow = false;
      box(g, w, H, 0.02, 0, z0 + H / 2, 0, K.mirror, 0.08);
    }
    tv(R, { box: [14.70, 14.772, 9.90, 11.10], face: 'x-', w: 1.2, z0: 0.89, z1: 1.6 });
    wardrobe(R, { box: [11.89, 14.30, 12.55, 13.16], face: 'y-', h: 2.4, doors: 4, mat: S.joinery,
                  handle: 'bar', handleMat: K.gold, hl: 0.32, hy: 1.1 });
    fixed(rid, [11.89, 14.30, 12.55, 13.16]);
    // study: white desk on a black pedestal, grey wall cabinet with an open black frame
    {
      const { g, w, d } = frame(R, [14.87, 16.35, 10.01, 10.50], 'y+');
      box(g, w, 0.03, d, 0, 0.745, 0, K.white, 0.006);
      box(g, 0.3, 0.73, d - 0.02, -w / 2 + 0.15, 0.365, -0.01, K.black, 0.006);
      box(g, 0.02, 0.73, d - 0.04, w / 2 - 0.01, 0.365, -0.02, K.white, 0.004);
      fixed(rid, [14.87, 16.35, 10.01, 10.50]);
    }
    {
      const { g, w, d } = frame(R, [14.87, 16.35, 10.01, 10.32], 'y+'), z0 = 1.53, H = top(2.29) - z0;
      const shelfW = 0.39;
      box(g, w - shelfW, H, d, -shelfW / 2, z0 + H / 2, 0, lacq(0x9FA4A6, 0.5), 0.005);
      box(g, 0.003, H - 0.02, 0.004, -shelfW / 2, z0 + H / 2, d / 2 + 0.001, K.groove, 0.001);
      for (const x of [w / 2 - 0.01, w / 2 - shelfW + 0.01]) box(g, 0.012, H, 0.012, x, z0 + H / 2, d / 2 - 0.02, K.blackMetal, 0.003);
      for (const y of [z0 + 0.02, 1.73, 2.04]) if (y < z0 + H) box(g, shelfW - 0.02, 0.02, d - 0.03, w / 2 - shelfW / 2, y, 0, S.woodwork, 0.003);
      if (2.29 > CUT) cap(g, w, d);
    }
    {
      const { g, w, d } = frame(R, [16.36, 17.44, 10.01, 10.56], 'y+');
      box(g, w, 0.53, d, 0, 0.265, 0, K.white, 0.006);
      box(g, 0.003, 0.49, 0.004, 0, 0.27, d / 2 + 0.001, K.groove, 0.001);
      fixed(rid, [16.36, 17.44, 10.01, 10.56]);
    }
    curtains(R, rid, [[14.95, 12.47], [17.62, 12.47], [17.62, 10.05]], { color: 0x77716B, gather: [[0, 1], [1, 0], [1, 2], [2, 1]] });

    movable(rid, 'rug', 'Rug', 'rug', [12.53, 14.05, 9.39, 11.83], G => rug(G, [12.53, 14.05, 9.39, 11.83], S.rug));
    movable(rid, 'bed', 'Bed', 'bed', [11.83, 13.62, 9.76, 11.57], G =>
      bed(G, { box: [11.83, 13.62, 9.76, 11.57], face: 'x+', base: S.upholstery, baseTop: 0.34, baseR: 0.09, plinth: K.black,
               mattressTop: 0.58, throw: cloth(0x6B5647), throwD: 0.9, pillows: 2, pillows2: cloth(0xE4DDD0), cushion: K.heritage }));
    for (const [i, y] of [[9.25, 9.73], [11.58, 12.06]].entries())
      movable(rid, `side${i + 1}`, 'Bedside table', 'side_table', [11.84, 12.21, ...y], G =>
        bedside(G, { box: [11.84, 12.21, ...y], face: 'x+', z0: 0, z1: 0.42, body: lacq(0x8E8B86, 0.5), topMat: K.black, drawer: 0.14 }));
    movable(rid, 'chair', 'Desk chair', 'chair', [15.02, 15.52, 10.36, 10.87], G => walnutChair(G, [15.02, 15.52, 10.36, 10.87], 'y-', S.woodwork));
    // lounge: two leather shell chairs turned toward each other, a stone drum table
    const shellSpec = { r: 0.37, seat: 0.36, back: 0.96, open: Math.PI * 1.2, legs: S.woodwork, leg: 0.016, seatH: 0.12,
                        seatMat: S.upholstery, shellMat: S.accent, lining: S.upholstery, cushion: K.heritage };
    movable(rid, 'lounge1', 'Lounge chair', 'armchair', [15.34, 16.13, 11.47, 12.30], G => shellChair(G, [15.34, 16.13, 11.47, 12.30], [0.34, -0.94], shellSpec));
    movable(rid, 'lounge2', 'Lounge chair', 'armchair', [16.54, 17.29, 11.48, 12.30], G => shellChair(G, [16.54, 17.29, 11.48, 12.30], [-0.34, -0.94], shellSpec));
    movable(rid, 'drum', 'Side table', 'side_table', [16.14, 16.54, 11.86, 12.26], G => {
      const c = W(16.34, 12.06), stoneMat = phys({ color: 0xA9B3B8, roughness: 0.55 });
      add(G, new THREE.LatheGeometry([[0, 0], [0.17, 0], [0.19, 0.04], [0.12, 0.25], [0.19, 0.46], [0.2, 0.5], [0, 0.5]].map(([x, y]) => new THREE.Vector2(x, y)), 40), stoneMat, c.x, 0, c.z);
    });
    cladRooms[rid] = cladding(rid, ring(rid), S.walls);
    return R;
  }

  const rooms = Object.fromEntries(zone.rooms.map(r => [r.id, r]));
  function ring(id) { return rooms[id].outline; }
  // The rings cut out of the flat's floor for each bedroom's own floor. Bedroom 3's is
  // the drawn room (its outline now runs into the bay, which has no flat floor), its
  // north edge 3 mm short of the flat floor's edge there, so the cut stays inside.
  const floors = {
    bed1: ring('bed1'), bed2: ring('bed2'), master: ring('master'),
    bed3: [[7.922, 12.525], [8.569, 12.525], [8.569, 13.215], [11.61, 13.215], [11.61, 9.336], [7.922, 9.336], [7.922, 12.525]],
  };
  const cladRooms = {};
  const roots = { bed2: bedroom2(), bed1: bedroom1(), bed3: bedroom3(), master: master() };
  return {
    roots, floors, pieces, obstacles, slots: slotDefs, cladding: cladRooms,
    curtainMode: { master: 'side', bed1: 'side', bed2: 'roman', bed3: 'side' },
  };
}
