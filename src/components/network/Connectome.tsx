"use client";

import { ArrowUpRight, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { Person, Profile, Project, Publication } from "@/lib/types";
import type { GraphLink, GraphNode } from "./ConnectomeGraph";

const ConnectomeGraph = dynamic(() => import("./ConnectomeGraph"), {
  ssr: false,
  loading: () => <div className="mono-label grid h-full place-items-center">Growing connectome…</div>,
});

const GROUP_COLORS: Record<string, string> = {
  Research: "#3ee6c1",
  Community: "#ffb547",
  Mentorship: "#8b7bff",
  Projects: "#ff4d6d",
};

export function buildGraph(profile: Profile, people: Person[], projects: Project[], publications: Publication[]) {
  const nodes: GraphNode[] = [
    { id: "self", label: profile.name, sub: profile.headline, kind: "self", group: "self", color: "#ffffff", photo: profile.photo },
  ];
  const links: GraphLink[] = [];
  const groups = Array.from(new Set([...people.map((p) => p.group), "Projects"]));
  for (const g of groups) {
    const color = GROUP_COLORS[g] ?? "#5ac8fa";
    nodes.push({ id: `group:${g}`, label: g, sub: "Cluster", kind: "group", group: g, color });
    links.push({ source: "self", target: `group:${g}`, kind: "core", color });
  }
  for (const p of people) {
    const color = GROUP_COLORS[p.group] ?? "#5ac8fa";
    nodes.push({
      id: `person:${p.id}`,
      label: p.consent ? p.name : `${p.relation} · ${p.org || p.group}`,
      sub: [p.role, p.org].filter(Boolean).join(" · "),
      kind: "person",
      group: p.group,
      color,
      photo: p.consent && p.photo ? p.photo : undefined,
      url: p.consent ? p.url : undefined,
      note: p.note,
    });
    links.push({ source: `group:${p.group}`, target: `person:${p.id}`, kind: p.relation, color });
  }
  for (const pr of projects) {
    const color = pr.accent || GROUP_COLORS.Projects;
    nodes.push({
      id: `project:${pr.slug}`,
      label: pr.title,
      sub: pr.category,
      kind: "project",
      group: "Projects",
      color,
      url: `/projects/${pr.slug}`,
      note: pr.tagline,
    });
    links.push({ source: "group:Projects", target: `project:${pr.slug}`, kind: "built", color });
  }
  // Co-authors connect to the projects their papers describe.
  for (const pub of publications) {
    const project = projects.find((pr) => pub.title.toLowerCase().includes(pr.title.toLowerCase().split(" ")[0]) && pr.title.length > 3);
    if (!project) continue;
    for (const p of people) {
      if (p.consent && pub.authors.includes(p.name)) {
        links.push({ source: `person:${p.id}`, target: `project:${project.slug}`, kind: "co-authored", color: "#3ee6c155" });
      }
    }
  }
  return { nodes, links, groups };
}

export function Connectome({
  profile,
  people,
  projects,
  publications,
  height = 640,
}: {
  profile: Profile;
  people: Person[];
  projects: Project[];
  publications: Publication[];
  height?: number;
}) {
  const { nodes, links, groups } = useMemo(
    () => buildGraph(profile, people, projects, publications),
    [profile, people, projects, publications],
  );
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [filter, setFilter] = useState("All");

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const n of nodes) if (n.kind === "person" || n.kind === "project") c[n.group] = (c[n.group] ?? 0) + 1;
    return c;
  }, [nodes]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-line bg-[radial-gradient(70%_60%_at_50%_45%,rgba(139,123,255,0.10),transparent_70%)]" style={{ height }}>
      <div className="grid-bg absolute inset-0 opacity-40" />
      <ConnectomeGraph nodes={nodes} links={links} height={height} onSelect={setSelected} filter={filter} />

      <div className="absolute left-4 top-4 flex flex-wrap gap-2 pr-4">
        {["All", ...groups].map((g) => (
          <button
            key={g}
            onClick={() => setFilter(g)}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${filter === g ? "border-fg bg-fg text-bg" : "glass text-muted hover:text-fg"}`}
          >
            {g !== "All" && <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full" style={{ background: GROUP_COLORS[g] ?? "#5ac8fa" }} />}
            {g}
            {g !== "All" && <span className="ml-1.5 text-dim">{counts[g] ?? 0}</span>}
          </button>
        ))}
      </div>

      <div className="mono-label pointer-events-none absolute bottom-4 left-4">Drag to orbit · click a node</div>

      {selected && (
        <div className="glass absolute bottom-4 right-4 w-[min(320px,calc(100%-32px))] rounded-2xl p-5">
          <button onClick={() => setSelected(null)} className="absolute right-3 top-3 text-muted hover:text-fg" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
          <div className="mono-label mb-2" style={{ color: selected.color }}>
            {selected.kind === "group" ? "Cluster" : selected.group}
          </div>
          <div className="pr-6 font-display text-xl font-semibold leading-tight">{selected.label}</div>
          <div className="mt-1 text-sm text-muted">{selected.sub}</div>
          {selected.note && <p className="mt-3 text-sm text-fg/80">{selected.note}</p>}
          {selected.url && (
            <a href={selected.url} target={selected.url.startsWith("/") ? undefined : "_blank"} rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm text-cyan">
              Open <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
