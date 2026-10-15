"use client";

import { Check, Copy, KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";

export function KeyForm() {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("busy");
    setError("");
    const form = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, agree: form.agree === "on" }),
    }).catch(() => null);
    const json = await res?.json().catch(() => null);
    if (res?.ok && json?.key) {
      setKey(json.key);
      setState("done");
    } else {
      setError(json?.error ?? "Couldn't create a key. Try again later.");
      setState("idle");
    }
  }

  const field = "w-full rounded-xl border border-line bg-bg px-4 py-3 outline-none transition placeholder:text-dim focus:border-cyan/60";

  if (state === "done")
    return (
      <div className="rounded-3xl border border-cyan/30 bg-cyan/[0.04] p-6 md:p-8">
        <div className="flex items-center gap-2 text-cyan">
          <KeyRound className="h-5 w-5" /> Your API key
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-bg p-3">
          <code className="flex-1 overflow-x-auto font-mono text-sm whitespace-nowrap">{key}</code>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(key);
              setCopied(true);
            }}
            className="admin-btn shrink-0"
          >
            {copied ? <Check className="h-4 w-4 text-cyan" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="mt-4 text-sm text-amber">Copy it now. For your security it won&apos;t be shown again; only a hash is stored.</p>
        <p className="mt-2 text-sm text-muted">Keep it on your server (e.g. an environment variable), not in client-side code.</p>
      </div>
    );

  return (
    <form onSubmit={submit} className="rounded-3xl border border-line bg-bg-2 p-6 md:p-8">
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="name" required maxLength={80} placeholder="Your name or project" className={field} />
        <input name="email" type="email" required maxLength={200} placeholder="Email" className={field} />
      </div>
      <textarea name="purpose" maxLength={500} rows={3} placeholder="What will you build? (optional)" className={`${field} mt-3 resize-none`} />
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" />
      <label className="mt-4 flex items-start gap-3 text-sm text-muted">
        <input type="checkbox" name="agree" required className="mt-1 accent-[var(--cyan)]" />
        <span>
          I&apos;ll use the API fairly and lawfully, won&apos;t share my key, and understand outputs can be wrong and aren&apos;t medical
          advice. Keys that abuse the service may be revoked.
        </span>
      </label>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      <button disabled={state === "busy"} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-fg px-6 py-3.5 font-medium text-bg transition hover:bg-cyan disabled:opacity-60">
        {state === "busy" ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Generate free API key
      </button>
    </form>
  );
}
