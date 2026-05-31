import {
  readGalleryAccessClientConfig,
  type GalleryAccessClientConfig,
} from "@/lib/gallery-access-client-config";
import type { NormalizedShareGallery } from "@/lib/share-gallery-api";

/** Merge API fields with local UI bridge config (same browser as photographer dashboard). */
export function mergeGalleryAccessSettings(
  gallery: NormalizedShareGallery,
  sessionId: string,
): NormalizedShareGallery {
  const local: GalleryAccessClientConfig | null = readGalleryAccessClientConfig(sessionId);
  const enabled = gallery.sharePasswordEnabled === true || local?.enabled === true;
  const pin =
    (gallery.shareAccessPin?.replace(/\D/g, "").padStart(4, "0").slice(-4) ||
      local?.pin?.replace(/\D/g, "").padStart(4, "0").slice(-4)) ??
    "";
  return {
    ...gallery,
    sharePasswordEnabled: enabled,
    ...(pin ? { shareAccessPin: pin } : {}),
  };
}
