import type { CSSProperties } from "react";
import type { GalleryCoverFrame } from "@/lib/gallery-cover-frame";
import {
  galleryCoverUsesBackdropColor,
  normalizeGalleryCoverColor,
} from "@/lib/gallery-cover-color";
import { cn } from "@/lib/utils";

/** Miniature chrome shell classes for the cover style picker. */
export function coverFrameThumbShellClass(
  frame: GalleryCoverFrame,
  selected: boolean,
  coverColor?: string,
): string {
  const usesPickerColor = galleryCoverUsesBackdropColor(frame);
  return cn(
    "relative h-11 w-full overflow-hidden rounded-md border",
    selected ? "border-brand/60" : "border-zinc-300/80 dark:border-zinc-600/80",
    !usesPickerColor && "bg-zinc-200/80 dark:bg-zinc-800/80",
    frame === "minimal" && "bg-white dark:bg-zinc-950",
    frame === "film-border" && usesPickerColor && "p-1",
    (frame === "editorial-card" || frame === "card-based") &&
      !usesPickerColor &&
      "bg-zinc-100 dark:bg-zinc-900",
  );
}

export function coverFrameThumbShellStyle(
  frame: GalleryCoverFrame,
  coverColor?: string,
): CSSProperties | undefined {
  if (!galleryCoverUsesBackdropColor(frame)) return undefined;
  return { backgroundColor: normalizeGalleryCoverColor(coverColor) };
}
