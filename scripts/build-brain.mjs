// Builds public/models/brain.glb from the CC0 "Human Brain" model by Grab3D
// (https://grab3d.com/models/anatomy/human-brain/, CC0 1.0, light version, 400k tris).
// Steps: weld → bake a cavity term (sulci darker rose, gyri light pink) into vertex colours at full
// resolution → simplify (meshoptimizer) → centre/normalize → quantize + meshopt compress.
// Normals are not stored; three recomputes smooth normals at runtime.
//   node build-brain.mjs   (env: TRIS=60000 SMOOTH_IT=12 ROUND=4)
import fs from "fs";
import { NodeIO, Document } from "@gltf-transform/core";
import { ALL_EXTENSIONS, EXTMeshoptCompression, KHRMeshQuantization } from "@gltf-transform/extensions";
import { quantize, reorder } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } from "meshoptimizer";
await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready, MeshoptSimplifier.ready]);
const TRIS = +(process.env.TRIS || 60000), IT = +(process.env.SMOOTH_IT || 12);

const src = await new NodeIO().registerExtensions(ALL_EXTENSIONS).read("brain-light.glb");
const prim = src.getRoot().listMeshes()[0].listPrimitives()[0];
const P = prim.getAttribute("POSITION").getArray(), I0 = prim.getIndices().getArray();
// weld by position
const map = new Map(), remap = new Uint32Array(P.length / 3), pos = [];
for (let i = 0; i < P.length / 3; i++) {
  const k = `${Math.round(P[i*3]*1e6)},${Math.round(P[i*3+1]*1e6)},${Math.round(P[i*3+2]*1e6)}`;
  let j = map.get(k); if (j === undefined) { j = pos.length / 3; map.set(k, j); pos.push(P[i*3], P[i*3+1], P[i*3+2]); }
  remap[i] = j;
}
const V = new Float32Array(pos), n = V.length / 3, idx = new Uint32Array(I0.length);
for (let i = 0; i < I0.length; i++) idx[i] = remap[I0[i]];
console.log("welded verts", n, "tris", idx.length / 3);
// vertex normals (area weighted) + adjacency
const N = new Float32Array(n * 3), nb = Array.from({ length: n }, () => []);
for (let f = 0; f < idx.length; f += 3) {
  const a = idx[f], b = idx[f+1], c = idx[f+2];
  const ux = V[b*3]-V[a*3], uy = V[b*3+1]-V[a*3+1], uz = V[b*3+2]-V[a*3+2];
  const vx = V[c*3]-V[a*3], vy = V[c*3+1]-V[a*3+1], vz = V[c*3+2]-V[a*3+2];
  const nx = uy*vz-uz*vy, ny = uz*vx-ux*vz, nz = ux*vy-uy*vx;
  for (const v of [a, b, c]) { N[v*3] += nx; N[v*3+1] += ny; N[v*3+2] += nz; }
  nb[a].push(b, c); nb[b].push(a, c); nb[c].push(a, b);
}
for (let i = 0; i < n; i++) { const l = Math.hypot(N[i*3], N[i*3+1], N[i*3+2]) || 1; N[i*3] /= l; N[i*3+1] /= l; N[i*3+2] /= l; }
// cavity = how far the vertex sits below a smoothed version of the surface (along the normal)
let S = Float32Array.from(V);
for (let it = 0; it < IT; it++) { const T = new Float32Array(S.length);
  for (let i = 0; i < n; i++) { const L = nb[i]; let x = 0, y = 0, z = 0; for (const j of L) { x += S[j*3]; y += S[j*3+1]; z += S[j*3+2]; }
    const m = L.length || 1; T[i*3] = x/m; T[i*3+1] = y/m; T[i*3+2] = z/m; } S = T; }
