import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Only allow presigned PUT targets on AWS S3 (not an open relay). */
function isAllowedPresignedS3Url(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return false;
    return (
      u.hostname.endsWith(".amazonaws.com") ||
      u.hostname === "s3.amazonaws.com"
    );
  } catch {
    return false;
  }
}

function parseS3Headers(raw: string | null): Record<string, string> {
  if (!raw?.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>)
        .filter(([, v]) => v != null && String(v).trim())
        .map(([k, v]) => [k, String(v)]),
    );
  } catch {
    return {};
  }
}

/**
 * Same-origin relay for presigned S3 PUTs during local dev when bucket CORS
 * is not configured. Prefer `NEXT_PUBLIC_S3_DIRECT_UPLOAD=true` + apply
 * `scripts/s3-cors.json` so the browser PUTs straight to S3.
 *
 * Apply CORS (example):
 *   aws s3api put-bucket-cors --bucket YOUR_BUCKET --cors-configuration file://scripts/s3-cors.json
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { message: "S3 upload proxy is disabled in production." },
      { status: 403 },
    );
  }

  const presignedUrl = request.headers.get("x-presigned-url")?.trim();
  if (!presignedUrl || !isAllowedPresignedS3Url(presignedUrl)) {
    return NextResponse.json({ message: "Invalid presigned S3 URL." }, { status: 400 });
  }

  const headers = parseS3Headers(request.headers.get("x-s3-headers"));
  const body = await request.arrayBuffer();
  if (body.byteLength <= 0) {
    return NextResponse.json({ message: "Empty upload body." }, { status: 400 });
  }

  const contentType =
    headers["Content-Type"] ??
    headers["content-type"] ??
    request.headers.get("content-type") ??
    "application/octet-stream";
  const putHeaders: Record<string, string> = {
    ...headers,
    "Content-Type": contentType,
    "Content-Length": String(body.byteLength),
  };

  let upstream: Response;
  try {
    upstream = await fetch(presignedUrl, {
      method: "PUT",
      headers: putHeaders,
      body,
    });
  } catch {
    return NextResponse.json(
      { message: "Could not reach S3 from the dev server." },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    const detail = (await upstream.text()).slice(0, 500);
    return NextResponse.json(
      {
        message: `S3 rejected upload (${upstream.status}).`,
        detail: detail || undefined,
      },
      { status: upstream.status },
    );
  }

  return NextResponse.json({ ok: true });
}
