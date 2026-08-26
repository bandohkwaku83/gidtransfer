"use client";

import { Navbar } from "@/components/marketing/egg/Navbar";
import { Hero } from "@/components/marketing/egg/Hero";
import { Approach } from "@/components/marketing/egg/Approach";
import { CarouselSection } from "@/components/marketing/egg/CarouselSection";
import { Features } from "@/components/marketing/egg/Features";
import { About } from "@/components/marketing/egg/About";
import { LogoMarquee } from "@/components/marketing/egg/LogoMarquee";
import { HowItWorks } from "@/components/marketing/egg/HowItWorks";
import { Signals } from "@/components/marketing/egg/Signals";
import { News } from "@/components/marketing/egg/News";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

/** Homepage — same section order / motion as `egg` (Reforma-style). */
export function HomePageClient() {
  return (
    <div className="egg-home overflow-x-clip">
      <Navbar />
      <main>
        <Hero />
        <Approach />
        <CarouselSection />
        <Features />
        <About />
        <LogoMarquee />
        <News />
        <HowItWorks />
        <Signals />
      </main>
      <MarketingFooter />
    </div>
  );
}
