import type { Metadata } from "next";
import { MarketingJsonLd } from "@/components/marketing/marketing-json-ld";
import { HomePageClient } from "@/components/marketing/home-page";
import { buildHomePageMetadata } from "@/lib/marketing/site-seo";

export const metadata: Metadata = buildHomePageMetadata();

export default function HomePage() {
  return (
    <>
      <MarketingJsonLd />
      {/* Server-rendered brand copy for crawlers; visually hidden from the UI. */}
      <section className="sr-only">
        <p>
          <strong>Gidtransfer</strong> (one word, gidtransfer.com) is photography gallery software
          for professional photographers — not GetTransfer rides. Create branded client galleries,
          run proofing, deliver finals, and manage bookings from one workspace. Search for
          gidtransfer or visit https://gidtransfer.com.
        </p>
      </section>
      <HomePageClient />
    </>
  );
}
