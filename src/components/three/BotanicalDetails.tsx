"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

type BotanicalDetailsProps = {
  /** The normalized, unscaled anatomical brain used by the parent mesh. */
  geometry: THREE.BufferGeometry;
  /** A smaller instance budget for compact screens. No separate visual design. */
  compact?: boolean;
};

type Leaf = { matrix: THREE.Matrix4; color: THREE.Color };

// A fixed seed keeps the planting identical across React renders and devices.
function seededRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let n = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}

/** The same folded leaf surface is shared by the blade and its raised veins. */
function leafPoint(t: number, across: number) {
  const width = Math.pow(Math.sin(Math.PI * t), 0.8) * 0.36;
  const edge = 1 + Math.sin(t * Math.PI * 11) * 0.018;
  return new THREE.Vector3(
    across * width * edge + Math.sin(t * Math.PI) * 0.025,
    t,
    Math.sin(t * Math.PI) * (0.07 + across * across * 0.065)
      + Math.sin(t * Math.PI * 9 + Math.abs(across) * 2) * Math.abs(across) * 0.016 * Math.sin(t * Math.PI)
      - t * t * 0.035,
  );
}

function createLeafGeometry() {
  const rows = 14, columns = 8;
  const positions: number[] = [], colors: number[] = [], indices: number[] = [];
  for (let row = 0; row <= rows; row++) {
    const t = row / rows;
    for (let column = 0; column <= columns; column++) {
      const across = (column / columns) * 2 - 1;
      positions.push(...leafPoint(t, across).toArray());
      // Darker folded midrib, softly lit edges; instance colours provide the green palette.
      const light = 0.79 + Math.abs(across) * 0.17 + Math.sin(t * Math.PI) * 0.04;
      colors.push(light, light, light * 0.97);
      if (row < rows && column < columns) {
        const a = row * (columns + 1) + column;
        indices.push(a, a + 1, a + columns + 1, a + 1, a + columns + 2, a + columns + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createVeinGeometry() {
  const pieces: THREE.BufferGeometry[] = [];
  const midrib = Array.from({ length: 13 }, (_, i) => leafPoint(0.04 + (i / 12) * 0.89, 0).add(new THREE.Vector3(0, 0, 0.005)));
  pieces.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(midrib), 12, 0.006, 3, false));
  for (let row = 0; row < 5; row++) {
    const start = 0.16 + row * 0.13;
    for (const side of [-1, 1]) {
      const points = Array.from({ length: 5 }, (_, i) => {
        const f = i / 4;
        return leafPoint(start + f * 0.13, side * f * 0.85).add(new THREE.Vector3(0, 0, 0.004));
      });
      pieces.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 4, 0.0025, 3, false));
    }
  }
  const geometry = mergeGeometries(pieces)!;
  pieces.forEach((piece) => piece.dispose());
  return geometry;
}

function leafMatrix(position: THREE.Vector3, normal: THREE.Vector3, direction: THREE.Vector3, length: number, width = 1) {
  const forward = direction.clone().addScaledVector(normal, -direction.dot(normal)).normalize();
  const side = new THREE.Vector3().crossVectors(forward, normal).normalize();
  const outward = new THREE.Vector3().crossVectors(side, forward).normalize();
  const rotation = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, forward, outward));
  return new THREE.Matrix4().compose(position, rotation, new THREE.Vector3(length * width, length, length));
}

