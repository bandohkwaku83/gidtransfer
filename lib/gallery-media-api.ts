import { resolveGridThumbUrl, sameOriginUploadsUrl } from "@/lib/api";
import { s3UploadGalleryFinals, s3UploadGalleryPhotos } from "@/lib/gallery-upload-s3";
import { authedJson } from "@/lib/http";
import type { ApiFolderMedia, GalleryUploadsPagination } from "@/lib/folders/types";
import { FoldersApiError } from "@/lib/folders/types";
import type { DuplicateUploadAction } from "@/lib/upload-preferences";

export type ApiGalleryPhoto = {
  id: string;
  galleryId?: string;
  originalFilename: string;
  url: string;
  /** Unwatermarked thumbnail (`*-thumb.jpg`). */
  thumbUrl?: string;
  /** Grid-optimized thumbnail (GET uploads?view=grid). */
  gridUrl?: string;
  /** Watermarked client preview (`*-preview-wm.jpg`) when generated. */
  displayUrl?: string;
  mimeType?: string;
  contentType?: string;
  sizeBytes?: number;
  isVideo?: boolean;
  deletedAt?: string | null;
  restoreDeadline?: string | null;
  selectedByClient?: boolean;
  clientComment?: string;
  comment?: string;
  photographerReply?: string;
  photographerRepliedAt?: string | null;
  selectedAt?: string | null;
  flaggedByClient?: boolean;
  flaggedAt?: string | null;
  locked?: boolean;
  isLocked?: boolean;
  outstandingBalanceGhs?: number | null;
  clientPaid?: boolean;
  createdAt?: string;
  updatedAt?: string;
  setId?: string | null;
  /** False while thumbnails / watermarked previews are still processing. */
  derivativesReady?: boolean;
};

export type GalleryUploadPhotosResult = {
  message?: string;
  created?: ApiGalleryPhoto[];
  replaced?: ApiGalleryPhoto[];
  skipped?: string[];
  conflicts?: { filename: string; existingId: string }[];
};

export type GalleryMediaBundle = {
  uploads: ApiFolderMedia[];
  uploadsPagination?: GalleryUploadsPagination;
  selection: ApiFolderMedia[];
  finals: ApiFolderMedia[];
  flaggedFinals: ApiFolderMedia[];
  selectionLocked?: boolean;
  selectionSubmittedAt?: string | null;
};

export type GalleryUploadsListOptions = {
  view?: "grid" | "full";
  cursor?: string;
  limit?: number;
  ids?: string[];
};

export type GalleryUploadsListResult = {
  uploads: ApiFolderMedia[];
  pagination: GalleryUploadsPagination;
};

function galleryPath(id: string) {
  return `/api/galleries/${encodeURIComponent(id)}`;
}

function duplicateActionToOnConflict(action?: DuplicateUploadAction): "skip" | "replace" {
  return action === "replace" ? "replace" : "skip";
}

export type GalleryUploadBatchProgress = {
  fileIndex: number;
  fileCount: number;
};

function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url?.trim()) return undefined;
  return sameOriginUploadsUrl(url.trim());
}

