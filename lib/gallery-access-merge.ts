import {
  readGalleryAccessClientConfig,
  type GalleryAccessClientConfig,
} from "@/lib/gallery-access-client-config";
import {
  readGalleryEmailGateConfig,
  type GalleryEmailGateConfig,
} from "@/lib/gallery-email-access";
import { getFolderOverride } from "@/lib/demo-data";
import { normalizeGalleryCoverColor } from "@/lib/gallery-cover-color";
import { normalizeGalleryCoverFrame } from "@/lib/gallery-cover-frame";
import { normalizeGalleryImageLayout } from "@/lib/gallery-image-layout";
import type { NormalizedShareGallery } from "@/lib/share-gallery-api";

/** Merge API fields with local UI bridge config (same browser as photographer dashboard). */
export function mergeGalleryAccessSettings(
  gallery: NormalizedShareGallery,
  sessionId: string,
): NormalizedShareGallery {
  const local: GalleryAccessClientConfig | null = readGalleryAccessClientConfig(sessionId);
  const localEmail: GalleryEmailGateConfig | null = readGalleryEmailGateConfig(sessionId);
  const enabled =
    gallery.sharePasswordEnabled === true
      ? true
      : gallery.sharePasswordEnabled === false
        ? false
        : local?.enabled === true;
  const pin =
    (gallery.shareAccessPin?.replace(/\D/g, "").padStart(4, "0").slice(-4) ||
      local?.pin?.replace(/\D/g, "").padStart(4, "0").slice(-4)) ??
    "";
  const emailGateEnabled =
    gallery.emailGateEnabled === true
      ? true
      : gallery.emailGateEnabled === false
        ? false
        : localEmail?.enabled === true;
  let merged: NormalizedShareGallery = {
    ...gallery,
    sharePasswordEnabled: enabled,
    emailGateEnabled,
    ...(pin ? { shareAccessPin: pin } : {}),
  };

  const folderId = merged.folderId;
  if (!folderId) return merged;
  const override = getFolderOverride(folderId);
  if (!override) return merged;
  if (override.coverFrame) {
    merged = {
      ...merged,
      coverFrame: normalizeGalleryCoverFrame(override.coverFrame),
    };
  }
  if (override.coverColor) {
    merged = {
      ...merged,
      coverColor: normalizeGalleryCoverColor(override.coverColor),
    };
  }
  if (override.imageLayout) {
    merged = {
      ...merged,
      imageLayout: normalizeGalleryImageLayout(override.imageLayout),
    };
  }
  if (override.watermarkPreviewEnabled !== undefined) {
    merged = {
      ...merged,
      watermarkPreviewEnabled: override.watermarkPreviewEnabled,
    };
  }
  return merged;
}
