"use client";
import Image from "next/image";
import { useRef } from "react";
import { join, contactEmail, nav } from "@/lib/content";
import { useScene, gsap, MQ } from "@/lib/motion";

export default function Join() {
  const root = useRef<HTMLElement>(null);
  useScene(root, (mm, el) => {
    mm.add(MQ.motion, () => {
      // Dawn: the radiance orb rises while layers separate
      const tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: el, start: "top bottom", end: "bottom bottom", scrub: 0.6 } });
      tl.fromTo(".jn-sun", { yPercent: 60, scale: 0.7 }, { yPercent: 0, scale: 1 }, 0)
        .fromTo(".jn-sky", { opacity: 0 }, { opacity: 1 }, 0)
        .fromTo(".jn-copy > *", { y: 80, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06 }, 0.25)
        .fromTo(".jn-hill-a", { yPercent: 30 }, { yPercent: 0 }, 0)
        .fromTo(".jn-hill-b", { yPercent: 60 }, { yPercent: 0 }, 0);

      // Magnetic CTA
      const btn = el.querySelector<HTMLElement>(".jn-cta");
      if (btn && matchMedia("(hover: hover)").matches) {
        const x = gsap.quickTo(btn, "x", { duration: 0.6, ease: "power3" });
        const y = gsap.quickTo(btn, "y", { duration: 0.6, ease: "power3" });
        const move = (e: PointerEvent) => { const r = btn.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * 0.3); y((e.clientY - r.top - r.height / 2) * 0.3); };
        const leave = () => { x(0); y(0); };
        btn.addEventListener("pointermove", move); btn.addEventListener("pointerleave", leave);
        return () => { btn.removeEventListener("pointermove", move); btn.removeEventListener("pointerleave", leave); };
      }
    });
  });

  return (
    <section id="contact" ref={root} aria-labelledby="join-title" className="relative overflow-hidden bg-ink">
      <div className="relative min-h-[100svh]">
        <div className="jn-sky absolute inset-0 bg-[linear-gradient(180deg,#051311_0%,#0a211e_40%,#1e6b63_75%,#f2c46d_115%)]" aria-hidden="true" />
        <div className="jn-sun absolute left-1/2 top-[56%] h-[70vmin] w-[70vmin] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#fff6dc_0%,#f2c46d_30%,rgba(242,196,109,.25)_55%,transparent_70%)]" aria-hidden="true" />
        <svg className="jn-hill-a absolute inset-x-0 bottom-0 h-[38%] w-full" viewBox="0 0 1440 400" preserveAspectRatio="none" aria-hidden="true"><path d="M0 220C240 140 420 120 720 190s520 40 720-30V400H0Z" fill="#0f2f2b" /></svg>
        <svg className="jn-hill-b absolute inset-x-0 bottom-0 h-[28%] w-full" viewBox="0 0 1440 300" preserveAspectRatio="none" aria-hidden="true"><path d="M0 160c260 70 520 80 760 20s480-60 680 10V300H0Z" fill="#051311" /></svg>

        <div className="jn-copy relative z-10 mx-auto flex min-h-[100svh] max-w-4xl flex-col items-center justify-center px-5 pb-[26vh] pt-24 text-center">
          <p className="eyebrow mb-5 text-mint">{join.label}</p>
          <h2 id="join-title" className="font-serif text-5xl leading-[0.95] text-foam md:text-8xl">
            We&apos;re building it <em className="text-radiance">for the world.</em>
          </h2>
          <p className="mt-6 max-w-lg text-lg text-mist">{join.body}</p>
          <a href={`mailto:${contactEmail}`} className="jn-cta mt-10 inline-flex items-center gap-3 rounded-full bg-foam px-8 py-4 font-semibold text-ink shadow-[0_20px_60px_-15px_rgba(242,196,109,.6)]">
            {join.cta} <span aria-hidden="true">↗</span>
          </a>
          <p className="mt-4 text-sm text-mist">{contactEmail}</p>
        </div>
      </div>

      <footer className="relative border-t border-white/5 bg-ink">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-teal"><Image src="/manastej-mark.webp" alt="" width={30} height={23} /></span>
            <div>
              <p className="font-serif text-2xl text-foam">Manastej</p>
              <p className="text-xs text-mist">{join.closing}</p>
            </div>
          </div>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-mist">
              {nav.map((n) => <li key={n.href}><a href={n.href} className="hover:text-foam">{n.label}</a></li>)}
            </ul>
          </nav>
          <div className="text-xs text-mist/70 md:text-right">
            <p>Where Science Meets the Soul · © 2026</p>
            <p className="mt-1 text-mist/50">
              3D head based on “Human Head Basemesh” by pistachio (
              <a className="underline hover:text-foam" href="https://opengameart.org/content/2-human-head-basemeshes" rel="noopener noreferrer" target="_blank">OpenGameArt</a>, CC0) · brain: “Human Brain” by{" "}
              <a className="underline hover:text-foam" href="https://grab3d.com/models/anatomy/human-brain/" rel="noopener noreferrer" target="_blank">Grab3D</a> (CC0)
            </p>
          </div>
        </div>
      </footer>
    </section>
  );
}
