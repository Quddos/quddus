import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

// One share-card design for every page: dark panel, eyebrow, title, subtitle, portrait.
export async function ogCard({ eyebrow, title, subtitle, accent = "#3ee6c1", footer = "quddus.diaspafra.org" }: { eyebrow: string; title: string; subtitle?: string; accent?: string; footer?: string }) {
  const portrait = await readFile(join(process.cwd(), "public/media/raheem-og.jpg"));
  const src = `data:image/jpeg;base64,${portrait.toString("base64")}`;
  const size = title.length > 60 ? 54 : title.length > 34 ? 66 : 84;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#04050a", color: "#e9ecf5", fontFamily: "sans-serif", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", background: `radial-gradient(60% 80% at 25% 30%, ${accent}33, transparent 70%), radial-gradient(50% 60% at 90% 90%, #8b7bff33, transparent 70%)` }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 56px 56px 72px", width: 800, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 24, letterSpacing: 4, textTransform: "uppercase", color: accent }}>
            <div style={{ width: 14, height: 14, borderRadius: 7, background: accent }} />
            {eyebrow}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ fontSize: size, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 30, color: "#a3abc4", lineHeight: 1.3 }}>{subtitle}</div>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 24, color: "#8a93ad" }}>
            <div style={{ display: "flex", fontWeight: 700, color: "#e9ecf5" }}>Raheem Qudus</div>
            <div style={{ display: "flex" }}>·</div>
            <div style={{ display: "flex" }}>{footer}</div>
          </div>
        </div>
        <div style={{ display: "flex", width: 400, height: 630, position: "relative" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} width={400} height={630} style={{ objectFit: "cover", width: 400, height: 630 }} alt="" />
          <div style={{ position: "absolute", inset: 0, display: "flex", background: "linear-gradient(90deg, #04050a 0%, #04050a00 35%)" }} />
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
