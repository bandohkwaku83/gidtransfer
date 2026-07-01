"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
} from "lucide-react";
import {
  ShowcaseCoverPreview,
  ShowcasePhonePreview,
} from "@/components/marketing/showcase-cover-preview";
import {
  featureSpotlights,
  type FeatureSpotlight,
} from "@/lib/marketing/features-content";
import { APP_NAME } from "@/lib/branding";
import { marketingSignUpHref } from "@/lib/marketing/auth-links";
import { usePhotographerSignedIn } from "@/lib/marketing/use-photographer-signed-in";
import { cn } from "@/lib/utils";

export const FEATURES_HERO_BACKDROP_ID = "features-hero-backdrop";

export const featuresHeroImage = {
  src: "/images/gallery-covers/Amoa-Mensa_0571-min.jpg",
  alt: "Engagement gallery cover",
} as const;

/** Full-bleed hero image from the top of the page — sits behind the marketing header. */
export function FeaturesHeroBackdrop() {
  return (
    <div
      id={FEATURES_HERO_BACKDROP_ID}
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[max(32rem,calc(5.5rem+min(46vh,420px)))] sm:h-[max(36rem,calc(5.5rem+min(50vh,460px)))]"
    >
      <Image
        src={featuresHeroImage.src}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_35%]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/75" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.35)_100%)]" />
    </div>
  );
}

function SpotlightVisual({ spotlight }: { spotlight: FeatureSpotlight }) {
  const { visual } = spotlight;

  if (visual.type === "photo") {
    return (
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] shadow-[0_28px_64px_-36px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/8">
        <Image src={visual.src} alt={visual.alt} fill sizes="(max-width: 768px) 100vw, 480px" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>
    );
  }

  if (visual.type === "phone") {
    return (
      <div className="relative mx-auto w-full max-w-[220px] sm:max-w-[240px]">
        <div className="relative aspect-[9/19] overflow-hidden rounded-[2rem] bg-slate-950 shadow-[0_32px_72px_-28px_rgba(15,23,42,0.45)] ring-1 ring-slate-900/10">
          <ShowcasePhonePreview
            src={visual.src}
            alt={visual.alt}
            title={visual.title}
            coverColor={visual.coverColor}
          />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-4 -z-10 rounded-[2.5rem] bg-[#55001F]/10 blur-2xl"
        />
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] shadow-[0_28px_64px_-36px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/8">
        <ShowcaseCoverPreview
          src={visual.src}
          alt={visual.alt}
          title={visual.title}
          coverFrame={visual.coverFrame}
          coverColor={visual.coverColor}
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-6 -right-6 hidden h-32 w-32 rounded-full bg-[#D5AE65]/30 blur-3xl sm:block"
      />
    </div>
  );
}

export function FeaturesSection() {
  const signedIn = usePhotographerSignedIn();
  const signUpHref = signedIn ? marketingSignUpHref() : "/login?screen=signup";

  return (
    <div>
      {/* Hero */}
      <section className="relative">
        <div className="relative flex min-h-[min(46vh,420px)] flex-col items-center justify-center px-5 py-12 text-center sm:min-h-[min(50vh,460px)] sm:px-8 sm:py-16">
          <h1 className="font-display text-[clamp(2.25rem,5vw,3.5rem)] font-medium tracking-tight text-white">
            Features
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
            Galleries, proofing, CRM, branding, and delivery — connected in a workflow that
            saves hours and makes clients feel looked after.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={signUpHref}
              className="inline-flex items-center gap-2 rounded bg-[#55001F] px-6 py-3 text-sm font-semibold text-[#D5AE65] shadow-[0_14px_30px_-12px_rgba(85,0,31,0.55)] transition hover:bg-[#6a0027]"
            >
              {signedIn ? "Open studio" : "Start free — no card"}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center rounded border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
            >
              View pricing
            </Link>
          </div>
          <p className="mt-5 text-xs text-white/50 sm:text-sm">
            30-day trial · Any plan after your trial · Cancel anytime
          </p>
        </div>
      </section>

      {/* Spotlights */}
      <section className="relative bg-[#FFFCF2] py-14 sm:py-20" aria-label="Feature highlights">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-noise opacity-[0.05] mix-blend-multiply" />
        <div className="relative marketing-container space-y-20 sm:space-y-28">
          {featureSpotlights.map((spotlight, index) => {
            const reversed = index % 2 === 1;
            return (
              <article
                key={spotlight.id}
                id={spotlight.id}
                className="scroll-mt-28 grid items-center gap-10 lg:grid-cols-2 lg:gap-16 xl:gap-20"
              >
                <div className={cn(reversed && "lg:order-2")}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#55001F]">
                    {spotlight.eyebrow}
                  </p>
                  <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-[2rem] sm:leading-tight">
                    {spotlight.headline}
                  </h2>
                  <p className="mt-4 text-base leading-relaxed text-slate-600">
                    {spotlight.description}
                  </p>
                  <ul className="mt-6 space-y-3">
                    {spotlight.bullets.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#55001F] text-[#D5AE65]">
                          <Check className="h-3 w-3" aria-hidden strokeWidth={3} />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={cn(reversed && "lg:order-1")}>
                  <SpotlightVisual spotlight={spotlight} />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-[#f5f6f7] py-16 sm:py-20 md:py-24">
        <div className="marketing-container">
          <div className="grid items-center gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] md:gap-14 xl:gap-20">
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-[2.75rem] md:leading-[1.15]">
                Ready to run your studio on {APP_NAME}?
              </h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-slate-500 sm:text-lg">
                Start with galleries free. Add CRM, contracts, and custom domains when your studio
                grows.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={signUpHref}
                  className="inline-flex items-center gap-2 rounded bg-[#55001F] px-8 py-3.5 text-sm font-semibold text-[#D5AE65] transition hover:bg-[#6a0027]"
                >
                  {signedIn ? "Open studio" : "Get started free"}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center rounded border border-slate-200 bg-white px-8 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Compare plans
                </Link>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-sm">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] shadow-[0_28px_64px_-36px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/8">
                <ShowcaseCoverPreview
                  src="/images/gallery-covers/GIDO9970.JPG"
                  alt="Colourful studio portrait gallery"
                  title="Colour & Light"
                  coverFrame="collage"
                  coverColor="#0f172a"
                />
              </div>
              <div className="absolute -bottom-6 -left-4 w-[42%] overflow-hidden rounded-[1.25rem] shadow-[0_20px_48px_-20px_rgba(15,23,42,0.35)] ring-2 ring-white sm:-left-8">
                <div className="relative aspect-[9/16] bg-slate-950">
                  <ShowcasePhonePreview
                    src="/images/gallery-covers/IMG_2185.JPG"
                    alt="Portrait gallery on mobile"
                    title="Emerald Portrait"
                    coverColor="#14532d"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
