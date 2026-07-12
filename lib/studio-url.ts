/** Slugs blocked on the client; backend rejects these too. */
export const RESERVED_STUDIO_SLUGS = new Set([
  "www",
  "api",
  "app",
  "admin",
  "client",
  "dashboard",
  "login",
  "verify-email",
  "onboarding",
  "reset-password",
  "share",
  "g",
  "uploads",
  "studio",
  "static",
  "assets",
  "mail",
  "ftp",
  "cdn",
  "status",
  "help",
  "support",
  "billing",
  "account",
  "settings",
]);

export function slugifyCompanyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/** Client gallery path segment from event name (e.g. `sarah-james-wedding`). */
export function slugifyGallerySlug(eventName: string): string {
  return slugifyCompanyName(eventName);
}

/** Best-effort label from a gallery slug (e.g. `sarah-james` → `Sarah James`). */
export function gallerySlugToEventName(slug: string): string {
  const s = normalizeStudioSlugInput(slug);
  if (!s) return "";
  return s
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** `https://{studio}/client/` prefix for gallery address fields. */
export function buildGalleryClientPathPrefix(
  companySlug: string,
  options?: StudioHostOptions,
): string {
  const company = normalizeStudioSlugInput(companySlug);
  const suffix = options?.studioUrlSuffix?.trim() || defaultStudioUrlSuffix();
  const suffixDisplay = suffix.startsWith(".") ? suffix : `.${suffix}`;
  const protocol = preferredProtocol();

  if (!company) {
    return `${protocol}://your-studio${suffixDisplay}/client/`;
  }

  const origin = resolveStudioOrigin(company, options);
  if (!origin) {
    return `${protocol}://${company}${suffixDisplay}/client/`;
  }

  return `${origin}/client/`;
}

/** Public client gallery URL on the studio tenant host: `{origin}/client/{gallerySlug}`. */
export function buildGalleryClientUrl(
  companySlug: string,
  gallerySlug: string,
  options?: StudioHostOptions,
): string {
  const company = normalizeStudioSlugInput(companySlug);
  const gallery = normalizeStudioSlugInput(gallerySlug);
  if (!company || !gallery) return "";
  const origin = resolveStudioOrigin(company, options);
  if (!origin) return "";
  return `${origin}/client/${gallery}`;
}

export function normalizeStudioSlugInput(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function isReservedStudioSlug(slug: string): boolean {
  const s = slug.trim().toLowerCase();
  return !s || RESERVED_STUDIO_SLUGS.has(s);
}

export function isValidStudioSlug(slug: string): boolean {
  const s = slug.trim().toLowerCase();
  if (!s || s.length < 2) return false;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) return false;
  return !isReservedStudioSlug(s);
}

/** Tenant slug from `bizzles.localhost:3000` or `bizzles.example.com`. */
export function isLocalDevHostname(host: string): boolean {
  const h = (host.split(":")[0] ?? "").trim().toLowerCase();
  if (!h) return false;
  return (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h.endsWith(".local") ||
    h === "::1" ||
    h.startsWith("127.") ||
    h.startsWith("192.168.") ||
    h.startsWith("10.")
  );
}

/**
 * Tenant slug from `bizzles.localhost:3000` or `bizzles.example.com`.
 * Reserved slugs (e.g. `admin`, `api`, `www`) are not studio tenants — `admin.*` is a separate app.
 */
export function parseTenantFromHostname(host: string): string | null {
  const hostname = (host.split(":")[0] ?? "").trim().toLowerCase();
  if (!hostname) return null;

  const subdomainTenant = (sub: string): string | null => {
    if (!sub || sub.includes(".") || isReservedStudioSlug(sub)) return null;
    return sub;
  };

  if (hostname.endsWith(".localhost")) {
    const sub = hostname.slice(0, -".localhost".length);
    return subdomainTenant(sub);
  }

  const baseDomain = (
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_STUDIO_BASE_DOMAIN
      : undefined
  )
    ?.trim()
    .toLowerCase();
  if (baseDomain && hostname.endsWith(`.${baseDomain}`)) {
    const sub = hostname.slice(0, -(baseDomain.length + 1));
    return subdomainTenant(sub);
  }

  return null;
}

export function studioUrlSuffixFromHost(host: string): string {
  const hostname = (host.split(":")[0] ?? "").trim().toLowerCase();
  const port = host.includes(":") ? host.split(":")[1] : "";
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return `.localhost${port ? `:${port}` : ""}`;
  }
  const baseDomain = process.env.NEXT_PUBLIC_STUDIO_BASE_DOMAIN?.trim();
  if (baseDomain) return `.${baseDomain.replace(/^\./, "")}`;
  return process.env.NEXT_PUBLIC_STUDIO_URL_SUFFIX?.trim() || ".localhost:3000";
}

