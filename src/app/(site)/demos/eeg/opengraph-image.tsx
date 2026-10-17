import { OG_SIZE, ogCard } from "@/lib/og";

export const alt = "Free EEG Biomarker tool: band powers, alpha peak, artifacts and scalp maps";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogCard({ eyebrow: "Free tool · EDF & Emotiv CSV", title: "EEG Biomarker analysis in your browser", subtitle: "Band powers, alpha peak, artifact report, spectra and scalp maps.", accent: "#3987e5" });
}
