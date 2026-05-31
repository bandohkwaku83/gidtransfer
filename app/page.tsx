"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  Compass,
  Crown,
  Film,
  Heart,
  Layers,
  Lock,
  Menu,
  Palette,
  Quote,
  ShoppingBag,
  Star,
  Sun,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { getAuthToken } from "@/lib/auth-demo";
import { cn } from "@/lib/utils";

const heroCollage = [
  {
    src: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    alt: "Wedding ceremony aisle in soft light",
    label: "Wedding, Mara & Kofi",
  },
  {
    src: "https://images.unsplash.com/photo-1502635385003-ee1e6a1a742d?auto=format&fit=crop&w=900&q=80",
    alt: "Studio portrait of a smiling woman",
    label: "Portrait session",
  },
  {
    src: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=900&q=80",
    alt: "Couple silhouette at golden hour by water",
    label: "Sea & sky engagement",
  },
] as const;

const marqueePhotos = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=70",
  "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=600&q=70",
  "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=600&q=70",
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=600&q=70",
  "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=600&q=70&sat=-30",
  "https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&w=600&q=70",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=70",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=70",
] as const;

const benefits = [
  {
    title: "Galleries clients actually open",
    description:
      "Magazine-style layouts, mobile-perfect lightboxes, and a guided selection flow that turns delivery into a moment they want to share.",
    icon: Layers,
  },
  {
    title: "Bookings to finals on autopilot",
    description:
      "Quotes, contracts, invoices, reminders, and gallery delivery in one dashboard so admin stays in one place while you shoot.",
    icon: Zap,
  },
  {
    title: "Your IP, your rules",
    description:
      "Watermarked previews, download limits, and pay-to-unlock finals keep every frame on your terms, from preview to print.",
    icon: Lock,
  },
  {
    title: "A studio that feels like yours",
    description:
      "Custom domain, brand kit, and fonts on every gallery. No generic upload link, no “Powered by” footer.",
    icon: Palette,
  },
] as const;

const workflowSteps = [
  {
    eyebrow: "01. Upload & cull",
    title: "From the card reader to your workspace",
    body:
      "Drag in RAW or JPEG, let smart culling pre-sort the keepers, and tag every shoot with the venue, vendor, and mood so context never goes missing.",
    image:
      "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=1200&q=80",
    alt: "Photographer behind a camera at a wedding ceremony",
    icon: Camera,
    bullets: [
      "Drag-and-drop RAW or JPEG ingest",
      "Smart culling + auto-reject duplicates",
      "Per-client moodboards & shoot notes",
    ],
  },
  {
    eyebrow: "02. Proof & approve",
    title: "Selection that takes minutes, not weeks",
    body:
      "Send a branded share link. Clients mark favourites, comment on images, and submit a final selection, often in one sitting.",
    image:
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1200&q=80",
    alt: "Couple looking at a photograph together",
    icon: Heart,
    bullets: [
      "Heart-rating + per-image comments",
      "Guided wizard with selection limits",
      "Live progress visible in your dashboard",
    ],
  },
  {
    eyebrow: "03. Deliver & get paid",
    title: "Branded, payment-aware delivery",
    body:
      "Lock finals behind invoices, watermark previews, send downloads to clients or vendors, and push prints to the lab, all from your domain.",
    image:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
    alt: "Bridal celebration in golden evening light",
    icon: Crown,
    bullets: [
      "Share-link galleries on your domain",
      "Pay-to-unlock finals & lab-fulfilled prints",
      "Watermarks, download limits & expiring links",
    ],
  },
] as const;

const showcaseGrid = [
  {
    src: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80",
    alt: "Bride walking down aisle",
    tag: "Wedding",
    span: "lg:col-span-2 lg:row-span-2 aspect-[5/6]",
  },
  {
    src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
    alt: "Portrait of a woman against neutral backdrop",
    tag: "Portrait",
    span: "aspect-square",
  },
  {
    src: "https://images.unsplash.com/photo-1505816014357-96b5ff457e9a?auto=format&fit=crop&w=900&q=80",
    alt: "Engagement couple in the sea breeze",
    tag: "Engagement",
    span: "aspect-[4/3]",
  },
  {
    src: "https://images.unsplash.com/photo-1503424886307-b090341d25d1?auto=format&fit=crop&w=800&q=80",
    alt: "Studio portrait of a man",
    tag: "Editorial",
    span: "aspect-[4/5]",
  },
  {
    src: "https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=900&q=80",
    alt: "Cinematic city couple",
    tag: "Lifestyle",
    span: "aspect-[5/4]",
  },
] as const;

const testimonials = [
  {
    quote:
      "It feels like the studio I always described to clients. Selections are simpler, and finals look like part of my brand, not someone else's product.",
    name: "Ama Boateng",
    role: "Wedding photographer, Accra",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
  },
  {
    quote:
      "The proofing flow alone saved me a full evening per gallery. Clients pick favourites in one sitting, and I get back to actually shooting.",
    name: "Jules Marin",
    role: "Editorial portraits, Paris",
    avatar:
      "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=400&q=80",
  },
  {
    quote:
      "Locked finals until payment, branded galleries, easy hand-offs to my retoucher. Honestly the most photographer-shaped tool I've used.",
    name: "Sade Okafor",
    role: "Studio founder, Lagos",
    avatar:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=400&q=80",
  },
] as const;

