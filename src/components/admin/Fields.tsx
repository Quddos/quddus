"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import type { Field } from "@/lib/admin-schema";
import { MediaField } from "./MediaField";

type Pair = Record<string, string>;

function TagList({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (v) onChange([...value, v]);
    setDraft("");
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-1.5">
        {value.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input value={item} onChange={(e) => onChange(value.map((x, j) => (j === i ? e.target.value : x)))} className="admin-input flex-1" />
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="admin-btn" aria-label="Remove">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add and press Enter"
          className="admin-input flex-1"
        />
        <button type="button" onClick={add} className="admin-btn">
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function PairList({ value, onChange, keys, placeholders }: { value: Pair[]; onChange: (v: Pair[]) => void; keys: [string, string]; placeholders: [string, string] }) {
  return (
    <div className="space-y-2">
      {value.map((row, i) => (
        <div key={i} className="flex gap-2">
          {keys.map((k, ki) => (
            <input
              key={k}
              value={row[k] ?? ""}
              placeholder={placeholders[ki]}
              onChange={(e) => onChange(value.map((r, j) => (j === i ? { ...r, [k]: e.target.value } : r)))}
              className={`admin-input min-w-0 ${ki === 0 ? "w-1/3" : "flex-1"}`}
            />
          ))}
          <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="admin-btn" aria-label="Remove">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, { [keys[0]]: "", [keys[1]]: "" }])} className="admin-btn">
        <Plus className="h-4 w-4" /> Add
      </button>
    </div>
  );
}

export function FieldInput({ field, value, onChange }: { field: Field; value: unknown; onChange: (v: unknown) => void }) {
  switch (field.type) {
    case "textarea":
      return <textarea value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} rows={6} className="admin-input resize-y" />;
    case "number":
      return <input type="number" step="any" value={Number(value ?? 0)} onChange={(e) => onChange(Number(e.target.value))} className="admin-input" />;
    case "color":
      return (
        <div className="flex gap-2">
          <input type="color" value={String(value || "#3ee6c1")} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border border-line bg-transparent" />
          <input value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className="admin-input flex-1" />
        </div>
      );
    case "bool":
      return (
        <button
          type="button"
          onClick={() => onChange(!value)}
          className={`relative h-6 w-11 rounded-full border transition ${value ? "border-cyan bg-cyan/30" : "border-line bg-bg"}`}
          aria-pressed={Boolean(value)}
        >
          <span className={`absolute top-0.5 h-4.5 w-4.5 rounded-full bg-fg transition-all ${value ? "left-5.5" : "left-0.5"}`} />
        </button>
      );
    case "select":
      return (
        <select value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className="admin-input">
          {[...new Set([...(field.options ?? []), String(value ?? "")])].filter(Boolean).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    case "list":
      return <TagList value={(value as string[]) ?? []} onChange={onChange} />;
    case "links":
      return <PairList value={(value as Pair[]) ?? []} onChange={onChange} keys={["label", "url"]} placeholders={["Label", "https://…"]} />;
    case "stats":
      return <PairList value={(value as Pair[]) ?? []} onChange={onChange} keys={["value", "label"]} placeholders={["3", "Patents filed"]} />;
    case "media":
      return <MediaField value={String(value ?? "")} onChange={onChange} />;
    default:
      return <input value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} type={field.type === "url" ? "url" : "text"} className="admin-input" />;
  }
}
