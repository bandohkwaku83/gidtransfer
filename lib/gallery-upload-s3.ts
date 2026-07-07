import { FoldersApiError } from "@/lib/folders/types";
import { authedJson } from "@/lib/http";

export type S3GalleryPhoto = {
  id: string;
  originalFilename: string;
  url: string;
  thumbUrl?: string;
  displayUrl?: string;
  mimeType?: string;
  sizeBytes?: number;
  /** False while thumbnails / watermarked previews are still processing. */
  derivativesReady?: boolean;
};

export type S3GalleryUploadPhotosResult = {
  message?: string;
  created?: S3GalleryPhoto[];
  replaced?: S3GalleryPhoto[];
  skipped?: string[];
  conflicts?: { filename: string; existingId: string }[];
};

export type UploadFileMeta = {
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
};

export type PresignedUpload = UploadFileMeta & {
  uploadId: string;
  storedFilename: string;
  presignedUrl: string;
  method: "PUT";
  headers: Record<string, string>;
  publicUrl: string;
  expiresIn: number;
};

/** Backend presign limit — chunk larger picks before calling presign. */
export const MAX_PRESIGN_BATCH_FILES = 700;

/** Smaller pipeline chunks keep progress smooth and photos appearing incrementally. */
export const UPLOAD_PIPELINE_CHUNK_SIZE = 50;

/** Parallel S3 PUTs — avoids overwhelming the browser tab on huge batches. */
const MAX_S3_CONCURRENCY = 8;

function galleryPath(id: string) {
  return `/api/galleries/${encodeURIComponent(id)}`;
}

function fileMeta(file: File): UploadFileMeta {
  return {
    originalFilename: file.name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size,
  };
}

function completeFilePayload(upload: PresignedUpload) {
  return {
    storedFilename: upload.storedFilename,
    originalFilename: upload.originalFilename,
    mimeType: upload.mimeType,
    sizeBytes: upload.sizeBytes,
  };
}

function chunkFiles(files: File[], maxFiles: number): File[][] {
  if (files.length === 0) return [];
  const batches: File[][] = [];
  for (let i = 0; i < files.length; i += maxFiles) {
    batches.push(files.slice(i, i + maxFiles));
  }
  return batches;
}

/** Dev-only same-origin relay when bucket CORS blocks browser PUT. */
function useS3UploadProxy(): boolean {
  if (typeof window === "undefined") return false;
  if (process.env.NEXT_PUBLIC_S3_DIRECT_UPLOAD === "true") return false;
  return process.env.NODE_ENV === "development";
}

const FORBIDDEN_S3_REQUEST_HEADERS = new Set([
  "accept-charset",
  "accept-encoding",
  "connection",
  "content-length",
  "cookie",
  "cookie2",
  "date",
  "dnt",
  "expect",
  "host",
  "keep-alive",
  "origin",
  "referer",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "via",
]);

function normalizePresignedHeaders(
  headers: Record<string, string> | undefined | null,
  sizeBytes?: number,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (headers && typeof headers === "object") {
    for (const [key, value] of Object.entries(headers)) {
      if (value == null || !String(value).trim()) continue;
      const lower = key.toLowerCase();
      if (FORBIDDEN_S3_REQUEST_HEADERS.has(lower)) continue;
      out[key] = String(value);
    }
  }
  if (sizeBytes != null && sizeBytes > 0 && !out["Content-Length"]) {
    out["Content-Length"] = String(sizeBytes);
  }
  return out;
}

function s3UploadHost(presignedUrl: string): string {
  try {
    return new URL(presignedUrl).hostname;
  } catch {
    return "S3";
  }
}

function s3UploadBody(file: File, contentType?: string): Blob | File {
  const type = contentType?.trim() || file.type || "application/octet-stream";
  if (!file.type || file.type === type) return file;
  return new Blob([file], { type });
}

function formatS3UploadFailure(
  presignedUrl: string,
  status: number,
  responseText: string,
): string {
  const host = s3UploadHost(presignedUrl);
  if (status === 0) {
    return (
      `S3 upload blocked (likely bucket CORS). Add PUT from ${window.location.origin} ` +
      `to ${host} CORS AllowedOrigins, or keep using the dev upload proxy.`
    );
  }
  if (status === 403) {
    return (
      `S3 rejected upload (403). Check Content-Type matches presign headers for ${host}.` +
      (responseText ? ` ${responseText.slice(0, 160)}` : "")
    );
  }
  return `S3 upload failed (${status})${responseText ? `: ${responseText.slice(0, 160)}` : ""}`;
}

