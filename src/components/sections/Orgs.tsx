"use client";
import { useRef } from "react";
import { orgs } from "@/lib/content";
import { useScene, gsap, MQ, riseIn, depthParallax } from "@/lib/motion";

// Illustrative team groups (not data): groups under five are suppressed, mirroring the 5+ rule.
const groups = [7, 3, 9, 5, 2, 6];

export default function Orgs() {
  const root = useRef<HTMLElement>(null);
  useScene(root, (mm, el) => {
    mm.add(MQ.motion, () => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: el.querySelector(".og-fig"), start: "top 85%", end: "bottom 25%", scrub: 0.6 } });
      tl.from(".og-dot", { scale: 0, opacity: 0, stagger: { each: 0.02, from: "random" }, duration: 0.3 })
        .to(".og-group.small .og-dot", { opacity: 0.12, scale: 0.6, duration: 0.3 }, ">")
        .to(".og-group.small .og-veil", { opacity: 1, duration: 0.3 }, "<")
        .to(".og-ring", { opacity: 1, duration: 0.3 }, "<")
        .fromTo(".og-caption", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.2 }, ">");
      riseIn(el);
      depthParallax(el);
    });
  });

  return (
    <section id="organizations" ref={root} aria-labelledby="orgs-title" className="relative bg-foam text-ink">
      <div className="mx-auto grid max-w-6xl gap-14 px-5 py-28 md:grid-cols-[1fr_1.05fr] md:py-40">
        <div className="md:sticky md:top-24 md:self-start">
          <p className="eyebrow mb-5 text-teal">{orgs.label}</p>
          <h2 id="orgs-title" className="font-serif text-5xl leading-[0.95] md:text-7xl">
            {orgs.title} <em className="block text-teal">— {orgs.subtitle}</em>
          </h2>
          <p className="mt-6 max-w-md text-lg text-sage">{orgs.body}</p>

          <figure className="og-fig mt-10 rounded-[28px] bg-white/70 p-5 ring-1 ring-teal/10" aria-label="Illustration: only groups of five or more are shown">
            <div className="grid grid-cols-3 gap-3">
              {groups.map((n, gi) => (
                <div key={gi} className={`og-group relative rounded-2xl bg-cream p-3 ${n < 5 ? "small" : "big"}`}>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: n }).map((_, k) => <span key={k} className="og-dot block h-3 w-3 rounded-full bg-teal" />)}
                  </div>
                  {n >= 5 && <span className="og-ring pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-teal/40 opacity-0" aria-hidden="true" />}
                  {n < 5 && <span className="og-veil absolute inset-0 grid place-items-center rounded-2xl text-[10px] font-semibold uppercase tracking-widest text-sage opacity-0">Suppressed</span>}
                </div>
              ))}
            </div>
            <figcaption className="og-caption mt-4 text-xs text-sage">Illustrative only — {orgs.items[2].body}</figcaption>
          </figure>
        </div>

        <div data-parallax-root className="og-cards flex flex-col gap-5 md:pt-40">
          {orgs.items.map((o, i) => (
            <article key={o.tag} data-speed={i % 2 ? 0.25 : -0.1} className="glass-light rounded-[28px] p-8 md:p-10">
              <p className="eyebrow text-teal">{o.tag}</p>
              <h3 className="mt-4 font-serif text-4xl leading-tight">{o.title}</h3>
              <p className="mt-4 text-sage">{o.body}</p>
              {i === 1 && (
                <ul className="mt-6 flex flex-wrap gap-2" aria-label="VUCA">
                  {["Volatility", "Uncertainty", "Complexity", "Ambiguity"].map((v) => (
                    <li key={v} className="rounded-full bg-teal/10 px-3 py-1 text-xs font-semibold text-teal">{v}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
