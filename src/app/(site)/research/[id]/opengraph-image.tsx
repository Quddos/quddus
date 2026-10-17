import { getContent } from "@/lib/content";
import { OG_SIZE, ogCard } from "@/lib/og";

export const alt = "Research by Raheem Qudus";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = (await getContent()).publications.find((x) => x.id === id);
  return ogCard({ eyebrow: p ? `${p.kind} · ${p.year}` : "Research", title: p?.title ?? "Research", subtitle: p ? `${p.venue} · ${p.status}` : undefined, accent: "#8b7bff" });
}
