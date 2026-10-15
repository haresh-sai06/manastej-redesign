"use client";
import { useRef } from "react";
import { hero } from "@/lib/content";
import { useScene, gsap, MQ } from "@/lib/motion";
import { Leaf } from "@/components/Leaf";

function Row({ items, serif }: { items: string[]; serif?: boolean }) {
  const list = [...items, ...items, ...items, ...items];
  return (
    <>
      {list.map((t, i) => (
        <span key={i} className={`flex items-center gap-8 pr-8 ${serif ? "font-serif text-5xl italic text-foam md:text-7xl" : "eyebrow text-mist"}`}>
          {t}
          <Leaf className={serif ? "h-6 w-6 text-mint" : "h-3 w-3 text-teal-2"} />
        </span>
      ))}
    </>
  );
}

export default function Marquee() {
  const root = useRef<HTMLElement>(null);
  useScene(root, (mm, el) => {
    mm.add(MQ.motion, () => {
      // Scroll-linked drift on top of the CSS marquee: rows move in opposite directions (text parallax).
      gsap.fromTo(".mq-a", { xPercent: 0 }, { xPercent: -12, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
      gsap.fromTo(".mq-b", { xPercent: -12 }, { xPercent: 0, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
    });
  });
  return (
    <section ref={root} aria-label="What Manastej connects" className="relative overflow-hidden border-y border-white/5 bg-deep py-10 md:py-14">
      <ul className="sr-only">{hero.pillars.map((p) => <li key={p}>{p}</li>)}{hero.steps.map((s) => <li key={s}>{s}</li>)}</ul>
      <div aria-hidden="true" className="mq-a"><div className="marquee"><Row items={hero.pillars} serif /></div></div>
      <div aria-hidden="true" className="mq-b mt-6"><div className="marquee rev"><Row items={hero.steps.map((s, i) => `0${i + 1} ${s}`)} /></div></div>
    </section>
  );
}
