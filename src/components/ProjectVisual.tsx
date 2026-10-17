import Image from "next/image";
import { canOptimize } from "@/lib/images";
import type { Project } from "@/lib/types";

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

// Media for a project: video, then cover image, then a generated signal artwork.
export function ProjectVisual({ project, priority = false }: { project: Project; priority?: boolean }) {
  if (project.video && /\.(mp4|webm|mov)(\?|$)/i.test(project.video)) {
    return (
      <video
        src={project.video}
        poster={project.cover || undefined}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }
  if (project.cover) {
    return (
      <Image
        src={project.cover}
        unoptimized={!canOptimize(project.cover)}
        alt={project.title}
        fill
        priority={priority}
        sizes="(min-width: 1024px) 60vw, 100vw"
        className="object-cover transition duration-700 group-hover:scale-[1.04]"
      />
    );
  }
  const seed = hash(project.slug);
  const lines = Array.from({ length: 22 }, (_, i) => {
    const amp = 6 + ((seed >> (i % 24)) & 15) * 1.6;
    const freq = 0.012 + (((seed >> (i % 13)) & 7) / 7) * 0.02;
    const phase = i * 0.55 + (seed % 100) / 10;
    let d = "";
    for (let x = 0; x <= 400; x += 8) {
      const y = 20 + i * 12 + Math.sin(x * freq + phase) * amp * Math.sin((x / 400) * Math.PI);
      d += `${x === 0 ? "M" : "L"}${x} ${y.toFixed(1)} `;
    }
    return d;
  });
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: `radial-gradient(80% 70% at 70% 30%, ${project.accent}33, transparent 70%), #07090f` }}>
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full transition duration-700 group-hover:scale-105">
        {lines.map((d, i) => (
          <path key={i} d={d} fill="none" stroke={project.accent} strokeOpacity={0.12 + (i % 5) * 0.07} strokeWidth={i % 7 === 0 ? 1.4 : 0.7} />
        ))}
      </svg>
      <div className="absolute bottom-4 right-5 font-display text-7xl font-bold tracking-tighter opacity-[0.07] md:text-8xl">
        {project.title.split(" ")[0]}
      </div>
    </div>
  );
}
