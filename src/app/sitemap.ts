import type { MetadataRoute } from "next";
import { getContent } from "@/lib/content";
import { abs } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const c = await getContent();
  const page = (path: string, priority: number, changeFrequency: "weekly" | "monthly" = "monthly") => ({ url: abs(path), priority, changeFrequency });
  return [
    page("/", 1, "weekly"),
    page("/demos/qudmi", 0.9),
    page("/demos/eeg", 0.9),
    page("/demos/rilstudio", 0.9),
    page("/developers", 0.8),
    page("/vr", 0.7),
    ...c.projects.map((p) => page(`/projects/${p.slug}`, 0.8)),
    ...c.publications.map((p) => page(`/research/${p.id}`, 0.7)),
  ];
}
