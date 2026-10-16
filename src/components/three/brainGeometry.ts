import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// Small deterministic 3D value noise (no deps).
function hash(x: number, y: number, z: number) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise(x: number, y: number, z: number) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (dx: number, dy: number, dz: number) => hash(xi + dx, yi + dy, zi + dz);
  return l(
    l(l(c(0, 0, 0), c(1, 0, 0), u), l(c(0, 1, 0), c(1, 1, 0), u), v),
    l(l(c(0, 0, 1), c(1, 0, 1), u), l(c(0, 1, 1), c(1, 1, 1), u), v),
    w,
  ) * 2 - 1;
}
// Ridged multi-octave noise → sharp sulci between rounded gyri
function folds(x: number, y: number, z: number) {
  let f = 0, amp = 0.65, fr = 4.2;
  for (let o = 0; o < 2; o++) {
    const n = 1 - Math.abs(vnoise(x * fr, y * fr * 1.3, z * fr * 0.8));
    f += Math.pow(n, 3) * amp;
    amp *= 0.4; fr *= 2.2;
  }
  return f;
}

function lobe(radius: [number, number, number], detail: number, offsetX: number, depth: number) {
  const ico = new THREE.IcosahedronGeometry(1, detail);
  ico.deleteAttribute("normal"); ico.deleteAttribute("uv");
  const g = mergeVertices(ico);
  const p = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    // flatten the medial face of each hemisphere
    const medial = offsetX !== 0 && Math.sign(v.x) !== Math.sign(offsetX) ? 0.55 : 1;
    const d = 1 + depth * (folds(v.x + offsetX * 3, v.y, v.z) - 0.35);
    p.setXYZ(i, v.x * radius[0] * d * medial + offsetX, v.y * radius[1] * d, v.z * radius[2] * d);
  }
  g.computeVertexNormals();
  return g;
}

export function createBrainGeometry(detail = 24) {
  const left = lobe([0.62, 0.78, 1.2], detail, -0.34, 0.12);
  const right = lobe([0.62, 0.78, 1.2], detail, 0.34, 0.12);
  const cere = lobe([0.55, 0.32, 0.4], Math.max(8, detail - 10), 0, 0.06);
  cere.translate(0, -0.62, -0.78);
  const stem = new THREE.CylinderGeometry(0.16, 0.11, 0.7, 16);
  stem.rotateX(0.35); stem.translate(0, -0.85, -0.35);
  stem.deleteAttribute("uv");
  return mergeGeometries([left, right, cere, stem])!;
}
