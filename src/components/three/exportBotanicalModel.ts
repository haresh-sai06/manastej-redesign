import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Produce a portable animated GLB without changing the live scene. Instanced leaf
 * colours become ordinary vertex colours, so viewers need no instancing extension.
 */
export async function exportBotanicalModel(root: THREE.Group): Promise<ArrayBuffer> {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const model = root.clone(true);
  model.name = "BotanicalHead";
  model.position.set(0, 0, 0);
  model.quaternion.identity();
  model.scale.set(1, 1, 1);
  model.matrixAutoUpdate = true;
  model.updateMatrix();

  function copyMaterial(source: THREE.Material, instanceColors = false) {
    const material = source instanceof THREE.ShaderMaterial
      ? new THREE.MeshPhysicalMaterial({
        name: "Clear optical glass",
        color: "#e2ebe5",
        transmission: 0.8,
        thickness: 0.03,
        roughness: 0.07,
        metalness: 0,
        ior: 1.45,
        opacity: 0.56,
        transparent: true,
        depthWrite: false,
      })
      : source.clone();
    if (instanceColors) material.vertexColors = true;
    materials.add(material);
    return material;
  }

  function copyMaterials(source: THREE.Material | THREE.Material[], instanceColors = false) {
    return Array.isArray(source)
      ? source.map((material) => copyMaterial(material, instanceColors))
      : copyMaterial(source, instanceColors);
  }

  try {
    const meshes: THREE.Mesh[] = [];
    model.traverse((object) => { if ((object as THREE.Mesh).isMesh) meshes.push(object as THREE.Mesh); });
    for (const mesh of meshes) {
      const sourceMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      if (sourceMaterials.every((material) => !material.colorWrite)) {
        mesh.removeFromParent();
        continue;
      }
      if ((mesh as THREE.InstancedMesh).isInstancedMesh) {
        const instance = mesh as THREE.InstancedMesh;
        const pieces: THREE.BufferGeometry[] = [];
        const transform = new THREE.Matrix4();
        const tint = new THREE.Color();
        const sourceColors = instance.geometry.getAttribute("color");
        const sourceMaterials = Array.isArray(instance.material) ? instance.material : [instance.material];
        const useVertexColors = sourceMaterials.some((material) => material.vertexColors);
        for (let i = 0; i < instance.count; i++) {
          const geometry = instance.geometry.clone();
          geometries.add(geometry);
          instance.getMatrixAt(i, transform);
          geometry.applyMatrix4(transform);
          tint.setRGB(1, 1, 1);
          if (instance.instanceColor) instance.getColorAt(i, tint);
          const count = geometry.getAttribute("position").count;
          const colors = new Float32Array(count * 3);
          for (let vertex = 0; vertex < count; vertex++) {
            colors[vertex * 3] = tint.r * (sourceColors && useVertexColors ? sourceColors.getX(vertex) : 1);
            colors[vertex * 3 + 1] = tint.g * (sourceColors && useVertexColors ? sourceColors.getY(vertex) : 1);
            colors[vertex * 3 + 2] = tint.b * (sourceColors && useVertexColors ? sourceColors.getZ(vertex) : 1);
          }
          geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
          pieces.push(geometry);
        }
        const geometry = pieces.length ? mergeGeometries(pieces, false) : new THREE.BufferGeometry();
        if (!geometry) throw new Error("Unable to merge the botanical leaf geometry for export.");
        geometries.add(geometry);
        if (Array.isArray(instance.material)) {
          let offset = 0;
          for (const piece of pieces) {
            for (const group of piece.groups) geometry.addGroup(offset + group.start, group.count, group.materialIndex);
            offset += piece.index?.count ?? piece.getAttribute("position").count;
          }
        }
        const baked = new THREE.Mesh(geometry, copyMaterials(instance.material, true));
        // Copy only Object3D properties: Mesh.copy would restore the shared runtime geometry.
        THREE.Object3D.prototype.copy.call(baked, instance, false);
        for (const child of [...instance.children]) baked.add(child);
        instance.parent?.add(baked);
        instance.removeFromParent();
        pieces.forEach((piece) => { piece.dispose(); geometries.delete(piece); });
      } else {
        mesh.geometry = mesh.geometry.clone();
        geometries.add(mesh.geometry);
        mesh.material = copyMaterials(mesh.material);
      }
    }

    const duration = 18, frames = duration * 30;
    const times = new Float32Array(frames + 1);
    const rotations = new Float32Array((frames + 1) * 4);
    const positions = new Float32Array((frames + 1) * 3);
    const quaternion = new THREE.Quaternion();
    const euler = new THREE.Euler();
    for (let frame = 0; frame <= frames; frame++) {
      const time = frame / 30;
      const phase = (time / duration) * Math.PI * 2;
      times[frame] = time;
      quaternion.setFromEuler(euler.set(-0.025 + Math.sin(phase) * 0.015, -1.38 * Math.cos(phase), Math.sin(phase) * 0.008));
      quaternion.toArray(rotations, frame * 4);
      positions[frame * 3 + 1] = Math.sin(phase * 2) * 0.015;
    }
    // Identical stored endpoints avoid even floating-point drift at the loop seam.
    rotations.set(rotations.subarray(0, 4), frames * 4);
    positions.set(positions.subarray(0, 3), frames * 3);
    const clip = new THREE.AnimationClip("Botanical Head — seamless 18 second arc", duration, [
      new THREE.QuaternionKeyframeTrack("BotanicalHead.quaternion", times, rotations),
      new THREE.VectorKeyframeTrack("BotanicalHead.position", times, positions),
    ]);
    model.updateMatrixWorld(true);
    const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");
    const binary = await new GLTFExporter().parseAsync(model, { binary: true, trs: true, onlyVisible: true, animations: [clip] });
    if (!(binary instanceof ArrayBuffer)) throw new Error("The botanical model exporter did not return a binary GLB.");
    return binary;
  } finally {
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
  }
}
