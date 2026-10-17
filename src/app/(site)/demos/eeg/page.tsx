import type { Metadata } from "next";
import { breadcrumbs, graph, PERSON_ID } from "@/lib/jsonld";
import { abs } from "@/lib/site";
import { EegTool } from "@/components/eeg/EegTool";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  alternates: { canonical: "/demos/eeg" },
  title: "EEG Biomarker tool",
  description: "Free in-browser EEG analysis: band powers, peak alpha, artifact detection, spectra, spectrograms and scalp maps from EDF or Emotiv CSV files.",
};

const steps = [
  ["Read", "EDF/EDF+ and CSV (EmotivPRO and most exporters). Channel names and sampling rate are detected automatically."],
  ["Clean", "Zero-phase 1–45 Hz band-pass and a 50/60 Hz mains notch, then 2-second epochs are screened for blinks, flat lines and muscle noise."],
  ["Measure", "Welch power spectra of the clean epochs give band powers, peak alpha frequency, theta/beta, engagement and frontal asymmetry."],
  ["Show", "Spectra, a spectrogram, a scalp map and the raw traces, with every number exportable as JSON or CSV."],
];

export default function EegPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-32 md:px-10 md:pt-40">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: graph({ "@type": "SoftwareApplication", name: "EEG Biomarker tool", description: "In-browser EEG analysis: band powers, peak alpha, artifact detection, spectra and scalp maps.", url: abs("/demos/eeg"), applicationCategory: "HealthApplication", operatingSystem: "Web browser", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, author: { "@id": PERSON_ID } }, breadcrumbs([["Home", "/"], ["EEG Biomarker tool", "/demos/eeg"]])) }} />
      <Reveal>
        <div className="mono-label mb-5 flex items-center gap-3">
          <span className="text-cyan">Live tool</span>
          <span className="h-px w-10 bg-line-strong" />
          EEG Biomarker
        </div>
        <h1 className="max-w-4xl font-display text-[clamp(2.6rem,6vw,5rem)] font-semibold leading-[0.95] tracking-[-0.03em]">
          Your brainwaves, <span className="text-gradient">measured.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">
          Drop in an EEG recording and get the standard quantitative-EEG picture in seconds: band powers, alpha peak, artifact
          report, spectra and scalp maps. It runs in your browser; nothing is uploaded.
        </p>
      </Reveal>

      <Reveal className="mt-12">
        <EegTool />
      </Reveal>

      <section className="mt-24">
        <Reveal>
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">The pipeline</h2>
        </Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {steps.map(([title, body], i) => (
            <Reveal key={title} delay={i * 0.06}>
              <div className="h-full rounded-2xl border border-line bg-bg-2 p-5">
                <div className="font-mono text-xs text-cyan">0{i + 1}</div>
                <div className="mt-2 font-display text-lg font-semibold">{title}</div>
                <p className="mt-2 text-sm text-muted">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-8">
          <div className="rounded-2xl border border-amber/30 bg-amber/[0.04] p-4 text-sm text-fg/85">
            <strong className="text-amber">Research and education only.</strong> These are standard signal measures, not a diagnosis.
            Indices such as theta/beta or engagement vary widely between people, devices and recording conditions. Developers can call
            the same pipeline from code with a free key: <code className="font-mono text-cyan">POST /api/v1/eeg/analyze</code> (see{" "}
            <a href="/developers#docs" className="text-cyan underline">docs</a>).
          </div>
        </Reveal>
      </section>
    </div>
  );
}
