import { Reveal } from "../Reveal";

export function SectionHeader({
  index,
  label,
  title,
  accent,
  description,
}: {
  index: string;
  label: string;
  title: string;
  accent?: string;
  description?: string;
}) {
  return (
    <Reveal className="mb-12 md:mb-16">
      <div className="mono-label mb-5 flex items-center gap-3">
        <span className="text-cyan">{index}</span>
        <span className="h-px w-10 bg-line-strong" />
        {label}
      </div>
      <h2 className="max-w-4xl font-display text-[clamp(2.2rem,5vw,4.2rem)] font-semibold leading-[0.98] tracking-[-0.03em]">
        {title} {accent && <span className="text-gradient">{accent}</span>}
      </h2>
      {description && <p className="mt-5 max-w-2xl text-lg text-muted">{description}</p>}
    </Reveal>
  );
}
