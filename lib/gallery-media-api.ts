import { sameOriginUploadsUrl } from "@/lib/api";
import { authedFormUpload, authedJson } from "@/lib/http";
import type { ApiFolderMedia } from "@/lib/folders/types";
import { FoldersApiError } from "@/lib/folders/types";
import type { DuplicateUploadAction } from "@/lib/upload-preferences";

export type ApiGalleryPhoto = {
  id: string;
  galleryId?: string;
  originalFilename: string;
  url: string;
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
  createdAt?: string;
  updatedAt?: string;
  setId?: string | null;
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
  selection: ApiFolderMedia[];
  finals: ApiFolderMedia[];
  flaggedFinals: ApiFolderMedia[];
};

function galleryPath(id: string) {
  return `/api/galleries/${encodeURIComponent(id)}`;
}

function duplicateActionToOnConflict(action?: DuplicateUploadAction): "skip" | "replace" {
  return action === "replace" ? "replace" : "skip";
}

/** Stay under Next.js dev/proxy default body buffer (~10MB) when many large raws ship in one pick. */
const MAX_UPLOAD_BATCH_BYTES = 9 * 1024 * 1024;
const MAX_UPLOAD_BATCH_FILES = 25;

export type GalleryUploadBatchProgress = {
  fileIndex: number;
  fileCount: number;
};

function chunkFilesForGalleryUpload(files: File[]): File[][] {
  if (files.length === 0) return [];
  const batches: File[][] = [];
  let current: File[] = [];
  let bytes = 0;

  for (const file of files) {
    const wouldExceedBytes =
      current.length > 0 && bytes + file.size > MAX_UPLOAD_BATCH_BYTES;
    const wouldExceedCount = current.length >= MAX_UPLOAD_BATCH_FILES;
    if (wouldExceedBytes || wouldExceedCount) {
      batches.push(current);
      current = [];
      bytes = 0;
    }
    current.push(file);
    bytes += file.size;
  }
  if (current.length) batches.push(current);
  return batches;
}

function scaleBatchUploadProgress(
  batches: File[][],
  batchIndex: number,
  loaded: number,
  total: number,
  lengthComputable: boolean,
  onProgress?: (loaded: number, total: number, lengthComputable: boolean) => void,
) {
  if (!onProgress) return;
  const batchBytes = batches[batchIndex]!.reduce((sum, f) => sum + f.size, 0);
  const allBytes = batches.reduce(
    (sum, batch) => sum + batch.reduce((n, f) => n + f.size, 0),
    0,
  );
  const doneBytes = batches
    .slice(0, batchIndex)
    .reduce((sum, batch) => sum + batch.reduce((n, f) => n + f.size, 0), 0);
  if (allBytes <= 0) {
    onProgress(loaded, total, lengthComputable);
    return;
  }
  const batchLoaded =
    lengthComputable && total > 0 ? (loaded / total) * batchBytes : loaded;
  onProgress(doneBytes + batchLoaded, allBytes, true);
}

function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url?.trim()) return undefined;
  return sameOriginUploadsUrl(url.trim());
}

