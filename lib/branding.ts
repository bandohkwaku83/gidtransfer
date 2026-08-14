/** Product identity — workspace + client galleries SaaS. */
export const APP_NAME = "Gidtransfer";

const PRODUCTION_MARKETING_ORIGIN = "https://gidtransfer.com";

function normalizeOrigin(raw?: string | null): string | null {
  const trimmed = raw?.trim().replace(/\/$/, "");
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return null;
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

/**
 * Public marketing site origin (homepage, pricing, sitemap, JSON-LD).
 * Prefer a real public host — never ship localhost into production SEO tags.
 */
export const MARKETING_SITE_ORIGIN =
  normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL) ||
  normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL) ||
  (process.env.NODE_ENV === "production"
    ? PRODUCTION_MARKETING_ORIGIN
    : process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ||
      "http://localhost:3000");

export const PRODUCT_TAGLINE = "Photographer workspace & client galleries";
export const FOOTER_DESCRIPTION =
  "Gidtransfer is an online gallery and studio platform built for professional photographers. It combines beautiful client galleries and smart proofing workflows to create a seamless, premium client delivery experience.";
/** Default studio label when onboarding name is absent */
export const STUDIO_NAME = APP_NAME;

/** Studio burgundy — matches `--color-brand` in `globals.css`. For PDF `setTextColor` / `setDrawColor`. */
export const BRAND_RGB: [number, number, number] = [85, 0, 31];

/** Fallback when a photographer has not uploaded a studio logo. */
export const DEFAULT_STUDIO_LOGO_PATH = "/svgs/dashboard_logo.svg";

export function studioLogoSrc(logo?: string | null): string {
  const trimmed = logo?.trim();
  return trimmed || DEFAULT_STUDIO_LOGO_PATH;
}
