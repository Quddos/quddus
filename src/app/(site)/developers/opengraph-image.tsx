import { OG_SIZE, ogCard } from "@/lib/og";

export const alt = "Qud-1: free OpenAI-compatible API for XR and neurotech builders";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogCard({ eyebrow: "Free API", title: "Build with Qud-1", subtitle: "An assistant for XR and neurotech builders. OpenAI-compatible. Free keys.", accent: "#8b7bff" });
}
