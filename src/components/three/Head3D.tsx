"use client";
import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { headState, onStartChange } from "@/lib/headState";

const loadScene = () => import("./HeadScene");
const HeadScene = dynamic(loadScene, { ssr: false });

class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

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
      <div className="absolute inset-[-25%] rounded-full bg-[radial-gradient(closest-side,rgba(134,158,103,.24),rgba(92,125,94,.12)_55%,transparent_75%)] blur-xl" />
      <svg viewBox="0 0 495 604" className={`relative h-full w-full ${still ? "" : "animate-[headPulse_2.4s_ease-in-out_infinite]"}`} fill="none">
        <defs>
          <linearGradient id="hp-stroke" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8fa78d" />
            <stop offset="1" stopColor="#5c7d5e" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={PROFILE} stroke="url(#hp-stroke)" strokeWidth="2.5" strokeLinecap="round" />
        <path d={DOME} stroke="#81955e" strokeOpacity=".55" strokeWidth="2" />
        <path d="M194 237C161 214 163 174 196 160C223 183 218 217 194 237ZM253 207C225 179 235 133 270 122C290 152 280 187 253 207ZM313 244C284 216 302 175 340 170C352 204 339 230 313 244ZM240 284C258 324 250 388 268 451M256 356C239 338 227 343 231 359C238 371 249 370 256 356M258 399C277 375 291 381 282 397C275 407 265 408 258 399" stroke="#81955e" strokeOpacity=".45" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/**
 * Glass head slot. A soft glow + line-drawing placeholder holds the space; the WebGL head is
 * preloaded right after first paint (idle) and cross-fades in as its entrance starts.
 * Reduced motion / unavailable WebGL: a matching botanical still.
 */
export default function Head3D() {
  const ref = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"pending" | "3d" | "static">("pending");
  const [enabled, setEnabled] = useState(false); // 3D bundle + models requested
  const [active, setActive] = useState(false); // render loop running
  const [shown, setShown] = useState(false); // entrance has started
  const failed = useRef(false);

  const showStill = useCallback(() => {
    failed.current = true;
    setActive(false);
    setMode("static");
  }, []);

  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const supported = webglOK();
    const syncMode = () => {
      const still = motion.matches || !supported || failed.current;
      setMode(still ? "static" : "3d");
      if (still) setActive(false);
    };
    const onContextLost = (event: Event) => {
      event.preventDefault();
      showStill();
    };
    const el = ref.current!;
    setShown(headState.started);
    const off = onStartChange(setShown);
    syncMode();
    motion.addEventListener("change", syncMode);
    // Context loss does not bubble, so capture it from the descendant canvas.
    el.addEventListener("webglcontextlost", onContextLost, true);
    return () => {
      off();
      motion.removeEventListener("change", syncMode);
      el.removeEventListener("webglcontextlost", onContextLost, true);
    };
  }, [showStill]);

  useEffect(() => {
    if (mode !== "3d") return;
    const el = ref.current!;
    // Preload after first paint when the browser is idle; or immediately if the section is (or is restored) nearby.
    let alive = true;
    let inView = false;
    let idle: number | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const go = () => { if (alive) setEnabled(true); };
    const syncActive = () => { if (alive) setActive(inView && !document.hidden); };
    if ("requestIdleCallback" in window) idle = window.requestIdleCallback(go, { timeout: 2500 });
    else timeout = setTimeout(go, 1200);
    const near = new IntersectionObserver(([e]) => { if (e.isIntersecting) { go(); near.disconnect(); } }, { rootMargin: "150% 0px" });
    const run = new IntersectionObserver(([e]) => { inView = e.isIntersecting; syncActive(); }, { rootMargin: "20% 0px" });
    near.observe(el); run.observe(el);
    document.addEventListener("visibilitychange", syncActive);
    return () => {
      alive = false;
      if (idle !== undefined) window.cancelIdleCallback(idle);
      if (timeout !== undefined) clearTimeout(timeout);
      near.disconnect(); run.disconnect();
      document.removeEventListener("visibilitychange", syncActive);
    };
  }, [mode]);

  return (
    <div ref={ref} className="relative aspect-[495/604] w-full">
      {mode === "static" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/head-botanical-still.webp" alt="" width={1424} height={1672} loading="lazy" decoding="async" className="absolute -inset-[20%] h-[140%] w-[140%] max-w-none object-contain" />
      ) : (
        <Placeholder hidden={mode === "3d" && enabled && shown} still={false} />
      )}
      {mode === "3d" && enabled && (
        <div className={`absolute -inset-x-[70%] -inset-y-[40%] transition-opacity duration-500 ${shown ? "opacity-100" : "opacity-0"}`} data-head3d>
          <SceneBoundary onError={showStill}>
            <HeadScene active={active} />
          </SceneBoundary>
        </div>
      )}
    </div>
  );
}
