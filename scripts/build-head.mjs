// Builds public/models/head.glb from the CC0 "Human Head Basemesh" (male) by pistachio
// https://opengameart.org/content/2-human-head-basemeshes (CC0). Download human_head_basemesh_male.obj next to this script, then:
//   npm i three three-subdivide @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions meshoptimizer && node build-head.mjs
// Steps: crop shoulders, 2x Loop subdivision, smooth normals, quantize + meshopt (~67 KB).
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { LoopSubdivision } from "three-subdivide";
import { Document, NodeIO } from "@gltf-transform/core";
import { EXTMeshoptCompression, KHRMeshQuantization } from "@gltf-transform/extensions";
import { quantize, meshopt, reorder } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptDecoder } from "meshoptimizer";
import fs from "fs";

const obj = new OBJLoader().parse(fs.readFileSync("human_head_basemesh_male.obj", "utf8"));
let g = obj.children[0].geometry;
g.deleteAttribute("uv"); g.deleteAttribute("normal");
g = mergeVertices(g, 1e-5);
// Crop shoulders: keep head + short neck
{
  const P = g.attributes.position, I = g.index.array, keep = [];
  for (let i = 0; i < I.length; i += 3) {
    const ok = [0, 1, 2].every((k) => P.getY(I[i + k]) >= 1.535);
    if (ok) keep.push(I[i], I[i + 1], I[i + 2]);
  }
  g.setIndex(keep);
}
// open edges
const idx = g.index.array, edges = new Map();
for (let i = 0; i < idx.length; i += 3) for (let k = 0; k < 3; k++) { const a = idx[i + k], b = idx[i + (k + 1) % 3]; const key = a < b ? a + "_" + b : b + "_" + a; edges.set(key, (edges.get(key) || 0) + 1); }
console.log("verts", g.attributes.position.count, "tris", idx.length / 3, "open edges", [...edges.values()].filter((c) => c === 1).length);
g.computeBoundingBox(); console.log("bbox", g.boundingBox.min, g.boundingBox.max);
let s = LoopSubdivision.modify(g, 2, { split: false, uvSmooth: false, preserveEdges: false, flatOnly: false });
s = mergeVertices(s, 1e-6);
s.computeVertexNormals();
console.log("subdiv verts", s.attributes.position.count, "tris", s.index.count / 3);

const doc = new Document(); const buf = doc.createBuffer();
const pos = doc.createAccessor().setType("VEC3").setArray(new Float32Array(s.attributes.position.array)).setBuffer(buf);
const nor = doc.createAccessor().setType("VEC3").setArray(new Float32Array(s.attributes.normal.array)).setBuffer(buf);
const ind = doc.createAccessor().setType("SCALAR").setArray(new Uint32Array(s.index.array)).setBuffer(buf);
const prim = doc.createPrimitive().setAttribute("POSITION", pos).setAttribute("NORMAL", nor).setIndices(ind);
const mesh = doc.createMesh("Head").addPrimitive(prim);
doc.createScene().addChild(doc.createNode("Head").setMesh(mesh));
await MeshoptEncoder.ready;
await doc.transform(reorder({ encoder: MeshoptEncoder }), quantize(), meshopt({ encoder: MeshoptEncoder, level: "medium" }));
const io = new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization]).registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder });
fs.writeFileSync("head.glb", await io.writeBinary(doc));
console.log("size", fs.statSync("head.glb").size);
