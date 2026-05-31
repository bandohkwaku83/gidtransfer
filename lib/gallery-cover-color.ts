import type { CSSProperties } from "react";
import type { GalleryCoverFrame } from "@/lib/gallery-cover-frame";

export const DEFAULT_GALLERY_COVER_COLOR = "#18181b";

export type GalleryCoverColorPreset = {
  id: string;
  hex: string;
  label: string;
};

/** Studio-friendly backdrop swatches for cover styles that use a solid hero color. */
export const GALLERY_COVER_COLOR_PRESETS: readonly GalleryCoverColorPreset[] = [
  { id: "charcoal", hex: "#18181b", label: "Charcoal" },
  { id: "ink", hex: "#0f172a", label: "Ink" },
  { id: "forest", hex: "#14532d", label: "Forest" },
  { id: "wine", hex: "#4c0519", label: "Wine" },
  { id: "navy", hex: "#1e3a5f", label: "Navy" },
  { id: "clay", hex: "#78350f", label: "Clay" },
  { id: "stone", hex: "#44403c", label: "Stone" },
  { id: "cream", hex: "#f4f1ea", label: "Cream" },
] as const;

export function normalizeGalleryCoverColor(value: unknown): string {
  if (typeof value !== "string") return DEFAULT_GALLERY_COVER_COLOR;
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return DEFAULT_GALLERY_COVER_COLOR;
}

export function coverColorsMatch(a: unknown, b: unknown): boolean {
  return normalizeGalleryCoverColor(a) === normalizeGalleryCoverColor(b);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = normalizeGalleryCoverColor(hex);
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/.exec(normalized);
  if (!match) return null;
  return {
    r: Number.parseInt(match[1], 16),
    g: Number.parseInt(match[2], 16),
    b: Number.parseInt(match[3], 16),
  };
}

export function coverColorWithAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  const a = Math.min(1, Math.max(0, alpha));
  if (!rgb) return `rgba(24, 24, 27, ${a})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
}

/** Relative luminance 0–1 (sRGB). Higher = lighter surface. */
export function coverColorLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const channels = [rgb.r, rgb.g, rgb.b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

export function coverColorUsesLightText(hex: string): boolean {
  return coverColorLuminance(hex) < 0.42;
}

/** Styles that paint a solid or tinted backdrop (not full-bleed image-only). */
export function galleryCoverUsesBackdropColor(frame: GalleryCoverFrame): boolean {
  return frame !== "minimal" && frame !== "full-bleed";
}

export function coverBackdropStyle(hex: string | undefined): CSSProperties | undefined {
  if (!hex) return undefined;
  return { backgroundColor: normalizeGalleryCoverColor(hex) };
}

export function coverGradientToTop(hex: string, topAlpha = 0.88, midAlpha = 0.38): string {
  const c = normalizeGalleryCoverColor(hex);
  return `linear-gradient(to top, ${coverColorWithAlpha(c, topAlpha)}, ${coverColorWithAlpha(c, midAlpha)}, transparent)`;
}

export function coverGradientDiagonal(hex: string): string {
  const c = normalizeGalleryCoverColor(hex);
  return `linear-gradient(to bottom right, ${coverColorWithAlpha(c, 0.92)}, ${coverColorWithAlpha(c, 0.72)}, ${coverColorWithAlpha(c, 0.92)})`;
}
