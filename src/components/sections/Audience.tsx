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
        gsap.fromTo(row.querySelector(".au-word"), { xPercent: -6 * dir }, { xPercent: 6 * dir, ease: "none", scrollTrigger: { trigger: row, start: "top bottom", end: "bottom top", scrub: true } });
        gsap.fromTo(row.querySelector(".au-copy"), { opacity: 0, y: 50 }, { opacity: 1, y: 0, ease: "none", scrollTrigger: { trigger: row, start: "top 85%", end: "top 45%", scrub: true } });
        gsap.fromTo(row.querySelector(".au-line"), { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: row, start: "top 90%", end: "top 40%", scrub: true } });
      });
      riseIn(el);
    });
  });
  return (
    <section id="audience" ref={root} aria-labelledby="aud-title" className="relative overflow-hidden bg-ink py-28 text-foam md:py-40">
      <div className="mx-auto max-w-6xl px-5">
        <p data-rise className="eyebrow mb-5 text-mint">{audience.label}</p>
        <h2 id="aud-title" data-rise className="max-w-3xl font-serif text-5xl leading-[0.95] md:text-7xl">
          Built for people, <em className="text-mint">wherever they are.</em>
        </h2>
        <p data-rise className="mt-6 max-w-xl text-lg text-mist">{audience.body}</p>
      </div>
      <div className="mt-16 md:mt-24">
        {audience.items.map((a, i) => (
          <div key={a.title} className="au-row relative py-8 md:py-12">
            <span className="au-line absolute inset-x-0 top-0 block h-px origin-left bg-mist/15" aria-hidden="true" />
            <div className="au-word whitespace-nowrap px-5 text-center font-serif text-[22vw] leading-[0.85] tracking-[-0.04em] text-foam/90 md:text-[15vw]" aria-hidden="true">
              {i === 1 ? <em className="text-mint">{a.title}</em> : a.title}
            </div>
            <div className="au-copy mx-auto mt-6 flex max-w-2xl flex-col items-center gap-3 px-5 text-center">
              <h3 className="font-serif text-2xl text-foam">0{i + 1} — {a.title}</h3>
              <p className="max-w-md text-mist">{a.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
