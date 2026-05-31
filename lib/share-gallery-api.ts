import { API_BASE_URL, apiUrl, sameOriginUploadsUrl } from "@/lib/api";
import { getBackendApiUrl } from "@/lib/backend-proxy";
import { parseFolderCoverFocal } from "@/lib/folders/helpers";
import { applyBrandWatermarkToImageBlob } from "@/lib/apply-brand-watermark";
import { getBrandWatermarkSettings } from "@/lib/watermark-brand";
import { normalizeGalleryCoverColor } from "@/lib/gallery-cover-color";
import { normalizeGalleryCoverFrame, type GalleryCoverFrame } from "@/lib/gallery-cover-frame";
import { extractMessage, HttpError, parseJson } from "@/lib/http";

export type ShareGalleryAsset = {
  id: string;
  originalName: string;
  thumbUrl: string;
  /** Larger / display-quality URL for full-screen preview when distinct from {@link thumbUrl}. */
  previewUrl?: string;
  selection: "SELECTED" | "UNSELECTED";
  /** Raw upload is a video file (mp4, mov, etc.). */
  isVideo?: boolean;
  mimeType?: string;
  rejectedByClient?: boolean;
  rejectionComment?: string;
  clientComment?: string;
  photographerReply?: string;
};

export type ShareGalleryFinal = {
  id: string;
  name: string;
  /** Full-resolution URL when unlocked; may still be present when locked for admin-style APIs. */
  url: string;
  /** MIME type of the delivered file (e.g. image/jpeg, video/mp4). */
  mimeType?: string;
  /** Delivered final is a video file. */
  isVideo?: boolean;
  /** When true, client should use locked preview only and cannot download full files until unlocked. */
  locked?: boolean;
  /** Optional explicit preview URL for locked state (watermarked / reduced). */
  lockedPreviewUrl?: string;
  /** Client feedback left on this delivered edit. */
  clientComment?: string;
  /** Photographer response to client final feedback. */
  photographerReply?: string;
  /** True when the client explicitly flagged this final for revision. */
  flaggedByClient?: boolean;
  flaggedAt?: string | null;
};

export type ShareGalleryStudio = {
  companyName?: string;
  companySlug?: string;
  logoSrc?: string;
};

/** Row shape from `GET /api/public/token/:shareToken` → `photos[]`. */
export type PublicGalleryPhoto = {
  id: string;
  galleryId?: string;
  originalFilename: string;
  url: string;
  mimeType?: string;
  sizeBytes?: number;
  isVideo?: boolean;
  selectedByClient?: boolean;
  clientComment?: string;
  rejectedByClient?: boolean;
  rejectionComment?: string;
  selectedAt?: string | null;
  rejectedAt?: string | null;
};

/** Row shape from `GET /api/public/token/:shareToken` → `finals[]`. */
export type PublicGalleryFinal = {
  id: string;
  galleryId?: string;
  originalFilename: string;
  url: string;
  downloadUrl?: string | null;
  mimeType?: string;
  sizeBytes?: number;
  isVideo?: boolean;
  isLocked?: boolean;
  outstandingBalanceGhs?: number | null;
  clientPaid?: boolean;
  clientComment?: string;
  flaggedByClient?: boolean;
  flaggedAt?: string | null;
};

/** Full payload from `GET /api/public/token/:shareToken`. */
export type PublicGalleryResponse = {
  gallery: {
    id: string;
    name: string;
    eventDate?: string;
    description?: string;
    status?: string;
    maxSelections?: number | null;
    selectionLimit?: number | null;
    selectionSubmittedAt?: string | null;
    selectionSubmitted?: boolean;
    selectionLocked?: boolean;
    canEditSelections?: boolean;
    finalDelivery?: boolean;
    coverImageUrl?: string | null;
    displayCoverUrl?: string | null;
    useDefaultCover?: boolean;
    usingDefaultCover?: boolean;
    /** Frozen at share-link activation; public hero prefers these over live admin cover. */
    shareCoverImageUrl?: string | null;
    shareUseDefaultCover?: boolean;
    shareCoverFocalX?: number;
    shareCoverFocalY?: number;
    shareCoverFrame?: string | null;
    updatedAt?: string;
    coverUpdatedAt?: string;
    coverFocalX?: number;
    coverFocalY?: number;
    coverFrame?: string | null;
    coverColor?: string | null;
    shareCoverColor?: string | null;
    backgroundMusicUrl?: string | null;
    clientName?: string | null;
    sharePasswordEnabled?: boolean;
    share_password_enabled?: boolean;
    shareAccessPin?: string;
    share_access_pin?: string;
    accessPin?: string;
    access_pin?: string;
  };
  studio?: {
    companyName?: string;
    companySlug?: string;
    companyLogo?: string | null;
    logoSrc?: string | null;
    logoUrl?: string | null;
    logoDataUrl?: string | null;
  };
  photos: PublicGalleryPhoto[];
  selections?: PublicGalleryPhoto[];
  rejections?: PublicGalleryPhoto[];
  finals?: PublicGalleryFinal[];
  counts?: {
    uploads: number;
    selected: number;
    rejected?: number;
    finals: number;
    flaggedFinals?: number;
  };
};

export type NormalizedShareGallery = {
  folderId?: string;
  clientName: string;
  eventName?: string;
  eventDate?: string;
  description?: string;
  /** Photographer studio branding from the public payload. */
  studio?: ShareGalleryStudio;
  /** Resolved absolute URL for folder cover when API provides coverImage / coverImageUrl. */
  coverImageUrl?: string;
  /** Cover focal for `object-position` (0–100), from folder when API provides it. */
  coverFocalX?: number;
  coverFocalY?: number;
  /** Photographer-selected presentation style for the public cover hero. */
  coverFrame: GalleryCoverFrame;
  /** Backdrop color for cover styles that use a solid hero surface. */
  coverColor: string;
  /** At least one successful submit; backend refreshes `share.selectionSubmittedAt` each time. Does not block editing. */
  selectionSubmitted: boolean;
  /** Editable unless photographer-locked; mirrors GET `canEditSelections` (`!share.selectionLocked`). */
  canEditSelections: boolean;
  /** Photographer lock only; never set by client submit. */
  selectionLocked: boolean;
  /** Max heart-picks allowed; `null` = unlimited. */
  selectionLimit: number | null;
  /** When false, hide final delivery tab until photographer enables it. */
  finalDelivery?: boolean;
  /** Hint for client UI to apply screenshot/download discouragement. */
  rightsProtection?: boolean;
  /** When true, clients must enter {@link shareAccessPin} before viewing (UI / API). */
  sharePasswordEnabled?: boolean;
  /** Expected 4-digit access code for client gate (UI validation until server verify endpoint). */
  shareAccessPin?: string;
  /** Absolute URL for optional looping background music (empty when disabled or not set). */
  backgroundMusicUrl?: string;
  /** When false, clients should not play music. Defaults to true when omitted. */
  backgroundMusicEnabled?: boolean;
  assets: ShareGalleryAsset[];
  finals: ShareGalleryFinal[];
  counts?: { uploads: number; selected: number; rejected?: number; finals: number; flaggedFinals?: number };
};

