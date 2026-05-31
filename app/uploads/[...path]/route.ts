import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/backend-proxy";

export const dynamic = "force-dynamic";

/**
 * Streams `/uploads/*` from the Node API (`BACKEND_API_URL`) after `sameOriginUploadsUrl()`
 * maps API-hosted media to same-origin paths (see `lib/api.ts`). Required when
 * `NEXT_PUBLIC_API_URL` is unset so the browser avoids CORS.
 */
async function proxyUpload(
  request: NextRequest,
  pathSegments: string[],
): Promise<NextResponse> {
  const backend = getBackendApiUrl();
  const suffix = pathSegments.map(encodeURIComponent).join("/");
  const target = `${backend}/uploads/${suffix}${request.nextUrl.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "host" || lower === "connection") return;
    headers.set(key, value);
  });

  const method = request.method.toUpperCase();
  let body: ArrayBuffer | undefined;
  if (method !== "GET" && method !== "HEAD") {
    body = await request.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, { method, headers, body });
  } catch (err) {
    const hint =
      backend.includes("127.0.0.1") || backend.includes("localhost")
        ? " Is photo_global_backend running on port 7100?"
        : "";
    const message =
      err instanceof Error ? err.message : "Could not reach the API server.";
    return NextResponse.json(
      { message: `${message}${hint}` },
      { status: 502 },
    );
  }

  const outHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (key.toLowerCase() === "transfer-encoding") return;
    outHeaders.set(key, value);
  });

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: outHeaders,
  });
}

type RouteContext = { params: Promise<{ path?: string[] }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { path = [] } = await context.params;
  if (path.length === 0) {
    return NextResponse.json({ message: "Missing upload path." }, { status: 400 });
  }
  return proxyUpload(request, path);
}

export async function HEAD(request: NextRequest, context: RouteContext) {
  const { path = [] } = await context.params;
  if (path.length === 0) {
    return new NextResponse(null, { status: 400 });
  }
  return proxyUpload(request, path);
}
