"use client";

import dynamic from "next/dynamic";
import type { Profile, Project } from "@/lib/types";

const VrGallery = dynamic(() => import("./VrGallery"), {
  ssr: false,
  loading: () => <div className="mono-label grid h-[78vh] min-h-[520px] place-items-center rounded-3xl border border-line">Building the Lab…</div>,
});

export function VrView(props: { profile: Profile; projects: Project[] }) {
  return <VrGallery {...props} />;
}
