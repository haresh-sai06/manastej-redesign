"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { onStartChange } from "@/lib/headState";

const loadScene = () => import("./HeadScene");
const HeadScene = dynamic(loadScene, { ssr: false });

function webglOK() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Side-profile line drawing of a head (faces left), used by the loading placeholder. */
const PROFILE =
  "M175 600C178 540 182 500 178 470C160 466 140 462 128 452C112 438 104 420 100 404C92 398 90 388 94 380C86 372 88 362 94 356C80 350 60 342 46 330C40 322 46 314 58 306C70 290 80 268 86 246C88 232 90 222 92 212C96 150 140 70 230 40C320 12 410 60 436 150C454 210 446 290 420 340C404 370 392 400 384 430C376 470 384 540 404 600";
const DOME = "M118 205C122 120 190 70 262 68C352 66 410 130 408 215C406 262 380 290 340 292C300 300 270 280 240 286C200 292 160 280 134 258C122 246 117 228 118 205Z";

function Placeholder({ hidden, still }: { hidden: boolean; still: boolean }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${hidden ? "opacity-0" : "opacity-100"}`}>
      <div className="absolute inset-[-25%] rounded-full bg-[radial-gradient(closest-side,rgba(79,179,234,.30),rgba(42,143,133,.16)_55%,transparent_75%)] blur-xl" />
      <svg viewBox="0 0 495 604" className={`relative h-full w-full ${still ? "" : "animate-[headPulse_2.4s_ease-in-out_infinite]"}`} fill="none">
        <defs>
          <linearGradient id="hp-stroke" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#4fb3ea" />
            <stop offset="1" stopColor="#2a8f85" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={PROFILE} stroke="url(#hp-stroke)" strokeWidth="2.5" strokeLinecap="round" />
        <path d={DOME} stroke="#e8a0b6" strokeOpacity=".55" strokeWidth="2" />
      </svg>
    </div>
  );
}

/**
 * Glass head slot. A soft glow + line-drawing placeholder holds the space; the WebGL head is
 * preloaded right after first paint (idle) and cross-fades in as it starts spinning in.
 * Reduced motion / no WebGL: a pre-rendered still of the same 3D head.
 */
export default function Head3D() {
  const ref = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"pending" | "3d" | "static">("pending");
  const [enabled, setEnabled] = useState(false); // 3D bundle + models requested
  const [active, setActive] = useState(false); // render loop running
  const [shown, setShown] = useState(false); // spin-in has started

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !webglOK()) { setMode("static"); return; }
    setMode("3d");
    const el = ref.current!;
    // Preload after first paint when the browser is idle; or immediately if the section is (or is restored) nearby.
    let alive = true;
    const go = () => { if (alive) setEnabled(true); };
    if ("requestIdleCallback" in window) window.requestIdleCallback(go, { timeout: 2500 });
    else setTimeout(go, 1200);
    const near = new IntersectionObserver(([e]) => { if (e.isIntersecting) { go(); near.disconnect(); } }, { rootMargin: "150% 0px" });
    const run = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "20% 0px" });
    near.observe(el); run.observe(el);
    const off = onStartChange(setShown);
    return () => {
      alive = false;
      near.disconnect(); run.disconnect(); off();
    };
  }, []);

  return (
    <div ref={ref} className="relative aspect-[495/604] w-full">
      {mode === "static" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/head-3d-still.webp" alt="" width={684} height={836} loading="lazy" decoding="async" className="absolute -inset-[20%] h-[140%] w-[140%] max-w-none object-contain" />
      ) : (
        <Placeholder hidden={shown} still={false} />
      )}
      {mode === "3d" && enabled && (
        <div className={`absolute -inset-x-[70%] -inset-y-[40%] transition-opacity duration-500 ${shown ? "opacity-100" : "opacity-0"}`} data-head3d>
          <HeadScene active={active} />
        </div>
      )}
    </div>
  );
}
