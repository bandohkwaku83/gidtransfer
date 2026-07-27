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
 * Grid tile URL for images: prefer progressive `thumbUrl` / `gridUrl`, fall back to `url`
 * while derivatives are still processing.
 * For videos: prefer `posterUrl` / `gridUrl` (never the raw video file).
 */
export function progressiveGridSrc(media: {
  thumbUrl?: string | null;
  gridUrl?: string | null;
  url?: string | null;
  posterUrl?: string | null;
  isVideo?: boolean;
}): string {
  if (media.isVideo) {
    return (
      media.posterUrl?.trim() ||
      media.gridUrl?.trim() ||
      media.thumbUrl?.trim() ||
      ""
    );
  }
  return (
    media.thumbUrl?.trim() ||
    media.gridUrl?.trim() ||
    media.url?.trim() ||
    ""
  );
}

/** Poster for `<video poster>` / grid tile while DASH packages. */
export function videoPosterSrc(media: {
  posterUrl?: string | null;
  gridUrl?: string | null;
  thumbUrl?: string | null;
  lockedPreviewUrl?: string | null;
}): string {
  return (
    media.posterUrl?.trim() ||
    media.gridUrl?.trim() ||
    media.lockedPreviewUrl?.trim() ||
    media.thumbUrl?.trim() ||
    ""
  );
}

export function mediaNeedsClientRefresh(media: {
  isVideo?: boolean;
  derivativesReady?: boolean;
  dashStatus?: DashStatus;
  streamingReady?: boolean;
}): boolean {
  if (media.derivativesReady === false) return true;
  return isVideoStreamingPending(media);
}
