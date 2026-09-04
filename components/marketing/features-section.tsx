"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ShowcaseCoverPreview,
  ShowcasePhonePreview,
} from "@/components/marketing/showcase-cover-preview";
import { SectionHeading } from "@/components/marketing/egg/SectionHeading";
import {
  featureSectionHeaders,
  featureSpotlights,
  featureWhySwitch,
  featureWorkflowSteps,
  type FeatureSpotlight,
} from "@/lib/marketing/features-content";
import { APP_NAME } from "@/lib/branding";
import { MarketingCornerCta } from "@/components/marketing/marketing-corner-cta";
import { useMarketingAuthCta } from "@/lib/marketing/use-photographer-signed-in";
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
  return <MarketingCornerCta href={href}>{children}</MarketingCornerCta>;
}

function FeaturesHero({
  signUpHref,
  primaryCtaLabel,
}: {
  signUpHref: string;
  primaryCtaLabel: string;
}) {
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

      <div className="relative z-10 mx-auto grid min-h-[calc(100svh-5.5rem)] max-w-7xl grid-cols-1 items-stretch px-5 pt-24 pb-10 sm:px-8 sm:pt-28 sm:pb-12 lg:grid-cols-12 lg:px-12 lg:pb-14 xl:max-w-[90rem] xl:px-14">
        <div className="relative flex flex-col lg:col-span-6 xl:col-span-5">
          {/* Keep the white headline fully inside the photo band */}
          <div className="flex min-h-[calc(58svh-5.5rem)] flex-col justify-end pb-6 sm:min-h-[calc(56svh-5.5rem)] sm:pb-8 lg:pb-10">
            <h1
              className="animate-landing-fade-up max-w-[16ch] font-display text-[clamp(2.35rem,6.2vw,4.5rem)] font-medium leading-[0.98] tracking-[-0.03em] text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.35)]"
              style={{ animationDelay: "0.08s" }}
            >
              Galleries, proofing, and studio tools in one place
            </h1>
          </div>

          <div
            className="max-w-sm animate-landing-fade-up pt-8 sm:pt-10"
            style={{ animationDelay: "0.22s" }}
          >
            <p className="text-sm leading-relaxed text-[#55001F]/90 sm:text-[0.95rem]">
              {APP_NAME} replaces zip-file delivery and spreadsheet chase with client galleries,
              share links, selections, bookings, CRM, and income tracking — starting with a 30-day
              free trial. Premium unlocks Gallery AI, a studio team, and shared shoots with other
              photographers.
            </p>

            <div className="mt-7">
              <HeroCornerCta href={signUpHref}>
                {primaryCtaLabel}
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
            Share links
            <br />
            Client selections
          </p>
        </div>
      </div>
    </section>
  );
}

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

