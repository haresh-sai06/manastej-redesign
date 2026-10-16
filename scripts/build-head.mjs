// Builds public/models/head.glb from the CC0 "Human Head Basemesh" (male) by pistachio
// https://opengameart.org/content/2-human-head-basemeshes (CC0 1.0).
// Download human_head_basemesh_male.obj next to this script, then:
//   npm i three three-subdivide @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions meshoptimizer
//   node build-head.mjs   (env: LEVELS=3 SMOOTH=12 CUT_Y=1.535 QP=16 ML=high)
// Pipeline: weld → 3x Loop subdivision (on the full bust, so the neck stays round) →
// clip triangles exactly against a horizontal plane under the jaw → close the cut with a flat cap →
// quantize (16-bit positions) + meshopt.
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { LoopSubdivision } from "three-subdivide";
import { Document, NodeIO } from "@gltf-transform/core";
import { EXTMeshoptCompression, KHRMeshQuantization } from "@gltf-transform/extensions";
import { quantize, meshopt, reorder } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptDecoder } from "meshoptimizer";
import fs from "fs";

const CUT_Y = +(process.env.CUT_Y || 1.535); // plane under the chin (model units)
const LEVELS = +(process.env.LEVELS || 3);

const obj = new OBJLoader().parse(fs.readFileSync("human_head_basemesh_male.obj", "utf8"));
let g = obj.children[0].geometry;
g.deleteAttribute("uv"); g.deleteAttribute("normal");
g = mergeVertices(g, 1e-5);
g = LoopSubdivision.modify(g, LEVELS, { split: false, uvSmooth: false, preserveEdges: false, flatOnly: false });
g.deleteAttribute("normal"); if (g.attributes.uv) g.deleteAttribute("uv");
g = mergeVertices(g, 1e-6);

// ---- Taubin smoothing (λ/μ, volume-preserving): irons out basemesh lumps that read as
// "cracks" in glass highlights. SMOOTH=0 disables.
{
  const ITER = +(process.env.SMOOTH ?? 12), LAM = 0.5, MU = -0.53;
  const P0 = g.attributes.position, I0 = g.index.array, n = P0.count;
  const nb = Array.from({ length: n }, () => new Set());
  for (let f = 0; f < I0.length; f += 3) for (let k = 0; k < 3; k++) { const a = I0[f + k], b = I0[f + (k + 1) % 3]; nb[a].add(b); nb[b].add(a); }
  const nbA = nb.map((x) => [...x]);
  let cur = Float32Array.from(P0.array);
  const step = (f) => { const nx = new Float32Array(cur.length);
    for (let i = 0; i < n; i++) { const L = nbA[i]; let sx = 0, sy = 0, sz = 0;
      for (const j of L) { sx += cur[j * 3]; sy += cur[j * 3 + 1]; sz += cur[j * 3 + 2]; }
      const m = L.length || 1;
      nx[i * 3] = cur[i * 3] + f * (sx / m - cur[i * 3]); nx[i * 3 + 1] = cur[i * 3 + 1] + f * (sy / m - cur[i * 3 + 1]); nx[i * 3 + 2] = cur[i * 3 + 2] + f * (sz / m - cur[i * 3 + 2]); }
    cur = nx; };
  for (let it = 0; it < ITER; it++) { step(LAM); step(MU); }
  P0.array.set(cur); P0.needsUpdate = true;
}

