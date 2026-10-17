import { bandPower, designFilters, filtfilt, welch, type Spectrum } from "./dsp";

export type Recording = { fs: number; channels: { name: string; data: Float32Array }[]; source: string; note?: string };

export const BANDS = [
  { key: "delta", label: "Delta", lo: 1, hi: 4 },
  { key: "theta", label: "Theta", lo: 4, hi: 8 },
  { key: "alpha", label: "Alpha", lo: 8, hi: 13 },
  { key: "beta", label: "Beta", lo: 13, hi: 30 },
  { key: "gamma", label: "Gamma", lo: 30, hi: 45 },
] as const;
export type BandKey = (typeof BANDS)[number]["key"];

export type Options = { lineFreq: "auto" | 50 | 60; artifactUv: number; maxSeconds: number };
export const DEFAULT_OPTIONS: Options = { lineFreq: "auto", artifactUv: 100, maxSeconds: 600 };

export type EpochFlag = "ok" | "amplitude" | "flat" | "muscle";

export type ChannelResult = {
  name: string;
  absolute: Record<BandKey, number>; // µV²
  relative: Record<BandKey, number>; // 0–1 of 1–45 Hz power
  peakAlpha: number | null; // Hz
  cleanFraction: number;
  epochs: EpochFlag[];
  spectrum: { freqs: number[]; psd: number[] }; // 0.5–50 Hz
};

export type Report = {
  version: 1;
  source: string;
  fs: number;
  durationSec: number;
  analyzedSec: number;
  epochSec: number;
  lineFreq: 50 | 60;
  channels: ChannelResult[];
  summary: {
    relative: Record<BandKey, number>;
    dominantBand: BandKey;
    peakAlpha: number | null;
    thetaBetaRatio: number;
    engagementIndex: number; // beta / (alpha + theta)
    frontalAlphaAsymmetry: { pair: string; value: number } | null; // ln(right) - ln(left)
    cleanFraction: number;
  };
  warnings: string[];
};

const EPOCH = 2; // seconds

// Compares mains interference at 50 and 60 Hz across the first few channels.
function detectLineFreq(rec: Recording): 50 | 60 {
  const fs = rec.fs;
  if (fs < 125) return 50;
  const seg = Math.floor(fs * 2);
  let p50 = 0, p60 = 0;
  for (const ch of rec.channels.slice(0, 6)) {
    const n = Math.min(ch.data.length, fs * 20);
    const starts: number[] = [];
    for (let s = 0; s + seg <= n; s += seg) starts.push(s);
    if (!starts.length) continue;
    const s = welch(ch.data, fs, seg, starts);
    p50 += bandPower(s, 49, 51);
    p60 += bandPower(s, 59, 61);
  }
  return p60 > p50 ? 60 : 50;
}

function peakAlpha(s: Spectrum): number | null {
  let best = -1, at = 0;
  for (let i = 0; i < s.freqs.length; i++) {
    const f = s.freqs[i];
    if (f >= 7 && f <= 14 && s.psd[i] > best) {
      best = s.psd[i];
      at = i;
    }
  }
  // A real alpha peak should stand clearly above its 4–7 / 14–20 Hz shoulders.
  const shoulder = (bandPower(s, 4, 7) / 3 + bandPower(s, 14, 20) / 6) / 2;
  return best > 1.5 * shoulder ? s.freqs[at] : null;
}

const bandRecord = (fn: (b: (typeof BANDS)[number]) => number) =>
  Object.fromEntries(BANDS.map((b) => [b.key, fn(b)])) as Record<BandKey, number>;

// Electrode pairs for frontal alpha asymmetry, most standard first.
const FAA_PAIRS: [string, string][] = [["F3", "F4"], ["AF3", "AF4"], ["F7", "F8"], ["FP1", "FP2"]];

