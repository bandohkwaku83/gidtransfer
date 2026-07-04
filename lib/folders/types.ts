import type { ApiClient } from "@/lib/clients-api";
import type { GalleryCoverFrame } from "@/lib/gallery-cover-frame";
import type { GalleryImageLayout } from "@/lib/gallery-image-layout";
import type { ApiGallerySet } from "@/lib/gallery-sets-api";
import { HttpError } from "@/lib/http";

export type { DuplicateUploadAction } from "@/lib/upload-preferences";

export type GalleryUploadsPagination = {
  hasMore: boolean;
  nextCursor?: string | null;
};

export type ApiFolderShare = {
  enabled?: boolean;
  code?: string;
  slug?: string;
  sharedAt?: string | null;
  expiresAt?: string | null;
  viewCount?: number;
  /** Client-initiated final / gallery downloads tracked by the backend. */
  downloadCount?: number;
  linkExpiryPreset?: string | null;
  selectionSubmittedAt?: string | null;
  selectionLocked?: boolean;
  /** Max client heart-picks; omit or 0 = unlimited. */
  selectionLimit?: number | null;
  /** When true, client share treats finals as payment-locked until unlock (some backends nest here). */
  finalsLocked?: boolean;
};

/**
 * Raw / selection / final media row from folder detail API (shape may vary).
 * See `docs/backend-api-watermark-and-media.md`: `url` vs `displayUrl`, nested `selection[].raw`.
 */
export type ApiFolderMedia = {
  _id?: string;
  id?: string;
  filename?: string;
  originalName?: string;
  /** Common on GET folder `uploads` / upload responses */
  originalFilename?: string;
  name?: string;
  /** Whether this final is payment-locked for the client share (downloads disabled until unlock). */
  locked?: boolean;
  isLocked?: boolean;
  outstandingBalanceGhs?: number | null;
  clientPaid?: boolean;
  /** Primary file URL (often original / full-quality for admin views). */
  url?: string;
  /** When present, preferred URL for UI (e.g. watermarked preview when watermarking is enabled). */
  displayUrl?: string;
  mimeType?: string;
  contentType?: string;
  content_type?: string;
  isVideo?: boolean;
  thumbUrl?: string;
  thumbnailUrl?: string;
  /** Grid-optimized thumbnail from GET uploads?view=grid (often absolute CDN URL). */
  gridUrl?: string;
  previewUrl?: string;
  lockedPreviewUrl?: string;
  locked_preview_url?: string;
  image?: string;
  selected?: boolean;
  selection?: string;
  isSelected?: boolean;
  editStatus?: string;
  clientComment?: string;
  comment?: string;
  photographerReply?: string;
  photographerRepliedAt?: string | null;
  flaggedByClient?: boolean;
  flaggedAt?: string | null;
  /** ISO timestamp when the client selected/hearted this media item. */
  selectedAt?: string | null;
  /** On selection rows: nested raw file (GET folder detail). */
  raw?: ApiFolderMedia;
  rawMediaId?: string;
  /** Gallery set (subsection) this media belongs to, if any. */
  setId?: string | null;
  /** False while thumbnails / watermarked previews are still processing. */
  derivativesReady?: boolean;
};

export type { ApiGallerySet };

