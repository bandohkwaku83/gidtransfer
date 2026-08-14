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
          "/admin/",
          "/api/",
          "/billing/",
          "/onboarding/",
          "/verify-email/",
          "/reset-password/",
          "/g/",
          "/share/",
          "/studio",
        ],
      },
    ],
    sitemap,
    host: absoluteMarketingUrl("/").replace(/\/$/, ""),
  };
}