export function analyze(rec: Recording, opts: Options = DEFAULT_OPTIONS): Report {
  const warnings: string[] = [];
  const fs = rec.fs;
  const totalSamples = rec.channels[0]?.data.length ?? 0;
  const maxSamples = Math.min(totalSamples, Math.floor(opts.maxSeconds * fs));
  if (maxSamples < totalSamples) warnings.push(`Analysed the first ${Math.round(opts.maxSeconds / 60)} minutes of ${Math.round(totalSamples / fs / 60)}.`);
  if (fs < 100) warnings.push("Sampling rate is below 100 Hz, so gamma (30–45 Hz) is unreliable.");
  const lineFreq = opts.lineFreq === "auto" ? detectLineFreq(rec) : opts.lineFreq;
  const filters = designFilters(fs, { highpass: 1, lowpass: Math.min(45, fs / 2 - 2), notch: lineFreq });
  const seg = Math.floor(EPOCH * fs);
  const nEpochs = Math.floor(maxSamples / seg);
  if (nEpochs < 2) throw new Error("The recording is too short: at least 4 seconds are needed.");

  const channels: ChannelResult[] = rec.channels.map((ch) => {
    const y = filtfilt(ch.data.subarray(0, maxSamples), filters, Math.min(seg * 2, maxSamples - 1));
    const epochs: EpochFlag[] = [];
    const clean: number[] = [];
    for (let e = 0; e < nEpochs; e++) {
      const s = e * seg;
      let min = Infinity, max = -Infinity, sum = 0, sq = 0;
      for (let i = s; i < s + seg; i++) {
        const v = y[i];
        if (v < min) min = v;
        if (v > max) max = v;
        sum += v;
        sq += v * v;
      }
      const sd = Math.sqrt(Math.max(sq / seg - (sum / seg) ** 2, 0));
      let flag: EpochFlag = "ok";
      if (max - min > opts.artifactUv) flag = "amplitude";
      else if (sd < 0.3) flag = "flat";
      else {
        const sp = welch(y, fs, seg, [s]);
        if (bandPower(sp, 30, 45) / Math.max(bandPower(sp, 1, 45), 1e-12) > 0.25) flag = "muscle";
      }
      epochs.push(flag);
      if (flag === "ok") clean.push(s);
    }
    const spec = welch(y, fs, seg, clean.length ? clean : Array.from({ length: nEpochs }, (_, e) => e * seg));
    const total = bandPower(spec, 1, 45) || 1;
    const absolute = bandRecord((b) => bandPower(spec, b.lo, b.hi));
    const keep: number[] = [];
    for (let i = 0; i < spec.freqs.length; i++) if (spec.freqs[i] >= 0.5 && spec.freqs[i] <= 50) keep.push(i);
    return {
      name: ch.name,
      absolute,
      relative: bandRecord((b) => absolute[b.key] / total),
      peakAlpha: peakAlpha(spec),
      cleanFraction: clean.length / nEpochs,
      epochs,
      spectrum: { freqs: keep.map((i) => spec.freqs[i]), psd: keep.map((i) => spec.psd[i]) },
    };
  });

  const mean = (f: (c: ChannelResult) => number) => channels.reduce((a, c) => a + f(c), 0) / channels.length;
  const relative = bandRecord((b) => mean((c) => c.relative[b.key]));
  const dominantBand = BANDS.reduce((a, b) => (relative[b.key] > relative[a.key] ? b : a)).key;
  const alphas = channels.map((c) => c.peakAlpha).filter((v): v is number => v !== null);
  const upper = (n: string) => n.toUpperCase();
  let faa: Report["summary"]["frontalAlphaAsymmetry"] = null;
  for (const [l, r] of FAA_PAIRS) {
    const L = channels.find((c) => upper(c.name) === l);
    const R = channels.find((c) => upper(c.name) === r);
    if (L && R && L.absolute.alpha > 0 && R.absolute.alpha > 0) {
      faa = { pair: `${R.name}–${L.name}`, value: Math.log(R.absolute.alpha) - Math.log(L.absolute.alpha) };
      break;
    }
  }
  const cleanFraction = mean((c) => c.cleanFraction);
  if (cleanFraction < 0.5) warnings.push("More than half of the data was flagged as artifact; results may not be representative.");

  return {
    version: 1,
    source: rec.source,
    fs,
    durationSec: totalSamples / fs,
    analyzedSec: (nEpochs * seg) / fs,
    epochSec: EPOCH,
    lineFreq,
    channels,
    summary: {
      relative,
      dominantBand,
      peakAlpha: alphas.length ? alphas.reduce((a, b) => a + b, 0) / alphas.length : null,
      thetaBetaRatio: mean((c) => c.absolute.theta) / Math.max(mean((c) => c.absolute.beta), 1e-12),
      engagementIndex: mean((c) => c.absolute.beta) / Math.max(mean((c) => c.absolute.alpha + c.absolute.theta), 1e-12),
      frontalAlphaAsymmetry: faa,
      cleanFraction,
    },
    warnings: [...warnings, ...(rec.note ? [rec.note] : [])],
  };
}

// Filtered signal for display (same filters as the analysis).
export function displaySignal(rec: Recording, channel: number, lineFreq: 50 | 60, maxSamples: number) {
  const fs = rec.fs;
  const filters = designFilters(fs, { highpass: 1, lowpass: Math.min(45, fs / 2 - 2), notch: lineFreq });
  const n = Math.min(rec.channels[channel].data.length, maxSamples);
  return filtfilt(rec.channels[channel].data.subarray(0, n), filters, Math.min(fs * 4, n - 1));
}

// Short-time spectra (1 s Hann windows, 50% overlap) for a spectrogram.
export function spectrogram(y: ArrayLike<number>, fs: number, fmax = 45) {
  const n = Math.floor(fs);
  const hop = Math.floor(n / 2);
  const cols: number[][] = [];
  let freqs: number[] = [];
  for (let s = 0; s + n <= y.length; s += hop) {
    const sp = welch(y, fs, n, [s]);
    const idx: number[] = [];
    for (let i = 0; i < sp.freqs.length; i++) if (sp.freqs[i] >= 1 && sp.freqs[i] <= fmax) idx.push(i);
    if (!freqs.length) freqs = idx.map((i) => sp.freqs[i]);
    cols.push(idx.map((i) => 10 * Math.log10(sp.psd[i] + 1e-12)));
  }
  return { freqs, cols, hopSec: hop / fs };
}
