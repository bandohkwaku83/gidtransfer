"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  LayoutTemplate,
  Link2,
  Lock,
  Palette,
  Shield,
  Upload,
} from "lucide-react";
import {
  ShowcaseCoverPreview,
  ShowcasePhonePreview,
} from "@/components/marketing/showcase-cover-preview";
import { MarketingFaqSection } from "@/components/marketing/faq-section";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import {
  featureSectionHeaders,
  featureSpotlights,
  featureTestimonial,
  featureTrustPoints,
  featureWhySwitch,
  featureWorkflowSteps,
  type FeatureSpotlight,
} from "@/lib/marketing/features-content";
import { APP_NAME } from "@/lib/branding";
import { marketingSignUpHref } from "@/lib/marketing/auth-links";
import { usePhotographerSignedIn } from "@/lib/marketing/use-photographer-signed-in";
import { cn } from "@/lib/utils";

const heroFloats = [
  {
    src: "/images/gallery-covers/WOED0075.JPG",
    alt: "Wedding gallery cover",
    className:
      "left-[6%] top-[4%] w-[48%] rotate-[-9deg] sm:w-[40%] lg:left-auto lg:right-[16%] lg:top-[-2%] lg:w-[48%]",
    delay: "0s",
  },
  {
    src: "/images/gallery-covers/GIDO9970.JPG",
    alt: "Portrait gallery cover",
    className:
      "right-0 top-[22%] w-[40%] rotate-[8deg] sm:right-[4%] sm:w-[34%] lg:right-[-2%] lg:top-[26%] lg:w-[40%]",
    delay: "0.35s",
  },
  {
    src: "/images/gallery-covers/IMG_5261.JPG",
    alt: "Family gallery preview",
    className:
      "bottom-[4%] left-[22%] w-[32%] rotate-[5deg] sm:w-[26%] lg:bottom-[6%] lg:left-auto lg:right-[30%] lg:w-[28%]",
    delay: "0.7s",
  },
] as const;

