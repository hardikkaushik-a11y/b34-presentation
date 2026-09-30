// Real products for B-34, as options in the diorama.
//
// From the owner's picks (28 Sep 2026): Kohler vessel basins and Rain Max square
// rainheads per washroom, the supplied patterned balcony floor with its plain tile
// walls and ceiling, the same plain tile throughout Toilet 4, and a highlighter wall
// in the master washroom. Dining sets from two
// reference pins. Sizes are the makers' published sizes; where a listing was
// inconsistent the product name wins (noted beside it).
import * as THREE from 'three';
import { travertine, marble, boucle, fabric, wood, normalFrom } from './textures.js';

export function createProducts(api) {
  const { M, B, zone, W, CX, CY, CUT, mesh, rbox, prism, scene, inRing, inWall } = api;
  const V3 = THREE.Vector3;

  // ---------------------------------------------------------------- materials
  const phys = (o) => new THREE.MeshPhysicalMaterial(o);
  const withRelief = (map, strength, o) => phys({ map, normalMap: normalFrom(map, strength), ...o });
  const MP = {
    ceramic: phys({ color: 0xF6F5F1, roughness: 0.12, clearcoat: 0.7, clearcoatRoughness: 0.06 }),
    chrome: phys({ color: 0xE6E8EB, metalness: 0.85, roughness: 0.3, envMapIntensity: 2 }),
    bronze: phys({ color: 0x8A6545, metalness: 0.85, roughness: 0.34, envMapIntensity: 1.6 }),
    black: phys({ color: 0x1E1E1E, metalness: 0.7, roughness: 0.55 }),
    gold: phys({ color: 0xD2AC62, metalness: 0.85, roughness: 0.22, envMapIntensity: 1.6 }),
    nozzles: phys({ color: 0x2B2B2B, roughness: 0.6 }),
    blackMetal: phys({ color: 0x151515, metalness: 0.65, roughness: 0.42 }),
    // Living Shapes Alici (LS-1087): rust bouclé, legs in a matching matt powder coat
    rustBoucle: withRelief(boucle({ base: 0xB0512B, seed: 76 }), 5, { roughness: 0.95, sheen: 0.5, sheenRoughness: 0.7, sheenColor: new THREE.Color(0xE7A07A) }),
    rustCoat: phys({ color: 0x7E4430, metalness: 0.25, roughness: 0.72 }),
    boucle: withRelief(boucle({ base: 0xD8CEBD, seed: 71 }), 5, { roughness: 0.95, sheen: 0.5, sheenRoughness: 0.7, sheenColor: new THREE.Color(0xF4EEE3) }),
    ivory: withRelief(fabric({ base: 0xE4DCCD, seed: 72 }), 3.5, { roughness: 0.92, sheen: 0.45, sheenRoughness: 0.7, sheenColor: new THREE.Color(0xFBF7EF) }),
    darkWood: withRelief(wood({ base: 0x3E2C21, dark: 0x160F0A, plank: 0.3, length: 1.2, seed: 73 }), 2.5, { roughness: 0.45, clearcoat: 0.15 }),
    walnutTop: withRelief(wood({ base: 0x5B3D29, dark: 0x24160C, plank: 1.2, length: 2.0, seed: 74 }), 2.5, { roughness: 0.38, clearcoat: 0.25, clearcoatRoughness: 0.2 }),
    travertine: withRelief(travertine({ base: 0xDCCBAD, tile: 1.4, seed: 75, joint: false }), 1.2, { roughness: 0.4, clearcoat: 0.15 }),
  };
  const FINISH = { chrome: MP.chrome, bronze: MP.bronze, black: MP.black, gold: MP.gold };

  // ---------------------------------------------------------------- tile textures
  function canvas(w, h = w) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d', { willReadFrequently: true })]; }
  const hex = (c) => '#' + new THREE.Color(c).getHexString();
  function tex(c, uM, vM) {
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.repeat.set(1 / uM, 1 / vM); return t;
  }
  function photoTile(url, uM, vM, mirror = false) {
    const t = new THREE.TextureLoader().load(url, () => api.wake?.(4));
    t.colorSpace = THREE.SRGBColorSpace;
    // Organic wall patterns repeat in one orientation. The balcony's symmetric
    // geometric motif uses a mirrored edge so the photographed crop has no stripe.
    t.wrapS = t.wrapT = mirror ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping;
    t.anisotropy = 8;
    t.repeat.set(1 / uM, 1 / vM);
    return t;
  }
  function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  function speckle(x, N, H, amt, seed) {
    const r = rng(seed), img = x.getImageData(0, 0, N, H), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const k = 1 + (r() - 0.5) * amt; d[i] *= k; d[i + 1] *= k; d[i + 2] *= k; }
    x.putImageData(img, 0, 0);
  }
  // Large-format plain tile, 60 x 120 cm. Keep the face even: the earlier radial
  // clouds read as triangular stains once the texture repeated across a room.
  function plainTile(base, seed = 83) {
    const [c, x] = canvas(256, 512);
    x.fillStyle = hex(base); x.fillRect(0, 0, 256, 512);
    speckle(x, 256, 512, 0.012, seed);
    x.strokeStyle = hex(new THREE.Color(base).multiplyScalar(0.82)); x.lineWidth = 1.25; x.strokeRect(0.75, 0.75, 254.5, 510.5);
    return tex(c, 0.6, 1.2);
  }
  // highlighter slab: one large agate section per 1.2 x 2.4 m panel (after the showroom
  // samples): a crystal core off-centre, warped bands, fine gold veins between them
  function agate(palette, seed) {
    const W_ = 384, H_ = 768, [c, x] = canvas(W_, H_), r = rng(seed), img = x.createImageData(W_, H_), d = img.data;
    const lat = (cells) => { const L = []; for (let i = 0; i < (cells + 1) ** 2; i++) L.push(r()); return (u, v) => {
      const X = u * cells, Y = v * cells, i = Math.floor(X), j = Math.floor(Y), fx = X - i, fy = Y - j, at = (a, b) => L[Math.min(b, cells) * (cells + 1) + Math.min(a, cells)];
      const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), a = at(i, j), b = at(i + 1, j), cc = at(i, j + 1), e = at(i + 1, j + 1);
      return a + (b - a) * sx + (cc - a) * sy + (a - b - cc + e) * sx * sy; }; };
    const n1 = lat(4), n2 = lat(11), core = [0.38 + r() * 0.2, 0.3 + r() * 0.25];
    const P = palette.map(h => new THREE.Color(h)), gold = new THREE.Color(0xD6AE5C), crystal = new THREE.Color(0xF4F1EA);
    for (let j = 0; j < H_; j++) for (let i = 0; i < W_; i++) {
      const u = i / W_, v = j / H_;
      const wu = u + 0.22 * (n1(u, v) - 0.5), wv = v + 0.22 * (n1(v, u) - 0.5);
      const dd = Math.hypot((wu - core[0]) * 1.4, wv - core[1]) + 0.05 * n2(u, v);
      const band = dd * 9, k = Math.floor(band) % P.length, f = band - Math.floor(band);
      const col = P[k].clone().lerp(P[(k + 1) % P.length], f * f * (3 - 2 * f));
      if (f < 0.035 || f > 0.975) col.lerp(gold, 0.9);                       // gold between bands
      if (dd < 0.07) col.lerp(crystal, Math.min(1, (0.07 - dd) * 30) * (0.7 + 0.3 * n2(u * 4, v * 4)));
      const o = (j * W_ + i) * 4;
      d[o] = col.r * 255; d[o + 1] = col.g * 255; d[o + 2] = col.b * 255; d[o + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    speckle(x, W_, H_, 0.05, seed);
    x.strokeStyle = '#141414'; x.lineWidth = 2; x.strokeRect(1, 1, W_ - 2, H_ - 2);
    return tex(c, 1.2, 2.4);
  }
  const tileMat = (map, o = {}) => withRelief(map, 1.2, { roughness: 0.22, clearcoat: 0.35, clearcoatRoughness: 0.1,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2, ...o });
  const photoMat = (map, o = {}) => phys({ map, roughness: 0.48, clearcoat: 0.08, clearcoatRoughness: 0.5,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2, ...o });
  const TILES = {
    // Actual motif extracted and perspective-corrected from the supplied sample.
    // The physical tile size is not confirmed. A 90 cm visual repeat keeps the actual
    // motif legible in the client view while retaining the supplied tile design.
    encaustic: () => phys({ map: photoTile('../assets/diorama/reference/balcony-floor-tile.jpg', 0.9, 0.9, true), color: 0xC9C7C2,
                            roughness: 0.94, clearcoat: 0, envMapIntensity: 0.35, polygonOffset: true,
                            polygonOffsetFactor: -1, polygonOffsetUnits: -2 }),
    plainGrey: () => tileMat(plainTile(0x9A958E, 84), { roughness: 0.46, clearcoat: 0.08, clearcoatRoughness: 0.45 }),
    plainLight: () => photoMat(photoTile('../assets/diorama/reference/light-grey-plain-tile.jpg', 0.6, 1.2)),
    striated: () => photoMat(photoTile('../assets/diorama/reference/t2-highlight-tile.jpg', 0.6, 1.2), { roughness: 0.64, clearcoat: 0.04, clearcoatRoughness: 0.6 }),
    // Keep the historical keys as aliases so old shared links/local state migrate to
    // the supplied Toilet 3 sample instead of reviving the earlier invented agate.
    geode: () => photoMat(photoTile('../assets/diorama/reference/t3-highlight-tile.jpg', 0.6, 1.2)),
    emerald: () => photoMat(photoTile('../assets/diorama/reference/t3-highlight-tile.jpg', 0.6, 1.2)),
    botanical: () => photoMat(photoTile('../assets/diorama/reference/t4-highlight-tile.jpg', 0.6, 1.2)),
  };
  const tileCache = {};
  const tile = (k) => tileCache[k] || (tileCache[k] = TILES[k]());

  // ---------------------------------------------------------------- helpers
  const room = (id) => zone.rooms.find(r => r.id === id);
  function at(p, angle = p.obb.angle) { const g = new THREE.Group(), c = W(p.obb.cx, p.obb.cy); g.position.set(c.x, 0, c.z); g.rotation.y = angle; return g; }
  function facing(p, front) { const g = new THREE.Group(), c = W(p.obb.cx, p.obb.cy); g.position.set(c.x, 0, c.z); g.rotation.y = front ? Math.atan2(front[0], -front[1]) : p.obb.angle; return g; }
  // which way is the wall behind a piece (plan unit vector)
  function wallBehind(o) {
    const n = [-Math.sin(o.angle), Math.cos(o.angle)];
    for (const s of [1, -1]) for (const k of [0.1, 0.22, 0.35]) {
      const q = [o.cx + n[0] * s * (o.d / 2 + k), o.cy + n[1] * s * (o.d / 2 + k)];
      if (inWall(q) || !zone.rooms.some(r => inRing(q, r.outline))) return [n[0] * s, n[1] * s];
    }
    return [-n[0], -n[1]];
  }
  function segDist([px, py], [ax, ay], [bx, by]) {
    const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy, t = L ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L)) : 0;
    return Math.hypot(px - ax - t * dx, py - ay - t * dy);
  }
  const edgeDist = (pt, ring) => Math.min(...ring.slice(0, -1).map((a, i) => segDist(pt, a, ring[i + 1])));
  // soft extruded outline: `pts` in the XZ plane (local), extruded up by h
  function extrudeUp(shape, h, bevel = 0) {
    const g = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3, curveSegments: 24 });
    g.rotateX(-Math.PI / 2);            // shape (x, y) -> (x, z = -y); extrusion -> +y
    return g;
  }
  function roundedRect(w, d, r, shape = new THREE.Shape()) {
    const x = -w / 2, y = -d / 2;
    shape.moveTo(x + r, y); shape.lineTo(x + w - r, y); shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + d - r); shape.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
    shape.lineTo(x + r, y + d); shape.quadraticCurveTo(x, y + d, x, y + d - r);
    shape.lineTo(x, y + r); shape.quadraticCurveTo(x, y, x + r, y);
    return shape;
  }
  function superEllipse(a, b, n = 2.6, steps = 96) {
    const s = new THREE.Shape();
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2, c = Math.cos(t), si = Math.sin(t);
      const x = a * Math.sign(c) * Math.abs(c) ** (2 / n), y = b * Math.sign(si) * Math.abs(si) ** (2 / n);
      i ? s.lineTo(x, y) : s.moveTo(x, y);
    }
    return s;
  }
  // a column with vertical ribs (the fluted pedestals in both reference pins)
  function fluted(rx, rz, h, ribs = 28, depth = 0.04) {
    const g = new THREE.CylinderGeometry(1, 1, h, ribs * 6, 1, false);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), r = Math.hypot(x, z);
      if (r < 1e-6) continue;
      const k = 1 - depth * (0.5 + 0.5 * Math.cos(a * ribs));
      p.setX(i, Math.cos(a) * rx * k); p.setZ(i, Math.sin(a) * rz * k);
    }
    g.computeVertexNormals(); g.translate(0, h / 2, 0);
    return g;
  }

  // ---------------------------------------------------------------- builders
  const BUILD = {
    // Round travertine table on a fluted column (pin 1). 1.40 m seats six.
    travertine_round(p) {
      const g = at(p, 0);
      const top = mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.045, 96), MP.travertine, 0, 0.7525, 0); g.add(top);
      g.add(mesh(fluted(0.23, 0.23, 0.73, 26, 0.06), MP.travertine));
      return g;
    },
    // Long oval walnut table on a ribbed oval pedestal (pin 2), on her footprint.
    walnut_oval(p) {
      const g = at(p), a = Math.max(p.obb.w, p.obb.d) / 2, b = Math.min(p.obb.w, p.obb.d) / 2;
      const top = mesh(extrudeUp(superEllipse(a, b), 0.035, 0.008), MP.walnutTop, 0, 0.73, 0); g.add(top);
      g.add(mesh(fluted(a * 0.42, b * 0.36, 0.73, 34, 0.05), MP.darkWood));
      return g;
    },
    // Bouclé chair with a rounded back on a slim black metal frame (pin 1, "Sfera MM" style)
    boucle_black(p) {
      const g = facing(p, p.facing), leg = 0.44;
      for (const [x, z] of [[-0.2, 0.19], [0.2, 0.19], [-0.19, -0.18], [0.19, -0.18]])
        g.add(mesh(new THREE.CylinderGeometry(0.011, 0.011, leg, 12), MP.blackMetal, x, leg / 2, z));
      g.add(mesh(rbox(0.5, 0.085, 0.46, 0.04), MP.boucle, 0, 0.47, 0.02));
      // the rounded back: a band of an arc, upholstered, wrapping the rear of the seat
      const R = 0.27, span = THREE.MathUtils.degToRad(150), s = new THREE.Shape();
      const a0 = Math.PI / 2 - span / 2, a1 = Math.PI / 2 + span / 2;
      s.absarc(0, 0, R, a0, a1, false); s.absarc(0, 0, R - 0.055, a1, a0, true);
      g.add(mesh(extrudeUp(s, 0.23, 0.02), MP.boucle, 0, 0.53, 0.02));
      const hoop = mesh(new THREE.TorusGeometry(R + 0.005, 0.009, 8, 40, span), MP.blackMetal, 0, 0.62, 0.02);
      hoop.rotation.set(-Math.PI / 2, 0, a0); g.add(hoop);
      return g;
    },
    // Living Shapes Alici, from the maker's spec sheet (LS-1087): 52.7 W x 57.2 D x
    // 84.5 H cm, seat 49.5 cm high with a 7.6 cm cushion, back 38 cm above the seat,
    // legs on a 38 cm square. Rust bouclé over a rounded shell back that wraps the
    // seat; round legs in the same rust, matt powder coated.
    alici(p) {
      const g = facing(p, p.facing), leg = 0.42, foot = 0.19;
      for (const [x, z] of [[-foot, foot], [foot, foot], [-foot, -foot], [foot, -foot]]) {
        const l = mesh(new THREE.CylinderGeometry(0.011, 0.01, leg, 12), MP.rustCoat, x, leg / 2, z);
        l.rotation.set(Math.sign(z) * 0.03, 0, -Math.sign(x) * 0.03); g.add(l);
      }
      for (const x of [-foot, foot]) g.add(mesh(new THREE.BoxGeometry(0.018, 0.018, 2 * foot), MP.rustCoat, x, leg - 0.01, 0));
      g.add(mesh(rbox(0.5, 0.076, 0.44, 0.035), MP.rustBoucle, 0, 0.457, 0.05));
      // the shell back: an upholstered band on a 150 degree arc, its top rolled
      const R = 0.26, span = THREE.MathUtils.degToRad(150), t = 0.06, s = new THREE.Shape();
      const a0 = Math.PI / 2 - span / 2, a1 = Math.PI / 2 + span / 2, h = 0.845 - 0.03 - 0.42;
      s.absarc(0, 0, R, a0, a1, false); s.absarc(0, 0, R - t, a1, a0, true);
      g.add(mesh(extrudeUp(s, h, 0.012), MP.rustBoucle, 0, 0.42, 0.03));
      const roll = mesh(new THREE.TorusGeometry(R - t / 2, t / 2, 10, 40, span), MP.rustBoucle, 0, 0.42 + h, 0.03);
      roll.rotation.set(-Math.PI / 2, 0, a0); g.add(roll);
      return g;
    },
    // Ivory upholstered chair on a dark wood frame (pin 2)
    ivory_walnut(p) {
      const g = facing(p, p.facing);
      for (const [x, z] of [[-0.2, 0.2], [0.2, 0.2]]) g.add(mesh(new THREE.CylinderGeometry(0.016, 0.012, 0.45, 12), MP.darkWood, x, 0.225, z));
      for (const x of [-0.2, 0.2]) { const post = mesh(new THREE.CylinderGeometry(0.016, 0.013, 0.9, 12), MP.darkWood, x, 0.45, -0.2); post.rotation.x = -0.1; g.add(post); }
      g.add(mesh(rbox(0.47, 0.09, 0.47, 0.035), MP.ivory, 0, 0.475, 0.01));
      const back = mesh(rbox(0.43, 0.36, 0.06, 0.03), MP.ivory, 0, 0.72, -0.21); back.rotation.x = -0.1; g.add(back);
      g.add(mesh(new THREE.BoxGeometry(0.44, 0.03, 0.03), MP.darkWood, 0, 0.9, -0.245));
      return g;
    },
    // Kohler vessel basins, on her counter, with a wall-mounted spout
    mica: (p) => vessel(p, 'mica'),
    edge: (p) => vessel(p, 'edge'),
    rain_shower(p) {
      const g = at(p, 0), s = p.size, fin = FINISH[p.finish] || MP.chrome, y = 2.03;
      g.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, CUT - y + 0.02, 12), fin, 0, (CUT + y) / 2, 0));
      g.add(mesh(rbox(s, 0.012, s, 0.006), fin, 0, y - 0.006, 0));
      const face = mesh(new THREE.BoxGeometry(s * 0.9, 0.001, s * 0.9), MP.nozzles, 0, y - 0.0125, 0); face.castShadow = false; g.add(face);
      // the mixer on the nearest wall, at hand height
      const [bx, by] = p.wall, wc = W(p.obb.cx + bx * p.wallDist, p.obb.cy + by * p.wallDist).sub(W(p.obb.cx, p.obb.cy));
      const plate = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.012, 40), fin, wc.x - bx * 0.008, 1.1, wc.z + by * 0.008);
      plate.quaternion.setFromUnitVectors(new V3(0, 1, 0), new V3(bx, 0, -by).normalize());   // flat against the wall
      g.add(plate);
      return g;
    },
  };
  function counterTop(p) {
    const under = zone.pieces.find(q => q.home === p.home && ['unit', 'vanity', 'counter'].includes(q.type) &&
      Math.hypot(q.obb.cx - p.obb.cx, q.obb.cy - p.obb.cy) < 0.3);
    return !under ? 0.8 : under.type === 'vanity' ? 0.83 : zone.counter.carcass + zone.counter.top;
  }
  function vessel(p, kind) {
    const o = p.obb, back = wallBehind(o), g = facing(p, [-back[0], -back[1]]), y0 = counterTop(p);
    const [w, d, h, r, t] = kind === 'mica' ? [0.393, 0.393, 0.15, 0.006, 0.007] : [0.6, 0.4, 0.133, 0.09, 0.006];
    const outer = roundedRect(w, d, r), wall = roundedRect(w, d, r);
    wall.holes.push(roundedRect(w - 2 * t, d - 2 * t, Math.max(0.002, r - t)));
    g.add(mesh(extrudeUp(wall, h), MP.ceramic, 0, y0, 0.02));
    g.add(mesh(extrudeUp(outer, 0.012), MP.ceramic, 0, y0, 0.02));
    g.add(mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.004, 24), MP.chrome, 0, y0 + 0.014, 0.02));
    // wall spout (no tap holes in either basin): from the wall, over the bowl
    const zWall = -o.d / 2 - 0.02, zTip = 0.02 - d * 0.18, ys = y0 + h + 0.12;
    const spout = mesh(new THREE.CylinderGeometry(0.011, 0.011, zTip - zWall, 16), MP.chrome, 0, ys, (zWall + zTip) / 2);
    spout.rotation.x = Math.PI / 2; g.add(spout);
    g.add(mesh(new THREE.BoxGeometry(0.07, 0.07, 0.012), MP.chrome, 0, ys, zWall + 0.006));
    return g;
  }

  // ---------------------------------------------------------------- the choices
  const kohler = (code, price) => ({ brand: 'Kohler', code, price });
  const GROUPS = [
    { key: 'table', label: 'Dining table', rooms: ['dining', 'living', 'kitchen', 'entrance'], options: [
      { id: 'drawn', name: 'Walnut, rectangular', note: 'as drawn, 183 × 107 cm' },
      { id: 'walnut_oval', name: 'Walnut oval, ribbed base', note: 'reference pin 2' },
      { id: 'travertine_round', name: 'Travertine round, fluted', note: '140 cm, reference pin 1' }] },
    { key: 'chair', label: 'Dining chairs', rooms: ['dining', 'living', 'kitchen', 'entrance'], options: [
      { id: 'drawn', name: 'Linen, walnut', note: 'as drawn' },
      { id: 'boucle_black', name: 'Bouclé, black metal', note: 'Sfera MM style, pin 1' },
      { id: 'ivory_walnut', name: 'Ivory, dark wood', note: 'reference pin 2' },
      { id: 'alici', name: 'Alici, rust bouclé', note: 'Living Shapes · ₹6,399', brand: 'Living Shapes', code: 'LS-1087', price: 6399,
        url: 'https://livingshapes.in/products/boucle-alici-dining-chair-with-metal' }] },
    ...['tlt1', 'tlt2', 'tlt3', 'tlt4'].flatMap(t => [
      { key: `basin.${t}`, label: 'Basin', rooms: [t], options: [
        { id: 'mica', name: 'Kohler Mica vessel', note: '39 cm square · ₹16,799', ...kohler('K-90011T-0', 16799) },
        { id: 'edge', name: 'Kohler ModernLife Edge', note: '60 × 40 cm · ₹21,599', ...kohler('K-21226IN-SS-0', 21599) }] },
      { key: `shower.${t}`, label: 'Rain shower', rooms: [t], options: [
        { id: '254', name: 'Rain Max 25.4 cm', note: 'square · ₹15,699', ...kohler('K-26855IN', 15699) },
        { id: '305', name: 'Rain Max 30.5 cm', note: 'square · ₹18,859', ...kohler('K-26856IN', 18859) }] },
      { key: `finish.${t}`, label: 'Shower finish', rooms: [t], options: [
        { id: 'chrome', name: 'Polished chrome' }, { id: 'bronze', name: 'Brushed bronze' },
        { id: 'black', name: 'Matte black' }, { id: 'gold', name: 'French gold' }] },
    ]),
    { key: 't2walls', label: 'Walls', rooms: ['tlt2'], options: [
      { id: 'plain', name: 'Vertical highlight + plain', note: 'supplied Toilet 2 tiles' }] },
    { key: 't3walls', label: 'Walls', rooms: ['tlt3'], options: [
      { id: 'geode', name: 'Geometric highlight + plain', note: 'supplied Toilet 3 tiles' }] },
    { key: 'balconyFloor', label: 'Balcony floor', rooms: ['balcony'], options: [
      { id: 'patterned', name: 'Grey heritage motif', note: 'supplied design tile' },
      { id: 'plain', name: 'Same as the flat' }] },
    { key: 'balconyWall', label: 'Balcony walls and ceiling', rooms: ['balcony'], options: [
      { id: 'plain', name: 'Warm grey textured tile', note: 'supplied plain tile' },
      { id: 'paint', name: 'Paint, like the rest' }] },
    { key: 't4tiles', label: 'Walls, floor and ceiling', rooms: ['tlt4'], options: [
      { id: 'plain', name: 'Botanical highlight + plain', note: 'supplied Toilet 4 tiles' }] },
  ];
  // the owner's picks are the starting point
  const DEFAULTS = { table: 'drawn', chair: 'drawn', t2walls: 'plain', t3walls: 'geode', balconyFloor: 'patterned', balconyWall: 'plain', t4tiles: 'plain',
    'basin.tlt1': 'mica', 'basin.tlt2': 'mica', 'basin.tlt3': 'mica', 'basin.tlt4': 'edge',
    'shower.tlt1': '254', 'shower.tlt2': '305', 'shower.tlt3': '305', 'shower.tlt4': '254',
    'finish.tlt1': 'chrome', 'finish.tlt2': 'chrome', 'finish.tlt3': 'chrome', 'finish.tlt4': 'bronze' };

  // ---------------------------------------------------------------- placement
  const pivots = () => api.pieceGroups;
  function rebuild(pivot, build) {
    const p = pivot.userData.piece, inner = pivot.children[0];
    for (const c of [...inner.children]) inner.remove(c);
    const g = build(p);
    g.traverse(o => { o.userData.piece = p; });
    inner.add(g);
  }
  // one rain shower per washroom, where the room leaves the most space away from the
  // WC and the basin, at least 45 cm from every wall (her plan does not mark it)
  const showers = {};
  for (const t of ['tlt1', 'tlt2', 'tlt3', 'tlt4']) {
    const r = room(t); if (!r) continue;
    const ring = r.outline, avoid = zone.pieces.filter(q => q.home === t && ['wc', 'basin', 'vanity'].includes(q.type)).map(q => [q.obb.cx, q.obb.cy]);
    const xs = ring.map(q => q[0]), ys = ring.map(q => q[1]);
    let best = null;
    for (let x = Math.min(...xs); x <= Math.max(...xs); x += 0.05) for (let y = Math.min(...ys); y <= Math.max(...ys); y += 0.05) {
      const pt = [x, y];
      if (!inRing(pt, ring) || edgeDist(pt, ring) < 0.45) continue;
      const score = Math.min(...avoid.map(a => Math.hypot(a[0] - x, a[1] - y)));
      if (!best || score > best.score) best = { pt, score };
    }
    if (!best) continue;
    // The shower's wall: the nearest full-length wall; in a corner (two walls within
    // 5 cm of each other) the longer one, the backdrop behind the shower. It carries
    // the mixer and is the washroom's designer wall.
    const cands = ring.slice(0, -1).map((a, i) => ({ i, d: segDist(best.pt, a, ring[i + 1]), len: Math.hypot(ring[i + 1][0] - a[0], ring[i + 1][1] - a[1]) })).filter(e => e.len >= 0.5);
    const dmin = Math.min(...cands.map(e => e.d));
    const pick = cands.filter(e => e.d <= dmin + 0.05).sort((a, b) => b.len - a.len)[0];
    const [a, b] = [ring[pick.i], ring[pick.i + 1]], wd = pick.d, L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let wall = [-(b[1] - a[1]) / L, (b[0] - a[0]) / L];
    if (inRing([best.pt[0] + wall[0] * 0.05, best.pt[1] + wall[1] * 0.05], ring) && wd > 0.06) wall = [-wall[0], -wall[1]];
    const p = { id: `shower-${t}`, type: 'rain_shower', name: 'Rain shower', home: t, room: t, fixture: true, movable: false,
                obb: { cx: best.pt[0], cy: best.pt[1], w: 0.3, d: 0.3, angle: 0 }, footprint: [], wall, wallDist: wd, wallEdge: pick.i, size: 0.254, finish: 'chrome' };
    B.rain_shower = BUILD.rain_shower;
    showers[t] = api.placePiece(p);
  }
  // tiles: cladding panels on chosen walls and a floor inlay, per room
  function panels(ringId, edges, matFor, key) {
    const g = new THREE.Group(); g.userData.cladding = true; g.userData.room = ringId; g.userData.product = key;
    const ring = room(ringId).outline;
    for (const i of edges) {
      const a = ring[i], b = ring[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (len < 0.12) continue;
      const dx = (b[0] - a[0]) / len, dy = (b[1] - a[1]) / len; let n = [-dy, dx];
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      if (!inRing([mid[0] + n[0] * 0.05, mid[1] + n[1] * 0.05], ring)) n = [-n[0], -n[1]];
      const geo = new THREE.PlaneGeometry(len, CUT);
      const uv = geo.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * len, uv.getY(k) * CUT);
      geo.translate(0, CUT / 2, 0);
      const m = mesh(geo, matFor(i));
      const p = W(mid[0] + n[0] * 0.004, mid[1] + n[1] * 0.004); m.position.copy(p);
      m.rotation.y = Math.atan2(n[0], -n[1]);           // face into the room
      m.userData.wall = { z0: 0, z1: CUT, cx: mid[0], cy: mid[1] };
      g.add(m);
    }
    return g;
  }
  function inlay(ringId, mat) {
    const r = room(ringId), m = prism(r.outline, [], -0.004, -0.001, mat);
    m.castShadow = false; return m;
  }
  function cladMasonry(group, ringId, mat) {
    for (const w of room(ringId).walls || []) {
      if (!w.kind?.includes('masonry')) continue;
      const m = prism(w.outer, w.holes || [], w.z0, w.z1, mat, mat);
      const cx = w.outer.reduce((a, q) => a + q[0], 0) / w.outer.length;
      const cy = w.outer.reduce((a, q) => a + q[1], 0) / w.outer.length;
      m.userData.wall = { z0: w.z0, z1: w.z1, cx, cy, kind: w.kind, outer: w.outer };
      group.add(m);
    }
  }
  function tiledCeiling(group, ringId, mat) {
    const m = prism(room(ringId).outline, [], 2.82, 2.84, mat, mat);
    m.castShadow = false;
    m.userData.ceiling = true;
    group.add(m);
  }
  const tileGroups = {};
  function setTiles(key, group) {
    if (tileGroups[key]) scene.remove(tileGroups[key]);
    tileGroups[key] = group;
    if (group) scene.add(group);
  }
  const nearEdges = (ringId, otherId, within) => {
    const ring = room(ringId).outline, other = room(otherId).outline, out = [];
    for (let i = 0; i < ring.length - 1; i++) {
      const mid = [(ring[i][0] + ring[i + 1][0]) / 2, (ring[i][1] + ring[i + 1][1]) / 2];
      if (edgeDist(mid, other) < within) out.push(i);
    }
    return out;
  };
  // the designer wall is the wall the shower stands against (the one carrying its
  // mixer): the nearest full-length wall to the shower
  function showerFeatureEdge(ringId) {
    const sh = showers[ringId]?.userData.piece;
    return sh && Number.isInteger(sh.wallEdge) ? sh.wallEdge : basinFeatureEdge(ringId);
  }
  function basinFeatureEdge(ringId) {
    const ring = room(ringId).outline;
    const basin = zone.pieces.find(q => q.home === ringId && q.type === 'basin');
    if (!basin) return 0;
    let feature = 0, fd = Infinity;
    for (let i = 0; i < ring.length - 1; i++) {
      const d = segDist([basin.obb.cx, basin.obb.cy], ring[i], ring[i + 1]);
      if (d < fd) { fd = d; feature = i; }
    }
    return feature;
  }

  // ---------------------------------------------------------------- apply
  let applied = {};
  function apply(sel) {
    const s = { ...DEFAULTS, ...sel };
    for (const g of pivots()) {
      const p = g.userData.piece;
      if (p.type === 'dining_table' && applied.table !== s.table) { rebuild(g, s.table === 'drawn' ? B.dining_table : BUILD[s.table]); p.name = GROUPS[0].options.find(o => o.id === s.table).name + ' table'; }
      if (p.type === 'dining_chair' && applied.chair !== s.chair) { rebuild(g, s.chair === 'drawn' ? B.dining_chair : BUILD[s.chair]); p.name = 'Dining chair, ' + GROUPS[1].options.find(o => o.id === s.chair).name.toLowerCase(); }
      if (p.type === 'basin' && ['tlt1', 'tlt2', 'tlt3', 'tlt4'].includes(p.home)) {
        const k = s[`basin.${p.home}`];
        if (applied[`basin.${p.home}`] !== k) { rebuild(g, BUILD[k]); p.name = k === 'mica' ? 'Kohler Mica vessel basin' : 'Kohler ModernLife Edge vessel basin'; }
      }
    }
    for (const [t, g] of Object.entries(showers)) {
      const size = s[`shower.${t}`], fin = s[`finish.${t}`];
      if (applied[`shower.${t}`] === size && applied[`finish.${t}`] === fin) continue;
      const p = g.userData.piece; p.size = size === '305' ? 0.305 : 0.254; p.finish = fin;
      p.name = `Kohler Rain Max square ${size === '305' ? '30.5' : '25.4'} cm, ${GROUPS.find(q => q.key === `finish.${t}`).options.find(o => o.id === fin).name.toLowerCase()}`;
      rebuild(g, BUILD.rain_shower);
    }
    if (applied.t2walls !== s.t2walls) {
      const ring = room('tlt2').outline, feature = showerFeatureEdge('tlt2');
      const g = panels('tlt2', ring.slice(0, -1).map((_, i) => i), (i) => i === feature ? tile('striated') : tile('plainLight'), 't2walls');
      g.add(inlay('tlt2', tile('plainLight')));
      setTiles('t2walls', g);
    }
    if (applied.t3walls !== s.t3walls) {
      const t3 = scene.children.find(o => o.userData.cladding && o.userData.room === 'tlt3' && !o.userData.product);
      if (s.t3walls === 'marble') { if (t3) t3.userData.off = false; setTiles('t3', null); }
      else {
        if (t3) { t3.userData.off = true; t3.visible = false; }
        const ring = room('tlt3').outline, feature = showerFeatureEdge('tlt3');
        const g = panels('tlt3', ring.slice(0, -1).map((_, i) => i), (i) => i === feature ? tile(s.t3walls) : tile('plainLight'), 't3');
        g.add(inlay('tlt3', tile('plainLight')));
        setTiles('t3', g);
      }
    }
    if (applied.balconyFloor !== s.balconyFloor || applied.balconyWall !== s.balconyWall) {
      const g = new THREE.Group(); g.userData.cladding = true; g.userData.room = 'balcony'; g.userData.product = 'balcony';
      if (s.balconyFloor === 'patterned') g.add(inlay('balcony', tile('encaustic')));
      if (s.balconyWall === 'plain') { cladMasonry(g, 'balcony', tile('plainGrey')); tiledCeiling(g, 'balcony', tile('plainGrey')); }
      setTiles('balcony', g);
    }
    if (applied.t4tiles !== s.t4tiles) {
      const ring = room('tlt4').outline, feature = showerFeatureEdge('tlt4');
      const g = panels('tlt4', ring.slice(0, -1).map((_, i) => i), (i) => i === feature ? tile('botanical') : tile('plainGrey'), 't4tiles');
      g.add(inlay('tlt4', tile('plainGrey')));
      tiledCeiling(g, 'tlt4', tile('plainGrey'));
      setTiles('t4tiles', g);
    }
    applied = s;
    for (const g of Object.values(tileGroups)) if (g) g.visible = !api.focused || (api.focused.members || [api.focused.id]).includes(g.userData.room);
    api.recut?.(); api.dirtyShadows();
  }
  // chairs around a round table, facing its centre, in place of her positions
  function roundChairPoses(tablePiece, chairs) {
    const R = 0.7 + 0.16, c = [tablePiece.obb.cx, tablePiece.obb.cy], n = chairs.length;
    return chairs.map((p, i) => {
      const a = (i / n) * Math.PI * 2 + Math.PI / n, cx = c[0] + Math.cos(a) * R, cy = c[1] + Math.sin(a) * R;
      const want = Math.atan2(c[1] - cy, c[0] - cx), had = Math.atan2(p.facing?.[1] ?? 0, p.facing?.[0] ?? 1);
      return { cx, cy, angle: p.obb.angle + (want - had) };
    });
  }
  // a stand-in piece for thumbnails
  function thumbPiece(key, id) {
    if (key === 'table') return { p: { id: 'th', type: 'dining_table', obb: { cx: CX, cy: CY, w: 1.83, d: 1.07, angle: 0 }, footprint: rectRing(1.83, 1.07) }, build: id === 'drawn' ? B.dining_table : BUILD[id] };
    if (key === 'chair') return { p: { id: 'th', type: 'dining_chair', obb: { cx: CX, cy: CY, w: 0.5, d: 0.5, angle: 0 }, facing: [0.6, -1] }, build: id === 'drawn' ? B.dining_chair : BUILD[id] };
    if (key.startsWith('basin')) return { p: { id: 'th', type: 'basin', home: 'none', obb: { cx: CX, cy: CY, w: 0.6, d: 0.45, angle: 0 } }, build: BUILD[id] };
    if (key.startsWith('shower') || key.startsWith('finish')) return { p: { id: 'th', type: 'rain_shower', obb: { cx: CX, cy: CY, w: .3, d: .3, angle: 0 }, wall: [0, 1], wallDist: 0.4, size: id === '305' ? 0.305 : 0.254, finish: key.startsWith('finish') ? id : 'chrome' }, build: BUILD.rain_shower };
    return null;
  }
  function rectRing(w, d) { const x0 = CX - w / 2, y0 = CY - d / 2; return [[x0, y0], [x0 + w, y0], [x0 + w, y0 + d], [x0, y0 + d], [x0, y0]]; }
  const tileSwatch = { geode: 'geode', emerald: 'geode', marble: null, patterned: 'encaustic', plain: 'plainGrey', botanical: 'botanical', striated: 'striated' };
  return { GROUPS, DEFAULTS, apply, roundChairPoses, thumbPiece, tile, tileSwatch, MP };
}
