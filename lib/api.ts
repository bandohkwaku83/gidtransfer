export const API_BASE_URL =
  process.env.API_PUBLIC_URL?.replace(/\/$/, "") ??
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "";

function uploadsProxyHostSet(): Set<string> {
  const set = new Set<string>(["api.gidophotography.com"]);
  const extra = process.env.NEXT_PUBLIC_UPLOADS_PROXY_HOSTS;
  if (extra) {
    for (const h of extra.split(",")) {
      const t = h.trim().toLowerCase();
      if (t) set.add(t);
    }
  }
  // Local backend URLs from API_PUBLIC_URL resolveMediaUrl responses.
  set.add("127.0.0.1");
  set.add("localhost");
  return set;
}

/** Map private S3 object URLs to same-origin `/uploads/...` (backend streams from S3). */
function s3GalleryMediaToUploadsPath(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    if (!parsed.hostname.includes("amazonaws.com")) return null;
    const match = parsed.pathname.match(
      /^\/(gallery-photos|gallery-finals)\/([^/]+)\/([^/]+)$/,
    );
    if (!match) return null;
    return `/uploads/${match[1]}/${match[2]}/${match[3]}${parsed.search}`;
  } catch {
    return null;
  }
}

/**
 * If the URL points at an API host under `/uploads`, return same-origin `/uploads/...`
 * so Next.js can proxy to `BACKEND_API_URL` (see `app/uploads/[...path]/route.ts`).
 * Leaves other absolute URLs unchanged.
 */
export function sameOriginUploadsUrl(url: string): string {
  const raw = url.trim();
  if (!raw) return raw;
  if (raw.startsWith("/uploads/")) return raw;
  if (raw === "/uploads") return raw;

  const fromS3 = s3GalleryMediaToUploadsPath(raw);
  if (fromS3) return fromS3;

  const noProto = raw.replace(/^\.?\/*/, "");
  if (/^uploads\//i.test(noProto) && !raw.includes("://")) {
    return `/${noProto}`;
  }
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return raw;
  }
  const host = parsed.hostname.toLowerCase();
  if (uploadsProxyHostSet().has(host) && parsed.pathname.startsWith("/uploads")) {
    // Gallery covers are frequently served only by the backend host.
    // Rewriting them to same-origin `/uploads/*` can yield 404s in production.
    if (parsed.pathname.startsWith("/uploads/gallery-covers/")) return raw;
    return `${parsed.pathname}${parsed.search}`;
  }
  return raw;
}

/**
 * Grid thumbnail URL from API (`thumbUrl` / `gridUrl`).
 * Absolute CDN/S3 URLs are used as-is; only API-host `/uploads` paths are rewritten for the proxy.
 */
export function resolveGridThumbUrl(url?: string | null): string | undefined {
  if (!url?.trim()) return undefined;
  const raw = url.trim();
  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      const host = parsed.hostname.toLowerCase();
      if (uploadsProxyHostSet().has(host) && parsed.pathname.startsWith("/uploads")) {
        if (parsed.pathname.startsWith("/uploads/gallery-covers/")) return raw;
        return `${parsed.pathname}${parsed.search}`;
      }
    } catch {
      /* keep absolute URL */
    }
    return raw;
  }
  const normalized = sameOriginUploadsUrl(raw);
  return normalized || undefined;
}

/**
 * Absolute URL for `og:image` on this site. Link-preview crawlers (WhatsApp, etc.) should
 * fetch the **app origin** (`/uploads/...` via Next proxy), not the API host, which often
 * blocks or fails for external user-agents.
 */
export function shareCoverOpenGraphAbsoluteUrl(
  coverUrl: string | undefined,
  siteOrigin: string,
): string | undefined {
  if (!coverUrl?.trim()) return undefined;
  const base = siteOrigin.replace(/\/$/, "");
  let coerced = sameOriginUploadsUrl(coverUrl.trim());
  if (/^https?:\/\//i.test(coerced)) {
    coerced = sameOriginUploadsUrl(coerced);
  }
  if (coerced.startsWith("/")) return `${base}${coerced}`;
  if (/^https?:\/\//i.test(coerced)) return coerced;
  return `${base}/${coerced}`;
}

/**
 * Build API URLs for fetch(). Default empty base = same-origin `/api/...` so Next.js
 * rewrites proxy to BACKEND_API_URL (see next.config.ts) — avoids browser CORS when
 * developing on localhost. Set NEXT_PUBLIC_API_URL only if you intentionally call the
 * API host directly (requires API CORS).
 */
export function apiUrl(path: string) {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${suffix}`;
}
