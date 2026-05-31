/**
 * Layout helpers and constants for the client share gallery only.
 * Used by `client-gallery-app.tsx` — not the photographer dashboard.
 */

import type { DemoAsset, SelectionState } from "@/lib/demo-data";
import {
  GALLERY_IMAGE_LAYOUTS,
  type GalleryImageLayout,
  type GridLayout,
  editedCardClass,
  galleryListClass,
  isCollageGridLayout,
  isGridLayout,
  isGalleryImageLayout,
  normalizeGalleryImageLayout,
  shareGalleryGridSizes,
  uploadImageWrapClass,
  uploadItemClass,
} from "@/lib/gallery-image-layout";
import {
  getShareFinalLockedPreviewUrl,
  resolvePublicGalleryKey,
  type PublicGalleryKey,
  type ShareGalleryAsset,
  type ShareGalleryFinal,
} from "@/lib/share-gallery-api";

export const GRID_STORAGE_PREFIX = "gidostorage-share-grid:v3:";
export const GALLERY_MUSIC_MUTE_PREFIX = "gidostorage-share-music-muted:";

export type { GalleryImageLayout, GridLayout };

export const GRID_LAYOUTS = GALLERY_IMAGE_LAYOUTS;

export {
  editedCardClass,
  galleryListClass,
  isCollageGridLayout,
  isGridLayout,
  isGalleryImageLayout,
  normalizeGalleryImageLayout,
  shareGalleryGridSizes,
  uploadImageWrapClass,
  uploadItemClass,
};

/* ----------------------------- next/image hints ----------------------------- */

export const SHARE_GRID_IMAGE_QUALITY = 78;
export const SHARE_LIGHTBOX_IMAGE_QUALITY = 82;

/** `sizes` for selected-photo strip (4–10 columns). */
export const SELECTED_STRIP_IMAGE_SIZES = "(max-width: 640px) 25vw, (max-width: 900px) 12vw, 120px";

export const SHARE_LIGHTBOX_SIZES = "(max-width: 1280px) 100vw, 896px";

export function isClientAssetVideo(asset: Pick<DemoAsset, "isVideo" | "originalName" | "previewUrl" | "thumbUrl">): boolean {
  if (asset.isVideo) return true;
  return [asset.originalName, asset.previewUrl, asset.thumbUrl].some((value) =>
    /\.(mp4|mov|webm|m4v|avi|mkv|ogv)(?:[?#].*)?$/i.test(value ?? ""),
  );
}

/** Bottom-right icon row on gallery tiles (reference: heart, download, share). */
export const galleryTileHoverActionsClass =
  "pointer-events-auto absolute inset-x-0 bottom-0 z-10 flex justify-end gap-3 p-3 opacity-100 transition-opacity duration-200 sm:pointer-events-none sm:opacity-0 sm:group-hover:pointer-events-auto sm:group-hover:opacity-100 sm:group-focus-within:pointer-events-auto sm:group-focus-within:opacity-100";

export const galleryTileHoverIconClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/65 text-white shadow-lg ring-1 ring-white/20 backdrop-blur-sm transition hover:bg-black/80 disabled:opacity-40";

/* ----------------------------- small helpers ----------------------------- */

export function clientInitials(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]?.[0];
    const b = parts[parts.length - 1]?.[0];
    if (a && b) return `${a}${b}`.toUpperCase();
  }
  return t.slice(0, 2).toUpperCase();
}

export function toDemoAssets(shareAssets: ShareGalleryAsset[]): DemoAsset[] {
  return shareAssets.map((a) => ({
    id: a.id,
    originalName: a.originalName,
    selection: a.selection as SelectionState,
    editState: "NONE",
    clientComment: a.clientComment ?? a.rejectionComment ?? "",
    photographerReply: a.photographerReply ?? "",
    hasEdited: false,
    thumbUrl: a.thumbUrl,
    ...(a.previewUrl ? { previewUrl: a.previewUrl } : {}),
    ...(a.isVideo ? { isVideo: true } : {}),
  }));
}

export function finalDisplaySrc(
  f: ShareGalleryFinal,
  key: PublicGalleryKey | string,
): string {
  const locked = Boolean(f.locked);
  const resolved = resolvePublicGalleryKey(key);
  return locked
    ? f.lockedPreviewUrl || getShareFinalLockedPreviewUrl(resolved, f.id)
    : f.url;
}

/** Unlocked originals may be video; locked delivery always uses the JPEG locked-preview URL. */
export function isShareFinalVideo(f: ShareGalleryFinal): boolean {
  if (f.isVideo) return true;
  const m = f.mimeType?.toLowerCase() ?? "";
  if (m.startsWith("video/")) return true;
  return [f.name, f.url].some((value) =>
    /\.(mp4|mov|webm|m4v|avi|mkv|ogv)(?:[?#].*)?$/i.test(value ?? ""),
  );
}
