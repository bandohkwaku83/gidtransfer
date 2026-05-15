import { NextRequest, NextResponse } from "next/server";

function backendBase(): string {
  return (
    process.env.BACKEND_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "https://api.gidophotography.com"
  ).replace(/\/$/, "");
}

/** Long cache for fingerprinted static media (override per file via upstream headers). */
const DEFAULT_CACHE_CONTROL = "public, max-age=31536000, immutable";

/** Headers worth forwarding from upstream so caching, conditional GETs, and range scrubbing work. */
const FORWARD_RESPONSE_HEADERS = [
  "content-type",
  "content-length",
  "content-range",
  "accept-ranges",
  "etag",
  "last-modified",
] as const;

/** Headers worth forwarding from the inbound browser request (conditional GETs, range scrubbing). */
const FORWARD_REQUEST_HEADERS = [
  "range",
  "if-none-match",
  "if-modified-since",
  "accept",
  "accept-encoding",
] as const;

function pickRequestHeaders(req: NextRequest): HeadersInit {
  const out = new Headers();
  for (const h of FORWARD_REQUEST_HEADERS) {
    const v = req.headers.get(h);
    if (v) out.set(h, v);
  }
  return out;
}

/**
 * Same-origin proxy for `/uploads/*` static files. Streams the upstream body so a 50 MB raw
 * does not get buffered in serverless memory, and adds a long `Cache-Control` so the CDN /
 * browser can hold onto fingerprinted media.
 */
async function forward(
  request: NextRequest,
  segments: string[],
  method: "GET" | "HEAD",
): Promise<NextResponse> {
  if (segments.length === 0) {
    return NextResponse.json({ message: "Missing uploads path." }, { status: 404 });
  }

  const joined = segments.map((s) => encodeURIComponent(s)).join("/");
  const target = `${backendBase()}/uploads/${joined}${request.nextUrl.search}`;

  let res: Response;
  try {
    res = await fetch(target, {
      method,
      headers: pickRequestHeaders(request),
    });
  } catch {
    return NextResponse.json(
      { message: "Could not reach the storage service. Is the API running?" },
      { status: 502 },
    );
  }

  const outHeaders = new Headers();
  for (const h of FORWARD_RESPONSE_HEADERS) {
    const v = res.headers.get(h);
    if (v) outHeaders.set(h, v);
  }
  const upstreamCacheControl = res.headers.get("cache-control");
  outHeaders.set("cache-control", upstreamCacheControl ?? DEFAULT_CACHE_CONTROL);

  return new NextResponse(res.body, {
    status: res.status,
    headers: outHeaders,
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return forward(request, path ?? [], "GET");
}

export async function HEAD(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return forward(request, path ?? [], "HEAD");
}