function HeroCornerCta({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group relative inline-flex items-center gap-2.5 bg-[#55001F] px-4 py-2.5 text-sm font-medium text-[#FFFCF2] transition hover:bg-[#6a0027]"
    >
      <span
        aria-hidden
        className="h-2.5 w-2.5 shrink-0 bg-[#FFFCF2] transition group-hover:bg-white"
      />
      {children}
      <span aria-hidden className="pointer-events-none absolute -left-1.5 -top-1.5 h-3 w-3 border-l border-t border-[#55001F]/45" />
      <span aria-hidden className="pointer-events-none absolute -right-1.5 -top-1.5 h-3 w-3 border-r border-t border-[#55001F]/45" />
      <span aria-hidden className="pointer-events-none absolute -bottom-1.5 -left-1.5 h-3 w-3 border-b border-l border-[#55001F]/45" />
      <span aria-hidden className="pointer-events-none absolute -bottom-1.5 -right-1.5 h-3 w-3 border-b border-r border-[#55001F]/45" />
    </Link>
  );
}

function FeaturesHero({ signUpHref, signedIn }: { signUpHref: string; signedIn: boolean }) {
  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-[#0c0b0a]">
      {/* Split: full-bleed photo top / cream bottom — cream starts below the headline */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-[58%] sm:h-[56%]">
        <Image
          src="/images/gallery-covers/WOED0075.JPG"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/75" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.35)_100%)]" />
      </div>
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[42%] bg-[#FFFCF2] sm:h-[44%]"
      />

      {/* Vertical grid */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden md:block">
        <div className="mx-auto flex h-full max-w-7xl px-0 xl:max-w-[90rem]">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "h-full flex-1 border-l border-white/[0.1]",
                i === 3 && "border-r",
              )}
            />
          ))}
        </div>
      </div>

      <div className="relative z-20">
        <MarketingHeader />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100svh-5.5rem)] max-w-7xl grid-cols-1 items-stretch px-5 pb-10 pt-8 sm:px-8 sm:pb-12 lg:grid-cols-12 lg:px-12 lg:pb-14 xl:max-w-[90rem] xl:px-14">
        <div className="relative flex flex-col lg:col-span-6 xl:col-span-5">
          {/* Keep the white headline fully inside the photo band */}
          <div className="flex min-h-[calc(58svh-5.5rem)] flex-col justify-end pb-6 sm:min-h-[calc(56svh-5.5rem)] sm:pb-8 lg:pb-10">
            <h1
              className="animate-landing-fade-up max-w-[11ch] font-display text-[clamp(2.75rem,7.5vw,5.25rem)] font-medium leading-[0.96] tracking-[-0.03em] text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.35)]"
              style={{ animationDelay: "0.08s" }}
            >
              Branded galleries, today.
            </h1>
          </div>

          <div
            className="max-w-sm animate-landing-fade-up pt-8 sm:pt-10"
            style={{ animationDelay: "0.22s" }}
          >
            <p className="text-sm leading-relaxed text-[#55001F]/90 sm:text-[0.95rem]">
              {APP_NAME} removes delivery friction upstream — branded client links,
              proofing, and studio tools without replacing how you already shoot.
            </p>

            <div className="mt-7">
              <HeroCornerCta href={signUpHref}>
                {signedIn ? "Open studio" : "Start free"}
              </HeroCornerCta>
            </div>
          </div>
        </div>

        <div className="relative mt-10 min-h-[22rem] sm:min-h-[26rem] lg:col-span-6 lg:mt-0 lg:min-h-0 xl:col-span-7">
          <div className="absolute inset-0 lg:inset-y-8 lg:left-0 lg:right-0">
            {heroFloats.map((item) => (
              <div
                key={item.src}
                className={cn(
                  "animate-landing-float absolute overflow-hidden rounded-sm shadow-[0_28px_60px_-24px_rgba(0,0,0,0.45)] ring-1 ring-white/25",
                  item.className,
                )}
                style={{ animationDelay: item.delay }}
              >
                <div className="relative aspect-[4/5] w-full">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    priority
                    sizes="(max-width: 1024px) 40vw, 28vw"
                    className="object-cover"
                  />
                </div>
              </div>
            ))}
          </div>

          <p
            aria-hidden
            className="absolute bottom-[18%] right-0 hidden font-mono text-[10px] leading-relaxed tracking-wider text-[#55001F]/65 lg:block"
          >
            12 cover frames
            <br />
            7 client layouts
          </p>
        </div>
      </div>
    </section>
  );
}

const processVisuals = [
  { src: "/images/client.jpg", alt: "Uploading a shoot" },
  { src: "/images/gallery-covers/WOED0075.JPG", alt: "Designing a gallery cover" },
  { src: "/images/gallery-covers/IMG_5261.JPG", alt: "Sharing a branded link" },
  { src: "/images/gallery-covers/GIDO9970.JPG", alt: "Client selecting favourites" },
  { src: "/images/gallery-covers/Amoa-Mensa_0571-min.jpg", alt: "Delivering finals" },
] as const;

const processIcons = [Upload, Palette, Link2, Heart, Lock] as const;
const whyIcons = [Heart, LayoutTemplate, Shield] as const;

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          el.classList.add("is-visible");
          observer.unobserve(el);
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}

function Reveal({
  children,
  className,
  delayMs = 0,
  scale,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  scale?: boolean;
}) {
  const ref = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={cn(scale ? "features-reveal-scale" : "features-reveal", className)}
      style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}

function Pill({
  children,
  tone = "cream",
}: {
  children: ReactNode;
  tone?: "cream" | "burgundy" | "gold";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em]",
        tone === "cream" && "bg-[#FFFCF2] text-[#55001F]",
        tone === "burgundy" && "bg-[#55001F] text-[#D5AE65]",
        tone === "gold" && "bg-[#D5AE65]/25 text-[#55001F]",
      )}
    >
      {children}
    </span>
  );
}

