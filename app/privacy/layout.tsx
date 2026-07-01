import type { Metadata } from "next";
import { APP_NAME } from "@/lib/branding";
import { buildMarketingPageMetadata } from "@/lib/marketing/site-seo";

export const metadata: Metadata = buildMarketingPageMetadata(
  "Privacy Policy",
  `Privacy Policy for ${APP_NAME} — how we collect, use, and protect personal information for photographers and their clients.`,
  "/privacy",
);

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
