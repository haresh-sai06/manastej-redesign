"use client";
import gsap from "gsap";

/**
 * Shared, mutable state between the GSAP scroll choreography (About section)
 * and the WebGL head (read every frame in useFrame). No React re-renders.
 */
export const headState = {
  intro: 0, // 0 → 1 spin-in progress (time-based, eased)
  scroll: 0, // 0 → 1 progress through the About section and into Features
  entered: false,
  ready: false,
  started: false,
};

let introTween: gsap.core.Tween | null = null;

function maybeStart() {
  if (!headState.entered || !headState.ready || headState.started) return;
  headState.started = true;
  introTween?.kill();
  introTween = gsap.to(headState, { intro: 1, duration: 1.9, ease: "power2.out" });
}

export function markEntered() { headState.entered = true; maybeStart(); }
const readyListeners = new Set<() => void>();
export function onReady(fn: () => void) {
  if (headState.ready) fn(); else readyListeners.add(fn);
  return () => readyListeners.delete(fn);
}
export function markReady() { headState.ready = true; readyListeners.forEach((f) => f()); readyListeners.clear(); maybeStart(); }
export function resetIntro() {
  introTween?.kill();
  headState.entered = false;
  headState.started = false;
  headState.intro = 0;
}
