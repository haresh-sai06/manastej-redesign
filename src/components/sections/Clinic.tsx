"use client";
import { useRef } from "react";
import { clinic } from "@/lib/content";
import { useScene, gsap, MQ, riseIn, depthParallax } from "@/lib/motion";

export default function Clinic() {
  const root = useRef<HTMLElement>(null);
  useScene(root, (mm, el) => {
    mm.add(MQ.motion, () => {
      riseIn(el);
      depthParallax(el);
      gsap.fromTo(el.querySelector(".cl-video"), { scale: 0.92, borderRadius: 48 }, {
        scale: 1, borderRadius: 32, ease: "none",
        scrollTrigger: { trigger: el.querySelector(".cl-hero"), start: "top 80%", end: "bottom 60%", scrub: true },
      });
      el.querySelectorAll<HTMLElement>(".cl-station").forEach((s) => {
        gsap.from(s, { x: -40, opacity: 0, duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: s, start: "top 88%", once: true } });
      });
      gsap.fromTo(".cl-rail", { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: el.querySelector(".cl-list"), start: "top 70%", end: "bottom 60%", scrub: true } });
    });
  });

  return (
    <section id="clinic" ref={root} aria-labelledby="clinic-title" className="relative overflow-hidden bg-gradient-to-b from-white via-cream to-foam/60 py-24 text-ink md:py-36">
      <div aria-hidden="true" data-speed="0.4" className="pointer-events-none absolute -right-40 top-20 h-[32rem] w-[32rem] rounded-full bg-teal/10 blur-3xl" />
      <div aria-hidden="true" data-speed="-0.3" className="pointer-events-none absolute -left-40 bottom-40 h-[28rem] w-[28rem] rounded-full bg-pine/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-5 md:px-10">
        <div className="cl-hero grid items-center gap-12 md:grid-cols-[1fr_1.15fr]">
          <div>
            <p data-rise className="eyebrow mb-5 text-pine">{clinic.eyebrow}</p>
            <h2 id="clinic-title" data-rise className="font-serif text-5xl leading-[0.95] text-deep md:text-7xl">{clinic.title}</h2>
            <p data-rise className="mt-6 max-w-lg text-lg text-ink/70">{clinic.lead}</p>
          </div>
          <figure data-rise>
            <div className="cl-video overflow-hidden rounded-[32px] shadow-2xl shadow-deep/20">
              <video className="aspect-video h-full w-full object-cover" src={clinic.video.hero.src} autoPlay muted loop playsInline preload="metadata" />
            </div>
            <figcaption className="mt-4 text-sm text-ink/60">{clinic.video.hero.caption}</figcaption>
          </figure>
        </div>

        <div className="mt-24 grid gap-6 md:mt-32 md:grid-cols-2">
          {clinic.problems.map((p, i) => (
            <article key={p.title} data-rise data-speed={i ? "-0.15" : "0.15"} className="rounded-[32px] border border-pine/10 bg-white/80 p-8 shadow-xl shadow-deep/5 backdrop-blur md:p-10">
              <p className="eyebrow mb-4 text-teal">Problem {String(i + 1).padStart(2, "0")}</p>
              <h3 className="font-serif text-3xl text-deep md:text-4xl">{p.title}</h3>
              <p className="mt-4 text-ink/70">{p.body}</p>
            </article>
          ))}
        </div>

        <div className="cl-list relative mt-24 md:mt-32">
          <span aria-hidden="true" className="cl-rail absolute left-[1.15rem] top-0 h-full w-px origin-top bg-pine/30 md:left-[1.65rem]" />
          <ol className="space-y-10">
            {clinic.features.map((f, i) => (
              <li key={f.title} className="cl-station relative grid gap-6 pl-12 md:pl-20">
                <span className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-full bg-deep text-xs font-semibold text-foam md:h-14 md:w-14 md:text-base">{String(i + 1).padStart(2, "0")}</span>
                <div className={f.proof ? "grid items-center gap-8 md:grid-cols-2" : ""}>
                  <div>
                    <h3 className="font-serif text-2xl text-deep md:text-3xl">{f.title}</h3>
                    <p className="mt-2 max-w-xl text-ink/70">{f.body}</p>
                  </div>
                  {f.proof && (
                    <figure>
                      <div className="overflow-hidden rounded-[28px] shadow-xl shadow-deep/15">
                        <video className="aspect-video w-full object-cover" src={clinic.video.proof.src} autoPlay muted loop playsInline preload="metadata" />
                      </div>
                      <figcaption className="mt-3 text-sm text-ink/60">{clinic.video.proof.caption}</figcaption>
                    </figure>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>

        <p data-rise className="mx-auto mt-24 max-w-3xl text-center font-serif text-3xl italic text-deep md:text-4xl">{clinic.closing}</p>
      </div>
    </section>
  );
}