export function galleryPhotoToApiFolderMedia(photo: ApiGalleryPhoto): ApiFolderMedia {
  const row = photo as ApiGalleryPhoto & { grid_url?: string; thumb_url?: string };
  const url = resolveMediaUrl(photo.url);
  const displayUrl = resolveMediaUrl(photo.displayUrl);
  const gridThumb = resolveGridThumbUrl(
    row.gridUrl || row.grid_url || row.thumbUrl || row.thumb_url,
  );
  const mimeType = photo.mimeType || photo.contentType || "";
  const isVideo =
    photo.isVideo === true ||
    mimeType.toLowerCase().startsWith("video/") ||
    /\.(mp4|mov|webm|m4v|avi|mkv|ogv)$/i.test(photo.originalFilename) ||
    /\.(mp4|mov|webm|m4v|avi|mkv|ogv)(?:[?#].*)?$/i.test(url ?? "");
  const resolvedThumb = isVideo ? undefined : gridThumb;
  const previewUrl =
    isVideo
      ? url
      : displayUrl && resolvedThumb && displayUrl !== resolvedThumb
        ? displayUrl
        : undefined;
  return {
    _id: photo.id,
    id: photo.id,
    originalFilename: photo.originalFilename,
    originalName: photo.originalFilename,
    filename: photo.originalFilename,
    name: photo.originalFilename,
    url,
    ...(displayUrl ? { displayUrl } : {}),
    thumbUrl: resolvedThumb,
    ...(resolvedThumb ? { gridUrl: resolvedThumb } : {}),
    ...(previewUrl ? { previewUrl } : {}),
    mimeType,
    isVideo,
    selected: photo.selectedByClient === true,
    isSelected: photo.selectedByClient === true,
    selection: photo.selectedByClient ? "SELECTED" : "UNSELECTED",
    clientComment: photo.clientComment ?? photo.comment ?? "",
    comment: photo.comment ?? photo.clientComment ?? "",
    photographerReply: photo.photographerReply ?? "",
    photographerRepliedAt: photo.photographerRepliedAt ?? null,
    flaggedByClient: photo.flaggedByClient === true,
    flaggedAt: photo.flaggedAt ?? null,
    locked: photo.locked === true || photo.isLocked === true,
    ...(photo.outstandingBalanceGhs != null
      ? { outstandingBalanceGhs: photo.outstandingBalanceGhs }
      : {}),
    ...(photo.clientPaid !== undefined ? { clientPaid: photo.clientPaid } : {}),
    setId: photo.setId ?? null,
    derivativesReady: photo.derivativesReady,
  };
}

/** Photographer dashboard grid — prefer gridUrl/thumbUrl, fall back to full image while processing. */
export function folderUploadGridSrc(
  media: Pick<ApiFolderMedia, "gridUrl" | "thumbUrl" | "url" | "thumbnailUrl">,
): string {
  const thumb = (media.gridUrl || media.thumbUrl || media.thumbnailUrl || "").trim();
  const full = (media.url || "").trim();
  return thumb || full;
}

function galleryPhotoDerivativesPending(photo: ApiGalleryPhoto): boolean {
  if (photo.derivativesReady === false) return true;
  const mime = (photo.mimeType || photo.contentType || "").toLowerCase();
  if (photo.isVideo === true || mime.startsWith("video/")) return false;
  return false;
}

export function galleryPhotosPendingDerivatives(photos: ApiGalleryPhoto[]): string[] {
  return photos.filter(galleryPhotoDerivativesPending).map((p) => p.id);
}

export function upsertGalleryUploadRows(
  existing: ApiFolderMedia[],
  incoming: ApiFolderMedia[],
): ApiFolderMedia[] {
  if (incoming.length === 0) return existing;
  const byId = new Map<string, ApiFolderMedia>();
  for (const row of existing) {
    const id = row.id ?? row._id;
    if (id) byId.set(String(id), row);
  }
  for (const row of incoming) {
    const id = row.id ?? row._id;
    if (id) byId.set(String(id), row);
  }
  const incomingIds = new Set(
    incoming.map((row) => String(row.id ?? row._id ?? "")).filter(Boolean),
  );
  const next: ApiFolderMedia[] = [];
  const seen = new Set<string>();
  for (const row of existing) {
    const id = String(row.id ?? row._id ?? "");
    if (!id || !byId.has(id)) continue;
    next.push(byId.get(id)!);
    seen.add(id);
  }
  for (const row of incoming) {
    const id = String(row.id ?? row._id ?? "");
    if (!id || seen.has(id)) continue;
    next.push(byId.get(id)!);
    seen.add(id);
  }
  return next;
}

const DERIVATIVES_POLL_MS = 2000;
const DERIVATIVES_POLL_MAX_MS = 10_000;

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/** Poll GET /uploads until listed photos report derivativesReady. */
export async function pollGalleryUploadDerivatives(
  galleryId: string,
  photoIds: string[],
  onPhotoReady: (photo: ApiGalleryPhoto) => void,
  signal?: AbortSignal,
): Promise<void> {
  const pending = new Set(photoIds.filter(Boolean));
  if (pending.size === 0) return;

  let intervalMs = DERIVATIVES_POLL_MS;

  while (pending.size > 0) {
    if (signal?.aborted) return;
    try {
      await sleep(intervalMs, signal);
    } catch {
      return;
    }
    if (signal?.aborted) return;
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      continue;
    }

    const res = await authedJson<{ photos?: ApiGalleryPhoto[] }>(
      `${galleryPath(galleryId)}/uploads?${new URLSearchParams({
        ids: [...pending].join(","),
      }).toString()}`,
      { method: "GET" },
      "Failed to refresh uploads",
      FoldersApiError,
    );
    const photos = normalizePhotoList(res, ["photos"]);
    for (const photo of photos) {
      if (!pending.has(photo.id)) continue;
      if (photo.derivativesReady !== true) continue;
      pending.delete(photo.id);
      onPhotoReady(photo);
    }
    intervalMs = Math.min(Math.round(intervalMs * 1.4), DERIVATIVES_POLL_MAX_MS);
  }
}

function normalizePhotoList(body: unknown, keys: string[]): ApiGalleryPhoto[] {
  if (!body || typeof body !== "object") return [];
  const o = body as Record<string, unknown>;
  for (const k of keys) {
    const v = o[k];
    if (Array.isArray(v)) return v as ApiGalleryPhoto[];
  }
  if (Array.isArray(body)) return body as ApiGalleryPhoto[];
  return [];
}

function normalizeSelectionList(body: unknown): ApiGalleryPhoto[] {
  const direct = normalizePhotoList(body, [
    "selections",
    "selection",
    "photos",
    "items",
  ]);
  if (direct.length > 0) return direct;

  if (!body || typeof body !== "object") return [];
  const rows = (body as Record<string, unknown>).selections;
  if (!Array.isArray(rows)) return [];

  const out: ApiGalleryPhoto[] = [];
  for (const item of rows) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const nested = row.raw ?? row.photo ?? row.upload;
    if (nested && typeof nested === "object") {
      const p = nested as ApiGalleryPhoto;
      out.push({
        ...p,
        id:
          (typeof row.id === "string" && row.id) ||
          (typeof row._id === "string" && row._id) ||
          p.id,
        clientComment:
          (typeof row.clientComment === "string" && row.clientComment) ||
          p.clientComment ||
          "",
        photographerReply:
          (typeof row.photographerReply === "string" && row.photographerReply) ||
          p.photographerReply ||
          "",
        selectedByClient: true,
      });
      continue;
    }
    out.push({ ...(row as ApiGalleryPhoto), selectedByClient: true });
  }
  return out;
}

