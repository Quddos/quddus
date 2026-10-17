import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { breadcrumbs, graph, PERSON_ID } from "@/lib/jsonld";
import { abs } from "@/lib/site";
import { CopyButton } from "@/components/sections/CopyButton";
import { QudmiDemo } from "@/components/qudmi/QudmiDemo";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  alternates: { canonical: "/demos/qudmi" },
  title: "QUDMI live demo",
  description: "Full-body pose from just a VR headset and two hand controllers, running live in your browser. Try it with preset motions or your webcam.",
};

const citation = `@software{quddus2026qudmi,
  author  = {Quddus, Raheem},
  title   = {Qudmi: Full-body VR pose estimation from sparse head and hand tracking},
  year    = {2026},
  url     = {https://github.com/Quddos/qudmi}
}`;

const steps = [
  ["Sparse input", "Head and both wrists: position, 6D rotation and velocity, the last 40 frames at 30 Hz. Exactly what a Quest headset and controllers report."],
  ["Canonicalize", "Everything is re-expressed relative to where the head is and which way it faces, the only reference frame a headset can provide."],
  ["Transformer", "A 4.8 M-parameter transformer predicts all 22 SMPL joint rotations (6D) for the current frame in about 2 ms."],
  ["Full body", "Forward kinematics turns rotations into a skeleton, anchored to the tracked headset. Legs are inferred; nothing observes them."],
];

export default function QudmiDemoPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-32 md:px-10 md:pt-40">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: graph({ "@type": "SoftwareApplication", name: "QUDMI live demo", description: "Full-body pose estimation from head and hand tracking, running in the browser.", url: abs("/demos/qudmi"), applicationCategory: "MultimediaApplication", operatingSystem: "Web browser", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, author: { "@id": PERSON_ID } }, breadcrumbs([["Home", "/"], ["QUDMI live demo", "/demos/qudmi"]])) }} />
      <Reveal>
        <div className="mono-label mb-5 flex items-center gap-3">
          <span className="text-cyan">Live demo</span>
          <span className="h-px w-10 bg-line-strong" />
          QUDMI v0
        </div>
        <h1 className="max-w-4xl font-display text-[clamp(2.6rem,6vw,5rem)] font-semibold leading-[0.95] tracking-[-0.03em]">
          From three sensors to <span className="text-gradient">a full body.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">
          A VR headset only knows where your head and hands are. QUDMI, an open imitation-learning model, predicts the rest of
          your body from those three points, here in real time, entirely on your device.
        </p>
      </Reveal>

      <Reveal className="mt-12">
        <QudmiDemo />
      </Reveal>

      <section className="mt-24">
        <Reveal>
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">How it works</h2>
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
      </section>

      <section className="mt-20 grid gap-10 lg:grid-cols-2">
        <Reveal>
          <h2 className="font-display text-2xl font-semibold">Honest numbers</h2>
          <div className="mt-5 divide-y divide-line rounded-2xl border border-line text-sm">
            {[
              ["Validation (HumanEva)", "76 mm MPJPE"],
              ["Test (TotalCapture)", "94 mm MPJPE"],
              ["Published 3-point methods", "≈ 60–70 mm"],
              ["Feet / ankles", "173–196 mm"],
              ["Inference", "≈ 2 ms CPU (native)"],
            ].map(([k, val]) => (
              <div key={k} className="flex justify-between gap-4 p-3">
                <span className="text-muted">{k}</span>
                <span className="font-mono">{val}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-dim">
            Legs dominate the error, and that&apos;s structural: with three tracked points nothing observes the lower body, so it is a
            plausible inference rather than a measurement. The webcam mode adds its own error from estimating head and wrist pose
            from video.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="font-display text-2xl font-semibold">Use it</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {[
              ["GitHub (MIT code)", "https://github.com/Quddos/qudmi"],
              ["Hugging Face weights", "https://huggingface.co/quddusr/qudmi"],
              ["Unity package (OpenUPM)", "https://openupm.com/packages/com.qudmi.fullbody/"],
            ].map(([label, url]) => (
              <a key={url} href={url} target="_blank" rel="noreferrer" className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition hover:border-cyan/50">
                {label} <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-amber/30 bg-amber/[0.04] p-4 text-sm text-fg/85">
            <strong className="text-amber">Research and non-commercial use only.</strong> The weights are trained on AMASS, whose
            license forbids commercial use; the code is MIT and can be retrained on your own data for any purpose. Not validated for
            clinical or safety-critical use.
          </div>
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="mono-label">Cite</span>
              <CopyButton text={citation} label="Copy BibTeX" />
            </div>
            <pre className="overflow-x-auto rounded-2xl border border-line bg-[#05070c] p-4 font-mono text-xs text-fg/80">{citation}</pre>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
