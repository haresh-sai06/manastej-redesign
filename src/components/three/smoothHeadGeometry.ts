import * as THREE from "three";

type Edge = { a: number; b: number; opposite: number[]; vertex: number };

/**
 * Fair and subdivide the normalized glass shell, without changing its material.
 * The source has a separate, flat neck cap: keep that split and pin its rim so
 * the two surfaces meet at exactly the same positions after refinement.
 * Returns an independent position/index/normal geometry; never mutates source.
 */
export function smoothHeadGeometry(source: THREE.BufferGeometry): THREE.BufferGeometry {
  const attribute = source.getAttribute("position");
  const sourceIndex = source.getIndex();
  if (!attribute || !sourceIndex) return source.clone();

  const count = attribute.count;
  const original = new Float64Array(count * 3);
  let bottom = Infinity, top = -Infinity;
  for (let i = 0; i < count; i++) {
    const y = attribute.getY(i);
    original.set([attribute.getX(i), y, attribute.getZ(i)], i * 3);
    bottom = Math.min(bottom, y);
    top = Math.max(top, y);
  }
  const height = top - bottom;
  if (!Number.isFinite(height) || height <= 0) return source.clone();
  const planeTolerance = height * 0.00001;
  const adjacent = Array.from({ length: count }, () => new Set<number>());
  const edges = new Map<number, Edge>();
  const triangles: number[] = [];
  const cap = new Uint8Array(count);
  const pinned = new Uint8Array(count);
  const keyFor = (a: number, b: number) => Math.min(a, b) * count + Math.max(a, b);

  const addEdge = (a: number, b: number, opposite: number) => {
    const key = keyFor(a, b);
    let edge = edges.get(key);
    if (!edge) {
      edge = { a, b, opposite: [], vertex: -1 };
      edges.set(key, edge);
    }
    edge.opposite.push(opposite);
    adjacent[a].add(b);
    adjacent[b].add(a);
  };

  for (let f = 0; f < sourceIndex.count; f += 3) {
    const a = sourceIndex.getX(f), b = sourceIndex.getX(f + 1), c = sourceIndex.getX(f + 2);
    const abx = original[b * 3] - original[a * 3], aby = original[b * 3 + 1] - original[a * 3 + 1], abz = original[b * 3 + 2] - original[a * 3 + 2];
    const acx = original[c * 3] - original[a * 3], acy = original[c * 3 + 1] - original[a * 3 + 1], acz = original[c * 3 + 2] - original[a * 3 + 2];
    const crossSquared = (aby * acz - abz * acy) ** 2 + (abz * acx - abx * acz) ** 2 + (abx * acy - aby * acx) ** 2;
    // Quantization leaves four collapsed triangles in the original shell.
    if (a === b || b === c || c === a || crossSquared < height ** 4 * 1e-20) continue;
    triangles.push(a, b, c);
    addEdge(a, b, c); addEdge(b, c, a); addEdge(c, a, b);
    if ([a, b, c].every((i) => Math.abs(original[i * 3 + 1] - bottom) <= planeTolerance)) {
      cap[a] = 1; cap[b] = 1; cap[c] = 1;
    }
  }
  for (const edge of edges.values()) {
    if (edge.opposite.length !== 2) { pinned[edge.a] = 1; pinned[edge.b] = 1; }
  }
  for (let i = 0; i < count; i++) if (cap[i]) pinned[i] = 1;
  const neighbours = adjacent.map((vertices) => Array.from(vertices));

  // Small feature masks retain the eyelid, nose, lip and ear profiles while
  // taking the tiny ripples out of the broader cheek and forehead surfaces.
  const weights = new Float64Array(count);
  const gaussian = (x: number, y: number, z: number, cx: number, cy: number, cz: number, rx: number, ry: number, rz: number) =>
    Math.exp(-(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / rz) ** 2));
  for (let i = 0; i < count; i++) {
    if (pinned[i]) continue;
    // Coordinates below are expressed relative to the known 2.6-unit head.
    const scale = 2.6 / height;
    const x = original[i * 3] * scale, y = original[i * 3 + 1] * scale, z = original[i * 3 + 2] * scale;
    const feature = Math.max(
      gaussian(x, y, z, 0, -0.02, 1.06, 0.19, 0.29, 0.2),
      gaussian(x, y, z, 0, -0.43, 0.96, 0.32, 0.13, 0.2),
      gaussian(Math.abs(x), y, z, 0.29, 0.23, 0.82, 0.23, 0.16, 0.3),
      gaussian(Math.abs(x), y, z, 0.69, -0.02, -0.01, 0.17, 0.35, 0.3),
    );
    const neck = THREE.MathUtils.smoothstep(original[i * 3 + 1], bottom + height * 0.015, bottom + height * 0.12);
    weights[i] = neck * (1 - feature * 0.58);
  }

  let current = original.slice();
  let next = new Float64Array(current.length);
  const fair = (factor: number) => {
    for (let i = 0; i < count; i++) {
      const links = neighbours[i], weight = weights[i] * factor;
      if (!links.length || weight === 0) {
        next.set(current.subarray(i * 3, i * 3 + 3), i * 3);
        continue;
      }
      for (let axis = 0; axis < 3; axis++) {
        let sum = 0;
        for (const neighbour of links) sum += current[neighbour * 3 + axis];
        next[i * 3 + axis] = current[i * 3 + axis] + (sum / links.length - current[i * 3 + axis]) * weight;
      }
    }
    [current, next] = [next, current];
  };
  // Paired forward/backward diffusion removes high-frequency folds with very
  // little shrinkage. Float64 keeps repeated steps stable near the eyelids.
  for (let iteration = 0; iteration < 8; iteration++) { fair(0.45); fair(-0.47); }
  // Remove the wider corrugations inherited from the basemesh as well. The
  // feature masks keep the actual nose and lip profiles, rather than their
  // small horizontal surface ridges, recognizable through this fairing.
  for (let iteration = 0; iteration < 10; iteration++) fair(0.2);

  const refined = new Float32Array((count + edges.size) * 3);
  for (let i = 0; i < count; i++) {
    const links = neighbours[i];
    const n = links.length;
    const beta = n === 3 ? 3 / 16 : n > 3 ? 3 / (8 * n) : 0;
    // One Loop subdivision removes polygonal contours; feature weights make
    // its vertex relocation conservative around recognizable facial detail.
    const weight = pinned[i] ? 0 : weights[i];
    for (let axis = 0; axis < 3; axis++) {
      let sum = 0;
      for (const neighbour of links) sum += current[neighbour * 3 + axis];
      refined[i * 3 + axis] = current[i * 3 + axis] + beta * (sum - n * current[i * 3 + axis]) * weight;
    }
  }
  let vertex = count;
  for (const edge of edges.values()) {
    edge.vertex = vertex++;
    const flat = cap[edge.a] && cap[edge.b];
    for (let axis = 0; axis < 3; axis++) {
      const endpoints = current[edge.a * 3 + axis] + current[edge.b * 3 + axis];
      refined[edge.vertex * 3 + axis] = edge.opposite.length === 2 && !flat
        ? endpoints * 0.375 + (current[edge.opposite[0] * 3 + axis] + current[edge.opposite[1] * 3 + axis]) * 0.125
        : endpoints * 0.5;
    }
  }
  const indices = new Uint32Array(triangles.length * 4);
  let offset = 0;
  for (let f = 0; f < triangles.length; f += 3) {
    const a = triangles[f], b = triangles[f + 1], c = triangles[f + 2];
    const ab = edges.get(keyFor(a, b))!.vertex, bc = edges.get(keyFor(b, c))!.vertex, ca = edges.get(keyFor(c, a))!.vertex;
    indices.set([a, ab, ca, b, bc, ab, c, ca, bc, ab, bc, ca], offset);
    offset += 12;
  }
  const result = new THREE.BufferGeometry();
  result.setAttribute("position", new THREE.BufferAttribute(refined, 3));
  result.setIndex(new THREE.BufferAttribute(indices, 1));
  result.computeVertexNormals();

  // A glass highlight reveals changes in the normal field that are invisible
  // on matte skin. Fair the interpolated normals independently of the surface
  // so the eye sockets and cheeks read as a continuous polished shell.
  const normals = result.getAttribute("normal");
  let normalField = Float64Array.from(normals.array);
  let nextNormals = new Float64Array(normalField.length);
  const normalSum = new Float64Array(normalField.length);
  const normalArea = new Float64Array(refined.length / 3);
  const normalWeight = new Float64Array(normalArea.length);
  const faceArea = new Float64Array(indices.length / 3);
  for (let i = 0; i < normalWeight.length; i++) {
    normalWeight[i] = THREE.MathUtils.smoothstep(refined[i * 3 + 1], bottom + height * 0.015, bottom + height * 0.12);
  }
  for (let f = 0; f < indices.length; f += 3) {
    const a = indices[f] * 3, b = indices[f + 1] * 3, c = indices[f + 2] * 3;
    const abx = refined[b] - refined[a], aby = refined[b + 1] - refined[a + 1], abz = refined[b + 2] - refined[a + 2];
    const acx = refined[c] - refined[a], acy = refined[c + 1] - refined[a + 1], acz = refined[c + 2] - refined[a + 2];
    const area = Math.hypot(aby * acz - abz * acy, abz * acx - abx * acz, abx * acy - aby * acx);
    faceArea[f / 3] = area;
    normalArea[a / 3] += area * 2; normalArea[b / 3] += area * 2; normalArea[c / 3] += area * 2;
  }
  for (let iteration = 0; iteration < 12; iteration++) {
    normalSum.fill(0);
    for (let f = 0; f < indices.length; f += 3) {
      const a = indices[f] * 3, b = indices[f + 1] * 3, c = indices[f + 2] * 3, area = faceArea[f / 3];
      for (let axis = 0; axis < 3; axis++) {
        normalSum[a + axis] += (normalField[b + axis] + normalField[c + axis]) * area;
        normalSum[b + axis] += (normalField[c + axis] + normalField[a + axis]) * area;
        normalSum[c + axis] += (normalField[a + axis] + normalField[b + axis]) * area;
      }
    }
    for (let i = 0; i < normalArea.length; i++) {
      const weight = normalArea[i] > 0 ? normalWeight[i] * 0.6 : 0;
      let lengthSquared = 0;
      for (let axis = 0; axis < 3; axis++) {
        const value = weight === 0 ? normalField[i * 3 + axis]
          : normalField[i * 3 + axis] * (1 - weight) + normalSum[i * 3 + axis] / normalArea[i] * weight;
        nextNormals[i * 3 + axis] = value;
        lengthSquared += value * value;
      }
      const length = Math.sqrt(lengthSquared) || 1;
      for (let axis = 0; axis < 3; axis++) nextNormals[i * 3 + axis] /= length;
    }
    [normalField, nextNormals] = [nextNormals, normalField];
  }
  normals.array.set(normalField);
  normals.needsUpdate = true;
  result.computeBoundingBox();
  result.computeBoundingSphere();
  return result;
}
