"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { CloseIcon, Logo, MenuIcon } from "./Icons";
import { marketingSignInHref, marketingSignUpHref } from "@/lib/marketing/auth-links";
import { usePhotographerSignedIn } from "@/lib/marketing/use-photographer-signed-in";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const signedIn = usePhotographerSignedIn();
  const signInHref = signedIn ? marketingSignInHref() : "/login";
  const signUpHref = signedIn ? marketingSignUpHref() : "/login?screen=signup";

  useEffect(() => {
    setMounted(true);
    let frame = 0;
    let last = window.scrollY > 24;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const next = window.scrollY > 24;
        if (next !== last) {
          last = next;
          setScrolled(next);
        }
      });
    };
    setScrolled(last);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isScrolled = mounted && scrolled;
  return (
    <>
      <div className="pointer-events-none fixed top-0 right-0 left-0 z-50">
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={`pointer-events-auto transition-all duration-300 ${
            isScrolled ? "mx-0 mt-0" : "mx-3 mt-3 md:mx-5 md:mt-4"
          }`}
        >
          <div
            className={`flex items-center gap-4 bg-white py-2.5 pr-3 pl-5 shadow-[0_8px_30px_rgba(36,16,24,0.06)] transition-all duration-300 md:py-3 md:pr-4 md:pl-6 ${
              isScrolled
                ? "rounded-none border-b border-foreground/6"
                : "rounded-full"
            }`}
          >
            <Link href="/" className="shrink-0">
              <Logo />
            </Link>

            <nav className="mx-auto hidden items-center gap-5 text-[0.88rem] text-foreground/85 lg:flex xl:gap-6">
              {navLinks.map((link) => {
                const active = isActive(pathname, link.href);
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={`inline-flex items-center gap-1 transition-colors hover:text-foreground ${
                      active ? "font-semibold text-foreground" : ""
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Link
                href={signInHref}
                className="hidden rounded-full bg-surface px-4 py-2 text-sm text-foreground/80 transition hover:bg-foreground/8 sm:inline-flex"
              >
                Sign in
              </Link>
              <Link
                href={signUpHref}
                className="btn-dark !px-4 !py-2.5 hidden text-sm sm:inline-flex"
              >
                {signedIn ? "Open studio" : "Start free"}
              </Link>
              <button
                type="button"
                aria-label={open ? "Close menu" : "Open menu"}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5 lg:hidden"
                onClick={() => setOpen((v) => !v)}
              >
                {open ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>
        </motion.header>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 bg-cream px-6 pt-24 lg:hidden">
          <nav className="flex flex-col gap-5 text-xl">
            {navLinks.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`border-b border-foreground/10 pb-4 ${
                    active ? "font-semibold text-foreground" : ""
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href={signUpHref}
              className="btn-dark mt-2 w-fit"
              onClick={() => setOpen(false)}
            >
              {signedIn ? "Open studio" : "Start free"}
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
