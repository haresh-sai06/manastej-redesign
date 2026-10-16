"use client";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Environment, Lightformer, MeshTransmissionMaterial } from "@react-three/drei";
import { headState, markReady } from "@/lib/headState";
import { createBrainGeometry } from "./brainGeometry";

const HEAD_URL = "/models/head.glb";
const REST_Y = -1.15; // three-quarter profile facing left, like the original artwork
const CREAM = new THREE.Color("#f4faf8"); // three-quarter profile facing left, like the original artwork

function GlassHead() {
  const { nodes } = useGLTF(HEAD_URL, false, true) as unknown as { nodes: Record<string, THREE.Mesh> };
  const headGeo = useMemo(() => {
    const mesh = Object.values(nodes).find((n) => (n as THREE.Mesh).isMesh) as THREE.Mesh;
    // De-quantize (meshopt/KHR_mesh_quantization stores normalized int16) into float32 before transforming
    const src = mesh.geometry;
    const toF32 = (a: THREE.BufferAttribute | THREE.InterleavedBufferAttribute) => {
      const out = new Float32Array(a.count * 3);
      for (let i = 0; i < a.count; i++) { out[i * 3] = a.getX(i); out[i * 3 + 1] = a.getY(i); out[i * 3 + 2] = a.getZ(i); }
      return new THREE.BufferAttribute(out, 3);
    };
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", toF32(src.attributes.position));
    g.setIndex(src.index);
    mesh.updateWorldMatrix(true, false);
    g.applyMatrix4(mesh.matrixWorld);
    g.computeVertexNormals();
    g.computeBoundingBox();
    const bb = g.boundingBox!;
    const c = bb.getCenter(new THREE.Vector3());
    const size = bb.getSize(new THREE.Vector3());
    const s = 2.6 / size.y;
    g.translate(-c.x, -c.y, -c.z).scale(s, s, s);
    return g;
  }, [nodes]);
  const brainGeo = useMemo(() => createBrainGeometry(28), []);
  const res = useThree((st) => (st.size.width < 500 ? 256 : 384));

  const brainMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#ff86a6"),
        roughness: 0.42,
        clearcoat: 0.55,
        clearcoatRoughness: 0.35,
        sheen: 0.6,
        sheenColor: new THREE.Color("#ffd6e1"),
        sheenRoughness: 0.5,
        emissive: new THREE.Color("#b03a62"),
        emissiveIntensity: 0.45,
      }),
    [],
  );

  // Blue fresnel shell: gives the glass its saturated blue rim without tinting the brain purple
  const shell = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { uColor: { value: new THREE.Color("#4fb3ea") }, uDeep: { value: new THREE.Color("#1f6fc0") } },
        vertexShader: `varying vec3 vN; varying vec3 vV;
          void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
        fragmentShader: `uniform vec3 uColor; uniform vec3 uDeep; varying vec3 vN; varying vec3 vV;
          void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0);
            vec3 c = mix(uColor, uDeep, f); gl_FragColor = vec4(c, 0.09 + f * 0.8); }`,
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
    const t = state.clock.elapsedTime;
    const i = headState.intro; // already eased by GSAP
    smooth.current.scroll += (headState.scroll - smooth.current.scroll) * Math.min(1, dt * 4);
    const sc = smooth.current.scroll;
    const float = Math.sin(t * 1.1) * 0.05 * i;
    g.rotation.y = REST_Y + (1 - i) * Math.PI + sc * 1.9 + Math.sin(t * 0.6) * 0.04 * i;
    g.rotation.x = (1 - i) * 0.42 + Math.sin(sc * Math.PI) * 0.14 - 0.04;
    g.rotation.z = (1 - i) * -0.12 + Math.sin(t * 0.8) * 0.015 * i;
    const s = 0.22 + 0.78 * i;
    g.scale.setScalar(s);
    g.position.y = float;
  });

  return (
    <group ref={group}>
      <group scale={0.7}>
      <mesh geometry={headGeo} renderOrder={2}>
        <MeshTransmissionMaterial
          resolution={res}
          samples={4}
          background={CREAM}
          transmission={1}
          thickness={0.35}
          ior={1.32}
          roughness={0.12}
          chromaticAberration={0.015}
          anisotropy={0.1}
          distortion={0}
          distortionScale={0.3}
          temporalDistortion={0}
          clearcoat={1}
          clearcoatRoughness={0.06}
          color="#c4e9fc"
          attenuationColor="#6fc0f0"
          attenuationDistance={5}
          envMapIntensity={1.1}
          backside={false}
        />
      </mesh>
      <mesh geometry={headGeo} material={shell} renderOrder={3} scale={1.004} />
      {/* brain placed in the cranium */}
      <mesh geometry={brainGeo} material={brainMat} position={[0, 0.42, -0.12]} scale={0.47} rotation={[-0.08, 0, 0]} renderOrder={1} />
      </group>
    </group>
  );
}

function Rig() {
  // Static studio lighting via lightformers (no HDR download)
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={2.2} color="#ffffff" />
      <directionalLight position={[-4, 1, -3]} intensity={1.4} color="#56d4cf" />
      <pointLight position={[0, -2, 3]} intensity={6} color="#f2c46d" distance={8} />
      <Environment resolution={64} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 3, 3]} scale={[6, 2, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={2} position={[-4, 0, 1]} rotation={[0, Math.PI / 2, 0]} scale={[4, 4, 1]} color="#9dd8f5" />
        <Lightformer form="ring" intensity={2.5} position={[4, 1, -2]} scale={2} color="#f2c46d" />
        <Lightformer form="rect" intensity={1} position={[0, -3, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[8, 8, 1]} color="#2a8f85" />
      </Environment>
    </>
  );
}

export default function HeadScene({ active }: { active: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 0.15, 5.2], fov: 32 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    >
      <Suspense fallback={null}>
        <Rig />
        <GlassHead />
      </Suspense>
    </Canvas>
  );
}
