"use client";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Environment, Lightformer, MeshTransmissionMaterial, ContactShadows } from "@react-three/drei";
import { headState, markReady } from "@/lib/headState";
import { createBrainGeometry } from "./brainGeometry";

const HEAD_URL = "/models/head.glb";
const REST_Y = -1.15; // three-quarter profile facing left, like the original artwork
const CREAM = new THREE.Color("#f4faf8");
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
    // Smooth shading for the shell; the neck cap has its own vertices, so it stays flat and crisp.
    g.computeVertexNormals();
    return g;
  }, [nodes]);
}

// Fresnel rim: light-blue glow on grazing angles, nearly clear face-on.
const rimMaterial = () =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    uniforms: {
      uRim: { value: new THREE.Color("#58b7f0") },
      uEdge: { value: new THREE.Color("#1e74c9") },
      uSpec: { value: new THREE.Color("#ffffff") },
    },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV; varying float vY;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vY = position.y;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uRim; uniform vec3 uEdge; uniform vec3 uSpec;
      varying vec3 vN; varying vec3 vV; varying float vY;
      void main(){
        vec3 n = normalize(vN); vec3 v = normalize(vV);
        float f = pow(1.0 - abs(dot(n, v)), 2.4);
        // soft key-light sparkle for a polished look
        vec3 l = normalize(vec3(0.5, 0.8, 0.6));
        float s = pow(max(dot(reflect(-l, n), v), 0.0), 60.0);
        vec3 col = mix(uRim, uEdge, f) + uSpec * s * 0.9;
        float a = 0.035 + f * 0.72 + s * 0.6;
        // fade the very bottom of the neck so the cut reads as a soft, deliberate end
        a *= smoothstep(-1.32, -1.0, vY);
        gl_FragColor = vec4(col, a);
      }`,
  });

function GlassHead() {
  const headGeo = useHeadGeometry();
  const small = useThree((st) => st.size.width < 500);
  const brainGeo = useMemo(() => createBrainGeometry(small ? 30 : 40), [small]);
  const rim = useMemo(rimMaterial, []);
  const brainMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        vertexColors: true,
        roughness: 0.38,
        metalness: 0,
        clearcoat: 0.5,
        clearcoatRoughness: 0.3,
        // sheen + soft emissive approximates subsurface scattering on tissue
        sheen: 1,
        sheenColor: new THREE.Color("#ffd2de"),
        sheenRoughness: 0.35,
        emissive: new THREE.Color("#c2486f"),
        emissiveIntensity: 0.18,
        envMapIntensity: 0.8,
      }),
    [],
  );

  const group = useRef<THREE.Group>(null);
  const smooth = useRef({ scroll: 0 });
  const { invalidate } = useThree();

  useEffect(() => {
    markReady();
    invalidate();
  }, [invalidate]);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    if (DBG) {
      g.rotation.set(DBG === "top" ? Math.PI / 2 : 0, DBG_Y[DBG] ?? 0, 0);
      g.scale.setScalar(1);
      return;
    }
    const t = state.clock.elapsedTime;
    const i = headState.intro; // already eased by GSAP
    smooth.current.scroll += (headState.scroll - smooth.current.scroll) * Math.min(1, dt * 4);
    const sc = smooth.current.scroll;
    g.rotation.y = REST_Y + (1 - i) * Math.PI + sc * 1.9 + Math.sin(t * 0.6) * 0.04 * i;
    g.rotation.x = (1 - i) * 0.42 + Math.sin(sc * Math.PI) * 0.14 - 0.04;
    g.rotation.z = (1 - i) * -0.12 + Math.sin(t * 0.8) * 0.015 * i;
    g.scale.setScalar(0.22 + 0.78 * i);
    g.position.y = Math.sin(t * 1.1) * 0.05 * i;
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
            <mesh geometry={headGeo} renderOrder={2}>
              <MeshTransmissionMaterial
                resolution={small ? 320 : 640}
                samples={small ? 4 : 6}
                background={CREAM}
                transmission={1}
                thickness={0.38}
                ior={1.45}
                roughness={0.035}
                chromaticAberration={0.06}
                anisotropicBlur={0.08}
                distortion={0}
                temporalDistortion={0}
                clearcoat={1}
                clearcoatRoughness={0.02}
                specularIntensity={1}
                color="#eef9ff"
                attenuationColor="#9ad7fb"
                attenuationDistance={3.6}
                envMapIntensity={0.75}
                backside={false}
              />
              {/* child of the glass mesh, so it's hidden during the transmission buffer pass
                  (otherwise its silhouette refracts into the glass as stray "seam" lines) */}
              <mesh geometry={headGeo} material={rim} renderOrder={3} scale={1.003} />
            </mesh>
          </>
        )}
        {/* brain sits in the upper cranium with an even ~0.08–0.17 gap to the glass (checked numerically + x-ray views); front lobe above the brow, short stem ends at the skull base */}
        <mesh geometry={brainGeo} material={brainMat} position={[0, 0.72, 0]} scale={[0.54, 0.5, 0.55]} rotation={[-0.1, 0, 0]} renderOrder={1} />
      </group>
    </group>
  );
}

function Studio() {
  // Local lightformer studio (no HDR download): soft top box, side strips for long glass highlights, warm kicker.
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[3, 4, 5]} intensity={2} />
      <directionalLight position={[-4, 1, -3]} intensity={1.2} color="#56d4cf" />
      <pointLight position={[0, -2, 3]} intensity={4} color="#f2c46d" distance={8} />
      <Environment resolution={256} frames={1}>
        <color attach="background" args={["#dcefee"]} />
        <Lightformer form="rect" intensity={4} position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[8, 8, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={3} position={[-5, 1, 1]} rotation={[0, Math.PI / 2, 0]} scale={[1.6, 7, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={3} position={[5, 1, 1]} rotation={[0, -Math.PI / 2, 0]} scale={[1.6, 7, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={2.5} position={[0, 1, 6]} scale={[6, 2, 1]} color="#bfe6ff" />
        <Lightformer form="ring" intensity={3} position={[3, 2, -4]} scale={2.5} color="#f2c46d" />
        <Lightformer form="rect" intensity={1.2} position={[0, -4, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[10, 10, 1]} color="#2a8f85" />
      </Environment>
    </>
  );
}

export default function HeadScene({ active }: { active: boolean }) {
  // DPR: at least 1.5 on desktop, capped at 1.75; phones capped at 1.5.
  const dpr: [number, number] =
    typeof window !== "undefined" && window.innerWidth >= 768 ? [1.5, Math.min(1.75, Math.max(1.5, window.devicePixelRatio))] : [1, 1.5];
  return (
    <Canvas
      dpr={dpr}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 0.15, 5.2], fov: 32 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    >
      <Suspense fallback={null}>
        <Studio />
        <GlassHead />
        <ContactShadows position={[0, -0.97, 0]} scale={2.6} resolution={256} blur={2.6} opacity={0.32} far={1.6} color="#0f2f2b" frames={Infinity} />
      </Suspense>
    </Canvas>
  );
}
