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
        <div className="mt-16 flex flex-col gap-14 md:mt-24 md:gap-20">
          {team.members.map((m, i) => {
            const flip = i % 2 === 1;
            return (
              <article
                key={m.name}
                data-rise
                className={`grid items-center gap-8 md:grid-cols-2 md:gap-14 ${flip ? "md:[&>*:first-child]:order-2" : ""}`}
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-pine md:aspect-[5/6]">
                  <Image
                    src={m.photo}
                    alt={`Portrait of ${m.name}`}
                    fill
                    sizes="(min-width: 768px) 40vw, 100vw"
                    className="object-cover object-top"
                  />
                </div>
                <div className={flip ? "md:text-right" : ""}>
                  <h3 className="font-serif text-4xl leading-tight text-foam md:text-5xl">{m.name}</h3>
                  {m.role && <p className="eyebrow mt-4 text-mint">{m.role}</p>}
                  {m.bio && (
                    <p className={`mt-5 max-w-xl text-base leading-relaxed text-mist md:text-lg ${flip ? "md:ml-auto" : ""}`}>
                      {m.bio}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
