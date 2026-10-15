import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SectionEditor } from "@/components/admin/SectionEditor";
import { SECTIONS } from "@/lib/admin-schema";
import { getAdmin } from "@/lib/auth";
import { readContent } from "@/lib/content";

async function Editor({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const schema = SECTIONS.find((s) => s.key === section);
  if (!schema) notFound();
  if (!(await getAdmin())) return null;
  const content = await readContent();
  return <SectionEditor key={schema.key} schema={schema} initial={content[schema.key]} />;
}

export default function SectionPage(props: PageProps<"/admin/[section]">) {
  return (
    <Suspense fallback={<div className="mono-label py-10">Loading…</div>}>
      <Editor params={props.params} />
    </Suspense>
  );
}
