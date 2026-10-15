"use client";

import dynamic from "next/dynamic";
import type { GlobePin } from "../globe/Globe";

const Globe = dynamic(() => import("../globe/Globe"), { ssr: false });

export function GlobeView({ pins }: { pins: GlobePin[] }) {
  return <Globe pins={pins} />;
}
