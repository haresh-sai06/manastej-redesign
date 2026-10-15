"use client";
import Image from "next/image";
import { useRef } from "react";
import { hero } from "@/lib/content";
import { useScene, gsap, MQ } from "@/lib/motion";
import { Leaf } from "@/components/Leaf";

const leaves = [
  { x: "8%", y: "22%", s: 34, r: -20, d: 1.8, c: "text-mint" },
  { x: "86%", y: "18%", s: 26, r: 40, d: 2.2, c: "text-teal-2" },
  { x: "78%", y: "72%", s: 44, r: 120, d: 2.6, c: "text-mint" },
  { x: "14%", y: "78%", s: 22, r: 200, d: 1.4, c: "text-teal-2" },
  { x: "62%", y: "10%", s: 18, r: 80, d: 1.2, c: "text-mist" },
  { x: "30%", y: "64%", s: 16, r: -60, d: 3.0, c: "text-radiance" },
  { x: "92%", y: "48%", s: 20, r: 10, d: 2.0, c: "text-mist" },
  { x: "4%", y: "50%", s: 28, r: 150, d: 2.4, c: "text-mint" },
];

export default function Hero() {
  const root = useRef<HTMLElement>(null);

  useScene(root, (mm, el) => {
    mm.add(MQ.motion, () => {
      // Intro: masked rise
      gsap.to(el.querySelectorAll("[data-intro]"), { opacity: 1, y: 0, duration: 1.4, ease: "expo.out", stagger: 0.09, delay: 0.15 });
      gsap.from(el.querySelector(".hero-mark"), { scale: 0.82, duration: 2.2, ease: "expo.out" });
      gsap.from(el.querySelectorAll(".ring"), { scale: 0.3, opacity: 0, duration: 2.4, ease: "expo.out", stagger: 0.12 });

      // Pinned multi-layer depth scene (sticky stage inside a 220vh track)
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: 0.6 },
      });
      tl.to(".layer-aurora", { yPercent: -12, scale: 1.15 }, 0)
        .to(".layer-deva", { yPercent: -40, opacity: 0.9 }, 0)
        .to(".ring", { scale: (i) => 1.6 + i * 0.35, opacity: 0, stagger: 0.02 }, 0)
        .to(".hero-mark", { scale: 2.4, yPercent: -10, opacity: 0 }, 0)
        .to(".hero-copy", { yPercent: -60, opacity: 0 }, 0)
        .to(".leaf", { y: (i) => -260 * leaves[i].d, rotate: (i) => leaves[i].r + 140, ease: "none" }, 0)
        .fromTo(".hero-quote", { opacity: 0, y: 80, scale: 0.94 }, { opacity: 1, y: 0, scale: 1 }, 0.45)
        .fromTo(".hero-quote .w", { opacity: 0.1 }, { opacity: 1, stagger: 0.03 }, 0.5);

      // Pointer parallax on depth layers (desktop pointers only)
      if (matchMedia("(hover: hover)").matches) {
        const layers = gsap.utils.toArray<HTMLElement>("[data-depth]", el);
        const setters = layers.map((l) => ({
          x: gsap.quickTo(l, "x", { duration: 1.2, ease: "power3" }),
          y: gsap.quickTo(l, "y", { duration: 1.2, ease: "power3" }),
          d: parseFloat(l.dataset.depth || "0"),
        }));
        const onMove = (e: PointerEvent) => {
          const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
          setters.forEach((s) => { s.x(nx * s.d * 60); s.y(ny * s.d * 40); });
        };
        addEventListener("pointermove", onMove);
        return () => removeEventListener("pointermove", onMove);
      }
    });
  });

  return (
    <section id="home" ref={root} className="relative h-[230vh]" aria-label="Introduction">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* L0 aurora */}
        <div className="layer-aurora absolute inset-0 -z-0" aria-hidden="true">
          <div className="absolute left-1/2 top-1/2 h-[90vmax] w-[90vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(42,143,133,.45),rgba(5,19,17,0)_60%)]" />
          <div className="absolute -left-[10%] top-[10%] h-[50vmax] w-[50vmax] rounded-full bg-[radial-gradient(circle,rgba(86,212,207,.18),transparent_65%)]" />
          <div className="absolute -right-[15%] bottom-[-10%] h-[55vmax] w-[55vmax] rounded-full bg-[radial-gradient(circle,rgba(242,196,109,.12),transparent_60%)]" />
        </div>
        {/* L1 Devanagari wordmark */}
        <div className="layer-deva pointer-events-none absolute inset-x-0 top-[66%] text-center opacity-40" aria-hidden="true">
          <div data-depth="0.2" className="font-deva text-outline whitespace-nowrap text-[30vw] leading-none md:text-[22vw]">मनस्तेज</div>
        </div>
        {/* L2 radiance rings */}
        <div className="pointer-events-none absolute inset-x-0 top-[30%] grid place-items-center md:top-[31%]" aria-hidden="true">
          <div data-depth="0.4" className="relative grid place-items-center">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="ring absolute rounded-full border border-mint/10" style={{ width: `${30 + i * 18}vmin`, height: `${30 + i * 18}vmin` }} />
            ))}
          </div>
        </div>
        {/* L3 brain mark */}
        <div className="pointer-events-none absolute inset-x-0 top-[30%] grid -translate-y-1/2 place-items-center md:top-[31%]" aria-hidden="true">
          <div data-depth="0.7" className="hero-mark relative">
            <div className="anim-breathe absolute inset-[-40%] rounded-full bg-[radial-gradient(circle,rgba(86,212,207,.35),transparent_62%)]" />
            <Image src="/manastej-mark.webp" alt="" width={400} height={308} priority className="relative w-[46vw] max-w-[300px] opacity-95 md:w-[26vmin] drop-shadow-[0_0_40px_rgba(86,212,207,.45)]" />
          </div>
        </div>
        {/* L4 leaves (foreground, fastest) */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {leaves.map((l, i) => (
            <div key={i} data-depth={l.d * 0.6} className="absolute" style={{ left: l.x, top: l.y }}>
              <Leaf className={`leaf ${l.c}`} style={{ width: l.s, height: l.s, transform: `rotate(${l.r}deg)` }} />
            </div>
          ))}
        </div>

        {/* Copy */}
        <div className="hero-copy relative z-10 mx-auto flex h-full max-w-6xl flex-col items-center justify-end px-5 pb-[9vh] text-center md:pb-[11vh]">
          <p data-intro className="eyebrow mb-4 hidden items-center gap-2 text-mist md:inline-flex">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-mint" /> {hero.eyebrow}
          </p>
          <h1 className="font-serif text-[21vw] leading-[0.85] tracking-[-0.03em] text-foam md:text-[8.5rem]">
            <span data-intro className="inline-block">Manas</span>
            <span data-intro className="inline-block italic text-mint">tej</span>
          </h1>
          <p data-intro className="mt-5 max-w-2xl text-balance text-lg text-foam/90 md:text-2xl">{hero.title}</p>
          <p data-intro className="mt-3 max-w-xl text-pretty text-sm text-mist md:text-base">
            <strong className="font-semibold text-foam">{hero.sub}.</strong> {hero.body}
          </p>
          <div data-intro className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="#about" className="rounded-full bg-mint px-6 py-3 text-sm font-semibold text-ink transition-transform hover:scale-[1.04]">Explore Manastej ↗</a>
            <a href="#organizations" className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-foam transition-colors hover:bg-white/5">For HR ↗</a>
          </div>
        </div>

        {/* Scroll-revealed quote (second beat of the pinned scene) */}
        <div className="hero-quote pointer-events-none absolute inset-0 z-10 grid place-items-center px-6 opacity-0">
          <blockquote className="max-w-4xl text-center">
            <p className="font-serif text-4xl leading-[1.05] text-foam md:text-7xl">
              {`“${hero.quote}”`.split(" ").map((w, i) => (
                <span key={i} className="w inline-block">{w}&nbsp;</span>
              ))}
            </p>
            <footer className="mt-6 font-serif text-xl italic text-radiance md:text-2xl">{hero.tagline}</footer>
          </blockquote>
        </div>

        <div className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 text-[10px] uppercase tracking-[0.4em] text-mist/70 md:block" aria-hidden="true">Scroll</div>
      </div>
    </section>
  );
}
