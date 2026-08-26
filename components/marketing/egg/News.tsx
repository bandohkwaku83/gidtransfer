"use client";

import { ShowcaseCarousel } from "@/components/marketing/showcase-carousel";
import { showcaseItems } from "@/lib/marketing/showcase-items";
import { SectionHeading } from "./SectionHeading";

export function News() {
  return (
    <section
      id="galleries"
      className="overflow-hidden py-20 md:py-28"
      style={{ backgroundColor: "#FAF5F6" }}
    >
      <div className="container-x mb-10 md:mb-12">
        <SectionHeading
          tone="light"
          label="Example galleries"
          title="See how delivery looks for your clients"
          body="Browse sample gallery presentations—covers, pacing, and the quiet polish that makes a session feel considered from the first scroll."
        />
      </div>

      <div className="px-4 sm:px-6">
        <ShowcaseCarousel items={showcaseItems} />
      </div>
    </section>
  );
}
