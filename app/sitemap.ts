import type { MetadataRoute } from "next";
import {
  INDEXABLE_MARKETING_PATHS,
  absoluteMarketingUrl,
} from "@/lib/marketing/site-seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return INDEXABLE_MARKETING_PATHS.map((path) => ({
    url: absoluteMarketingUrl(path),
    lastModified,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
