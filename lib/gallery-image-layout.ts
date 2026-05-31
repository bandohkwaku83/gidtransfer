/**
 * Gallery image grid layouts — shared by client share gallery and photographer preview.
 */

import type { LucideIcon } from "lucide-react";
import {
  Columns3,
  GalleryHorizontal,
  LayoutGrid,
  PanelsTopLeft,
  Rows3,
  Sparkles,
  SquareStack,
} from "lucide-react";

export type GalleryImageLayout =
  | "uniform"
  | "masonry"
  | "bento"
  | "split"
  | "horizontal-scroll"
  | "collage"
  | "adaptive";

export type GalleryImageLayoutOption = {
  id: GalleryImageLayout;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
};

export const GALLERY_IMAGE_LAYOUTS: GalleryImageLayoutOption[] = [
  {
    id: "uniform",
    label: "Uniform Grid",
    shortLabel: "Uniform",
    description: "Even rows of same-size thumbnails",
    icon: LayoutGrid,
  },
  {
    id: "masonry",
    label: "Masonry Grid",
    shortLabel: "Masonry",
    description: "Flowing columns with natural photo heights",
    icon: Columns3,
  },
  {
    id: "bento",
    label: "Bento Grid",
    shortLabel: "Bento",
    description: "Mixed tile sizes in a structured mosaic",
    icon: PanelsTopLeft,
  },
  {
    id: "split",
    label: "Split Grid",
    shortLabel: "Split",
    description: "Two balanced columns of tall images",
    icon: Rows3,
  },
  {
    id: "horizontal-scroll",
    label: "Horizontal Scrolling Grid",
    shortLabel: "Scroll",
    description: "Swipe horizontally through photos",
    icon: GalleryHorizontal,
  },
  {
    id: "collage",
    label: "Collage Grid",
    shortLabel: "Collage",
    description: "Dense, tightly packed mixed collage",
    icon: SquareStack,
  },
  {
    id: "adaptive",
    label: "Adaptive Responsive Grid",
    shortLabel: "Adaptive",
    description: "Auto-fitting tiles that respond to width",
    icon: Sparkles,
  },
];

const LAYOUT_IDS = new Set(GALLERY_IMAGE_LAYOUTS.map((l) => l.id));

/** @deprecated Use GalleryImageLayout */
export type GridLayout = GalleryImageLayout;

const LEGACY_LAYOUT_MAP: Record<string, GalleryImageLayout> = {
  quilt: "masonry",
  asymmetrical: "masonry",
  magazine: "masonry",
  spotlight: "masonry",
  block: "bento",
  filmstrip: "horizontal-scroll",
};

export function isGalleryImageLayout(v: string): v is GalleryImageLayout {
  return LAYOUT_IDS.has(v as GalleryImageLayout);
}

/** Accepts current and legacy session-storage values. */
export function normalizeGalleryImageLayout(v: string): GalleryImageLayout {
  if (isGalleryImageLayout(v)) return v;
  return LEGACY_LAYOUT_MAP[v] ?? "masonry";
}

/** @deprecated Use isGalleryImageLayout */
export function isGridLayout(v: string): v is GridLayout {
  return isGalleryImageLayout(v) || v in LEGACY_LAYOUT_MAP;
}

export function isCollageGridLayout(layout: GalleryImageLayout): boolean {
  return layout === "masonry" || layout === "collage";
}

export function galleryListClass(layout: GalleryImageLayout): string {
  switch (layout) {
    case "uniform":
      return "grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4";
    case "masonry":
      return "columns-2 gap-x-[6px] bg-white sm:columns-3 md:columns-4 [column-fill:_balance]";
    case "bento":
      return "grid grid-cols-2 auto-rows-[minmax(88px,1fr)] gap-2 sm:grid-cols-4 sm:auto-rows-[minmax(96px,1fr)]";
    case "split":
      return "grid grid-cols-2 gap-3 sm:gap-4";
    case "horizontal-scroll":
      return "flex flex-row flex-nowrap gap-3 overflow-x-auto pb-3 pt-1 [-webkit-overflow-scrolling:touch] snap-x snap-mandatory px-0.5";
    case "collage":
      return "columns-2 gap-x-1 sm:columns-3 md:columns-4 [column-fill:_balance]";
    case "adaptive":
      return "grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(9rem,1fr))]";
    default:
      return "";
  }
}

