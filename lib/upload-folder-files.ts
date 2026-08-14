/** Common camera RAW and photo extensions (lowercase, with leading dot). */
export const RAW_CAMERA_FILE_EXTENSIONS = [
  ".3fr",
  ".ari",
  ".arw",
  ".bay",
  ".cr2",
  ".cr3",
  ".crw",
  ".dcr",
  ".dng",
  ".erf",
  ".fff",
  ".gpr",
  ".heic",
  ".heif",
  ".iiq",
  ".k25",
  ".kdc",
  ".mdc",
  ".mef",
  ".mos",
  ".mrw",
  ".nef",
  ".nrw",
  ".orf",
  ".pef",
  ".ptx",
  ".raf",
  ".raw",
  ".rwl",
  ".rw2",
  ".rwz",
  ".sr2",
  ".srf",
  ".srw",
  ".tif",
  ".tiff",
  ".x3f",
] as const;

const RAW_CAMERA_EXTENSION_SET = new Set<string>(RAW_CAMERA_FILE_EXTENSIONS);

const COMMON_MEDIA_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".bmp",
  ".avif",
  ".mp4",
  ".mov",
  ".m4v",
  ".webm",
  ".mkv",
  ".avi",
  ".mpg",
  ".mpeg",
  ".3gp",
]);

const BLOCKED_UPLOAD_BASENAMES = new Set([
  ".ds_store",
  "thumbs.db",
  "desktop.ini",
]);

const BLOCKED_UPLOAD_EXTENSIONS = new Set([
  ".exe",
  ".msi",
  ".dmg",
  ".pkg",
  ".zip",
  ".rar",
  ".7z",
  ".tar",
  ".gz",
  ".txt",
  ".html",
  ".htm",
  ".json",
  ".xml",
  ".js",
  ".ts",
  ".csv",
  ".xlsx",
  ".doc",
  ".docx",
  ".pdf",
]);

const VIDEO_EXTENSIONS = new Set([
  ".mp4",
  ".mov",
  ".m4v",
  ".webm",
  ".mkv",
  ".avi",
  ".mpg",
  ".mpeg",
  ".3gp",
]);

/** Accept attribute for photo uploads — images and camera RAW (no video). */
export const PHOTO_UPLOAD_ACCEPT = ["image/*", ...RAW_CAMERA_FILE_EXTENSIONS].join(",");

/** Accept attribute for video uploads only. */
export const VIDEO_UPLOAD_ACCEPT = "video/*";

/** @deprecated Prefer PHOTO_UPLOAD_ACCEPT / VIDEO_UPLOAD_ACCEPT — mixed uploads still work via legacy API. */
export const RAW_UPLOAD_ACCEPT = [PHOTO_UPLOAD_ACCEPT, VIDEO_UPLOAD_ACCEPT].join(",");

export type GalleryUploadMediaType = "photo" | "video";

export function fileExtension(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? name;
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return "";
  return base.slice(dot).toLowerCase();
}

export function isBlockedUploadBasename(name: string): boolean {
  const base = (name.split(/[/\\]/).pop() ?? name).toLowerCase();
  if (!base || base.startsWith("._")) return true;
  return BLOCKED_UPLOAD_BASENAMES.has(base);
}

function isAllowedMediaBasename(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed || isBlockedUploadBasename(trimmed)) return false;
  const ext = fileExtension(trimmed);
  return !ext || !BLOCKED_UPLOAD_EXTENSIONS.has(ext);
}

export function isVideoUploadableFile(file: File): boolean {
  if (!isAllowedMediaBasename(file.name)) return false;
  const mime = (file.type || "").toLowerCase();
  if (mime.startsWith("video/")) return true;
  if (mime.startsWith("image/")) return false;
  const ext = fileExtension(file.name);
  return Boolean(ext && VIDEO_EXTENSIONS.has(ext));
}

export function isPhotoUploadableFile(file: File): boolean {
  if (!isAllowedMediaBasename(file.name)) return false;
  if (isVideoUploadableFile(file)) return false;

  const ext = fileExtension(file.name);
  const mime = (file.type || "").toLowerCase();
  if (mime.startsWith("image/")) return true;
  if (ext && (RAW_CAMERA_EXTENSION_SET.has(ext) || COMMON_MEDIA_EXTENSIONS.has(ext))) {
    return !VIDEO_EXTENSIONS.has(ext);
  }

  // Many RAW files report empty or generic mime types — allow unknown extensions except blocklist/video.
  return Boolean(ext);
}

/** Mixed raw uploads (legacy). Prefer photo/video-specific helpers. */
export function isRawUploadableFile(file: File): boolean {
  return isPhotoUploadableFile(file) || isVideoUploadableFile(file);
}

export function isFinalUploadableFile(file: File): boolean {
  if (!isAllowedMediaBasename(file.name)) return false;

  const ext = fileExtension(file.name);
  const mime = (file.type || "").toLowerCase();
  return mime.startsWith("image/") || mime.startsWith("video/") || COMMON_MEDIA_EXTENSIONS.has(ext);
}

export function partitionUploadFiles(files: File[]): {
  photos: File[];
  videos: File[];
  rejected: File[];
} {
  const photos: File[] = [];
  const videos: File[] = [];
  const rejected: File[] = [];
  for (const file of files) {
    if (isVideoUploadableFile(file)) videos.push(file);
    else if (isPhotoUploadableFile(file)) photos.push(file);
    else rejected.push(file);
  }
  return { photos, videos, rejected };
}

function readDirectoryEntry(entry: FileSystemEntry, files: File[]): Promise<void> {
  if (entry.isFile) {
    return new Promise((resolve) => {
      (entry as FileSystemFileEntry).file(
        (file) => {
          files.push(file);
          resolve();
        },
        () => resolve(),
      );
    });
  }

  if (!entry.isDirectory) return Promise.resolve();

  const reader = (entry as FileSystemDirectoryEntry).createReader();
  return new Promise((resolve) => {
    const readBatch = () => {
      reader.readEntries(
        (entries) => {
          if (!entries.length) {
            resolve();
            return;
          }
          void Promise.all(entries.map((child) => readDirectoryEntry(child, files))).then(readBatch);
        },
        () => resolve(),
      );
    };
    readBatch();
  });
}

/** Flatten dropped files and recursively read any dropped folders. */
export async function collectFilesFromDataTransfer(dataTransfer: DataTransfer): Promise<File[]> {
  const items = dataTransfer.items;
  if (!items?.length) return Array.from(dataTransfer.files);

  const entries: FileSystemEntry[] = [];
  for (let i = 0; i < items.length; i++) {
    const entry = items[i]?.webkitGetAsEntry?.();
    if (entry) entries.push(entry);
  }

  if (!entries.length) return Array.from(dataTransfer.files);

  const files: File[] = [];
  await Promise.all(entries.map((entry) => readDirectoryEntry(entry, files)));
  return files.length > 0 ? files : Array.from(dataTransfer.files);
}
