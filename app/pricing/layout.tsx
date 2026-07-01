import type { Metadata } from "next";
import { buildMarketingPageMetadata } from "@/lib/marketing/site-seo";

export const metadata: Metadata = buildMarketingPageMetadata(
  "Pricing",
  "Gidtransfer pricing for photographers. Start free, upgrade when your studio grows. No per-gallery fees, no commission on print sales.",
  "/pricing",
);

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
