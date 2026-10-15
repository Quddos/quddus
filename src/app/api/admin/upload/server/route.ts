import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { SERVER_UPLOAD_LIMIT } from "@/lib/blob-config";

// Server-side upload for deployments where Blob is connected through OIDC.
export async function POST(request: Request) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400 });
  if (file.size > SERVER_UPLOAD_LIMIT)
    return NextResponse.json({ error: "Files over 4 MB need BLOB_READ_WRITE_TOKEN set on the project." }, { status: 413 });
  try {
    const blob = await put(`portfolio/${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type || undefined,
    });
    return NextResponse.json({ url: blob.url });
  } catch (e) {
    console.error("Blob upload failed", e);
    return NextResponse.json({ error: `Upload failed: ${(e as Error).message}` }, { status: 500 });
  }
}
