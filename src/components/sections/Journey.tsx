"use client";

import { motion, useScroll, useSpring } from "motion/react";
import { useRef } from "react";
import type { Education, Experience, Leadership } from "@/lib/types";
import { Reveal } from "../Reveal";
import { SectionHeader } from "./SectionHeader";

function fmt(d: string) {
  if (!/^\d{4}-\d{2}$/.test(d)) return d;
  const [y, m] = d.split("-");
  return `${new Date(Number(y), Number(m) - 1).toLocaleString("en", { month: "short" })} ${y}`;
}

export function Journey({
  experience,
  education,
  leadership,
}: {
  experience: Experience[];
  education: Education[];
  leadership: Leadership[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 60%"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return (
    <section id="journey" className="relative mx-auto max-w-7xl px-5 py-28 md:px-10 md:py-40">
      <SectionHeader
        index="03"
        label="Journey"
        title="From banking systems in Lagos"
        accent="to brain signals in Amaravati."
      />
      <div className="grid gap-16 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
        <div ref={ref} className="relative pl-8 md:pl-12">
          <div className="absolute bottom-0 left-[7px] top-0 w-px bg-line md:left-[11px]" />
          <motion.div
            style={{ scaleY }}
            className="absolute bottom-0 left-[7px] top-0 w-px origin-top bg-gradient-to-b from-cyan via-violet to-amber md:left-[11px]"
          />
          {experience.map((e, i) => (
            <Reveal key={e.id} delay={0.05} className="relative pb-14 last:pb-0">
              <span className="absolute -left-8 top-1.5 grid h-4 w-4 place-items-center rounded-full border border-cyan/60 bg-bg md:-left-12 md:h-6 md:w-6">
                <span className={`h-1.5 w-1.5 rounded-full bg-cyan ${i === 0 ? "pulse-dot" : ""}`} />
              </span>
              <div className="mono-label">
                {fmt(e.start)} — {fmt(e.end)} · {e.location}
              </div>
              <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight">{e.role}</h3>
              <div className="text-cyan">{e.org}</div>
              <p className="mt-3 max-w-2xl text-fg/80">{e.summary}</p>
              <ul className="mt-3 space-y-1.5 text-muted">
                {e.highlights.map((h) => (
                  <li key={h} className="flex gap-3">
                    <span className="mt-2.5 h-px w-3 shrink-0 bg-dim" />
                    {h}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {e.tags.map((t) => (
                  <span key={t} className="rounded-full border border-line px-2.5 py-0.5 text-xs text-fg/70">
                    {t}
                  </span>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
        <div className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <div className="rounded-3xl border border-line bg-bg-2 p-6">
              <div className="mono-label mb-4">Education</div>
              {education.map((ed) => (
                <div key={ed.id}>
                  <div className="font-display text-xl font-semibold">{ed.degree}</div>
                  <div className="text-cyan">{ed.school}</div>
                  <div className="mt-1 text-sm text-dim">
                    {ed.start} — {ed.end} · {ed.location}
                  </div>
                  <p className="mt-3 text-sm text-muted">{ed.details}</p>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="rounded-3xl border border-line bg-bg-2 p-6">
              <div className="mono-label mb-4">Leadership</div>
              <div className="space-y-4">
                {leadership.map((l) => (
                  <div key={l.id}>
                    <div className="font-medium">{l.role}</div>
                    <div className="text-sm text-muted">{l.org}</div>
                    <div className="font-mono text-xs text-dim">{l.period}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
