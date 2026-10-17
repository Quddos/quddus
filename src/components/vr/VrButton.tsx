"use client";

import { RectangleGoggles } from "lucide-react";
import Link from "next/link";
import { useVrSupport } from "./useVrSupport";

// Shortcut to the WebXR Lab. On a headset it reads "Enter VR" and glows.
export function VrButton({ variant }: { variant: "nav" | "hero" }) {
  const vr = useVrSupport();
  const label = vr ? "Enter VR" : "VR Lab";
  if (variant === "nav") {
    return (
      <Link
        href="/vr"
        aria-label={vr ? "Enter VR" : "Open the Lab in VR"}
        title="Walk through the Lab in VR"
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition ${vr ? "bg-cyan font-medium text-bg shadow-[0_0_24px_rgba(62,230,193,0.45)]" : "glass text-muted hover:text-fg"}`}
      >
        <RectangleGoggles className="h-4 w-4" />
        <span className={vr ? "" : "hidden sm:inline"}>{label}</span>
      </Link>
    );
  }
  return (
    <Link
      href="/vr"
      className={`group inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition ${vr ? "bg-cyan text-bg shadow-[0_0_30px_rgba(62,230,193,0.45)] hover:bg-fg" : "glass hover:border-cyan/60"}`}
    >
      <RectangleGoggles className={`h-4 w-4 ${vr ? "" : "text-cyan"}`} /> {vr ? "Enter VR" : "Step into VR"}
    </Link>
  );
}
