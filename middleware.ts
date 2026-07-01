import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { marketingSiteHost } from "@/lib/marketing/site-seo";
import {
  isPhotographerAuthPath,
  parseTenantFromHostname,
  photographerAuthUrl,
} from "@/lib/studio-url";

function redirectWwwToApex(request: NextRequest, host: string): NextResponse | null {
  const canonicalHost = marketingSiteHost();
  if (!canonicalHost || canonicalHost === "localhost" || canonicalHost.includes(":")) {
    return null;
  }

  const wwwHost = `www.${canonicalHost}`;
  if (host !== wwwHost) return null;

  const url = request.nextUrl.clone();
  url.host = canonicalHost;
  url.protocol = request.nextUrl.protocol === "http:" ? "http:" : "https:";
  return NextResponse.redirect(url, 308);
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const wwwRedirect = redirectWwwToApex(request, host);
  if (wwwRedirect) return wwwRedirect;

  const tenant = parseTenantFromHostname(host);
  if (!tenant) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (isPhotographerAuthPath(pathname)) {
    const dest = new URL(photographerAuthUrl(pathname, host));
    dest.search = request.nextUrl.search;
    return NextResponse.redirect(dest);
  }

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images/") ||
    /\.[a-z0-9]+$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  const clientMatch = pathname.match(/^\/client\/([^/]+)\/?$/);
  if (clientMatch?.[1]) {
    const gallerySlug = decodeURIComponent(clientMatch[1]);
    const url = request.nextUrl.clone();
    url.pathname = `/${encodeURIComponent(tenant)}/${encodeURIComponent(gallerySlug)}`;
    const response = NextResponse.rewrite(url);
    response.headers.set("x-studio-tenant", tenant);
    return response;
  }

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/studio";
    const response = NextResponse.rewrite(url);
    response.headers.set("x-studio-tenant", tenant);
    return response;
  }

  const response = NextResponse.next();
  response.headers.set("x-studio-tenant", tenant);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
