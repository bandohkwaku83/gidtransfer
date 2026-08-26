"use client";

import { ContactSection } from "@/components/marketing/contact-section";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";

export default function ContactPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#f3f1f0] text-slate-800">
      <MarketingHeader />
      <main>
        <ContactSection />
      </main>
      <MarketingFooter />
    </div>
  );
}
