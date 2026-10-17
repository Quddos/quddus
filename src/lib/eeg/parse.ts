import type { Recording } from "./analyze";

const ascii = (b: Uint8Array, start: number, len: number) => new TextDecoder("latin1").decode(b.subarray(start, start + len)).trim();

// EDF / EDF+ (European Data Format). Keeps the signals sharing the most common sample rate.
export function parseEdf(buf: ArrayBuffer, name = "recording.edf"): Recording {
  const b = new Uint8Array(buf);
  if (b.length < 256) throw new Error("File is too small to be EDF.");
  const headerBytes = parseInt(ascii(b, 184, 8), 10);
  const nRecords = parseInt(ascii(b, 236, 8), 10);
  const recDur = parseFloat(ascii(b, 244, 8));
  const ns = parseInt(ascii(b, 252, 4), 10);
  if (!ns || !headerBytes || !(recDur > 0)) throw new Error("This doesn't look like a valid EDF file.");
  let o = 256;
  const field = (len: number) => {
    const vals = Array.from({ length: ns }, (_, i) => ascii(b, o + i * len, len));
    o += ns * len;
    return vals;
  };
  const labels = field(16);
  field(80); // transducer
  const dims = field(8);
  const physMin = field(8).map(Number);
  const physMax = field(8).map(Number);
  const digMin = field(8).map(Number);
  const digMax = field(8).map(Number);
  field(80); // prefiltering
  const samples = field(8).map((v) => parseInt(v, 10));
  const recSamples = samples.reduce((a, c) => a + c, 0);
  const records = nRecords > 0 ? nRecords : Math.floor((b.length - headerBytes) / (recSamples * 2));

  const rates = samples.map((s) => s / recDur);
  const isSignal = (i: number) => !/annotation/i.test(labels[i]);
  const counts = new Map<number, number>();
  rates.forEach((r, i) => isSignal(i) && counts.set(r, (counts.get(r) ?? 0) + 1));
  const fs = [...counts.entries()].sort((a, c) => c[1] - a[1])[0]?.[0];
  if (!fs) throw new Error("No signals found in this EDF file.");
  const picked = labels.map((_, i) => i).filter((i) => isSignal(i) && rates[i] === fs);

  const view = new DataView(buf);
  const channels = picked.map((i) => {
    const data = new Float32Array(records * samples[i]);
    const gain = (physMax[i] - physMin[i]) / (digMax[i] - digMin[i] || 1);
    const unit = dims[i].toLowerCase();
    const toUv = unit === "mv" ? 1000 : unit === "v" ? 1e6 : unit === "nv" ? 1e-3 : 1;
    let offset = 0;
    for (let k = 0; k < i; k++) offset += samples[k];
    for (let r = 0; r < records; r++) {
      const base = headerBytes + (r * recSamples + offset) * 2;
      for (let s = 0; s < samples[i]; s++) {
        const dig = view.getInt16(base + s * 2, true);
        data[r * samples[i] + s] = ((dig - digMin[i]) * gain + physMin[i]) * toUv;
      }
    }
    return { name: labels[i].replace(/^EEG\s+/i, "").replace(/-(REF|LE|A1|A2|M1|M2)$/i, ""), data };
  });
  const skipped = labels.length - picked.length - labels.filter((l) => /annotation/i.test(l)).length;
  return {
    fs,
    channels,
    source: name,
    note: skipped > 0 ? `${skipped} channel(s) with a different sampling rate were skipped.` : undefined,
  };
}

const TEN_TWENTY = /^(FP|AF|F|FC|FT|C|CP|TP|P|PO|O|T|I)(Z|\d{1,2})$/i;
const NON_EEG = /time|stamp|counter|interpol|marker|event|battery|contact|cq|eq\.|gyro|acc|mot|pow|met|hardware|raw_?cq|sample|index/i;

