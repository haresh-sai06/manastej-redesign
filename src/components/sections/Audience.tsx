"use client";
import { useRef } from "react";
import { audience } from "@/lib/content";
import { useScene, gsap, MQ, riseIn } from "@/lib/motion";

export default function Audience() {
  const root = useRef<HTMLElement>(null);
  useScene(root, (mm, el) => {
    mm.add(MQ.motion, () => {
      // Giant words slide in opposite directions (text parallax); the copy column scrub-fades in
      el.querySelectorAll<HTMLElement>(".au-row").forEach((row, i) => {
        const dir = i % 2 ? 1 : -1;
        gsap.fromTo(row.querySelector(".au-word"), { xPercent: -18 * dir }, { xPercent: 10 * dir, ease: "none", scrollTrigger: { trigger: row, start: "top bottom", end: "bottom top", scrub: true } });
        gsap.fromTo(row.querySelector(".au-copy"), { opacity: 0, y: 50 }, { opacity: 1, y: 0, ease: "none", scrollTrigger: { trigger: row, start: "top 85%", end: "top 45%", scrub: true } });
        gsap.fromTo(row.querySelector(".au-line"), { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: row, start: "top 90%", end: "top 40%", scrub: true } });
      });
      riseIn(el);
    });
  });
  return (
    <section id="audience" ref={root} aria-labelledby="aud-title" className="relative overflow-hidden bg-cream py-28 text-ink md:py-40">
      <div className="mx-auto max-w-6xl px-5">
        <p data-rise className="eyebrow mb-5 text-teal">{audience.label}</p>
        <h2 id="aud-title" data-rise className="max-w-3xl font-serif text-5xl leading-[0.95] md:text-7xl">
          Built for people, <em className="text-teal">wherever they are.</em>
        </h2>
        <p data-rise className="mt-6 max-w-xl text-lg text-sage">{audience.body}</p>
      </div>
      <div className="mt-16 md:mt-24">
        {audience.items.map((a, i) => (
          <div key={a.title} className="au-row relative py-8 md:py-12">
            <span className="au-line absolute inset-x-0 top-0 block h-px origin-left bg-teal/20" aria-hidden="true" />
            <div className="au-word whitespace-nowrap px-5 font-serif text-[22vw] leading-[0.85] tracking-[-0.04em] text-pine md:text-[15vw]" aria-hidden="true">
              {i === 1 ? <em className="text-teal">{a.title}</em> : a.title}
            </div>
            <div className="au-copy mx-auto mt-4 flex max-w-6xl items-start justify-between gap-6 px-5">
              <h3 className="font-serif text-2xl text-ink">0{i + 1} — {a.title}</h3>
              <p className="max-w-sm text-right text-sage">{a.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
