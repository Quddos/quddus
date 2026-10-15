import type { Profile } from "@/lib/types";

export function Footer({ profile }: { profile: Profile }) {
  return (
    <footer className="relative border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between md:px-10">
        <div className="flex items-center gap-3 font-mono text-xs text-dim">
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-cyan" /> All systems nominal · © {profile.name}
        </div>
        <div className="flex flex-wrap gap-5 text-sm text-muted">
          {profile.socials.map((s) => (
            <a key={s.url} href={s.url} target={s.url.startsWith("mailto:") ? undefined : "_blank"} rel="noreferrer" className="hover:text-fg">
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
