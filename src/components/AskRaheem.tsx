"use client";

import { ArrowUp, ArrowUpRight, Loader2, RotateCcw, Square, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Markdown } from "./hub/Markdown";
import { readDeltas } from "./hub/Playground";

type Msg = { role: "user" | "assistant"; content: string };
type Action = { kind: "open" | "section"; target: string; label: string };

export const OPEN_ASK_EVENT = "qud:ask";

const ACTION_RE = /\[\[(open|section):([^|\]]+)\|([^\]]+)\]\]/g;

// Splits a reply into display text and navigation buttons, hiding a half-streamed tag.
function parseReply(text: string): { body: string; actions: Action[] } {
  const actions: Action[] = [];
  const body = text
    .replace(ACTION_RE, (_, kind, target, label) => {
      actions.push({ kind, target: target.trim(), label: label.trim() });
      return "";
    })
    .replace(/\[\[[^\]]*$/, "")
    .trim();
  return { body, actions };
}

export function AskRaheem({
  firstName,
  photo,
  slugs,
  sections,
}: {
  firstName: string;
  photo: string;
  slugs: string[];
  sections: string[];
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const abort = useRef<AbortController | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const suggestions = [
    `What is ${firstName} working on right now?`,
    "Which project shows the strongest research?",
    `What has ${firstName} published?`,
    `Is ${firstName} open to collaboration?`,
  ];

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener(OPEN_ASK_EVENT, onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_ASK_EVENT, onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  // On phones the launcher waits for a little scroll so it doesn't cover the hero buttons.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 160);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const valid = (a: Action) =>
    a.kind === "section" ? sections.includes(a.target) : ["/developers", "/demos/qudmi"].includes(a.target) || slugs.some((s) => a.target === `/projects/${s}`);

  function go(a: Action) {
    if (window.innerWidth < 768) setOpen(false);
    if (a.kind === "open") return router.push(a.target);
    if (pathname === "/") document.getElementById(a.target)?.scrollIntoView({ behavior: "smooth" });
    else router.push(`/#${a.target}`);
  }

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    setError("");
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    abort.current = new AbortController();
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-10) }),
        signal: abort.current.signal,
      });
      if (!res.ok || !res.body) throw new Error((await res.json().catch(() => ({}))).error || "Something went wrong.");
      let reply = "";
      for await (const delta of readDeltas(res)) {
        reply += delta;
        setMessages([...next, { role: "assistant", content: reply }]);
      }
      if (!reply) throw new Error("No reply came back. Please try again.");
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError((e as Error).message);
        setMessages((m) => (m.at(-1)?.content ? m : m.slice(0, -1)));
      }
    } finally {
      setBusy(false);
      abort.current = null;
    }
  }

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close assistant" : `Ask about ${firstName}`}
        className={`group fixed bottom-5 right-5 z-[65] flex items-center gap-3 rounded-full py-2 pl-2 pr-2 transition-all duration-500 md:bottom-7 md:right-7 md:translate-y-0 md:opacity-100 ${open ? "glass max-md:pointer-events-none max-md:opacity-0" : "glass pr-5 hover:border-cyan/50"} ${!open && !scrolled ? "max-md:pointer-events-none max-md:translate-y-4 max-md:opacity-0" : ""}`}
      >
        <span className="relative grid h-11 w-11 place-items-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-cyan/20 [animation-duration:2.4s]" />
          <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,#b9fff0,#3ee6c1_35%,#8b7bff_75%,#2a1f6b)] shadow-[0_0_30px_rgba(62,230,193,0.45)] transition group-hover:scale-110" />
          {open && <X className="relative h-5 w-5 text-bg" />}
        </span>
        {!open && (
          <span className="hidden text-left sm:block">
            <span className="block text-sm font-medium leading-tight">Ask about {firstName}</span>
            <span className="block font-mono text-[10px] uppercase tracking-wider text-muted">AI guide · live</span>
          </span>
        )}
      </button>

      {/* Panel */}
      <div
        role="dialog"
        aria-label={`Ask about ${firstName}`}
        className={`fixed inset-x-0 bottom-0 z-[64] flex h-[85dvh] flex-col overflow-hidden rounded-t-3xl border border-line-strong bg-[#070910]/95 shadow-[0_30px_120px_rgba(0,0,0,0.7)] backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:inset-x-auto md:bottom-28 md:right-7 md:h-[min(640px,calc(100dvh-160px))] md:w-[420px] md:rounded-3xl ${open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"}`}
      >
        <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
          <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-cyan/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {photo && <img src={photo} alt="" className="h-full w-full object-cover object-top" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate font-display font-semibold">{firstName}&apos;s AI guide</div>
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-cyan" /> Answers from this portfolio
            </div>
          </div>
          {messages.length > 0 && (
            <button onClick={() => setMessages([])} disabled={busy} className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-fg disabled:opacity-40" aria-label="New conversation">
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
          <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-fg md:hidden" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div ref={scroller} data-lenis-prevent className="flex-1 space-y-5 overflow-y-auto overscroll-contain p-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col justify-end">
              <p className="font-display text-2xl font-semibold leading-tight">
                Hi! Ask me anything about {firstName}&apos;s <span className="text-gradient">research, projects and experience.</span>
              </p>
              <p className="mt-2 text-sm text-muted">I&apos;ll point you to the right project or paper.</p>
              <div className="mt-5 space-y-2">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => send(s)} className="block w-full rounded-xl border border-line px-3.5 py-2.5 text-left text-sm text-muted transition hover:border-cyan/40 hover:text-fg">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => {
              if (m.role === "user")
                return (
                  <div key={i} className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-white/[0.08] px-4 py-2.5 text-[0.93rem] whitespace-pre-wrap">
                    {m.content}
                  </div>
                );
              const { body, actions } = parseReply(m.content);
              const live = busy && i === messages.length - 1;
              return (
                <div key={i}>
                  {body ? <Markdown text={body} /> : <Loader2 className="h-4 w-4 animate-spin text-cyan" />}
                  {!live && actions.filter(valid).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {actions.filter(valid).map((a) => (
                        <button
                          key={`${a.kind}:${a.target}`}
                          onClick={() => go(a)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-cyan/40 bg-cyan/[0.06] px-3.5 py-1.5 text-sm text-fg transition hover:bg-cyan/15"
                        >
                          {a.label} <ArrowUpRight className="h-3.5 w-3.5 text-cyan" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
          {error && <p className="rounded-xl border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p>}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-2 border-t border-line p-3"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            maxLength={1000}
            placeholder={`Ask about ${firstName}…`}
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-line bg-bg px-3.5 py-2.5 text-[0.93rem] outline-none placeholder:text-dim focus:border-cyan/50"
          />
          {busy ? (
            <button type="button" onClick={() => abort.current?.abort()} className="grid h-11 w-11 place-items-center rounded-xl border border-line text-muted hover:text-fg" aria-label="Stop">
              <Square className="h-4 w-4" />
            </button>
          ) : (
            <button disabled={!input.trim()} className="grid h-11 w-11 place-items-center rounded-xl bg-fg text-bg transition hover:bg-cyan disabled:opacity-30" aria-label="Send">
              <ArrowUp className="h-5 w-5" />
            </button>
          )}
        </form>
        <p className="px-4 pb-3 text-center text-[11px] text-dim">AI can make mistakes. Check important details with {firstName} directly.</p>
      </div>
    </>
  );
}
