"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Group } from "three";
import { markEntered, resetIntro } from "@/lib/headState";
const Scene = dynamic(() => import("@/components/three/HeadScene"), { ssr: false });

export default function ModelPreview() {
  useEffect(() => { markEntered(); return resetIntro; }, []);
  const [pose, setPose] = useState<"side" | "front" | "three-quarter" | undefined>("three-quarter");
  const model = useRef<Group | null>(null);
  const onModelReady = useCallback((group: Group) => { model.current = group; }, []);
  const exportModel = async () => {
    if (!model.current) return;
    const { exportBotanicalModel } = await import("@/components/three/exportBotanicalModel");
    const data = await exportBotanicalModel(model.current);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([data], { type: "model/gltf-binary" }));
    link.download = "botanical-head.glb";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };
  const exportStill = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "head-botanical-still.png";
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    }, "image/png");
  };
  return <main style={{ height: "100svh", background: "#f4faf8", color: "#051311" }}>
    <Scene active pose={pose} onModelReady={onModelReady} />
    <div style={{ position: "fixed", top: 12, right: 12, display: "flex", gap: 12 }}>
      {(["side", "front", "three-quarter"] as const).map(p => <button key={p} onClick={() => setPose(p)}>{p}</button>)}
      <button onClick={() => setPose(undefined)}>Animate</button>
      <button onClick={exportStill}>Export still</button>
      <button onClick={exportModel}>Export model</button>
    </div>
  </main>;
}