/** Area-weighted triangle sampling avoids clusters caused by uneven GLTF topology. */
function plantBrain(geometry: THREE.BufferGeometry, count: number) {
  const random = seededRandom(0x4d414e41);
  const position = geometry.getAttribute("position");
  const normals = geometry.getAttribute("normal");
  const index = geometry.index;
  const triangleCount = Math.floor((index?.count ?? position.count) / 3);
  const cumulative = new Float64Array(triangleCount);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const edge = new THREE.Vector3(), cross = new THREE.Vector3();
  let totalArea = 0;
  for (let i = 0; i < triangleCount; i++) {
    a.fromBufferAttribute(position, index ? index.getX(i * 3) : i * 3);
    b.fromBufferAttribute(position, index ? index.getX(i * 3 + 1) : i * 3 + 1);
    c.fromBufferAttribute(position, index ? index.getX(i * 3 + 2) : i * 3 + 2);
    totalArea += cross.crossVectors(edge.subVectors(b, a), c.clone().sub(a)).length() * 0.5;
    cumulative[i] = totalArea;
  }
  const palette = ["#4a7839", "#306b35", "#245b30", "#6a9548", "#3f7c3c", "#7aa650"].map((color) => new THREE.Color(color));
  const leaves: Leaf[] = [];
  const bounds = new THREE.Box3().setFromBufferAttribute(position as THREE.BufferAttribute);
  const center = bounds.getCenter(new THREE.Vector3());
  for (let attempt = 0; leaves.length < count && attempt < count * 12; attempt++) {
    const target = random() * totalArea;
    let low = 0, high = triangleCount - 1;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (cumulative[middle] < target) low = middle + 1;
      else high = middle;
    }
    const ia = index ? index.getX(low * 3) : low * 3;
    const ib = index ? index.getX(low * 3 + 1) : low * 3 + 1;
    const ic = index ? index.getX(low * 3 + 2) : low * 3 + 2;
    a.fromBufferAttribute(position, ia); b.fromBufferAttribute(position, ib); c.fromBufferAttribute(position, ic);
    const r = Math.sqrt(random()), s = random();
    const weights = [1 - r, r * (1 - s), r * s];
    const point = a.clone().multiplyScalar(weights[0]).addScaledVector(b, weights[1]).addScaledVector(c, weights[2]);
    const radial = point.clone().sub(center).normalize();
    const normal = normals
      ? new THREE.Vector3().fromBufferAttribute(normals, ia).multiplyScalar(weights[0])
        .addScaledVector(new THREE.Vector3().fromBufferAttribute(normals, ib), weights[1])
        .addScaledVector(new THREE.Vector3().fromBufferAttribute(normals, ic), weights[2]).normalize()
      : cross.crossVectors(edge.subVectors(b, a), c.clone().sub(a)).normalize().clone();
    // Keep deep sulci and the anatomical brain stem visible rather than filling them with foliage.
    if (point.y < bounds.min.y + 0.10 || normal.dot(radial) < 0.12) continue;
    normal.lerp(radial, 0.16).normalize();
    const angle = random() * Math.PI * 2;
    const direction = new THREE.Vector3(Math.sin(angle), 0.75 + random() * 0.6, Math.cos(angle));
    const tangent = direction.clone().addScaledVector(normal, -normal.dot(direction)).normalize();
    const small = leaves.length % 4 === 0;
    const length = small ? 0.055 + random() * 0.045 : 0.14 + random() * 0.10;
    const base = point.addScaledVector(tangent, -length * 0.45).addScaledVector(normal, 0.009);
    const color = palette[Math.floor(random() * palette.length)].clone().multiplyScalar(0.55 + random() * 0.12);
    leaves.push({ matrix: leafMatrix(base, normal, tangent, length, 0.78 + random() * 0.30), color });
  }
  return leaves;
}

function taperedTube(curve: THREE.CatmullRomCurve3, segments: number, radius: number) {
  const geometry = new THREE.TubeGeometry(curve, segments, 1, 5, false);
  const positions = geometry.getAttribute("position");
  const point = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const center = curve.getPointAt(t);
    const thickness = radius * (1 - t * 0.86);
    for (let j = 0; j <= 5; j++) {
      const vertex = i * 6 + j;
      point.fromBufferAttribute(positions, vertex).sub(center).multiplyScalar(thickness).add(center);
      positions.setXYZ(vertex, point.x, point.y, point.z);
    }
  }
  geometry.computeVertexNormals();
  return geometry;
}