// CSV/TSV: Emotiv EmotivPRO and generic exports. Picks 10-20 named columns when present.
export function parseCsv(text: string, name = "recording.csv", fallbackFs = 128): Recording {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
  const delim = (lines.slice(0, 5).join("\n").match(/\t/g)?.length ?? 0) > (lines.slice(0, 5).join("\n").match(/,/g)?.length ?? 0) ? "\t" : ",";
  const split = (l: string) => l.split(delim).map((c) => c.trim().replace(/^"|"$/g, ""));
  const isNum = (c: string) => c !== "" && !Number.isNaN(Number(c));

  // Emotiv puts metadata on line 1, e.g. "sampling rate:eeg_128".
  let fs = 0;
  const meta = lines.slice(0, 3).join(" ").match(/sampling ?rate[^0-9]*(\d{2,5})/i);
  if (meta) fs = Number(meta[1]);

  let headerRow = -1;
  for (let i = 0; i < Math.min(lines.length - 1, 20); i++) {
    const cells = split(lines[i]);
    const next = split(lines[i + 1]);
    if (cells.filter(isNum).length < cells.length / 2 && next.filter(isNum).length >= next.length / 2) {
      headerRow = i;
      break;
    }
  }
  const header = headerRow >= 0 ? split(lines[headerRow]) : split(lines[0]).map((_, i) => `Ch${i + 1}`);
  const rows = lines.slice(headerRow + 1).map(split).filter((r) => r.length >= header.length * 0.8);
  if (rows.length < 10) throw new Error("Not enough numeric rows in this file.");

  const clean = header.map((h) => h.replace(/^EEG[._ ]/i, "").replace(/[._ ](RAW|uV|µV)$/i, ""));
  let cols = clean.map((h, i) => i).filter((i) => TEN_TWENTY.test(clean[i]));
  if (!cols.length) cols = clean.map((_, i) => i).filter((i) => !NON_EEG.test(header[i]) && isNum(rows[0][i] ?? ""));
  if (!cols.length) throw new Error("Couldn't find EEG channel columns.");

  if (!fs) {
    const t = header.findIndex((h) => /time|stamp/i.test(h));
    if (t >= 0) {
      const diffs: number[] = [];
      for (let i = 1; i < Math.min(rows.length, 500); i++) diffs.push(Number(rows[i][t]) - Number(rows[i - 1][t]));
      diffs.sort((a, c) => a - c);
      const d = diffs[Math.floor(diffs.length / 2)];
      if (d > 0) fs = Math.round(d > 0.5 ? 1000 / d : 1 / d);
    }
  }
  const note = fs ? undefined : `Sampling rate not found in the file; assumed ${fallbackFs} Hz. Change it if needed.`;
  return {
    fs: fs || fallbackFs,
    channels: cols.map((i) => ({ name: clean[i], data: Float32Array.from(rows, (r) => Number(r[i]) || 0) })),
    source: name,
    note,
  };
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A synthetic 14-channel Emotiv-style recording: eyes open, eyes closed (alpha), a mental
// task (frontal theta + beta), blinks, a muscle burst and mains noise. For trying the tool.
export function sampleRecording(): Recording {
  const fs = 128;
  const sec = 60;
  const n = fs * sec;
  const names = ["AF3", "F7", "F3", "FC5", "T7", "P7", "O1", "O2", "P8", "T8", "FC6", "F4", "F8", "AF4"];
  const rand = mulberry32(42);
  const gauss = () => Math.sqrt(-2 * Math.log(Math.max(rand(), 1e-9))) * Math.cos(2 * Math.PI * rand());
  const channels = names.map((name) => {
    const data = new Float32Array(n);
    const posterior = /^(O|P)/.test(name);
    const frontal = /^(AF|F)/.test(name);
    let pink = 0;
    const ph = rand() * 6.28;
    for (let i = 0; i < n; i++) {
      const t = i / fs;
      pink = 0.97 * pink + gauss() * 2.2; // 1/f-like background
      const closed = t >= 20 && t < 40;
      const task = t >= 40;
      const alphaAmp = (posterior ? 22 : 7) * (closed ? 1 : 0.3) * (1 + 0.3 * Math.sin(t * 0.7));
      let v = pink + alphaAmp * Math.sin(2 * Math.PI * 10.2 * t + ph);
      v += (frontal && task ? 9 : 3) * Math.sin(2 * Math.PI * 6 * t + ph * 2);
      v += (task ? 5 : 2.5) * Math.sin(2 * Math.PI * 21 * t + ph * 3) + gauss() * 1.5;
      v += 4 * Math.sin(2 * Math.PI * 50 * t);
      // Eye blinks on frontal channels while the eyes are open.
      if (frontal && !closed) {
        const k = (t % 4.3) - 2;
        if (k > 0 && k < 0.35) v += 180 * Math.sin((Math.PI * k) / 0.35) * (/^AF/.test(name) ? 1 : 0.6);
      }
      // Jaw clench: muscle artefact on temporal channels.
      if (/^T/.test(name) && t > 50 && t < 53) v += gauss() * 30;
      data[i] = 4200 + v; // Emotiv-style DC offset
    }
    return { name, data };
  });
  return {
    fs,
    channels,
    source: "Sample recording (synthetic)",
    note: "Synthetic demo data: 0–20 s eyes open, 20–40 s eyes closed, 40–60 s mental task.",
  };
}
