import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function getBackendApiUrl(): string {
  return (
    process.env.BACKEND_API_URL?.trim() ||
    "https://api.gidophotography.com"
  ).replace(/\/$/, "");
}

/** Forward `/api/*` from the Next app to the Node API (`BACKEND_API_URL`). */
export async function proxyApiToBackend(
  request: NextRequest,
  pathSegments: string[],
): Promise<NextResponse> {
  const backend = getBackendApiUrl();
  const subpath = pathSegments.map(encodeURIComponent).join("/");
  const target = `${backend}/api/${subpath}${request.nextUrl.search}`;

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
