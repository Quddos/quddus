"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import type { Project } from "@/lib/types";

export function ProjectCard({
  project,
  large = false,
  children,
}: {
  project: Project;
  large?: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
    el.style.transform = `perspective(1200px) rotateX(${(0.5 - y) * 5}deg) rotateY(${(x - 0.5) * 6}deg)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <Link
      ref={ref}
      href={`/projects/${project.slug}`}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ "--accent": project.accent } as React.CSSProperties}
      className="spotlight group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-bg-2 transition-transform duration-300 ease-out will-change-transform"
    >
      <div className={`relative overflow-hidden ${large ? "aspect-[16/10]" : "aspect-[16/11]"}`}>
        {children}
        <div className="absolute left-4 top-4 flex gap-2">
          <span className="glass rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider">{project.status}</span>
        </div>
        <div className="glass absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full opacity-0 transition group-hover:opacity-100">
          <ArrowUpRight className="h-4 w-4" />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="mono-label mb-2 flex justify-between gap-4">
          <span>{project.category}</span>
          <span>{project.year}</span>
        </div>
        <h3 className={`font-display font-semibold tracking-tight ${large ? "text-3xl" : "text-2xl"}`}>{project.title}</h3>
        <p className="mt-2 text-muted">{project.tagline}</p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-5">
          {project.tech.slice(0, 5).map((t) => (
            <span key={t} className="rounded-full border border-line px-2.5 py-1 text-xs text-fg/70">
              {t}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
