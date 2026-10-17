// Small DSP toolkit for EEG: biquad filters, zero-phase filtering, FFT and Welch PSD.

export type Biquad = { b0: number; b1: number; b2: number; a1: number; a2: number };

// RBJ audio-cookbook designs, normalised so a0 = 1.
function biquad(kind: "lowpass" | "highpass" | "notch", f0: number, fs: number, q: number): Biquad {
  const w = (2 * Math.PI * f0) / fs;
  const cos = Math.cos(w);
  const alpha = Math.sin(w) / (2 * q);
  let b0: number, b1: number, b2: number;
  if (kind === "lowpass") {
    b0 = (1 - cos) / 2;
    b1 = 1 - cos;
    b2 = (1 - cos) / 2;
  } else if (kind === "highpass") {
    b0 = (1 + cos) / 2;
    b1 = -(1 + cos);
    b2 = (1 + cos) / 2;
  } else {
    b0 = 1;
    b1 = -2 * cos;
    b2 = 1;
  }
  const a0 = 1 + alpha;
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: (-2 * cos) / a0, a2: (1 - alpha) / a0 };
}

function runBiquad(x: Float64Array, f: Biquad) {
  let x1 = x[0], x2 = x[0], y1 = x[0], y2 = x[0];
  // Start from steady state for a constant input to avoid an edge transient.
  const dc = (f.b0 + f.b1 + f.b2) / (1 + f.a1 + f.a2);
  y1 = y2 = x[0] * (Number.isFinite(dc) ? dc : 0);
  for (let i = 0; i < x.length; i++) {
    const xi = x[i];
    const yi = f.b0 * xi + f.b1 * x1 + f.b2 * x2 - f.a1 * y1 - f.a2 * y2;
    x2 = x1;
    x1 = xi;
    y2 = y1;
    y1 = yi;
    x[i] = yi;
  }
}

// Zero-phase filtering (forward + backward) with reflected padding at both ends.
export function filtfilt(data: ArrayLike<number>, filters: Biquad[], pad: number): Float64Array {
  const n = data.length;
  const p = Math.min(pad, n - 1);
  const x = new Float64Array(n + 2 * p);
  for (let i = 0; i < p; i++) {
    x[i] = 2 * data[0] - data[p - i];
    x[n + p + i] = 2 * data[n - 1] - data[n - 2 - i];
  }
  for (let i = 0; i < n; i++) x[p + i] = data[i];
  for (const f of filters) runBiquad(x, f);
  x.reverse();
  for (const f of filters) runBiquad(x, f);
  x.reverse();
  return x.subarray(p, p + n);
}

export type FilterSpec = { highpass?: number; lowpass?: number; notch?: number };

// Each band edge is a 2nd-order Butterworth section, applied twice (filtfilt), so the
// effective response is 4th order with zero phase.
export function designFilters(fs: number, spec: FilterSpec): Biquad[] {
  const out: Biquad[] = [];
  const nyq = fs / 2;
  if (spec.highpass && spec.highpass < nyq) out.push(biquad("highpass", spec.highpass, fs, Math.SQRT1_2));
  if (spec.lowpass && spec.lowpass < nyq * 0.98) out.push(biquad("lowpass", spec.lowpass, fs, Math.SQRT1_2));
  if (spec.notch && spec.notch < nyq) out.push(biquad("notch", spec.notch, fs, 30));
  return out;
}

export const nextPow2 = (n: number) => 2 ** Math.ceil(Math.log2(Math.max(2, n)));

// In-place iterative radix-2 FFT.
export function fft(re: Float64Array, im: Float64Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci;
        const ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
        const nr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = nr;
      }
    }
  }
}

const hann = (n: number) => Float64Array.from({ length: n }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / n));

export type Spectrum = { freqs: Float64Array; psd: Float64Array; segments: number };

// One-sided PSD (units^2/Hz) of one segment, Hann window, linear detrend not applied
// (callers pass filtered, zero-mean data).
function segmentPsd(x: ArrayLike<number>, start: number, n: number, nfft: number, win: Float64Array, fs: number, acc: Float64Array) {
  const re = new Float64Array(nfft);
  const im = new Float64Array(nfft);
  let mean = 0;
  for (let i = 0; i < n; i++) mean += x[start + i];
  mean /= n;
  for (let i = 0; i < n; i++) re[i] = (x[start + i] - mean) * win[i];
  fft(re, im);
  let s2 = 0;
  for (let i = 0; i < n; i++) s2 += win[i] * win[i];
  const scale = 1 / (fs * s2);
  for (let k = 0; k <= nfft / 2; k++) {
    let p = (re[k] * re[k] + im[k] * im[k]) * scale;
    if (k > 0 && k < nfft / 2) p *= 2;
    acc[k] += p;
  }
}

// Welch PSD averaged over the given segment start indices (each `n` samples long).
export function welch(x: ArrayLike<number>, fs: number, n: number, starts: number[]): Spectrum {
  const nfft = nextPow2(n);
  const win = hann(n);
  const acc = new Float64Array(nfft / 2 + 1);
  for (const s of starts) segmentPsd(x, s, n, nfft, win, fs, acc);
  const k = Math.max(starts.length, 1);
  for (let i = 0; i < acc.length; i++) acc[i] /= k;
  const freqs = Float64Array.from({ length: acc.length }, (_, i) => (i * fs) / nfft);
  return { freqs, psd: acc, segments: starts.length };
}

// Integrated power between lo (inclusive) and hi (exclusive), trapezoidal rule.
export function bandPower(s: Spectrum, lo: number, hi: number) {
  let p = 0;
  for (let i = 1; i < s.freqs.length; i++) {
    const f0 = s.freqs[i - 1], f1 = s.freqs[i];
    if (f1 <= lo || f0 >= hi) continue;
    const a = Math.max(f0, lo), b = Math.min(f1, hi);
    const t0 = (a - f0) / (f1 - f0), t1 = (b - f0) / (f1 - f0);
    const v0 = s.psd[i - 1] + (s.psd[i] - s.psd[i - 1]) * t0;
    const v1 = s.psd[i - 1] + (s.psd[i] - s.psd[i - 1]) * t1;
    p += ((v0 + v1) / 2) * (b - a);
  }
  return p;
}