const productModules = [
  {
    name: "Client Galleries",
    tagline: "Magazine-grade delivery",
    icon: Layers,
    items: [
      "Brandable layouts (grid, masonry, slideshow)",
      "Mobile-perfect lightbox",
      "Client favourites & social sharing",
      "Passcode-protected access",
    ],
  },
  {
    name: "Selection & Proofing",
    tagline: "Approvals in one sitting",
    icon: Heart,
    items: [
      "Guided selection wizard",
      "Per-image comments & timestamps",
      "Heart-rating + selection limits",
      "Submit & lock with one click",
    ],
  },
  {
    name: "Studio CRM",
    tagline: "Run the business in one place",
    icon: CalendarDays,
    items: [
      "Booking calendar + auto-confirmations",
      "Quotes, contracts & e-signatures",
      "Recurring invoices & reminders",
      "Client timeline with every touch in one place",
    ],
  },
  {
    name: "Brand & Portfolio",
    tagline: "A site that looks like you made it",
    icon: Palette,
    items: [
      "Custom domain (apex or sub)",
      "Brand kit: logo, fonts, colours",
      "Portfolio + collection pages",
      "SEO-ready meta & social cards",
    ],
  },
  {
    name: "Smart Delivery",
    tagline: "Finals on your terms",
    icon: Lock,
    items: [
      "Share-link, no-signup galleries",
      "Watermarked previews",
      "Pay-to-unlock high-res finals",
      "Download limits & expiring links",
    ],
  },
  {
    name: "Print Store",
    tagline: "Sell prints while you shoot",
    icon: ShoppingBag,
    items: [
      "Lab-fulfilled prints, frames & albums",
      "Auto-priced packages & upsells",
      "Crop & frame preview tools",
      "Multi-currency checkout",
    ],
  },
] as const;

const pricingPlans = [
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    description: "Solo photographers shipping their first branded galleries.",
    features: [
      "3 active galleries",
      "50 GB media storage",
      "Share-link delivery and watermarks",
      "Client favourites & basic selection",
      "Lab-fulfilled print store (5% fee)",
      "Email support",
    ],
    cta: "Start with Starter",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$79",
    period: "/month",
    description: "Full-time studios that need brand and business in one place.",
    features: [
      "Everything in Starter, plus:",
      "Unlimited galleries, 500 GB storage",
      "Custom domain & full brand kit",
      "Contracts, e-signatures & invoicing",
      "Selection wizard + per-image comments",
      "Pay-to-unlock finals (0% fee)",
      "Priority support",
    ],
    cta: "Choose Pro",
    highlighted: true,
  },
  {
    name: "Studio",
    price: "$199",
    period: "/month",
    description: "Teams and high-volume studios that need scale.",
    features: [
      "Everything in Pro, plus:",
      "2 TB storage + cold archive",
      "Up to 5 photographer seats",
      "Booking calendar & studio analytics",
      "Lightroom sync + Zapier / webhooks",
      "API access for custom integrations",
      "White-glove onboarding",
    ],
    cta: "Talk to us",
    highlighted: false,
  },
] as const;

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
      className="relative inline-flex items-center rounded-full px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-900/[0.06] hover:text-slate-900"
    >
      {children}
    </a>
  );
}

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

