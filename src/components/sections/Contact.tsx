"use client";

import { ArrowUpRight, Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Profile } from "@/lib/types";
import { Reveal } from "../Reveal";

const intents = [
  ["collaborate", "Research collaboration"],
  ["hire", "Engineering work"],
  ["speak", "Talk / workshop"],
  ["mentor", "Mentorship"],
  ["api", "API early access"],
] as const;

export function Contact({ profile }: { profile: Profile }) {
  const [intent, setIntent] = useState<string>("collaborate");

  // The AI Hub's early-access button preselects the "api" intent.
  useEffect(() => {
    const onIntent = (e: Event) => setIntent((e as CustomEvent<string>).detail);
    window.addEventListener("qud:intent", onIntent);
    return () => window.removeEventListener("qud:intent", onIntent);
  }, []);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...Object.fromEntries(form), intent }),
    }).catch(() => null);
    if (res?.ok) {
      setState("sent");
    } else {
      setState("error");
      setError((await res?.json().catch(() => null))?.error ?? "Something went wrong. Email me directly instead.");
    }
  }

  const field =
    "w-full rounded-xl border border-line bg-bg px-4 py-3 text-fg outline-none transition placeholder:text-dim focus:border-cyan/60";

  return (
    <section id="contact" className="relative mx-auto max-w-7xl px-5 py-28 md:px-10 md:py-40">
      <div className="grid gap-14 lg:grid-cols-2">
        <Reveal>
          <div className="mono-label mb-5 flex items-center gap-3">
            <span className="text-cyan">06</span>
            <span className="h-px w-10 bg-line-strong" />
            Contact
          </div>
          <h2 className="font-display text-[clamp(2.6rem,6vw,5rem)] font-semibold leading-[0.95] tracking-[-0.03em]">
            Let&apos;s build
            <br />
            <span className="text-gradient">what&apos;s next.</span>
          </h2>
          <p className="mt-6 max-w-md text-lg text-muted">{profile.availability}.</p>
          <a href={`mailto:${profile.email}`} className="mt-8 inline-flex items-center gap-2 font-display text-xl hover:text-cyan md:text-2xl">
            {profile.email} <ArrowUpRight className="h-5 w-5" />
          </a>
          <div className="mt-8 flex flex-wrap gap-2">
            {profile.socials
              .filter((s) => !s.url.startsWith("mailto:"))
              .map((s) => (
                <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="glass rounded-full px-4 py-2 text-sm text-muted transition hover:text-fg">
                  {s.label}
                </a>
              ))}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          {state === "sent" ? (
            <div className="grid h-full place-items-center rounded-3xl border border-cyan/30 bg-cyan/5 p-10 text-center">
              <div>
                <Check className="mx-auto h-10 w-10 text-cyan" />
                <div className="mt-4 font-display text-2xl font-semibold">Signal received.</div>
                <p className="mt-2 text-muted">Thanks. I&apos;ll get back to you soon.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="rounded-3xl border border-line bg-bg-2 p-6 md:p-8">
              <div className="mono-label mb-3">I&apos;m reaching out about</div>
              <div className="mb-6 flex flex-wrap gap-2">
                {intents.map(([k, label]) => (
                  <button
                    type="button"
                    key={k}
                    onClick={() => setIntent(k)}
                    className={`rounded-full border px-3.5 py-1.5 text-sm transition ${intent === k ? "border-cyan bg-cyan/10 text-fg" : "border-line text-muted hover:text-fg"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input name="name" required maxLength={120} placeholder="Your name" className={field} />
                <input name="email" type="email" required maxLength={200} placeholder="Email" className={field} />
              </div>
              <textarea name="body" required maxLength={5000} rows={6} placeholder="Tell me about it…" className={`${field} mt-3 resize-none`} />
              {/* Honeypot for bots. */}
              <input name="website" tabIndex={-1} autoComplete="off" className="hidden" />
              {state === "error" && <p className="mt-3 text-sm text-danger">{error}</p>}
              <button
                disabled={state === "sending"}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-fg px-6 py-3.5 font-medium text-bg transition hover:bg-cyan disabled:opacity-60"
              >
                {state === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Send message
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
