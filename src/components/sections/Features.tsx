"use client";
import { useRef } from "react";
import { features } from "@/lib/content";
import { useScene, gsap, MQ } from "@/lib/motion";
import { FeatureArt } from "@/components/FeatureArt";

export default function Features() {
  const root = useRef<HTMLElement>(null);
  useScene(root, (mm, el) => {
    mm.add(MQ.motion, () => {
      el.classList.add("hz-on");
      const track = el.querySelector<HTMLElement>(".hz-track")!;
      const dist = () => track.scrollWidth - innerWidth;
      const tween = gsap.to(track, {
        x: () => -dist(),
        ease: "none",
        scrollTrigger: {
          trigger: el.querySelector(".hz-stage"),
          start: "top top",
          end: () => `+=${dist()}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });
      gsap.to(".hz-progress", { scaleX: 1, ease: "none", scrollTrigger: { trigger: el.querySelector(".hz-stage"), start: "top top", end: () => `+=${dist()}`, scrub: true, invalidateOnRefresh: true } });
      // Inner parallax inside each panel, driven by the horizontal tween
      el.querySelectorAll<HTMLElement>(".hz-card").forEach((card) => {
        const st = { trigger: card, containerAnimation: tween, start: "left right", end: "right left", scrub: true };
        gsap.fromTo(card.querySelector(".hz-num"), { xPercent: 60 }, { xPercent: -60, ease: "none", scrollTrigger: st });
        gsap.fromTo(card.querySelector(".hz-art"), { xPercent: -18, scale: 1.1 }, { xPercent: 18, scale: 1, ease: "none", scrollTrigger: st });
        gsap.from(card.querySelectorAll(".hz-text > *"), { y: 40, opacity: 0, stagger: 0.08, duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: card, containerAnimation: tween, start: "left 75%", once: true } });
      });
      // Giant background word drifts slower than the track (depth)
      gsap.to(".hz-bgword", { xPercent: -30, ease: "none", scrollTrigger: { trigger: el.querySelector(".hz-stage"), start: "top top", end: () => `+=${dist()}`, scrub: true, invalidateOnRefresh: true } });
      return () => el.classList.remove("hz-on");
    });
  });

  return (
    <section id="features" ref={root} aria-labelledby="features-title" className="relative bg-ink">
      <div className="hz-stage relative overflow-hidden">
        <div className="hz-bgword pointer-events-none absolute -left-[5vw] top-1/2 hidden -translate-y-1/2 whitespace-nowrap font-serif text-[28vw] italic leading-none text-white/[0.025] md:block" aria-hidden="true">
          reflect · care · connect · grow
        </div>
        <div className="hz-track relative flex flex-col gap-6 px-5 py-24">
          <header className="hz-intro flex shrink-0 flex-col justify-center md:pr-16">
            <p className="eyebrow mb-5 text-mint">{features.label}</p>
            <h2 id="features-title" className="font-serif text-5xl leading-[0.95] text-foam md:text-7xl">
              Core Features of the <em className="text-mint">Manastej</em> Platform
            </h2>
            <p className="mt-6 max-w-md text-lg text-mist">{features.body}</p>
            <p className="eyebrow mt-10 hidden items-center gap-3 text-mist/70 md:flex" aria-hidden="true">Keep scrolling <span className="inline-block h-px w-16 bg-mist/40" /></p>
          </header>
          {features.items.map((f, i) => (
            <article key={f.tag} className="hz-card glass relative flex shrink-0 flex-col overflow-hidden rounded-[32px]">
              <div className="hz-art relative h-48 overflow-hidden md:h-[42%]">
                <FeatureArt i={i} />
              </div>
              <span className="hz-num pointer-events-none absolute right-6 top-4 font-serif text-[7rem] leading-none text-white/[0.06] md:text-[11rem]" aria-hidden="true">0{i + 1}</span>
              <div className="hz-text relative mt-auto p-7 md:p-10">
                <p className="eyebrow text-mint">{f.tag}</p>
                <h3 className="mt-3 font-serif text-3xl leading-tight text-foam md:text-5xl">{f.title}</h3>
                <p className="mt-4 max-w-lg text-mist md:text-lg">{f.body}</p>
                <p className="mt-6 inline-flex items-start gap-2 rounded-2xl bg-white/[0.04] px-3 py-2 text-xs text-mist/80"><span aria-hidden="true">ⓘ</span>{f.note}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="absolute inset-x-5 bottom-6 hidden h-px bg-white/10 md:block" aria-hidden="true">
          <div className="hz-progress h-full origin-left scale-x-0 bg-mint" />
        </div>
      </div>
    </section>
  );
}
