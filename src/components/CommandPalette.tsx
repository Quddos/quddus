"use client";

import { Command } from "cmdk";
import { ArrowRight, AtSign, Copy, ExternalLink, FileText, FlaskConical, Network, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { OPEN_ASK_EVENT } from "./AskRaheem";
import { useEffect, useState } from "react";
import type { Link as SiteLink, Project, Publication } from "@/lib/types";

const OPEN_EVENT = "qud:palette";
export const openPalette = () => window.dispatchEvent(new Event(OPEN_EVENT));

export function CommandPalette({
  projects,
  publications,
  socials,
  email,
}: {
  projects: Pick<Project, "slug" | "title" | "category">[];
  publications: Pick<Publication, "id" | "title" | "url">[];
  socials: SiteLink[];
  email: string;
}) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  const run = (fn: () => void) => {
    setOpen(false);
    fn();
  };
  const go = (href: string) => run(() => router.push(href));

  const item =
    "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted data-[selected=true]:bg-white/[0.06] data-[selected=true]:text-fg";
  const group = "[&_[cmdk-group-heading]]:mono-label [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3";

  return (
    <>
      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Command palette"
        overlayClassName="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
        contentClassName="fixed left-1/2 top-[14vh] z-[71] w-[min(640px,calc(100vw-32px))] -translate-x-1/2"
      >
        <div className="glass overflow-hidden rounded-2xl border-line-strong shadow-2xl">
          <div className="flex items-center gap-3 border-b border-line px-4">
            <span className="font-mono text-cyan">{">"}</span>
            <Command.Input
              placeholder="Type a command or search…"
              className="h-14 w-full bg-transparent text-base text-fg outline-none placeholder:text-dim"
            />
          </div>
          <Command.List className="max-h-[60vh] overflow-y-auto p-2">
            <Command.Empty className="px-3 py-6 text-center text-sm text-muted">No results.</Command.Empty>
            <Command.Group heading="Navigate" className={group}>
              {[
                ["/#lab", "The Lab: projects", FlaskConical],
                ["/#research", "Research & patents", FileText],
                ["/#network", "Connectome: collaborators & mentees", Network],
                ["/#hub", "AI Hub: chat with Qud-1", Sparkles],
                ["/developers", "Developers: free API key & docs", Sparkles],
                ["/demos/qudmi", "QUDMI live demo: full body from 3 trackers", Sparkles],
                ["/demos/eeg", "EEG Biomarker tool: analyse a recording", Sparkles],
                ["/demos/rilstudio", "RILstudio: teach an agent by demonstration or reward", Sparkles],
                ["/vr", "The Lab in VR (WebXR)", Sparkles],
                ["/#contact", "Contact", AtSign],
              ].map(([href, label, Icon]) => {
                const I = Icon as typeof FlaskConical;
                return (
                  <Command.Item key={href as string} className={item} onSelect={() => go(href as string)}>
                    <I className="h-4 w-4" /> {label as string}
                  </Command.Item>
                );
              })}
            </Command.Group>
            <Command.Group heading="Projects" className={group}>
              {projects.map((p) => (
                <Command.Item key={p.slug} value={`project ${p.title} ${p.category}`} className={item} onSelect={() => go(`/projects/${p.slug}`)}>
                  <ArrowRight className="h-4 w-4" /> {p.title}
                  <span className="ml-auto text-xs text-dim">{p.category}</span>
                </Command.Item>
              ))}
            </Command.Group>
            <Command.Group heading="Papers" className={group}>
              {publications.map((p) => (
                <Command.Item
                  key={p.id}
                  value={`paper ${p.title}`}
                  className={item}
                  onSelect={() => (p.url ? run(() => window.open(p.url, "_blank")) : go("/#research"))}
                >
                  <FileText className="h-4 w-4 shrink-0" /> <span className="truncate">{p.title}</span>
                </Command.Item>
              ))}
            </Command.Group>
            <Command.Group heading="Actions" className={group}>
              <Command.Item className={item} value="ask ai assistant question" onSelect={() => run(() => window.dispatchEvent(new Event(OPEN_ASK_EVENT)))}>
                <Sparkles className="h-4 w-4 text-cyan" /> Ask the AI guide about Raheem
              </Command.Item>
              <Command.Item
                className={item}
                onSelect={() =>
                  run(() => {
                    navigator.clipboard?.writeText(email);
                    setToast("Email copied");
                    setTimeout(() => setToast(""), 1800);
                  })
                }
              >
                <Copy className="h-4 w-4" /> Copy email address
              </Command.Item>
              {socials
                .filter((s) => !s.url.startsWith("mailto:"))
                .map((s) => (
                  <Command.Item key={s.url} className={item} onSelect={() => run(() => window.open(s.url, "_blank"))}>
                    <ExternalLink className="h-4 w-4" /> Open {s.label}
                  </Command.Item>
                ))}
            </Command.Group>
          </Command.List>
          <div className="flex items-center justify-between border-t border-line px-4 py-2.5 font-mono text-[11px] text-dim">
            <span>↑↓ navigate · ↵ select · esc close</span>
            <span>⌘K</span>
          </div>
        </div>
      </Command.Dialog>
      {toast && (
        <div className="glass fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-full px-4 py-2 text-sm">{toast}</div>
      )}
    </>
  );
}
