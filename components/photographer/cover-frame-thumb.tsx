"use client";

import type { GalleryCoverFrame } from "@/lib/gallery-cover-frame";
import { cn } from "@/lib/utils";

export function CoverFrameThumb({ frame }: { frame: GalleryCoverFrame }) {
  const tile = "absolute bg-zinc-400/90 dark:bg-zinc-500/90";

  switch (frame) {
    case "cinematic":
      return (
        <>
          <span className="absolute inset-x-0 top-0 h-2 bg-black/90" />
          <span className={cn(tile, "inset-x-2 top-2 bottom-2 rounded-sm opacity-80")} />
          <span className="absolute inset-x-0 bottom-0 h-2 bg-black/90" />
        </>
      );
    case "collage":
      return (
        <>
          <span className={cn(tile, "left-1 top-2 h-6 w-8 rotate-[-6deg] rounded-sm")} />
          <span className={cn(tile, "right-1 top-1 h-7 w-7 rotate-[8deg] rounded-sm opacity-70")} />
          <span className={cn(tile, "bottom-1 left-3 h-5 w-9 rotate-[3deg] rounded-sm opacity-60")} />
        </>
      );
    case "minimal":
      return (
        <>
          <span className="absolute left-1/2 top-2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-zinc-300 dark:bg-zinc-600" />
          <span className={cn(tile, "left-1/2 top-4 h-5 w-10 -translate-x-1/2 rounded-sm opacity-50")} />
          <span className="absolute bottom-2 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-zinc-300 dark:bg-zinc-600" />
        </>
      );
    case "bento":
      return (
        <div className="absolute inset-1 grid grid-cols-3 grid-rows-2 gap-0.5">
          <span className={cn(tile, "col-span-2 row-span-2 rounded-sm opacity-90")} />
          <span className={cn(tile, "rounded-sm opacity-60")} />
          <span className={cn(tile, "rounded-sm opacity-45")} />
        </div>
      );
    case "overlay":
      return (
        <>
          <span className={cn(tile, "inset-0 opacity-70")} />
          <span className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-black/80 to-transparent" />
          <span className="absolute bottom-1 left-2 h-0.5 w-5 rounded-full bg-white/80" />
        </>
      );
    case "card-based":
    case "editorial-card":
      return <span className={cn(tile, "inset-2 rounded-md opacity-75")} />;
    case "parallax":
      return (
        <>
          <span className={cn(tile, "inset-0 scale-110 opacity-60")} />
          <span className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-b from-transparent to-black/50" />
        </>
      );
    case "hero-carousel":
      return (
        <>
          <span className={cn(tile, "inset-y-1 left-1 w-[55%] rounded-sm opacity-90")} />
          <span className={cn(tile, "inset-y-2 right-0 w-[38%] rounded-sm opacity-35")} />
          <span className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5">
            <span className="h-1 w-1 rounded-full bg-white/90" />
            <span className="h-1 w-1 rounded-full bg-white/40" />
            <span className="h-1 w-1 rounded-full bg-white/40" />
          </span>
        </>
      );
    case "film-border":
      return <span className={cn(tile, "inset-1 rounded-[1px] border border-white/90 opacity-90")} />;
    case "split-feature":
      return (
        <div className="absolute inset-1 grid grid-cols-2 gap-1">
          <span className="rounded-sm bg-zinc-500/40 dark:bg-zinc-600/50" />
          <span className={cn(tile, "rounded-sm opacity-80")} />
        </div>
      );
    case "full-bleed":
    default:
      return (
        <>
          <span className={cn(tile, "inset-0 opacity-80")} />
          <span className="absolute inset-0 bg-black/35" />
          <span className="absolute left-1/2 top-1/2 h-0.5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70" />
        </>
      );
  }
}
