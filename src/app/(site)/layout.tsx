import { CommandPalette } from "@/components/CommandPalette";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { SmoothScroll } from "@/components/SmoothScroll";
import { getContent } from "@/lib/content";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const c = await getContent();
  return (
    <div className="grain">
      <SmoothScroll />
      <Nav name={c.profile.name} />
      <CommandPalette
        projects={c.projects.map(({ slug, title, category }) => ({ slug, title, category }))}
        publications={c.publications.map(({ id, title, url }) => ({ id, title, url }))}
        socials={c.profile.socials}
        email={c.profile.email}
      />
      <main>{children}</main>
      <Footer profile={c.profile} />
    </div>
  );
}
