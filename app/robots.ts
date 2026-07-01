import type { MetadataRoute } from "next";
import { absoluteMarketingUrl } from "@/lib/marketing/site-seo";

export default function robots(): MetadataRoute.Robots {
  const sitemap = absoluteMarketingUrl("/sitemap.xml");

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/features", "/pricing", "/contact", "/terms", "/privacy", "/login"],
        disallow: [
          "/dashboard/",
          "/api/",
          "/billing/",
          "/onboarding/",
          "/verify-email/",
          "/reset-password/",
          "/g/",
          "/share/",
        ],
      },
    ],
    sitemap,
    host: absoluteMarketingUrl("/").replace(/\/$/, ""),
  };
}
