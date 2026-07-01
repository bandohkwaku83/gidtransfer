import type { Metadata } from "next";
import { buildMarketingPageMetadata } from "@/lib/marketing/site-seo";

export const metadata: Metadata = buildMarketingPageMetadata(
  "Contact",
  "Contact Gidtransfer — questions about client galleries, proofing, pricing, and getting started.",
  "/contact",
);

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
