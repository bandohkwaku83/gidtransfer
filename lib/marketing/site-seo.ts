import type { Metadata } from "next";
import {
  APP_NAME,
  FOOTER_DESCRIPTION,
  MARKETING_SITE_ORIGIN,
  PRODUCT_TAGLINE,
} from "@/lib/branding";
import { contactEmail, faqs } from "@/lib/marketing/faqs";

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
  if (trimmed) {
    try {
      const u = new URL(trimmed);
      if (u.hostname !== "localhost" && u.hostname !== "127.0.0.1") {
        return `${u.protocol}//${u.host}`;
      }
    } catch {
      /* fall through */
    }
  }
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

/** Exact-brand spellings Google should associate with this product (not GetTransfer rides). */
const BRAND_KEYWORDS = [
  APP_NAME,
  "gidtransfer",
  "Gid Transfer",
  "gidtransfer.com",
  "gidtransfer photography",
  "gidtransfer gallery",
  "gidtransfer photographer",
  "photographer gallery software",
  "client proofing gallery",
  "photo delivery platform",
  "online photography gallery",
  "photography studio software",
  "client gallery for photographers",
] as const;

const OG_IMAGE = {
  url: absoluteMarketingUrl("/images/hero.png"),
  width: 1536,
  height: 1024,
  alt: `${APP_NAME} — photographer workspace and client galleries`,
} as const;

function sharedOpenGraph(title: string, description: string, path = "/") {
  const url = absoluteMarketingUrl(path);
  return {
    title,
    description,
    url,
    siteName: APP_NAME,
    type: "website" as const,
    locale: "en_US",
    images: [OG_IMAGE],
  };
}

function sharedTwitter(title: string, description: string) {
  return {
    card: "summary_large_image" as const,
    title,
    description,
    images: [OG_IMAGE.url],
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
        "max-video-preview": -1,
      },
    },
    openGraph: sharedOpenGraph(title, description),
    twitter: sharedTwitter(title, description),
    icons: {
      icon: "/svgs/dashboard_logo.svg",
      apple: "/apple-icon.png",
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
  // Lead with the exact brand name so navigational queries for "gidtransfer" match.
  const title = `${APP_NAME} | Photographer galleries & studio software`;
  const description =
    "Gidtransfer (gidtransfer.com) is the online gallery and studio platform for professional photographers — branded client galleries, proofing, delivery, bookings, and studio tools in one place.";
  const canonical = absoluteMarketingUrl("/");

  return {
    title: { absolute: title },
    description,
    keywords: [...BRAND_KEYWORDS],
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
    "@id": `${url}#organization`,
    name: APP_NAME,
    legalName: APP_NAME,
    alternateName: [
      "gidtransfer",
      "Gid Transfer",
      "Gidtransfer.com",
      "gidtransfer.com",
    ],
    url,
    logo: {
      "@type": "ImageObject",
      url: absoluteMarketingUrl("/svgs/dashboard_logo.svg"),
    },
    image: absoluteMarketingUrl("/images/hero.png"),
    email: contactEmail,
    description: FOOTER_DESCRIPTION,
    foundingDate: "2024",
    knowsAbout: [
      "photography client galleries",
      "online proofing",
      "photo delivery",
      "studio management software",
    ],
    sameAs: [] as string[],
  };
}

export function marketingWebsiteJsonLd() {
  const url = absoluteMarketingUrl("/");
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${url}#website`,
    name: APP_NAME,
    alternateName: ["gidtransfer", "Gid Transfer", "gidtransfer.com"],
    url,
    description: FOOTER_DESCRIPTION,
    inLanguage: "en",
    publisher: {
      "@id": `${url}#organization`,
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
    alternateName: ["gidtransfer", "Gid Transfer"],
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Photography studio software",
    operatingSystem: "Web",
    url,
    description: FOOTER_DESCRIPTION,
    featureList: [
      "Branded client photo galleries",
      "Online proofing and selections",
      "Photo and video delivery",
      "Bookings and studio tools",
    ],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GHS",
      description: "30-day free trial, then paid plans",
      url: absoluteMarketingUrl("/pricing"),
    },
    publisher: {
      "@id": `${url}#organization`,
    },
  };
}

export function marketingFaqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
