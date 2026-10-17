import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { VrView } from "@/components/vr/VrView";
import { getContent } from "@/lib/content";
import { breadcrumbs, graph, PERSON_ID } from "@/lib/jsonld";
import { abs } from "@/lib/site";

export const metadata: Metadata = {
  title: "The Lab in VR",
  description: "Walk through Raheem Qudus's projects in WebXR: open this page in the Meta Quest browser and press Enter VR, or explore it on desktop.",
  alternates: { canonical: "/vr" },
};

export default async function VrPage() {
  const c = await getContent();
  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-32 md:px-10 md:pt-40">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: graph(
            { "@type": "SoftwareApplication", name: "The Lab in VR", url: abs("/vr"), applicationCategory: "MultimediaApplication", operatingSystem: "Web browser, Meta Quest Browser", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, author: { "@id": PERSON_ID } },
            breadcrumbs([["Home", "/"], ["The Lab in VR", "/vr"]]),
          ),
        }}
      />
      <Reveal>
        <div className="mono-label mb-5 flex items-center gap-3">
          <span className="text-cyan">WebXR</span>
          <span className="h-px w-10 bg-line-strong" />
          The Lab in VR
        </div>
        <h1 className="max-w-4xl font-display text-[clamp(2.4rem,5.5vw,4.6rem)] font-semibold leading-[0.95] tracking-[-0.03em]">
          Step inside <span className="text-gradient">the Lab.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">
          On a Meta Quest, open this page in the browser and press <strong className="text-fg">Enter VR</strong> to stand among the
          projects. Point and pull the trigger to open one. On a computer, drag to look around and click a panel.
        </p>
      </Reveal>
      <Reveal className="mt-10">
        <VrView profile={c.profile} projects={c.projects} />
      </Reveal>
    </div>
  );
}
