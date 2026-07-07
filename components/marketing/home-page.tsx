"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Headset,
  Layers,
  Menu,
  Play,
  ThumbsUp,
  X,
} from "lucide-react";
import { ShowcaseCoverPreview, ShowcasePhonePreview } from "@/components/marketing/showcase-cover-preview";
import { ShowcaseSection } from "@/components/marketing/showcase-section";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingSocialIconLinks } from "@/components/marketing/marketing-social-links";
import { marketingSignInHref, marketingSignUpHref } from "@/lib/marketing/auth-links";
import { usePhotographerSignedIn } from "@/lib/marketing/use-photographer-signed-in";
import { APP_NAME } from "@/lib/branding";
import { cn } from "@/lib/utils";

const aboutUsCopy = {
  eyebrow: "Built by photographers",
  title: "About Us",
  lead: "One studio for galleries, contracts, invoices, and delivery — polished enough to match the work you deliver.",
  paragraphs: [
    "We were tired of juggling a dozen disconnected tools. Gidtransfer is the place we wished existed: branded, seamless, and built for how studios actually work.",
    "Today, photographers worldwide share galleries on their own domain, run proofing in minutes, and get paid — without a generic upload link or a platform badge on their brand.",
  ],
  cta: "Learn more",
  ctaHref: "/features",
} as const;

const whyChooseGido = {
  title: "Why photographers choose Gidtransfer",
  reasons: [
    {
      title: "Galleries that feel like an exhibition",
      description:
        "Magazine layouts, mobile lightboxes, and a grandma-proof download flow - every delivery becomes a brand moment clients want to share.",
      icon: ThumbsUp,
    },
    {
      title: "Bookings to payment, one dashboard",
      description:
        "Contracts, invoices, reminders, and gallery delivery in one place",
      icon: Headset,
    },
    {
      title: "Your work, your rules",
      description:
        "Watermarked previews, download limits, and pay-to-unlock finals. You keep what you earn.",
      icon: Layers,
    },
  ],
} as const;

const aboutSectionImages = [
  {
    src: "/images/login_image.png",
    alt: "Photographer reviewing images on a laptop",
    withPlay: true,
  },
  {
    src: "/images/client.jpg",
    alt: "Client viewing a photo gallery on a phone",
    withPlay: false,
  },
] as const;

const testimonials = [
  {
    quote:
      "Gidtransfer doesn't just deliver my photos — it delivers my reputation. Clients are blown away by how professional the galleries look, and I love that everything lives on my domain.",
    name: "Ama Boateng",
    role: "Wedding photographer, Accra",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80",
  },
  {
    quote:
      "I started with galleries, then moved bookings and invoicing onto the same platform. Having proofing, contracts, and delivery in one place has genuinely changed how I run my studio.",
    name: "Jules Marin",
    role: "Editorial portraits, Paris",
    avatar:
      "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=900&q=80",
  },
  {
    quote:
      "Locked finals until payment, branded galleries, zero commission on prints. It's the most photographer-shaped tool I've used — and my clients notice the difference immediately.",
    name: "Sade Okafor",
    role: "Studio founder, Lagos",
    avatar:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=900&q=80",
  },
] as const;

