import type { LucideIcon } from "lucide-react";
import {
  Clapperboard,
  Columns3,
  Film,
  GalleryHorizontal,
  Layers,
  LayoutTemplate,
  Maximize2,
  Minimize2,
  MousePointerClick,
  PanelsTopLeft,
  Sparkles,
  SplitSquareHorizontal,
} from "lucide-react";

export type GalleryCoverFrameOption = {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
};

export const GALLERY_COVER_FRAMES = [
  {
    id: "cinematic",
    label: "Cinematic Cover",
    shortLabel: "Cinematic",
    description: "Wide letterbox frame with dramatic vignette and theater-style title.",
    icon: Clapperboard,
  },
  {
    id: "collage",
    label: "Collage Cover",
    shortLabel: "Collage",
    description: "Overlapping photo tiles for an editorial scrapbook entrance.",
    icon: Layers,
  },
  {
    id: "minimal",
    label: "Minimal Cover",
    shortLabel: "Minimal",
    description: "Clean studio backdrop with a refined, compact hero image.",
    icon: Minimize2,
  },
  {
    id: "bento",
    label: "Bento Cover",
    shortLabel: "Bento",
    description: "Mosaic hero with a dominant feature tile and supporting crops.",
    icon: PanelsTopLeft,
  },
  {
    id: "overlay",
    label: "Overlay Cover",
    shortLabel: "Overlay",
    description: "Full-width image with a rich bottom gradient and title stack.",
    icon: MousePointerClick,
  },
  {
    id: "card-based",
    label: "Card-Based Cover",
    shortLabel: "Card",
    description: "Floating rounded card on a soft branded studio background.",
    icon: LayoutTemplate,
  },
  {
    id: "parallax",
    label: "Parallax Cover",
    shortLabel: "Parallax",
    description: "Immersive fixed-background scroll depth on the hero image.",
    icon: Sparkles,
  },
  {
    id: "hero-carousel",
    label: "Hero Carousel Cover",
    shortLabel: "Carousel",
    description: "Rotating hero slides with indicators for multi-moment galleries.",
    icon: GalleryHorizontal,
  },
  {
    id: "full-bleed",
    label: "Full Bleed Cover",
    shortLabel: "Full bleed",
    description: "Edge-to-edge immersive cover, classic client gallery hero.",
    icon: Maximize2,
  },
  {
    id: "editorial-card",
    label: "Editorial Card Cover",
    shortLabel: "Editorial",
    description: "Rounded feature image on a soft studio backdrop.",
    icon: Columns3,
  },
  {
    id: "film-border",
    label: "Film Border Cover",
    shortLabel: "Film",
    description: "Framed print look with a clean white border.",
    icon: Film,
  },
  {
    id: "split-feature",
    label: "Split Feature Cover",
    shortLabel: "Split",
    description: "Title and actions beside a strong vertical cover image.",
    icon: SplitSquareHorizontal,
  },
] as const satisfies readonly GalleryCoverFrameOption[];

export type GalleryCoverFrame = (typeof GALLERY_COVER_FRAMES)[number]["id"];

const COVER_FRAME_IDS = new Set<string>(GALLERY_COVER_FRAMES.map((frame) => frame.id));

const LEGACY_COVER_FRAME_MAP: Record<string, GalleryCoverFrame> = {
  full: "full-bleed",
  classic: "full-bleed",
  card: "card-based",
  editorial: "editorial-card",
  film: "film-border",
  print: "film-border",
  split: "split-feature",
  carousel: "hero-carousel",
  "hero-carousel": "hero-carousel",
  parallax: "parallax",
  cinematic: "cinematic",
  collage: "collage",
  minimal: "minimal",
  bento: "bento",
  overlay: "overlay",
};

export function galleryCoverFrameLabel(frame: GalleryCoverFrame): string {
  return GALLERY_COVER_FRAMES.find((f) => f.id === frame)?.label ?? "Gallery cover";
}

export function isGalleryCoverFrame(value: string): value is GalleryCoverFrame {
  return COVER_FRAME_IDS.has(value);
}

export function normalizeGalleryCoverFrame(value: unknown): GalleryCoverFrame {
  if (typeof value !== "string") return "full-bleed";
  const normalized = value.trim().toLowerCase().replace(/_/g, "-");
  if (COVER_FRAME_IDS.has(normalized)) return normalized as GalleryCoverFrame;
  return LEGACY_COVER_FRAME_MAP[normalized] ?? "full-bleed";
}

/** Frames that use the compact framed layout branch (not full-viewport bleed). */
export function isFramedGalleryCoverFrame(frame: GalleryCoverFrame): boolean {
  return (
    frame === "editorial-card" ||
    frame === "film-border" ||
    frame === "split-feature" ||
    frame === "card-based"
  );
}