export type ApiFolder = {
  _id: string;
  /** Usually populated as a full client object; fall back to id string just in case. */
  client: string | ApiClient;
  eventName?: string;
  eventDate: string;
  description: string;
  /** Shoot category id from bookings meta (e.g. `wedding`). */
  galleryType?: string;
  /** Client gallery slug for `/client/{slug}` on the studio host. */
  slug?: string;
  /** Relative path stored on the server (e.g. "uploads/covers/..."). */
  coverImage?: string;
  /** Fully-qualified URL when available (preferred for rendering). */
  coverImageUrl?: string;
  /** Stored path for optional gallery background music (e.g. uploads/gallery-music/...). */
  backgroundMusic?: string;
  /** Fully-qualified URL when available (admin; empty when disabled). */
  backgroundMusicUrl?: string;
  /** When false, share responses omit playable music URL for clients. Default true when omitted. */
  backgroundMusicEnabled?: boolean;
  /** Focal point for `object-position` on cover (0–100). Omitted = centered. */
  coverFocalX?: number;
  coverFocalY?: number;
  /** Client gallery cover presentation selected by the photographer. */
  coverFrame?: GalleryCoverFrame;
  /** True when cover style/design settings were saved for this gallery. */
  coverStyleConfigured?: boolean;
  /** Backdrop color for cover styles that use a solid hero surface (hex, e.g. `#18181b`). */
  coverColor?: string;
  /** Cover hero title text color (hex). Omitted = auto contrast from backdrop. */
  coverTextColor?: string;
  /** Cover hero “View gallery” button color (hex). Omitted = auto contrast from backdrop. */
  coverButtonColor?: string;
  /** Default photo grid layout on the client share gallery. */
  imageLayout?: GalleryImageLayout;
  /** Client gallery title typography (design-settings). */
  titleFont?: string;
  /** Client gallery body typography (design-settings). */
  bodyFont?: string;
  /** When true, clients may download photos from the share gallery. */
  allowDownloads?: boolean;
  /** When true, clients must enter a password/PIN before viewing. */
  sharePasswordEnabled?: boolean;
  /** When true, clients must enter an email before viewing. */
  emailGateEnabled?: boolean;
  usingDefaultCover?: boolean;
  /** Client hero frozen when the share link was activated (admin working cover may differ). */
  shareCoverImageUrl?: string;
  shareUseDefaultCover?: boolean;
  shareCoverFocalX?: number;
  shareCoverFocalY?: number;
  shareCoverFrame?: GalleryCoverFrame;
  /** Frozen grid layout at share-link activation when backend snapshots it. */
  shareImageLayout?: GalleryImageLayout;
  share?: ApiFolderShare;
  /** Fully-qualified shareable URL (e.g. https://example.com/share/<code>). */
  shareUrl?: string;
  shareExpired?: boolean;
  /** Backend workflow status (e.g. draft, completed). */
  status?: string;
  /** Some responses nest this under `share` only; see {@link ApiFolderShare.selectionLocked}. */
  selectionLocked?: boolean;
  /** Max client heart-picks; omit or 0 = unlimited. */
  selectionLimit?: number | null;
  /** Raw uploads (detail GET). */
  uploads?: ApiFolderMedia[];
  /** When uploads were fetched with pagination, metadata for loading additional pages. */
  uploadsPagination?: GalleryUploadsPagination;
  /** Client selection rows (detail GET). */
  selection?: ApiFolderMedia[];
  /** Delivered finals (detail GET). */
  finals?: ApiFolderMedia[];
  /** Final images the client flagged for revisions, with comments. */
  flaggedFinals?: ApiFolderMedia[];
  /** Named subsections within this gallery (e.g. ceremony, reception). */
  /** Named subsections within this gallery. */
  sets?: ApiGallerySet[];
  /** Client-facing label for the combined “All” sets pill. */
  setsAllLabel?: string;
  /** Sort position of the “All” pill among set pills (0 = first). */
  setsAllSortOrder?: number;
  rawMedia?: ApiFolderMedia[];
  selectionMedia?: ApiFolderMedia[];
  finalMedia?: ApiFolderMedia[];
  /** When false, client gallery may hide final delivery UI until backend enables it. */
  finalDelivery?: boolean;
  /** Per-gallery preview watermark for raw uploads (from upload-settings). */
  watermarkPreviewEnabled?: boolean;
  /** Per-gallery watermark for finals (from final-settings). */
  watermarkFinalsEnabled?: boolean;
  /** When true, finals are payment-locked for the client until unlock (some backends send this without per-media `locked`). */
  finalsPaymentLocked?: boolean;
  /** Extra protection hints for client gallery (e.g. discourage saving screenshots). */
  rightsProtection?: boolean;
  /** Nested bucket some APIs use */
  media?: {
    raw?: ApiFolderMedia[];
    selections?: ApiFolderMedia[];
    selection?: ApiFolderMedia[];
    finals?: ApiFolderMedia[];
    final?: ApiFolderMedia[];
  };
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  /** When set, folder is in trash (soft-delete). */
  deletedAt?: string | null;
};