function putToS3Direct(
  file: File,
  presigned: PresignedUpload,
  headers: Record<string, string>,
  onProgress?: (pct: number) => void,
): Promise<void> {
  const contentType = headers["Content-Type"] ?? headers["content-type"];
  const body = s3UploadBody(file, contentType);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(presigned.method, presigned.presignedUrl);
    for (const [key, value] of Object.entries(headers)) {
      try {
        xhr.setRequestHeader(key, value);
      } catch {
        /* skip headers the browser refuses to set */
      }
    }
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && onProgress) {
        onProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(
        new Error(
          formatS3UploadFailure(presigned.presignedUrl, xhr.status, xhr.responseText ?? ""),
        ),
      );
    };
    xhr.onerror = () => {
      reject(
        new Error(
          formatS3UploadFailure(presigned.presignedUrl, 0, ""),
        ),
      );
    };
    xhr.send(body);
  });
}

function putToS3ViaDevProxy(
  file: File,
  presigned: PresignedUpload,
  headers: Record<string, string>,
  onProgress?: (pct: number) => void,
): Promise<void> {
  const contentType = headers["Content-Type"] ?? headers["content-type"];
  const body = s3UploadBody(file, contentType);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/s3-put");
    xhr.setRequestHeader("x-presigned-url", presigned.presignedUrl);
    xhr.setRequestHeader("x-s3-headers", JSON.stringify(headers));
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && onProgress) {
        onProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      let message = `Dev S3 upload proxy failed (${xhr.status}).`;
      try {
        const parsed = JSON.parse(xhr.responseText) as { message?: string; detail?: string };
        if (parsed.message) message = parsed.message;
        if (parsed.detail) message += ` ${parsed.detail.slice(0, 160)}`;
      } catch {
        /* ignore */
      }
      reject(new Error(message));
    };
    xhr.onerror = () => reject(new Error("Dev S3 upload proxy network error."));
    xhr.send(body);
  });
}

/** Upload one file straight to S3 (supports progress). Uses dev proxy when bucket CORS is missing. */
export function putToS3(
  file: File,
  presigned: PresignedUpload,
  onProgress?: (pct: number) => void,
): Promise<void> {
  const headers = normalizePresignedHeaders(presigned.headers, presigned.sizeBytes);
  if (useS3UploadProxy()) {
    return putToS3ViaDevProxy(file, presigned, headers, onProgress);
  }
  return putToS3Direct(file, presigned, headers, onProgress);
}

async function uploadFilesToS3(
  files: File[],
  uploads: PresignedUpload[],
  onFileProgress?: (fileIndex: number, pct: number) => void,
): Promise<void> {
  let nextIndex = 0;
  let firstError: Error | undefined;

  async function worker() {
    while (true) {
      const index = nextIndex++;
      if (index >= files.length) return;
      try {
        await putToS3(files[index]!, uploads[index]!, (pct) =>
          onFileProgress?.(index, pct),
        );
        onFileProgress?.(index, 100);
      } catch (err) {
        if (!firstError) {
          firstError = err instanceof Error ? err : new Error(String(err));
        }
      }
    }
  }

  const workers = Math.min(MAX_S3_CONCURRENCY, files.length);
  await Promise.all(Array.from({ length: workers }, () => worker()));
  if (firstError) throw firstError;
}

async function presignGalleryUploads(
  galleryId: string,
  files: File[],
): Promise<PresignedUpload[]> {
  const res = await authedJson<{ uploads: PresignedUpload[] }>(
    `${galleryPath(galleryId)}/uploads/presign`,
    {
      method: "POST",
      body: JSON.stringify({ files: files.map(fileMeta) }),
    },
    "Failed to prepare photo upload",
    FoldersApiError,
  );
  return res.uploads ?? [];
}

async function completeGalleryUploads(
  galleryId: string,
  uploads: PresignedUpload[],
  options?: {
    onConflict?: "skip" | "replace";
    setId?: string | null;
    applyPreviewWatermark?: boolean;
  },
): Promise<S3GalleryUploadPhotosResult> {
  const body: Record<string, unknown> = {
    files: uploads.map(completeFilePayload),
    onConflict: options?.onConflict ?? "skip",
  };
  if (options?.setId !== undefined) {
    body.setId = options.setId === null ? "unsorted" : options.setId;
  }
  if (options?.applyPreviewWatermark !== undefined) {
    body.applyPreviewWatermark = options.applyPreviewWatermark;
  }

  return authedJson<S3GalleryUploadPhotosResult>(
    `${galleryPath(galleryId)}/uploads/complete`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    "Failed to finalize photo upload",
    FoldersApiError,
  );
}

