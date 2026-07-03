import type { Metadata } from "next";
import { buildMarketingPageMetadata } from "@/lib/marketing/site-seo";

export const metadata: Metadata = buildMarketingPageMetadata(
  "Features",
  "Gidtransfer features for photographers: branded client gallery links, proofing, gallery workspace, studio tools, and delivery — built to win clients and save hours.",
  "/features",
);

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