export function defaultStudioUrlSuffix(): string {
  if (typeof window !== "undefined") {
    return studioUrlSuffixFromHost(window.location.host);
  }
  return process.env.NEXT_PUBLIC_STUDIO_URL_SUFFIX?.trim() || ".localhost:3000";
}

export function buildStudioUrlPreview(
  slug: string,
  suffix: string,
  protocol: "http" | "https" = "http",
): string {
  const clean = normalizeStudioSlugInput(slug);
  if (!clean) return "";
  const cleanSuffix = suffix.startsWith(".") ? suffix : `.${suffix}`;
  return `${protocol}://${clean}${cleanSuffix}`;
}

export function studioSlugValidationMessage(slug: string): string | null {
  const s = normalizeStudioSlugInput(slug);
  if (!s) return "Enter a studio URL.";
  if (s.length < 2) return "Studio URL must be at least 2 characters.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) {
    return "Use lowercase letters, numbers, and hyphens only.";
  }
  if (isReservedStudioSlug(s)) return "This studio URL is reserved.";
  return null;
}

/** Sign-in and setup — always on the main app host, never on a studio subdomain. */
export const PHOTOGRAPHER_AUTH_PATHS = [
  "/login",
  "/verify-email",
  "/onboarding",
  "/reset-password",
] as const;

