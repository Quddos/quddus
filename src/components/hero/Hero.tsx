"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight, Sparkles } from "lucide-react";
import type { Profile } from "@/lib/types";
import type { HeroState } from "./HeroCanvas";
import { VrButton } from "../vr/VrButton";

const HeroCanvas = dynamic(() => import("./HeroCanvas"), { ssr: false });

const SCENES = 3;

function sceneOpacity(p: number, i: number) {
  const d = Math.abs(p - i);
  return Math.max(0, 1 - Math.max(0, d - 0.12) * 3.2);
}

export function Hero({ profile, peopleCount, projectCount }: { profile: Profile; peopleCount: number; projectCount: number }) {
  const section = useRef<HTMLElement>(null);
  const state = useRef<HeroState>({ progress: 0 });
  const [p, setP] = useState(0);
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState(0);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = section.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const total = el.offsetHeight - window.innerHeight;
        const raw = Math.min(1, Math.max(0, -rect.top / Math.max(total, 1)));
        const progress = raw * (SCENES - 1);
        state.current.progress = progress;
        setP(progress);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setRole((r) => (r + 1) % profile.roles.length), 2200);
    return () => clearInterval(id);
  }, [profile.roles.length]);

  const handleReady = useCallback(() => setReady(true), []);
  const [first, ...rest] = profile.name.split(" ");

  return (
    <section ref={section} id="top" className="relative" style={{ height: `${SCENES * 100 + 40}vh` }}>
      <div className="sticky top-0 h-dvh overflow-hidden">
        <div className="grid-bg absolute inset-0 opacity-60" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 70% 45%, rgba(139,123,255,0.16), transparent 70%), radial-gradient(40% 40% at 20% 80%, rgba(62,230,193,0.10), transparent 70%)",
          }}
        />
        <HeroCanvas state={state} onReady={handleReady} />

        {/* Boot screen while the particle field loads. */}
        <div
          className={`pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-bg transition-opacity duration-1000 ${ready ? "opacity-0" : "opacity-100"}`}
        >
          <div className="w-64">
            <div className="mono-label mb-3 flex justify-between">
              <span>Initialising neural field</span>
              <span className="pulse-dot text-cyan">●</span>
            </div>
            <svg viewBox="0 0 256 40" className="w-full text-cyan">
              <path
                d="M0 20 L40 20 L48 6 L56 34 L64 20 L100 20 L108 12 L116 28 L124 20 L170 20 L176 2 L184 38 L192 20 L256 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="400"
                strokeDashoffset="400"
              >
                <animate attributeName="stroke-dashoffset" from="400" to="0" dur="1.4s" repeatCount="indefinite" />
              </path>
            </svg>
          </div>
        </div>

        {/* Scene 0: identity */}
        <div
          className="pointer-events-none absolute inset-0 z-10 flex items-end bg-gradient-to-t from-bg via-bg/70 via-35% to-transparent to-60% px-5 pb-16 md:items-center md:bg-none md:px-12 md:pb-0 lg:px-20"
          style={{ opacity: sceneOpacity(p, 0), transform: `translateY(${-p * 60}px)` }}
        >
          <div className="pointer-events-auto max-w-2xl">
            <div className="mono-label mb-5 hidden items-center gap-2 md:flex">
              <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-cyan" />
              {profile.availability}
            </div>
            <h1 className="font-display text-[clamp(2.9rem,9vw,7.5rem)] font-semibold leading-[0.88] tracking-[-0.04em]">
              <span className="block">{first}</span>
              <span className="text-gradient block">{rest.join(" ")}</span>
            </h1>
            <p className="mt-4 max-w-lg text-lg text-muted md:mt-6 md:text-xl">{profile.tagline}</p>
            <div className="mt-4 h-7 overflow-hidden font-mono text-sm text-cyan">
              <div className="transition-transform duration-700" style={{ transform: `translateY(-${role * 1.75}rem)` }}>
                {profile.roles.map((r) => (
                  <div key={r} className="h-7 leading-7">
                    {"> "}
                    {r}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3 md:mt-8">
              <a
                href="#lab"
                className="group inline-flex items-center gap-2 rounded-full bg-fg px-5 py-3 text-sm font-medium text-bg transition hover:bg-cyan"
              >
                Enter the Lab <ArrowUpRight className="h-4 w-4 transition group-hover:rotate-45" />
              </a>
              <a
                href="#hub"
                className="glass inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition hover:border-cyan/60"
              >
                <Sparkles className="h-4 w-4 text-cyan" /> AI Hub & free API
              </a>
              <VrButton variant="hero" />
            </div>
          </div>
        </div>

        {/* Scene 1: mind */}
        <div
          className="pointer-events-none absolute inset-0 z-10 flex items-end bg-gradient-to-t from-bg via-bg/70 via-35% to-transparent to-60% px-5 pb-16 md:items-center md:bg-none md:px-12 md:pb-0 lg:px-20"
          style={{ opacity: sceneOpacity(p, 1) }}
        >
          <div className="max-w-xl">
            <div className="mono-label mb-4">01 · Mind</div>
            <h2 className="font-display text-[clamp(2.2rem,5.5vw,4.5rem)] font-semibold leading-[0.95] tracking-tight">
              Reading the brain
              <br />
              <span className="text-gradient">to heal the body.</span>
            </h2>
            <p className="mt-5 max-w-md text-muted">
              EEG neural monitoring, brain-computer interfaces and generative AI that adapt VR therapy to each patient
              in real time.
            </p>
            <div className="mt-6 grid max-w-sm grid-cols-3 gap-2 font-mono text-xs">
              {[
                ["α", "8–12 Hz"],
                ["β", "13–30 Hz"],
                ["θ", "4–8 Hz"],
              ].map(([k, v]) => (
                <div key={k} className="glass rounded-lg px-3 py-2">
                  <div className="text-cyan">{k} band</div>
                  <div className="text-muted">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scene 2: network */}
        <div
          className="pointer-events-none absolute inset-0 z-10 flex items-end bg-gradient-to-t from-bg via-bg/70 via-35% to-transparent to-60% px-5 pb-16 md:items-center md:bg-none md:px-12 md:pb-0 lg:px-20"
          style={{ opacity: sceneOpacity(p, 2) }}
        >
          <div className="pointer-events-auto max-w-xl">
            <div className="mono-label mb-4">02 · Network</div>
            <h2 className="font-display text-[clamp(2.2rem,5.5vw,4.5rem)] font-semibold leading-[0.95] tracking-tight">
              Built with people
              <br />
              <span className="text-gradient">across three continents.</span>
            </h2>
            <p className="mt-5 max-w-md text-muted">
              {projectCount} projects, {peopleCount} collaborators, partners and mentee communities, from Lagos to
              Amaravati to Dodoma.
            </p>
            <a
              href="#network"
              className="glass mt-6 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm transition hover:border-cyan/60"
            >
              Explore the connectome <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Progress rail */}
        <div className="absolute right-5 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-3 md:flex">
          {["Identity", "Mind", "Network"].map((label, i) => (
            <div key={label} className="flex items-center justify-end gap-3">
              <span className={`mono-label transition ${Math.round(p) === i ? "text-fg" : "opacity-40"}`}>{label}</span>
              <span
                className={`block h-px transition-all ${Math.round(p) === i ? "w-10 bg-cyan" : "w-4 bg-dim"}`}
              />
            </div>
          ))}
        </div>

        <div
          className="mono-label absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2"
          style={{ opacity: 1 - Math.min(1, p * 3) }}
        >
          <ArrowDown className="h-3.5 w-3.5 animate-bounce" /> Scroll to morph
        </div>
      </div>
    </section>
  );
}
