"use client";
import { useRef } from "react";
import { about } from "@/lib/content";
import { useScene, gsap, MQ, wordReveal, riseIn, depthParallax } from "@/lib/motion";
import BrainAnimation from "@/components/BrainAnimation";
import { Words } from "@/components/Words";
import { Leaf } from "@/components/Leaf";

export default function About() {
  const root = useRef<HTMLElement>(null);
  useScene(root, (mm, el) => {
    mm.add(MQ.motion, () => {
      const isDesk = matchMedia("(min-width: 768px)").matches;
      // Pinned: "Manas" and "Tej" drift in from opposite sides and fuse around the head
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: el.querySelector(".ab-stage"), start: "top top", end: "+=180%", pin: true, scrub: 0.7 },
      });
      tl.fromTo(".ab-manas", { xPercent: isDesk ? -60 : -30, opacity: 0.15 }, { xPercent: 0, opacity: 1 }, 0)
        .fromTo(".ab-tej", { xPercent: isDesk ? 60 : 30, opacity: 0.15 }, { xPercent: 0, opacity: 1 }, 0)
        .fromTo(".ab-head", { yPercent: 35 }, { yPercent: 0 }, 0)
        .fromTo(".ab-halo", { scale: 0.4, opacity: 0 }, { scale: 1.1, opacity: 1 }, 0.2)
        .fromTo(".ab-gloss", { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.1 }, 0.5)
        .to(".ab-leaf", { y: (i) => -120 - i * 60, rotate: (i) => (i % 2 ? 90 : -90) }, 0)
        .to(".ab-head", { yPercent: -6 }, 1);
      wordReveal(el);
      riseIn(el);
      depthParallax(el);
    });
  });

  return (
    <section id="about" ref={root} aria-labelledby="about-title" className="relative overflow-hidden">
      {/* White for the pinned Manas / Tej / brain scroll */}
      <div className="ab-stage relative grid h-[100svh] place-items-center overflow-hidden bg-white text-ink">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(232,246,244,0.9)_0%,rgba(255,255,255,1)_55%)]"
          aria-hidden="true"
        />
        <div className="ab-halo absolute left-1/2 top-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(242,196,109,.28),rgba(86,212,207,.18)_40%,transparent_68%)]" aria-hidden="true" />
        {[["12%", "20%"], ["80%", "26%"], ["22%", "74%"], ["72%", "78%"]].map(([x, y], i) => (
          <Leaf key={i} className="ab-leaf absolute h-8 w-8 text-teal/50" style={{ left: x, top: y }} />
        ))}
        <p className="eyebrow absolute left-1/2 top-24 -translate-x-1/2 whitespace-nowrap text-teal">{about.label}</p>
        <div className="relative flex w-full items-center justify-center" aria-hidden="true">
          <div className="ab-manas text-right">
            <div className="font-serif text-[15vw] leading-none tracking-tight text-pine md:text-[13vw]">Manas</div>
            <div className="ab-gloss -mt-2 pr-2 font-serif text-xl italic text-sage md:text-3xl">“mind”</div>
          </div>
          <div className="ab-head relative z-10 -mx-[3vw] w-[30vw] max-w-[300px] md:-mx-[1.5vw] md:w-[17vw]">
            <BrainAnimation />
          </div>
          <div className="ab-tej text-left">
            <div className="font-serif text-[15vw] italic leading-none tracking-tight text-teal md:text-[13vw]">Tej</div>
            <div className="ab-gloss -mt-2 pl-2 font-serif text-xl italic text-sage md:text-3xl">“radiance”</div>
          </div>
        </div>
        <h2 id="about-title" className="sr-only">What is Manastej? {about.title}</h2>
      </div>

      {/* After the brain pin ends: soft white → green, then dark green for copy + cards */}
      <div className="ab-after relative bg-ink text-foam">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,#ffffff_0%,#e8f6f4_28%,#0f2f2b_72%,#051311_100%)]"
          aria-hidden="true"
        />
        <div data-parallax-root className="relative mx-auto max-w-6xl px-5 pb-28 pt-16 md:pb-40 md:pt-24">
          <p className="max-w-4xl font-serif text-3xl leading-[1.15] text-foam md:text-6xl">
            <Words text={about.body} />
          </p>
          <div className="mt-16 grid gap-5 md:mt-24 md:grid-cols-3">
            {about.audiences.map((a, i) => (
              <article key={a.k} data-speed={[0.15, -0.1, 0.3][i]} className="glass rounded-[28px] p-7">
                <div className="mb-10 flex items-center justify-between">
                  <span className="eyebrow text-mint">{a.k}</span>
                  <span className="font-serif text-4xl text-mint/25">0{i + 1}</span>
                </div>
                <h3 className="font-serif text-3xl leading-tight text-foam">{a.title}</h3>
                <p className="mt-4 leading-relaxed text-mist">{a.body}</p>
              </article>
            ))}
          </div>
          <p data-rise className="mt-14 max-w-3xl border-l-2 border-teal/40 pl-4 text-sm text-mist/80">{about.disclaimer}</p>
        </div>
      </div>
    </section>
  );
}
