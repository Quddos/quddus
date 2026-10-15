"use client";

import { Check, Copy } from "lucide-react";
import { Fragment, useState } from "react";

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="my-3 overflow-hidden rounded-xl border border-line bg-[#05070c]">
      <div className="flex items-center justify-between border-b border-line px-3 py-1.5 font-mono text-[11px] text-dim">
        <span>{lang || "code"}</span>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          }}
          className="inline-flex items-center gap-1 hover:text-fg"
        >
          {copied ? <Check className="h-3 w-3 text-cyan" /> : <Copy className="h-3 w-3" />} {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-[12.5px] leading-relaxed text-fg/90">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Inline({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("`") && p.endsWith("`") && p.length > 1 ? (
          <code key={i} className="rounded bg-white/[0.07] px-1.5 py-0.5 font-mono text-[0.85em] text-cyan">
            {p.slice(1, -1)}
          </code>
        ) : p.startsWith("**") && p.endsWith("**") && p.length > 3 ? (
          <strong key={i} className="font-semibold text-fg">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

// Small markdown renderer for model replies: fenced code, headings, lists, inline code and bold.
export function Markdown({ text }: { text: string }) {
  const blocks = text.split(/```/);
  return (
    <div className="space-y-2 text-[0.95rem] leading-relaxed text-fg/85">
      {blocks.map((block, i) => {
        if (i % 2 === 1) {
          const nl = block.indexOf("\n");
          const lang = nl === -1 ? "" : block.slice(0, nl).trim();
          const code = nl === -1 ? block : block.slice(nl + 1);
          return <CodeBlock key={i} lang={lang} code={code.replace(/\n$/, "")} />;
        }
        return block
          .split(/\n{2,}/)
          .filter((p) => p.trim())
          .map((para, j) => {
            const lines = para.split("\n");
            if (lines.every((l) => /^\s*([-*]|\d+\.)\s+/.test(l))) {
              return (
                <ul key={`${i}-${j}`} className="ml-5 list-disc space-y-1 marker:text-dim">
                  {lines.map((l, k) => (
                    <li key={k}>
                      <Inline text={l.replace(/^\s*([-*]|\d+\.)\s+/, "")} />
                    </li>
                  ))}
                </ul>
              );
            }
            const h = para.match(/^#{1,4}\s+(.*)/);
            if (h && lines.length === 1)
              return (
                <p key={`${i}-${j}`} className="font-display font-semibold text-fg">
                  <Inline text={h[1]} />
                </p>
              );
            return (
              <p key={`${i}-${j}`} className="whitespace-pre-wrap">
                <Inline text={para} />
              </p>
            );
          });
      })}
    </div>
  );
}
