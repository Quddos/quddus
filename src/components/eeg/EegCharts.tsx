"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BANDS, type BandKey, type ChannelResult, type EpochFlag } from "@/lib/eeg/analyze";
import { electrodePosition } from "@/lib/eeg/positions";

// Categorical slots 1–5 (dark steps), validated against the #080a12 panel surface.
export const BAND_COLOR: Record<BandKey, string> = {
  delta: "#3987e5",
  theta: "#d95926",
  alpha: "#199e70",
  beta: "#c98500",
  gamma: "#d55181",
};
const TEXT = "#e9ecf5";
const MUTED = "#8a93ad";
const GRID = "rgba(160,180,255,0.12)";
const SURFACE = "#080a12";
const CRITICAL = "#d03b3b";
// Sequential blue ramp, dark (low) to light (high) for the dark surface.
const RAMP = ["#0d366b", "#104281", "#184f95", "#1c5cab", "#256abf", "#2a78d6", "#3987e5", "#5598e7", "#6da7ec", "#86b6ef", "#9ec5f4", "#b7d3f6", "#cde2fb"];

function rampColor(t: number): [number, number, number] {
  const x = Math.min(Math.max(t, 0), 1) * (RAMP.length - 1);
  const i = Math.floor(x);
  const f = x - i;
  const hex = (h: string) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
  const a = hex(RAMP[i]);
  const b = hex(RAMP[Math.min(i + 1, RAMP.length - 1)]);
  return [0, 1, 2].map((k) => Math.round(a[k] + (b[k] - a[k]) * f)) as [number, number, number];
}

export const fmtPct = (v: number) => `${(v * 100).toFixed(v < 0.1 ? 1 : 0)}%`;

// Two decimals for ordinary ratios, compact notation for extreme ones.
export const fmtNum = (v: number) =>
  !Number.isFinite(v) ? "—" : Math.abs(v) >= 1000 ? new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(v) : v.toFixed(2);

type Tip = { x: number; y: number; html: React.ReactNode } | null;

function Tooltip({ tip }: { tip: Tip }) {
  if (!tip) return null;
  return (
    <div
      className="pointer-events-none absolute z-10 rounded-lg border border-line-strong bg-[#0d1019f2] px-3 py-2 text-xs shadow-xl"
      style={{ left: tip.x + 14, top: tip.y + 14, maxWidth: 240 }}
    >
      {tip.html}
    </div>
  );
}

export function BandLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
      {BANDS.map((b) => (
        <span key={b.key} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: BAND_COLOR[b.key] }} />
          {b.label} <span className="text-dim">{b.lo}–{b.hi} Hz</span>
        </span>
      ))}
    </div>
  );
}

// 100% stacked bars: each channel's power split across the five bands.
export function BandBars({ channels, selected, onSelect }: { channels: ChannelResult[]; selected: number; onSelect: (i: number) => void }) {
  const [tip, setTip] = useState<Tip>(null);
  const wrap = useRef<HTMLDivElement>(null);
  return (
    <div ref={wrap} className="relative" onMouseLeave={() => setTip(null)}>
      <div className="space-y-1.5">
        {channels.map((c, i) => {
          let acc = 0;
          return (
            <button
              key={c.name}
              onClick={() => onSelect(i)}
              className={`grid w-full grid-cols-[52px_minmax(0,1fr)_44px] items-center gap-3 rounded-md px-1 py-0.5 text-left transition ${i === selected ? "bg-white/[0.05]" : "hover:bg-white/[0.03]"}`}
            >
              <span className={`font-mono text-xs ${i === selected ? "text-fg" : "text-muted"}`}>{c.name}</span>
              <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="h-4 w-full overflow-visible">
                {BANDS.map((b, k) => {
                  const w = c.relative[b.key] * 100;
                  const x = acc;
                  acc += w;
                  const gap = k < BANDS.length - 1 ? 0.35 : 0;
                  return (
                    <rect
                      key={b.key}
                      x={x}
                      y={0}
                      width={Math.max(w - gap, 0)}
                      height={10}
                      rx={k === 0 || k === BANDS.length - 1 ? 1 : 0}
                      fill={BAND_COLOR[b.key]}
                      onMouseMove={(e) => {
                        const r = wrap.current!.getBoundingClientRect();
                        setTip({
                          x: e.clientX - r.left,
                          y: e.clientY - r.top,
                          html: (
                            <>
                              <div className="font-medium text-fg">
                                {c.name} · {b.label}
                              </div>
                              <div className="text-muted">
                                {fmtPct(c.relative[b.key])} of 1–45 Hz · {c.absolute[b.key].toFixed(2)} µV²
                              </div>
                            </>
                          ),
                        });
                      }}
                    />
                  );
                })}
              </svg>
              <span className="text-right font-mono text-[11px] text-dim" title="Share of epochs without artifacts">
                {fmtPct(c.cleanFraction)}
              </span>
            </button>
          );
        })}
      </div>
      <Tooltip tip={tip} />
    </div>
  );
}