export function galleryPhotoToApiFolderMedia(photo: ApiGalleryPhoto): ApiFolderMedia {
  const url = resolveMediaUrl(photo.url);
  const mimeType = photo.mimeType || photo.contentType || "";
  const isVideo =
    photo.isVideo === true ||
    mimeType.toLowerCase().startsWith("video/") ||
    /\.(mp4|mov|webm|m4v|avi|mkv|ogv)$/i.test(photo.originalFilename) ||
    /\.(mp4|mov|webm|m4v|avi|mkv|ogv)(?:[?#].*)?$/i.test(url ?? "");
  return {
    _id: photo.id,
    id: photo.id,
    originalFilename: photo.originalFilename,
    originalName: photo.originalFilename,
    filename: photo.originalFilename,
    name: photo.originalFilename,
    url,
    thumbUrl: isVideo ? undefined : url,
    previewUrl: url,
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
    setId: photo.setId ?? null,
  };
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

export async function listGalleryUploads(galleryId: string): Promise<ApiFolderMedia[]> {
  const res = await authedJson<{ photos?: ApiGalleryPhoto[] }>(
    `${galleryPath(galleryId)}/uploads`,
    { method: "GET" },
    "Failed to load uploads",
    FoldersApiError,
  );
  return normalizePhotoList(res, ["photos"]).map(galleryPhotoToApiFolderMedia);
}

export async function listGallerySelections(galleryId: string): Promise<ApiFolderMedia[]> {
  const res = await authedJson<unknown>(
    `${galleryPath(galleryId)}/selections`,
    { method: "GET" },
    "Failed to load selections",
    FoldersApiError,
  );
  return normalizeSelectionList(res).map(galleryPhotoToApiFolderMedia);
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
  const [uploads, selection, finals, flaggedFinals] = await Promise.all([
    listGalleryUploads(galleryId),
    listGallerySelections(galleryId),
    listGalleryFinals(galleryId),
    listGalleryFlaggedFinals(galleryId),
  ]);
  return { uploads, selection, finals, flaggedFinals };
}

export async function uploadGalleryPhotos(
  galleryId: string,
  files: File[],
  options?: {
    onConflict?: DuplicateUploadAction;
    setId?: string | null;
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

  const batches = chunkFilesForGalleryUpload(files);
  const merged: GalleryUploadPhotosResult = {
    created: [],
    replaced: [],
    skipped: [],
  };
  let ignoredDuplicatesCount = 0;
  let filesCompleted = 0;

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex]!;
    const form = new FormData();
    for (const file of batch) {
      form.append("photos", file);
    }
    form.append("onConflict", duplicateActionToOnConflict(options?.onConflict));
    if (options?.setId !== undefined) {
      form.append("setId", options.setId === null ? "unsorted" : options.setId);
    }

    const res = await authedFormUpload<GalleryUploadPhotosResult>(
      `${galleryPath(galleryId)}/uploads`,
      form,
      {
        fallbackError: "Failed to upload photos",
        ErrorCtor: FoldersApiError,
        onUploadProgress: (loaded, total, lengthComputable) => {
          scaleBatchUploadProgress(
            batches,
            batchIndex,
            loaded,
            total,
            lengthComputable,
            (l, t, c) => {
              options?.onProgress?.(l, t, c, {
                fileIndex: Math.min(files.length, filesCompleted + 1),
                fileCount: files.length,
              });
            },
          );
        },
      },
    );

    if (Array.isArray(res.created)) merged.created!.push(...res.created);
    if (Array.isArray(res.replaced)) merged.replaced!.push(...res.replaced);
    if (Array.isArray(res.skipped)) merged.skipped!.push(...res.skipped);
    ignoredDuplicatesCount += Array.isArray(res.skipped) ? res.skipped.length : 0;
    filesCompleted += batch.length;
    options?.onProgress?.(filesCompleted, files.length, true, {
      fileIndex: filesCompleted,
      fileCount: files.length,
    });
  }

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

  const batches = chunkFilesForGalleryUpload(files);
  const created: ApiGalleryPhoto[] = [];
  let ignoredDuplicatesCount = 0;
  let filesCompleted = 0;
  let lastMessage: string | undefined;

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex]!;
    const form = new FormData();
    for (const file of batch) {
      form.append("finals", file);
    }
    form.append("clientPaid", options?.clientPaid === false ? "false" : "true");
    if (options?.clientPaid === false) {
      if (options.outstandingBalanceGhs != null && String(options.outstandingBalanceGhs).trim()) {
        form.append("outstandingBalanceGhs", String(options.outstandingBalanceGhs).trim());
      }
      if (options.lockPreviews === true) {
        form.append("lockPreviews", "true");
      }
    }
    if (options?.setId !== undefined) {
      form.append("setId", options.setId === null ? "unsorted" : options.setId);
    }

    const res = await authedFormUpload<{
      message?: string;
      created?: ApiGalleryPhoto[];
      skipped?: string[];
    }>(`${galleryPath(galleryId)}/finals`, form, {
      fallbackError: "Failed to upload finals",
      ErrorCtor: FoldersApiError,
      onUploadProgress: (loaded, total, lengthComputable) => {
        scaleBatchUploadProgress(
          batches,
          batchIndex,
          loaded,
          total,
          lengthComputable,
          (l, t, c) => {
            options?.onProgress?.(l, t, c, {
              fileIndex: Math.min(files.length, filesCompleted + 1),
              fileCount: files.length,
            });
          },
        );
      },
    });

    if (typeof res.message === "string") lastMessage = res.message;
    if (Array.isArray(res.created)) created.push(...res.created);
    ignoredDuplicatesCount += Array.isArray(res.skipped) ? res.skipped.length : 0;
    filesCompleted += batch.length;
    options?.onProgress?.(filesCompleted, files.length, true, {
      fileIndex: filesCompleted,
      fileCount: files.length,
    });
  }

  return { message: lastMessage, created, ignoredDuplicatesCount };
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
