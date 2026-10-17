import { OG_SIZE, ogCard } from "@/lib/og";

export const alt = "Raheem Qudus: Full-Stack AI Engineer, BCI Researcher and XR Technologist";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogCard({ eyebrow: "AI · BCI · XR", title: "Raheem Qudus", subtitle: "Engineering minds, bodies and worlds. Adaptive VR therapy, EEG, imitation learning and open AI tools." });
}
