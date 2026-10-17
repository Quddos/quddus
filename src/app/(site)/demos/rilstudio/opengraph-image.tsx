import { OG_SIZE, ogCard } from "@/lib/og";

export const alt = "RILstudio: teach an agent by demonstration or by reward, in your browser";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogCard({ eyebrow: "Live studio · trains in your browser", title: "RILstudio: teach an agent to act", subtitle: "Imitation and reinforcement learning, no Python, no install.", accent: "#4f8bff" });
}
