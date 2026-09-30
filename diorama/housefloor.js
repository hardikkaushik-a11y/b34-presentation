// The flat's own floor, from a photo of it (30 Sep 2026): a beige-taupe marble with
// fleecy white clouds and a web of fine brown crackle veins, some with a red cast, laid
// in 60 x 90 cm slabs with hairline joints. It is not a choice in the configurator.
//
// The stone is drawn per pixel from world position, not from an image, so no slab ever
// repeats: each slab reads its own patch of an endless stone. Detail finer than a pixel
// fades to its average colour, so the floor cannot shimmer when the view moves.
import * as THREE from 'three';

const GLSL = /* glsl */ `
uniform vec3 hBody, hDark, hCloud, hVein, hRed, hJoint;
varying vec3 vHouseW;
float hHash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 hHash2(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float hNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hHash(i), hHash(i + vec2(1.0, 0.0)), u.x), mix(hHash(i + vec2(0.0, 1.0)), hHash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float hFbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { s += a * hNoise(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p + 7.3; a *= 0.5; }
  return s;
}
// distance to the nearest cell border: a crackle network
float hCrackle(vec2 p) {
  vec2 i = floor(p), f = fract(p); float d1 = 9.0, d2 = 9.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y)), r = g + hHash2(i + g) - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
  }
  return sqrt(d2) - sqrt(d1);
}
vec3 houseMarble(vec2 w, out float veinAmt) {
  vec2 S = vec2(0.6, 0.9), id = floor(w / S), loc = w - id * S;
  vec2 q = w + hHash2(id) * 37.0;                           // each slab its own stone
  float px = max(fwidth(w.x), fwidth(w.y));                 // metres per pixel
  // broad, gentle drifts of the taupe body (20-50 cm)
  vec3 col = mix(hDark, hBody, 0.35 + 0.65 * smoothstep(0.3, 0.7, hFbm(q * 2.2)));
  // fleecy white clouds, 3-7 cm, stretched across the slab as in the photo; finer
  // than a pixel they settle to their average cover so distance reads as the real
  // floor does, light beige with a soft mottle
  vec2 wq = q + 0.06 * vec2(hFbm(q * 9.0 + 11.0), hFbm(q * 9.0 + 23.0));
  // two scales of cloudlet knit together, soft-edged, as in the photo
  float field = 0.7 * hFbm(wq * vec2(12.0, 22.0)) + 0.3 * hFbm(wq * vec2(30.0, 55.0) + 3.0);
  float cloud = smoothstep(0.44, 0.62, field + 0.08 * (hFbm(q * 3.0) - 0.5));
  float cover = 0.42 + 0.2 * (hFbm(q * 3.0) - 0.5);
  cloud = mix(cloud, cover, smoothstep(0.006, 0.02, px));
  col = mix(col, hCloud, cloud * 0.8);
  // the crackle web, 5-15 cm cells of fine brown lines, patchy across the stone
  float c1 = hCrackle(wq * 9.0 + hFbm(q * 6.0) * 1.2);
  float web = smoothstep(0.22, 0.5, hFbm(q * 2.5 + 5.0));
  float v1 = (1.0 - smoothstep(0.0, 0.045 + px * 9.0, c1)) * web;
  v1 = mix(v1, web * 0.12, smoothstep(0.003, 0.01, px));  // sub-pixel: a faint warming
  // a few longer veins crossing the slab
  float c2 = hCrackle(q * 1.6 + hFbm(q * 1.5) * 1.2);
  float v2 = (1.0 - smoothstep(0.0, 0.016 + px * 1.6, c2)) * smoothstep(0.45, 0.7, hFbm(q * 0.9 + 2.0));
  v2 *= 1.0 - smoothstep(0.012, 0.04, px) * 0.8;
  veinAmt = clamp(v1 * 0.85 + v2, 0.0, 1.0);
  vec3 vein = mix(hVein, hRed, smoothstep(0.55, 0.8, hNoise(q * 3.0 + 9.0)) * 0.6);
  col = mix(col, vein, veinAmt * 0.8);
  col *= 0.97 + 0.06 * hHash(id + 3.1);                     // slab to slab, a little
  // hairline joints, never heavier than a pixel's worth
  float e = min(min(loc.x, S.x - loc.x), min(loc.y, S.y - loc.y)), jw = max(0.0015, px * 0.75);
  col = mix(col, hJoint, (1.0 - smoothstep(jw * 0.5, jw, e)) * clamp(0.0015 / jw, 0.25, 1.0) * 0.8);
  return col;
}
`;

// colours from the photo (body, darker drift, clouds, veins), set so that under the
// model's sun, which lands on every floor because the ceiling is cut away, the stone
// renders at the photo's brightness: a clear step darker than the white walls
const COLORS = { hBody: 0x837B71, hDark: 0x766D62, hCloud: 0xADA89F, hVein: 0x5D4D3D, hRed: 0x6E473C, hJoint: 0x665E52 };

export function houseMarble(m) {
  const u = Object.fromEntries(Object.entries(COLORS).map(([k, h]) => [k, { value: new THREE.Color(h) }]));
  // honed, as in the photo: a soft sheen, not a mirror, so bright rooms (whose
  // reflections come from her renders) do not wash the stone out to white
  Object.assign(m, { map: null, normalMap: null, metalness: 0, roughness: 0.42, clearcoat: 0.06, clearcoatRoughness: 0.3, sheen: 0, envMapIntensity: 0.55 });
  m.color.set(0xffffff);
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = 'varying vec3 vHouseW;\n' + sh.vertexShader
      .replace('#include <project_vertex>', '#include <project_vertex>\nvHouseW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = GLSL + sh.fragmentShader
      .replace('#include <map_fragment>', '#include <map_fragment>\nfloat hVeinAmt;\ndiffuseColor.rgb *= houseMarble(vHouseW.xz, hVeinAmt);')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor + hVeinAmt * 0.18, 0.0, 1.0);');
  };
  m.customProgramCacheKey = () => 'house-marble';
  m.userData.houseFloor = true;
  // a copy must stay marble: the bedrooms' knee-height cutaway copies every material,
  // and a plain clone would drop this shader and paint the floor white
  m.clone = function () { return houseMarble(Object.getPrototypeOf(this).clone.call(this)); };
  m.needsUpdate = true;
  return m;
}
export const HOUSE_SWATCH = '../assets/diorama/reference/house-floor.jpg';
