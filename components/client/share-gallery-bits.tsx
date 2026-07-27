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

/* ----------------------------- image display ----------------------------- */

/** `sizes` for selected-photo strip (4–10 columns). */
export const SELECTED_STRIP_IMAGE_SIZES = "(max-width: 640px) 25vw, (max-width: 900px) 12vw, 120px";

export const SHARE_LIGHTBOX_SIZES = "(max-width: 1280px) 100vw, 896px";

export const SHARE_GALLERY_INITIAL_VISIBLE = 60;
export const SHARE_GALLERY_LOAD_MORE_COUNT = 40;

export function GalleryViewMoreButton({
  onClick,
  remainingCount,
}: {
  onClick: () => void;
  remainingCount: number;
}) {
  return (
    <div className="mt-8 flex justify-center">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        View more
        {remainingCount > 0 ? (
          <span className="ml-2 tabular-nums text-zinc-500 dark:text-zinc-400">
            ({remainingCount} left)
          </span>
        ) : null}
      </button>
    </div>
  );
}

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
    ...(a.url ? { url: a.url } : {}),
    ...(a.displayUrl ? { displayUrl: a.displayUrl } : {}),
    ...(a.previewUrl ? { previewUrl: a.previewUrl } : {}),
    ...(a.isVideo ? { isVideo: true } : {}),
    ...(a.setId !== undefined ? { setId: a.setId } : {}),
    ...(a.derivativesReady === false ? { derivativesReady: false } : {}),
    ...(a.derivativesReady === true ? { derivativesReady: true } : {}),
    ...(a.posterUrl ? { posterUrl: a.posterUrl } : {}),
    ...(a.dashUrl ? { dashUrl: a.dashUrl } : {}),
    ...(a.dashStatus ? { dashStatus: a.dashStatus } : {}),
    ...(a.streamingReady !== undefined ? { streamingReady: a.streamingReady } : {}),
    ...(a.removedFromBrowse ? { removedFromBrowse: true } : {}),
    ...(a.rejectedByClient ? { rejectedByClient: true } : {}),
    ...(a.rejectionComment ? { rejectionComment: a.rejectionComment } : {}),
    ...(a.ai ? { ai: a.ai } : {}),
  }));
}

export function canDownloadShareFinal(
  f: ShareGalleryFinal,
  galleryDownloadsAllowed: boolean,
): boolean {
  if (!galleryDownloadsAllowed) return false;
  if (f.locked) return false;
  if (f.downloadsEnabled === false) return false;
  return true;
}

export function finalDisplaySrc(
  f: ShareGalleryFinal,
  key: PublicGalleryKey | string,
): string {
  if (f.url?.trim()) return f.url.trim();
  const locked = Boolean(f.locked);
  const resolved = resolvePublicGalleryKey(key);
  return locked
    ? f.lockedPreviewUrl || getShareFinalLockedPreviewUrl(resolved, f.id)
    : f.downloadUrl?.trim() || f.url;
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
