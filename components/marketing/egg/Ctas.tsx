"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "./Icons";
import { marketingSignUpHref } from "@/lib/marketing/auth-links";
import { usePhotographerSignedIn } from "@/lib/marketing/use-photographer-signed-in";

export function Ctas() {
  const signedIn = usePhotographerSignedIn();
  const signUpHref = signedIn ? marketingSignUpHref() : "/login?screen=signup";

  return (
    <section id="cta" className="bg-cream py-20 md:py-28">
      <div className="container-x">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-card text-white"
          style={{
            background:
              "linear-gradient(145deg, #2c1a20 0%, #231519 42%, #1a0f14 100%)",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(85,0,31,0.35)_0%,transparent_55%)]"
          />

          <div className="relative z-10 grid lg:grid-cols-[1.4fr_1fr]">
            <div className="flex flex-col justify-between gap-10 border-b border-white/10 px-8 py-10 md:px-12 md:py-12 lg:border-b-0 lg:border-r lg:px-14 lg:py-14">
              <div>
                <span className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3.5 py-1.5 text-[0.8rem] text-white/75">
                  <span className="inline-block h-2 w-2 rounded-[3px] bg-brand" />
                  Get started
                </span>
                <h2 className="mt-6 max-w-[14ch] font-sans text-[2rem] font-semibold leading-[1.12] tracking-[-0.03em] sm:text-[2.6rem] md:text-[3rem]">
                  For studios preparing for growth, not hype
                </h2>
                <p className="mt-4 max-w-md text-[1.02rem] leading-relaxed text-white/55">
                  Start free, keep your brand, and give clients a delivery
                  experience that already feels trusted.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={signUpHref}
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-white px-5 py-3 text-sm font-medium text-[#231519] transition hover:bg-[#f3f3f3]"
                >
                  {signedIn ? "Open studio" : "Start free"}
                  <ArrowRight className="h-4 w-4 text-brand" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-white/25 px-5 py-3 text-sm transition hover:bg-white/10"
                >
                  View pricing
                </Link>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-10 px-8 py-10 md:px-12 md:py-12 lg:px-12 lg:py-14">
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.16em] text-white/40">
                  Prefer to talk
                </p>
                <h3 className="mt-4 max-w-[16ch] text-[1.55rem] font-medium leading-snug tracking-tight md:text-[1.85rem]">
                  Stay connected with what actually matters
                </h3>
                <p className="mt-4 max-w-[28ch] text-[0.95rem] leading-relaxed text-white/50">
                  Questions about delivery, branding, or whether this fits your
                  studio — we’ll answer plainly.
                </p>
              </div>

              <Link
                href="/contact"
                className="group inline-flex w-fit items-center gap-3 rounded-full border border-white/20 px-5 py-3 text-sm font-medium transition hover:border-white/40 hover:bg-white/10"
              >
                Contact us
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#231519] transition group-hover:translate-x-0.5">
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