export function shareGalleryGridSizes(layout: GalleryImageLayout, index: number): string {
  switch (layout) {
    case "horizontal-scroll":
      return "(max-width: 640px) 85vw, 320px";
    case "bento":
      return index === 0
        ? "(max-width: 640px) 50vw, 40vw"
        : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw";
    case "split":
      return "(max-width: 640px) 50vw, 45vw";
    case "masonry":
    case "collage":
      return "(max-width: 640px) 50vw, (max-width: 900px) 33vw, 25vw";
    case "adaptive":
      return "(max-width: 640px) 45vw, 180px";
    case "uniform":
    default:
      return "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 24vw";
  }
}

function tileRing(isSelected: boolean): string {
  return isSelected
    ? "border-brand-on-dark ring-2 ring-brand-soft dark:border-brand dark:ring-brand/40"
    : "border-zinc-200 dark:border-zinc-800";
}

export function uploadItemClass(
  layout: GalleryImageLayout,
  index: number,
  isSelected: boolean,
): string {
  if (isCollageGridLayout(layout)) {
    return `group relative mb-[6px] break-inside-avoid overflow-hidden ${
      isSelected ? "ring-2 ring-inset ring-brand" : ""
    }`;
  }

  const ring = tileRing(isSelected);
  const base = `group overflow-hidden rounded-xl border bg-white shadow-sm transition dark:bg-zinc-950 ${ring}`;

  switch (layout) {
    case "bento":
      if (index === 0) return `${base} col-span-2 row-span-2 sm:col-span-2 sm:row-span-2`;
      if (index === 1) return `${base} col-span-2 sm:col-span-2`;
      return base;
    case "split":
      return `${base} min-h-[200px] sm:min-h-[240px]`;
    case "horizontal-scroll":
      return `${base} w-[min(85vw,20rem)] shrink-0 snap-start sm:w-72`;
    case "adaptive":
    case "uniform":
    default:
      return base;
  }
}

export function editedCardClass(layout: GalleryImageLayout, index: number): string {
  if (isCollageGridLayout(layout)) {
    return "group relative mb-[6px] break-inside-avoid overflow-hidden";
  }

  const base =
    "group overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950";

  switch (layout) {
    case "bento":
      if (index === 0) return `${base} col-span-2 row-span-2 sm:col-span-2 sm:row-span-2`;
      if (index === 1) return `${base} col-span-2 sm:col-span-2`;
      return base;
    case "split":
      return `${base} min-h-[200px] sm:min-h-[240px]`;
    case "horizontal-scroll":
      return `${base} w-[min(85vw,20rem)] shrink-0 snap-start sm:w-72`;
    default:
      return base;
  }
}

export function uploadImageWrapClass(layout: GalleryImageLayout, index: number): string {
  if (isCollageGridLayout(layout)) {
    return "relative block w-full";
  }

  switch (layout) {
    case "split":
      return "relative aspect-[3/4] w-full";
    case "bento":
      if (index === 0) return "relative aspect-[4/5] w-full sm:aspect-auto sm:min-h-full sm:h-full";
      return "relative aspect-square w-full";
    case "adaptive":
    case "uniform":
    default:
      return "relative aspect-square w-full";
  }
}

/* ----------------------------- preview placeholders ----------------------------- */

const MASONRY_HEIGHTS = ["h-24", "h-36", "h-28", "h-32", "h-40", "h-28", "h-36", "h-32"];

export function previewGridClass(layout: GalleryImageLayout): string {
  return galleryListClass(layout);
}

export function previewTileClass(layout: GalleryImageLayout, index: number): string {
  const shell =
    "overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800/80";

  if (isCollageGridLayout(layout)) {
    return `${shell} mb-2 break-inside-avoid ${MASONRY_HEIGHTS[index % MASONRY_HEIGHTS.length]}`;
  }

  switch (layout) {
    case "bento":
      if (index === 0) return `${shell} col-span-2 row-span-2 min-h-[120px]`;
      if (index === 1) return `${shell} col-span-2 aspect-[2/1]`;
      return `${shell} aspect-square`;
    case "split":
      return `${shell} min-h-[120px]`;
    case "horizontal-scroll":
      return `${shell} h-28 w-36 shrink-0 snap-start sm:h-32 sm:w-40`;
    case "adaptive":
    case "uniform":
    default:
      return `${shell} aspect-square`;
  }
}
