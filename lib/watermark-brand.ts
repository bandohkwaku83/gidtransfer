export type WatermarkPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center";

export type WatermarkTemplateSettings = {
  position: WatermarkPosition;
  /** Logo width as % of the shorter edge of the export (5–40). */
  sizePercent: number;
  /** 10–100 */
  opacity: number;
};

/** Normalized crop on the uploaded logo (0–1). */
export type WatermarkLogoCrop = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type BrandWatermarkSettings = {
  enabled: boolean;
  logoDataUrl: string | null;
  crop: WatermarkLogoCrop | null;
  portrait: WatermarkTemplateSettings;
  landscape: WatermarkTemplateSettings;
};

export const WATERMARK_POSITIONS: { id: WatermarkPosition; label: string }[] = [
  { id: "top-left", label: "Top left" },
  { id: "top-right", label: "Top right" },
  { id: "bottom-left", label: "Bottom left" },
  { id: "bottom-right", label: "Bottom right" },
  { id: "center", label: "Center" },
];

export const DEFAULT_PORTRAIT_TEMPLATE: WatermarkTemplateSettings = {
  position: "bottom-right",
  sizePercent: 18,
  opacity: 85,
};

export const DEFAULT_LANDSCAPE_TEMPLATE: WatermarkTemplateSettings = {
  position: "bottom-right",
  sizePercent: 12,
  opacity: 85,
};

export function defaultBrandWatermarkSettings(): BrandWatermarkSettings {
  return {
    enabled: false,
    logoDataUrl: null,
    crop: null,
    portrait: { ...DEFAULT_PORTRAIT_TEMPLATE },
    landscape: { ...DEFAULT_LANDSCAPE_TEMPLATE },
  };
}

const STORAGE_KEY = "gidostorage_brand_watermark_v1";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function normalizeTemplate(raw: unknown, fallback: WatermarkTemplateSettings): WatermarkTemplateSettings {
  if (!raw || typeof raw !== "object") return { ...fallback };
  const o = raw as Record<string, unknown>;
  const pos = o.position;
  const position = WATERMARK_POSITIONS.some((p) => p.id === pos)
    ? (pos as WatermarkPosition)
    : fallback.position;
  const sizePercent = clamp(Number(o.sizePercent ?? o.size_percent ?? fallback.sizePercent), 5, 40);
  const opacity = clamp(Number(o.opacity ?? fallback.opacity), 10, 100);
  return { position, sizePercent, opacity };
}

function normalizeCrop(raw: unknown): WatermarkLogoCrop | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const x = Number(o.x);
  const y = Number(o.y);
  const w = Number(o.w);
  const h = Number(o.h);
  if (![x, y, w, h].every(Number.isFinite)) return null;
  if (w <= 0 || h <= 0) return null;
  return {
    x: clamp(x, 0, 1),
    y: clamp(y, 0, 1),
    w: clamp(w, 0.05, 1),
    h: clamp(h, 0.05, 1),
  };
}

export function normalizeBrandWatermarkSettings(raw: unknown): BrandWatermarkSettings {
  const base = defaultBrandWatermarkSettings();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  return {
    enabled: Boolean(o.enabled ?? o.brandWatermarkEnabled),
    logoDataUrl:
      typeof o.logoDataUrl === "string"
        ? o.logoDataUrl
        : typeof o.logo_data_url === "string"
          ? o.logo_data_url
          : null,
    crop: normalizeCrop(o.crop),
    portrait: normalizeTemplate(o.portrait, DEFAULT_PORTRAIT_TEMPLATE),
    landscape: normalizeTemplate(o.landscape, DEFAULT_LANDSCAPE_TEMPLATE),
  };
}

export function getBrandWatermarkSettings(): BrandWatermarkSettings {
  if (typeof window === "undefined") return defaultBrandWatermarkSettings();
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultBrandWatermarkSettings();
    return normalizeBrandWatermarkSettings(JSON.parse(raw) as unknown);
  } catch {
    return defaultBrandWatermarkSettings();
  }
}

export function saveBrandWatermarkSettings(settings: BrandWatermarkSettings): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function effectiveLogoDataUrl(settings: BrandWatermarkSettings): string | null {
  const url = settings.logoDataUrl?.trim();
  return url || null;
}

export function isImageMime(mime: string): boolean {
  const m = mime.toLowerCase();
  return m.startsWith("image/") && !m.includes("svg");
}
