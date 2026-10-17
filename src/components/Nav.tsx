"use client";

import { Command } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { openPalette } from "./CommandPalette";
import { VrButton } from "./vr/VrButton";

const links = [
  { href: "/#lab", label: "Lab" },
  { href: "/#research", label: "Research" },
  { href: "/#journey", label: "Journey" },
  { href: "/#network", label: "Network" },
  { href: "/#hub", label: "AI Hub" },
  { href: "/developers", label: "API" },
  { href: "/#contact", label: "Contact" },
];

export function Nav({ name }: { name: string }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <nav
        className={`flex w-full max-w-5xl items-center justify-between gap-4 rounded-full px-3 py-2 transition-all duration-500 ${scrolled ? "glass shadow-[0_8px_40px_rgba(0,0,0,0.5)]" : "border border-transparent"}`}
      >
        <Link href="/" className="flex items-center gap-2.5 pl-1">
          <span className="relative grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-cyan to-violet font-display text-xs font-bold text-bg">
            {initials}
          </span>
          <span className="hidden font-display text-sm font-medium tracking-tight sm:block">
            {name}
          </span>
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3 py-1.5 text-sm text-muted transition hover:bg-white/5 hover:text-fg"
            >
              {l.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <VrButton variant="nav" />
          <button
            onClick={openPalette}
            className="glass flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-muted transition hover:text-fg"
            aria-label="Open command palette"
          >
            <Command className="h-3.5 w-3.5" />
            <span className="font-mono">K</span>
            <span className="hidden sm:inline">Command</span>
          </button>
        </div>
      </nav>
    </header>
  );
}
