import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureSchema, hasDatabase, sql } from "@/lib/db";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().max(200),
  intent: z.enum(["collaborate", "hire", "speak", "mentor", "api", "general"]).default("general"),
  body: z.string().trim().min(1).max(5000),
  website: z.string().optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please fill in every field with a valid email." }, { status: 400 });
  // Bots fill the hidden field; pretend success.
  if (parsed.data.website) return NextResponse.json({ ok: true });
  if (!hasDatabase()) return NextResponse.json({ error: "Messaging isn't configured yet. Please email me directly." }, { status: 503 });
  const { name, email, intent, body } = parsed.data;
  await ensureSchema();
  await sql()`INSERT INTO messages (name, email, intent, body) VALUES (${name}, ${email}, ${intent}, ${body})`;
  return NextResponse.json({ ok: true });
}
