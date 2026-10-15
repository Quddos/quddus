"use client";

import { ArrowDown, ArrowUp, Braces, Copy, Loader2, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { resetSectionAction, saveSectionAction } from "@/app/admin/actions";
import { emptyItem, type SectionSchema } from "@/lib/admin-schema";
import { FieldInput } from "./Fields";

type Item = Record<string, unknown>;

export function SectionEditor({ schema, initial }: { schema: SectionSchema; initial: unknown }) {
  const [data, setData] = useState<unknown>(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [selected, setSelected] = useState(0);
  const [raw, setRaw] = useState(false);
  const [rawText, setRawText] = useState("");
  const [toast, setToast] = useState<{ ok?: string; error?: string } | null>(null);
  const [pending, start] = useTransition();
  const dirty = useMemo(() => JSON.stringify(data) !== saved, [data, saved]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const flash = (t: { ok?: string; error?: string }) => {
    setToast(t);
    setTimeout(() => setToast(null), 3000);
  };

  const save = () =>
    start(async () => {
      let payload = data;
      if (raw) {
        try {
          payload = JSON.parse(rawText);
          setData(payload);
        } catch {
          flash({ error: "The JSON is invalid." });
          return;
        }
      }
      const res = await saveSectionAction(schema.key, payload);
      if (res.ok) setSaved(JSON.stringify(payload));
      flash(res);
    });

  const reset = () => {
    if (!confirm(`Restore the default ${schema.label}? Your saved edits for this section will be removed.`)) return;
    start(async () => {
      flash(await resetSectionAction(schema.key));
      location.reload();
    });
  };

  const list = (Array.isArray(data) ? data : []) as Item[];
  const setList = (next: Item[]) => setData(next);
  const current = schema.kind === "list" ? list[selected] : (data as Item);
  const setField = (key: string, value: unknown) => {
    if (schema.kind === "list") setList(list.map((it, i) => (i === selected ? { ...it, [key]: value } : it)));
    else setData({ ...(data as Item), [key]: value });
  };
  const move = (from: number, to: number) => {
    if (to < 0 || to >= list.length) return;
    const next = [...list];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    setList(next);
    setSelected(to);
  };

  return (
    <div>
      <div className="sticky top-0 z-20 -mx-5 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-bg/85 px-5 py-4 backdrop-blur md:-mx-10 md:px-10">
        <div>
          <h1 className="font-display text-2xl font-semibold">{schema.label}</h1>
          <p className="text-sm text-muted">{schema.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <span className="mr-1 font-mono text-xs text-amber">● Unsaved</span>}
          <button
            onClick={() => {
              if (!raw) setRawText(JSON.stringify(data, null, 2));
              else {
                try {
                  setData(JSON.parse(rawText));
                } catch {
                  flash({ error: "Fix the JSON before switching back." });
                  return;
                }
              }
              setRaw(!raw);
            }}
            className="admin-btn"
          >
            <Braces className="h-4 w-4" /> {raw ? "Form" : "JSON"}
          </button>
          <button onClick={reset} className="admin-btn" disabled={pending}>
            <RotateCcw className="h-4 w-4" /> Defaults
          </button>
          <button onClick={save} disabled={pending || (!dirty && !raw)} className="inline-flex items-center gap-2 rounded-lg bg-fg px-4 py-2 text-sm font-medium text-bg transition hover:bg-cyan disabled:opacity-40">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save & publish
          </button>
        </div>
      </div>

      {raw ? (
        <textarea value={rawText} onChange={(e) => setRawText(e.target.value)} spellCheck={false} className="admin-input h-[70vh] font-mono text-xs" />
      ) : schema.kind === "list" ? (
        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="space-y-1.5 lg:sticky lg:top-28 lg:self-start">
            {list.map((it, i) => (
              <button
                key={String(it.id ?? i)}
                onClick={() => setSelected(i)}
                className={`block w-full rounded-xl border px-3 py-2.5 text-left transition ${i === selected ? "border-cyan/50 bg-cyan/5" : "border-line hover:border-line-strong"}`}
              >
                <div className="truncate text-sm font-medium">{String(it[schema.titleKey ?? "id"] || "Untitled")}</div>
                {schema.subtitleKey && <div className="truncate text-xs text-muted">{String(it[schema.subtitleKey] ?? "")}</div>}
              </button>
            ))}
            <button
              onClick={() => {
                setList([...list, emptyItem(schema)]);
                setSelected(list.length);
              }}
              className="admin-btn w-full justify-center"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
          {current ? (
            <div className="rounded-2xl border border-line bg-bg-2 p-5 md:p-6">
              <div className="mb-5 flex flex-wrap gap-2">
                <button className="admin-btn" onClick={() => move(selected, selected - 1)} disabled={selected === 0}>
                  <ArrowUp className="h-4 w-4" /> Up
                </button>
                <button className="admin-btn" onClick={() => move(selected, selected + 1)} disabled={selected === list.length - 1}>
                  <ArrowDown className="h-4 w-4" /> Down
                </button>
                <button
                  className="admin-btn"
                  onClick={() => {
                    const copy: Item = { ...structuredClone(current), id: Math.random().toString(36).slice(2, 10) };
                    if (typeof copy.slug === "string") copy.slug = `${copy.slug}-copy`;
                    const next = [...list];
                    next.splice(selected + 1, 0, copy);
                    setList(next);
                    setSelected(selected + 1);
                  }}
                >
                  <Copy className="h-4 w-4" /> Duplicate
                </button>
                <button
                  className="admin-btn ml-auto hover:!text-danger"
                  onClick={() => {
                    if (!confirm("Delete this item?")) return;
                    setList(list.filter((_, i) => i !== selected));
                    setSelected(Math.max(0, selected - 1));
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
              <Form schema={schema} item={current} setField={setField} />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-line p-10 text-center text-muted">Nothing here yet. Add the first item.</div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-bg-2 p-5 md:p-6">
          <Form schema={schema} item={current} setField={setField} />
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 rounded-xl border px-4 py-3 text-sm shadow-2xl ${toast.error ? "border-danger/40 bg-[#1a0b10] text-danger" : "border-cyan/40 bg-[#07161a] text-cyan"}`}>
          {toast.error ?? toast.ok}
        </div>
      )}
    </div>
  );
}

function Form({ schema, item, setField }: { schema: SectionSchema; item: Item; setField: (k: string, v: unknown) => void }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {schema.fields.map((f) => (
        <div key={f.key} className={`block ${f.wide || f.type === "textarea" ? "md:col-span-2" : ""}`}>
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">{f.label}</span>
          <FieldInput field={f} value={item[f.key]} onChange={(v) => setField(f.key, v)} />
          {f.help && <span className="mt-1 block text-xs text-dim">{f.help}</span>}
        </div>
      ))}
    </div>
  );
}
