"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { nav } from "@/lib/content";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      const max = document.documentElement.scrollHeight - innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div ref={bar} className="absolute left-0 top-0 h-[2px] w-full origin-left bg-gradient-to-r from-teal via-mint to-radiance" style={{ transform: "scaleX(0)" }} />
      <nav
        aria-label="Primary"
        className={`mx-auto mt-3 flex max-w-6xl items-center justify-between rounded-full px-3 py-2 transition-all duration-500 md:mt-4 ${
          scrolled ? "mx-3 border border-white/10 bg-ink/75 shadow-[0_10px_40px_-10px_rgba(0,0,0,.5)] backdrop-blur-xl md:mx-auto" : "mx-3 md:mx-auto"
        }`}
      >
        <a href="#home" className="flex items-center gap-2.5 rounded-full pl-1 pr-3" aria-label="Manastej home">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-teal">
            <Image src="/manastej-mark.webp" alt="" width={26} height={20} priority />
          </span>
          <span className="font-serif text-xl tracking-tight text-foam">Manastej</span>
        </a>
        <ul className="hidden items-center gap-1 lg:flex">
          {nav.map((n) => (
            <li key={n.href}>
              <a href={n.href} className="rounded-full px-3.5 py-2 text-sm text-mist transition-colors hover:bg-white/5 hover:text-foam">
                {n.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <a href="#contact" className="hidden rounded-full bg-foam px-4 py-2 text-sm font-semibold text-ink transition-transform hover:scale-[1.03] sm:inline-block">
            Join the Journey ↗
          </a>
          <button
            className="grid h-10 w-10 place-items-center rounded-full border border-white/15 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="relative block h-3 w-4">
              <span className={`absolute left-0 h-px w-4 bg-foam transition-transform ${open ? "top-1.5 rotate-45" : "top-0"}`} />
              <span className={`absolute left-0 top-1.5 h-px w-4 bg-foam transition-opacity ${open ? "opacity-0" : ""}`} />
              <span className={`absolute left-0 h-px w-4 bg-foam transition-transform ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
            </span>
          </button>
        </div>
      </nav>
      <div
        id="mobile-menu"
        className={`mx-3 mt-2 border border-white/10 bg-ink/90 backdrop-blur-xl overflow-hidden rounded-3xl transition-all duration-500 lg:hidden ${open ? "max-h-[480px] opacity-100" : "pointer-events-none max-h-0 opacity-0"}`}
      >
        <ul className="p-3">
          {[...nav, { href: "#contact", label: "Join the Journey ↗" }].map((n) => (
            <li key={n.href}>
              <a href={n.href} onClick={() => setOpen(false)} tabIndex={open ? 0 : -1} className="block rounded-2xl px-4 py-3 font-serif text-2xl text-foam hover:bg-white/5">
                {n.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
