"use client";

import Image from "next/image";
import Link from "next/link";
import { ShowcaseCarousel } from "@/components/marketing/showcase-carousel";
import { marketingSignUpHref } from "@/lib/marketing/auth-links";
import { usePhotographerSignedIn } from "@/lib/marketing/use-photographer-signed-in";
import { SHOWCASE_TEXTURE_IMAGE, showcaseItems } from "@/lib/marketing/showcase-items";
import { cn } from "@/lib/utils";

type ShowcaseSectionProps = {
  /** When true, overlaps the section above (home page layout). */
  embedded?: boolean;
};

export function ShowcaseSection({ embedded = false }: ShowcaseSectionProps) {
  const signedIn = usePhotographerSignedIn();
  const signUpHref = signedIn ? marketingSignUpHref() : "/login?screen=signup";
  return (
    <section
      className={cn(
        "relative overflow-hidden bg-[#FFFCF2]",
        embedded
          ? "-mt-16 pb-16 pt-28 sm:-mt-28 sm:pb-28 sm:pt-44"
          : "pb-16 pt-10 sm:pb-28 sm:pt-16",
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Image
          src={SHOWCASE_TEXTURE_IMAGE}
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center scale-105 mix-blend-multiply"
        />
        <div className="absolute inset-0 bg-white/50" />
        <div className="absolute inset-0 bg-noise opacity-[0.06] mix-blend-multiply" />
        <div className="absolute inset-x-0 top-0 z-[1] h-[min(42vh,22rem)] bg-gradient-to-b from-[#FFFCF2] from-30% via-[#f8f6f0] via-65% to-transparent sm:h-[min(38vh,26rem)]" />
      </div>

      <div className="relative z-10 marketing-container">
        {embedded ? <div id="showcase" className="scroll-mt-24" aria-hidden /> : null}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-slate-400">
            Showcase
          </p>
          <div className="mt-3 flex flex-col gap-4 sm:mt-4 sm:flex-row sm:items-center sm:justify-between">
            {embedded ? (
              <h2 className="max-w-lg font-display text-[1.65rem] font-normal leading-snug tracking-tight text-slate-900 sm:text-4xl">
                Every gallery, beautifully presented
              </h2>
            ) : (
              <h1 className="max-w-lg font-display text-[1.65rem] font-normal leading-snug tracking-tight text-slate-900 sm:text-4xl">
                Every gallery, beautifully presented
              </h1>
            )}
            <Link
              href={signUpHref}
              className="inline-flex w-full shrink-0 items-center justify-center rounded-xl bg-[#55001F] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-12px_rgba(85,0,31,0.45)] transition hover:bg-[#440019] sm:w-auto sm:rounded-sm sm:py-2.5"
            >
              {signedIn ? "Open studio" : "Start free"}
            </Link>
          </div>
          <div className="mt-4 h-px w-10 bg-slate-200" aria-hidden />
        </div>

        <div className="mt-5 sm:mt-8">
          <ShowcaseCarousel items={showcaseItems} />
        </div>
      </div>
    </section>
  );
}
