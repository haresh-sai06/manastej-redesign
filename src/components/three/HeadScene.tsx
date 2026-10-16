"use client";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Environment, Lightformer, ContactShadows } from "@react-three/drei";
import { headState, markReady } from "@/lib/headState";
import BotanicalDetails from "./BotanicalDetails";
import { smoothHeadGeometry } from "./smoothHeadGeometry";

const HEAD_URL = "/models/head.glb";
const BRAIN_URL = "/models/brain.glb";
// Start fetching both models as soon as this chunk loads (idle-preloaded by Head3D).
useGLTF.preload(HEAD_URL, false, true);
useGLTF.preload(BRAIN_URL, false, true);
const REST_Y = -1.38;
const HEAD_H = 2.6; // normalized head height (scene units, before the 0.7 group scale)

// Debug views for development only (?h3d=side|front|top|back) — freezes animation, x-ray materials.
const DBG = typeof location !== "undefined" ? new URLSearchParams(location.search).get("h3d") : null;
const DBG_Y: Record<string, number> = { side: -Math.PI / 2, front: 0, back: Math.PI, top: 0 };

function useHeadGeometry() {
  const { nodes } = useGLTF(HEAD_URL, false, true) as unknown as { nodes: Record<string, THREE.Mesh> };
  return useMemo(() => {
    const mesh = Object.values(nodes).find((n) => (n as THREE.Mesh).isMesh) as THREE.Mesh;
    // De-quantize (KHR_mesh_quantization stores normalized ints) into float32 before transforming
    const a = mesh.geometry.attributes.position;
    const out = new Float32Array(a.count * 3);
    for (let i = 0; i < a.count; i++) { out[i * 3] = a.getX(i); out[i * 3 + 1] = a.getY(i); out[i * 3 + 2] = a.getZ(i); }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(out, 3));
    g.setIndex(mesh.geometry.index);
    mesh.updateWorldMatrix(true, false);
    g.applyMatrix4(mesh.matrixWorld);
    g.computeBoundingBox();
    const bb = g.boundingBox!;
    const c = bb.getCenter(new THREE.Vector3());
    const s = HEAD_H / bb.getSize(new THREE.Vector3()).y;
    g.translate(-c.x, -c.y, -c.z).scale(s, s, s);
    // Fair the shell and refine its contours while preserving facial features and the split neck cap.
    const refined = smoothHeadGeometry(g);
    g.dispose();
    return refined;
  }, [nodes]);
}