// ---- Exact plane clip (keep y >= CUT_Y) ----
const P = g.attributes.position, I = g.index.array;
const pos = []; for (let i = 0; i < P.count; i++) pos.push([P.getX(i), P.getY(i), P.getZ(i)]);
const remap = new Map(); const outPos = []; const outIdx = [];
const keepVert = (i) => { if (!remap.has(i)) { remap.set(i, outPos.length); outPos.push(pos[i]); } return remap.get(i); };
const edgeCut = new Map(); // shared intersection vertex per edge → watertight cut
const cutVert = (a, b) => {
  const key = a < b ? a + "_" + b : b + "_" + a;
  if (!edgeCut.has(key)) {
    const pa = pos[a], pb = pos[b]; const t = (CUT_Y - pa[1]) / (pb[1] - pa[1]);
    edgeCut.set(key, outPos.length);
    outPos.push([pa[0] + (pb[0] - pa[0]) * t, CUT_Y, pa[2] + (pb[2] - pa[2]) * t]);
  }
  return edgeCut.get(key);
};
const capEdges = []; // directed edges lying on the plane
for (let f = 0; f < I.length; f += 3) {
  const tri = [I[f], I[f + 1], I[f + 2]];
  const inside = tri.map((v) => pos[v][1] >= CUT_Y);
  const n = inside.filter(Boolean).length;
  if (n === 0) continue;
  if (n === 3) { outIdx.push(...tri.map(keepVert)); continue; }
  // Sutherland–Hodgman on one plane
  const poly = []; const onPlane = [];
  for (let k = 0; k < 3; k++) {
    const a = tri[k], b = tri[(k + 1) % 3], ia = inside[k], ib = inside[(k + 1) % 3];
    if (ia) poly.push(keepVert(a));
    if (ia !== ib) { const c = cutVert(a, b); poly.push(c); onPlane.push(c); }
  }
  for (let k = 1; k < poly.length - 1; k++) outIdx.push(poly[0], poly[k], poly[k + 1]);
  // the polygon edge between the two cut points runs along the plane
  const ci = poly.findIndex((v, k) => onPlane.includes(v) && onPlane.includes(poly[(k + 1) % poly.length]));
  if (ci >= 0) capEdges.push([poly[ci], poly[(ci + 1) % poly.length]]);
}

// ---- Cap: chain plane edges into a loop, fan-triangulate from the centroid ----
const next = new Map(capEdges.map(([a, b]) => [a, b]));
let start = capEdges[0][0], loop = [start], cur = next.get(start);
while (cur !== undefined && cur !== start && loop.length <= capEdges.length) { loop.push(cur); cur = next.get(cur); }
console.log("cap edges", capEdges.length, "loop", loop.length, cur === start ? "closed" : "OPEN");
const c = loop.reduce((s, v) => [s[0] + outPos[v][0], s[1], s[2] + outPos[v][2]], [0, CUT_Y, 0]);
c[0] /= loop.length; c[2] /= loop.length;
// cap gets its own vertices so its normals stay flat (smooth shell, crisp cut)
const base = outPos.length; outPos.push(c);
const capMap = new Map(); for (const v of loop) { capMap.set(v, outPos.length); outPos.push([...outPos[v]]); }
for (const [a, b] of capEdges) outIdx.push(base, capMap.get(b), capMap.get(a)); // reverse winding → faces down

// ---- Geometry + normals ----
const geo = new THREE.BufferGeometry();
geo.setAttribute("position", new THREE.Float32BufferAttribute(outPos.flat(), 3));
geo.setIndex(outIdx);
geo.computeVertexNormals();
const nA = geo.attributes.normal; for (let i = base; i < outPos.length; i++) nA.setXYZ(i, 0, -1, 0);
console.log("verts", outPos.length, "tris", outIdx.length / 3);

const doc = new Document(); const buf = doc.createBuffer();
const acc = (type, arr) => doc.createAccessor().setType(type).setArray(arr).setBuffer(buf);
const prim = doc.createPrimitive()
  .setAttribute("POSITION", acc("VEC3", new Float32Array(geo.attributes.position.array)))
  // normals are recomputed at runtime (smooth shell, flat cap via split vertices) → smaller file
  .setIndices(acc("SCALAR", new Uint32Array(geo.index.array)));
doc.createScene().addChild(doc.createNode("Head").setMesh(doc.createMesh("Head").addPrimitive(prim)));
await MeshoptEncoder.ready;
await doc.transform(reorder({ encoder: MeshoptEncoder }), quantize({ quantizePosition: +(process.env.QP || 16), quantizeNormal: +(process.env.QN || 12) }), meshopt({ encoder: MeshoptEncoder, level: process.env.ML || "high" }));
const io = new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization]).registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder });
fs.writeFileSync("head.glb", await io.writeBinary(doc));
console.log("size", fs.statSync("head.glb").size);
