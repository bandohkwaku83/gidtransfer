/** Product identity — workspace + client galleries SaaS. */
export const APP_NAME = "Gidtransfer";

/** Public marketing site origin (homepage, pricing, etc.). */
export const MARKETING_SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") || "http://localhost:3000";
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
