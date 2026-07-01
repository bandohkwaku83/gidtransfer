import type { Metadata } from "next";
import { APP_NAME } from "@/lib/branding";
import { buildMarketingPageMetadata } from "@/lib/marketing/site-seo";

export const metadata: Metadata = buildMarketingPageMetadata(
  "Terms of Service",
  `Terms of Service for ${APP_NAME} — photographer workspace, client galleries, proofing, and studio tools.`,
  "/terms",
);

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