export function parseRestoreBefore(body: unknown): string {
  if (body && typeof body === "object") {
    const o = body as Record<string, unknown>;
    for (const k of ["restoreBefore", "restoreDeadline", "restore_deadline"] as const) {
      const v = o[k];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    const deleted = o.deleted;
    if (deleted && typeof deleted === "object") {
      const d = deleted as Record<string, unknown>;
      for (const k of ["restoreBefore", "restoreDeadline"] as const) {
        const v = d[k];
        if (typeof v === "string" && v.trim()) return v.trim();
      }
    }
  }
  return new Date(Date.now() + 30 * 86400000).toISOString();
}

function normalizeUploadsPagination(body: unknown): GalleryUploadsPagination {
  if (!body || typeof body !== "object") return { hasMore: false, nextCursor: null };
  const root = body as Record<string, unknown>;
  const raw = root.pagination;
  if (!raw || typeof raw !== "object") return { hasMore: false, nextCursor: null };
  const pg = raw as Record<string, unknown>;
  const nextCursor =
    (typeof pg.nextCursor === "string" && pg.nextCursor.trim()) ||
    (typeof pg.next_cursor === "string" && pg.next_cursor.trim()) ||
    null;
  return {
    hasMore: pg.hasMore === true || pg.has_more === true,
    nextCursor,
  };
}

function buildUploadsQuery(options: GalleryUploadsListOptions = {}): string {
  const qs = new URLSearchParams();
  if (options.view) qs.set("view", options.view);
  if (options.cursor?.trim()) qs.set("cursor", options.cursor.trim());
  if (options.limit != null && options.limit > 0) qs.set("limit", String(options.limit));
  if (options.ids?.length) qs.set("ids", options.ids.filter(Boolean).join(","));
  const query = qs.toString();
  return query ? `?${query}` : "";
}

/** Single page from GET /api/galleries/:id/uploads */
export async function fetchGalleryUploadsPage(
  galleryId: string,
  options: GalleryUploadsListOptions = {},
): Promise<GalleryUploadsListResult> {
  const res = await authedJson<Record<string, unknown>>(
    `${galleryPath(galleryId)}/uploads${buildUploadsQuery(options)}`,
    { method: "GET" },
    "Failed to load uploads",
    FoldersApiError,
  );
  return {
    uploads: normalizePhotoList(res, ["photos"]).map(galleryPhotoToApiFolderMedia),
    pagination: normalizeUploadsPagination(res),
  };
}

/** Fetch every uploads page (grid view) — for bulk operations that need all filenames/ids. */
export async function listAllGalleryUploads(galleryId: string): Promise<ApiFolderMedia[]> {
  const all: ApiFolderMedia[] = [];
  let cursor: string | undefined;
  for (;;) {
    const page = await fetchGalleryUploadsPage(galleryId, { view: "grid", cursor });
    all.push(...page.uploads);
    if (!page.pagination.hasMore || !page.pagination.nextCursor) break;
    cursor = page.pagination.nextCursor;
  }
  return all;
}

/** First page of grid uploads (photo grid default). */
export async function listGalleryUploads(galleryId: string): Promise<ApiFolderMedia[]> {
  const page = await fetchGalleryUploadsPage(galleryId, { view: "grid" });
  return page.uploads;
}

export async function listGallerySelections(galleryId: string): Promise<ApiFolderMedia[]> {
  const bundle = await fetchGallerySelections(galleryId);
  return bundle.photos;
}

type GallerySelectionsResponse = {
  selectionSubmittedAt?: string | null;
  selectionLocked?: boolean;
  photos?: ApiGalleryPhoto[];
  flaggedFinals?: ApiGalleryPhoto[];
};

export async function fetchGallerySelections(galleryId: string): Promise<{
  photos: ApiFolderMedia[];
  flaggedFinals: ApiFolderMedia[];
  selectionLocked?: boolean;
  selectionSubmittedAt?: string | null;
}> {
  const res = await authedJson<GallerySelectionsResponse>(
    `${galleryPath(galleryId)}/selections`,
    { method: "GET" },
    "Failed to load selections",
    FoldersApiError,
  );
  const photos = normalizeSelectionList(res).map(galleryPhotoToApiFolderMedia);
  const flaggedFromResponse = normalizePhotoList(res, ["flaggedFinals"]).map(
    galleryPhotoToApiFolderMedia,
  );
  return {
    photos,
    flaggedFinals: flaggedFromResponse,
    selectionLocked: res.selectionLocked === true,
    selectionSubmittedAt: res.selectionSubmittedAt ?? null,
  };
}

export async function listGalleryFinals(galleryId: string): Promise<ApiFolderMedia[]> {
  const res = await authedJson<{ finals?: ApiGalleryPhoto[] }>(
    `${galleryPath(galleryId)}/finals`,
    { method: "GET" },
    "Failed to load finals",
    FoldersApiError,
  );
  return normalizePhotoList(res, ["finals", "photos"]).map(galleryPhotoToApiFolderMedia);
}

export async function listGalleryFlaggedFinals(galleryId: string): Promise<ApiFolderMedia[]> {
  const res = await authedJson<{ count?: number; flaggedFinals?: ApiGalleryPhoto[] }>(
    `${galleryPath(galleryId)}/finals/flagged`,
    { method: "GET" },
    "Failed to load flagged finals",
    FoldersApiError,
  );
  return normalizePhotoList(res, ["flaggedFinals", "finals", "photos"]).map(
    galleryPhotoToApiFolderMedia,
  );
}

export async function fetchGalleryMedia(galleryId: string): Promise<GalleryMediaBundle> {
  const [uploadsPage, selectionBundle, finals, flaggedFromEndpoint] = await Promise.all([
    fetchGalleryUploadsPage(galleryId, { view: "grid" }),
    fetchGallerySelections(galleryId),
    listGalleryFinals(galleryId),
    listGalleryFlaggedFinals(galleryId).catch(() => [] as ApiFolderMedia[]),
  ]);

  const flaggedFinals =
    flaggedFromEndpoint.length > 0 ? flaggedFromEndpoint : selectionBundle.flaggedFinals;

  return {
    uploads: uploadsPage.uploads,
    uploadsPagination: uploadsPage.pagination,
    selection: selectionBundle.photos,
    finals,
    flaggedFinals,
    selectionLocked: selectionBundle.selectionLocked,
    selectionSubmittedAt: selectionBundle.selectionSubmittedAt,
  };
}

export async function uploadGalleryPhotos(
  galleryId: string,
  files: File[],
  options?: {
    onConflict?: DuplicateUploadAction;
    setId?: string | null;
    applyPreviewWatermark?: boolean;
    onProgress?: (
      loaded: number,
      total: number,
      lengthComputable: boolean,
      batch?: GalleryUploadBatchProgress,
    ) => void;
  },
): Promise<GalleryUploadPhotosResult & { ignoredDuplicatesCount: number }> {
  if (files.length === 0) {
    return { ignoredDuplicatesCount: 0, skipped: [], created: [], replaced: [] };
  }

  const merged = await s3UploadGalleryPhotos(galleryId, files, {
    onConflict: duplicateActionToOnConflict(options?.onConflict),
    setId: options?.setId,
    applyPreviewWatermark: options?.applyPreviewWatermark,
    onProgress: options?.onProgress,
  });

  const ignoredDuplicatesCount = Array.isArray(merged.skipped) ? merged.skipped.length : 0;
  return { ...merged, ignoredDuplicatesCount };
}

export async function uploadGalleryFinals(
  galleryId: string,
  files: File[],
  options?: {
    clientPaid?: boolean;
    outstandingBalanceGhs?: string | number;
    lockPreviews?: boolean;
    setId?: string | null;
    applyWatermark?: boolean;
    onProgress?: (
      loaded: number,
      total: number,
      lengthComputable: boolean,
      batch?: GalleryUploadBatchProgress,
    ) => void;
  },
): Promise<{ message?: string; created?: ApiGalleryPhoto[]; ignoredDuplicatesCount: number }> {
  if (files.length === 0) {
    return { ignoredDuplicatesCount: 0, created: [] };
  }

  const result = await s3UploadGalleryFinals(galleryId, files, {
    clientPaid: options?.clientPaid,
    outstandingBalanceGhs: options?.outstandingBalanceGhs,
    lockPreviews: options?.lockPreviews,
    setId: options?.setId,
    applyWatermark: options?.applyWatermark,
    onProgress: options?.onProgress,
  });

  const ignoredDuplicatesCount = Array.isArray(result.skipped) ? result.skipped.length : 0;
  return {
    message: result.message,
    created: result.created as ApiGalleryPhoto[] | undefined,
    ignoredDuplicatesCount,
  };
}

export async function deleteGalleryUpload(
  galleryId: string,
  photoId: string,
): Promise<{ message: string; restoreBefore: string }> {
  const body = await authedJson<unknown>(
    `${galleryPath(galleryId)}/uploads/${encodeURIComponent(photoId)}`,
    { method: "DELETE" },
    "Failed to delete upload",
    FoldersApiError,
  );
  return {
    message: extractDeleteMessage(body, "Moved to trash."),
    restoreBefore: parseRestoreBefore(body),
  };
}

export async function restoreGalleryUpload(
  galleryId: string,
  photoId: string,
): Promise<{ message?: string }> {
  return authedJson<{ message?: string }>(
    `${galleryPath(galleryId)}/uploads/${encodeURIComponent(photoId)}/restore`,
    { method: "POST" },
    "Failed to restore upload",
    FoldersApiError,
  );
}

export async function bulkDeleteGalleryUploads(
  galleryId: string,
  payload: { photoIds?: string[]; all?: boolean },
): Promise<{ message: string; deletedCount: number; restoreBefore: string }> {
  const body = await authedJson<unknown>(
    `${galleryPath(galleryId)}/uploads/bulk-delete`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "Failed to delete uploads",
    FoldersApiError,
  );
  return normalizeBulkDeleteResult(body, payload.photoIds?.length ?? 0);
}

export async function deleteGalleryFinal(
  galleryId: string,
  finalId: string,
): Promise<{ message: string; restoreBefore: string }> {
  const body = await authedJson<unknown>(
    `${galleryPath(galleryId)}/finals/${encodeURIComponent(finalId)}`,
    { method: "DELETE" },
    "Failed to delete final",
    FoldersApiError,
  );
  return {
    message: extractDeleteMessage(body, "Moved to trash."),
    restoreBefore: parseRestoreBefore(body),
  };
}

export async function bulkDeleteGalleryFinals(
  galleryId: string,
  payload: { finalIds?: string[]; all?: boolean },
): Promise<{ message: string; deletedCount: number; restoreBefore: string }> {
  const body = await authedJson<unknown>(
    `${galleryPath(galleryId)}/finals/bulk-delete`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "Failed to delete finals",
    FoldersApiError,
  );
  return normalizeBulkDeleteResult(body, payload.finalIds?.length ?? 0);
}

export async function patchGalleryFinalsLock(
  galleryId: string,
  body: {
    isLocked: boolean;
    clientPaid: boolean;
    outstandingBalanceGhs?: number;
  },
): Promise<{ message?: string }> {
  return authedJson<{ message?: string }>(
    `${galleryPath(galleryId)}/finals/lock`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
    "Failed to update final delivery lock",
    FoldersApiError,
  );
}

export async function patchGalleryFinalLock(
  galleryId: string,
  finalId: string,
  body: { isLocked: boolean; amountOwing?: number; outstandingBalanceGhs?: number },
): Promise<{ message?: string; final: ApiGalleryPhoto }> {
  return authedJson<{ message?: string; final: ApiGalleryPhoto }>(
    `${galleryPath(galleryId)}/finals/${encodeURIComponent(finalId)}/lock`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
    "Failed to update final lock",
    FoldersApiError,
  );
}

export async function patchGallerySelectionReply(
  galleryId: string,
  photoId: string,
  reply: string,
): Promise<void> {
  await authedJson(
    `${galleryPath(galleryId)}/selections/${encodeURIComponent(photoId)}/reply`,
    {
      method: "PATCH",
      body: JSON.stringify({ reply }),
    },
    "Failed to save reply",
    FoldersApiError,
  );
}

export async function patchGalleryFinalReply(
  galleryId: string,
  finalId: string,
  reply: string,
): Promise<void> {
  await authedJson(
    `${galleryPath(galleryId)}/finals/${encodeURIComponent(finalId)}/reply`,
    {
      method: "PATCH",
      body: JSON.stringify({ reply }),
    },
    "Failed to save reply",
    FoldersApiError,
  );
}

export async function reorderGalleryUploads(
  galleryId: string,
  photoIds: string[],
): Promise<void> {
  await authedJson(
    `${galleryPath(galleryId)}/uploads/reorder`,
    {
      method: "PATCH",
      body: JSON.stringify({ photoIds }),
    },
    "Failed to reorder uploads",
    FoldersApiError,
  );
}

export async function reorderGalleryFinals(
  galleryId: string,
  finalIds: string[],
): Promise<void> {
  await authedJson(
    `${galleryPath(galleryId)}/finals/reorder`,
    {
      method: "PATCH",
      body: JSON.stringify({ finalIds }),
    },
    "Failed to reorder finals",
    FoldersApiError,
  );
}

function extractDeleteMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object") {
    const o = body as Record<string, unknown>;
    for (const k of ["message", "error"] as const) {
      const v = o[k];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
  }
  return fallback;
}

function normalizeBulkDeleteResult(
  body: unknown,
  fallbackCount: number,
): { message: string; deletedCount: number; restoreBefore: string } {
  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const deletedCountRaw = o.deletedCount ?? o.deleted_count ?? o.count;
  const deletedCount =
    typeof deletedCountRaw === "number" && Number.isFinite(deletedCountRaw)
      ? Math.max(0, Math.floor(deletedCountRaw))
      : fallbackCount;
  return {
    message: extractDeleteMessage(body, "Items moved to trash."),
    deletedCount,
    restoreBefore: parseRestoreBefore(body),
  };
}