/** Matches home / pricing section intros: eyebrow → title → optional lead → hairline. */
function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  light,
  descriptionFullWidth,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  light?: boolean;
  descriptionFullWidth?: boolean;
}) {
  return (
    <Reveal
      className={cn(
        align === "center" && "mx-auto max-w-3xl text-center",
        align === "left" && !descriptionFullWidth && "max-w-2xl",
      )}
    >
      <p
        className={cn(
          "text-[11px] font-medium uppercase tracking-[0.28em]",
          light ? "text-white/55" : "text-slate-400",
        )}
      >
        {eyebrow}
      </p>
      <h2
        className={cn(
          "mt-3 font-display text-[1.65rem] font-normal leading-snug tracking-tight sm:mt-4 sm:text-4xl",
          light ? "text-white" : "text-slate-900",
          align === "center" && "mx-auto max-w-2xl",
          align === "left" && "max-w-lg",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-3 text-sm leading-relaxed sm:text-base",
            light ? "text-white/70" : "text-slate-600",
            descriptionFullWidth
              ? "max-w-none"
              : align === "center"
                ? "mx-auto max-w-xl"
                : "max-w-lg",
          )}
        >
          {description}
        </p>
      ) : null}
      <div
        aria-hidden
        className={cn(
          "mt-5 h-px w-10",
          light ? "bg-white/25" : "bg-slate-200",
          align === "center" && "mx-auto",
        )}
      />
    </Reveal>
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
    <div className="relative mx-auto aspect-square w-full max-w-[min(100%,36rem)] sm:max-w-[min(100%,40rem)] lg:max-w-none">
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

      <div className="absolute inset-[12%] overflow-hidden rounded-full bg-slate-100 shadow-[0_28px_64px_-28px_rgba(15,23,42,0.35)] ring-1 ring-slate-900/8">
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
              sizes="(max-width: 1024px) 640px, 720px"
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
    <section id="why-switch" className="relative scroll-mt-24 bg-white">
      <VerticalSpine />

      {/* Scroll track — pins the dial while steps advance */}
      <div
        ref={trackRef}
        className="relative bg-white"
        style={{ height: reducedMotion ? "auto" : `${stepCount * 100}vh` }}
      >
        <div
          className={cn(
            "flex items-center bg-white",
            reducedMotion
              ? "relative py-12"
              : "sticky top-0 min-h-svh py-10 lg:h-svh lg:py-0",
          )}
        >
          <div className="marketing-container relative grid w-full items-center gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
            <div className="relative max-w-md">
              <div className="relative min-h-[11.5rem] sm:min-h-[13rem]">
                {featureWhySwitch.map((item, i) => {
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
                      <h3 className="font-display text-[clamp(1.85rem,3.5vw,2.75rem)] font-medium leading-[1.08] tracking-tight text-slate-900">
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

            <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
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
    </section>
  );
}

const howItWorksTabs = featureWorkflowSteps.map((step, i) => {
  const images = [
    {
      src: "/images/how-it-work/photo_2026-08-22_19-10-57.jpg",
      alt: "Uploading a client gallery",
    },
    {
      src: "/images/how-it-work/photo_2026-08-22_19-11-58.jpg",
      alt: "Protected gallery previews",
    },
    {
      src: "/images/how-it-work/IMG_7292.JPG",
      alt: "Sharing a gallery link",
    },
    {
      src: "/images/how-it-work/IMG_7351-2.JPG",
      alt: "Client proofing selections",
    },
    {
      src: "/images/gallery-covers/WOED0075.JPG",
      alt: "Delivering final photographs",
    },
  ] as const;
  const image = images[i] ?? images[0]!;

  return {
    id: step.label.toLowerCase(),
    label: step.label,
    title: step.label,
    body: step.description,
    image: image.src,
    alt: image.alt,
  };
});

const howEaseOut = [0.22, 1, 0.36, 1] as const;

function HowItWorksPanel({
  tab,
  index,
  onActive,
}: {
  tab: (typeof howItWorksTabs)[number];
  index: number;
  onActive: (index: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, {
    amount: 0.45,
    margin: "-15% 0px -15% 0px",
  });

  useEffect(() => {
    if (inView) onActive(index);
  }, [inView, index, onActive]);

  return (
    <div
      id={`how-${tab.id}`}
      ref={ref}
      className="grid min-h-[68vh] items-center gap-8 py-2 lg:grid-cols-[1fr_1.05fr] lg:gap-12 xl:gap-16"
    >
      <motion.div
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.35 }}
        transition={{ duration: 0.65, ease: howEaseOut }}
        className="relative mx-auto aspect-[4/5] w-full max-h-[62vh] overflow-hidden rounded-[1.75rem] bg-white/5"
      >
        <Image
          src={tab.image}
          alt={tab.alt}
          fill
          sizes="(max-width: 1024px) 100vw, 40vw"
          className="object-cover object-[center_18%]"
          priority={index === 0}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.4 }}
        transition={{ duration: 0.55, delay: 0.06, ease: howEaseOut }}
        className="max-w-md"
      >
        <p className="mb-3 text-xs tracking-[0.14em] uppercase text-white/45">
          Step {String(index + 1).padStart(2, "0")}
        </p>
        <h3 className="mb-5 font-sans text-2xl font-semibold leading-tight tracking-[-0.02em] text-white md:text-[2.35rem]">
          {tab.title}
        </h3>
        <p className="text-lg leading-relaxed text-white/65">{tab.body}</p>
      </motion.div>
    </div>
  );
}

