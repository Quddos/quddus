import { OG_SIZE, ogCard } from "@/lib/og";

export const alt = "QUDMI live demo: full-body pose from a VR headset and two controllers";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogCard({ eyebrow: "Live demo · runs in your browser", title: "QUDMI: three sensors in, a full body out", subtitle: "Open imitation-learning model for full-body VR avatars.", accent: "#ffb547" });
}
