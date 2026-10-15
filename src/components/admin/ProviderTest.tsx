"use client";

import { Loader2, Zap } from "lucide-react";
import { useState, useTransition } from "react";
import { testProvidersAction, type ProviderTest as Result } from "@/app/admin/actions";

export function ProviderTest({ configured }: { configured: string[] }) {
  const [result, setResult] = useState<Result | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="mt-6 rounded-2xl border border-line bg-bg-2 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mono-label">AI providers (tried in order)</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {configured.map((p) => (
              <span key={p} className="rounded-full border border-line px-3 py-1 text-xs">
                {p}
              </span>
            ))}
          </div>
        </div>
        <button onClick={() => start(async () => setResult(await testProvidersAction()))} disabled={pending} className="admin-btn">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />} Test AI providers
        </button>
      </div>
      {result && (
        <div className="mt-4 space-y-2 text-sm">
          <p className={result.ok ? "text-cyan" : "text-danger"}>
            {result.ok ? `Working. Reply: “${result.reply?.trim()}”` : "Every provider failed. Details below."}
          </p>
          {result.attempts.map((a, i) => (
            <div key={i} className="rounded-lg border border-line p-3 font-mono text-xs">
              <span className={a.detail === "ok" ? "text-cyan" : "text-rose"}>{a.status || "ERR"}</span> {a.provider} · {a.model}
              {a.detail !== "ok" && <div className="mt-1 break-all text-muted">{a.detail}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
