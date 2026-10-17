"use client";

import { AlertTriangle, Download, FileUp, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { analyze, BANDS, DEFAULT_OPTIONS, displaySignal, spectrogram, type BandKey, type Options, type Recording, type Report } from "@/lib/eeg/analyze";
import { parseCsv, parseEdf, sampleRecording } from "@/lib/eeg/parse";
import { BAND_COLOR, BandBars, BandLegend, fmtNum, fmtPct, PsdChart, SignalViewer, Spectrogram, Topomap } from "./EegCharts";

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(r: Report) {
  const head = ["channel", ...BANDS.flatMap((b) => [`${b.key}_uV2`, `${b.key}_rel`]), "peak_alpha_hz", "clean_fraction"];
  const rows = r.channels.map((c) => [c.name, ...BANDS.flatMap((b) => [c.absolute[b.key].toFixed(4), c.relative[b.key].toFixed(4)]), c.peakAlpha ?? "", c.cleanFraction.toFixed(3)]);
  return [head, ...rows].map((r) => r.join(",")).join("\n");
}

const Panel = ({ title, hint, children, className = "" }: { title: string; hint?: string; children: React.ReactNode; className?: string }) => (
  <section className={`rounded-3xl border border-line bg-bg-2 p-5 md:p-6 ${className}`}>
    <div className="mb-4">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
    </div>
    {children}
  </section>
);

export function EegTool() {
  const [rec, setRec] = useState<Recording | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [opts, setOpts] = useState<Options>(DEFAULT_OPTIONS);
  const [selected, setSelected] = useState(0);
  const [band, setBand] = useState<BandKey>("alpha");
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  function run(r: Recording, o: Options = opts) {
    setBusy(true);
    setError("");
    // Let the "Analysing" state paint before the synchronous work starts.
    setTimeout(() => {
      try {
        setRec(r);
        setReport(analyze(r, o));
        setSelected(Math.max(0, r.channels.findIndex((c) => /^O1$/i.test(c.name))));
      } catch (e) {
        setReport(null);
        setError((e as Error).message);
      } finally {
        setBusy(false);
      }
    }, 30);
  }

  async function onFile(file: File) {
    setError("");
    try {
      if (file.size > 300 * 1024 * 1024) throw new Error("Files up to 300 MB are supported.");
      const isEdf = /\.(edf|bdf)$/i.test(file.name) || (await file.slice(0, 1).text()) === "0";
      const r = isEdf ? parseEdf(await file.arrayBuffer(), file.name) : parseCsv(await file.text(), file.name);
      if (!r.channels.length) throw new Error("No EEG channels found.");
      run(r);
    } catch (e) {
      setError((e as Error).message || "Couldn't read that file.");
    }
  }

  const signals = useMemo(() => {
    if (!rec || !report) return [];
    const n = Math.floor(report.analyzedSec * rec.fs);
    return rec.channels.map((_, i) => displaySignal(rec, i, report.lineFreq, n));
  }, [rec, report]);

  const spec = useMemo(() => (signals[selected] && rec ? spectrogram(signals[selected], rec.fs) : null), [signals, selected, rec]);

  const meanSpectrum = useMemo(() => {
    if (!report) return null;
    const f = report.channels[0].spectrum.freqs;
    return { freqs: f, psd: f.map((_, i) => report.channels.reduce((a, c) => a + (c.spectrum.psd[i] ?? 0), 0) / report.channels.length) };
  }, [report]);

  if (!report || !rec) {
    return (
      <div>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files[0];
            if (f) onFile(f);
          }}
          className={`grid place-items-center rounded-3xl border-2 border-dashed p-10 text-center transition md:p-16 ${dragging ? "border-cyan bg-cyan/[0.04]" : "border-line"}`}
        >
          {busy ? (
            <div className="flex items-center gap-3 text-muted">
              <Loader2 className="h-5 w-5 animate-spin text-cyan" /> Analysing…
            </div>
          ) : (
            <div>
              <FileUp className="mx-auto h-8 w-8 text-cyan" />
              <p className="mt-4 font-display text-2xl font-semibold">Drop an EEG recording here</p>
              <p className="mt-1 text-sm text-muted">EDF / EDF+, or CSV from Emotiv (EmotivPRO) and most other exporters</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button onClick={() => fileInput.current?.click()} className="inline-flex items-center gap-2 rounded-full bg-fg px-5 py-3 text-sm font-medium text-bg transition hover:bg-cyan">
                  <FileUp className="h-4 w-4" /> Choose a file
                </button>
                <button onClick={() => run(sampleRecording())} className="glass inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm transition hover:border-cyan/50">
                  <Sparkles className="h-4 w-4 text-cyan" /> Try a sample recording
                </button>
              </div>
              <p className="mt-6 inline-flex items-center gap-2 text-xs text-dim">
                <ShieldCheck className="h-3.5 w-3.5" /> Analysed entirely in your browser. Your data never leaves this device.
              </p>
            </div>
          )}
          <input ref={fileInput} type="file" hidden accept=".edf,.bdf,.csv,.tsv,.txt" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        </div>
        {error && <p className="mt-4 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</p>}
      </div>
    );
  }

  const s = report.summary;
  const ch = report.channels[selected] ?? report.channels[0];
  const tiles: [string, string, string][] = [
    ["Recording", `${Math.round(report.durationSec)} s`, `${report.channels.length} channels · ${report.fs} Hz`],
    ["Clean data", fmtPct(s.cleanFraction), `${report.epochSec} s epochs, artifacts excluded`],
    ["Dominant band", BANDS.find((b) => b.key === s.dominantBand)!.label, `${fmtPct(s.relative[s.dominantBand])} of total power`],
    ["Peak alpha", s.peakAlpha ? `${s.peakAlpha.toFixed(1)} Hz` : "—", s.peakAlpha ? "individual alpha frequency" : "no clear alpha peak"],
    ["Theta / beta", fmtNum(s.thetaBetaRatio), "attention-related ratio"],
    ["Engagement", fmtNum(s.engagementIndex), "β / (α + θ)"],
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-bg-2 px-4 py-3 text-sm">
        <div className="min-w-0">
          <span className="font-medium">{report.source}</span>
          <span className="ml-2 text-muted">· mains {report.lineFreq} Hz notch · 1–45 Hz band-pass</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-muted">
            Sampling rate
            <input
              type="number"
              min={32}
              max={20000}
              defaultValue={rec.fs}
              onBlur={(e) => {
                const fs = Number(e.target.value);
                if (fs >= 32 && fs !== rec.fs) run({ ...rec, fs, note: undefined });
              }}
              className="admin-input w-20 py-1"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-muted">
            Artifact µV
            <select
              value={opts.artifactUv}
              onChange={(e) => {
                const o = { ...opts, artifactUv: Number(e.target.value) };
                setOpts(o);
                run(rec, o);
              }}
              className="admin-input w-20 py-1"
            >
              {[75, 100, 150, 200, 300].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <button onClick={() => download("eeg-report.json", JSON.stringify(report, null, 2), "application/json")} className="admin-btn">
            <Download className="h-4 w-4" /> JSON
          </button>
          <button onClick={() => download("eeg-band-powers.csv", toCsv(report), "text/csv")} className="admin-btn">
            <Download className="h-4 w-4" /> CSV
          </button>
          <button onClick={() => { setRec(null); setReport(null); }} className="admin-btn">New file</button>
        </div>
      </div>

      {report.warnings.length > 0 && (
        <div className="space-y-1 rounded-2xl border border-amber/30 bg-amber/[0.04] px-4 py-3 text-sm text-fg/85">
          {report.warnings.map((w) => (
            <p key={w} className="flex gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber" /> {w}
            </p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-3 xl:grid-cols-6">
        {tiles.map(([label, value, sub]) => (
          <div key={label} className="bg-bg-2 p-5">
            <div className="mono-label">{label}</div>
            <div className="mt-2 font-display text-3xl font-semibold tracking-tight">{value}</div>
            <div className="mt-1 text-xs text-muted">{sub}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Panel title="Band power by channel" hint="Share of 1–45 Hz power in each band. Click a channel to inspect it; the right column is the share of clean epochs.">
          <BandLegend />
          <div className="mt-4">
            <BandBars channels={report.channels} selected={selected} onSelect={setSelected} />
          </div>
        </Panel>
        <Panel title="Scalp map" hint="Relative power of one band across the head (interpolated between electrodes).">
          <div className="mb-4 flex flex-wrap gap-1.5">
            {BANDS.map((b) => (
              <button
                key={b.key}
                onClick={() => setBand(b.key)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ${band === b.key ? "border-fg text-fg" : "border-line text-muted hover:text-fg"}`}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: BAND_COLOR[b.key] }} />
                {b.label}
              </button>
            ))}
          </div>
          <Topomap channels={report.channels} band={band} />
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title={`Power spectrum · ${ch.name}`} hint="Welch PSD of clean epochs, compared with the mean of all channels.">
          {meanSpectrum && <PsdChart mean={meanSpectrum} channel={ch} channelName={ch.name} />}
        </Panel>
        <Panel title={`Spectrogram · ${ch.name}`} hint="How power at each frequency changes over time (1 s windows, dB).">
          {spec && <Spectrogram cols={spec.cols} freqs={spec.freqs} hopSec={spec.hopSec} />}
        </Panel>
      </div>

      <Panel title="Signals" hint="Filtered traces, 10-second window. Shaded epochs were excluded from the spectra as artifacts.">
        <SignalViewer signals={signals} names={report.channels.map((c) => c.name)} fs={rec.fs} epochs={report.channels.map((c) => c.epochs)} epochSec={report.epochSec} />
      </Panel>

      <Panel title="Table view" hint="All values per channel. Absolute power in µV², relative as a share of 1–45 Hz.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="mono-label border-b border-line text-left">
              <tr>
                <th className="py-2 pr-3 font-normal">Channel</th>
                {BANDS.map((b) => (
                  <th key={b.key} className="py-2 pr-3 text-right font-normal">
                    {b.label}
                  </th>
                ))}
                <th className="py-2 pr-3 text-right font-normal">Peak α</th>
                <th className="py-2 text-right font-normal">Clean</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line font-mono text-xs">
              {report.channels.map((c) => (
                <tr key={c.name}>
                  <td className="py-2 pr-3 text-fg">{c.name}</td>
                  {BANDS.map((b) => (
                    <td key={b.key} className="py-2 pr-3 text-right">
                      <span className="text-fg">{fmtPct(c.relative[b.key])}</span> <span className="text-dim">{c.absolute[b.key].toFixed(1)}</span>
                    </td>
                  ))}
                  <td className="py-2 pr-3 text-right">{c.peakAlpha ? `${c.peakAlpha.toFixed(1)} Hz` : "—"}</td>
                  <td className="py-2 text-right">{fmtPct(c.cleanFraction)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {s.frontalAlphaAsymmetry && (
          <p className="mt-4 text-sm text-muted">
            Frontal alpha asymmetry ({s.frontalAlphaAsymmetry.pair}, ln right − ln left):{" "}
            <span className="font-mono text-fg">{s.frontalAlphaAsymmetry.value.toFixed(3)}</span>
          </p>
        )}
      </Panel>
    </div>
  );
}
