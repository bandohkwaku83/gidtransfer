import { progressiveGridSrc } from "@/lib/gallery-media-streaming";

type PreviewMedia = {
  previewUrl?: string;
  displayUrl?: string;
  url?: string;
  thumbUrl: string;
  gridUrl?: string;
  posterUrl?: string;
  isVideo?: boolean;
  derivativesReady?: boolean;
};

function hasBakedPreviewWatermark(asset: PreviewMedia): boolean {
  const wm = (asset.displayUrl ?? asset.previewUrl)?.trim();
  const thumb = asset.thumbUrl.trim();
  return Boolean(wm && thumb && wm !== thumb);
}

/** Best available display URL before falling back to thumbnails. */
export function bestGalleryMediaSrc(asset: PreviewMedia): string {
  return (
    asset.previewUrl?.trim() ||
    asset.displayUrl?.trim() ||
    asset.url?.trim() ||
    asset.thumbUrl.trim()
  );
}

/**
 * Thumbnail URL for grid tiles — prefers progressive `thumbUrl` / `gridUrl`,
 * falls back to `url` while derivatives process. Videos use poster / grid poster.
 */
export function clientGalleryGridSrc(asset: PreviewMedia): string {
  return progressiveGridSrc(asset) || bestGalleryMediaSrc(asset);
}

/** Lightbox / fullscreen URL — prefers API `viewUrl` mapped to preview/display fields. */
export function clientGalleryLightboxSrc(
  asset: PreviewMedia,
  watermarkPreviewEnabled: boolean,
): string {
  if (watermarkPreviewEnabled) {
    const wm = (asset.displayUrl ?? asset.previewUrl)?.trim();
    if (wm) return wm;
  }
  const view = asset.previewUrl?.trim() || asset.displayUrl?.trim();
  if (view) return view;
  const full = asset.url?.trim();
  if (full) return full;
  return asset.thumbUrl.trim();
}

/** Client gallery image URL — prefer watermarked preview when ready, else full image. */
export function clientGalleryAssetSrc(
  asset: PreviewMedia,
  watermarkPreviewEnabled: boolean,
): string {
  return clientGalleryLightboxSrc(asset, watermarkPreviewEnabled);
}

/**
 * CSS overlay fallback only when preview watermarking is on and the API has not
 * supplied a distinct watermarked preview URL yet.
 */
export function shouldShowClientPreviewWatermarkOverlay(
  asset: PreviewMedia,
  watermarkPreviewEnabled: boolean,
  isVideo: boolean,
): boolean {
  if (!watermarkPreviewEnabled || isVideo) return false;
  return !hasBakedPreviewWatermark(asset);
}
