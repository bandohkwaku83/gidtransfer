import type { Metadata } from "next";
import { buildMarketingPageMetadata } from "@/lib/marketing/site-seo";

export const metadata: Metadata = buildMarketingPageMetadata(
  "Features",
  "Gidtransfer features: client galleries, proofing, CRM, branding, delivery, and a commission-free print store for professional photographers.",
  "/features",
);

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