export default function HomePage() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setLoggedIn(Boolean(getAuthToken()));
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  // Toggle frosted-glass treatment on the floating header once the user scrolls
  // past the top — keeps the logo + pill legible over busy content below the hero.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const marqueeRow = [...marqueePhotos, ...marqueePhotos];

  return (
    <div className="relative min-h-screen overflow-x-clip bg-paper text-slate-800">
      {/* Decorative background — patterns + a few solid geometric shapes (no big gradient orbs). */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute inset-0 bg-noise opacity-[0.08] mix-blend-multiply" />

        {/* Filled accent square, gently tilting. */}
        <div
          className="absolute right-12 top-[26rem] h-20 w-20 rotate-12 rounded-2xl bg-amber-300/60 shadow-[0_18px_40px_-18px_rgba(217,119,6,0.4)] animate-landing-wobble"
          style={{ ["--wobble-from" as string]: "8deg", ["--wobble-to" as string]: "16deg" }}
        />
        {/* Dot cluster bottom-left. */}
        <div className="absolute bottom-32 left-10 h-32 w-32 bg-pattern-dots-cream opacity-80" />
        {/* Subtle teal "tape" diagonal strip far right. */}
        <div className="absolute -right-16 top-[60vh] hidden h-32 w-[28rem] -rotate-12 bg-teal-700/[0.06] sm:block" />
      </div>

      {/* Floating header — separate brand button on the left, white pill nav on the right. */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-30">
        <div className="marketing-container pointer-events-auto flex items-center justify-center gap-3 px-3 pt-4 sm:gap-4 sm:pt-5">
          {/* Standalone brand mark — sits flat over the hero; gains a frosted cream backdrop on scroll. */}
          <Link
            href="/"
            aria-label="Gido Studio home"
            className={cn(
              "group inline-flex shrink-0 items-center rounded-full px-3 py-1.5 transition-all duration-300 hover:-translate-y-0.5",
              scrolled
                ? "bg-[#fbf7ef]/70 shadow-[0_10px_30px_-12px_rgba(15,23,42,0.25)] ring-1 ring-slate-900/5 backdrop-blur-md"
                : "bg-transparent ring-0",
            )}
          >
            <Image
              src="/images/gido_logo.png"
              alt="Gido Studio"
              width={132}
              height={132}
              className="h-10 w-auto sm:h-12"
              priority
            />
          </Link>

          {/* The pill — nav links + highlighted CTA. Cream by default; frosts when scrolling. */}
          <div
            className={cn(
              "inline-flex items-center gap-1 rounded-full p-1.5 shadow-[0_10px_30px_-12px_rgba(15,23,42,0.35),0_2px_6px_-2px_rgba(15,23,42,0.15)] ring-1 ring-slate-900/5 transition-colors duration-300 sm:p-2",
              scrolled ? "bg-[#fbf7ef]/70 backdrop-blur-md" : "bg-[#fbf7ef]",
            )}
          >
            <nav className="hidden items-center gap-0.5 pl-1 pr-2 md:flex" aria-label="Primary">
              <NavLink href="#showcase">Showcase</NavLink>
              <NavLink href="#workflow">Workflow</NavLink>
              <NavLink href="#features">Features</NavLink>
              <NavLink href="#pricing">Pricing</NavLink>
            </nav>

            {/* Highlighted CTA — the equivalent of the purple HOME pill in the reference. */}
            <Link
              href={loggedIn ? "/dashboard" : "/login"}
              className="group inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
            >
              {loggedIn ? "Dashboard" : "Login"}
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>

            {/* Mobile menu toggle — sits inside the pill on small screens. */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              className="ml-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-900/[0.06] hover:text-slate-900 md:hidden"
            >
              {mobileOpen ? (
                <X className="h-4 w-4" aria-hidden />
              ) : (
                <Menu className="h-4 w-4" aria-hidden />
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown — its own floating panel under the pill. */}
        <div
          id="mobile-nav"
          className={cn(
            "marketing-container pointer-events-auto px-3 sm:px-6 md:hidden",
            "transition-[max-height,opacity,transform] duration-300 ease-out",
            mobileOpen
              ? "mt-2 max-h-96 translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-1 opacity-0 max-h-0",
          )}
        >
          <nav
            className="overflow-hidden rounded-3xl bg-white p-2 text-sm shadow-[0_18px_40px_-18px_rgba(15,23,42,0.35)] ring-1 ring-slate-200/70"
            aria-label="Mobile"
          >
            {[
              ["#showcase", "Showcase"],
              ["#workflow", "Workflow"],
              ["#features", "Features"],
              ["#pricing", "Pricing"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between rounded-2xl px-3.5 py-3 text-slate-700 transition hover:bg-slate-900/[0.04] hover:text-slate-900"
              >
                {label}
                <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden />
              </a>
            ))}
            <Link
              href={loggedIn ? "/dashboard" : "/login"}
              onClick={() => setMobileOpen(false)}
              className="mt-1 flex items-center justify-between rounded-2xl px-3.5 py-3 text-slate-700 transition hover:bg-slate-900/[0.04] hover:text-slate-900"
            >
              {loggedIn ? "Dashboard" : "Log in"}
              <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden />
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        {/* ============================== HERO ============================== */}
        <div className="relative overflow-hidden bg-white">
          {/* Dashed orbit ring — lives inside hero so it isn’t covered by main’s z-10 stacking. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 top-4 z-0 h-72 w-72 rounded-full border-2 border-dashed border-teal-600/25 animate-landing-spin-slow sm:top-8"
          />
        <section className="marketing-container relative z-10 pb-16 pt-28 sm:pb-20 sm:pt-32 md:pb-24 md:pt-32 lg:min-h-[min(88vh,_900px)] lg:pb-32 lg:pt-32">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-20 lg:py-4 2xl:gap-24">
            <div
              className="animate-landing-fade-up relative order-2 lg:order-1"
              style={{ animationDelay: "0.05s" }}
            >
              <h1 className="font-display text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl lg:text-[4rem] lg:leading-[1.05]">
                Photography{" "}
                <span className="relative inline-block whitespace-nowrap text-teal-800">
                  deserves
                  <HandUnderline className="-bottom-3 text-amber-400" />
                </span>
                <span className="mt-2 block text-slate-900">
                  a studio of its own.
                </span>
              </h1>

              <p className="mt-7 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Gido Studio is the photographer&rsquo;s workspace for client proofing, delivery,
                and galleries that look like your studio, not another generic upload link.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Link
                  href={loggedIn ? "/dashboard" : "/login"}
                  className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_18px_38px_-18px_rgba(15,23,42,0.7)] transition hover:bg-teal-800 sm:w-auto"
                >
                  <span className="absolute inset-0 bg-pattern-stripes-strong opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <span className="relative">Get started free</span>
                  <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </Link>
                <a
                  href="#showcase"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 transition hover:border-teal-600 hover:text-teal-700 sm:w-auto"
                >
                  See the showcase
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </a>
              </div>

              <div className="mt-10 flex items-center gap-5 text-sm text-slate-600">
                <div className="flex -space-x-2">
                  {testimonials.map((t) => (
                    <span
                      key={t.name}
                      className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-[#fbf7ef] shadow"
                    >
                      <Image
                        src={t.avatar}
                        alt={t.name}
                        fill
                        className="object-cover"
                        sizes="36px"
                      />
                    </span>
                  ))}
                </div>
                <div className="flex flex-col">
                  <span className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 stroke-amber-500" aria-hidden />
                    ))}
                  </span>
                  <span className="text-xs text-slate-500">
                    Loved by studios from Accra to Paris.
                  </span>
                </div>
              </div>
            </div>

            {/* === Polaroid stack === — replaces gradient-blob backdrop. */}
            <div className="relative order-1 h-[500px] sm:h-[580px] lg:order-2 lg:h-[640px] 2xl:h-[720px]">
              {/* Single solid accent square peeking behind the stack. */}
              <div className="absolute inset-x-10 inset-y-12 -z-10 rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.25)]" />
              <div className="absolute right-6 top-2 -z-10 h-32 w-32 rounded-2xl bg-teal-700/90" />
              <div className="absolute bottom-4 left-2 -z-10 h-24 w-24 rotate-12 rounded-2xl bg-amber-300" />

              {/* Photo 1 — main, slight left tilt. */}
              <div
                className="animate-landing-fade-up absolute left-0 top-6 h-[65%] w-[58%] rotate-[-3deg] rounded-[1.25rem] bg-white p-2 shadow-[0_30px_50px_-20px_rgba(15,23,42,0.35)]"
                style={{ animationDelay: "0.15s" }}
              >
                <div className="relative h-full w-full overflow-hidden rounded-[0.9rem]">
                  <Image
                    src={heroCollage[0].src}
                    alt={heroCollage[0].alt}
                    fill
                    priority
                    sizes="(min-width: 1024px) 32vw, 70vw"
                    className="animate-landing-ken-burns object-cover"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between px-1 pb-1 text-[11px] font-medium uppercase tracking-wider text-slate-600">
                  <span>{heroCollage[0].label}</span>
                  <Heart className="h-3.5 w-3.5 fill-rose-400 stroke-rose-400" aria-hidden />
                </div>
              </div>

              {/* Photo 2 — top right, wobble. */}
              <div
                className="animate-landing-fade-up absolute right-0 top-0 h-[45%] w-[46%] rotate-[4deg] rounded-[1rem] bg-white p-2 shadow-[0_24px_40px_-18px_rgba(15,23,42,0.3)] animate-landing-wobble"
                style={{
                  animationDelay: "0.3s",
                  ["--wobble-from" as string]: "3deg",
                  ["--wobble-to" as string]: "6deg",
                }}
              >
                <div className="relative h-full w-full overflow-hidden rounded-[0.75rem]">
                  <Image
                    src={heroCollage[1].src}
                    alt={heroCollage[1].alt}
                    fill
                    sizes="(min-width: 1024px) 24vw, 50vw"
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Photo 3 — bottom right. */}
              <div
                className="animate-landing-fade-up absolute bottom-0 right-4 h-[45%] w-[60%] rotate-[2deg] rounded-[1rem] bg-white p-2 shadow-[0_24px_40px_-18px_rgba(15,23,42,0.3)]"
                style={{ animationDelay: "0.45s" }}
              >
                <div className="relative h-full w-full overflow-hidden rounded-[0.75rem]">
                  <Image
                    src={heroCollage[2].src}
                    alt={heroCollage[2].alt}
                    fill
                    sizes="(min-width: 1024px) 30vw, 60vw"
                    className="object-cover"
                  />
                  <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-700 shadow-sm">
                    <Sun className="h-3 w-3 text-amber-500" aria-hidden />
                    Golden hour
                  </div>
                </div>
              </div>

              {/* Selection sticker — bigger pop, dashed border, sparkle. */}
              <div
                className="animate-landing-fade-up absolute -bottom-3 left-3 z-10 flex items-center gap-3 rounded-2xl border-2 border-dashed border-teal-600/30 bg-white px-4 py-3 shadow-[0_18px_40px_-18px_rgba(15,23,42,0.25)]"
                style={{ animationDelay: "0.55s" }}
              >
                <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-white">
                  <Check className="h-4 w-4" aria-hidden />
                  <span className="absolute inset-0 rounded-xl ring-2 ring-teal-500 animate-landing-ping-soft" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                    Live selection
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    Maya &amp; Yaw approved 142 photos
                  </p>
                </div>
              </div>

              {/* Tape strip — decorative. */}
              <div className="absolute -right-3 top-10 h-6 w-20 rotate-[18deg] bg-amber-300/80 shadow-sm" />
            </div>
          </div>
        </section>
        </div>

        {/* ===================== TRUST / FILM STRIP MARQUEE ===================== */}
        <section
          aria-label="Recent work across studios"
          className="relative my-4 sm:my-8"
        >
          {/* Film strip — black background with sprocket-hole pattern top and bottom. */}
          <div className="relative bg-slate-900 py-3">
            <div className="absolute inset-x-0 top-0 h-3 bg-pattern-film opacity-90" />
            <div className="absolute inset-x-0 bottom-0 h-3 bg-pattern-film opacity-90" />

            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-slate-900 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-slate-900 to-transparent" />

            <div className="absolute left-4 top-1/2 z-10 hidden -translate-y-1/2 items-center gap-1.5 rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-900 sm:inline-flex">
              <Film className="h-3 w-3" aria-hidden />
              Roll 24, A
            </div>

            <div className="overflow-hidden py-4">
              <div className="flex w-max gap-3 animate-landing-marquee">
                {marqueeRow.map((src, i) => (
                  <div
                    key={`${src}-${i}`}
                    className="relative h-24 w-32 overflow-hidden rounded-md ring-1 ring-white/10 sm:h-28 sm:w-40"
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="160px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ============================= BENEFITS ============================= */}
        <section
          id="benefits"
          className="relative scroll-mt-20 py-20 sm:py-24"
        >
          <div className="marketing-container">
            <div className="grid items-end gap-10 md:grid-cols-[1fr_auto]">
              <div className="max-w-2xl">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
                  <span className="h-px w-8 bg-teal-700/60" />
                  Why photographers move to Gido
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-[2.5rem]">
                  Built for how you{" "}
                  <span className="relative inline-block whitespace-nowrap text-teal-800">
                    actually
                    <HandUnderline className="-bottom-2 text-amber-400" />
                  </span>{" "}
                  work.
                </h2>
                <p className="mt-4 text-lg text-slate-600">
                  Four reasons studios swap scattered drives, generic upload links, and
                  ten-tool stacks for one workspace that grows with them.
                </p>
              </div>
              <a
                href="#workflow"
                className="group hidden items-center gap-1.5 text-sm font-semibold text-teal-700 transition hover:text-teal-800 md:inline-flex"
              >
                See the workflow
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </a>
            </div>
            <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 2xl:gap-6">
              {benefits.map(({ title, description, icon: Icon }, i) => {
                const accents = [
                  "bg-teal-700 text-white",
                  "bg-amber-400 text-slate-900",
                  "bg-slate-900 text-white",
                  "bg-rose-500 text-white",
                ] as const;
                const stripeBgs = [
                  "bg-teal-700",
                  "bg-amber-400",
                  "bg-slate-900",
                  "bg-rose-500",
                ] as const;
                return (
                  <li
                    key={title}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_24px_50px_-24px_rgba(15,23,42,0.25)]"
                    style={{ animationDelay: `${0.08 * i}s` }}
                  >
                    {/* Top accent stripe — single solid colour. */}
                    <span
                      className={cn(
                        "absolute inset-x-0 top-0 h-1 origin-left scale-x-100 transition-transform duration-500",
                        stripeBgs[i % stripeBgs.length],
                      )}
                    />
                    {/* Dotted backdrop in the corner. */}
                    <span className="pointer-events-none absolute -right-6 -top-2 h-24 w-24 bg-pattern-dots-soft opacity-70 transition-opacity group-hover:opacity-100" />

                    <div
                      className={cn(
                        "relative flex h-12 w-12 items-center justify-center rounded-xl shadow-sm transition duration-300 group-hover:-rotate-6",
                        accents[i % accents.length],
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <h3 className="relative mt-5 text-base font-semibold text-slate-900">
                      {title}
                    </h3>
                    <p className="relative mt-2 text-sm leading-relaxed text-slate-600">
                      {description}
                    </p>
                    {/* Animated arrow tick that slides in on hover. */}
                    <span className="relative mt-4 flex items-center gap-1 text-xs font-semibold text-slate-400 transition group-hover:text-teal-700">
                      <span className="h-px w-6 bg-current transition-all duration-300 group-hover:w-10" />
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" aria-hidden />
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* ============================= WORKFLOW ============================ */}
        <section
          id="workflow"
          className="relative scroll-mt-20 overflow-hidden border-y border-slate-200 bg-slate-50 py-20 sm:py-24"
        >
          {/* Pattern overlay — dotted grid plus a few solid accent shapes. */}
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-pattern-dots-soft opacity-80" />
          <div aria-hidden className="pointer-events-none absolute -right-20 top-10 h-40 w-40 rounded-full border-[10px] border-amber-300/60" />
          <div aria-hidden className="pointer-events-none absolute -left-12 bottom-24 h-24 w-24 rotate-12 bg-teal-700/10" />

          <div className="relative marketing-container">
            <div className="mx-auto max-w-2xl text-center">
              <p className="inline-flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
                <span className="h-px w-8 bg-teal-700/60" />
                A photographer&rsquo;s workflow
                <span className="h-px w-8 bg-teal-700/60" />
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-[2.5rem]">
                From the first shutter{" "}
                <span className="relative inline-block whitespace-nowrap text-teal-800">
                  to the final
                  <HandUnderline className="-bottom-2 text-amber-400" />
                </span>{" "}
                delivery.
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Three stages in one place: upload and cull, proof and approve,
                deliver and get paid. Built for how photographers actually work.
              </p>
            </div>

            {/* Vertical dashed connector running through the timeline, visible on md+. */}
            <div className="relative mt-16">
              <svg
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 md:block"
                preserveAspectRatio="none"
                viewBox="0 0 2 1000"
              >
                <line
                  x1="1"
                  y1="0"
                  x2="1"
                  y2="1000"
                  stroke="#0f766e"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="animate-landing-march"
                  opacity="0.4"
                />
              </svg>

              <div className="flex flex-col gap-16 sm:gap-20">
                {workflowSteps.map((step, i) => {
                  const Icon = step.icon;
                  const reverse = i % 2 === 1;
                  const stepNumber = String(i + 1).padStart(2, "0");
                  return (
                    <div
                      key={step.title}
                      className={cn(
                        "relative grid items-center gap-10 lg:gap-14",
                        "md:grid-cols-2",
                      )}
                    >
                      {/* Number badge on the center connector (md+). */}
                      <div
                        aria-hidden
                        className="pointer-events-none absolute left-1/2 top-1/2 z-20 hidden h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-slate-900 bg-amber-300 font-display text-lg font-bold text-slate-900 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.4)] md:flex"
                      >
                        {stepNumber}
                        <span className="absolute -inset-1 rounded-full ring-2 ring-amber-300 animate-landing-ping-soft" />
                      </div>

                      {/* Image card — replaced ring-4 + gradient overlay with paper frame + tape. */}
                      <div
                        className={cn(
                          "relative h-[320px] rounded-[1.5rem] bg-white p-3 shadow-[0_28px_60px_-24px_rgba(15,23,42,0.3)] sm:h-[400px]",
                          reverse ? "md:order-2" : "md:order-1",
                          reverse ? "md:-rotate-1" : "md:rotate-1",
                        )}
                      >
                        {/* Tape sticker. */}
                        <span
                          className={cn(
                            "absolute z-10 h-6 w-20 rotate-[-12deg] bg-amber-300/90 shadow-sm",
                            reverse ? "-right-2 -top-2" : "-left-2 -top-2",
                          )}
                        />
                        <div className="relative h-full w-full overflow-hidden rounded-[1.1rem]">
                          <Image
                            src={step.image}
                            alt={step.alt}
                            fill
                            sizes="(min-width: 1024px) 45vw, 100vw"
                            className="animate-landing-ken-burns object-cover"
                          />
                          <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-800 shadow-sm">
                            <Icon className="h-3.5 w-3.5 text-teal-700" aria-hidden />
                            {step.eyebrow}
                          </span>
                        </div>
                      </div>

                      {/* Copy column. */}
                      <div className={cn("relative", reverse ? "md:order-1 md:pr-12 md:text-right" : "md:order-2 md:pl-12")}>
                        {/* Mobile number badge. */}
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-900 bg-amber-300 font-display text-sm font-bold text-slate-900 md:hidden">
                          {stepNumber}
                        </span>
                        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700 md:mt-0">
                          {step.eyebrow}
                        </p>
                        <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl md:text-[2rem]">
                          {step.title}
                        </h3>
                        <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
                          {step.body}
                        </p>
                        <ul className={cn("mt-6 space-y-2 text-sm text-slate-700", reverse ? "md:ml-auto" : "")}>
                          {step.bullets.map((bullet) => (
                            <li
                              key={bullet}
                              className={cn(
                                "flex items-start gap-2",
                                reverse ? "md:flex-row-reverse md:text-right" : "",
                              )}
                            >
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-700" />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ============================ SHOWCASE GRID ============================ */}
        <section
          id="showcase"
          className="relative scroll-mt-20 py-20 sm:py-24"
        >
          <div className="marketing-container">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-xl">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
                  <span className="h-px w-8 bg-teal-700/60" />
                  Showcase
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-[2.5rem]">
                  Galleries that feel like an{" "}
                  <span className="relative inline-block whitespace-nowrap text-teal-800">
                    exhibition
                    <HandUnderline className="-bottom-2 text-amber-400" />
                  </span>
                  .
                </h2>
                <p className="mt-4 text-lg text-slate-600">
                  Magazine-style layouts and typography. The same galleries work for
                  weddings, portraits, editorial, and brand shoots.
                </p>
              </div>
              <a
                href="#pricing"
                className="group inline-flex items-center gap-1.5 rounded-full border-2 border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-teal-600 hover:text-teal-700"
              >
                <Compass className="h-4 w-4 transition-transform group-hover:rotate-45" aria-hidden />
                See pricing
              </a>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:auto-rows-[180px] 2xl:auto-rows-[200px] 2xl:gap-6">
              {showcaseGrid.map((item, i) => (
                <div
                  key={item.src}
                  className={cn(
                    "group relative overflow-hidden rounded-3xl bg-slate-100 ring-1 ring-slate-200 transition duration-500 hover:-translate-y-1 hover:ring-slate-300 hover:shadow-[0_28px_60px_-24px_rgba(15,23,42,0.25)]",
                    item.span,
                  )}
                  style={{ animationDelay: `${0.06 * i}s` }}
                >
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                  {/* Solid dark vignette only at the bottom (no gradient overlay across the full tile). */}
                  <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-slate-950/70 to-transparent" />
                  {/* Hover spotlight — soft radial highlight that fades in. */}
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 [background:radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.18),transparent_60%)]" />

                  <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-700 shadow-sm">
                    <Camera className="h-3 w-3 text-teal-700" aria-hidden />
                    {item.tag}
                  </div>
                  <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-3 text-white">
                    <span className="font-display text-lg leading-tight drop-shadow">
                      {item.alt}
                    </span>
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15 backdrop-blur transition group-hover:bg-amber-400 group-hover:text-slate-900">
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================ TESTIMONIALS ============================ */}
        <section
          aria-labelledby="testimonials-heading"
          className="relative scroll-mt-20 overflow-hidden border-y border-slate-200 bg-[#0f172a] py-20 text-slate-100 sm:py-24"
        >
          {/* Pattern + grain on dark, no gradient. */}
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-pattern-stripes-strong opacity-50" />
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-noise opacity-10 mix-blend-overlay" />
          <div aria-hidden className="pointer-events-none absolute -top-10 right-10 h-40 w-40 rounded-full border-2 border-dashed border-amber-400/40 animate-landing-spin-slow" />

          <div className="relative marketing-container">
            <div className="mx-auto max-w-2xl text-center">
              <p className="inline-flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
                <span className="h-px w-8 bg-amber-300/60" />
                Loved by photographers
                <span className="h-px w-8 bg-amber-300/60" />
              </p>
              <h2
                id="testimonials-heading"
                className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-[2.5rem]"
              >
                <span className="relative inline-block">
                  Calm
                  <HandUnderline className="-bottom-2 text-amber-400" />
                </span>
                , on the inside.
                <br className="hidden sm:block" />
                On-brand on the outside.
              </h2>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {testimonials.map((t, i) => (
                <figure
                  key={t.name}
                  className={cn(
                    "group relative flex flex-col rounded-3xl bg-[#fbf7ef] p-7 text-slate-800 transition duration-300 hover:-translate-y-1",
                    i === 0 ? "md:-rotate-1" : i === 1 ? "md:rotate-1" : "md:-rotate-0.5",
                  )}
                >
                  {/* Tape sticker. */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute h-5 w-16 -rotate-6 bg-amber-300/90",
                      i % 2 === 0 ? "-left-1 -top-2" : "-right-1 -top-2",
                    )}
                  />
                  <Quote className="h-7 w-7 text-amber-500" aria-hidden />
                  <blockquote className="mt-4 flex-1 font-display text-lg leading-relaxed text-slate-700">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 border-t border-dashed border-slate-300 pt-5">
                    <span className="relative h-11 w-11 overflow-hidden rounded-full ring-2 ring-slate-900/10">
                      <Image
                        src={t.avatar}
                        alt={t.name}
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    </span>
                    <span className="text-sm">
                      <span className="block font-semibold text-slate-900">{t.name}</span>
                      <span className="text-slate-500">{t.role}</span>
                    </span>
                    <span className="ml-auto flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className="h-3 w-3 fill-amber-400 stroke-amber-500" aria-hidden />
                      ))}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ============================== FEATURES ============================== */}
        <section id="features" className="relative scroll-mt-20 py-20 sm:py-24">
          <div className="marketing-container">
            <div className="flex flex-col items-center gap-4 text-center md:items-start md:text-left">
              <div className="flex items-center justify-center gap-2 text-teal-700 md:justify-start">
                <Wand2 className="h-5 w-5 animate-landing-scribble" aria-hidden />
                <span className="text-sm font-semibold uppercase tracking-wider">
                  Everything in one studio
                </span>
              </div>
              <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-[2.5rem]">
                Six modules. One{" "}
                <span className="relative inline-block whitespace-nowrap text-teal-800">
                  photography
                  <HandUnderline className="-bottom-2 text-amber-400" />
                </span>{" "}
                studio.
              </h2>
              <p className="max-w-2xl text-lg text-slate-600">
                Galleries, proofing, CRM, branding, delivery, and a print store in one
                product. Use the parts you need; they share the same client and job data.
              </p>
            </div>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 2xl:gap-8">
              {productModules.map((mod, i) => {
                const Icon = mod.icon;
                const accents = [
                  "bg-teal-700 text-white",
                  "bg-amber-400 text-slate-900",
                  "bg-slate-900 text-white",
                  "bg-rose-500 text-white",
                  "bg-teal-900 text-white",
                  "bg-amber-500 text-white",
                ] as const;
                const stripes = [
                  "bg-teal-700",
                  "bg-amber-400",
                  "bg-slate-900",
                  "bg-rose-500",
                  "bg-teal-900",
                  "bg-amber-500",
                ] as const;
                return (
                  <div
                    key={mod.name}
                    className="group relative flex flex-col overflow-hidden rounded-3xl border-2 border-slate-200 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_28px_60px_-24px_rgba(15,23,42,0.2)]"
                  >
                    {/* Top accent stripe — solid colour, animates wider on hover. */}
                    <span
                      className={cn(
                        "absolute inset-x-0 top-0 h-2 origin-left transition-transform duration-500 group-hover:h-3",
                        stripes[i % stripes.length],
                      )}
                    />
                    {/* Dotted texture in corner. */}
                    <span className="pointer-events-none absolute -right-8 top-2 h-32 w-32 bg-pattern-dots-soft opacity-60" />

                    <div
                      className={cn(
                        "relative flex h-12 w-12 items-center justify-center rounded-xl shadow-sm transition duration-300 group-hover:-rotate-6",
                        accents[i % accents.length],
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <h3 className="relative mt-5 font-display text-xl font-semibold tracking-tight text-slate-900">
                      {mod.name}
                    </h3>
                    <p className="relative mt-1 text-sm font-medium text-teal-700">{mod.tagline}</p>
                    <ul className="relative mt-5 flex flex-1 flex-col gap-2.5">
                      {mod.items.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                          <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-teal-700 text-white">
                            <Check className="h-3 w-3" aria-hidden strokeWidth={3} />
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =============================== PRICING =============================== */}
        <section
          id="pricing"
          className="relative scroll-mt-20 overflow-hidden border-t border-slate-200 bg-[#fbf7ef] py-20 sm:py-24"
        >
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-pattern-dots-soft opacity-60" />
          <div aria-hidden className="pointer-events-none absolute -left-10 top-20 h-32 w-32 rounded-full border-2 border-dashed border-teal-700/20 animate-landing-spin-slow" />
          <div aria-hidden className="pointer-events-none absolute right-20 bottom-40 h-16 w-16 rotate-45 bg-amber-300/60" />

          <div className="relative marketing-container">
            <div className="text-center">
              <p className="inline-flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
                <span className="h-px w-8 bg-teal-700/60" />
                Pricing that grows with you
                <span className="h-px w-8 bg-teal-700/60" />
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-[2.5rem]">
                One plan to{" "}
                <span className="relative inline-block whitespace-nowrap text-teal-800">
                  start
                  <HandUnderline className="-bottom-2 text-amber-400" />
                </span>
                . Room to scale.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
                Pick the tier that matches your studio today. Upgrade when you
                outgrow it. No per-gallery fees, no surprise overages, cancel any time.
              </p>
            </div>
            <div className="mt-16 grid gap-6 lg:grid-cols-3 2xl:gap-8">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.name}
                  className={cn(
                    "group relative flex flex-col rounded-3xl border-2 p-8 transition duration-300 hover:-translate-y-1",
                    plan.highlighted
                      ? "border-slate-900 bg-slate-900 text-white shadow-[0_30px_60px_-24px_rgba(15,23,42,0.5)]"
                      : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:shadow-[0_24px_50px_-24px_rgba(15,23,42,0.2)]",
                  )}
                >
                  {/* Patterned corner inside the card. */}
                  {plan.highlighted ? (
                    <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[1.4rem] bg-pattern-stripes-strong opacity-30" />
                  ) : (
                    <span aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 bg-pattern-dots-soft opacity-60" />
                  )}
                  {plan.highlighted ? (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-amber-300 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-900 shadow-md">
                      <Star className="h-3 w-3 fill-slate-900" aria-hidden />
                      Most popular
                    </span>
                  ) : null}
                  <h3 className={cn("relative font-display text-xl font-semibold", plan.highlighted ? "text-white" : "text-slate-900")}>
                    {plan.name}
                  </h3>
                  <p className={cn("relative mt-2 text-sm", plan.highlighted ? "text-slate-300" : "text-slate-600")}>
                    {plan.description}
                  </p>
                  <p className="relative mt-6 flex items-baseline gap-1">
                    <span
                      className={cn(
                        "font-display text-5xl font-semibold tracking-tight",
                        plan.highlighted ? "text-amber-300" : "text-slate-900",
                      )}
                    >
                      {plan.price}
                    </span>
                    <span className={cn("text-sm", plan.highlighted ? "text-slate-300" : "text-slate-500")}>
                      {plan.period}
                    </span>
                  </p>
                  <ul className="relative mt-8 flex flex-1 flex-col gap-3">
                    {plan.features.map((f) => (
                      <li key={f} className={cn("flex items-start gap-2.5 text-sm", plan.highlighted ? "text-slate-200" : "text-slate-700")}>
                        <span
                          className={cn(
                            "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full",
                            plan.highlighted ? "bg-amber-300 text-slate-900" : "bg-teal-700 text-white",
                          )}
                        >
                          <Check className="h-3 w-3" aria-hidden strokeWidth={3} />
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={loggedIn ? "/dashboard" : "/login"}
                    className={cn(
                      "relative mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold transition",
                      plan.highlighted
                        ? "bg-amber-300 text-slate-900 hover:bg-amber-200"
                        : "border-2 border-slate-900 bg-white text-slate-900 hover:bg-slate-900 hover:text-white",
                    )}
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =============================== CTA BANNER =============================== */}
        <section className="relative py-20 sm:py-24">
          <div className="marketing-container">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-[0_40px_80px_-30px_rgba(15,23,42,0.5)]">
              <Image
                src="https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=1800&q=80"
                alt="Sea horizon at golden hour"
                fill
                sizes="(min-width: 1024px) 1100px, 100vw"
                className="animate-landing-ken-burns object-cover opacity-50"
              />
              {/* Solid dark overlay + dot pattern instead of triple-gradient. */}
              <div className="absolute inset-0 bg-slate-950/70" />
              <div className="absolute inset-0 bg-pattern-dots-soft opacity-30" />
              <div className="absolute inset-0 bg-pattern-stripes-strong opacity-40" />
              {/* Decorative geometric shapes. */}
              <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full border-4 border-dashed border-amber-300/40 animate-landing-spin-slow" />
              <div aria-hidden className="pointer-events-none absolute -left-6 bottom-10 h-24 w-24 rotate-12 bg-amber-300/30" />

              <div className="relative grid gap-8 px-6 py-14 sm:px-10 md:grid-cols-[1.4fr_1fr] md:py-20 lg:px-14">
                <div className="text-white">
                  <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
                    <span className="h-px w-8 bg-amber-300/60" />
                    Try it with your work
                  </p>
                  <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-[2.5rem]">
                    Send your first{" "}
                    <span className="relative inline-block whitespace-nowrap">
                      branded gallery
                      <HandUnderline className="-bottom-2 text-amber-400" />
                    </span>{" "}
                    in under 10 minutes.
                  </h2>
                  <p className="mt-4 max-w-xl text-base text-slate-200 sm:text-lg">
                    Open Gido Studio with demo data already inside. Upload a shoot, run a
                    selection, and open a share-link gallery on your domain.
                    Free to try, no card required.
                  </p>
                </div>
                <div className="flex flex-col items-stretch justify-center gap-3 self-center">
                  <Link
                    href={loggedIn ? "/dashboard" : "/login"}
                    className="group relative inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-300 px-6 py-3.5 text-sm font-semibold text-slate-900 shadow-xl shadow-amber-300/30 transition hover:bg-amber-200"
                  >
                    {loggedIn ? "Open studio" : "Start free"}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                  </Link>
                  <a
                    href="#features"
                    className="inline-flex items-center justify-center rounded-2xl border-2 border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-amber-300 hover:text-amber-300"
                  >
                    Explore features
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-slate-200 bg-[#fbf7ef] py-12">
        <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-pattern-stripes opacity-60" />
        <div className="marketing-container flex flex-col items-center justify-between gap-6 text-center text-sm text-slate-600 sm:flex-row sm:text-left">
          <div className="flex items-center gap-3">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-teal-700/15 bg-white">
              <Image
                src="/images/gido_logo.png"
                alt="Gido Studio"
                width={120}
                height={120}
                className="h-6 w-auto"
              />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_0_3px_#fbf7ef]" />
            </span>
            <span className="font-display text-base font-semibold tracking-tight text-slate-900">
              Gido <span className="text-teal-700">Studio</span>
            </span>
          </div>
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Gido Studio. UI preview. Data stays in your browser.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <a href="#showcase" className="transition hover:text-teal-700">
              Showcase
            </a>
            <a href="#workflow" className="transition hover:text-teal-700">
              Workflow
            </a>
            <a href="#features" className="transition hover:text-teal-700">
              Features
            </a>
            <a href="#pricing" className="transition hover:text-teal-700">
              Pricing
            </a>
            <Link href="/login" className="transition hover:text-teal-700">
              Log in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
