"use client";
import { useRef } from "react";
import { privacy } from "@/lib/content";
import { useScene, gsap, MQ, riseIn } from "@/lib/motion";

export default function Privacy() {
  const root = useRef<HTMLElement>(null);
  useScene(root, (mm, el) => {
    mm.add(MQ.motion, () => {
      // Stacking cards: each sticky card recedes (scale + dim) as the next one slides over it
      const cards = gsap.utils.toArray<HTMLElement>(".pv-card", el);
      cards.forEach((card, i) => {
        if (i === cards.length - 1) return;
        const st = { trigger: cards[i + 1], start: "top bottom", end: "top 18%", scrub: true };
        gsap.to(card.querySelector(".pv-inner"), { scale: 0.92 - (cards.length - i) * 0.01, yPercent: -4, ease: "none", scrollTrigger: st });
        gsap.to(card.querySelector(".pv-shade"), { opacity: 0.65, ease: "none", scrollTrigger: st });
      });
      gsap.to(".pv-rings", { rotate: 120, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
      gsap.fromTo(".pv-rings", { yPercent: -20 }, { yPercent: 20, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
      riseIn(el);
    });
  });

  return (
    <section id="privacy" ref={root} aria-labelledby="privacy-title" className="relative overflow-clip bg-deep">
      <div className="pv-rings pointer-events-none absolute -right-[20vw] top-[10%] h-[70vw] w-[70vw] max-w-[900px] max-h-[900px]" aria-hidden="true">
        {[1, 0.78, 0.56, 0.34].map((s, i) => (
          <div key={i} className="absolute rounded-full border border-dashed border-mint/15" style={{ inset: `${(1 - s) * 50}%` }} />
        ))}
      </div>
      <div className="relative mx-auto max-w-6xl px-5 py-28 md:py-40">
        <div className="max-w-3xl">
          <p data-rise className="eyebrow mb-5 text-mint">{privacy.label}</p>
          <h2 id="privacy-title" data-rise className="font-serif text-5xl leading-[0.95] text-foam md:text-8xl">
            Privacy is <em className="text-mint">non-negotiable.</em>
          </h2>
          <p data-rise className="mt-6 max-w-xl text-lg text-mist">{privacy.body}</p>
        </div>
        <ol className="mt-20 flex flex-col gap-6">
          {privacy.items.map((p, i) => (
            <li key={p.title} className="pv-card sticky" style={{ top: `calc(14vh + ${i * 22}px)` }}>
              <div className="pv-inner relative grid origin-top gap-6 rounded-[32px] border border-mint/15 bg-[linear-gradient(160deg,#123a35,#0a211e_60%)] shadow-[0_-20px_60px_-20px_rgba(0,0,0,.6)] p-8 md:grid-cols-[auto_1fr_1.2fr] md:items-center md:p-12">
                <span className="pv-shade pointer-events-none absolute inset-0 rounded-[32px] bg-ink opacity-0" aria-hidden="true" />
                <span className="font-serif text-7xl leading-none text-mint/70">0{i + 1}</span>
                <h3 className="font-serif text-4xl text-foam md:text-5xl">{p.title}</h3>
                <p className="text-mist md:text-lg">{p.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="h-[20vh]" aria-hidden="true" />
      </div>
    </section>
  );
}
