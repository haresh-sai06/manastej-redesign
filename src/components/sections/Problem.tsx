"use client";
import { useRef } from "react";
import { problem } from "@/lib/content";
import { useScene, gsap, MQ, wordReveal, riseIn } from "@/lib/motion";
import { Words } from "@/components/Words";

export default function Problem() {
  const root = useRef<HTMLElement>(null);
  useScene(root, (mm, el) => {
    mm.add(MQ.desktop, () => {
      el.classList.add("pb-pinned");
      const stage = el.querySelector(".pb-stage")!;
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: stage, start: "top top", end: "+=260%", pin: true, scrub: 0.7, anticipatePin: 1 },
      });
      tl.fromTo(".pb-title .w", { opacity: 0.12 }, { opacity: 1, stagger: 0.05, duration: 0.6 }, 0)
        .fromTo(".pb-bg", { scale: 1.25 }, { scale: 1, duration: 3 }, 0)
        .from(".pb-stat", { y: 120, opacity: 0, stagger: 0.12, duration: 0.6 }, 0.35)
        .to(".pb-intro", { yPercent: -40, opacity: 0, duration: 0.6 }, 1.25)
        .to(".pb-stats", { y: -60, opacity: 0.0, duration: 0.6 }, 1.25)
        .fromTo(".pb-fail-label", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.4 }, 1.5)
        // Cards start stacked in the center like a deck, then fan into place
        .fromTo(
          ".pb-card",
          { xPercent: (i) => (1 - i) * 100, rotate: (i) => (i - 1) * 6, y: 260, opacity: 0, scale: 0.9 },
          { xPercent: 0, rotate: 0, y: 0, opacity: 1, scale: 1, stagger: 0.1, duration: 0.9, ease: "power2.out" },
          1.6,
        )
        .to(".pb-card .crack", { scaleX: 1, stagger: 0.1, duration: 0.4 }, 2.4);
      return () => el.classList.remove("pb-pinned");
    });
    mm.add(MQ.mobile, () => { wordReveal(el); riseIn(el); });
  });

  return (
    <section id="problem" ref={root} aria-labelledby="problem-title" className="relative bg-ink">
      <div className="pb-stage relative overflow-hidden">
        <div className="pb-bg pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-1/2 top-1/3 h-[70vmax] w-[70vmax] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(15,47,43,.9),transparent_60%)]" />
          <svg className="absolute inset-0 h-full w-full opacity-[.08]"><defs><pattern id="g" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="#9dc4be" strokeWidth=".6" /></pattern></defs><rect width="100%" height="100%" fill="url(#g)" /></svg>
        </div>

        <div className="relative mx-auto grid h-full max-w-6xl px-5 py-24">
          {/* Beat 1: title + stats */}
          <div className="col-start-1 row-start-1 flex flex-col justify-center gap-12">
            <div className="pb-intro">
              <p className="eyebrow mb-5 text-mint">— {problem.label}</p>
              <h2 id="problem-title" className="pb-title max-w-4xl font-serif text-5xl leading-[0.95] text-foam md:text-8xl">
                <Words text={problem.title} />
              </h2>
              <p data-rise className="mt-6 max-w-xl text-lg text-mist">{problem.body}</p>
            </div>
            <dl className="pb-stats grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-white/10 md:grid-cols-4">
              {problem.stats.map((s) => (
                <div key={s.label} data-rise className="pb-stat bg-ink/95 p-5 md:p-7">
                  <dt className="eyebrow text-[10px] text-mist/80">{s.label}</dt>
                  <dd className="mt-3 font-serif text-5xl text-foam md:text-6xl">{s.value}</dd>
                  <dd className="mt-1 text-sm text-mist">{s.note}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Beat 2: the three failures */}
          <div className="pb-beat2 col-start-1 row-start-2 mt-16 flex flex-col justify-center">
            <p data-rise className="pb-fail-label eyebrow mb-8 text-center text-radiance">{problem.failuresLabel}</p>
            <div className="grid gap-4 md:grid-cols-3 md:gap-5">
              {problem.failures.map((f, i) => (
                <article key={f.who} data-rise className="pb-card glass relative overflow-hidden rounded-[28px] p-7 md:min-h-[330px]">
                  <span className="font-serif text-7xl text-white/10" aria-hidden="true">0{i + 1}</span>
                  <p className="eyebrow mt-2 text-mint">{f.who}</p>
                  <h3 className="mt-3 font-serif text-4xl text-foam">{f.title}</h3>
                  <p className="mt-4 text-[15px] leading-relaxed text-mist">{f.body}</p>
                  <span className="crack absolute bottom-0 left-0 h-[3px] w-full origin-left scale-x-0 bg-gradient-to-r from-radiance/80 to-transparent md:scale-x-0" aria-hidden="true" />
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-white"
        aria-hidden="true"
      />
    </section>
  );
}
