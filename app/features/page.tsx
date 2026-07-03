"use client";

import { FeaturesSection } from "@/components/marketing/features-section";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export default function FeaturesPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#FFFCF2] text-slate-800">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-noise opacity-[0.08] mix-blend-multiply" />
      </div>

      <div className="relative z-10">
        <main>
          <FeaturesSection />
        </main>
        <MarketingFooter />
      </div>
    </div>
  );
}
