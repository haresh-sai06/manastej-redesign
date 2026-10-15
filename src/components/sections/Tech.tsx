"use client";
import { useRef } from "react";
import { tech } from "@/lib/content";
import { useScene, gsap, MQ, riseIn } from "@/lib/motion";

export default function Tech() {
  const root = useRef<HTMLElement>(null);
  useScene(root, (mm, el) => {
    mm.add(MQ.desktop, () => {
      el.classList.add("tc-on");
      const nodes = gsap.utils.toArray<HTMLElement>(".tc-node", el);
      const place = (off: number) => {
        const rx = Math.min(innerWidth * 0.4, 560), ry = Math.min(innerHeight * 0.36, 330);
        nodes.forEach((node, i) => {
          const a = (i / nodes.length) * Math.PI * 2 - Math.PI / 2 + off;
          gsap.set(node, { x: Math.cos(a) * rx, y: Math.sin(a) * ry, xPercent: -50, yPercent: -50, zIndex: Math.sin(a) > 0 ? 2 : 1 });
        });
      };
      const state = { off: -0.6 };
      place(state.off);
      const tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: el.querySelector(".tc-stage"), start: "top top", end: "+=200%", pin: true, scrub: 0.8 } });
      tl.to(state, { off: 1.6, duration: 1, onUpdate: () => place(state.off) }, 0)
        .from(".tc-node-inner", { scale: 0.4, opacity: 0, stagger: 0.06, duration: 0.25 }, 0)
        .fromTo(".tc-ring", { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.06, duration: 0.3 }, 0)
        .fromTo(".tc-core", { scale: 0.85, opacity: 0.3 }, { scale: 1, opacity: 1, duration: 0.3 }, 0.05)
        .to(".tc-core-glow", { scale: 1.4, opacity: 0.9, duration: 1 }, 0);
      const onResize = () => place(state.off);
      addEventListener("resize", onResize);
      return () => { removeEventListener("resize", onResize); el.classList.remove("tc-on"); };
    });
    mm.add(MQ.mobile, () => riseIn(el));
  });

  return (
    <section id="technology" ref={root} aria-labelledby="tech-title" className="relative bg-ink">
      <div className="tc-stage relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-5 py-28">
          <div className="tc-core relative z-10 mx-auto max-w-xl text-center">
            <div className="tc-core-glow pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[60vmin] w-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(42,143,133,.35),transparent_65%)] opacity-50" aria-hidden="true" />
            <p className="eyebrow mb-5 text-mint">{tech.label}</p>
            <h2 id="tech-title" className="font-serif text-5xl leading-[0.95] text-foam md:text-7xl">
              Science-led. <em className="text-radiance">Human-centered.</em>
            </h2>
            <p className="mx-auto mt-6 max-w-md text-mist">{tech.body}</p>
          </div>

          {/* Orbit (desktop + motion) */}
          <div className="tc-orbit-wrap pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2" aria-hidden="true">
            {[1, 0.72].map((s, i) => (
              <div key={i} className="tc-ring absolute rounded-[50%] border border-mint/15" style={{ width: `calc(${s} * min(80vw, 1120px))`, height: `calc(${s} * min(72vh, 660px))`, left: `calc(${s} * min(80vw, 1120px) / -2)`, top: `calc(${s} * min(72vh, 660px) / -2)` }} />
            ))}
            <div className="tc-orbit absolute left-1/2 top-1/2 h-0 w-0">
              {tech.items.map((t) => {
                return (
                  <div key={t.title} className="tc-node absolute left-0 top-0">
                    <div className="tc-node-inner glass w-52 rounded-2xl p-4 text-left">
                      <span className="mb-2 block h-1.5 w-1.5 rounded-full bg-mint" />
                      <p className="font-serif text-xl text-foam">{t.title}</p>
                      <p className="mt-1 text-xs text-mist">{t.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Accessible list (also the mobile / reduced-motion layout) */}
          <ul className="tc-list mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {tech.items.map((t) => (
              <li key={t.title} data-rise className="glass rounded-2xl p-5">
                <p className="font-serif text-2xl text-foam">{t.title}</p>
                <p className="mt-2 text-sm text-mist">{t.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