type Raw = Record<string, unknown>;

export class ShareGalleryError extends HttpError {}

/** Resolve studio logo URLs (upload path, absolute URL, or data URL). */
function resolveStudioLogoUrl(url?: string | null): string {
  const raw = url?.trim();
  if (!raw) return "";
  if (raw.startsWith("data:")) return raw;
  return resolvePublicGalleryImageUrl(raw);
}

function readStudioLogoRaw(studioRaw: Raw | null): string {
  if (!studioRaw) return "";
  return (
    str(studioRaw.logoSrc) ||
    str(studioRaw.logo_src) ||
    str(studioRaw.companyLogo) ||
    str(studioRaw.company_logo) ||
    str(studioRaw.logoUrl) ||
    str(studioRaw.logo_url) ||
    str(studioRaw.logoDataUrl) ||
    str(studioRaw.logo_data_url) ||
    ""
  );
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function bool(v: unknown, defaultVal = false): boolean {
  return typeof v === "boolean" ? v : defaultVal;
}

/** Pick a URL string from a flat field or a nested `{ url | src | href | coverImageUrl }` object (API variance). */
function firstNonEmptyCoverRef(...parts: unknown[]): string {
  for (const p of parts) {
    if (p == null) continue;
    if (typeof p === "string") {
      const t = p.trim();
      if (t) return t;
      continue;
    }
    if (typeof p === "object" && !Array.isArray(p)) {
      const o = p as Raw;
      const inner =
        str(o.url) ||
        str(o.href) ||
        str(o.src) ||
        str(o.coverImageUrl) ||
        str(o.coverImage);
      if (inner) return inner;
    }
  }
  return "";
}

/** Embedded settings blobs that may carry `defaultCoverImageUrl` when the folder uses the studio default. */
function forEachSettingsBlob(
  root: Raw,
  folder: Raw | null,
  nested: Raw | null,
  visit: (o: Raw) => void,
): void {
  const candidates: unknown[] = [
    root.settings,
    root.photographerSettings,
    root.studioSettings,
    root.studio,
    folder?.settings,
    folder?.photographerSettings,
    nested?.settings,
    nested?.photographerSettings,
  ];
  for (const b of candidates) {
    if (b && typeof b === "object" && !Array.isArray(b)) visit(b as Raw);
  }
}

/** Share flag: explicit false / 0 / "false" / "no" → off; otherwise on (matches folder update accepted values). */
function shareTruthyOn(v: unknown): boolean {
  if (v === false || v === 0 || v === "0" || v === "false" || v === "no" || v === "NO") {
    return false;
  }
  return true;
}

/** Whether the gallery hero should use the studio default cover (matches dashboard `useDefaultCover`). */
function shareUsesDefaultCover(folder: Raw | null, root: Raw): boolean {
  const v =
    folder?.useDefaultCover ??
    folder?.usingDefaultCover ??
    root.useDefaultCover ??
    root.usingDefaultCover;
  if (v === undefined || v === null) return true;
  return shareTruthyOn(v);
}

/** Append a version query param so replaced cover files at the same path refresh in the browser / Next Image. */
export function withGalleryImageCacheBust(url: string, version?: string): string {
  const v = version?.trim();
  if (!url || !v) return url;
  if (/^(data:|blob:)/i.test(url)) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${encodeURIComponent(v)}`;
}

function coverCacheVersion(...sources: (Raw | null | undefined)[]): string {
  for (const s of sources) {
    if (!s || typeof s !== "object") continue;
    const t =
      str(s.updatedAt) ||
      str(s.coverUpdatedAt) ||
      str((s as Raw).cover_updated_at) ||
      str((s as Raw).shareLinkActivatedAt) ||
      str((s as Raw).share_link_activated_at) ||
      str(s.modifiedAt) ||
      str((s as Raw).modified_at);
    if (t) return t;
  }
  return "";
}

function hasShareCoverSnapshot(folder: Raw | null, root: Raw): boolean {
  if (
    firstNonEmptyCoverRef(
      folder?.shareCoverImageUrl,
      (folder as Raw)?.share_cover_image_url,
      root.shareCoverImageUrl,
      (root as Raw).share_cover_image_url,
    )
  ) {
    return true;
  }
  const flag =
    folder?.shareUseDefaultCover ??
    (folder as Raw)?.share_use_default_cover ??
    root.shareUseDefaultCover ??
    (root as Raw).share_use_default_cover;
  return flag !== undefined && flag !== null;
}

function shareSnapshotUsesDefaultCover(folder: Raw | null, root: Raw): boolean {
  const v =
    folder?.shareUseDefaultCover ??
    (folder as Raw)?.share_use_default_cover ??
    root.shareUseDefaultCover ??
    (root as Raw).share_use_default_cover;
  if (v === undefined || v === null) return false;
  return shareTruthyOn(v);
}

function shareSnapshotFocalSource(folder: Raw | null, root: Raw): Record<string, unknown> {
  return {
    coverFocalX:
      folder?.shareCoverFocalX ??
      (folder as Raw)?.share_cover_focal_x ??
      root.shareCoverFocalX ??
      (root as Raw).share_cover_focal_x,
    coverFocalY:
      folder?.shareCoverFocalY ??
      (folder as Raw)?.share_cover_focal_y ??
      root.shareCoverFocalY ??
      (root as Raw).share_cover_focal_y,
  };
}

function resolvePublicGalleryCoverFrame(folder: Raw | null, root: Raw): GalleryCoverFrame {
  const snapshotFrame =
    folder?.shareCoverFrame ??
    (folder as Raw | null)?.share_cover_frame ??
    root.shareCoverFrame ??
    (root as Raw).share_cover_frame;
  if (snapshotFrame != null) return normalizeGalleryCoverFrame(snapshotFrame);
  return normalizeGalleryCoverFrame(
    folder?.coverFrame ??
      (folder as Raw | null)?.cover_frame ??
      root.coverFrame ??
      (root as Raw).cover_frame,
  );
}

function resolvePublicGalleryCoverColor(folder: Raw | null, root: Raw): string {
  const snapshotColor =
    folder?.shareCoverColor ??
    (folder as Raw | null)?.share_cover_color ??
    root.shareCoverColor ??
    (root as Raw).share_cover_color;
  if (snapshotColor != null) return normalizeGalleryCoverColor(snapshotColor);
  return normalizeGalleryCoverColor(
    folder?.coverColor ??
      (folder as Raw | null)?.cover_color ??
      root.coverColor ??
      (root as Raw).cover_color,
  );
}

/** Resolve hero cover + focal for public client gallery (snapshot when present, else live admin cover). */
function resolvePublicGalleryCover(
  folder: Raw | null,
  root: Raw,
  nested: Raw | null,
): { coverImageUrl?: string; coverFocalX: number; coverFocalY: number } {
  if (hasShareCoverSnapshot(folder, root)) {
    let coverRaw = "";
    if (shareSnapshotUsesDefaultCover(folder, root)) {
      forEachSettingsBlob(root, folder, nested, (o) => {
        if (coverRaw) return;
        coverRaw = firstNonEmptyCoverRef(
          o.defaultCoverImageUrl,
          o.defaultCoverImage,
          o.default_cover_image_url,
          o.default_cover_image,
        );
      });
      if (!coverRaw && folder) {
        const o = folder as Raw;
        coverRaw = firstNonEmptyCoverRef(
          o.defaultCoverImageUrl,
          o.defaultCoverImage,
          o.default_cover_image_url,
          o.default_cover_image,
        );
      }
    } else {
      coverRaw = firstNonEmptyCoverRef(
        folder?.shareCoverImageUrl,
        (folder as Raw)?.share_cover_image_url,
        root.shareCoverImageUrl,
        (root as Raw).share_cover_image_url,
      );
    }

    const focal = parseFolderCoverFocal(shareSnapshotFocalSource(folder, root));
    const coverVersion = coverCacheVersion(folder, root, nested);
    const coverImageUrl = coverRaw
      ? withGalleryImageCacheBust(resolvePublicGalleryImageUrl(coverRaw), coverVersion)
      : undefined;
    return { coverImageUrl, coverFocalX: focal.x, coverFocalY: focal.y };
  }

  const usesDefaultCover = shareUsesDefaultCover(folder, root);

  const displayCoverRefs = [
    folder?.displayCoverUrl,
    (folder as Raw)?.display_cover_url,
    root.displayCoverUrl,
    (root as Raw).display_cover_url,
    (folder as Raw)?.effectiveCoverUrl,
    (folder as Raw)?.effective_cover_url,
    (folder as Raw)?.resolvedCoverUrl,
    (folder as Raw)?.resolved_cover_url,
    nested && typeof nested === "object" ? (nested as Raw).displayCoverUrl : null,
    nested && typeof nested === "object" ? (nested as Raw).display_cover_url : null,
  ];

  const customCoverRefs = [
    folder?.coverImageUrl,
    folder?.coverImage,
    (folder as Raw)?.cover_image_url,
    (folder as Raw)?.cover_image,
    (folder as Raw)?.cover,
    (folder as Raw)?.heroImageUrl,
    (folder as Raw)?.hero_image_url,
    nested && typeof nested === "object" ? (nested as Raw).coverImageUrl : null,
    nested && typeof nested === "object" ? (nested as Raw).coverImage : null,
    nested && typeof nested === "object" ? (nested as Raw).cover : null,
    root.coverImageUrl,
    root.coverImage,
    (root as Raw).cover_image_url,
    (root as Raw).cover_image,
    (root as Raw).cover,
  ];

  let coverRaw = firstNonEmptyCoverRef(...displayCoverRefs);

  if (!coverRaw && !usesDefaultCover) {
    coverRaw = firstNonEmptyCoverRef(...customCoverRefs);
  }

  if (!coverRaw && usesDefaultCover) {
    forEachSettingsBlob(root, folder, nested, (o) => {
      if (coverRaw) return;
      coverRaw = firstNonEmptyCoverRef(
        o.defaultCoverImageUrl,
        o.defaultCoverImage,
        o.default_cover_image_url,
        o.default_cover_image,
      );
    });
    if (!coverRaw && folder) {
      const o = folder as Raw;
      coverRaw = firstNonEmptyCoverRef(
        o.defaultCoverImageUrl,
        o.defaultCoverImage,
        o.default_cover_image_url,
        o.default_cover_image,
      );
    }
  }

  if (!coverRaw) {
    coverRaw = firstNonEmptyCoverRef(...customCoverRefs);
  }

  const focalPayload =
    folder && typeof folder === "object"
      ? ({ ...root, ...folder } as Record<string, unknown>)
      : (root as Record<string, unknown>);
  const focal = parseFolderCoverFocal(focalPayload);
  const coverVersion = coverCacheVersion(folder, root, nested);
  const coverImageUrl = coverRaw
    ? withGalleryImageCacheBust(resolvePublicGalleryImageUrl(coverRaw), coverVersion)
    : undefined;

  return { coverImageUrl, coverFocalX: focal.x, coverFocalY: focal.y };
}

/** Resolve image URLs the same way as folder covers (relative → same-origin or API base). */
export function resolvePublicGalleryImageUrl(url?: string | null): string {
  if (!url) return "";
  let normalized = sameOriginUploadsUrl(url.trim());
  if (/^https?:\/\//i.test(normalized)) {
    try {
      const parsed = new URL(normalized);
      if (parsed.pathname.startsWith("/uploads")) {
        normalized = `${parsed.pathname}${parsed.search}`;
      }
    } catch {
      /* keep original */
    }
  }
  if (/^https?:\/\//i.test(normalized)) return normalized;
  if (normalized.startsWith("/")) {
    if (API_BASE_URL) return `${API_BASE_URL}${normalized}`;
    return normalized;
  }
  if (API_BASE_URL) return `${API_BASE_URL}/${normalized}`;
  return `/${normalized}`;
}

function assetFromRow(item: unknown, idx: number): ShareGalleryAsset | null {
  if (!item || typeof item !== "object") return null;
  const o = item as Raw;
  const id = str(o._id) || str(o.id) || `asset-${idx}`;
  const originalName =
    str(o.originalName) ||
    str(o.originalFilename) ||
    str(o.original_filename) ||
    str(o.filename) ||
    str(o.name) ||
    str(o.fileName) ||
    `Photo ${idx + 1}`;
  const smallThumb =
    str(o.thumbUrl) ||
    str(o.thumbnailUrl) ||
    str(o.thumbnail) ||
    str(o.thumb) ||
    "";
  const largePreview =
    str(o.displayUrl) ||
    str(o.url) ||
    str(o.previewUrl) ||
    str(o.image) ||
    str(o.src) ||
    "";
  const thumbRaw = smallThumb || largePreview;
  const thumbUrl = resolvePublicGalleryImageUrl(thumbRaw);
  if (!thumbUrl) return null;

  const largeResolved = largePreview ? resolvePublicGalleryImageUrl(largePreview) : "";
  const mimeType =
    str(o.mimeType) ||
    str(o.mime_type) ||
    str(o.contentType) ||
    str(o.content_type) ||
    "";
  const isVideo =
    bool(o.isVideo) ||
    str(o.isVideo).toLowerCase() === "true" ||
    mimeType.toLowerCase().startsWith("video/") ||
    /\.(mp4|mov|webm|m4v|avi|mkv|ogv)$/i.test(originalName);

  const mediaUrl = largeResolved || thumbUrl;
  const previewUrl =
    isVideo
      ? mediaUrl
      : largeResolved && largeResolved !== thumbUrl
        ? largeResolved
        : undefined;

  const sel = str(o.selection).toUpperCase();
  const selected =
    bool(o.selected) ||
    bool(o.selectedByClient) ||
    sel === "SELECTED" ||
    str(o.clientSelection).toUpperCase() === "SELECTED";

  const rejectedByClient = bool(o.rejectedByClient) || bool(o.rejected_by_client);
  const rejectionComment =
    str(o.rejectionComment) ||
    str(o.rejection_comment) ||
    str(o.clientComment) ||
    "";
  const clientComment =
    str(o.clientComment) ||
    str(o.client_comment) ||
    "";
  const photographerReply =
    str(o.photographerReply) ||
    str(o.photographer_reply) ||
    "";

  return {
    id,
    originalName,
    thumbUrl: isVideo ? mediaUrl : thumbUrl,
    ...(previewUrl ? { previewUrl } : {}),
    selection: selected ? "SELECTED" : "UNSELECTED",
    ...(isVideo ? { isVideo: true } : {}),
    ...(mimeType ? { mimeType } : {}),
    ...(rejectedByClient ? { rejectedByClient: true } : {}),
    ...(rejectionComment ? { rejectionComment } : {}),
    ...(clientComment ? { clientComment } : {}),
    ...(photographerReply ? { photographerReply } : {}),
  };
}

function finalFromRow(item: unknown, idx: number): ShareGalleryFinal | null {
  if (!item || typeof item !== "object") return null;
  const o = item as Raw;
  const id = str(o._id) || str(o.id) || `final-${idx}`;
  const name =
    str(o.name) ||
    str(o.originalFilename) ||
    str(o.original_filename) ||
    str(o.filename) ||
    str(o.originalName) ||
    `Final ${idx + 1}`;
  const mimeType =
    str(o.mimeType) ||
    str(o.mime_type) ||
    str(o.contentType) ||
    str(o.content_type) ||
    "";
  const isVideo =
    bool(o.isVideo) ||
    str(o.isVideo).toLowerCase() === "true" ||
    mimeType.toLowerCase().startsWith("video/") ||
    /\.(mp4|mov|webm|m4v|avi|mkv|ogv)$/i.test(name);
  const lockedPreviewRaw =
    str(o.lockedPreviewUrl) ||
    str(o.locked_preview_url) ||
    str(o.previewUrlWhenLocked) ||
    str(o.lockedPreview);

  const truthy = (v: unknown) => v === true || v === "true";
  const lockStatus =
    str(o.lockStatus).toLowerCase() || str(o.lock_status).toLowerCase();
  const locked =
    bool(o.locked) ||
    truthy(o.isLocked) ||
    truthy(o.is_locked) ||
    truthy(o.paymentLocked) ||
    truthy(o.payment_locked) ||
    truthy(o.downloadLocked) ||
    truthy(o.download_locked) ||
    lockStatus === "locked";

  const downloadRaw = str(o.downloadUrl) || str(o.download_url) || "";
  const previewRaw = str(o.url) || str(o.fileUrl) || lockedPreviewRaw;
  const urlRaw = locked ? previewRaw : downloadRaw || previewRaw;

  const url = locked ? "" : resolvePublicGalleryImageUrl(urlRaw);
  const lockedPreviewUrl = locked
    ? resolvePublicGalleryImageUrl(lockedPreviewRaw || previewRaw)
    : lockedPreviewRaw
      ? resolvePublicGalleryImageUrl(lockedPreviewRaw)
      : "";

  if (!url && !lockedPreviewUrl) return null;

  const clientComment =
    str(o.clientComment) ||
    str(o.client_comment) ||
    str(o.rejectionComment) ||
    str(o.rejection_comment) ||
    "";
  const photographerReply =
    str(o.photographerReply) ||
    str(o.photographer_reply) ||
    "";
  const flaggedByClient =
    bool(o.flaggedByClient) ||
    bool(o.flagged_by_client) ||
    str(o.flaggedByClient).toLowerCase() === "true" ||
    str(o.flagged_by_client).toLowerCase() === "true";
  const flaggedAt = str(o.flaggedAt) || str(o.flagged_at) || "";

  return {
    id,
    name,
    url: url || lockedPreviewUrl,
    ...(mimeType ? { mimeType } : {}),
    ...(isVideo ? { isVideo: true } : {}),
    locked,
    lockedPreviewUrl: lockedPreviewUrl || undefined,
    ...(clientComment ? { clientComment } : {}),
    ...(photographerReply ? { photographerReply } : {}),
    ...(flaggedByClient ? { flaggedByClient: true } : {}),
    ...(flaggedAt ? { flaggedAt } : {}),
  };
}

/**
 * Normalize common API shapes: `{ folder, assets }`, `{ data: { folder, photos } }`, top-level arrays, etc.
 */
export function normalizeShareGalleryBody(body: unknown): NormalizedShareGallery | null {
  if (!body || typeof body !== "object") return null;
  const root = body as Raw;

  const nested =
    (root.data && typeof root.data === "object" ? (root.data as Raw) : null) ?? null;
  let folder: Raw | null =
    (root.folder && typeof root.folder === "object" ? (root.folder as Raw) : null) ??
    (root.gallery && typeof root.gallery === "object" ? (root.gallery as Raw) : null) ??
    (nested?.folder && typeof nested.folder === "object" ? (nested.folder as Raw) : null) ??
    (nested?.gallery && typeof nested.gallery === "object" ? (nested.gallery as Raw) : null) ??
    (nested && !nested.folder ? nested : null);

  /** Some APIs return the folder document at the root instead of `{ folder: { ... } }`. */
  if (
    !folder &&
    typeof (root as Raw)._id === "string" &&
    (Array.isArray((root as Raw).uploads) ||
      Array.isArray((root as Raw).finals) ||
      str((root as Raw).eventName).length > 0 ||
      ((root as Raw).client != null && typeof (root as Raw).client === "object"))
  ) {
    folder = root as Raw;
  }

  const share =
    folder?.share && typeof folder.share === "object" ? (folder.share as Raw) : null;

  const selectedIds = new Set<string>();
  if (folder && Array.isArray(folder.selection)) {
    for (const item of folder.selection) {
      if (item && typeof item === "object") {
        const o = item as Raw;
        const nestedRaw = o.raw && typeof o.raw === "object" ? (o.raw as Raw) : null;
        const rawMediaId =
          str(o.rawMediaId) ||
          (nestedRaw ? str(nestedRaw._id) : "") ||
          str(o._id) ||
          str(o.id);
        if (rawMediaId) selectedIds.add(rawMediaId);
      }
    }
  }

  const assetsRaw: unknown[] =
    folder && Array.isArray(folder.uploads)
      ? (folder.uploads as unknown[])
      : Array.isArray(root.assets)
        ? root.assets
        : Array.isArray(root.photos)
          ? root.photos
          : Array.isArray(root.images)
            ? root.images
            : Array.isArray(root.files)
              ? root.files
              : folder && Array.isArray(folder.assets)
                ? (folder.assets as unknown[])
                : folder && Array.isArray(folder.photos)
                  ? (folder.photos as unknown[])
                  : nested && Array.isArray(nested.assets)
                    ? (nested.assets as unknown[])
                    : nested && Array.isArray(nested.photos)
                      ? (nested.photos as unknown[])
                      : [];

  const finalsRaw: unknown[] =
    folder && Array.isArray(folder.finals)
      ? (folder.finals as unknown[])
      : Array.isArray(root.finals)
        ? root.finals
        : Array.isArray(root.finalAssets)
          ? root.finalAssets
          : folder && Array.isArray(folder.finalAssets)
            ? (folder.finalAssets as unknown[])
            : nested && Array.isArray(nested.finalAssets)
              ? (nested.finalAssets as unknown[])
              : [];

  const clientObj =
    root.client && typeof root.client === "object" ? (root.client as Raw) : null;
  const folderClient =
    folder?.client && typeof folder.client === "object" ? (folder.client as Raw) : null;

  const clientName =
    str(root.clientName) ||
    str(clientObj?.name) ||
    str(folderClient?.name) ||
    str(folder?.clientName) ||
    str(root.eventName) ||
    "Gallery";

  const eventName =
    str(folder?.eventName) ||
    str(folder?.name) ||
    str(root.eventName) ||
    str(root.name) ||
    undefined;

  const selectionLocked =
    bool(share?.selectionLocked) || bool(folder?.selectionLocked) || bool(root.selectionLocked);
  const selectionLimit = parseSelectionLimitFromBody(share, folder, root);

  /** True once the client has submitted at least once (timestamp or explicit flags). Never implies read-only; editing follows {@link canEditSelections}. */
  const selectionSubmitted =
    (share != null && str(share.selectionSubmittedAt).length > 0) ||
    str(folder?.selectionSubmittedAt).length > 0 ||
    bool(share?.selectionSubmitted) ||
    bool(folder?.selectionSubmitted) ||
    bool(root.selectionSubmitted) ||
    str(root.selectionStatus).toLowerCase() === "submitted" ||
    str(folder?.selectionStatus).toLowerCase() === "submitted";

  /**
   * Editable unless photographer-locked. GET /api/share/:id should send this as `!share.selectionLocked`;
   * we fall back to that if the boolean is omitted.
   */
  const canEditSelections =
    typeof root.canEditSelections === "boolean"
      ? root.canEditSelections
      : typeof folder?.canEditSelections === "boolean"
        ? folder.canEditSelections
        : !selectionLocked;

  const assets: ShareGalleryAsset[] = [];
  for (let i = 0; i < assetsRaw.length; i++) {
    const a = assetFromRow(assetsRaw[i], i);
    if (!a) continue;
    if (selectedIds.has(a.id)) {
      a.selection = "SELECTED";
    }
    assets.push(a);
  }

  const finals: ShareGalleryFinal[] = [];
  for (let i = 0; i < finalsRaw.length; i++) {
    const f = finalFromRow(finalsRaw[i], i);
    if (f) finals.push(f);
  }

  const folderId =
    str(folder?._id) ||
    str(folder?.id) ||
    str(root.folderId) ||
    str(nested?.folderId) ||
    undefined;

  let counts: NormalizedShareGallery["counts"];
  const c = folder?.counts ?? root.counts;
  if (c && typeof c === "object") {
    const o = c as Raw;
    counts = {
      uploads: typeof o.uploads === "number" ? o.uploads : assets.length,
      selected:
        typeof o.selected === "number"
          ? o.selected
          : assets.filter((x) => x.selection === "SELECTED").length,
      ...(typeof o.rejected === "number" ? { rejected: o.rejected } : {}),
      finals: typeof o.finals === "number" ? o.finals : finals.length,
      ...(typeof o.flaggedFinals === "number" ? { flaggedFinals: o.flaggedFinals } : {}),
    };
  } else {
    counts = undefined;
  }

  const { coverImageUrl, coverFocalX, coverFocalY } = resolvePublicGalleryCover(folder, root, nested);
  const coverFrame = resolvePublicGalleryCoverFrame(folder, root);
  const coverColor = resolvePublicGalleryCoverColor(folder, root);

  const folderPayload = folder ?? (root as Raw);

  const finalDelivery =
    typeof folderPayload.finalDelivery === "boolean"
      ? folderPayload.finalDelivery
      : typeof root.finalDelivery === "boolean"
        ? root.finalDelivery
        : typeof (folderPayload as Raw).final_delivery === "boolean"
          ? ((folderPayload as Raw).final_delivery as boolean)
          : typeof (root as Raw).final_delivery === "boolean"
            ? ((root as Raw).final_delivery as boolean)
            : undefined;

  const rightsProtection =
    typeof folderPayload.rightsProtection === "boolean"
      ? folderPayload.rightsProtection
      : typeof root.rightsProtection === "boolean"
        ? root.rightsProtection
        : typeof (folderPayload as Raw).rights_protection === "boolean"
          ? ((folderPayload as Raw).rights_protection as boolean)
          : typeof (root as Raw).rights_protection === "boolean"
            ? ((root as Raw).rights_protection as boolean)
            : undefined;

  const bgUrlRaw =
    str(folder?.backgroundMusicUrl) ||
    str((folder as Raw | null)?.background_music_url) ||
    str(folderPayload.backgroundMusicUrl) ||
    str((folderPayload as Raw).background_music_url) ||
    str(root.backgroundMusicUrl) ||
    str((root as Raw).background_music_url) ||
    "";

  const bgEnabledRaw =
    folderPayload.backgroundMusicEnabled ??
    folder?.backgroundMusicEnabled ??
    root.backgroundMusicEnabled;
  const backgroundMusicEnabled =
    bgEnabledRaw === undefined || bgEnabledRaw === null
      ? Boolean(bgUrlRaw)
      : shareTruthyOn(bgEnabledRaw);

  const backgroundMusicUrl =
    backgroundMusicEnabled && bgUrlRaw ? resolvePublicGalleryImageUrl(bgUrlRaw) : undefined;

  const sharePasswordEnabled =
    shareTruthyOn(folderPayload.sharePasswordEnabled) ||
    shareTruthyOn(folderPayload.share_password_enabled) ||
    shareTruthyOn(folder?.sharePasswordEnabled) ||
    shareTruthyOn((folder as Raw | null)?.share_password_enabled) ||
    shareTruthyOn(root.sharePasswordEnabled) ||
    shareTruthyOn((root as Raw).share_password_enabled);

  const shareAccessPinRaw =
    str(folderPayload.shareAccessPin) ||
    str((folderPayload as Raw).share_access_pin) ||
    str(folderPayload.accessPin) ||
    str((folderPayload as Raw).access_pin) ||
    str(folder?.shareAccessPin) ||
    str(root.shareAccessPin) ||
    "";
  const shareAccessPinDigits = shareAccessPinRaw.replace(/\D/g, "");
  const shareAccessPin =
    shareAccessPinDigits.length > 0
      ? shareAccessPinDigits.padStart(4, "0").slice(-4)
      : "";

  const studioRaw =
    root.studio && typeof root.studio === "object" ? (root.studio as Raw) : null;
  const studioLogoRaw = readStudioLogoRaw(studioRaw);
  const studioCompanyName = str(studioRaw?.companyName) || str(studioRaw?.company_name) || "";
  const studioCompanySlug = str(studioRaw?.companySlug) || str(studioRaw?.company_slug) || "";
  const studioLogoSrc = studioLogoRaw ? resolveStudioLogoUrl(studioLogoRaw) : "";
  const studio: ShareGalleryStudio | undefined =
    studioCompanyName || studioLogoSrc || studioCompanySlug
      ? {
          ...(studioCompanyName ? { companyName: studioCompanyName } : {}),
          ...(studioCompanySlug ? { companySlug: studioCompanySlug } : {}),
          ...(studioLogoSrc ? { logoSrc: studioLogoSrc } : {}),
        }
      : undefined;

  return {
    folderId,
    clientName,
    eventName,
    ...(studio ? { studio } : {}),
    eventDate: str(folder?.eventDate) || str(root.eventDate) || undefined,
    description: str(folder?.description) || str(root.description) || undefined,
    coverImageUrl,
    coverFocalX,
    coverFocalY,
    coverFrame,
    coverColor,
    selectionSubmitted,
    canEditSelections,
    selectionLocked,
    selectionLimit,
    finalDelivery,
    rightsProtection,
    ...(sharePasswordEnabled ? { sharePasswordEnabled: true } : {}),
    ...(sharePasswordEnabled && shareAccessPin ? { shareAccessPin } : {}),
    backgroundMusicUrl,
    backgroundMusicEnabled,
    assets,
    finals,
    counts,
  };
}

function parseSelectionLimitFromBody(
  share: Raw | null,
  folder: Raw | null,
  root: Raw,
): number | null {
  const raw =
    share?.selectionLimit ??
    folder?.selectionLimit ??
    root.selectionLimit ??
    share?.maxSelections ??
    folder?.maxSelections ??
    root.maxSelections;
  if (raw == null || raw === 0 || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.floor(n);
}

function publicFetchUrl(path: string, options?: { baseOrigin?: string }): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  if (typeof window !== "undefined") {
    return apiUrl(suffix);
  }
  const origin = options?.baseOrigin?.replace(/\/$/, "");
  if (origin) {
    return `${origin}${suffix}`;
  }
  return `${getBackendApiUrl()}${suffix}`;
}

type PublicFetchOptions = {
  baseOrigin?: string;
  signal?: AbortSignal;
};

/** How to address a public client gallery on `/api/public/...`. */
export type PublicGalleryKey =
  | { type: "token"; token: string }
  | { type: "slug"; companySlug: string; gallerySlug: string };

export function publicGalleryKeyFromToken(token: string): PublicGalleryKey {
  return { type: "token", token: token.trim() };
}

export function publicGalleryKeyFromSlugs(
  companySlug: string,
  gallerySlug: string,
): PublicGalleryKey {
  return {
    type: "slug",
    companySlug: companySlug.trim(),
    gallerySlug: gallerySlug.trim(),
  };
}

export function resolvePublicGalleryKey(key: PublicGalleryKey | string): PublicGalleryKey {
  return typeof key === "string" ? publicGalleryKeyFromToken(key) : key;
}

/** Stable id for sessionStorage keys (token or `companySlug/gallerySlug`). */
export function publicGallerySessionId(key: PublicGalleryKey | string): string {
  const k = resolvePublicGalleryKey(key);
  return k.type === "token" ? k.token : `${k.companySlug}/${k.gallerySlug}`;
}

function publicGalleryApiPath(key: PublicGalleryKey, subpath = ""): string {
  if (key.type === "token") {
    return `/api/public/token/${encodeURIComponent(key.token)}${subpath}`;
  }
  return `/api/public/${encodeURIComponent(key.companySlug)}/${encodeURIComponent(key.gallerySlug)}${subpath}`;
}

async function publicFetch(
  path: string,
  init: RequestInit = {},
  options: PublicFetchOptions = {},
): Promise<Response> {
  if (options.signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  const headers = new Headers(init.headers ?? {});
  if (
    init.body &&
    !(init.body instanceof FormData) &&
    !(init.body instanceof Blob) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(publicFetchUrl(path, options), {
    ...init,
    headers,
    signal: options.signal,
  });
}

async function publicJson<T>(
  path: string,
  init: RequestInit = {},
  fallbackError = "Request failed",
  options: PublicFetchOptions = {},
): Promise<T> {
  const res = await publicFetch(path, init, options);
  const body = await parseJson(res);
  if (!res.ok) {
    throw new ShareGalleryError(
      extractMessage(body, `${fallbackError} (${res.status})`),
      res.status,
      body,
    );
  }
  return body as T;
}

async function togglePublicPhotoSelection(
  key: PublicGalleryKey | string,
  photoId: string,
  options: PublicFetchOptions = {},
): Promise<void> {
  const resolved = resolvePublicGalleryKey(key);
  await publicJson(
    publicGalleryApiPath(resolved, "/select"),
    {
      method: "POST",
      body: JSON.stringify({ photoId }),
      signal: options.signal,
    },
    "Could not update selection",
    options,
  );
}

/**
 * Public client gallery payload for a share link.
 */
export async function getShareGallery(
  key: PublicGalleryKey | string,
  signal?: AbortSignal,
  options?: { baseOrigin?: string },
): Promise<NormalizedShareGallery> {
  const resolved = resolvePublicGalleryKey(key);
  const body = await publicJson<PublicGalleryResponse>(
    publicGalleryApiPath(resolved),
    { method: "GET", signal, cache: "no-store" },
    "Could not load gallery",
    { baseOrigin: options?.baseOrigin, signal },
  );
  const normalized = normalizeShareGalleryBody(body);
  if (!normalized) {
    throw new ShareGalleryError("Could not load gallery.", 500, body);
  }
  return normalized;
}

export async function postShareGallerySelection(
  key: PublicGalleryKey | string,
  rawMediaId: string,
  signal?: AbortSignal,
): Promise<void> {
  await togglePublicPhotoSelection(key, rawMediaId, { signal });
}

export async function syncShareGallerySelections(
  key: PublicGalleryKey | string,
  rawMediaIds: string[],
  signal?: AbortSignal,
): Promise<void> {
  const current = await getShareGallery(key, signal);
  const currentSelected = new Set(
    current.assets.filter((a) => a.selection === "SELECTED").map((a) => a.id),
  );
  const desired = new Set(rawMediaIds);

  for (const id of desired) {
    if (!currentSelected.has(id)) {
      await togglePublicPhotoSelection(key, id, { signal });
    }
  }
  for (const id of currentSelected) {
    if (!desired.has(id)) {
      await togglePublicPhotoSelection(key, id, { signal });
    }
  }
}

export async function postShareGalleryPhotoComment(
  key: PublicGalleryKey | string,
  photoId: string,
  comment: string,
  signal?: AbortSignal,
): Promise<void> {
  const resolved = resolvePublicGalleryKey(key);
  await publicJson(
    publicGalleryApiPath(resolved, "/comment"),
    {
      method: "POST",
      body: JSON.stringify({ photoId, comment }),
      signal,
    },
    "Could not save comment",
    { signal },
  );
}

export async function toggleShareGalleryPhotoReject(
  key: PublicGalleryKey | string,
  photoId: string,
  comment?: string,
  signal?: AbortSignal,
): Promise<void> {
  const resolved = resolvePublicGalleryKey(key);
  await publicJson(
    publicGalleryApiPath(resolved, "/reject"),
    {
      method: "POST",
      body: JSON.stringify({
        photoId,
        ...(comment !== undefined ? { comment } : {}),
      }),
      signal,
    },
    "Could not update rejection",
    { signal },
  );
}

/** Flag a delivered final for revision (`POST .../finals/:finalId/flag`). */
export async function postShareGalleryFinalFlag(
  key: PublicGalleryKey | string,
  finalId: string,
  comment: string,
  signal?: AbortSignal,
): Promise<void> {
  const resolved = resolvePublicGalleryKey(key);
  await publicJson(
    publicGalleryApiPath(resolved, `/finals/${encodeURIComponent(finalId)}/flag`),
    {
      method: "POST",
      body: JSON.stringify({ comment }),
      signal,
    },
    "Could not flag this edit",
    { signal },
  );
}

/** Update feedback on an already-flagged final (`PATCH .../finals/:finalId/comment`). */
export async function patchShareGalleryFinalComment(
  key: PublicGalleryKey | string,
  finalId: string,
  comment: string,
  signal?: AbortSignal,
): Promise<void> {
  const resolved = resolvePublicGalleryKey(key);
  await publicJson(
    publicGalleryApiPath(resolved, `/finals/${encodeURIComponent(finalId)}/comment`),
    {
      method: "PATCH",
      body: JSON.stringify({ comment }),
      signal,
    },
    "Could not update comment",
    { signal },
  );
}

export async function clearShareGallerySelections(
  key: PublicGalleryKey | string,
  signal?: AbortSignal,
): Promise<void> {
  const current = await getShareGallery(key, signal);
  const selected = current.assets.filter((a) => a.selection === "SELECTED");
  for (const asset of selected) {
    await togglePublicPhotoSelection(key, asset.id, { signal });
  }
}

export async function submitShareGallerySelectionsToPhotographer(
  key: PublicGalleryKey | string,
  signal?: AbortSignal,
): Promise<void> {
  const resolved = resolvePublicGalleryKey(key);
  await publicJson(
    publicGalleryApiPath(resolved, "/submit-selections"),
    { method: "POST", signal },
    "Could not submit selections",
    { signal },
  );
}

/** Same-origin download route for a delivered final. */
export function getShareFinalDownloadUrl(
  key: PublicGalleryKey | string,
  finalId: string,
): string {
  const resolved = resolvePublicGalleryKey(key);
  return apiUrl(
    publicGalleryApiPath(resolved, `/finals/${encodeURIComponent(finalId)}/download`),
  );
}

/**
 * Href for “save” on a delivered final.
 * Desktop: `/download` (filename + disposition from API).
 * Coarse-pointer / phones: Prefer {@link ShareGalleryFinal.url} so the asset opens inline and the OS
 * can offer **Save to Photos / Gallery**. The `/download` route is often `attachment`, which iOS/Android
 * send to **Files** instead of the photo library.
 */
export function getShareFinalSaveHref(
  key: PublicGalleryKey | string,
  f: ShareGalleryFinal,
  options: { preferInlineImageViewer: boolean },
): string {
  if (!f.locked && options.preferInlineImageViewer && f.url?.trim()) {
    return f.url.trim();
  }
  const fallback = getShareFinalDownloadUrl(key, f.id);
  return fallback || (f.url?.trim() ?? "");
}

/** Safe filename (+ extension guess) for a single final (`File` / share sheet). */
function finalizeShareFinalFilename(displayName: string, mimeOrEmpty: string): string {
  const raw = displayName.trim() || "photo";
  const safe = raw.replace(/[/\\?*:|"<>]/g, "_").replace(/\s+/g, " ").trim() || "photo";
  if (/\.[a-z0-9]{2,10}$/i.test(safe)) return safe;
  const m = mimeOrEmpty.toLowerCase();
  let ext = ".jpg";
  if (m.includes("png")) ext = ".png";
  else if (m.includes("webp")) ext = ".webp";
  else if (m.includes("gif")) ext = ".gif";
  else if (m.includes("heic") || m.includes("heif")) ext = ".heic";
  return `${safe}${ext}`;
}

/** Same-origin full-quality bytes for Save / Share (no pop-ups). */
export async function fetchShareFinalDownloadBlob(
  key: PublicGalleryKey | string,
  f: ShareGalleryFinal,
): Promise<Blob> {
  const url = (f.url?.trim() || getShareFinalDownloadUrl(key, f.id)).trim();
  if (!url) {
    throw new ShareGalleryError(`Could not download “${f.name}”.`, 400, null);
  }
  const res = await fetch(url);
  const body = res.ok ? null : await parseJson(res);
  if (!res.ok) {
    throw new ShareGalleryError(
      extractMessage(body, `Could not download “${f.name}” (${res.status}).`),
      res.status,
      body,
    );
  }
  let blob = await res.blob();
  if (typeof window !== "undefined") {
    const wm = getBrandWatermarkSettings();
    if (wm.enabled && wm.logoDataUrl) {
      blob = await applyBrandWatermarkToImageBlob(blob, wm);
    }
  }
  return blob;
}

/**
 * Uses `navigator.share({ files })` when available. Returns `true` if share ran or the user cancelled the sheet.
 */
export async function tryNavigatorShareFinalPhoto(blob: Blob, displayName: string): Promise<boolean> {
  return webSharePhotoFile(blob, displayName);
}

async function webSharePhotoFile(blob: Blob, displayName: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.share) return false;

  const mime =
    blob.type?.trim() || "image/jpeg";
  const fname = finalizeShareFinalFilename(displayName, mime);

  try {
    const file = new File([blob], fname, { type: mime });
    const payload: ShareData & { files: File[] } = {
      files: [file],
      title: fname,
    };
    if (typeof navigator.canShare === "function" && !navigator.canShare(payload)) {
      return false;
    }
    // If `canShare` is missing (older WebKit), attempt `share({ files })` anyway.
    await navigator.share(payload);
    return true;
  } catch (e) {
    const aborted =
      e instanceof DOMException ? e.name === "AbortError" : (e as { name?: string })?.name === "AbortError";
    // User dismissed share sheet counts as handled.
    if (aborted) return true;
    return false;
  }
}

export type ShareFinalZipEntry = { id: string; name: string };

function safeZipEntryName(original: string, used: Map<string, number>): string {
  const cleaned =
    (original.trim() || "photo").replace(/[/\\?*:|"<>]/g, "_").replace(/\s+/g, " ").trim() || "photo";
  const n = (used.get(cleaned) ?? 0) + 1;
  used.set(cleaned, n);
  if (n === 1) return cleaned;
  const dot = cleaned.lastIndexOf(".");
  if (dot > 0) {
    return `${cleaned.slice(0, dot)} (${n})${cleaned.slice(dot)}`;
  }
  return `${cleaned} (${n})`;
}

/**
 * Fetch each final via public download URLs and trigger a single .zip download in the browser.
 * Only pass finals that are unlocked for download.
 */
export async function downloadShareFinalsZip(
  key: PublicGalleryKey | string,
  finals: ShareFinalZipEntry[],
): Promise<void> {
  if (finals.length === 0) return;
  if (typeof window === "undefined") return;

  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const used = new Map<string, number>();

  for (const f of finals) {
    const url = getShareFinalDownloadUrl(key, f.id).trim() || "";
    if (!url) {
      throw new ShareGalleryError(`Could not download “${f.name}”.`, 400, null);
    }
    const res = await fetch(url);
    if (!res.ok) {
      const body = await parseJson(res);
      throw new ShareGalleryError(
        extractMessage(body, `Could not download “${f.name}” (${res.status}).`),
        res.status,
        body,
      );
    }
    let buf = await res.arrayBuffer();
    if (typeof window !== "undefined") {
      const wm = getBrandWatermarkSettings();
      if (wm.enabled && wm.logoDataUrl) {
        const blob = await applyBrandWatermarkToImageBlob(new Blob([buf], { type: res.headers.get("content-type") || "image/jpeg" }), wm);
        buf = await blob.arrayBuffer();
      }
    }
    zip.file(safeZipEntryName(f.name || `final-${f.id}`, used), buf);
  }

  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const safeToken = publicGallerySessionId(key)
    .replace(/[^\w-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "gallery";
  const filename = `finals-${safeToken}.zip`;

  const objectUrl = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Locked-state preview image (watermarked / limited). Use as `<img src>` when `final.locked`. */
export function getShareFinalLockedPreviewUrl(
  _key: PublicGalleryKey | string,
  _finalId: string,
): string {
  void _key;
  void _finalId;
  return "";
}