function HowItWorksSection() {
  const [active, setActive] = useState(0);

  const scrollToTab = (i: number) => {
    document
      .getElementById(`how-${howItWorksTabs[i]!.id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <section
      id="how-it-works"
      className="relative scroll-mt-24 text-white"
      style={{ backgroundColor: "#55001F" }}
    >
      <div className="marketing-container pt-16 md:pt-24 pb-10 md:pb-14">
        <SectionHeading
          tone="dark"
          align="left"
          className="!mx-0 !max-w-4xl !text-left [&_h2]:md:text-[2.6rem] [&_h2]:lg:text-[2.8rem]"
          label="How it works"
          title="Five steps from shoot to delivery"
          body="One gallery workspace. One share link. Proofing and delivery without the zip-file chase."
        />
      </div>

      <div className="marketing-container pb-24 md:pb-32">
        <div className="mb-8 flex flex-wrap gap-2 lg:hidden">
          {howItWorksTabs.map((tab, i) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => scrollToTab(i)}
              className={`rounded-full px-3.5 py-1.5 text-sm transition ${
                active === i
                  ? "bg-white text-[#55001F]"
                  : "bg-white/10 text-white/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid gap-10 lg:grid-cols-[0.72fr_2.1fr] lg:gap-12 xl:gap-16">
          <aside className="relative hidden lg:block">
            <nav
              aria-label="How it works"
              className="sticky top-[28vh] flex flex-col"
            >
              {howItWorksTabs.map((tab, i) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => scrollToTab(i)}
                  className={`border-b border-white/15 py-5 text-left text-lg transition-colors duration-300 ${
                    active === i
                      ? "text-white"
                      : "text-white/35 hover:text-white/60"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="flex flex-col gap-8 md:gap-10 lg:gap-12">
            {howItWorksTabs.map((tab, i) => (
              <HowItWorksPanel
                key={tab.id}
                tab={tab}
                index={i}
                onActive={setActive}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FlagshipBand({
  signUpHref,
  primaryCtaLabel,
}: {
  signUpHref: string;
  primaryCtaLabel: string;
}) {
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
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/55">
            {flagship.eyebrow}
          </p>
          <h2 className="mt-3 max-w-lg font-display text-[1.65rem] font-normal leading-snug tracking-tight text-white sm:mt-4 sm:text-4xl">
            {flagship.headline}
          </h2>
          <div className="mt-5 h-px w-10 bg-white/25" aria-hidden />
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">
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
            <MarketingCornerCta href={signUpHref} tone="inverse">
              {primaryCtaLabel}
            </MarketingCornerCta>
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
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-slate-400">
            {spotlight.eyebrow}
          </p>
          <h2 className="mt-3 max-w-lg font-display text-[1.65rem] font-normal leading-snug tracking-tight text-slate-900 sm:mt-4 sm:text-4xl">
            {spotlight.headline}
          </h2>
          <div className="mt-5 h-px w-10 bg-slate-200" aria-hidden />
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-slate-600 sm:text-base">
            {spotlight.description}
          </p>
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

function ClosingCta({
  signUpHref,
  primaryCtaLabel,
}: {
  signUpHref: string;
  primaryCtaLabel: string;
}) {
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
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/55">
                Get started
              </p>
              <h2 className="mx-auto mt-4 max-w-2xl font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Your next client deserves better than a zip file.
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/75">
                Try {APP_NAME} free for 30 days — 3 galleries, 5 GB storage, share links, selections,
                bookings, and the core studio tools. Upgrade for SMS and video; Premium adds Gallery AI,
                a studio team, and photographer collaboration.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <MarketingCornerCta href={signUpHref} tone="inverse">
                  {primaryCtaLabel}
                </MarketingCornerCta>
                <MarketingCornerCta
                  href="/pricing"
                  tone="secondary"
                  showSquare={false}
                  className="border-white/25 text-white hover:border-white/40 hover:bg-white/10"
                >
                  Compare plans
                </MarketingCornerCta>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function FeaturesSection() {
  const { signUpHref, primaryCtaLabel } = useMarketingAuthCta();

  const remaining = featureSpotlights.slice(1);
  const clientRest = remaining.filter((s) => s.section === "client");
  const studioFeatures = remaining.filter((s) => s.section === "studio");

  return (
    <div>
      <FeaturesHero signUpHref={signUpHref} primaryCtaLabel={primaryCtaLabel} />
      <WhySwitchSection />
      <HowItWorksSection />
      <FlagshipBand signUpHref={signUpHref} primaryCtaLabel={primaryCtaLabel} />

      <div id="features">
        <div className="relative overflow-hidden border-y border-slate-200/70 bg-white py-14 sm:py-16">
          <VerticalSpine />
          <div className="marketing-container relative">
            <SectionHeader
              eyebrow={featureSectionHeaders.client.eyebrow}
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
              eyebrow={featureSectionHeaders.studio.eyebrow}
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

      <ClosingCta signUpHref={signUpHref} primaryCtaLabel={primaryCtaLabel} />
    </div>
  );
}
