import type { Metadata } from "next";
import {
  APP_NAME,
  FOOTER_DESCRIPTION,
  MARKETING_SITE_ORIGIN,
  PRODUCT_TAGLINE,
} from "@/lib/branding";
import { contactEmail } from "@/lib/marketing/faqs";

/** Public marketing routes that search engines should index. */
export const INDEXABLE_MARKETING_PATHS = [
  "/",
  "/features",
  "/pricing",
  "/contact",
  "/terms",
  "/privacy",
] as const;

const DEFAULT_PRODUCTION_HOST = "gidtransfer.com";

export function marketingSiteOrigin(): string {
  const trimmed = MARKETING_SITE_ORIGIN.trim().replace(/\/$/, "");
  if (trimmed) return trimmed;
  return `https://${DEFAULT_PRODUCTION_HOST}`;
}

export function marketingSiteHost(): string {
  try {
    return new URL(marketingSiteOrigin()).hostname;
  } catch {
    return DEFAULT_PRODUCTION_HOST;
  }
}

export function absoluteMarketingUrl(path: string): string {
  const origin = marketingSiteOrigin();
  if (path === "/" || path === "") return `${origin}/`;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

const BRAND_KEYWORDS = [
  APP_NAME,
  "gid transfer",
  "photographer gallery",
  "client proofing",
  "photo delivery",
  "online gallery",
  "photography studio software",
] as const;

function sharedOpenGraph(title: string, description: string, path = "/") {
  const url = absoluteMarketingUrl(path);
  return {
    title,
    description,
    url,
    siteName: APP_NAME,
    type: "website" as const,
    locale: "en_US",
    images: [
      {
        url: "/images/icon.png",
        width: 512,
        height: 512,
        alt: `${APP_NAME} logo`,
      },
      {
        url: "/images/hero.png",
        width: 1536,
        height: 1024,
        alt: `${APP_NAME} — photographer workspace and client galleries`,
      },
    ],
  };
}

function sharedTwitter(title: string, description: string) {
  return {
    card: "summary_large_image" as const,
    title,
    description,
    images: ["/images/hero.png"],
  };
}

/** Root metadata shared by every public marketing page. */
export function buildRootSiteMetadata(): Metadata {
  const title = `${APP_NAME} — ${PRODUCT_TAGLINE}`;
  const description = FOOTER_DESCRIPTION;
  const canonical = absoluteMarketingUrl("/");
  const googleVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();

  return {
    metadataBase: new URL(`${marketingSiteOrigin()}/`),
    title: {
      default: title,
      template: `%s | ${APP_NAME}`,
    },
    description,
    applicationName: APP_NAME,
    keywords: [...BRAND_KEYWORDS],
    authors: [{ name: APP_NAME, url: canonical }],
    creator: APP_NAME,
    publisher: APP_NAME,
    category: "photography",
    alternates: {
      canonical: "/",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: sharedOpenGraph(title, description),
    twitter: sharedTwitter(title, description),
    icons: {
      icon: "/svgs/dashboard_logo.svg",
      apple: "/svgs/dashboard_logo.svg",
    },
    ...(googleVerification
      ? {
          verification: {
            google: googleVerification,
          },
        }
      : {}),
  };
}

export function buildHomePageMetadata(): Metadata {
  const title = `${APP_NAME} — Photographer workspace & client galleries`;
  const description =
    "Gidtransfer is the online gallery and studio platform for professional photographers. Share branded client galleries, run proofing, deliver finals, and manage your studio in one place.";
  const canonical = absoluteMarketingUrl("/");

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: sharedOpenGraph(title, description, "/"),
    twitter: sharedTwitter(title, description),
  };
}

export function buildMarketingPageMetadata(
  pageTitle: string,
  description: string,
  path: string,
): Metadata {
  const title = pageTitle;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: sharedOpenGraph(`${title} | ${APP_NAME}`, description, path),
    twitter: sharedTwitter(`${title} | ${APP_NAME}`, description),
  };
}

export function marketingOrganizationJsonLd() {
  const url = absoluteMarketingUrl("/");
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: APP_NAME,
    alternateName: ["Gid Transfer", "gidtransfer"],
    url,
    logo: absoluteMarketingUrl("/images/icon.png"),
    email: contactEmail,
    description: FOOTER_DESCRIPTION,
    sameAs: [] as string[],
  };
}

export function marketingWebsiteJsonLd() {
  const url = absoluteMarketingUrl("/");
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: APP_NAME,
    alternateName: ["gidtransfer", "Gid Transfer"],
    url,
    description: FOOTER_DESCRIPTION,
    publisher: {
      "@type": "Organization",
      name: APP_NAME,
      url,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}features?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function marketingSoftwareApplicationJsonLd() {
  const url = absoluteMarketingUrl("/");
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: APP_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url,
    description: FOOTER_DESCRIPTION,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free plan available",
    },
    publisher: {
      "@type": "Organization",
      name: APP_NAME,
      url,
    },
  };
}
