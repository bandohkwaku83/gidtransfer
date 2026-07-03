"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronRight, Menu, X } from "lucide-react";
import { APP_NAME } from "@/lib/branding";
import { marketingSignInHref } from "@/lib/marketing/auth-links";
import { usePhotographerSignedIn } from "@/lib/marketing/use-photographer-signed-in";
import { MarketingSocialIconLinks } from "@/components/marketing/marketing-social-links";
import { cn } from "@/lib/utils";

const navLinks = [
  ["/features", "Features"],
  ["/pricing", "Pricing"],
  ["/contact", "Contact"],
] as const;

export const marketingHeaderInset = "px-5 sm:px-8 md:px-10 lg:px-12 xl:px-14";

const navPillClassName =
  "items-center gap-6 rounded-full bg-white px-3 py-2 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/8 lg:gap-7 lg:px-4 lg:py-2.5";

const mobileMenuButtonClassName =
  "inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-900 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/8 transition hover:bg-slate-50";

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

function MobileNavMenu({
  id,
  open,
  signInHref,
  onNavigate,
  className,
}: {
  id: string;
  open: boolean;
  signInHref: string;
  onNavigate: () => void;
  className?: string;
}) {
  return (
    <div
      id={id}
      className={cn(
        "transition-[max-height,opacity,transform] duration-300 ease-out",
        open
          ? "max-h-96 translate-y-0 opacity-100"
          : "pointer-events-none max-h-0 -translate-y-1 opacity-0",
        className,
      )}
    >
      <nav
        className="overflow-hidden rounded-3xl bg-white p-2 text-sm shadow-lg ring-1 ring-slate-900/8"
        aria-label="Mobile"
      >
        {navLinks.map(([href, label]) => (
          <a
            key={href}
            href={href}
            onClick={onNavigate}
            className="flex items-center justify-between rounded-2xl px-4 py-3 text-slate-600 transition hover:bg-slate-900/5 hover:text-slate-900"
          >
            {label}
            <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden />
          </a>
        ))}
        <SignInButton
          href={signInHref}
          onClick={onNavigate}
          className="mt-1 h-11 w-full rounded-2xl"
        />
      </nav>
    </div>
  );
}

export function MarketingHeader({ embedded = false }: { embedded?: boolean }) {
  const signedIn = usePhotographerSignedIn();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const [inTopBar, setInTopBar] = useState(true);
  const topBarRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const signInHref = signedIn ? marketingSignInHref() : "/login";

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const topBarBottom = embedded
        ? window.innerHeight * 0.82
        : topBarRef.current
          ? topBarRef.current.offsetTop + topBarRef.current.offsetHeight - 96
          : 80;
      const nowInTopBar = y < topBarBottom;

      setInTopBar(nowInTopBar);

      if (nowInTopBar) {
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
  }, [embedded]);

  const logoRow = (
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
          aria-controls={embedded ? "marketing-mobile-nav-embedded" : "marketing-mobile-nav-top"}
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
  );

  return (
    <>
      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 top-0 z-40 transition-transform duration-300 ease-out",
          navVisible ? "translate-y-0" : "-translate-y-[140%]",
        )}
      >
        <div
          className={cn(
            "relative flex justify-center pt-5 sm:pt-6 lg:pt-7",
            marketingHeaderInset,
          )}
        >
          <nav
            className={cn("pointer-events-auto hidden md:flex", navPillClassName)}
            aria-label="Primary"
          >
            {navLinks.map(([href, label]) => (
              <NavLink key={href} href={href}>
                {label}
              </NavLink>
            ))}
            <SignInButton href={signInHref} />
          </nav>

          {!inTopBar && (
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-controls="marketing-mobile-nav"
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
          className={cn(
            marketingHeaderInset,
            "pointer-events-auto md:hidden",
            "transition-[max-height,opacity,transform] duration-300 ease-out",
            mobileOpen && !inTopBar
              ? "max-h-96 translate-y-0 opacity-100"
              : "pointer-events-none max-h-0 -translate-y-1 opacity-0",
          )}
        >
          <MobileNavMenu
            id="marketing-mobile-nav"
            open={mobileOpen && !inTopBar}
            signInHref={signInHref}
            onNavigate={() => setMobileOpen(false)}
          />
        </div>
      </div>

      {embedded ? (
        <div className={cn("relative z-20 pt-5 sm:pt-6 lg:pt-7", marketingHeaderInset)}>
          {logoRow}
          <MobileNavMenu
            id="marketing-mobile-nav-embedded"
            open={mobileOpen && inTopBar}
            signInHref={signInHref}
            onNavigate={() => setMobileOpen(false)}
            className="relative z-20 mt-3 md:hidden"
          />
        </div>
      ) : (
        <div
          ref={topBarRef}
          className={cn("relative z-30 pt-5 sm:pt-6 lg:pt-7", marketingHeaderInset)}
        >
          {logoRow}
          <MobileNavMenu
            id="marketing-mobile-nav-top"
            open={mobileOpen && inTopBar}
            signInHref={signInHref}
            onNavigate={() => setMobileOpen(false)}
            className="relative z-20 mt-3 md:hidden"
          />
        </div>
      )}
    </>
  );
}
