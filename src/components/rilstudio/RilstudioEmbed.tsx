"use client";

import { ArrowUpRight, Keyboard, Loader2, Maximize2 } from "lucide-react";
import { useRef, useState } from "react";

export const RILSTUDIO_URL = "https://rilstudio.diaspafra.org";

export function RilstudioEmbed() {
  const frame = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  return (
    <div ref={frame} className="overflow-hidden rounded-3xl border border-line bg-bg-2">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_10px] shadow-cyan" />
          Live · rilstudio.diaspafra.org
          <span className="hidden items-center gap-1.5 text-dim sm:inline-flex">
            <Keyboard className="h-3.5 w-3.5" /> click inside, then use the arrow keys to demonstrate
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => frame.current?.requestFullscreen?.()}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs transition hover:border-cyan/50"
          >
            <Maximize2 className="h-3.5 w-3.5" /> Full screen
          </button>
          <a href={RILSTUDIO_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-fg px-3 py-1.5 text-xs font-medium text-bg transition hover:bg-cyan">
            Open in new tab <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
      <div className="relative h-[82vh] min-h-[640px] bg-[#eef0f4]">
        {!loaded && (
          <div className="absolute inset-0 grid place-items-center bg-bg-2 text-sm text-muted">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Starting the studio…
            </span>
          </div>
        )}
        <iframe
          src={RILSTUDIO_URL}
          title="RILstudio: reinforcement and imitation learning studio"
          className="h-full w-full"
          allow="fullscreen"
          onLoad={() => setLoaded(true)}
        />
      </div>
    </div>
  );
}
