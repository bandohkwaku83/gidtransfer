import { isPlatformAdminPath } from "@/lib/studio-url";

const PUBLIC_GALLERY_RESERVED_SEGMENTS = new Set([
  "dashboard",
  "admin",
  "login",
  "verify-email",
  "onboarding",
  "reset-password",
  "share",
  "g",
  "api",
  "uploads",
  "studio",
  "client",
  "features",
  "pricing",
  "contact",
  "privacy",
  "terms",
  "collaborations",
  "billing",
]);

/** `/studio-slug/gallery-slug` client share URLs (not reserved app segments). */
export function isPublicGallerySlugPath(pathname: string): boolean {
  const m = pathname.match(/^\/([^/]+)\/([^/]+)$/);
  if (!m?.[1] || !m[2]) return false;
  return !PUBLIC_GALLERY_RESERVED_SEGMENTS.has(m[1].toLowerCase());
}

/**
 * Marketing / legal / client-facing paths that must stay freely browsable
 * even when a pending (unverified) photographer JWT is in storage.
 */
export function allowsUnverifiedAuthSession(pathname: string): boolean {
  if (
    pathname === "/" ||
    pathname === "/pricing" ||
    pathname === "/features" ||
    pathname === "/contact" ||
    pathname === "/privacy" ||
    pathname === "/terms" ||
    pathname === "/studio" ||
    pathname.startsWith("/share/") ||
    pathname.startsWith("/g/") ||
    pathname.startsWith("/client/") ||
    isPublicGallerySlugPath(pathname)
  ) {
    return true;
  }
  return false;
}

/**
 * Paths that skip the full-app splash and may render immediately.
 * Includes auth screens and public marketing — not the same as
 * {@link allowsUnverifiedAuthSession} (onboarding still forces verify).
 */
export function isPublicBootstrapPath(pathname: string): boolean {
  return (
    allowsUnverifiedAuthSession(pathname) ||
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/verify-email" ||
    pathname.startsWith("/verify-email/") ||
    pathname === "/onboarding" ||
    pathname.startsWith("/onboarding/") ||
    pathname === "/reset-password" ||
    pathname.startsWith("/reset-password/") ||
    pathname === "/billing/callback" ||
    pathname.startsWith("/billing/callback/") ||
    isPlatformAdminPath(pathname)
  );
}

/**
 * App routes where an unverified email/password session must be sent to OTP.
 * Public site + login + admin are excluded so a leftover signup token cannot
 * trap someone on the marketing site.
 */
export function pathRequiresEmailVerification(pathname: string): boolean {
  if (pathname.startsWith("/login")) return false;
  if (isPlatformAdminPath(pathname)) return false;
  if (allowsUnverifiedAuthSession(pathname)) return false;
  return true;
}
