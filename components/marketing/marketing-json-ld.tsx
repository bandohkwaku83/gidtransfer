import {
  marketingOrganizationJsonLd,
  marketingSoftwareApplicationJsonLd,
  marketingWebsiteJsonLd,
} from "@/lib/marketing/site-seo";

function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Structured data for brand and site discovery in search engines. */
export function MarketingJsonLd() {
  return (
    <>
      <JsonLdScript data={marketingOrganizationJsonLd()} />
      <JsonLdScript data={marketingWebsiteJsonLd()} />
      <JsonLdScript data={marketingSoftwareApplicationJsonLd()} />
    </>
  );
}
