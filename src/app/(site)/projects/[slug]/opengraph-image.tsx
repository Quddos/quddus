import { getContent } from "@/lib/content";
import { OG_SIZE, ogCard } from "@/lib/og";

export const alt = "Project by Raheem Qudus";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = (await getContent()).projects.find((x) => x.slug === slug);
  return ogCard({ eyebrow: p ? `${p.category} · ${p.year}` : "Project", title: p?.title ?? "Project", subtitle: p?.tagline, accent: p?.accent });
}
