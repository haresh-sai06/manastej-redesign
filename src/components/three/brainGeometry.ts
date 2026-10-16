import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// Deterministic 3D value noise (no deps).
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
function fbm(x: number, y: number, z: number) {
  return vnoise(x, y, z) * 0.6 + vnoise(x * 2.1, y * 2.1, z * 2.1) * 0.3 + vnoise(x * 4.3, y * 4.3, z * 4.3) * 0.1;
}
/**
 * Gyri & sulci: zero-set of a domain-warped noise field becomes a network of narrow grooves
 * (sulci); everything else stays rounded (gyri). Returns groove depth 0..1.
 */
function sulci(x: number, y: number, z: number) {
  const wx = fbm(x * 1.3 + 11, y * 1.3, z * 1.3) * 0.55;
  const wy = fbm(x * 1.3, y * 1.3 + 23, z * 1.3) * 0.55;
  const wz = fbm(x * 1.3, y * 1.3, z * 1.3 + 37) * 0.55;
  const n1 = fbm((x + wx) * 3.4, (y + wy) * 4.2, (z + wz) * 2.9); // big folds
  const n2 = fbm((x + wx) * 7.5 + 5, (y + wy) * 8.5, (z + wz) * 6.5); // finer folds
  const g1 = Math.pow(Math.max(0, 1 - Math.abs(n1) * 5.5), 2);
  const g2 = Math.pow(Math.max(0, 1 - Math.abs(n2) * 7), 2) * 0.55;
  return Math.min(1, g1 + g2);
}

const PINK = new THREE.Color("#ffb3c6");
const ROSE = new THREE.Color("#d9587e");
const DEEP = new THREE.Color("#9c2f55");

function lobe(radius: [number, number, number], detail: number, offsetX: number, depth: number, colorBias = 0) {
  const ico = new THREE.IcosahedronGeometry(1, detail);
  ico.deleteAttribute("normal"); ico.deleteAttribute("uv");
  const g = mergeVertices(ico);
  const p = g.attributes.position as THREE.BufferAttribute;
  const col = new Float32Array(p.count * 3);
  const v = new THREE.Vector3(), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    const medial = offsetX !== 0 && Math.sign(v.x) !== Math.sign(offsetX) ? 0.58 + 0.42 * (1 - Math.abs(v.x)) ** 4 : 1;
    const s = sulci(v.x + offsetX * 2, v.y, v.z);
    const d = 1 - depth * s + depth * 0.15 * fbm(v.x * 9, v.y * 9, v.z * 9);
    p.setXYZ(i, v.x * radius[0] * d * medial + offsetX, v.y * radius[1] * d, v.z * radius[2] * d);
    // pink (top/gyri) → rose (lower) → deep rose in sulci, faking cavity occlusion
    c.copy(PINK).lerp(ROSE, Math.min(1, Math.max(0, 0.45 - v.y * 0.45 + colorBias)));
    c.lerp(DEEP, s * 0.75);
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

export function createBrainGeometry(detail = 40) {
  const left = lobe([0.62, 0.8, 1.22], detail, -0.33, 0.085);
  const right = lobe([0.62, 0.8, 1.22], detail, 0.33, 0.085);
  const cere = lobe([0.56, 0.32, 0.42], Math.max(10, detail - 18), 0, 0.05, 0.25);
  cere.translate(0, -0.6, -0.8);
  const stem = new THREE.CylinderGeometry(0.17, 0.12, 1.3, 20, 1, true);
  stem.deleteAttribute("uv");
  const sc = new Float32Array(stem.attributes.position.count * 3);
  for (let i = 0; i < stem.attributes.position.count; i++) sc.set([ROSE.r, ROSE.g, ROSE.b], i * 3);
  stem.setAttribute("color", new THREE.BufferAttribute(sc, 3));
  stem.rotateX(0.3); stem.translate(0, -1.1, -0.3); // short stem: ends at the skull base, not in the neck
  return mergeGeometries([left, right, cere, stem])!;
}
