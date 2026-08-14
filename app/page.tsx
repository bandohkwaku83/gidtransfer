import type { Metadata } from "next";
import { MarketingJsonLd } from "@/components/marketing/marketing-json-ld";
import { HomePageClient } from "@/components/marketing/home-page";
import { APP_NAME } from "@/lib/branding";
import { buildHomePageMetadata } from "@/lib/marketing/site-seo";

export const metadata: Metadata = buildHomePageMetadata();

export default function HomePage() {
  return (
    <>
      <MarketingJsonLd />
      {/* Server-rendered brand copy for crawlers; visually hidden from the UI. */}
      <section className="sr-only">
        <p>
          <strong>{APP_NAME}</strong> (gidtransfer.com) is an online gallery and studio platform for
          professional photographers. Create branded client galleries, run proofing, deliver finals,
          and manage bookings from one workspace. Gidtransfer is photography software — not a ride
          or car transfer service.
        </p>
      </section>
      <HomePageClient />
    </>
  );
}
