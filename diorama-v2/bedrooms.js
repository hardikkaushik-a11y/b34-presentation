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
import * as THREE from 'three';
import { marble, wood, fabric, leather, normalFrom } from './textures.js';

export function buildBedrooms({ W, CUT, mesh, rbox, prism, M, zone }) {
  // ---------------------------------------------------------------- materials
  // Her finishes, fixed: the configurator never swaps these.
  const phys = (o) => new THREE.MeshPhysicalMaterial({ roughness: 0.7, ...o });
  const weave = fabric({ base: 0xF2F0EC, seed: 51 }), weaveN = normalFrom(weave, 3.5);
  const hide = leather({ base: 0xF4F0EA, seed: 53 }), hideN = normalFrom(hide, 2.5);
  const walnutMap = wood({ base: 0x6A4731, dark: 0x2E1C10, plank: 0.3, length: 1.8, seed: 57 });
  const cloth = (c, o = {}) => phys({ color: c, map: weave, normalMap: weaveN, normalScale: new THREE.Vector2(0.6, 0.6),
    roughness: 0.93, sheen: 0.45, sheenRoughness: 0.7, sheenColor: new THREE.Color(c).lerp(new THREE.Color(0xffffff), 0.45), ...o });
  const skin = (c, o = {}) => phys({ color: c, map: hide, normalMap: hideN, normalScale: new THREE.Vector2(0.4, 0.4),
    roughness: 0.48, clearcoat: 0.15, clearcoatRoughness: 0.4, ...o });
  const lacq = (c, r = 0.42, cc = 0.12) => phys({ color: c, roughness: r, clearcoat: cc, clearcoatRoughness: 0.3 });
  const glow = (c, i = 1.2) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i, roughness: 1 });
  const sheer = () => phys({ color: 0xF1ECE3, roughness: 0.95, transparent: true, opacity: 0.38, depthWrite: false, side: THREE.DoubleSide });
  const drape = (c) => cloth(c, { side: THREE.DoubleSide, transparent: true, opacity: 0.94 });
  const stone = (base, vein, o = {}) => marble({ base, vein, joint: false, veins: 6, tile: 1.2, ...o });

  const K = {
    linen:    cloth(0xF3F1EC),
    bronze:   phys({ color: 0x8A6A4A, metalness: 1, roughness: 0.35 }),
    gold:     phys({ color: 0xC4A05A, metalness: 1, roughness: 0.3 }),
    chrome:   phys({ color: 0xD8DADC, metalness: 1, roughness: 0.18 }),
    black:    phys({ color: 0x1C1B1A, roughness: 0.5 }),
    blackMetal: phys({ color: 0x1E1D1C, metalness: 0.6, roughness: 0.45 }),
    groove:   phys({ color: 0x3A3632, roughness: 0.8 }),
    walnut:   phys({ map: walnutMap, roughness: 0.5, clearcoat: 0.12, clearcoatRoughness: 0.35 }),
    white:    lacq(0xF1EFEA, 0.38),
    tvBody:   phys({ color: 0x151515, roughness: 0.35, metalness: 0.3 }),
    screen:   phys({ color: 0x060708, roughness: 0.08, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05 }),
    mirror:   phys({ color: 0xE9ECEE, metalness: 1, roughness: 0.04 }),
    led:      glow(0xFFD9A6, 1.6),
    section:  M.section,
  };
  K.walnutDS = Object.assign(K.walnut.clone(), { side: THREE.DoubleSide });

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
  function floor(root, ring, mat) {
    const m = prism(ring, [], -0.0035, -0.001, mat); m.castShadow = false; root.add(m);
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
  // Bedside table: a body (floating or on the floor), a drawer line, a knob.
  function bedside(root, s) {
    const { g, w, d } = frame(root, s.box, s.face);
    const h = s.z1 - s.z0;
    box(g, w, h, d, 0, s.z0 + h / 2, 0, s.body, 0.01);
    if (s.topMat) box(g, w + 0.004, 0.02, d + 0.004, 0, s.z1 - 0.01, 0, s.topMat, 0.004);
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
  function walnutChair(root, b, face, seat = K.white) {
    const { g } = frame(root, b, face);
    for (const [x, z, h] of [[-0.2, 0.18, 0.44], [0.2, 0.18, 0.44], [-0.2, -0.18, 0.8], [0.2, -0.18, 0.8]]) {
      const l = add(g, new THREE.CylinderGeometry(0.014, 0.018, h, 10), K.walnut, x, h / 2, z);
      l.rotation.x = z > 0 ? 0.05 : -0.1;
    }
    box(g, 0.44, 0.05, 0.42, 0, 0.44, 0.01, K.walnut, 0.012);
    box(g, 0.4, 0.04, 0.38, 0, 0.485, 0.02, seat, 0.018);
    add(g, new THREE.CylinderGeometry(0.42, 0.42, 0.12, 24, 1, true, Math.PI - 0.55, 1.1), K.walnutDS, 0, 0.72, 0.22);
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
  // Curtains: `path` is a run of plan points. Closed, drapes hang the full run; opened
  // (the daylight panel's curtain button), they gather at the run's ends and a light
  // sheer stays across the glass.
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
    // opened: a sheer along the run, the drapes gathered into 30 cm bunches at the ends
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
    return g;
  }

  // ================================================================ Bedroom 2
  // Taupe panelled bed wall with a backlit white onyx arch, grey upholstered bed on a
  // dark plinth, floating bedside tables, a four-door wardrobe, a white desk under the
  // window, a quilted bench, a fluted-glass display cabinet by the door.
  function bedroom2() {
    const R = new THREE.Group();
    floor(R, ring('bed2'), phys({ map: marble({ base: 0xE3D4C3, vein: 0xB39A7E, tile: 0.8, seed: 61 }), roughness: 0.2, clearcoat: 0.2, clearcoatRoughness: 0.12 }));
    rug(R, [12.90, 14.42, 4.42, 6.85], phys({ map: stone(0xCDBDB2, 0x9A8274, { veins: 12, seed: 62 }), roughness: 0.97 }));
    // bed wall: taupe panel, onyx arch with a warm edge light
    {
      const { g } = frame(R, [11.724, 11.75, 4.22, 7.07], 'x+');
      box(g, 2.85, top(2.45), 0.026, 0, top(2.45) / 2, 0, lacq(0xB9AD9D, 0.8, 0), 0.004);
      cap(g, 2.85, 0.026);
      const a = [], r = 1.0, spring = 1.36;
      a.push([-r, 0.9]);
      for (let i = 0; i <= 32; i++) { const t = Math.PI - (i / 32) * Math.PI; a.push([Math.cos(t) * r, Math.min(CUT - 0.006, spring + Math.sin(t) * r)]); }
      a.push([r, 0.9]);
      slab(g, a, 0.02, 0.023, phys({ map: stone(0xEFEAE1, 0xC9BCA8, { veins: 9, seed: 63 }), roughness: 0.25, clearcoat: 0.3, emissive: 0x3A2A18, emissiveIntensity: 0.25 }));
    }
    // headboard: grey upholstered, white leather piping, two cushions
    {
      const { g } = frame(R, [11.75, 11.90, 4.70, 6.59], 'x+');
      const hb = cloth(0xB9B6B0);
      box(g, 1.89, 0.84, 0.08, 0, 0.66, -0.035, skin(0xEDEAE4), 0.03);
      for (const sx of [-1, 1]) box(g, 0.9, 0.74, 0.09, sx * 0.47, 0.64, 0.02, hb, 0.04);
    }
    bed(R, { box: [11.90, 13.96, 4.70, 6.62], face: 'x+', plinth: K.black, base: cloth(0xC2BFB9), baseTop: 0.3,
             mattressTop: 0.54, throw: cloth(0x8E8B86), runner: cloth(0x6E6A64), pillows: 2, pillows2: cloth(0xE8E4DC),
             cushion: cloth(0x8A6A48) });
    for (const y of [[6.61, 7.06], [4.24, 4.69]])
      bedside(R, { box: [11.75, 12.20, ...y], face: 'x+', z0: 0.38, z1: 0.56, body: lacq(0xCFC8BC, 0.5), knob: K.bronze, drawer: 0.12 });
    wardrobe(R, { box: [12.07, 14.50, 3.05, 3.65], face: 'y+', h: 2.45, doors: 4, mat: lacq(0xE4DFD5, 0.45), handle: 'bar', hl: 0.62, hy: 1.05 });
    // desk under the window: white top on a side panel, a drawer rail
    {
      const { g, w } = frame(R, [14.56, 15.07, 3.67, 4.89], 'x-');
      box(g, w, 0.035, 0.51, 0, 0.755, 0, K.white, 0.006);
      box(g, 0.03, 0.74, 0.5, -w / 2 + 0.015, 0.37, 0, K.white, 0.004);
      box(g, w - 0.4, 0.1, 0.46, 0.18, 0.69, -0.01, K.white, 0.004);
    }
    shellChair(R, [14.14, 14.69, 3.77, 4.34], 'x+', { r: 0.26, seat: 0.47, back: 0.82, open: Math.PI * 1.15,
      legs: K.chrome, leg: 0.01, seatMat: cloth(0xBDB9B2), shellMat: Object.assign(cloth(0xB5B1AA), { side: THREE.DoubleSide }) });
    // quilted bench on dark legs
    {
      const { g, w, d } = frame(R, [12.81, 14.16, 7.66, 8.16], 'y-');
      for (const sx of [-1, 1]) {
        box(g, 0.04, 0.2, d - 0.08, sx * (w / 2 - 0.1), 0.11, 0, K.blackMetal, 0.01);
        box(g, 0.04, 0.02, d - 0.08, sx * (w / 2 - 0.1), 0.012, 0, K.blackMetal, 0.006);
      }
      box(g, w - 0.04, 0.05, d - 0.06, 0, 0.225, 0, K.blackMetal, 0.01);
      const q = cloth(0xC9A897), n = 11;
      for (let i = 0; i < n; i++) box(g, (w - 0.02) / n - 0.006, 0.15, d - 0.02, -w / 2 + 0.01 + (w - 0.02) / n * (i + 0.5), 0.325, 0, q, 0.05);
    }
    // display cabinet by the door: black frame, fluted glass, lit inside
    {
      const { g, w, d } = frame(R, [14.45, 14.77, 7.63, 8.01], 'x-');
      box(g, w, 1.72, d, 0, 0.86, 0, K.blackMetal, 0.006);
      box(g, w - 0.03, 1.66, d - 0.03, 0, 0.86, 0.004, glow(0xF6E2C4, 0.55), 0.004);
      const fl = flutes(g, w - 0.03, 0.04, 1.68, d / 2 - 0.012, 0.022, 0.006, phys({ color: 0xDCE3E2, roughness: 0.25, transmission: 0.6, transparent: true, opacity: 0.55 }));
      fl.castShadow = false;
    }
    // fluted panel between window and corner
    { const { g, w } = frame(R, [15.05, 15.077, 5.50, 6.36], 'x-'); flutes(g, w, 0.0, top(2.45), -0.01, 0.045, 0.012, lacq(0xE2DBCF, 0.7, 0)); cap(g, w, 0.03); }
    romanBlind(R, 'bed2', [15.00, 15.077, 3.67, 5.47], 'x-', { z0: 1.67, z1: 2.36, color: 0xE3DCCD });
    return R;
  }

  // ================================================================ Bedroom 1
  // Tan leather framed headboard on a gridded panel between two fluted walls, a
  // six-door grey wardrobe with star cut-outs, a walnut desk and a floating fluted
  // console along the TV wall, a leather ottoman.
  function bedroom1() {
    const R = new THREE.Group();
    floor(R, ring('bed1'), phys({ map: marble({ base: 0xE6DBCC, vein: 0xB89E82, tile: 0.8, seed: 71 }), roughness: 0.2, clearcoat: 0.2, clearcoatRoughness: 0.12 }));
    rug(R, [1.05, 2.57, 3.67, 6.11], phys({ map: stone(0xD9D6D1, 0x7C7873, { veins: 14, seed: 72 }), roughness: 0.97 }));
    // bed wall: fluted greige panels either side of a gridded panel
    {
      const fl = lacq(0xB9AE9F, 0.75, 0);
      for (const [a, b] of [[2.60, 4.00], [5.87, 6.83]]) {
        const { g, w } = frame(R, [0.224, 0.25, a, b], 'x+');
        flutes(g, w, 0, top(2.6), -0.013, 0.04, 0.012, fl); cap(g, w, 0.03);
      }
      const { g, w } = frame(R, [0.224, 0.25, 4.00, 5.87], 'x+');
      const H = top(2.6), frameMat = lacq(0xBDB4A8, 0.6, 0), panel = lacq(0xEFEBE3, 0.7, 0);
      box(g, w, H, 0.02, 0, H / 2, -0.003, panel, 0.003);
      for (const x of [-w / 2, -w / 6, w / 6, w / 2]) box(g, 0.035, H, 0.03, x, H / 2, 0.004, frameMat, 0.004);
      for (const y of [1.25, 1.95]) box(g, w, 0.035, 0.03, 0, y, 0.004, frameMat, 0.004);
      cap(g, w, 0.03);
    }
    // headboard: tan leather frame, two cream cushions
    {
      const { g } = frame(R, [0.25, 0.36, 4.00, 5.87], 'x+');
      box(g, 1.87, 1.12, 0.08, 0, 0.6, -0.015, skin(0x9A5A34), 0.035);
      for (const sx of [-1, 1]) box(g, 0.84, 0.86, 0.07, sx * 0.44, 0.58, 0.03, cloth(0xD8D1C5), 0.04);
    }
    bed(R, { box: [0.36, 2.12, 4.00, 5.88], face: 'x+', base: cloth(0xCFC6B8), baseTop: 0.38, baseR: 0.09, plinth: K.walnut,
             mattressTop: 0.6, throw: cloth(0xB9B2A8), runner: cloth(0x3B3936), pillows: 2, cushion: cloth(0x9A5A3C) });
    for (const y of [[3.56, 4.01], [5.89, 6.34]])
      bedside(R, { box: [0.25, 0.69, ...y], face: 'x+', z0: 0.03, z1: 0.43, body: lacq(0xDAD4C9, 0.45), cubby: 0.16, knob: K.gold, drawer: 0.14 });
    wardrobe(R, { box: [0.224, 0.83, 6.83, 9.71], face: 'x+', h: 2.72, doors: 6, mat: lacq(0xB9B4AD, 0.5), handle: 'star', hy: 1.0 });
    // oval leather ottoman on gold legs
    {
      const { g, w, d } = frame(R, [0.69, 1.97, 2.47, 2.91], 'y+');
      for (const sx of [-1, 1]) for (const sz of [-1, 1])
        add(g, new THREE.CylinderGeometry(0.012, 0.009, 0.14, 10), K.gold, sx * (w / 2 - 0.16), 0.07, sz * (d / 2 - 0.1));
      box(g, w, 0.31, d, 0, 0.29, 0, skin(0xE9E3D9), 0.15);
    }
    // TV wall: walnut desk, floating fluted console with a grey marble top, a TV
    {
      const { g, w, d } = frame(R, [2.78, 3.244, 5.68, 6.60], 'x-');
      box(g, w, 0.04, d, 0, 0.77, 0, K.walnut, 0.008);
      for (const sx of [-1, 1]) {
        const l = add(g, new THREE.CylinderGeometry(0.016, 0.02, 0.75, 10), K.walnut, sx * (w / 2 - 0.05), 0.375, d / 2 - 0.06);
        l.rotation.z = sx * -0.04;
      }
      box(g, w - 0.1, 0.06, 0.03, 0, 0.72, d / 2 - 0.04, K.walnut, 0.006);
    }
    walnutChair(R, [2.54, 3.04, 5.98, 6.49], 'x+');
    {
      const { g, w, d } = frame(R, [2.78, 3.244, 4.00, 5.68], 'x-');
      box(g, w, 0.15, d - 0.02, 0, 0.6, -0.01, lacq(0xC9C4BC, 0.6, 0), 0.006);
      flutes(g, w, 0.525, 0.675, d / 2 - 0.02, 0.03, 0.01, lacq(0xC9C4BC, 0.6, 0));
      box(g, w + 0.01, 0.025, d, 0, 0.69, 0, phys({ map: stone(0xD6D0C8, 0x8F877D, { seed: 73 }), roughness: 0.2, clearcoat: 0.4 }), 0.004);
    }
    tv(R, { box: [3.17, 3.244, 4.51, 5.50], face: 'x-', w: 0.99, z0: 1.07, z1: 1.66 });
    // wall cabinet over the desk: walnut fluted door, black open shelves
    {
      const { g, w, d } = frame(R, [2.94, 3.244, 5.68, 6.60], 'x-'), z0 = 1.42, H = top(2.49) - z0;
      // local x runs toward plan -y here: open shelves on the +y half (local x < 0)
      box(g, w / 2, H, d, -w / 4, z0 + H / 2, 0, K.black, 0.004);
      for (const k of [1, 2]) box(g, w / 2 - 0.03, 0.018, d - 0.02, -w / 4, z0 + H * k / 3, 0.01, K.walnut, 0.003);
      box(g, w / 2, H, d - 0.02, w / 4, z0 + H / 2, -0.01, K.walnut, 0.004);
      flutes(g, w / 2 - 0.01, z0 + 0.005, z0 + H - 0.005, d / 2 - 0.02, 0.025, 0.008, K.walnut).position.x = w / 4;
      if (2.49 > CUT) cap(g, w, d);
    }
    curtains(R, 'bed1', [[0.86, 9.66], [1.61, 9.66]], { color: 0xD8CEBF, gather: [[0, 1], [1, 0]] });
    return R;
  }

  // ================================================================ Bedroom 3
  // Dark oak floor, a wide grey channel headboard under a backlit wave panel, a
  // five-door grey wardrobe with one sine groove, a white desk on black legs with
  // black shelves, taupe drapes around the window bay.
  function bedroom3() {
    const R = new THREE.Group();
    const oak = phys({ map: wood({ base: 0x5E4A3A, dark: 0x2A1F17, plank: 0.19, length: 1.6, seed: 81, ends: true }), roughness: 0.42, clearcoat: 0.18, clearcoatRoughness: 0.3 });
    floor(R, ring('bed3'), oak);
    // the floor runs on to the window line, where her drapes hang
    floor(R, [[8.569, 13.198], [11.61, 13.198], [11.61, 13.46], [8.569, 13.46], [8.569, 13.198]], oak);
    // wave panel on the bed wall, lit along its crest
    {
      const { g, w } = frame(R, [11.57, 11.61, 9.336, 13.198], 'x-');
      // local x runs toward plan -y: from the bay (north, -w/2) to the desk wall (south)
      const zt = (u) => 1.28 + 0.62 * THREE.MathUtils.smoothstep(u, 0.18, 0.55) - 0.36 * Math.exp(-((u - 0.8) ** 2) / 0.006) + 0.5 * THREE.MathUtils.smoothstep(u, 0.84, 1.0);
      const pts = [[-w / 2, 0]], crest = [];
      for (let i = 0; i <= 80; i++) { const u = i / 80, h = Math.min(CUT - 0.006, zt(u)); pts.push([-w / 2 + u * w, h]); crest.push(new THREE.Vector3(-w / 2 + u * w, h + 0.004, 0.024)); }
      pts.push([w / 2, 0]);
      slab(g, pts, 0.035, 0, lacq(0xB5B0A9, 0.75, 0));
      curve(g, crest.filter(v => v.y < CUT - 0.02), 0.006, K.led);
    }
    {
      const { g, w } = frame(R, [11.46, 11.57, 10.34, 13.19], 'x-');
      channels(g, w, 1.1, 0.1, 0, 0, 0.19, cloth(0xBDB7AF));
    }
    bed(R, { box: [9.49, 11.46, 10.98, 12.82], face: 'x-', base: cloth(0xB4AEA6), baseTop: 0.36, baseR: 0.06,
             plinth: K.black, mattressTop: 0.59, throw: cloth(0x9DA9B6), runner: cloth(0x2E3642), pillows: 2, pillow: cloth(0x2F3743),
             pillows2: K.linen });
    for (const y of [[12.80, 13.18], [10.42, 10.98]])
      bedside(R, { box: [11.14, 11.46, ...y], face: 'x-', z0: 0.28, z1: 0.46, body: lacq(0xECE9E3, 0.45), drawer: 0.1 });
    wardrobe(R, { box: [7.95, 8.569, 10.06, 12.52], face: 'x+', h: 2.46, doors: 5, mat: lacq(0xB9B5AF, 0.5),
                  wave: { y: 1.0, a: 0.13, k: 1.5, p: 0.4 } });
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
    }
    walnutChair(R, [9.63, 10.11, 9.86, 10.32], 'y-');
    // Her drapes follow a window bay beyond the room's line that the flat's shell does
    // not model, so they hang straight across the opening at the end of the side walls.
    curtains(R, 'bed3', [[8.60, 13.44], [11.58, 13.44]], { color: 0xA89A8A, gather: [[0, 1], [1, 0]] });
    return R;
  }

  // ================================================================ Master bedroom
  // Grey marble floor, a full-width cream channel headboard wall with a light line,
  // a king bed on an agate rug, a grey chest of drawers under a backlit mirror, a TV on
  // the partition, a cream four-door wardrobe, and a study lounge by the windows with
  // two leather shell chairs, a desk and a low cabinet.
  function master() {
    const R = new THREE.Group();
    floor(R, ring('master'), phys({ map: marble({ base: 0xDCD9D4, vein: 0xA7A29B, tile: 0.8, veins: 5, seed: 91 }), roughness: 0.16, clearcoat: 0.35, clearcoatRoughness: 0.08 }));
    rug(R, [12.53, 14.05, 9.39, 11.83], phys({ map: stone(0xE7DCCB, 0x6E4A2C, { veins: 11, seed: 92 }), roughness: 0.97 }));
    {
      const { g, w } = frame(R, [11.724, 11.83, 9.22, 12.07], 'x+');
      channels(g, w, 1.25, 0.1, 0, 0, 0.16, cloth(0xDDD3C4));
      box(g, w, 0.012, 0.02, 0, 1.262, -0.02, K.led, 0.002).castShadow = false;
    }
    bed(R, { box: [11.83, 13.62, 9.76, 11.57], face: 'x+', base: cloth(0xD8CEBF), baseTop: 0.34, baseR: 0.09, plinth: K.black,
             mattressTop: 0.58, throw: cloth(0x6B5647), throwD: 0.9, pillows: 2, pillows2: cloth(0xE4DDD0), cushion: cloth(0x7A4E32) });
    for (const y of [[9.25, 9.73], [11.58, 12.06]])
      bedside(R, { box: [11.84, 12.21, ...y], face: 'x+', z0: 0, z1: 0.42, body: lacq(0x8E8B86, 0.5), topMat: K.black, drawer: 0.14 });
    // chest of drawers: sixteen drawers, gold knobs, a brown-grey marble top
    {
      const { g, w, d } = frame(R, [12.76, 14.74, 8.29, 8.79], 'y+'), body = lacq(0xB5B0A8, 0.5);
      box(g, w, 0.08, d - 0.04, 0, 0.04, -0.02, K.black, 0.004);
      box(g, w, 0.8, d - 0.02, 0, 0.48, -0.01, body, 0.004);
      const cols = 4, rows = 4, cw = w / cols, rh = 0.8 / rows;
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        const x = -w / 2 + cw * (i + 0.5), y = 0.08 + rh * (j + 0.5);
        box(g, cw - 0.006, rh - 0.006, 0.018, x, y, d / 2 - 0.009, body, 0.004);
        add(g, new THREE.SphereGeometry(0.014, 12, 8), K.gold, x, y, d / 2 + 0.008);
      }
      box(g, w + 0.01, 0.025, d + 0.01, 0, 0.9, 0, phys({ map: stone(0x857869, 0xD9D0C4, { seed: 93, veins: 8 }), roughness: 0.18, clearcoat: 0.5 }), 0.004);
    }
    // backlit mirror over the chest's east end
    {
      const { g, w } = frame(R, [14.03, 14.67, 8.29, 8.33], 'y+'), z0 = 0.98, H = top(2.39) - z0;
      box(g, w + 0.03, H + 0.03, 0.01, 0, z0 + H / 2, -0.012, K.led, 0.06).castShadow = false;
      box(g, w, H, 0.02, 0, z0 + H / 2, 0, K.mirror, 0.08);
    }
    tv(R, { box: [14.70, 14.772, 9.90, 11.10], face: 'x-', w: 1.2, z0: 0.89, z1: 1.6 });
    wardrobe(R, { box: [11.89, 14.30, 12.55, 13.16], face: 'y-', h: 2.4, doors: 4, mat: lacq(0xEAE5DC, 0.25, 0.4),
                  handle: 'bar', handleMat: K.gold, hl: 0.32, hy: 1.1 });
    // study: white desk on a black pedestal, grey wall cabinet with an open black frame
    {
      const { g, w, d } = frame(R, [14.87, 16.35, 10.01, 10.50], 'y+');
      box(g, w, 0.03, d, 0, 0.745, 0, K.white, 0.006);
      box(g, 0.3, 0.73, d - 0.02, -w / 2 + 0.15, 0.365, -0.01, K.black, 0.006);
      box(g, 0.02, 0.73, d - 0.04, w / 2 - 0.01, 0.365, -0.02, K.white, 0.004);
    }
    {
      const { g, w, d } = frame(R, [14.87, 16.35, 10.01, 10.32], 'y+'), z0 = 1.53, H = top(2.29) - z0;
      const shelfW = 0.39;
      box(g, w - shelfW, H, d, -shelfW / 2, z0 + H / 2, 0, lacq(0x9FA4A6, 0.5), 0.005);
      box(g, 0.003, H - 0.02, 0.004, -shelfW / 2, z0 + H / 2, d / 2 + 0.001, K.groove, 0.001);
      for (const x of [w / 2 - 0.01, w / 2 - shelfW + 0.01]) box(g, 0.012, H, 0.012, x, z0 + H / 2, d / 2 - 0.02, K.blackMetal, 0.003);
      for (const y of [z0 + 0.02, 1.73, 2.04]) if (y < z0 + H) box(g, shelfW - 0.02, 0.02, d - 0.03, w / 2 - shelfW / 2, y, 0, K.walnut, 0.003);
      if (2.29 > CUT) cap(g, w, d);
    }
    walnutChair(R, [15.02, 15.52, 10.36, 10.87], 'y-');
    {
      const { g, w, d } = frame(R, [16.36, 17.44, 10.01, 10.56], 'y+');
      box(g, w, 0.53, d, 0, 0.265, 0, K.white, 0.006);
      box(g, 0.003, 0.49, 0.004, 0, 0.27, d / 2 + 0.001, K.groove, 0.001);
    }
    // lounge: two leather shell chairs turned toward each other, a stone drum table
    const shellSpec = { r: 0.37, seat: 0.36, back: 0.96, open: Math.PI * 1.2, legs: K.walnut, leg: 0.016, seatH: 0.12,
                        seatMat: cloth(0xE6E0D5), shellMat: Object.assign(skin(0x8E5530), { side: THREE.DoubleSide }),
                        lining: Object.assign(cloth(0xE6E0D5), { side: THREE.DoubleSide }), cushion: cloth(0x7A4E32) };
    shellChair(R, [15.34, 16.13, 11.47, 12.30], [0.34, -0.94], shellSpec);
    shellChair(R, [16.54, 17.29, 11.48, 12.30], [-0.34, -0.94], shellSpec);
    {
      const c = W(16.34, 12.06), stoneMat = phys({ color: 0xA9B3B8, roughness: 0.55 });
      add(R, new THREE.LatheGeometry([[0, 0], [0.17, 0], [0.19, 0.04], [0.12, 0.25], [0.19, 0.46], [0.2, 0.5], [0, 0.5]].map(([x, y]) => new THREE.Vector2(x, y)), 40), stoneMat, c.x, 0, c.z);
    }
    curtains(R, 'master', [[14.95, 12.47], [17.62, 12.47], [17.62, 10.05]], { color: 0x7F8784, gather: [[0, 1], [1, 0], [1, 2], [2, 1]] });
    return R;
  }

  const rooms = Object.fromEntries(zone.rooms.map(r => [r.id, r]));
  function ring(id) { return rooms[id].outline; }
  return {
    roots: { bed2: bedroom2(), bed1: bedroom1(), bed3: bedroom3(), master: master() },
    curtainMode: { master: 'side', bed1: 'side', bed2: 'roman', bed3: 'side' },
  };
}
