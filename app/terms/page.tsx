"use client";

import { LegalDocumentSection } from "@/components/marketing/legal-document-section";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { termsOfService } from "@/lib/marketing/legal";

export default function TermsPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#f5f6f7] text-slate-800">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-noise opacity-[0.08] mix-blend-multiply" />
      </div>

      <div className="relative z-10">
        <MarketingHeader />

        <main>
          <LegalDocumentSection
            document={termsOfService}
            alternate={{ label: "Privacy Policy", href: "/privacy" }}
          />
        </main>

        <MarketingFooter />
      </div>
    </div>
  );
}
