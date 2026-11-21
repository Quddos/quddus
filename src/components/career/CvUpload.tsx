"use client";

import { FileCheck2, Loader2, Paperclip, X } from "lucide-react";
import { useRef, useState } from "react";

export type CvValue = { url: string; name: string };

// Uploads the CV to Vercel Blob. Large files go straight from the browser when
// the deployment has a Blob token; otherwise the file passes through our API.
export function CvUpload({ value, onChange }: { value: CvValue | null; onChange: (v: CvValue | null) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function pick(file: File) {
    setError("");
    setBusy(true);
    try {
      const info = (await fetch("/api/career/upload").then((r) => r.json())) as {
        mode: "client" | "server" | "none";
        serverLimit: number;
        maxBytes: number;
      };
      if (info.mode === "none") throw new Error("File storage isn't set up yet — email your CV instead.");
      if (file.size > info.maxBytes) throw new Error("Please keep the CV under 8 MB.");

      if (info.mode === "client") {
        const { upload } = await import("@vercel/blob/client");
        const blob = await upload(`career/cv/${file.name}`, file, {
          access: "public",
          handleUploadUrl: "/api/career/upload",
          contentType: file.type || "application/pdf",
        });
        onChange({ url: blob.url, name: file.name });
      } else {
        if (file.size > info.serverLimit) throw new Error("Please keep the CV under 4 MB.");
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/career/upload", { method: "POST", body });
        const json = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !json.url) throw new Error(json.error ?? "Upload failed.");
        onChange({ url: json.url, name: file.name });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (value)
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-cyan/40 bg-cyan/[0.06] p-3.5">
        <span className="flex min-w-0 items-center gap-2.5 text-sm">
          <FileCheck2 className="h-4 w-4 shrink-0 text-cyan" />
          <span className="truncate">{value.name || "CV uploaded"}</span>
        </span>
        <button type="button" onClick={() => onChange(null)} className="shrink-0 text-dim transition hover:text-fg" aria-label="Remove CV">
          <X className="h-4 w-4" />
        </button>
      </div>
    );

  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong p-5 text-sm text-muted transition hover:border-cyan/50 hover:text-fg disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
        {busy ? "Uploading…" : "Upload your CV (PDF or Word)"}
      </button>
      <input
        ref={input}
        type="file"
        accept=".pdf,.doc,.docx,.rtf,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void pick(f);
        }}
      />
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
