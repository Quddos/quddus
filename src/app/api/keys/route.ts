import { z } from "zod";
import { clientIp, createKey } from "@/lib/api-keys";
import { hasDatabase } from "@/lib/db";

const schema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.email().max(200),
  purpose: z.string().trim().max(500).default(""),
  agree: z.literal(true),
  website: z.string().optional(),
});

// Issues a free API key. The key is shown once; only its hash is stored.
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter your name, a valid email and accept the terms." }, { status: 400 });
  if (parsed.data.website) return Response.json({ error: "Rejected." }, { status: 400 });
  if (!hasDatabase()) return Response.json({ error: "Key signup isn't configured yet." }, { status: 503 });
  const result = await createKey({ ...parsed.data, ip: clientIp(req) });
  if ("error" in result) return Response.json({ error: result.error }, { status: 429 });
  return Response.json({ key: result.key });
}
