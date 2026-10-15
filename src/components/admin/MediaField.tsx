"use client";

import { upload } from "@vercel/blob/client";
import { Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

const isImage = (u: string) => /\.(png|jpe?g|webp|gif|avif|svg)(\?|$)/i.test(u);
const isVideo = (u: string) => /\.(mp4|webm|mov)(\?|$)/i.test(u);

export function MediaField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function onFile(file: File) {
    setError("");
    setProgress(0);
    try {
      const status = await fetch("/api/admin/upload").then((r) => r.json());
      if (status.mode === "none") {
        throw new Error(
          "Blob storage isn't connected. In Vercel: Storage → your Blob store → Connect to this project (or add BLOB_READ_WRITE_TOKEN), then redeploy. You can paste a URL meanwhile.",
        );
      }
      if (status.mode === "server") {
        if (file.size > status.serverLimit)
          throw new Error("Files over 4 MB need BLOB_READ_WRITE_TOKEN on the Vercel project. Paste a link (e.g. YouTube) instead for now.");
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/admin/upload/server", { method: "POST", body });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || "Upload failed.");
        onChange(json.url);
        return;
      }
      const blob = await upload(`portfolio/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload",
        multipart: file.size > 20 * 1024 * 1024,
        onUploadProgress: (e) => setProgress(Math.round(e.percentage)),
      });
      onChange(blob.url);
    } catch (e) {
      setError((e as Error).message || "Upload failed.");
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste a URL or upload a file"
          className="admin-input min-w-0 flex-1"
        />
        <button type="button" onClick={() => input.current?.click()} className="admin-btn shrink-0" disabled={progress !== null}>
          {progress !== null ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {progress !== null ? `${progress}%` : "Upload"}
        </button>
        {value && (
          <button type="button" onClick={() => onChange("")} className="admin-btn shrink-0" aria-label="Clear">
            <X className="h-4 w-4" />
          </button>
        )}
        <input
          ref={input}
          type="file"
          hidden
          accept="image/*,video/*,.glb,.gltf,application/pdf"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      {value && isImage(value) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="h-28 rounded-lg border border-line object-cover" />
      )}
      {value && isVideo(value) && <video src={value} className="h-28 rounded-lg border border-line" muted controls />}
    </div>
  );
}
