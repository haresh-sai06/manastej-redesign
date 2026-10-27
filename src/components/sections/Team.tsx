"use client";
import { useRef } from "react";
import Image from "next/image";
import { team } from "@/lib/content";
import { useScene, MQ, riseIn } from "@/lib/motion";

export default function Team() {
  const root = useRef<HTMLElement>(null);
  useScene(root, (mm, el) => {
    mm.add(MQ.motion, () => riseIn(el));
  });
  return (
    <section id="team" ref={root} aria-labelledby="team-title" className="relative bg-deep py-28 text-foam md:py-40">
      <div className="mx-auto max-w-6xl px-5">
        <p data-rise className="eyebrow mb-5 text-center text-mint">{team.label}</p>
        <h2 id="team-title" data-rise className="mx-auto max-w-3xl text-center font-serif text-5xl leading-[0.95] md:text-7xl">{team.title}</h2>
        <div className="mt-16 grid gap-6 md:mt-24 md:grid-cols-3">
          {team.members.map((m) => (
            <article key={m.name} data-rise className="glass overflow-hidden rounded-[28px]">
              <div className="relative aspect-[4/5] bg-pine">
                <Image src={m.photo} alt={`Portrait of ${m.name}`} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover object-top" />
              </div>
              <div className="p-7">
                <h3 className="font-serif text-3xl leading-tight text-foam">{m.name}</h3>
                {m.role && <p className="eyebrow mt-3 text-mint">{m.role}</p>}
                {m.bio && <p className="mt-4 text-sm leading-relaxed text-mist">{m.bio}</p>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
