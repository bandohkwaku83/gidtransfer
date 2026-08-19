import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
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
    sitemap: "https://gidtransfer.com/sitemap.xml",
    host: "https://gidtransfer.com",
  };
}
