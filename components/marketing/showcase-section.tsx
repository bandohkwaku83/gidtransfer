"use client";

import Image from "next/image";
import Link from "next/link";
import { ShowcaseCarousel } from "@/components/marketing/showcase-carousel";
import { marketingSignUpHref } from "@/lib/marketing/auth-links";
import { usePhotographerSignedIn } from "@/lib/marketing/use-photographer-signed-in";
import { SHOWCASE_TEXTURE_IMAGE, showcaseItems } from "@/lib/marketing/showcase-items";
import { cn } from "@/lib/utils";

type ShowcaseSectionProps = {
  /** When true, used inside the Reforma homepage shell. */
  embedded?: boolean;
};

export function ShowcaseSection({ embedded = false }: ShowcaseSectionProps) {
  const signedIn = usePhotographerSignedIn();
  const signUpHref = signedIn ? marketingSignUpHref() : "/login?screen=signup";
  return (
    <section
      className={cn(
        "relative overflow-hidden",
        embedded
          ? "bg-transparent pb-14 pt-12 sm:pb-20 sm:pt-16"
          : "bg-[#F7F6F5] pb-16 pt-10 sm:pb-28 sm:pt-16",
      )}
    >
      {!embedded ? (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <Image
            src={SHOWCASE_TEXTURE_IMAGE}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center scale-105 mix-blend-multiply opacity-40"
          />
          <div className="absolute inset-0 bg-[#F7F6F5]/80" />
        </div>
      ) : null}

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 xl:max-w-7xl 2xl:max-w-[90rem]">
        {embedded ? <div id="showcase" className="scroll-mt-24" aria-hidden /> : null}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#240F18]/40">
            Showcase
          </p>
          <div className="mt-3 flex flex-col gap-4 sm:mt-4 sm:flex-row sm:items-end sm:justify-between">
            {embedded ? (
              <h2 className="max-w-xl font-display text-[1.85rem] font-normal leading-snug tracking-tight text-[#240F18] sm:text-4xl">
                Every gallery,{" "}
                <em className="italic text-[#55001F]">beautifully</em> presented
              </h2>
            ) : (
              <h1 className="max-w-xl font-display text-[1.85rem] font-normal leading-snug tracking-tight text-[#240F18] sm:text-4xl">
                Every gallery,{" "}
                <em className="italic text-[#55001F]">beautifully</em> presented
              </h1>
            )}
            <Link
              href={signUpHref}
              className="inline-flex h-11 w-full shrink-0 items-center justify-center rounded-full bg-[#55001F] px-5 text-sm font-medium text-white transition hover:bg-[#440019] sm:w-auto"
            >
              {signedIn ? "Open studio" : "Start free"}
            </Link>
          </div>
          <div className="mt-5 h-px w-14 bg-[#55001F]/25" aria-hidden />
        </div>

        <div className="mt-5 sm:mt-8">
          <ShowcaseCarousel items={showcaseItems} />
        </div>
      </div>
    </section>
  );
}
