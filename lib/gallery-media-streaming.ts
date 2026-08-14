import { sameOriginUploadsUrl } from "@/lib/api";

/** MPEG-DASH packaging status from gallery photo / final payloads. */
export type DashStatus = "pending" | "processing" | "ready" | "failed" | "skipped";

export type GalleryStreamingFields = {
  /** Progressive JPEG poster for videos (`*-poster.jpg`). */
  posterUrl?: string;
  /** MPEG-DASH manifest (`.mpd`) when packaged. */
  dashUrl?: string;
  dashStatus?: DashStatus;
  /** True when DASH packaging finished or is not applicable. */
  streamingReady?: boolean;
};

const VIDEO_FILE_URL_RE = /\.(mp4|mov|webm|m4v|avi|mkv|ogv)(?:[?#].*)?$/i;
const IMAGE_FILE_URL_RE = /\.(jpe?g|png|webp|gif|avif|bmp|jfif)(?:[?#].*)?$/i;

function urlPathname(url: string): string {
  try {
    return new URL(url, "https://local.invalid").pathname;
  } catch {
    return url;
  }
}

/** True when a URL is a JPEG/PNG/WebP poster or thumb (safe for `<img src>`). */
export function isImagePreviewUrl(url: string | null | undefined): boolean {
  const raw = url?.trim();
  if (!raw) return false;
  return IMAGE_FILE_URL_RE.test(urlPathname(raw));
}

/** True when a URL points at a video file (never use as `<img src>`). */
export function isVideoFileUrl(url: string | null | undefined): boolean {
  const raw = url?.trim();
  if (!raw) return false;
  const pathname = urlPathname(raw);
  if (IMAGE_FILE_URL_RE.test(pathname)) return false;
  if (VIDEO_FILE_URL_RE.test(pathname)) return true;
  // S3 keys under gallery-videos often omit a file extension.
  return /\/gallery-videos\//i.test(pathname);
}

/** First-frame hint for `<video preload="metadata">` tiles (Safari). */
export function videoElementPreviewSrc(url: string): string {
  const raw = sameOriginUploadsUrl(url.trim());
  if (!raw || raw.includes("#")) return raw;
  return `${raw}#t=0.001`;
}

function firstImagePreviewUrl(...candidates: Array<string | null | undefined>): string {
  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (value && isImagePreviewUrl(value)) return value;
  }
  return "";
}

const DASH_STATUSES = new Set<DashStatus>([
  "pending",
  "processing",
  "ready",
  "failed",
  "skipped",
]);

export function normalizeDashStatus(value: unknown): DashStatus | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.trim().toLowerCase() as DashStatus;
  return DASH_STATUSES.has(v) ? v : undefined;
}

/** Read streaming fields from API JSON (camelCase or snake_case). */
export function pickStreamingFields(
  row: Record<string, unknown> | null | undefined,
): GalleryStreamingFields {
  if (!row) return {};
  const posterRaw = row.posterUrl ?? row.poster_url;
  const dashRaw = row.dashUrl ?? row.dash_url;
  const status = normalizeDashStatus(row.dashStatus ?? row.dash_status);
  const streamingReadyRaw = row.streamingReady ?? row.streaming_ready;
  const posterUrl =
    typeof posterRaw === "string" && posterRaw.trim() ? posterRaw.trim() : undefined;
  const dashUrl =
    typeof dashRaw === "string" && dashRaw.trim() ? dashRaw.trim() : undefined;
  const streamingReady =
    streamingReadyRaw === true
      ? true
      : streamingReadyRaw === false
        ? false
        : undefined;
  return {
    ...(posterUrl ? { posterUrl } : {}),
    ...(dashUrl ? { dashUrl } : {}),
    ...(status ? { dashStatus: status } : {}),
    ...(streamingReady !== undefined ? { streamingReady } : {}),
  };
}

export function isDashPlaybackReady(
  media: Pick<GalleryStreamingFields, "dashUrl" | "dashStatus">,
): boolean {
  return Boolean(media.dashUrl?.trim() && media.dashStatus === "ready");
}

/** DASH still encoding — show poster and keep polling. */
export function isVideoStreamingPending(
  media: GalleryStreamingFields & { isVideo?: boolean },
): boolean {
  if (media.isVideo !== true) return false;
  if (media.streamingReady === true) return false;
  const status = media.dashStatus;
  if (status === "ready" || status === "failed" || status === "skipped") return false;
  if (status === "pending" || status === "processing") return true;
  // Fresh upload may omit status briefly; treat unknown + not ready as pending when flagged.
  if (media.streamingReady === false) return true;
  return false;
}

/**
 * Grid tile URL for images: `gridUrl || thumbUrl || url`.
 * While `derivativesReady === false`, `gridUrl` may still equal the master — return ""
 * so the UI shows a skeleton instead of painting a baseline JPEG top-to-bottom.
 * Never prefer master `url` over a real grid/thumb derivative.
 * For videos: prefer `posterUrl` / `gridUrl` (never the raw video file).
 */
export function progressiveGridSrc(media: {
  thumbUrl?: string | null;
  gridUrl?: string | null;
  url?: string | null;
  posterUrl?: string | null;
  isVideo?: boolean;
  derivativesReady?: boolean;
}): string {
  if (media.isVideo) {
    return firstImagePreviewUrl(media.posterUrl, media.gridUrl, media.thumbUrl);
  }
  const grid = media.gridUrl?.trim() || media.thumbUrl?.trim() || "";
  const full = media.url?.trim() || "";
  // Pending: only a distinct progressive derivative — never the master.
  if (media.derivativesReady === false) {
    if (!grid || (full && grid === full)) return "";
    return grid;
  }
  // Ready (or legacy without the flag): gridUrl || thumbUrl || url
  return grid || full;
}

/** Poster for `<video poster>` / grid tile while DASH packages. */
export function videoPosterSrc(media: {
  posterUrl?: string | null;
  gridUrl?: string | null;
  thumbUrl?: string | null;
  lockedPreviewUrl?: string | null;
}): string {
  return firstImagePreviewUrl(
    media.posterUrl,
    media.gridUrl,
    media.lockedPreviewUrl,
    media.thumbUrl,
  );
}

/**
 * True when a grid tile should show a skeleton instead of loading the master file.
 * Images: until `derivativesReady === true`, if there is no distinct progressive thumb yet
 * (`gridUrl` may still equal the original briefly after upload).
 * Videos: packaging in flight with no poster yet.
 * Legacy rows that omit `derivativesReady` keep showing existing thumbs.
 */
export function mediaNeedsGridSkeleton(media: {
  isVideo?: boolean;
  derivativesReady?: boolean;
  gridUrl?: string | null;
  thumbUrl?: string | null;
  url?: string | null;
  posterUrl?: string | null;
  dashStatus?: DashStatus;
  streamingReady?: boolean;
}): boolean {
  if (media.isVideo) {
    if (videoPosterSrc(media)) return false;
    // No JPEG poster yet — the grid falls back to a muted `<video>` frame.
    return !media.url?.trim();
  }
  // Until derivativesReady === true, don't paint the master as a tile.
  if (media.derivativesReady === true) return false;
  if (media.derivativesReady !== false) return false; // legacy / omitted
  const grid = media.gridUrl?.trim() || media.thumbUrl?.trim() || "";
  const full = media.url?.trim() || "";
  if (grid && (!full || grid !== full)) return false;
  return true;
}

export function mediaNeedsClientRefresh(media: {
  isVideo?: boolean;
  derivativesReady?: boolean;
  dashStatus?: DashStatus;
  streamingReady?: boolean;
}): boolean {
  if (media.isVideo) return isVideoStreamingPending(media);
  // Keep polling until the API reports derivativesReady === true.
  if (media.derivativesReady === false) return true;
  return false;
}
