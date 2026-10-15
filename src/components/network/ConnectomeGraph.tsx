"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph3D, { type ForceGraphMethods } from "react-force-graph-3d";
import * as THREE from "three";

export type GraphNode = {
  id: string;
  label: string;
  sub: string;
  kind: "self" | "group" | "person" | "project";
  group: string;
  color: string;
  photo?: string;
  url?: string;
  note?: string;
  x?: number;
  y?: number;
  z?: number;
};
export type GraphLink = { source: string; target: string; kind: string; color: string };

function initials(s: string) {
  return s
    .replace(/[^\p{L}\s]/gu, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function makeSprite(node: GraphNode) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const r = size / 2;
  const glow = ctx.createRadialGradient(r, r, r * 0.3, r, r, r);
  glow.addColorStop(0, node.color + "aa");
  glow.addColorStop(1, node.color + "00");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);
  ctx.beginPath();
  ctx.arc(r, r, r * 0.52, 0, Math.PI * 2);
  ctx.fillStyle = "#0b0e17";
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = node.color;
  ctx.stroke();
  ctx.fillStyle = "#e9ecf5";
  ctx.font = `600 ${node.kind === "self" ? 64 : 54}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(node.kind === "group" ? node.label.slice(0, 1) : initials(node.label), r, r + 3);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  const scale = node.kind === "self" ? 34 : node.kind === "group" ? 22 : node.kind === "project" ? 16 : 18;
  sprite.scale.set(scale, scale, 1);

  if (node.photo) {
    new THREE.TextureLoader().load(node.photo, (img) => {
      const image = img.image as HTMLImageElement;
      ctx.save();
      ctx.beginPath();
      ctx.arc(r, r, r * 0.5, 0, Math.PI * 2);
      ctx.clip();
      const s = Math.min(image.width, image.height);
      ctx.drawImage(image, (image.width - s) / 2, 0, s, s, r * 0.5, r * 0.5, r, r);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(r, r, r * 0.52, 0, Math.PI * 2);
      ctx.stroke();
      texture.needsUpdate = true;
    });
  }
  return sprite;
}

export default function ConnectomeGraph({
  nodes,
  links,
  height,
  onSelect,
  filter,
}: {
  nodes: GraphNode[];
  links: GraphLink[];
  height: number;
  onSelect: (n: GraphNode | null) => void;
  filter: string;
}) {
  const fg = useRef<ForceGraphMethods<GraphNode, GraphLink> | undefined>(undefined);
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const data = useMemo(() => {
    const keep = new Set(
      nodes.filter((n) => filter === "All" || n.kind === "self" || n.group === filter).map((n) => n.id),
    );
    return {
      nodes: nodes.filter((n) => keep.has(n.id)).map((n) => ({ ...n })),
      links: links.filter((l) => keep.has(l.source) && keep.has(l.target)).map((l) => ({ ...l })),
    };
  }, [nodes, links, filter]);

  useEffect(() => {
    const g = fg.current;
    if (!g) return;
    g.d3Force("charge")?.strength(-160);
    g.d3Force("link")?.distance((l: GraphLink) => (l.kind === "core" ? 70 : 45));
    const controls = g.controls() as { autoRotate?: boolean; autoRotateSpeed?: number; enableZoom?: boolean };
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.6;
    controls.enableZoom = false;
  }, [data]);

  return (
    <div ref={wrap} className="h-full w-full cursor-grab active:cursor-grabbing">
      <ForceGraph3D<GraphNode, GraphLink>
        ref={fg}
        graphData={data}
        width={width}
        height={height}
        backgroundColor="rgba(0,0,0,0)"
        showNavInfo={false}
        nodeThreeObject={(n: GraphNode) => makeSprite(n)}
        nodeLabel={(n: GraphNode) =>
          `<div style="font:500 12px system-ui;padding:6px 10px;border-radius:8px;background:#0d1019ee;border:1px solid #ffffff22;color:#e9ecf5">${n.label}<div style="color:#8a93ad;font-size:11px">${n.sub}</div></div>`
        }
        linkColor={(l: GraphLink) => l.color}
        linkOpacity={0.35}
        linkWidth={(l: GraphLink) => (l.kind === "core" ? 0.8 : 0.4)}
        linkDirectionalParticles={(l: GraphLink) => (l.kind === "core" ? 3 : 2)}
        linkDirectionalParticleWidth={1.6}
        linkDirectionalParticleSpeed={0.006}
        linkDirectionalParticleColor={(l: GraphLink) => l.color}
        onNodeClick={(n: GraphNode) => {
          onSelect(n);
          const dist = 90;
          const ratio = 1 + dist / Math.hypot(n.x ?? 1, n.y ?? 1, n.z ?? 1);
          fg.current?.cameraPosition({ x: (n.x ?? 0) * ratio, y: (n.y ?? 0) * ratio, z: (n.z ?? 0) * ratio }, n as { x: number; y: number; z: number }, 1200);
        }}
        onBackgroundClick={() => onSelect(null)}
        enableNodeDrag={false}
        cooldownTicks={120}
        onEngineStop={() => fg.current?.zoomToFit(800, 40)}
      />
    </div>
  );
}
