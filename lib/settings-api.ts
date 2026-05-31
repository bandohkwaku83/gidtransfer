import {
  getDuplicateUploadPreference,
  setDuplicateUploadPreference,
  type DuplicateUploadAction,
} from "@/lib/upload-preferences";
import { HttpError } from "@/lib/http";
import {
  defaultBrandWatermarkSettings,
  getBrandWatermarkSettings,
  normalizeBrandWatermarkSettings,
  saveBrandWatermarkSettings,
  type BrandWatermarkSettings,
} from "@/lib/watermark-brand";

export type ApiSettings = {
  watermarkPreviewImages: boolean;
  brandWatermark: BrandWatermarkSettings;
  defaultCoverImage?: string;
  defaultCoverImageUrl?: string;
  duplicateUploadAction?: DuplicateUploadAction;
};

export type UpdateSettingsInput = {
  watermarkPreviewImages?: boolean;
  brandWatermark?: BrandWatermarkSettings;
  defaultCoverImage?: File | null;
  duplicateUploadAction?: DuplicateUploadAction;
};

export class SettingsApiError extends HttpError {}

async function delay(ms = 20) {
  await new Promise((r) => setTimeout(r, ms));
}

function normalizeSettingsPayload(raw: unknown): ApiSettings {
  const obj =
    raw &&
    typeof raw === "object" &&
    "settings" in raw &&
    (raw as { settings: unknown }).settings &&
    typeof (raw as { settings: unknown }).settings === "object"
      ? ((raw as { settings: Record<string, unknown> }).settings as Record<string, unknown>)
      : raw && typeof raw === "object"
        ? (raw as Record<string, unknown>)
        : {};

  const dupRaw =
    obj.duplicateUploadAction ?? obj.duplicate_upload_action ?? obj.duplicateAction;
  let duplicateUploadAction: DuplicateUploadAction | undefined;
  if (dupRaw === "replace" || dupRaw === "ignore") {
    duplicateUploadAction = dupRaw;
  }

  const brandRaw = obj.brandWatermark ?? obj.brand_watermark;
  const normalized: ApiSettings = {
    watermarkPreviewImages: Boolean(
      obj.watermarkPreviewImages ?? obj.watermark_preview_images,
    ),
    brandWatermark: normalizeBrandWatermarkSettings(
      brandRaw ?? (typeof window !== "undefined" ? getBrandWatermarkSettings() : undefined),
    ),
    defaultCoverImage:
      typeof obj.defaultCoverImage === "string" ? obj.defaultCoverImage : undefined,
    defaultCoverImageUrl:
      typeof obj.defaultCoverImageUrl === "string" ? obj.defaultCoverImageUrl : undefined,
    duplicateUploadAction,
  };

  if (typeof window !== "undefined" && duplicateUploadAction) {
    setDuplicateUploadPreference(duplicateUploadAction);
  }

  return normalized;
}

/** Best URL to show the default cover from settings, or null when none is configured. */
export function getSettingsDefaultCoverUrl(settings: ApiSettings): string | null {
  const u = settings.defaultCoverImageUrl ?? settings.defaultCoverImage;
  if (typeof u === "string" && u.trim() && /^https?:\/\//i.test(u.trim())) return u.trim();
  return null;
}

export async function getSettings(): Promise<ApiSettings> {
  await delay();
  const dup = typeof window !== "undefined" ? getDuplicateUploadPreference() : undefined;
  return normalizeSettingsPayload({
    watermarkPreviewImages: false,
    brandWatermark:
      typeof window !== "undefined"
        ? getBrandWatermarkSettings()
        : defaultBrandWatermarkSettings(),
    duplicateUploadAction: dup,
  });
}

export async function updateSettings(input: UpdateSettingsInput): Promise<ApiSettings> {
  await delay();
  const cur = await getSettings();
  if (input.duplicateUploadAction !== undefined) {
    setDuplicateUploadPreference(input.duplicateUploadAction);
  }
  let defaultCoverImageUrl = cur.defaultCoverImageUrl;
  if (input.defaultCoverImage instanceof File) {
    defaultCoverImageUrl = `https://picsum.photos/seed/${encodeURIComponent(input.defaultCoverImage.name.slice(0, 40))}/1200/900`;
  }
  const brandWatermark =
    input.brandWatermark !== undefined
      ? normalizeBrandWatermarkSettings(input.brandWatermark)
      : cur.brandWatermark;
  if (typeof window !== "undefined" && input.brandWatermark !== undefined) {
    saveBrandWatermarkSettings(brandWatermark);
  }

  return normalizeSettingsPayload({
    watermarkPreviewImages: input.watermarkPreviewImages ?? cur.watermarkPreviewImages,
    brandWatermark,
    defaultCoverImageUrl,
    duplicateUploadAction: input.duplicateUploadAction ?? getDuplicateUploadPreference(),
  });
}