export function isPhotographerAuthPath(pathname: string): boolean {
  return PHOTOGRAPHER_AUTH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/** Logged-in photographer app (dashboard and nested routes). */
export function isPhotographerDashboardPath(pathname: string): boolean {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

export type StudioHostOptions = {
  studioUrl?: string | null;
  studioUrlSuffix?: string | null;
};

/**
 * Main app origin without a studio tenant (e.g. `http://localhost:3000`).
 * Used for login before we know which studio the user belongs to.
 */
export function photographerApexOrigin(host?: string): string {
  const fullHost = (host ?? "").trim();
  const protocol =
    typeof window !== "undefined" ? window.location.protocol : "http:";

  let hostname = (fullHost.split(":")[0] ?? "").toLowerCase();
  const port = fullHost.includes(":")
    ? fullHost.split(":").slice(1).join(":")
    : typeof window !== "undefined"
      ? window.location.port
      : "";
  const portSuffix = port ? `:${port}` : "";

  const tenant = parseTenantFromHostname(fullHost);
  if (tenant) {
    if (hostname.endsWith(".localhost")) {
      hostname = "localhost";
    } else {
      const base = process.env.NEXT_PUBLIC_STUDIO_BASE_DOMAIN?.trim().toLowerCase();
      if (base && hostname.endsWith(`.${base}`)) {
        const apexHost =
          process.env.NEXT_PUBLIC_PHOTOGRAPHER_APP_HOST?.trim() ||
          process.env.NEXT_PUBLIC_SITE_HOST?.trim() ||
          base;
        hostname = apexHost.toLowerCase();
      }
    }
  }

  if (!hostname && typeof window !== "undefined") {
    hostname = window.location.hostname.toLowerCase();
  }
  if (!hostname) hostname = "localhost";

  return `${protocol}//${hostname}${portSuffix}`;
}

/** Absolute URL for login / onboarding / reset on the apex host. */
export function photographerAuthUrl(pathname: string, host?: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const baseHost =
    host ?? (typeof window !== "undefined" ? window.location.host : "");
  return `${photographerApexOrigin(baseHost)}${path}`;
}

/**
 * Login URL after sign-out or session clear.
 * Ensures apex `localStorage` is wiped even when the user signed out from a studio subdomain.
 */
export function photographerSignOutUrl(host?: string): string {
  const url = new URL(photographerAuthUrl("/login", host));
  url.searchParams.set("signedOut", "1");
  return url.toString();
}

function preferredProtocol(): "http" | "https" {
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    return "https";
  }
  return "http";
}

/** Origin for a studio tenant host, e.g. `http://bigstudio.localhost:3000`. */
export function resolveStudioOrigin(
  slug: string,
  options?: StudioHostOptions,
): string {
  const clean = normalizeStudioSlugInput(slug);
  if (!clean || !isValidStudioSlug(clean)) return "";

  const apiUrl = options?.studioUrl?.trim();
  if (apiUrl) {
    try {
      const href = apiUrl.includes("://") ? apiUrl : `${preferredProtocol()}://${apiUrl}`;
      return new URL(href).origin;
    } catch {
      /* use slug + suffix */
    }
  }

  const suffix = options?.studioUrlSuffix?.trim() || defaultStudioUrlSuffix();
  return buildStudioUrlPreview(clean, suffix, preferredProtocol()).replace(/\/$/, "");
}

/** Full app URL on the tenant host (required for cross-subdomain navigation). */
export function tenantAppUrl(
  slug: string,
  pathname: string,
  options?: StudioHostOptions,
): string {
  const origin = resolveStudioOrigin(slug, options);
  if (!origin) return pathname;
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${origin}${path}`;
}

/**
 * After sign-in, move the dashboard onto `{slug}.localhost:3000` when needed.
 * Never used for `/login` or other auth paths — those stay on the apex host.
 */
/** Query param used once when moving session from apex host to `{slug}.localhost`. */
export const AUTH_HANDOFF_PARAM = "_auth";

/** Production tenant subdomains need wildcard DNS; local `.localhost` always routes. */
function tenantSubdomainRoutingEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_STUDIO_SUBDOMAINS?.trim().toLowerCase();
  if (flag === "1" || flag === "true" || flag === "yes") return true;
  if (flag === "0" || flag === "false" || flag === "no") return false;
  if (typeof window !== "undefined" && isLocalDevHostname(window.location.host)) {
    return true;
  }
  return false;
}

export function redirectToTenantHostIfNeeded(
  slug: string,
  pathname: string,
  options?: StudioHostOptions,
  authHandoff?: string | null,
  clearSourceAuth?: () => void,
): boolean {
  if (typeof window === "undefined") return false;
  if (!tenantSubdomainRoutingEnabled()) return false;
  if (!isPhotographerDashboardPath(pathname)) return false;

  const clean = normalizeStudioSlugInput(slug);
  if (!clean || !isValidStudioSlug(clean)) return false;

  const currentTenant = parseTenantFromHostname(window.location.host);
  if (currentTenant === clean) return false;

  let target = tenantAppUrl(clean, pathname, options);
  if (!target.startsWith("http")) return false;

  if (authHandoff?.trim()) {
    const url = new URL(target);
    url.searchParams.set(AUTH_HANDOFF_PARAM, authHandoff.trim());
    target = url.toString();
    clearSourceAuth?.();
  }

  window.location.replace(target);
  return true;
}

/** If auth UI was opened on a studio subdomain, send it to the apex app. */
export function redirectToApexAuthIfNeeded(pathname: string): boolean {
  if (typeof window === "undefined") return false;
  if (!isPhotographerAuthPath(pathname)) return false;

  const tenant = parseTenantFromHostname(window.location.host);
  if (!tenant) return false;

  const target = photographerAuthUrl(pathname);
  if (window.location.href === target) return false;

  window.location.replace(target);
  return true;
}