function TestimonialsEditorial() {
  const [active, setActive] = useState(0);
  const count = testimonials.length;
  const current = testimonials[active]!;
  const photoFirst = active % 2 === 0;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((i) => (i + 1) % count);
    }, 9000);
    return () => window.clearInterval(timer);
  }, [count]);

  function goTo(next: number) {
    setActive((next + count) % count);
  }

  return (
    <section
      aria-labelledby="testimonials-heading"
      aria-roledescription="carousel"
      className={cn("relative overflow-hidden bg-white py-20 sm:py-28", landingNavOffset)}
    >
      <div className="relative marketing-container">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-slate-400">
            Words from photographers
          </p>
          <h2
            id="testimonials-heading"
            className="mt-3 max-w-lg font-display text-[1.65rem] font-normal leading-snug tracking-tight text-slate-900 sm:mt-4 sm:text-4xl"
          >
            Truly the go-to photographer platform.
          </h2>
          <div className="mt-4 h-px w-10 bg-slate-200" aria-hidden />
        </div>

        <div className="mt-5 sm:mt-8">
          <div
            key={active}
            className={cn(
              "flex animate-landing-fade-up flex-col items-center gap-8 lg:flex-row lg:items-center lg:gap-12 xl:gap-16",
              !photoFirst && "lg:flex-row-reverse",
            )}
          >
            <figure className="relative w-[16rem] shrink-0 sm:w-[18rem] lg:w-[20rem]">
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl shadow-[0_20px_48px_-24px_rgba(85,0,31,0.24)] ring-1 ring-slate-900/8 sm:rounded-2xl">
                <Image
                  src={current.avatar}
                  alt={current.name}
                  fill
                  sizes="(max-width: 640px) 256px, (max-width: 1024px) 288px, 320px"
                  className="object-cover"
                  priority={active === 0}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#55001F]/30 via-transparent to-transparent"
                />
              </div>
              <figcaption className="absolute bottom-3 left-3 rounded-lg bg-white/92 px-3 py-2 shadow-md backdrop-blur-sm">
                <span className="block text-xs font-semibold text-slate-900">{current.name}</span>
                <span className="text-[0.65rem] leading-snug text-slate-500">{current.role}</span>
              </figcaption>
            </figure>

            <div className="flex min-w-0 flex-1 flex-col">
              <blockquote className="font-display text-xl font-normal italic leading-relaxed text-[#55001F] sm:text-2xl lg:text-[1.65rem] xl:text-[1.75rem]">
                &ldquo;{current.quote}&rdquo;
              </blockquote>

              <div className="mt-10 flex items-center justify-between gap-4 border-t border-slate-200/80 pt-8">
                <p className="text-xs tabular-nums text-slate-400">
                  {String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Previous testimonial"
                    onClick={() => goTo(active - 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-[#55001F]/20 hover:text-[#55001F]"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label="Next testimonial"
                    onClick={() => goTo(active + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-[#55001F]/20 hover:text-[#55001F]"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SiteLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/svgs/logo.svg"
      alt={APP_NAME}
      width={691}
      height={801}
      priority
      className={cn("h-10 w-auto transition sm:h-11", className)}
    />
  );
}

function SignInButton({
  href,
  onClick,
  className,
}: {
  href: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-full bg-[#55001F] px-5 text-sm font-medium text-[#D5AE65] transition hover:bg-[#6a0027]",
        className,
      )}
    >
      Sign in
    </Link>
  );
}

function NavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
    >
      {children}
    </a>
  );
}

const heroCopy = {
  tagline:
    "Stunning galleries, smart studio tools, one place to share, deliver, and proof — hosted on your domain, dressed in your brand.",
  headline: ["Your work deserves", "a studio of its own."],
  primaryCta: "Start free",
  secondaryCta: "See the platform",
  trustLine: "30-day trial · Any plan after your trial · Cancel anytime",
} as const;

const heroInset = "px-3 sm:px-4 lg:px-6";
/** Fills the first screen — keep in sync with section bottom padding (pb-3 / sm:pb-4 / lg:pb-5). */
const heroPanelHeight =
  "min-h-[calc(100svh-0.75rem)] sm:min-h-[calc(100svh-1rem)] lg:min-h-[calc(100svh-1.25rem)]";
const headerInset = "px-5 sm:px-8 md:px-10 lg:px-12 xl:px-14";
const CTA_MEDIA = "/gifs/CTA_gif.mp4";
const CTA_GALLERY_PREVIEW = {
  src: "/images/gallery-covers/website_3-min.jpg",
  alt: "Editorial portrait gallery cover",
  title: "Sarah & James",
} as const;
/** Fixed nav pill + top inset — keep in sync with scroll-padding-top in globals.css */
const landingNavOffset = "scroll-mt-24";

/** Hand-drawn underline that draws itself in once the hero mounts. */
function HandUnderline({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 18"
      fill="none"
      aria-hidden
      preserveAspectRatio="none"
      className={cn("pointer-events-none absolute left-0 right-0 h-3 w-full", className)}
    >
      <path
        d="M3 11C50 4 105 4 158 8C212 12 263 12 317 6"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        className="animate-landing-draw"
        style={{ ["--draw-length" as string]: "330" }}
      />
    </svg>
  );
}

export function HomePageClient() {
  const signedIn = usePhotographerSignedIn();
  const signInHref = signedIn ? marketingSignInHref() : "/login";
  const signUpHref = signedIn ? marketingSignUpHref() : "/login?screen=signup";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const [inHero, setInHero] = useState(true);
  const heroRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  // Nav pill: always visible on hero; past hero it hides on scroll-down and reappears on scroll-up.
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const heroEl = heroRef.current;
      const heroBottom = heroEl
        ? heroEl.offsetTop + heroEl.offsetHeight - 96
        : window.innerHeight * 0.8;
      const nowInHero = y < heroBottom;

      setInHero(nowInHero);

      if (nowInHero) {
        setNavVisible(true);
      } else if (y > lastScrollY.current + 4) {
        setNavVisible(false);
        setMobileOpen(false);
      } else if (y < lastScrollY.current - 4) {
        setNavVisible(true);
      }

      lastScrollY.current = y;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const navPillClassName =
    "items-center gap-6 rounded-full bg-white px-3 py-2 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/8 lg:gap-7 lg:px-4 lg:py-2.5";

  const mobileMenuButtonClassName =
    "inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-900 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/8 transition hover:bg-slate-50";

  return (
    <div className="relative min-h-screen overflow-x-clip bg-paper text-slate-800">
      {/* Decorative background — patterns + a few solid geometric shapes (no big gradient orbs). */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute inset-0 bg-noise opacity-[0.08] mix-blend-multiply" />
      </div>

      {/* Sticky nav — hides on scroll-down past hero, reappears on scroll-up (Arkitect-style). */}
      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 top-0 z-40 transition-transform duration-300 ease-out",
          navVisible ? "translate-y-0" : "-translate-y-[140%]",
        )}
      >
        <div
          className={cn(
            "relative flex justify-center pt-5 sm:pt-6 lg:pt-7",
            headerInset,
          )}
        >
          <nav
            className={cn("pointer-events-auto hidden md:flex", navPillClassName)}
            aria-label="Primary"
          >
            <NavLink href="/features">Features</NavLink>
            <NavLink href="/pricing">Pricing</NavLink>
            <NavLink href="/contact">Contact</NavLink>
            <SignInButton href={signInHref} />
          </nav>

          {!inHero && (
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              className={cn(
                "pointer-events-auto absolute right-0 top-5 sm:top-6 lg:top-7 md:hidden",
                mobileMenuButtonClassName,
              )}
            >
              {mobileOpen ? (
                <X className="h-4 w-4" aria-hidden />
              ) : (
                <Menu className="h-4 w-4" aria-hidden />
              )}
            </button>
          )}
        </div>

        <div
          id="mobile-nav"
          className={cn(
            headerInset,
            "pointer-events-auto md:hidden",
            "transition-[max-height,opacity,transform] duration-300 ease-out",
            mobileOpen && !inHero
              ? "max-h-96 translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-1 opacity-0 max-h-0",
          )}
        >
          <nav
            className="overflow-hidden rounded-3xl bg-white p-2 text-sm shadow-lg ring-1 ring-slate-900/8"
            aria-label="Mobile"
          >
            {[
              ["/features", "Features"],
              ["/pricing", "Pricing"],
              ["/contact", "Contact"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between rounded-2xl px-4 py-3 text-slate-600 transition hover:bg-slate-900/5 hover:text-slate-900"
              >
                {label}
                <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden />
              </a>
            ))}
            <SignInButton
              href={signInHref}
              onClick={() => setMobileOpen(false)}
              className="mt-1 h-11 w-full rounded-2xl"
            />
          </nav>
        </div>
      </div>

      <main className="relative z-10">
        {/* ============================== HERO (Arkitect-inspired) ============================== */}
        <section
          ref={heroRef}
          className={cn("relative bg-[#FFFCF2] pb-3 sm:pb-4 lg:pb-5", heroInset)}
        >
          <div
            className={cn(
              "relative isolate w-full overflow-hidden rounded-[1.75rem] sm:rounded-[2rem] lg:rounded-[2.5rem]",
              heroPanelHeight,
            )}
          >
            {/* Logo + social scroll with the hero — not sticky like the nav pill. */}
            <div className="absolute inset-x-0 top-0 z-20 px-4 pt-5 sm:px-6 sm:pt-6 lg:px-8 lg:pt-7">
              <div className="flex items-center justify-between gap-3">
                <Link href="/" aria-label={`${APP_NAME} home`}>
                  <SiteLogo />
                </Link>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <MarketingSocialIconLinks />

                  <button
                    type="button"
                    onClick={() => setMobileOpen((v) => !v)}
                    aria-expanded={mobileOpen}
                    aria-controls="mobile-nav-hero"
                    aria-label={mobileOpen ? "Close menu" : "Open menu"}
                    className={cn("md:hidden", mobileMenuButtonClassName)}
                  >
                    {mobileOpen ? (
                      <X className="h-4 w-4" aria-hidden />
                    ) : (
                      <Menu className="h-4 w-4" aria-hidden />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div
              id="mobile-nav-hero"
              className={cn(
                "absolute inset-x-4 top-[4.25rem] z-20 sm:inset-x-6 md:hidden",
                "transition-[max-height,opacity,transform] duration-300 ease-out",
                mobileOpen && inHero
                  ? "max-h-96 translate-y-0 opacity-100"
                  : "pointer-events-none max-h-0 -translate-y-1 opacity-0",
              )}
            >
              <nav
                className="pointer-events-auto overflow-hidden rounded-3xl bg-white p-2 text-sm shadow-lg ring-1 ring-slate-900/8"
                aria-label="Mobile"
              >
                {[
                  ["/features", "Features"],
                  ["/pricing", "Pricing"],
                  ["/contact", "Contact"],
                ].map(([href, label]) => (
                  <a
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between rounded-2xl px-4 py-3 text-slate-600 transition hover:bg-slate-900/5 hover:text-slate-900"
                  >
                    {label}
                    <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden />
                  </a>
                ))}
                <SignInButton
                  href={signInHref}
                  onClick={() => setMobileOpen(false)}
                  className="mt-1 h-11 w-full rounded-2xl"
                />
              </nav>
            </div>

            <div aria-hidden className="absolute inset-0 overflow-hidden">
              <div className="animate-landing-ken-burns absolute inset-0 h-full w-full">
                <Image
                  src="/images/hero.png"
                  alt="Photographer workspace with cameras, lenses, and editing monitor"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1536px) 100vw, 1536px"
                  className="object-cover object-[center_32%] sm:object-[center_38%] lg:object-[center_42%]"
                />
              </div>
            </div>

            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-black/5"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,transparent_0%,rgba(0,0,0,0.35)_100%)]"
            />

            <div
              className={cn(
                "relative z-10 flex w-full flex-col justify-end px-5 pb-10 pt-24 sm:px-8 sm:pb-14 sm:pt-28 lg:px-12 lg:pb-16 lg:pt-32",
                heroPanelHeight,
              )}
            >
              <div className="max-w-2xl">
                <p
                  className="animate-landing-fade-up text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D5AE65]/90"
                  style={{ animationDelay: "0.08s" }}
                >
                  {APP_NAME}
                </p>
                <h1
                  className="mt-3 animate-landing-fade-up font-display text-[clamp(1.85rem,4.2vw,3.25rem)] font-medium leading-[1.08] tracking-[-0.02em] text-white"
                  style={{ animationDelay: "0.15s" }}
                >
                  {heroCopy.headline[0]}
                  <br />
                  {heroCopy.headline[1]}
                </h1>

                <p
                  className="mt-4 max-w-md animate-landing-fade-up text-sm leading-relaxed text-white/55 sm:max-w-lg sm:text-base"
                  style={{ animationDelay: "0.28s" }}
                >
                  {heroCopy.tagline}
                </p>

                <div
                  className="mt-8 flex w-full max-w-md flex-col gap-3 animate-landing-fade-up sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:gap-4"
                  style={{ animationDelay: "0.4s" }}
                >
                  <Link
                    href={signUpHref}
                    className="inline-flex items-center justify-center rounded-xl bg-[#55001F] px-6 py-3 text-sm font-medium tracking-wide text-white transition hover:bg-[#440019] sm:w-auto"
                  >
                    {heroCopy.primaryCta}
                  </Link>
                  <a
                    href="#showcase"
                    className="inline-flex items-center justify-center rounded-xl border border-[#D5AE65]/60 px-6 py-3 text-sm font-medium tracking-wide text-[#D5AE65] transition hover:border-[#D5AE65] hover:bg-[#D5AE65]/10 sm:w-auto"
                  >
                    {heroCopy.secondaryCta}
                  </a>
                </div>
                <p
                  className="mt-5 animate-landing-fade-up text-xs font-medium tracking-wide text-white/45 sm:text-sm"
                  style={{ animationDelay: "0.52s" }}
                >
                  {heroCopy.trustLine}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================= ABOUT + WHY CHOOSE ================= */}
        <section
          id="benefits"
          className={cn(
            "relative z-10 bg-[#FFFCF2] pb-14 pt-16 sm:pb-20 sm:pt-24",
            landingNavOffset,
          )}
        >
          <div className="marketing-container w-full">
            <div className="grid w-full grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-3 lg:items-center lg:gap-0">
              {/* Left — joined image + video stack */}
              <div className="order-2 flex w-full lg:order-none">
                <div className="grid w-full grid-cols-2 gap-2 overflow-hidden rounded-2xl sm:gap-2.5 lg:flex lg:min-h-[32rem] lg:flex-col lg:gap-0">
                  {aboutSectionImages.map(({ src, alt, withPlay }) => (
                    <div
                      key={alt}
                      className="relative aspect-[4/5] overflow-hidden sm:aspect-[3/4] lg:min-h-0 lg:flex-1 lg:aspect-auto"
                    >
                      <Image
                        src={src}
                        alt={alt}
                        fill
                        sizes="(max-width: 1024px) 50vw, 30vw"
                        className="object-cover"
                      />
                      {withPlay ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#55001F]/30">
                          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-[#55001F] shadow-lg sm:h-14 sm:w-14">
                            <Play className="ml-1 h-5 w-5 fill-current sm:h-6 sm:w-6" aria-hidden />
                          </span>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              {/* Center — About Us card (overlaps neighbours on desktop) */}
              <div className="relative z-10 order-1 w-full lg:order-none lg:-ml-8 lg:w-[calc(100%+4rem)] xl:-ml-10 xl:w-[calc(100%+5rem)]">
                <div className="flex w-full flex-col justify-center gap-6 rounded-2xl bg-[#55001F] p-6 shadow-[0_24px_60px_-20px_rgba(85,0,31,0.35)] sm:gap-8 sm:p-8 lg:min-h-[44rem] lg:p-10">
                  <div>
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[#D5AE65] sm:text-xs">
                      {aboutUsCopy.eyebrow}
                    </p>
                    <h2 className="mt-2 font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-white sm:mt-2.5 sm:text-4xl">
                      {aboutUsCopy.title}
                    </h2>
                    <p className="mt-3 font-display text-[1.05rem] font-medium leading-snug text-white/95 sm:mt-4 sm:text-xl">
                      {aboutUsCopy.lead}
                    </p>
                    <div className="mt-5 space-y-4 border-t border-white/10 pt-5 sm:mt-6 sm:space-y-5 sm:pt-6">
                      {aboutUsCopy.paragraphs.map((paragraph) => (
                        <p
                          key={paragraph.slice(0, 32)}
                          className="text-[0.9375rem] leading-[1.7] text-white/75 sm:text-[0.95rem]"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                  <a
                    href={aboutUsCopy.ctaHref}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#D5AE65] px-5 py-3 text-sm font-semibold text-[#55001F] transition hover:bg-[#e0be75] sm:w-fit sm:py-2.5"
                  >
                    {aboutUsCopy.cta}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </a>
                </div>
              </div>

              {/* Right — Why photographers choose Gido */}
              <div className="order-3 flex w-full lg:order-none lg:pl-4 xl:pl-5">
                <div className="flex w-full flex-col justify-center rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_-12px_rgba(85,0,31,0.12)] sm:p-8 lg:min-h-[32rem] lg:p-10">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[#D5AE65] sm:text-xs">
                    Why Gidtransfer
                  </p>
                  <h2 className="mt-2 font-display text-xl font-semibold leading-snug tracking-tight text-[#55001F] sm:text-[1.65rem]">
                    {whyChooseGido.title}
                  </h2>
                  <ul className="mt-6 divide-y divide-slate-100 sm:mt-8 sm:space-y-0">
                    {whyChooseGido.reasons.map(({ title, description, icon: Icon }) => (
                      <li key={title} className="flex items-start gap-3.5 py-5 first:pt-0 last:pb-0 sm:gap-4 sm:py-6">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D5AE65] text-white sm:h-11 sm:w-11 sm:rounded-lg">
                          <Icon className="h-[1.125rem] w-[1.125rem] sm:h-5 sm:w-5" aria-hidden />
                        </span>
                        <div className="min-w-0 pt-0.5">
                          <h3 className="text-[0.9375rem] font-semibold leading-snug text-slate-900 sm:text-base">
                            {title}
                          </h3>
                          <p className="mt-1.5 text-[0.875rem] leading-relaxed text-slate-600 sm:text-sm">
                            {description}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Soft fade into showcase — avoids a hard horizontal cut */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -bottom-px h-24 bg-gradient-to-b from-transparent to-[#FFFCF2] sm:h-32"
          />
        </section>

        <ShowcaseSection embedded />

        <TestimonialsEditorial />

        {/* =============================== CTA BANNER =============================== */}
        <section className="relative bg-[#FFFCF2] pt-20 pb-16 sm:pt-24 sm:pb-20 lg:pb-24">
          <div className="marketing-container">
            <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_24px_60px_-24px_rgba(85,0,31,0.18)] sm:rounded-[2.5rem]">
              <div className="relative overflow-hidden px-4 pb-6 pt-8 sm:px-10 sm:pb-16 sm:pt-10 lg:px-14 lg:pb-20 lg:pt-12">
                <div className="relative z-10 mx-auto w-full max-w-3xl pb-28 sm:pb-32 lg:max-w-4xl lg:pb-36">
                  <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_28px_60px_-28px_rgba(15,23,42,0.35)]">
                    <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/90 px-3 py-2 sm:px-4">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[#ff5f57]" />
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[#febc2e]" />
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[#28c840]" />
                      <span className="mx-auto min-w-0 truncate px-2 text-[9px] font-medium tracking-wide text-slate-400 sm:text-[10px]">
                        yourstudio.com/gallery/sarah-james
                      </span>
                    </div>
                    <div className="relative aspect-[4/3] bg-slate-100 sm:aspect-[16/10]">
                      <ShowcaseCoverPreview
                        {...CTA_GALLERY_PREVIEW}
                        coverFrame="editorial-card"
                        coverColor="#f4f1ea"
                      />
                    </div>
                  </div>

                  <div
                    className="absolute bottom-0 right-2 z-20 w-[min(40vw,8.75rem)] overflow-hidden rounded-[1.35rem] border-[3px] border-white bg-white shadow-[0_16px_36px_-14px_rgba(15,23,42,0.42)] sm:right-5 sm:w-[min(28vw,9.25rem)] lg:right-8 lg:max-w-[10rem]"
                    aria-hidden
                  >
                    <div className="relative aspect-[9/19] bg-slate-950">
                      <ShowcasePhonePreview
                        src={CTA_GALLERY_PREVIEW.src}
                        alt={CTA_GALLERY_PREVIEW.alt}
                        title={CTA_GALLERY_PREVIEW.title}
                        coverColor="#1e3a5f"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden border-t border-white/10 px-6 py-10 text-center sm:px-10 sm:py-12 lg:px-14 lg:py-14">
                <div aria-hidden className="pointer-events-none absolute inset-0">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 h-full w-full scale-105 object-cover object-center"
                    src={CTA_MEDIA}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/40 to-black/25" />
                  <div className="absolute inset-0 bg-noise opacity-[0.08] mix-blend-overlay" />
                </div>

                <div className="relative z-10">
                <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/55">
                  Try it with your work
                </p>
                <h2 className="mx-auto mt-4 max-w-2xl font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Start using {APP_NAME}{" "}
                  <span className="relative inline-block whitespace-nowrap text-[#D5AE65]">
                    today
                    <HandUnderline className="-bottom-2 text-[#D5AE65]" />
                  </span>
                  , for free.
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/75">
                  Upload your photos, run client proofing, and share a gallery link your
                  clients will actually want to open.
                </p>

                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    href={signUpHref}
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#55001F] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_30px_-12px_rgba(85,0,31,0.55)] transition hover:bg-[#440019] sm:w-auto"
                  >
                    {signedIn ? "Open studio" : "Start free"}
                    {!signedIn ? (
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                    ) : null}
                  </Link>
                  <Link
                    href="/features"
                    className="inline-flex w-full items-center justify-center rounded-xl border border-[#D5AE65]/80 px-6 py-3.5 text-sm font-semibold text-[#D5AE65] transition hover:border-[#D5AE65] hover:bg-[#D5AE65]/10 sm:w-auto"
                  >
                    Explore features
                  </Link>
                </div>

                <p className="mt-5 text-xs font-medium tracking-wide text-white/50 sm:text-sm">
                  30-day trial · No credit card · Upgrade when you need to
                </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