function createVines(compact: boolean) {
  const random = seededRandom(0x54454a);
  const tubes: THREE.BufferGeometry[] = [];
  const leaves: Leaf[] = [];
  for (let vine = 0; vine < 7; vine++) {
    const phase = vine * 1.73;
    const short = vine > 3;
    const length = short ? 0.48 + random() * 0.25 : 0.91 + random() * 0.05;
    const points = Array.from({ length: 13 }, (_, i) => {
      const t = i / 12;
      return new THREE.Vector3(
        Math.sin(t * 5.8 + phase) * (0.013 + t * (short ? 0.065 : 0.025)),
        -0.60 - t * length,
        -0.14 + Math.cos(t * 4.9 + phase) * (0.014 + t * 0.036) - t * 0.018,
      );
    });
    const curve = new THREE.CatmullRomCurve3(points);
    tubes.push(taperedTube(curve, 38, vine === 0 ? 0.008 : 0.0038));
    const pairs = compact ? (short ? 3 : 5) : (short ? 4 : 7);
    for (let i = 0; i < pairs; i++) {
      const t = 0.14 + (i / pairs) * 0.79;
      for (const side of [-1, 1]) {
        const azimuth = phase + side * 1.1 + i * 0.67;
        const radial = new THREE.Vector3(Math.sin(azimuth), 0.35, Math.cos(azimuth)).normalize();
        const direction = new THREE.Vector3(Math.sin(azimuth) * side, -0.6, Math.cos(azimuth) * side).normalize();
        const normal = new THREE.Vector3().crossVectors(direction, radial).normalize();
        const leafLength = (0.04 + random() * 0.035) * (1 - t * 0.24);
        leaves.push({
          matrix: leafMatrix(curve.getPoint(t), normal, direction, leafLength, 0.66 + random() * 0.20),
          color: new THREE.Color().setHSL(0.27 + random() * 0.045, 0.35 + random() * 0.15, 0.25 + random() * 0.10),
        });
      }
    }
  }
  const geometry = mergeGeometries(tubes)!;
  tubes.forEach((tube) => tube.dispose());
  return { geometry, leaves };
}

/**
 * Render inside the SAME group/transform as the brain mesh:
 * <group position={[0, 1.14, -0.02]} scale={1.4}>
 *   <mesh geometry={brainGeometry} ... />
 *   <BotanicalDetails geometry={brainGeometry} compact={small} />
 * </group>
 * The brain retains its silhouette. Botanical accents use three draw calls, shared
 * geometry and fixed instance matrices. The vines end at local y≈-1.56.
 */
export default function BotanicalDetails({ geometry, compact = false }: BotanicalDetailsProps) {
  const blades = useRef<THREE.InstancedMesh>(null);
  const veins = useRef<THREE.InstancedMesh>(null);
  const leafGeometry = useMemo(createLeafGeometry, []);
  const veinGeometry = useMemo(createVeinGeometry, []);
  const vines = useMemo(() => createVines(compact), [compact]);
  const planting = useMemo(() => [...plantBrain(geometry, compact ? 154 : 228), ...vines.leaves], [geometry, compact, vines]);

  useLayoutEffect(() => {
    const bladeMesh = blades.current, veinMesh = veins.current;
    if (!bladeMesh || !veinMesh) return;
    const veinColor = new THREE.Color();
    const highlight = new THREE.Color("#8eb66b");
    planting.forEach((leaf, index) => {
      bladeMesh.setMatrixAt(index, leaf.matrix);
      bladeMesh.setColorAt(index, leaf.color);
      veinMesh.setMatrixAt(index, leaf.matrix);
      veinMesh.setColorAt(index, veinColor.copy(leaf.color).lerp(highlight, 0.26));
    });
    bladeMesh.instanceMatrix.needsUpdate = true;
    veinMesh.instanceMatrix.needsUpdate = true;
    if (bladeMesh.instanceColor) bladeMesh.instanceColor.needsUpdate = true;
    if (veinMesh.instanceColor) veinMesh.instanceColor.needsUpdate = true;
    bladeMesh.computeBoundingSphere(); veinMesh.computeBoundingSphere();
    return () => {
      leafGeometry.dispose(); veinGeometry.dispose(); vines.geometry.dispose();
    };
  }, [planting, leafGeometry, veinGeometry, vines]);

  return (
    <group>
      <mesh geometry={vines.geometry}>
        <meshStandardMaterial color="#3e6d38" roughness={0.72} envMapIntensity={0.2} />
      </mesh>
      <instancedMesh ref={blades} args={[leafGeometry, undefined, planting.length]}>
        <meshPhysicalMaterial color="white" vertexColors side={THREE.DoubleSide} roughness={0.65} metalness={0} clearcoat={0.18} clearcoatRoughness={0.55} sheen={0.13} sheenColor="#c9d6a4" envMapIntensity={0.2} />
      </instancedMesh>
      <instancedMesh ref={veins} args={[veinGeometry, undefined, planting.length]}>
        <meshStandardMaterial color="white" roughness={0.78} envMapIntensity={0.2} />
      </instancedMesh>
    </group>
  );
}