// Power spectral density on a log scale with band regions.
export function PsdChart({ mean, channel, channelName }: { mean: { freqs: number[]; psd: number[] }; channel: ChannelResult; channelName: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640, H = 260, L = 48, R = 12, T = 22, B = 30;
  const fMin = 1, fMax = 45;
  const series = [
    { name: "All channels (mean)", color: "#9aa3bd", data: mean, dash: "4 3" },
    { name: channelName, color: "#3987e5", data: channel.spectrum, dash: undefined },
  ];
  const vals = series.flatMap((s) => s.data.psd.filter((_, i) => s.data.freqs[i] >= fMin && s.data.freqs[i] <= fMax)).filter((v) => v > 0);
  const lo = Math.floor(Math.log10(Math.min(...vals)));
  const hi = Math.ceil(Math.log10(Math.max(...vals)));
  const x = (f: number) => L + ((f - fMin) / (fMax - fMin)) * (W - L - R);
  const y = (p: number) => T + (1 - (Math.log10(Math.max(p, 10 ** lo)) - lo) / (hi - lo || 1)) * (H - T - B);
  const path = (d: { freqs: number[]; psd: number[] }) =>
    d.freqs.map((f, i) => (f < fMin || f > fMax ? "" : `${i && d.freqs[i - 1] >= fMin ? "L" : "M"}${x(f).toFixed(1)},${y(d.psd[i]).toFixed(1)}`)).join("");
  const at = (d: { freqs: number[]; psd: number[] }, f: number) => {
    let best = 0;
    for (let i = 0; i < d.freqs.length; i++) if (Math.abs(d.freqs[i] - f) < Math.abs(d.freqs[best] - f)) best = i;
    return d.psd[best];
  };
  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          const f = fMin + ((px - L) / (W - L - R)) * (fMax - fMin);
          setHover(f >= fMin && f <= fMax ? Math.round(f * 2) / 2 : null);
        }}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label={`Power spectrum of ${channelName} and the channel mean, 1 to 45 Hz`}
      >
        {BANDS.map((b) => (
          <g key={b.key}>
            <rect x={x(b.lo)} y={T} width={x(Math.min(b.hi, fMax)) - x(b.lo)} height={H - T - B} fill={BAND_COLOR[b.key]} opacity={0.06} />
            <text x={(x(b.lo) + x(Math.min(b.hi, fMax))) / 2} y={T - 7} textAnchor="middle" fontSize={10} fill={MUTED}>
              {b.label}
            </text>
          </g>
        ))}
        {Array.from({ length: hi - lo + 1 }, (_, k) => lo + k).map((e) => (
          <g key={e}>
            <line x1={L} x2={W - R} y1={y(10 ** e)} y2={y(10 ** e)} stroke={GRID} />
            <text x={L - 6} y={y(10 ** e) + 3} textAnchor="end" fontSize={10} fill={MUTED}>
              {e >= 3 || e <= -3 ? `1e${e}` : 10 ** e}
            </text>
          </g>
        ))}
        {[1, 4, 8, 13, 20, 30, 45].map((f) => (
          <text key={f} x={x(f)} y={H - 10} textAnchor="middle" fontSize={10} fill={MUTED}>
            {f}
          </text>
        ))}
        <text x={W - R} y={H - 10} textAnchor="end" fontSize={10} fill={MUTED} dx={-2} dy={-12}>
          Hz
        </text>
        <text x={12} y={T + 4} fontSize={10} fill={MUTED} transform={`rotate(-90 12 ${T + 4})`} textAnchor="end">
          µV²/Hz
        </text>
        {series.map((s) => (
          <path key={s.name} d={path(s.data)} fill="none" stroke={s.color} strokeWidth={2} strokeDasharray={s.dash} strokeLinejoin="round" />
        ))}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke={MUTED} strokeDasharray="2 3" />
            {series.map((s) => (
              <circle key={s.name} cx={x(hover)} cy={y(at(s.data, hover))} r={4} fill={s.color} stroke={SURFACE} strokeWidth={2} />
            ))}
          </g>
        )}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute right-2 top-6 rounded-lg border border-line-strong bg-[#0d1019f2] px-3 py-2 text-xs">
          <div className="font-medium text-fg">{hover} Hz</div>
          {series.map((s) => (
            <div key={s.name} className="flex items-center gap-2 text-muted">
              <span className="h-0.5 w-3" style={{ background: s.color }} /> {s.name}: <span className="text-fg">{at(s.data, hover).toPrecision(3)}</span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
        {series.map((s) => (
          <span key={s.name} className="inline-flex items-center gap-1.5">
            <svg width="18" height="4">
              <line x1="0" x2="18" y1="2" y2="2" stroke={s.color} strokeWidth="2" strokeDasharray={s.dash} />
            </svg>
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}

// Scalp map of one band's relative power, inverse-distance interpolated between electrodes.
export function Topomap({ channels, band }: { channels: ChannelResult[]; band: BandKey }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const points = useMemo(
    () =>
      channels
        .map((c) => ({ name: c.name, pos: electrodePosition(c.name), v: c.relative[band] }))
        .filter((p): p is { name: string; pos: [number, number]; v: number } => p.pos !== null),
    [channels, band],
  );
  const min = Math.min(...points.map((p) => p.v));
  const max = Math.max(...points.map((p) => p.v));
  const [tip, setTip] = useState<Tip>(null);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv || points.length < 3) return;
    const S = 220;
    cv.width = S;
    cv.height = S;
    const ctx = cv.getContext("2d")!;
    const img = ctx.createImageData(S, S);
    for (let py = 0; py < S; py++) {
      for (let px = 0; px < S; px++) {
        const hx = (px / (S - 1)) * 2.2 - 1.1;
        const hy = 1.1 - (py / (S - 1)) * 2.2;
        if (hx * hx + hy * hy > 0.96) continue;
        let num = 0, den = 0, exact: number | null = null;
        for (const p of points) {
          const d2 = (hx - p.pos[0]) ** 2 + (hy - p.pos[1]) ** 2;
          if (d2 < 1e-6) {
            exact = p.v;
            break;
          }
          const w = 1 / (d2 * d2);
          num += w * p.v;
          den += w;
        }
        const v = exact ?? num / den;
        const [r, g, b] = rampColor((v - min) / (max - min || 1));
        const k = (py * S + px) * 4;
        img.data[k] = r;
        img.data[k + 1] = g;
        img.data[k + 2] = b;
        img.data[k + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [points, min, max]);

  if (points.length < 3)
    return <p className="py-10 text-center text-sm text-muted">A scalp map needs at least three channels with standard 10-20 names.</p>;

  const toPct = (v: number) => ((v + 1.1) / 2.2) * 100;
  return (
    <div className="relative mx-auto w-full max-w-[300px]" onMouseLeave={() => setTip(null)}>
      <div className="relative aspect-square">
        <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
        <svg viewBox="-1.1 -1.1 2.2 2.2" className="absolute inset-0 h-full w-full overflow-visible">
          <circle cx={0} cy={0} r={0.98} fill="none" stroke={MUTED} strokeWidth={0.015} />
          <path d="M -0.1 -0.975 L 0 -1.08 L 0.1 -0.975" fill="none" stroke={MUTED} strokeWidth={0.015} />
          <path d="M -0.98 -0.1 Q -1.06 0 -0.98 0.12 M 0.98 -0.1 Q 1.06 0 0.98 0.12" fill="none" stroke={MUTED} strokeWidth={0.015} />
        </svg>
        {points.map((p) => (
          <div
            key={p.name}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-default text-center"
            style={{ left: `${toPct(p.pos[0])}%`, top: `${100 - toPct(p.pos[1])}%` }}
            onMouseEnter={(e) => {
              const r = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
              setTip({ x: e.clientX - r.left, y: e.clientY - r.top, html: <><span className="text-fg">{p.name}</span> <span className="text-muted">{fmtPct(p.v)}</span></> });
            }}
          >
            <div className="mx-auto h-2 w-2 rounded-full border-2 border-[#080a12] bg-fg" />
            <div className="mt-0.5 rounded bg-[#080a12d9] px-1 py-px font-mono text-[9px] leading-none text-fg">{p.name}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-muted">
        <span>{fmtPct(min)}</span>
        <div className="h-2 flex-1 rounded-full" style={{ background: `linear-gradient(90deg, ${RAMP.join(",")})` }} />
        <span>{fmtPct(max)}</span>
      </div>
      <Tooltip tip={tip} />
    </div>
  );
}

// Time-frequency heatmap (dB) for one channel.
export function Spectrogram({ cols, freqs, hopSec }: { cols: number[][]; freqs: number[]; hopSec: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [tip, setTip] = useState<Tip>(null);
  const flat = cols.flat();
  const sorted = [...flat].sort((a, b) => a - b);
  const lo = sorted[Math.floor(sorted.length * 0.05)] ?? 0;
  const hi = sorted[Math.floor(sorted.length * 0.99)] ?? 1;
  useEffect(() => {
    const cv = canvas.current;
    if (!cv || !cols.length) return;
    cv.width = cols.length;
    cv.height = freqs.length;
    const ctx = cv.getContext("2d")!;
    const img = ctx.createImageData(cols.length, freqs.length);
    cols.forEach((col, x) =>
      col.forEach((v, f) => {
        const [r, g, b] = rampColor((v - lo) / (hi - lo || 1));
        const k = ((freqs.length - 1 - f) * cols.length + x) * 4;
        img.data.set([r, g, b, 255], k);
      }),
    );
    ctx.putImageData(img, 0, 0);
  }, [cols, freqs, lo, hi]);
  const duration = cols.length * hopSec;
  return (
    <div className="relative" onMouseLeave={() => setTip(null)}>
      <div className="grid grid-cols-[28px_minmax(0,1fr)] gap-2">
        <div className="flex flex-col justify-between py-0.5 text-right font-mono text-[10px] text-muted">
          <span>{Math.round(freqs.at(-1) ?? 45)}</span>
          <span>{Math.round((freqs.at(-1) ?? 45) / 2)}</span>
          <span>{Math.round(freqs[0] ?? 1)}</span>
        </div>
        <canvas
          ref={canvas}
          className="h-48 w-full rounded-md [image-rendering:pixelated]"
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const xi = Math.floor(((e.clientX - r.left) / r.width) * cols.length);
            const fi = freqs.length - 1 - Math.floor(((e.clientY - r.top) / r.height) * freqs.length);
            const v = cols[xi]?.[fi];
            const pr = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
            if (v !== undefined)
              setTip({ x: e.clientX - pr.left, y: e.clientY - pr.top, html: <span className="text-muted"><span className="text-fg">{(xi * hopSec).toFixed(1)} s · {freqs[fi].toFixed(0)} Hz</span> · {v.toFixed(1)} dB</span> });
          }}
        />
      </div>
      <div className="ml-[36px] mt-1 flex justify-between font-mono text-[10px] text-muted">
        <span>0 s</span>
        <span>{(duration / 2).toFixed(0)} s</span>
        <span>{duration.toFixed(0)} s</span>
      </div>
      <Tooltip tip={tip} />
    </div>
  );
}

const FLAG_LABEL: Record<Exclude<EpochFlag, "ok">, string> = { amplitude: "high amplitude (blink/movement)", flat: "flat signal", muscle: "muscle (EMG)" };

// Stacked traces for a 10-second window, with artifact epochs shaded.
export function SignalViewer({ signals, names, fs, epochs, epochSec }: { signals: Float64Array[]; names: string[]; fs: number; epochs: EpochFlag[][]; epochSec: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [start, setStart] = useState(0);
  const windowSec = 10;
  const total = (signals[0]?.length ?? 0) / fs;
  const [gain, setGain] = useState(1);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = cv.clientWidth, h = cv.clientHeight;
    cv.width = w * dpr;
    cv.height = h * dpr;
    const ctx = cv.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    const left = 44;
    const s0 = Math.floor(start * fs), s1 = Math.min(Math.floor((start + windowSec) * fs), signals[0]?.length ?? 0);
    const rowH = h / Math.max(signals.length, 1);
    const xOf = (i: number) => left + ((i - s0) / (windowSec * fs)) * (w - left);
    // Artifact shading per channel row.
    epochs.forEach((ep, c) =>
      ep.forEach((flag, e) => {
        if (flag === "ok") return;
        const a = e * epochSec * fs, b = a + epochSec * fs;
        if (b < s0 || a > s1) return;
        ctx.fillStyle = "rgba(208,59,59,0.16)";
        ctx.fillRect(xOf(Math.max(a, s0)), c * rowH, xOf(Math.min(b, s1)) - xOf(Math.max(a, s0)), rowH);
      }),
    );
    ctx.strokeStyle = GRID;
    for (let t = Math.ceil(start); t <= start + windowSec; t++) {
      const x = xOf(t * fs);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    const scale = (rowH * 0.45 * gain) / 50; // ±50 µV fills ~45% of a row at gain 1
    signals.forEach((sig, c) => {
      const mid = c * rowH + rowH / 2;
      ctx.fillStyle = MUTED;
      ctx.font = "10px ui-monospace, monospace";
      ctx.fillText(names[c], 4, mid + 3);
      ctx.strokeStyle = "#9ec5f4";
      ctx.lineWidth = 1;
      ctx.beginPath();
      const step = Math.max(1, Math.floor((s1 - s0) / ((w - left) * 2)));
      for (let i = s0; i < s1; i += step) {
        const y = mid - sig[i] * scale;
        if (i === s0) ctx.moveTo(xOf(i), y);
        else ctx.lineTo(xOf(i), y);
      }
      ctx.stroke();
    });
  }, [signals, names, fs, epochs, epochSec, start, gain]);

  return (
    <div>
      <canvas ref={canvas} className="w-full rounded-md bg-[#05070c]" style={{ height: Math.max(220, signals.length * 30) }} role="img" aria-label="Filtered EEG traces" />
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted">
        <label className="flex flex-1 items-center gap-2">
          <span className="font-mono">{start.toFixed(0)}–{Math.min(start + windowSec, total).toFixed(0)} s</span>
          <input type="range" min={0} max={Math.max(total - windowSec, 0)} step={0.5} value={start} onChange={(e) => setStart(Number(e.target.value))} className="flex-1 accent-[#3987e5]" aria-label="Scroll through the recording" />
        </label>
        <label className="flex items-center gap-2">
          Gain
          <input type="range" min={0.25} max={4} step={0.25} value={gain} onChange={(e) => setGain(Number(e.target.value))} className="w-24 accent-[#3987e5]" aria-label="Signal gain" />
        </label>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ background: "rgba(208,59,59,0.35)", outline: `1px solid ${CRITICAL}` }} />
          ⚠ Artifact epoch ({Object.values(FLAG_LABEL).join(", ")})
        </span>
      </div>
    </div>
  );
}

export const TEXT_COLOR = TEXT;
