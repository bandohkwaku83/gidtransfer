import type { Metadata } from "next";
import { MarketingJsonLd } from "@/components/marketing/marketing-json-ld";
import { HomePageClient } from "@/components/marketing/home-page";
import { buildHomePageMetadata } from "@/lib/marketing/site-seo";

export const metadata: Metadata = buildHomePageMetadata();

export default function HomePage() {
  return (
    <>
      <MarketingJsonLd />
      <HomePageClient />
    </>
  );
}
