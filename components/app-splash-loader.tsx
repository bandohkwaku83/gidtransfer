"use client";

import Image from "next/image";
import { APP_NAME } from "@/lib/branding";
import { cn } from "@/lib/utils";

export function AppSplashLoader() {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden",
        "bg-gradient-to-br from-[#faf6f7] via-white to-[#f3e8ec]",
      )}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className={cn(
            "animate-landing-drift absolute -left-[12%] top-[12%] h-[min(420px,55vw)] w-[min(420px,55vw)] rounded-full",
            "bg-brand/[0.07] blur-3xl",
          )}
        />
        <div
          className={cn(
            "animate-landing-drift absolute -right-[8%] bottom-[8%] h-[min(360px,48vw)] w-[min(360px,48vw)] rounded-full",
            "bg-brand-muted/35 blur-3xl [animation-delay:-9s]",
          )}
        />
        <div
          className={cn(
            "animate-landing-pulse-soft absolute left-1/2 top-1/2 h-[min(520px,70vw)] w-[min(520px,70vw)] -translate-x-1/2 -translate-y-1/2 rounded-full",
            "bg-gradient-to-tr from-brand/[0.04] to-transparent blur-2xl",
          )}
        />
      </div>

      <div className="animate-splash-enter relative flex flex-col items-center">
        <div className="relative flex h-16 w-16 items-center justify-center sm:h-[4.5rem] sm:w-[4.5rem]">
          <span
            className="animate-landing-ping-soft absolute inset-0 rounded-2xl bg-brand/[0.08]"
            aria-hidden
          />
          <Image
            src="/svgs/dashboard_logo.svg"
            alt=""
            width={691}
            height={801}
            priority
            className="relative h-full w-auto drop-shadow-[0_8px_24px_rgba(85,0,31,0.12)]"
          />
        </div>
        <p className="mt-5 font-display text-lg tracking-tight text-brand-ink/90 sm:text-xl">
          {APP_NAME}
        </p>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 h-px overflow-hidden bg-brand/[0.08]"
        aria-hidden
      >
        <div className="animate-splash-progress h-full w-2/5 rounded-full bg-gradient-to-r from-transparent via-brand/70 to-transparent" />
      </div>

      <span className="sr-only">Loading {APP_NAME}</span>
    </div>
  );
}