async function presignGalleryFinals(
  galleryId: string,
  files: File[],
): Promise<PresignedUpload[]> {
  const res = await authedJson<{ uploads: PresignedUpload[] }>(
    `${galleryPath(galleryId)}/finals/presign`,
    {
      method: "POST",
      body: JSON.stringify({ files: files.map(fileMeta) }),
    },
    "Failed to prepare final upload",
    FoldersApiError,
  );
  return res.uploads ?? [];
}

async function completeGalleryFinals(
  galleryId: string,
  uploads: PresignedUpload[],
  options?: {
    clientPaid?: boolean;
    outstandingBalanceGhs?: string | number;
    lockPreviews?: boolean;
    setId?: string | null;
    applyWatermark?: boolean;
  },
): Promise<{ message?: string; created?: S3GalleryPhoto[]; skipped?: string[] }> {
  const body: Record<string, unknown> = {
    files: uploads.map(completeFilePayload),
    clientPaid: options?.clientPaid !== false,
  };
  if (options?.outstandingBalanceGhs != null && String(options.outstandingBalanceGhs).trim()) {
    body.outstandingBalanceGhs = String(options.outstandingBalanceGhs).trim();
  }
  if (options?.lockPreviews === true) {
    body.isLocked = true;
  }
  if (options?.setId !== undefined) {
    body.setId = options.setId === null ? "unsorted" : options.setId;
  }
  if (options?.applyWatermark !== undefined) {
    body.applyWatermark = options.applyWatermark;
  }

  return authedJson<{ message?: string; created?: S3GalleryPhoto[]; skipped?: string[] }>(
    `${galleryPath(galleryId)}/finals/complete`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    "Failed to finalize final upload",
    FoldersApiError,
  );
}

export type S3GalleryUploadPhase = "presigning" | "uploading" | "finalizing";

export type S3GalleryUploadProgress = {
  /** @deprecated Use filesUploaded — kept for callers that still read fileIndex. */
  fileIndex: number;
  /** @deprecated Use filesTotal — kept for callers that still read fileCount. */
  fileCount: number;
  filesUploaded: number;
  filesTotal: number;
  batchIndex: number;
  batchCount: number;
  phase?: S3GalleryUploadPhase;
};

function uploadBatchFilesUploaded(
  batches: File[][],
  batchIndex: number,
  fileProgress: number[],
): number {
  const filesBeforeBatch = batches.slice(0, batchIndex).reduce((n, b) => n + b.length, 0);
  const completedInBatch = fileProgress.filter((pct) => pct >= 100).length;
  return filesBeforeBatch + completedInBatch;
}

function uploadProgressMeta(
  allFiles: File[],
  batches: File[][],
  batchIndex: number,
  fileProgress: number[],
  phase: S3GalleryUploadPhase,
): S3GalleryUploadProgress {
  const filesUploaded = uploadBatchFilesUploaded(batches, batchIndex, fileProgress);
  const filesTotal = allFiles.length;
  const activeSlot = Math.min(
    filesTotal,
    filesUploaded + (filesUploaded < filesTotal ? 1 : 0),
  );
  return {
    fileIndex: activeSlot,
    fileCount: filesTotal,
    filesUploaded,
    filesTotal,
    batchIndex: batchIndex + 1,
    batchCount: batches.length,
    phase,
  };
}

function scaleS3UploadProgress(
  allFiles: File[],
  batches: File[][],
  batchIndex: number,
  fileProgress: number[],
  onProgress?: (
    loaded: number,
    total: number,
    lengthComputable: boolean,
    batch?: S3GalleryUploadProgress,
  ) => void,
  phase: S3GalleryUploadPhase = "uploading",
) {
  if (!onProgress) return;

  const allBytes = allFiles.reduce((sum, f) => sum + f.size, 0);
  const batchStart = batches
    .slice(0, batchIndex)
    .reduce((sum, batch) => sum + batch.reduce((n, f) => n + f.size, 0), 0);
  const batchLoaded = fileProgress.reduce((sum, pct, i) => {
    const file = batches[batchIndex]![i];
    return sum + (file ? (file.size * pct) / 100 : 0);
  }, 0);

  onProgress(batchStart + batchLoaded, allBytes, true, uploadProgressMeta(
    allFiles,
    batches,
    batchIndex,
    fileProgress,
    phase,
  ));
}

function emitPresigningProgress(
  allFiles: File[],
  batches: File[][],
  batchIndex: number,
  onProgress?: (
    loaded: number,
    total: number,
    lengthComputable: boolean,
    batch?: S3GalleryUploadProgress,
  ) => void,
) {
  if (!onProgress) return;
  const allBytes = allFiles.reduce((sum, f) => sum + f.size, 0);
  const bytesBeforeBatch = batches
    .slice(0, batchIndex)
    .reduce((sum, batch) => sum + batch.reduce((n, f) => n + f.size, 0), 0);
  onProgress(bytesBeforeBatch, allBytes, allBytes > 0, uploadProgressMeta(
    allFiles,
    batches,
    batchIndex,
    [],
    "presigning",
  ));
}