function VerticalSpine({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-slate-300/70 to-transparent lg:block",
        className,
      )}
    />
  );
}

function SectionHeader({
  pill,
  title,
  description,
  align = "center",
  light,
}: {
  pill: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  light?: boolean;
}) {
  return (
    <Reveal className={cn(align === "center" && "mx-auto max-w-3xl text-center", align === "left" && "max-w-2xl")}>
      <Pill tone={light ? "gold" : "cream"}>{pill}</Pill>
      <h2
        className={cn(
          "mt-5 font-display text-[clamp(1.85rem,4vw,3rem)] font-medium leading-[1.08] tracking-tight",
          light ? "text-white" : "text-slate-900",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed sm:text-lg",
            light ? "text-white/70" : "text-slate-600",
            align === "center" && "mx-auto max-w-2xl",
          )}
        >
          {description}
        </p>
      ) : null}
    </Reveal>
  );
}

function OverviewSection() {
  return (
    <section id="overview" className="relative scroll-mt-24 overflow-hidden bg-white py-20 sm:py-28">
      <VerticalSpine />
      <div className="marketing-container relative">
        <SectionHeader
          pill="Platform overview"
          title="Designed to remove delivery friction at its source"
          description={`Rather than bolting on another upload link, ${APP_NAME} replaces the WeTransfer + email + spreadsheet stack with one branded gallery — and the studio behind it.`}
        />

        <Reveal scale className="relative mt-12 sm:mt-16" delayMs={120}>
          <div className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] lg:aspect-[21/9]">
            <Image
              src="/images/gallery-covers/GIDO9970.JPG"
              alt="Branded gallery cover experience"
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-[#55001F]/40 via-transparent to-transparent"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const whyVisuals = [
  {
    src: "/images/gallery-covers/WOED0075.JPG",
    alt: "Branded wedding gallery clients open and remember",
  },
  {
    src: "/images/client.jpg",
    alt: "Photographer running delivery from one studio",
  },
  {
    src: "/images/gallery-covers/Amoa-Mensa_0571-min.jpg",
    alt: "Studio brand and protected delivery",
  },
] as const;

function WhyDial({
  progress,
  activeIndex,
}: {
  progress: number;
  activeIndex: number;
}) {
  // Arc sweeps ~280deg across the full scroll of Why switch
  const sweep = 28 + progress * 280;
  const r = 46;
  const c = 2 * Math.PI * r;
  const dash = (sweep / 360) * c;
  const tipAngle = -90 + sweep;
  const tipRad = (tipAngle * Math.PI) / 180;
  const tipX = 50 + r * Math.cos(tipRad);
  const tipY = 50 + r * Math.sin(tipRad);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[min(100%,28rem)]">
      <svg aria-hidden viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="rgba(148,163,184,0.35)"
          strokeWidth="0.35"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#55001F"
          strokeWidth="0.55"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          transform="rotate(-90 50 50)"
          className="transition-[stroke-dasharray] duration-100 ease-out"
        />
        <g transform={`translate(${tipX} ${tipY}) rotate(${tipAngle + 90})`}>
          <path d="M0,-1.4 L1.1,1.1 L0,0.55 L-1.1,1.1 Z" fill="#55001F" />
        </g>
        {[0, 90, 180, 270].map((deg) => {
          const rad = ((deg - 90) * Math.PI) / 180;
          const x = 50 + r * Math.cos(rad);
          const y = 50 + r * Math.sin(rad);
          return (
            <text
              key={deg}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(148,163,184,0.85)"
              fontSize="3.2"
              fontWeight="300"
            >
              +
            </text>
          );
        })}
        <circle
          cx="50"
          cy="50"
          r="38"
          fill="none"
          stroke="rgba(148,163,184,0.4)"
          strokeWidth="0.3"
        />
      </svg>

      <div className="absolute inset-[18%] overflow-hidden rounded-full bg-slate-100 shadow-[0_28px_64px_-28px_rgba(15,23,42,0.35)] ring-1 ring-slate-900/8">
        {whyVisuals.map((visual, i) => (
          <div
            key={visual.src}
            className={cn(
              "absolute inset-0 transition-opacity duration-500 ease-out",
              i === activeIndex ? "opacity-100" : "opacity-0",
            )}
            aria-hidden={i !== activeIndex}
          >
            <Image
              src={visual.src}
              alt={i === activeIndex ? visual.alt : ""}
              fill
              sizes="420px"
              className="object-cover"
              priority={i === 0}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function WhySwitchSection() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const stepCount = featureWhySwitch.length;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || reducedMotion) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const total = Math.max(1, el.offsetHeight - window.innerHeight);
      const next = Math.min(1, Math.max(0, -rect.top / total));
      setProgress(next);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [reducedMotion]);

  const activeIndex = Math.min(
    stepCount - 1,
    Math.floor(progress * stepCount + 0.001),
  );
  const counter = `00.0${activeIndex}`;

  return (
    <section id="why-switch" className="relative scroll-mt-24 bg-[#FFFCF2]">
      <div className="marketing-container relative pt-20 sm:pt-28">
        <SectionHeader
          pill="Why switch"
          title="Why photographers leave the zip-file stack behind"
        />
      </div>

      {/* Scroll track — pins the dial while steps advance */}
      <div
        ref={trackRef}
        className="relative"
        style={{ height: reducedMotion ? "auto" : `${stepCount * 100}vh` }}
      >
        <div
          className={cn(
            "flex items-center",
            reducedMotion
              ? "relative py-12"
              : "sticky top-0 min-h-svh py-10 lg:h-svh lg:py-0",
          )}
        >
          <div className="marketing-container relative grid w-full items-center gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
            <div className="relative max-w-md">
              <div className="relative min-h-[11.5rem] sm:min-h-[13rem]">
                {featureWhySwitch.map((item, i) => {
                  const StepIcon = whyIcons[i] ?? Shield;
                  const active = i === activeIndex;
                  return (
                    <div
                      key={item.title}
                      className={cn(
                        "transition-opacity duration-500 ease-out",
                        active
                          ? "relative opacity-100"
                          : "pointer-events-none absolute inset-0 opacity-0",
                      )}
                      aria-hidden={!active}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)] ring-1 ring-[#55001F]/12">
                        <StepIcon
                          className="h-5 w-5 text-[#55001F]"
                          strokeWidth={1.5}
                          aria-hidden
                        />
                      </div>
                      <h3 className="mt-6 font-display text-[clamp(1.85rem,3.5vw,2.75rem)] font-medium leading-[1.08] tracking-tight text-slate-900">
                        {item.title}
                      </h3>
                      <p className="mt-4 text-base leading-relaxed text-slate-600">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              <ol className="mt-8 flex gap-2" aria-label="Why switch steps">
                {featureWhySwitch.map((item, i) => (
                  <li key={item.title}>
                    <span
                      className={cn(
                        "block h-1.5 rounded-full transition-all duration-300",
                        i === activeIndex ? "w-7 bg-[#55001F]" : "w-1.5 bg-slate-300",
                      )}
                      aria-hidden
                    />
                    <span className="sr-only">
                      {i === activeIndex ? `Current: ${item.title}` : item.title}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <WhyDial progress={progress} activeIndex={activeIndex} />
              <p
                aria-hidden
                className="pointer-events-none absolute bottom-1 right-1 font-mono text-sm tabular-nums tracking-wider text-[#55001F]/70 sm:bottom-3 sm:right-3 sm:text-base"
              >
                {counter}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="marketing-container relative pb-16 sm:pb-20">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 border-t border-slate-200/80 pt-8">
          {featureTrustPoints.map((point) => (
            <span key={point} className="text-sm text-slate-500">
              <span className="mr-2 text-[#D5AE65]" aria-hidden>
                ·
              </span>
              {point}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProcessVisual({ index }: { index: number }) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[20rem]">
      <div aria-hidden className="absolute inset-[6%] rounded-full border border-slate-200/70" />
      <div className="absolute inset-[12%] overflow-hidden rounded-full bg-slate-100 shadow-[0_24px_48px_-24px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/8">
        {processVisuals.map((visual, i) => (
          <div
            key={visual.src}
            className={cn(
              "absolute inset-0 transition-opacity duration-500 ease-out",
              i === index ? "opacity-100" : "opacity-0",
            )}
            aria-hidden={i !== index}
          >
            <Image
              src={visual.src}
              alt={i === index ? visual.alt : ""}
              fill
              sizes="320px"
              className="object-cover"
              priority={i === 0}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function HowItWorksSection() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const inViewRef = useRef(false);
  const count = featureWorkflowSteps.length;
  const step = featureWorkflowSteps[active]!;
  const Icon = processIcons[active] ?? Upload;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = Boolean(entry?.isIntersecting);
      },
      { threshold: 0.35 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (paused) return;

    const timer = window.setInterval(() => {
      if (!inViewRef.current) return;
      setActive((i) => (i + 1) % count);
    }, 5200);

    return () => window.clearInterval(timer);
  }, [count, paused]);

  function selectStep(next: number) {
    setPaused(true);
    setActive(next);
  }

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative scroll-mt-24 overflow-hidden bg-white py-20 sm:py-28"
    >
      <VerticalSpine />
      <div className="marketing-container relative">
        <SectionHeader
          pill="How it works"
          title="From upload to delivery in one flow"
        />

        <div className="mt-14 grid items-center gap-10 lg:mt-16 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFFCF2] ring-1 ring-[#55001F]/10">
                <Icon className="h-5 w-5 text-[#55001F]" strokeWidth={1.5} aria-hidden />
              </div>
              <p className="mt-6 font-mono text-xs font-medium tabular-nums tracking-wider text-[#D5AE65]">
                {String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
              </p>
              <h3 className="mt-3 font-display text-[clamp(2rem,4vw,3.25rem)] font-medium leading-none tracking-tight text-slate-900 transition-opacity duration-300">
                {step.label}
              </h3>
              <p className="mt-4 max-w-md text-base leading-relaxed text-slate-600">
                {step.description}
              </p>
            </div>

            <div className="mt-10 flex items-center gap-3">
              <button
                type="button"
                aria-label="Previous step"
                onClick={() => selectStep((active - 1 + count) % count)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-[#55001F]/25 hover:text-[#55001F]"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                aria-label="Next step"
                onClick={() => selectStep((active + 1) % count)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-[#55001F]/25 hover:text-[#55001F]"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>

              <div className="ml-2 flex gap-1.5">
                {featureWorkflowSteps.map((s, i) => (
                  <button
                    key={s.label}
                    type="button"
                    aria-label={`Go to ${s.label}`}
                    aria-current={i === active ? "true" : undefined}
                    onClick={() => selectStep(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === active ? "w-6 bg-[#55001F]" : "w-1.5 bg-slate-300 hover:bg-slate-400",
                    )}
                  />
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal scale delayMs={80} className="relative">
            <ProcessVisual index={active} />
          </Reveal>
        </div>

        <ol className="mt-14 grid gap-px overflow-hidden rounded-2xl bg-slate-200/70 sm:grid-cols-5">
          {featureWorkflowSteps.map((s, i) => (
            <li key={s.label}>
              <button
                type="button"
                onClick={() => selectStep(i)}
                className={cn(
                  "flex h-full w-full flex-col gap-1 px-4 py-5 text-left transition",
                  i === active ? "bg-[#FFFCF2]" : "bg-white hover:bg-slate-50",
                )}
              >
                <span
                  className={cn(
                    "font-mono text-[11px] font-medium tabular-nums",
                    i === active ? "text-[#D5AE65]" : "text-slate-400",
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className={cn(
                    "text-sm font-semibold",
                    i === active ? "text-[#55001F]" : "text-slate-800",
                  )}
                >
                  {s.label}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function FlagshipBand({ signUpHref, signedIn }: { signUpHref: string; signedIn: boolean }) {
  const flagship = featureSpotlights[0]!;
  const visual = flagship.visual;

  return (
    <section className="relative overflow-hidden bg-[#55001F] py-20 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-[#D5AE65]/15 blur-3xl"
      />
      <div className="marketing-container relative grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <Pill tone="gold">{flagship.eyebrow}</Pill>
          <h2 className="mt-5 font-display text-[clamp(1.85rem,3.8vw,2.85rem)] font-medium leading-[1.08] tracking-tight text-white">
            {flagship.headline}
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-white/70">
            {flagship.description}
          </p>
          <ul className="mt-8 space-y-3">
            {flagship.bullets.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-white/85">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#D5AE65]" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <Link
              href={signUpHref}
              className="inline-flex items-center gap-2 rounded-xl bg-[#D5AE65] px-6 py-3.5 text-sm font-semibold text-[#55001F] transition hover:bg-[#e0be75]"
            >
              {signedIn ? "Open studio" : "Try it free"}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </Reveal>

        <Reveal scale delayMs={100}>
          <div className="relative mx-auto max-w-md overflow-hidden rounded-[1.5rem] bg-white/5 p-3 ring-1 ring-white/15 sm:p-4">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.15rem]">
              {visual.type === "gallery-cover" ? (
                <ShowcaseCoverPreview
                  src={visual.src}
                  alt={visual.alt}
                  title={visual.title}
                  coverFrame={visual.coverFrame}
                  coverColor={visual.coverColor}
                />
              ) : (
                <Image
                  src={visual.src}
                  alt={visual.alt}
                  fill
                  sizes="420px"
                  className="object-cover"
                />
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FeatureVisual({ spotlight }: { spotlight: FeatureSpotlight }) {
  const { visual } = spotlight;

  if (visual.type === "gallery-cover") {
    return (
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] shadow-[0_28px_64px_-28px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/8">
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
      <div className="relative mx-auto max-w-[240px]">
        <div className="relative aspect-[9/19] overflow-hidden rounded-[2rem] bg-slate-950 shadow-[0_32px_64px_-24px_rgba(15,23,42,0.35)] ring-1 ring-slate-900/8">
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
    <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] shadow-[0_28px_64px_-28px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/8">
      <Image
        src={visual.src}
        alt={visual.alt}
        fill
        sizes="(max-width: 768px) 100vw, 560px"
        className="object-cover"
      />
    </div>
  );
}

function FeatureSpread({ spotlight, index }: { spotlight: FeatureSpotlight; index: number }) {
  const reversed = index % 2 === 1;

  return (
    <article
      id={spotlight.id}
      className={cn(
        "relative scroll-mt-28 overflow-hidden py-16 sm:py-20 lg:py-24",
        index % 2 === 0 ? "bg-white" : "bg-[#FFFCF2]",
      )}
    >
      <VerticalSpine className="via-slate-200/80" />
      <div
        className={cn(
          "marketing-container relative grid items-center gap-10 lg:grid-cols-2 lg:gap-16 xl:gap-20",
          reversed && "lg:[&>*:first-child]:order-2",
        )}
      >
        <Reveal>
          <Pill>{spotlight.eyebrow}</Pill>
          <h2 className="mt-5 font-display text-[clamp(1.75rem,3.2vw,2.5rem)] font-medium leading-[1.08] tracking-tight text-slate-900">
            {spotlight.headline}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600">{spotlight.description}</p>
          <ul className="mt-8 space-y-3">
            {spotlight.bullets.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-slate-700">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#D5AE65]" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal scale delayMs={100} className={cn(reversed && "lg:order-1")}>
          <FeatureVisual spotlight={spotlight} />
        </Reveal>
      </div>
    </article>
  );
}

function FeaturesTestimonial() {
  const t = featureTestimonial;

  return (
    <section className="relative overflow-hidden bg-white py-20 sm:py-28">
      <VerticalSpine />
      <div className="marketing-container relative">
        <SectionHeader pill="From the field" title="Loved by working photographers" />

        <div className="mt-14 grid items-center gap-10 lg:mt-16 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
          <Reveal>
            <figure className="relative mx-auto w-full max-w-[17rem] lg:mx-0">
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-[0_24px_56px_-24px_rgba(85,0,31,0.25)] ring-1 ring-slate-900/8">
                <Image src={t.avatar} alt={t.name} fill sizes="272px" className="object-cover" />
              </div>
              <figcaption className="mt-4">
                <span className="block text-sm font-semibold text-slate-900">{t.name}</span>
                <span className="text-sm text-slate-500">{t.role}</span>
              </figcaption>
            </figure>
          </Reveal>

          <Reveal delayMs={100}>
            <blockquote>
              <p className="font-display text-[clamp(1.4rem,2.8vw,2.1rem)] font-normal italic leading-relaxed text-[#55001F]">
                &ldquo;{t.quote}&rdquo;
              </p>
            </blockquote>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function ClosingCta({ signUpHref, signedIn }: { signUpHref: string; signedIn: boolean }) {
  return (
    <section className="bg-[#FFFCF2] py-16 sm:py-20 lg:py-24">
      <div className="marketing-container">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-[#55001F] px-8 py-14 sm:px-10 sm:py-16 lg:px-14 lg:py-20">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-[#D5AE65]/15 blur-3xl"
            />
            <div className="relative mx-auto max-w-2xl text-center">
              <Pill tone="gold">Get started</Pill>
              <h2 className="mt-5 font-display text-[clamp(1.85rem,3.5vw,2.85rem)] font-medium leading-[1.08] tracking-tight text-white">
                Your next client deserves better than a zip file.
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/70">
                Try {APP_NAME} on your next delivery — upload a shoot, design the gallery, and send a
                branded link. Free for 30 days.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
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
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function FeaturesSection() {
  const signedIn = usePhotographerSignedIn();
  const signUpHref = signedIn ? marketingSignUpHref() : "/login?screen=signup";

  const remaining = featureSpotlights.slice(1);
  const clientRest = remaining.filter((s) => s.section === "client");
  const studioFeatures = remaining.filter((s) => s.section === "studio");

  return (
    <div>
      <FeaturesHero signUpHref={signUpHref} signedIn={signedIn} />
      <OverviewSection />
      <WhySwitchSection />
      <HowItWorksSection />
      <FlagshipBand signUpHref={signUpHref} signedIn={signedIn} />

      <div id="features">
        <div className="relative overflow-hidden border-y border-slate-200/70 bg-white py-14 sm:py-16">
          <VerticalSpine />
          <div className="marketing-container relative">
            <SectionHeader
              pill={featureSectionHeaders.client.eyebrow}
              title={featureSectionHeaders.client.title}
              description={featureSectionHeaders.client.description}
            />
          </div>
        </div>

        {clientRest.map((spotlight, i) => (
          <FeatureSpread key={spotlight.id} spotlight={spotlight} index={i} />
        ))}

        <div className="relative overflow-hidden border-y border-slate-200/70 bg-[#FFFCF2] py-14 sm:py-16">
          <VerticalSpine />
          <div className="marketing-container relative">
            <SectionHeader
              pill={featureSectionHeaders.studio.eyebrow}
              title={featureSectionHeaders.studio.title}
              description={featureSectionHeaders.studio.description}
            />
          </div>
        </div>

        {studioFeatures.map((spotlight, i) => (
          <FeatureSpread
            key={spotlight.id}
            spotlight={spotlight}
            index={i + clientRest.length}
          />
        ))}
      </div>

      <FeaturesTestimonial />
      <MarketingFaqSection id="features-faq" showEmailFooter className="bg-[#FFFCF2]" />
      <ClosingCta signUpHref={signUpHref} signedIn={signedIn} />
    </div>
  );
}
