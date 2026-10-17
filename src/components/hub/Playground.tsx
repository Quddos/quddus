"use client";

import { ArrowUp, Loader2, RotateCcw, Sparkles, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Markdown } from "./Markdown";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Unity C# for grabbing objects with Quest hand tracking",
  "MNE-Python pipeline to band-pass and epoch Emotiv EEG",
  "How do I estimate full-body pose from 3 VR trackers?",
  "Design a VR exercise for post-stroke upper-limb rehab",
];

// Reads OpenAI-style SSE and yields text deltas.
export async function* readDeltas(res: Response) {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const data = line.replace(/^data:\s*/, "").trim();
      if (!line.startsWith("data:") || !data || data === "[DONE]") continue;
      try {
        const delta = JSON.parse(data)?.choices?.[0]?.delta?.content;
        if (delta) yield delta as string;
      } catch {
        // Ignore keep-alive or partial lines.
      }
    }
  }
}

export function Playground({ height = 520 }: { height?: number }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const abort = useRef<AbortController | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages]);

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
      const res = await fetch("/api/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-12) }),
        signal: abort.current.signal,
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Something went wrong.");
      }
      let reply = "";
      for await (const delta of readDeltas(res)) {
        reply += delta;
        setMessages([...next, { role: "assistant", content: reply }]);
      }
      if (!reply) throw new Error("The model returned an empty reply. Try again.");
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
    <div className="flex flex-col overflow-hidden rounded-3xl border border-line bg-[#05070c]" style={{ height }}>
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="pulse-dot h-2 w-2 rounded-full bg-cyan" />
          <span className="font-mono text-xs text-fg">qud-1</span>
          <span className="mono-label">live playground</span>
        </div>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])} disabled={busy} className="inline-flex items-center gap-1 text-xs text-muted hover:text-fg disabled:opacity-40">
            <RotateCcw className="h-3.5 w-3.5" /> New chat
          </button>
        )}
      </div>

      <div ref={scroller} className="flex-1 space-y-5 overflow-y-auto p-4 md:p-5" data-lenis-prevent>
        {messages.length === 0 ? (
          <div className="flex h-full flex-col justify-center">
            <Sparkles className="h-6 w-6 text-cyan" />
            <p className="mt-3 font-display text-xl font-semibold">Ask Qud-1 anything about XR or neurotech.</p>
            <p className="mt-1 text-sm text-muted">Free, no sign-up. Responses can be wrong, so check anything important.</p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-xl border border-line px-3 py-2.5 text-left text-sm text-muted transition hover:border-cyan/40 hover:text-fg">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-white/[0.07] px-4 py-2.5 text-[0.95rem] whitespace-pre-wrap">
                {m.content}
              </div>
            ) : (
              <div key={i} className="max-w-full">
                {m.content ? <Markdown text={m.content} /> : <Loader2 className="h-4 w-4 animate-spin text-cyan" />}
              </div>
            ),
          )
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
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={1}
          maxLength={4000}
          placeholder="Message Qud-1…"
          className="max-h-40 min-h-[44px] flex-1 resize-none rounded-xl border border-line bg-bg px-3.5 py-2.5 text-[0.95rem] outline-none placeholder:text-dim focus:border-cyan/50"
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
    </div>
  );
}