/** Presign → S3 PUT → complete for gallery raw uploads. */
export async function s3UploadGalleryPhotos(
  galleryId: string,
  files: File[],
  options?: {
    onConflict?: "skip" | "replace";
    setId?: string | null;
    applyPreviewWatermark?: boolean;
    onProgress?: (
      loaded: number,
      total: number,
      lengthComputable: boolean,
      batch?: S3GalleryUploadProgress,
    ) => void;
    onBatchComplete?: (result: S3GalleryUploadPhotosResult) => void;
  },
): Promise<S3GalleryUploadPhotosResult> {
  const chunkSize = Math.min(UPLOAD_PIPELINE_CHUNK_SIZE, MAX_PRESIGN_BATCH_FILES);
  const batches = chunkFiles(files, chunkSize);
  const merged: S3GalleryUploadPhotosResult = {
    created: [],
    replaced: [],
    skipped: [],
  };

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex]!;
    const fileProgress = new Array(batch.length).fill(0);

    emitPresigningProgress(files, batches, batchIndex, options?.onProgress);

    const uploads = await presignGalleryUploads(galleryId, batch);
    if (uploads.length !== batch.length) {
      throw new FoldersApiError("Upload preparation returned an unexpected file count.", 500, null);
    }

    await uploadFilesToS3(batch, uploads, (fileIndex, pct) => {
      fileProgress[fileIndex] = pct;
      scaleS3UploadProgress(files, batches, batchIndex, fileProgress, options?.onProgress);
    });

    scaleS3UploadProgress(
      files,
      batches,
      batchIndex,
      fileProgress.map(() => 100),
      options?.onProgress,
      "finalizing",
    );

    const res = await completeGalleryUploads(galleryId, uploads, {
      onConflict: options?.onConflict,
      setId: options?.setId,
      applyPreviewWatermark: options?.applyPreviewWatermark,
    });

    if (Array.isArray(res.created)) merged.created!.push(...res.created);
    if (Array.isArray(res.replaced)) merged.replaced!.push(...res.replaced);
    if (Array.isArray(res.skipped)) merged.skipped!.push(...res.skipped);
    if (Array.isArray(res.conflicts) && res.conflicts.length) {
      merged.conflicts = [...(merged.conflicts ?? []), ...res.conflicts];
    }

    options?.onBatchComplete?.(res);
  }

  return merged;
}

/** Presign → S3 PUT → complete for gallery finals. */
export async function s3UploadGalleryFinals(
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
      batch?: S3GalleryUploadProgress,
    ) => void;
    onBatchComplete?: (result: {
      message?: string;
      created?: S3GalleryPhoto[];
      skipped?: string[];
    }) => void;
  },
): Promise<{ message?: string; created?: S3GalleryPhoto[]; skipped?: string[] }> {
  const chunkSize = Math.min(UPLOAD_PIPELINE_CHUNK_SIZE, MAX_PRESIGN_BATCH_FILES);
  const batches = chunkFiles(files, chunkSize);
  const created: S3GalleryPhoto[] = [];
  const skipped: string[] = [];
  let lastMessage: string | undefined;

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex]!;
    const fileProgress = new Array(batch.length).fill(0);

    emitPresigningProgress(files, batches, batchIndex, options?.onProgress);

    const uploads = await presignGalleryFinals(galleryId, batch);
    if (uploads.length !== batch.length) {
      throw new FoldersApiError("Upload preparation returned an unexpected file count.", 500, null);
    }

    await uploadFilesToS3(batch, uploads, (fileIndex, pct) => {
      fileProgress[fileIndex] = pct;
      scaleS3UploadProgress(files, batches, batchIndex, fileProgress, options?.onProgress);
    });

    scaleS3UploadProgress(
      files,
      batches,
      batchIndex,
      fileProgress.map(() => 100),
      options?.onProgress,
      "finalizing",
    );

    const res = await completeGalleryFinals(galleryId, uploads, {
      clientPaid: options?.clientPaid,
      outstandingBalanceGhs: options?.outstandingBalanceGhs,
      lockPreviews: options?.lockPreviews,
      setId: options?.setId,
      applyWatermark: options?.applyWatermark,
    });

    if (typeof res.message === "string") lastMessage = res.message;
    if (Array.isArray(res.created)) created.push(...res.created);
    if (Array.isArray(res.skipped)) skipped.push(...res.skipped);

    options?.onBatchComplete?.(res);
  }

  return { message: lastMessage, created, skipped };
}
