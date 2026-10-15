"use client";
import { useLayoutEffect, useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export const MQ = {
  motion: "(prefers-reduced-motion: no-preference)",
  desktop: "(prefers-reduced-motion: no-preference) and (min-width: 768px)",
  mobile: "(prefers-reduced-motion: no-preference) and (max-width: 767px)",
  reduced: "(prefers-reduced-motion: reduce)",
};

/**
 * Runs a GSAP scene scoped to `ref`. The callback receives a gsap.matchMedia
 * instance so every section can declare desktop / mobile / reduced variants.
 * Everything is reverted on unmount.
 */
export function useScene(ref: RefObject<HTMLElement | null>, build: (mm: gsap.MatchMedia, root: HTMLElement) => void) {
  useIso(() => {
    const root = ref.current;
    if (!root) return;
    const mm = gsap.matchMedia(root);
    build(mm, root);
    return () => mm.revert();
  }, []);
}

/** Generic depth parallax: any [data-speed] inside root drifts relative to its section. */
export function depthParallax(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>("[data-speed]").forEach((el) => {
    const speed = parseFloat(el.dataset.speed || "0");
    const trigger = (el.closest("[data-parallax-root]") as HTMLElement) || root;
    gsap.fromTo(
      el,
      { yPercent: 0, y: () => speed * 120 },
      {
        y: () => -speed * 120,
        ease: "none",
        scrollTrigger: { trigger, start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true },
      },
    );
  });
}

/** Scroll-scrubbed word reveal for elements containing .w spans. */
export function wordReveal(root: HTMLElement, selector = "[data-words]") {
  root.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    gsap.fromTo(
      el.querySelectorAll(".w"),
      { opacity: 0.2 },
      { opacity: 1, stagger: 0.08, ease: "none", scrollTrigger: { trigger: el, start: "top 85%", end: "bottom 45%", scrub: true } },
    );
  });
}

/** Simple rise-in for [data-rise] elements. */
export function riseIn(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>("[data-rise]").forEach((el) => {
    gsap.from(el, {
      y: 60, opacity: 0, duration: 1.1, ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  });
}

export { gsap, ScrollTrigger };
