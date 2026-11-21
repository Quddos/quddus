import { put } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { blobMode } from "@/lib/blob-config";

// CV uploads come from people who don't have an account yet, so this endpoint is
// public. It only accepts document types, caps the size, and rate-limits per IP.
const CV_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/rtf",
  "text/plain",
];
const MAX_BYTES = 8 * 1024 * 1024;
const SERVER_MAX = 4 * 1024 * 1024;

const hits = new Map<string, { n: number; until: number }>();

function rateLimited(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.until < now) {
    hits.set(ip, { n: 1, until: now + 60 * 60 * 1000 });
    if (hits.size > 5000) hits.clear();
    return false;
  }
  entry.n += 1;
  return entry.n > 12;
}

export async function GET() {
  return NextResponse.json({ mode: blobMode(), serverLimit: SERVER_MAX, maxBytes: MAX_BYTES });
}

export async function POST(request: Request) {
  if (rateLimited(request))
    return NextResponse.json({ error: "Too many uploads from this connection. Try again later." }, { status: 429 });

  const contentType = request.headers.get("content-type") ?? "";

  // Multipart: the file comes through this function (works with OIDC Blob).
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400 });
    if (file.size > SERVER_MAX)
      return NextResponse.json({ error: "Please keep the CV under 4 MB." }, { status: 413 });
    if (file.type && !CV_TYPES.includes(file.type))
      return NextResponse.json({ error: "Upload a PDF or Word document." }, { status: 415 });
    if (blobMode() === "none")
      return NextResponse.json({ error: "File storage isn't configured on this deployment." }, { status: 503 });
    try {
      const blob = await put(`career/cv/${file.name}`, file, {
        access: "public",
        addRandomSuffix: true,
        contentType: file.type || "application/octet-stream",
      });
      return NextResponse.json({ url: blob.url, name: file.name });
    } catch (e) {
      console.error("CV upload failed", e);
      return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
    }
  }

  // JSON: hands the browser a short-lived token so large files go straight to Blob.
  const body = (await request.json().catch(() => null)) as HandleUploadBody | null;
  if (!body) return NextResponse.json({ error: "Bad request." }, { status: 400 });
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: CV_TYPES,
        maximumSizeInBytes: MAX_BYTES,
        addRandomSuffix: true,
      }),
    });
    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
