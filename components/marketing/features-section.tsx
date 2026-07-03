"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import {
  ShowcaseCoverPreview,
  ShowcasePhonePreview,
} from "@/components/marketing/showcase-cover-preview";
import { MarketingFaqSection } from "@/components/marketing/faq-section";
import { MarketingHeader, marketingHeaderInset } from "@/components/marketing/marketing-header";
import {
  featureSectionHeaders,
  featureSpotlights,
  featureStats,
  featureTestimonial,
  featureWorkflowSteps,
  type FeatureSpotlight,
} from "@/lib/marketing/features-content";
import { APP_NAME } from "@/lib/branding";
import { marketingSignUpHref } from "@/lib/marketing/auth-links";
import { usePhotographerSignedIn } from "@/lib/marketing/use-photographer-signed-in";
import { cn } from "@/lib/utils";

const heroInset = "px-3 sm:px-4 lg:px-6";
const heroPanelHeight =
  "min-h-[calc(100svh-0.75rem)] sm:min-h-[calc(100svh-1rem)] lg:min-h-[calc(100svh-1.25rem)]";

function getSpotlightImage(spotlight: FeatureSpotlight) {
  return spotlight.visual.src;
}

function WorkflowMarquee() {
  const items = [...featureWorkflowSteps, ...featureWorkflowSteps];

  return (
    <div className="overflow-hidden border-y border-white/10 bg-[#0a0608] py-4">
      <div className="animate-landing-marquee flex w-max items-center gap-10 px-4">
        {items.map((step, i) => (
          <span
            key={`${step.label}-${i}`}
            className="inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45"
          >
            <span className="text-[#D5AE65]">{step.label}</span>
            <span className="text-white/20" aria-hidden>
              ✦
            </span>
            <span>{step.description}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function StatsBand() {
  return (
    <section className="bg-[#0a0608] py-12 sm:py-14">
      <div className="marketing-container">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-6">
          {featureStats.map((stat) => (
            <div key={stat.label}>
              <p className="font-display text-[clamp(2.25rem,4.5vw,3.25rem)] font-medium leading-none tracking-tight text-white">
                {stat.value}
                {"suffix" in stat && stat.suffix ? (
                  <span className="text-[#D5AE65]">{stat.suffix}</span>
                ) : null}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/50">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HeroShowcaseStack() {
  return (
    <div className="pointer-events-none relative mx-auto w-full max-w-[min(100%,22rem)] lg:mx-0 lg:max-w-none lg:justify-self-end">
      <div className="relative h-[min(52vh,520px)] w-full lg:h-[min(58vh,580px)]">
        <div className="absolute right-[4%] top-[2%] w-[58%] rotate-[2deg] overflow-hidden rounded-2xl shadow-[0_40px_80px_-28px_rgba(0,0,0,0.75)] ring-1 ring-white/25">
          <div className="relative aspect-[4/5]">
            <ShowcaseCoverPreview
              src="/images/gallery-covers/WOED0075.JPG"
              alt="Wedding gallery cover"
              title="Sarah & James"
              coverFrame="cinematic"
              coverColor="#4c0519"
              priority
            />
          </div>
        </div>

        <div className="absolute bottom-[8%] left-0 w-[42%] rotate-[-3deg] overflow-hidden rounded-xl shadow-[0_32px_64px_-24px_rgba(0,0,0,0.65)] ring-2 ring-white/90">
          <div className="relative aspect-[4/5]">
            <ShowcaseCoverPreview
              src="/images/gallery-covers/GIDO9970.JPG"
              alt="Portrait gallery cover"
              title="Colour & Light"
              coverFrame="collage"
              coverColor="#0f172a"
            />
          </div>
        </div>

        <div className="absolute bottom-[14%] right-[8%] w-[34%] overflow-hidden rounded-[1.35rem] shadow-[0_28px_56px_-20px_rgba(0,0,0,0.7)] ring-2 ring-white">
          <div className="relative aspect-[9/16] bg-slate-950">
            <ShowcasePhonePreview
              src="/images/gallery-covers/IMG_5261.JPG"
              alt="Gallery on mobile"
              title="The Mensah Family"
              coverColor="#14532d"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturesHero({ signUpHref, signedIn }: { signUpHref: string; signedIn: boolean }) {
  return (
    <section className={cn("relative bg-[#FFFCF2] pb-3 sm:pb-4 lg:pb-5", heroInset)}>
      <div
        className={cn(
          "relative isolate w-full overflow-hidden rounded-[1.75rem] sm:rounded-[2rem] lg:rounded-[2.5rem]",
          heroPanelHeight,
        )}
      >
        <div className="absolute inset-x-0 top-0 z-20">
          <MarketingHeader embedded />
        </div>

        <div aria-hidden className="absolute inset-0 overflow-hidden">
          <div className="animate-landing-ken-burns absolute inset-0 h-full w-full">
            <Image
              src="/images/gallery-covers/WOED0075.JPG"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-[center_30%]"
            />
          </div>
        </div>

        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/20" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />

        <div className="relative z-10 grid h-full min-h-[inherit] items-end gap-10 px-5 pb-10 pt-28 sm:px-8 sm:pb-14 sm:pt-32 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:items-end lg:gap-12 lg:px-12 lg:pb-16 lg:pt-36">
          <div className="max-w-xl">
            <p
              className="animate-landing-fade-up text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D5AE65]"
              style={{ animationDelay: "0.08s" }}
            >
              Platform features
            </p>
            <h1
              className="mt-4 animate-landing-fade-up font-display text-[clamp(2.25rem,5.2vw,4rem)] font-medium leading-[1.02] tracking-[-0.02em] text-white"
              style={{ animationDelay: "0.16s" }}
            >
              Deliver like your images{" "}
              <span className="text-[#D5AE65]">deserve.</span>
            </h1>
            <p
              className="mt-5 max-w-md animate-landing-fade-up text-sm leading-relaxed text-white/60 sm:text-base"
              style={{ animationDelay: "0.28s" }}
            >
              Branded gallery links clients actually open — plus the studio dashboard to upload,
              proof, and deliver without duct-taping five apps together.
            </p>
            <div
              className="mt-8 flex animate-landing-fade-up flex-wrap gap-3"
              style={{ animationDelay: "0.4s" }}
            >
              <Link
                href={signUpHref}
                className="inline-flex items-center justify-center rounded-xl bg-[#55001F] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#6a0027]"
              >
                {signedIn ? "Open studio" : "Start free — no card"}
              </Link>
              <a
                href="#feature-rail"
                className="inline-flex items-center justify-center rounded-xl border border-[#D5AE65]/60 px-6 py-3.5 text-sm font-semibold text-[#D5AE65] transition hover:bg-[#D5AE65]/10"
              >
                Explore features
              </a>
            </div>
          </div>

          <div className="animate-landing-fade-up" style={{ animationDelay: "0.45s" }}>
            <HeroShowcaseStack />
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureRail({
  activeId,
  onSelect,
}: {
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      id="feature-rail"
      className="sticky top-[4.5rem] z-30 border-b border-slate-200/80 bg-[#FFFCF2]/92 backdrop-blur-md sm:top-20"
    >
      <div className={cn("py-3", marketingHeaderInset)}>
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {featureSpotlights.map((spotlight) => {
            const active = activeId === spotlight.id;
            return (
              <a
                key={spotlight.id}
                href={`#${spotlight.id}`}
                onClick={() => onSelect(spotlight.id)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition",
                  active
                    ? "bg-[#55001F] text-[#D5AE65] shadow-[0_8px_24px_-12px_rgba(85,0,31,0.5)]"
                    : "bg-white text-slate-600 ring-1 ring-slate-200/90 hover:text-slate-900",
                )}
              >
                {spotlight.eyebrow}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FeatureVisual({ spotlight, large }: { spotlight: FeatureSpotlight; large?: boolean }) {
  const { visual } = spotlight;

  if (visual.type === "gallery-cover") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-[1.5rem] shadow-[0_32px_80px_-28px_rgba(15,23,42,0.35)] ring-1 ring-slate-900/10",
          large ? "aspect-[4/5] lg:aspect-[5/6] lg:min-h-[32rem]" : "aspect-[4/5]",
        )}
      >
        <ShowcaseCoverPreview
          src={visual.src}
          alt={visual.alt}
          title={visual.title}
          coverFrame={visual.coverFrame}
          coverColor={visual.coverColor}
        />
      </div>
    );
  }

  if (visual.type === "phone") {
    return (
      <div className={cn("relative mx-auto", large ? "max-w-[280px]" : "max-w-[240px]")}>
        <div className="relative aspect-[9/19] overflow-hidden rounded-[2rem] bg-slate-950 shadow-[0_36px_80px_-24px_rgba(15,23,42,0.4)] ring-1 ring-slate-900/10">
          <ShowcasePhonePreview
            src={visual.src}
            alt={visual.alt}
            title={visual.title}
            coverColor={visual.coverColor}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.5rem] shadow-[0_32px_80px_-28px_rgba(15,23,42,0.35)] ring-1 ring-slate-900/10",
        large ? "aspect-[4/5] lg:aspect-[5/6] lg:min-h-[32rem]" : "aspect-[4/5]",
      )}
    >
      <Image src={visual.src} alt={visual.alt} fill sizes="(max-width: 768px) 100vw, 640px" className="object-cover" />
    </div>
  );
}

function FeatureSpread({
  spotlight,
  index,
  flagship,
}: {
  spotlight: FeatureSpotlight;
  index: number;
  flagship?: boolean;
}) {
  const reversed = index % 2 === 1;
  const number = String(index + 1).padStart(2, "0");

  if (flagship) {
    return (
      <article id={spotlight.id} className="scroll-mt-36">
        <div className="relative overflow-hidden bg-[#55001F]">
          <div aria-hidden className="absolute inset-0">
            <Image
              src={getSpotlightImage(spotlight)}
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#55001F] via-[#55001F]/95 to-[#55001F]/75" />
          </div>

          <div className="marketing-container relative grid gap-10 py-16 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-24">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D5AE65]/85">
                {featureSectionHeaders.client.eyebrow}
              </p>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#D5AE65]/70">
                {spotlight.eyebrow}
              </p>
              <h2 className="mt-3 font-display text-[clamp(2rem,4vw,3.25rem)] font-medium leading-[1.05] tracking-tight text-white">
                {spotlight.headline}
              </h2>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-white/70">{spotlight.description}</p>
              <ol className="mt-8 space-y-4 border-t border-white/10 pt-8">
                {spotlight.bullets.map((item, bulletIndex) => (
                  <li key={item} className="flex gap-4">
                    <span className="shrink-0 font-mono text-xs font-medium text-[#D5AE65]">
                      {String(bulletIndex + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm leading-relaxed text-white/85">{item}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="relative">
              <FeatureVisual spotlight={spotlight} large />
              <div className="absolute -bottom-5 -left-3 w-[38%] overflow-hidden rounded-2xl shadow-2xl ring-2 ring-white sm:-left-6">
                <div className="relative aspect-[9/16] bg-slate-950">
                  <ShowcasePhonePreview
                    src="/images/gallery-covers/IMG_5261.JPG"
                    alt="Gallery on mobile"
                    title="The Mensah Family"
                    coverColor="#14532d"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      id={spotlight.id}
      className={cn(
        "relative scroll-mt-36 overflow-hidden py-16 sm:py-20 lg:py-24",
        index % 2 === 0 ? "bg-[#FFFCF2]" : "bg-white",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-6 font-display text-[clamp(5rem,14vw,10rem)] font-semibold leading-none tracking-tight text-[#55001F]/[0.06]",
          reversed ? "right-4 sm:right-8" : "left-4 sm:left-8",
        )}
      >
        {number}
      </span>

      <div
        className={cn(
          "marketing-container relative grid items-center gap-10 lg:grid-cols-12 lg:gap-12 xl:gap-16",
          reversed && "lg:[&>*:first-child]:order-2",
        )}
      >
        <div className="lg:col-span-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#55001F]">
            {spotlight.section === "client"
              ? featureSectionHeaders.client.eyebrow
              : featureSectionHeaders.studio.eyebrow}
          </p>
          <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
            {spotlight.eyebrow}
          </p>
          <h2 className="mt-3 font-display text-[clamp(1.85rem,3.5vw,2.75rem)] font-medium leading-[1.08] tracking-tight text-slate-900">
            {spotlight.headline}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600">{spotlight.description}</p>
          <ol className="mt-8 space-y-4">
            {spotlight.bullets.map((item, bulletIndex) => (
              <li key={item} className="flex gap-4 border-t border-slate-200/80 pt-4 first:border-t-0 first:pt-0">
                <span className="shrink-0 font-mono text-xs font-medium text-[#55001F]">
                  {String(bulletIndex + 1).padStart(2, "0")}
                </span>
                <span className="text-sm leading-relaxed text-slate-700">{item}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className={cn("lg:col-span-7", reversed && "lg:order-1")}>
          <FeatureVisual spotlight={spotlight} large />
        </div>
      </div>
    </article>
  );
}

function FeaturesTestimonialCarousel() {
  const t = featureTestimonial;

  return (
    <section className="overflow-hidden bg-white py-16 sm:py-20">
      <div className="marketing-container">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
          <figure className="relative mx-auto w-full max-w-[18rem] lg:mx-0">
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-[0_24px_60px_-24px_rgba(85,0,31,0.28)] ring-1 ring-slate-900/8">
              <Image src={t.avatar} alt={t.name} fill sizes="288px" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#55001F]/35 via-transparent to-transparent" />
            </div>
            <figcaption className="absolute bottom-4 left-4 rounded-xl bg-white/92 px-3 py-2 shadow-lg backdrop-blur-sm">
              <span className="block text-xs font-semibold text-slate-900">{t.name}</span>
              <span className="text-[0.65rem] text-slate-500">{t.role}</span>
            </figcaption>
          </figure>

          <blockquote>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
              From a working photographer
            </p>
            <p className="mt-4 font-display text-[clamp(1.5rem,3vw,2.25rem)] font-normal italic leading-relaxed text-[#55001F]">
              &ldquo;{t.quote}&rdquo;
            </p>
          </blockquote>
        </div>
      </div>
    </section>
  );
}

function ClosingCta({ signUpHref, signedIn }: { signUpHref: string; signedIn: boolean }) {
  return (
    <section className="bg-[#FFFCF2] py-16 sm:py-20 lg:py-24">
      <div className="marketing-container">
        <div className="grid overflow-hidden rounded-[2rem] bg-[#55001F] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
          <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-12 xl:p-14">
            <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.08] tracking-tight text-white">
              Your next client deserves better than a zip file.
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-white/70">
              Try {APP_NAME} on your next delivery — upload a shoot, design the gallery, and send a
              branded link. Free for 30 days.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={signUpHref}
                className="inline-flex items-center gap-2 rounded-xl bg-[#D5AE65] px-6 py-3.5 text-sm font-semibold text-[#55001F] transition hover:bg-[#e0be75]"
              >
                {signedIn ? "Open studio" : "Get started free"}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center rounded-xl border border-white/25 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Compare plans
              </Link>
            </div>
          </div>

          <div className="relative min-h-[18rem] bg-[#3d0016] lg:min-h-[24rem]">
            <div className="absolute inset-4 overflow-hidden rounded-[1.25rem] sm:inset-6">
              <ShowcaseCoverPreview
                src="/images/gallery-covers/GIDO9970.JPG"
                alt="Colourful studio portrait gallery"
                title="Colour & Light"
                coverFrame="collage"
                coverColor="#0f172a"
              />
            </div>
            <div className="absolute bottom-8 left-8 w-[38%] overflow-hidden rounded-xl shadow-2xl ring-2 ring-white">
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
  );
}

export function FeaturesSection() {
  const signedIn = usePhotographerSignedIn();
  const signUpHref = signedIn ? marketingSignUpHref() : "/login?screen=signup";
  const [activeId, setActiveId] = useState(featureSpotlights[0]!.id);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const sections = featureSpotlights
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveId(visible.target.id);
      },
      { rootMargin: "-35% 0px -45% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    for (const section of sections) observerRef.current.observe(section);
    return () => observerRef.current?.disconnect();
  }, []);

  const flagship = featureSpotlights[0]!;
  const rest = featureSpotlights.slice(1);

  return (
    <div>
      <FeaturesHero signUpHref={signUpHref} signedIn={signedIn} />
      <WorkflowMarquee />
      <StatsBand />
      <FeatureRail activeId={activeId} onSelect={setActiveId} />

      <FeatureSpread spotlight={flagship} index={0} flagship />
      {rest.map((spotlight, i) => (
        <FeatureSpread key={spotlight.id} spotlight={spotlight} index={i + 1} />
      ))}

      <FeaturesTestimonialCarousel />
      <MarketingFaqSection id="features-faq" showEmailFooter className="bg-[#FFFCF2]" />
      <ClosingCta signUpHref={signUpHref} signedIn={signedIn} />
    </div>
  );
}