/** CC0 brain mesh (Grab3D), baked cavity colours; origin = top centre, front-back length = 1. */
function useBrainGeometry() {
  const { nodes } = useGLTF(BRAIN_URL, false, true) as unknown as { nodes: Record<string, THREE.Mesh> };
  return useMemo(() => {
    const mesh = Object.values(nodes).find((n) => (n as THREE.Mesh).isMesh) as THREE.Mesh;
    const a = mesh.geometry.attributes.position, c = mesh.geometry.attributes.color;
    const out = new Float32Array(a.count * 3), col = new Float32Array(c.count * 3), tmp = new THREE.Color();
    const shadow = new THREE.Color("#102e18"), leaf = new THREE.Color("#2d6130"), ridge = new THREE.Color("#6a994b");
    for (let i = 0; i < a.count; i++) {
      out[i * 3] = a.getX(i); out[i * 3 + 1] = a.getY(i); out[i * 3 + 2] = a.getZ(i);
      // Retain the baked fold depth in a variegated moss / sage palette.
      const cavity = THREE.MathUtils.clamp((c.getX(i) - 0.57) / 0.34, 0, 1);
      const variation = 0.035 * Math.sin(a.getX(i) * 57 + a.getZ(i) * 29);
      const t = THREE.MathUtils.clamp(cavity + variation, 0, 1);
      if (t < 0.55) tmp.copy(shadow).lerp(leaf, t / 0.55);
      else tmp.copy(leaf).lerp(ridge, (t - 0.55) / 0.45);
      col[i * 3] = tmp.r * 0.6; col[i * 3 + 1] = tmp.g * 0.6; col[i * 3 + 2] = tmp.b * 0.6;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(out, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.setIndex(mesh.geometry.index);
    mesh.updateWorldMatrix(true, false);
    g.applyMatrix4(mesh.matrixWorld);
    g.computeVertexNormals();
    return g;
  }, [nodes]);
}

type Pose = "side" | "front" | "three-quarter";

// Thin, clear optical shell. The opaque botanical interior keeps its own depth buffer;
// the rim adds neutral studio reflections without a milky refraction pass over the leaves.
function createGlassMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { edgeColor: { value: new THREE.Color("#30483e") }, lightColor: { value: new THREE.Color("#ffffff") } },
    vertexShader: `
      varying vec3 vN; varying vec3 vV; varying vec3 vP; varying float vY;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal); vV = -mv.xyz; vP = position; vY = position.y;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 edgeColor; uniform vec3 lightColor;
      varying vec3 vN; varying vec3 vV; varying vec3 vP; varying float vY;
      void main() {
        vec3 n = normalize(vN), v = normalize(vV);
        float rim = pow(1.0 - max(dot(n, v), 0.0), 2.25);
        vec3 reflected = reflect(-v, n);
        float key = pow(max(dot(reflected, normalize(vec3(-0.6, 0.7, 0.9))), 0.0), 48.0);
        float strip = pow(max(dot(reflected, normalize(vec3(0.9, 0.15, 0.4))), 0.0), 65.0);
        // Denser facial glass lets the actual nose, eyelids and lips catch directional light.
        // Keep the cranium clearer so the botanical interior remains visible.
        float face = smoothstep(0.0, 0.5, vP.z) * (1.0 - smoothstep(0.45, 0.85, vY));
        float diffuse = max(dot(n, normalize(vec3(-0.5, 0.65, 0.9))), 0.0);
        vec3 color = mix(edgeColor, lightColor, clamp(0.08 + pow(diffuse, 1.5) * 0.55 + key * 0.3 + strip * 0.2, 0.0, 1.0));
        float alpha = min(0.97, 0.18 + face * 0.56 + rim * 0.72 + key * 0.28 + strip * 0.16);
        alpha *= smoothstep(-1.32, -1.08, vY);
        gl_FragColor = vec4(color, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

function GlassHead({ pose, onModelReady }: { pose?: Pose; onModelReady?: (model: THREE.Group) => void }) {
  const headGeo = useHeadGeometry();
  const small = useThree((st) => st.size.width < 500);
  const brainGeo = useBrainGeometry();
  const glass = useMemo(createGlassMaterial, []);
  const brainMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        vertexColors: true,
        roughness: 0.7,
        metalness: 0,
        clearcoat: 0.24,
        clearcoatRoughness: 0.4,
        sheen: 0.22,
        sheenColor: new THREE.Color("#c9d9ac"),
        sheenRoughness: 0.65,
        envMapIntensity: 0.22,
      }),
    [],
  );

  const group = useRef<THREE.Group>(null);
  const smooth = useRef({ scroll: 0, time: 0 });
  const { invalidate } = useThree();

  useEffect(() => {
    if (group.current) onModelReady?.(group.current);
  }, [onModelReady]);

  useEffect(() => () => {
    headGeo.dispose(); brainGeo.dispose(); glass.dispose(); brainMat.dispose();
  }, [headGeo, brainGeo, glass, brainMat]);

  useEffect(() => {
    markReady();
    invalidate();
  }, [invalidate]);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    if (pose) {
      g.rotation.set(-0.025, pose === "front" ? 0 : pose === "side" ? -Math.PI / 2 : -1.15, 0);
      g.scale.setScalar(1);
      return;
    }
    if (DBG) {
      g.rotation.set(DBG === "top" ? Math.PI / 2 : 0, DBG_Y[DBG] ?? 0, 0);
      g.scale.setScalar(1);
      return;
    }
    // Accumulate only rendered time, so resuming a suspended canvas cannot skip an angle.
    const step = Math.min(dt, 1 / 20);
    const i = headState.intro; // already eased by GSAP
    smooth.current.time += step * i;
    const t = smooth.current.time;
    smooth.current.scroll = THREE.MathUtils.damp(smooth.current.scroll, headState.scroll, 4, step);
    const sc = smooth.current.scroll;
    // Continuous left → front → right → front → left arc, with zero velocity at turnarounds.
    g.rotation.y = REST_Y * Math.cos(t * Math.PI * 2 / 18) - (1 - i) * 0.22 + sc * 0.22;
    g.rotation.x = -0.025 + (1 - i) * 0.08 + Math.sin(t * Math.PI * 2 / 18) * 0.015;
    g.rotation.z = Math.sin(t * Math.PI * 2 / 18) * 0.008 * i;
    g.scale.setScalar(0.88 + 0.12 * i);
    g.position.y = Math.sin(t * Math.PI * 2 / 9) * 0.015 * i;
  });

  return (
    <group ref={group}>
      <group scale={0.7}>
        {DBG ? (
          <mesh geometry={headGeo} renderOrder={2}>
            <meshBasicMaterial color="#2a8fd6" wireframe transparent opacity={0.25} />
          </mesh>
        ) : (
          <>
            {/* Keep rear-facing folds from blending through the visible facial surface. */}
            <mesh geometry={headGeo} renderOrder={1}>
              <meshBasicMaterial colorWrite={false} depthWrite />
            </mesh>
            <mesh geometry={headGeo} material={glass} renderOrder={2} />
          </>
        )}
        {/* Keep layered foliage within the cranium and the slender vines within the neck. */}
        <group position={[0, 1.14, -0.02]} scale={1.4}>
          <mesh geometry={brainGeo} material={brainMat} />
          <BotanicalDetails geometry={brainGeo} compact={small} />
        </group>
      </group>
    </group>
  );
}

function Studio() {
  // Local lightformer studio (no HDR download): soft top box, side strips for long glass highlights, warm kicker.
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[-3, 5, 5]} intensity={1.1} color="#fffdf0" />
      <directionalLight position={[4, 2, -3]} intensity={0.55} color="#e2eddb" />
      <pointLight position={[0, -2, 3]} intensity={1.2} color="#e1e8ce" distance={8} />
      <Environment resolution={256} frames={1}>
        <color attach="background" args={["#e7ece7"]} />
        <Lightformer form="rect" intensity={4} position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[8, 8, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={3} position={[-5, 1, 1]} rotation={[0, Math.PI / 2, 0]} scale={[1.6, 7, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={3} position={[5, 1, 1]} rotation={[0, -Math.PI / 2, 0]} scale={[1.6, 7, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.6} position={[0, 1, 6]} scale={[6, 2, 1]} color="#f4f7ee" />
        <Lightformer form="ring" intensity={1.5} position={[3, 2, -4]} scale={2.5} color="#d8e6bf" />
        <Lightformer form="rect" intensity={0.6} position={[0, -4, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[10, 10, 1]} color="#41503c" />
      </Environment>
    </>
  );
}

export default function HeadScene({ active, pose, onModelReady }: { active: boolean; pose?: Pose; onModelReady?: (model: THREE.Group) => void }) {
  // DPR: at least 1.5 on desktop, capped at 1.75; phones capped at 1.5.
  const dpr: [number, number] =
    typeof window !== "undefined" && window.innerWidth >= 768 ? [1.5, Math.min(1.75, Math.max(1.5, window.devicePixelRatio))] : [1, 1.5];
  return (
    <Canvas
      dpr={dpr}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 0.15, 5.2], fov: 32 }}
      gl={{ alpha: true, antialias: true, preserveDrawingBuffer: !!pose, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    >
      <Suspense fallback={null}>
        <Studio />
        <GlassHead pose={pose} onModelReady={onModelReady} />
        <ContactShadows position={[0, -0.97, 0]} scale={2.6} resolution={256} blur={2.6} opacity={0.32} far={1.6} color="#0f2f2b" frames={Infinity} />
      </Suspense>
    </Canvas>
  );
}