export type ListFoldersResponse = {
  count?: number;
  folders: ApiFolder[];
};

export type CreateFolderInput = {
  clientId: string;
  eventName: string;
  eventDate: string;
  description: string;
  /** Shoot category id from bookings meta (e.g. `wedding`). */
  galleryType: string;
  /** Client gallery slug for `/client/{slug}` on the studio host. */
  slug: string;
  /** Share link expiry preset id, e.g. `30d`, `never` (must match API / share-link-expiry-presets). */
  linkExpiry: string;
  coverImage?: File | null;
  useDefaultCover?: boolean;
  /** 0–100; used with custom cover for client `object-position`. */
  coverFocalX?: number;
  coverFocalY?: number;
};

export type UpdateFolderInput = {
  eventName?: string;
  eventDate?: string;
  description?: string;
  galleryType?: string;
  slug?: string;
  coverImage?: File | null;
  useDefaultCover?: boolean;
  coverFocalX?: number;
  coverFocalY?: number;
  coverFrame?: GalleryCoverFrame;
  coverColor?: string;
  imageLayout?: GalleryImageLayout;
  titleFont?: string;
  bodyFont?: string;
  backgroundMusicEnabled?: boolean;
};

/** Response when moving a gallery to trash (`DELETE /api/folders/:id`). */
export type FolderMoveToTrashResult = {
  message: string;
  deletedAt: string;
  restoreBefore: string;
  retentionDays: number;
  folder: ApiFolder;
};

export type TrashFolderRow = {
  folder: ApiFolder;
  deletedAt: string;
  restoreBefore: string;
};

/** Single trashed media row (`deletedBy: "media"`) from trash or media-trash APIs. */
export type TrashMediaRow = {
  folderId: string;
  folder?: ApiFolder;
  mediaId: string;
  kind: string;
  deletedAt: string;
  restoreBefore: string;
  url?: string;
  thumbUrl?: string;
  originalFilename?: string;
};

export type ListFoldersTrashResponse = {
  retentionDays: number;
  count: number;
  folders: TrashFolderRow[];
  deletedMedia: TrashMediaRow[];
  /** Full count of trashed media (may exceed `deletedMedia.length`). */
  deletedMediaTotal: number;
  /** Server chunk size for embedded `deletedMedia` (for aligning paginated fetches). */
  deletedMediaPreviewLimit: number;
  /** When more rows exist than embedded, backend may point at the paginated route. */
  deletedMediaPagingHint?: string;
};

/** Paginated trashed media (`GET /api/folders/media/trash`). */
export type ListFoldersMediaTrashParams = {
  page?: number;
  limit?: number;
  folderId?: string;
};

export type ListFoldersMediaTrashResponse = {
  items: TrashMediaRow[];
  page: number;
  limit: number;
  total: number;
};

/** `POST /api/folders/trash/purge` — permanent delete (not restore). */
export type TrashPurgeSkippedItem = {
  mediaId?: string;
  folderId?: string;
  reason: string;
};

export type TrashPurgeResult = {
  message: string;
  purgedFolderCount: number;
  purgedMediaCount: number;
  skipped?: TrashPurgeSkippedItem[];
};

export type PurgeFoldersTrashPayload =
  | { all: true }
  | { purgeAll: true }
  | { folderIds?: string[]; mediaIds?: string[] };

export type SoftDeletedMediaRef = {
  _id: string;
  kind: string;
};

export type MediaSoftDeleteResult = {
  message: string;
  deleted: SoftDeletedMediaRef;
  restoreBefore: string;
};

export type BulkMediaSoftDeleteResult = {
  message: string;
  deletedCount: number;
  restoreBefore: string;
};

export class FoldersApiError extends HttpError {}
