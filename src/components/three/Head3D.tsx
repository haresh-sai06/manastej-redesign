"use client";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { onReady } from "@/lib/headState";

const HeadScene = dynamic(() => import("./HeadScene"), { ssr: false });

function webglOK() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Glass head slot. Always renders the original artwork; lazily swaps to the WebGL head
 * when the section approaches, WebGL is available and motion is allowed.
 */
export default function Head3D() {
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false); // load 3D bundle
  const [active, setActive] = useState(false); // render loop running
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !webglOK()) return;
    const el = ref.current!;
    const load = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setEnabled(true); load.disconnect(); } }, { rootMargin: "150% 0px" });
    const run = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "20% 0px" });
    load.observe(el); run.observe(el);
    const off = onReady(() => setReady(true));
    return () => { load.disconnect(); run.disconnect(); off(); };
  }, []);

  return (
    <div ref={ref} className="relative">
      <Image
        src="/manastej-head.webp"
        alt=""
        width={495}
        height={604}
        className={`relative h-auto w-full drop-shadow-[0_30px_60px_rgba(42,143,133,.35)] transition-opacity duration-300 ${ready ? "opacity-0" : "opacity-100"}`}
      />
      {enabled && (
        <div className={`absolute -inset-x-[70%] -inset-y-[40%] transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-0"}`} data-head3d>
          <HeadScene active={active} />
        </div>
      )}
    </div>
  );
}