const cav = new Float32Array(n); let lo = 1e9, hi = -1e9;
for (let i = 0; i < n; i++) { cav[i] = (S[i*3]-V[i*3])*N[i*3] + (S[i*3+1]-V[i*3+1])*N[i*3+1] + (S[i*3+2]-V[i*3+2])*N[i*3+2]; }
const sorted = Float32Array.from(cav).sort(); lo = sorted[Math.floor(n*0.05)]; hi = sorted[Math.floor(n*0.95)];
// palette sampled from the reference artwork
const RIDGE = [0xe8/255, 0x9e/255, 0xb5/255], MID = [0xd4/255, 0x80/255, 0x9b/255], GROOVE = [0x96/255, 0x3c/255, 0x5e/255];
const col = new Uint8Array(n * 4);
for (let i = 0; i < n; i++) {
  const t = Math.min(1, Math.max(0, (cav[i] - lo) / (hi - lo))); // 0 = ridge, 1 = deep groove
  const s = t * t * (3 - 2 * t); const c = s < 0.5 ? RIDGE.map((r, k) => r + (MID[k]-r) * s * 2) : MID.map((m, k) => m + (GROOVE[k]-m) * (s-0.5) * 2);
  col[i*4] = c[0]*255; col[i*4+1] = c[1]*255; col[i*4+2] = c[2]*255; col[i*4+3] = 255;
}
// round the gyri a little (Taubin λ/μ, keeps volume) for the soft, waxy look of the reference
{ const RI = +(process.env.ROUND || 4); let R = V;
  for (let it = 0; it < RI * 2; it++) { const f = it % 2 ? -0.53 : 0.5, T = new Float32Array(R.length);
    for (let i = 0; i < n; i++) { const L = nb[i]; let x = 0, y = 0, z = 0; for (const j of L) { x += R[j*3]; y += R[j*3+1]; z += R[j*3+2]; }
      const m = L.length || 1; for (const [k, s] of [[0, x], [1, y], [2, z]]) T[i*3+k] = R[i*3+k] + f * (s/m - R[i*3+k]); }
    R = T; }
  V.set(R); }
// simplify (attribute-aware so colour boundaries survive)
const colF = new Float32Array(n * 3); for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) colF[i*3+k] = col[i*4+k] / 255;
const [sIdx, err] = MeshoptSimplifier.simplifyWithAttributes(idx, V, 3, colF, 3, [0.5, 0.5, 0.5], null, TRIS * 3, 0.02, []);
console.log("simplified tris", sIdx.length / 3, "err", err);
// compact
const used = new Map(), oP = [], oC = [], oI = new Uint32Array(sIdx.length);
for (let i = 0; i < sIdx.length; i++) { const v = sIdx[i]; let j = used.get(v);
  if (j === undefined) { j = oP.length / 3; used.set(v, j); oP.push(V[v*3], V[v*3+1], V[v*3+2]); oC.push(col[v*4], col[v*4+1], col[v*4+2], 255); } oI[i] = j; }
// normalize: centre on the cerebrum bbox, unit length (front-back = 1)
let mn = [1e9,1e9,1e9], mx = [-1e9,-1e9,-1e9]; for (let i = 0; i < oP.length; i += 3) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], oP[i+k]); mx[k] = Math.max(mx[k], oP[i+k]); }
const L = mx[2] - mn[2], cx = (mn[0]+mx[0])/2, cz = (mn[2]+mx[2])/2, top = mx[1];
for (let i = 0; i < oP.length; i += 3) { oP[i] = (oP[i]-cx)/L; oP[i+1] = (oP[i+1]-top)/L; oP[i+2] = (oP[i+2]-cz)/L; } // origin = top centre of the brain
console.log("normalized bbox", mn.map((v,k)=>((v-[cx,top,cz][k])/L).toFixed(3)), mx.map((v,k)=>((v-[cx,top,cz][k])/L).toFixed(3)));

const doc = new Document(); const buf = doc.createBuffer();
const p2 = doc.createPrimitive()
  .setAttribute("POSITION", doc.createAccessor().setType("VEC3").setArray(new Float32Array(oP)).setBuffer(buf))
  .setAttribute("COLOR_0", doc.createAccessor().setType("VEC4").setArray(new Uint8Array(oC)).setNormalized(true).setBuffer(buf))
  .setIndices(doc.createAccessor().setType("SCALAR").setArray(oI.length / 3 < 21845 ? new Uint16Array(oI) : oI).setBuffer(buf));
doc.createScene().addChild(doc.createNode("brain").setMesh(doc.createMesh("brain").addPrimitive(p2)));
await doc.transform(reorder({ encoder: MeshoptEncoder }), quantize({ quantizePosition: 14, quantizeColor: 8 }));
doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });
const io = new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization]).registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder });
const out = await io.writeBinary(doc); fs.writeFileSync("brain.glb", out); console.log("size", out.length);
