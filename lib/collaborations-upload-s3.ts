import {
  CollaborationsApiError,
  type CollaborationAsset,
} from "@/lib/collaborations-api";
import {
  GalleryUploadPartialError,
  MAX_PRESIGN_BATCH_FILES,
  putToS3,
  type PresignedUpload,
  type UploadFileMeta,
} from "@/lib/gallery-upload-s3";
import { authedJson } from "@/lib/http";

export type S3CollaborationUploadResult = {
  message?: string;
  assets: CollaborationAsset[];
};

export type S3CollaborationUploadPhase = "presigning" | "uploading" | "finalizing";

export type S3CollaborationUploadProgress = {
  filesUploaded: number;
  filesTotal: number;
  phase?: S3CollaborationUploadPhase;
};

const MAX_S3_CONCURRENCY = 8;
const MAX_S3_PUT_ATTEMPTS = 3;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetriableS3UploadError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (msg.includes("cors") || msg.includes("403")) return false;
  return (
    msg.includes("network") ||
    msg.includes("econnreset") ||
    msg.includes("aborted") ||
    msg.includes("failed (0)") ||
    msg.includes("could not reach") ||
    msg.includes("proxy network") ||
    msg.includes("(502)") ||
    msg.includes("(503)") ||
    msg.includes("(504)") ||
    msg.includes("(429)") ||
    msg.includes("(500)") ||
    /\(50\d\)/.test(msg)
  );
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

function uploadsPath(workspaceId: string) {
  return `/api/collaborations/${encodeURIComponent(workspaceId)}/uploads/photos`;
}

async function putToS3WithRetry(
  file: File,
  presigned: PresignedUpload,
  onProgress?: (pct: number) => void,
): Promise<void> {
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= MAX_S3_PUT_ATTEMPTS; attempt++) {
    try {
      await putToS3(file, presigned, onProgress);
      return;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_S3_PUT_ATTEMPTS && isRetriableS3UploadError(lastError)) {
        onProgress?.(0);
        await delay(250 * attempt);
        continue;
      }
      throw lastError;
    }
  }
  throw lastError ?? new Error("S3 upload failed.");
}

async function presignCollaborationUploads(
  workspaceId: string,
  files: File[],
): Promise<PresignedUpload[]> {
  const res = await authedJson<{ uploads: PresignedUpload[] }>(
    `${uploadsPath(workspaceId)}/presign`,
    {
      method: "POST",
      body: JSON.stringify({ files: files.map(fileMeta) }),
    },
    "Failed to prepare photo upload",
    CollaborationsApiError,
  );
  return res.uploads ?? [];
}

async function completeCollaborationUploads(
  workspaceId: string,
  uploads: PresignedUpload[],
  folderId?: string | null,
): Promise<S3CollaborationUploadResult> {
  const body: Record<string, unknown> = {
    files: uploads.map(completeFilePayload),
  };
  if (folderId) body.folderId = folderId;

  const res = await authedJson<{ message?: string; assets?: CollaborationAsset[] }>(
    `${uploadsPath(workspaceId)}/complete`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    "Failed to finalize photo upload",
    CollaborationsApiError,
  );
  return {
    message: res.message,
    assets: Array.isArray(res.assets) ? res.assets : [],
  };
}

/** Presign → S3 PUT → complete for collaboration workspace photos. */
export async function s3UploadCollaborationPhotos(
  workspaceId: string,
  files: File[],
  options?: {
    folderId?: string | null;
    onProgress?: (progress: S3CollaborationUploadProgress) => void;
  },
): Promise<S3CollaborationUploadResult> {
  const batches = chunkFiles(files, MAX_PRESIGN_BATCH_FILES);
  const merged: S3CollaborationUploadResult = { assets: [] };
  let filesUploaded = 0;

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex]!;
    options?.onProgress?.({
      filesUploaded,
      filesTotal: files.length,
      phase: "presigning",
    });

    const uploads = await presignCollaborationUploads(workspaceId, batch);
    if (uploads.length !== batch.length) {
      throw new CollaborationsApiError(
        "Upload preparation returned an unexpected file count.",
        500,
        null,
      );
    }

    let nextIndex = 0;
    const failedIndexes: number[] = [];
    let firstErrorMessage: string | null = null;

    async function worker() {
      while (true) {
        const index = nextIndex++;
        if (index >= batch.length) return;
        try {
          options?.onProgress?.({
            filesUploaded,
            filesTotal: files.length,
            phase: "uploading",
          });
          await putToS3WithRetry(batch[index]!, uploads[index]!);
          options?.onProgress?.({
            filesUploaded,
            filesTotal: files.length,
            phase: "finalizing",
          });
          const res = await completeCollaborationUploads(
            workspaceId,
            [uploads[index]!],
            options?.folderId,
          );
          merged.assets.push(...res.assets);
          if (res.message) merged.message = res.message;
          filesUploaded += 1;
          options?.onProgress?.({
            filesUploaded,
            filesTotal: files.length,
            phase: "uploading",
          });
        } catch (err) {
          failedIndexes.push(index);
          if (!firstErrorMessage) {
            firstErrorMessage = err instanceof Error ? err.message : String(err);
          }
        }
      }
    }

    const workers = Math.min(MAX_S3_CONCURRENCY, batch.length);
    await Promise.all(Array.from({ length: workers }, () => worker()));

    if (failedIndexes.length > 0) {
      const batchOffset = batches.slice(0, batchIndex).reduce((n, b) => n + b.length, 0);
      const remaining = files.slice(batchOffset + batch.length);
      const failedInBatch = failedIndexes
        .sort((a, b) => a - b)
        .map((i) => batch[i]!)
        .filter(Boolean);
      throw new GalleryUploadPartialError({
        succeeded: filesUploaded,
        total: files.length,
        failedFiles: [...failedInBatch, ...remaining],
        causeMessage: firstErrorMessage,
      });
    }
  }

  return merged;
}
