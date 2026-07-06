import type { ApiClient } from "@/lib/clients-api";
import { apiCacheKey, cachedApiCall, invalidateApiCache, invalidateApiCacheByTags } from "@/lib/api-cache";
import { CACHE_TAGS, invalidateGalleryCaches } from "@/lib/cache-tags";
import { authedJson } from "@/lib/http";
import type { ApiFolder, ApiFolderShare } from "@/lib/folders/types";
import { FoldersApiError } from "@/lib/folders/types";
import {
  DEFAULT_GALLERY_COVER_COLOR,
  GALLERY_COVER_ACCENT_PRESETS,
  GALLERY_COVER_COLOR_PRESETS,
  normalizeGalleryCoverColor,
  type GalleryCoverColorPreset,
} from "@/lib/gallery-cover-color";
import {
  GALLERY_COVER_FRAMES,
  normalizeGalleryCoverFrame,
  type GalleryCoverFrame,
  type GalleryCoverFrameOption,
} from "@/lib/gallery-cover-frame";
import type { GalleryAnalyticsApi } from "@/lib/gallery-analytics";
import {
  GALLERY_IMAGE_LAYOUTS,
  normalizeGalleryImageLayout,
  type GalleryImageLayout,
  type GalleryImageLayoutOption,
} from "@/lib/gallery-image-layout";

export type ApiGalleryStats = {
  uploadCount?: number;
  selectionCount?: number;
  finalCount?: number;
};

export type ApiGallery = {
  id: string;
  owner?: string;
  clientId?: unknown;
  clientName?: string;
  client?:
    | string
    | {
        id?: unknown;
        _id?: unknown;
        name?: string;
        email?: string;
        contact?: string;
        location?: string;
      }
    | null;
  name: string;
  eventName?: string;
  eventDate: string;
  description?: string;
  /** Shoot category id (same ids as GET /api/bookings/meta `shootTypes`). */
  galleryType?: string;
  /** Some API responses may use booking field names. */
  shootType?: string;
  category?: string;
  status: string;
  slug?: string;
  companySlug?: string;
  shareUrl?: string | null;
  shareLinkExpiryDays?: number;
  useDefaultCover?: boolean;
  coverImageUrl?: string | null;
  displayCoverUrl?: string | null;
  /** Frozen client hero at share-link activation (see `shareCoverImageUrl`). */
  shareCoverImageUrl?: string | null;
  shareUseDefaultCover?: boolean;
  shareCoverFocalX?: number;
  shareCoverFocalY?: number;
  shareCoverFrame?: string | null;
  coverFocalX?: number;
  coverFocalY?: number;
  coverFrame?: string | null;
  /** Design-settings alias for {@link coverFrame}. */
  coverStyle?: string | null;
  coverColor?: string | null;
  /** Design-settings preset id (e.g. `charcoal`). */
  backdropColor?: string | null;
  /** Design-settings alias for {@link backdropColor}. */
  generalColor?: string | null;
  coverTextColor?: string | null;
  coverButtonColor?: string | null;
  shareCoverColor?: string | null;
  design?: {
    coverStyle?: string | null;
    gridStyle?: string | null;
    generalColor?: string | null;
    backdropColor?: string | null;
    coverTextColor?: string | null;
    coverButtonColor?: string | null;
    typography?: {
      titleFont?: string | null;
      bodyFont?: string | null;
    } | null;
  } | null;
  imageLayout?: string | null;
  /** Design-settings alias for {@link imageLayout}. */
  gridStyle?: string | null;
  shareImageLayout?: string | null;
  titleFont?: string | null;
  bodyFont?: string | null;
  passwordProtected?: boolean;
  emailGateEnabled?: boolean;
  requireEmailToView?: boolean;
  allowDownloads?: boolean;
  backgroundMusicUrl?: string | null;
  backgroundMusicEnabled?: boolean;
  maxSelections?: number | null;
  selectionSubmittedAt?: string | null;
  selectionLocked?: boolean;
  finalDeliveryEnabled?: boolean;
  watermarkPreviewEnabled?: boolean;
  watermarkFinalsEnabled?: boolean;
  galleryTypeLabel?: string | null;
  restoreDeadline?: string | null;
  shareToken?: string | null;
  shareExpiresAt?: string | null;
  isShared?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  stats?: ApiGalleryStats;
  /** Client-facing label for the combined “All” sets pill. */
  setsAllLabel?: string | null;
  /** Sort position of the “All” pill among set pills (0 = first). */
  setsAllSortOrder?: number | null;
};

export type GalleryListCounts = {
  all: number;
  draft: number;
  selecting: number;
  done: number;
  trash: number;
};

export type ListGalleriesResponse = {
  counts: GalleryListCounts;
  galleries: ApiGallery[];
};

export type GalleryTypeMeta = {
  id: string;
  label: string;
  color?: string;
};

export type GalleryDesignMetaOption = {
  id: string;
  label?: string;
};

export type GalleryDesignMeta = {
  coverStyles?: GalleryDesignMetaOption[];
  gridStyles?: GalleryDesignMetaOption[];
  generalColors?: GalleryDesignMetaOption[];
  typography?: {
    titleFonts?: string[];
    bodyFonts?: string[];
  };
};

export type GalleriesMetaResponse = {
  galleryTypes?: GalleryTypeMeta[];
  design?: GalleryDesignMeta;
};

export type CreateGalleryBody = {
  clientId: string;
  name: string;
  eventDate: string;
  description?: string;
  galleryType?: string;
  /** URL slug for `/client/{slug}` on the studio host. */
  slug?: string;
  shareLinkExpiryDays?: number;
  useDefaultCover?: boolean;
  coverFrame?: GalleryCoverFrame;
  coverColor?: string;
  imageLayout?: GalleryImageLayout;
  generateDescriptionAi?: boolean;
};

export type GalleryDesignSettingsBody = {
  coverStyle?: string;
  backdropColor?: string;
  coverTextColor?: string;
  coverButtonColor?: string;
  gridStyle?: string;
  titleFont?: string;
  bodyFont?: string;
};

export type GalleryClientAccessBody = {
  passwordProtected?: boolean;
  password?: string;
  allowDownloads?: boolean;
  emailGateEnabled?: boolean;
};

export type GallerySelectionSettingsBody = {
  maxSelections?: number | null;
  selectionLocked?: boolean;
  finalDeliveryEnabled?: boolean;
};

export type GalleryDesignSettingsInput = {
  coverFrame?: GalleryCoverFrame;
  coverColor?: string;
  coverTextColor?: string;
  coverButtonColor?: string;
  imageLayout?: GalleryImageLayout;
  titleFont?: string;
  bodyFont?: string;
};

function apiSnakeToKebab(value: string): string {
  return value.trim().replace(/_/g, "-");
}

function uiKebabToApiSnake(value: string): string {
  return value.trim().replace(/-/g, "_");
}

export function apiCoverStyleToFrame(coverStyle: unknown): GalleryCoverFrame {
  if (typeof coverStyle !== "string" || !coverStyle.trim()) return "full-bleed";
  return normalizeGalleryCoverFrame(apiSnakeToKebab(coverStyle));
}

export function coverFrameToApiCoverStyle(frame: GalleryCoverFrame): string {
  return uiKebabToApiSnake(frame);
}

function findCoverColorPreset(id: string): GalleryCoverColorPreset | undefined {
  const normalized = id.trim().toLowerCase();
  return (
    GALLERY_COVER_COLOR_PRESETS.find((entry) => entry.id === normalized) ??
    GALLERY_COVER_ACCENT_PRESETS.find((entry) => entry.id === normalized)
  );
}

function findCoverColorPresetByHex(hex: string): GalleryCoverColorPreset | undefined {
  const normalized = normalizeGalleryCoverColor(hex);
  return (
    GALLERY_COVER_COLOR_PRESETS.find((entry) => entry.hex.toLowerCase() === normalized) ??
    GALLERY_COVER_ACCENT_PRESETS.find((entry) => entry.hex.toLowerCase() === normalized)
  );
}

export function apiBackdropColorToHex(backdropColor: unknown): string {
  if (typeof backdropColor !== "string" || !backdropColor.trim()) {
    return DEFAULT_GALLERY_COVER_COLOR;
  }
  const id = backdropColor.trim().toLowerCase();
  const preset = findCoverColorPreset(id);
  if (preset) return preset.hex;
  return normalizeGalleryCoverColor(backdropColor);
}

export function coverColorToApiBackdropColor(hex: string): string {
  const normalized = normalizeGalleryCoverColor(hex);
  const preset = findCoverColorPresetByHex(normalized);
  return preset?.id ?? "charcoal";
}

export function apiGridStyleToLayout(gridStyle: unknown): GalleryImageLayout {
  if (typeof gridStyle !== "string" || !gridStyle.trim()) return "masonry";
  return normalizeGalleryImageLayout(apiSnakeToKebab(gridStyle));
}

export function imageLayoutToApiGridStyle(layout: GalleryImageLayout): string {
  return uiKebabToApiSnake(layout);
}

export function galleryDesignInputToApiBody(
  input: GalleryDesignSettingsInput,
): GalleryDesignSettingsBody {
  const body: GalleryDesignSettingsBody = {};
  if (input.coverFrame !== undefined) {
    body.coverStyle = coverFrameToApiCoverStyle(normalizeGalleryCoverFrame(input.coverFrame));
  }
  if (input.coverColor !== undefined) {
    body.backdropColor = coverColorToApiBackdropColor(input.coverColor);
  }
  if (input.coverTextColor !== undefined) {
    body.coverTextColor = coverColorToApiBackdropColor(input.coverTextColor);
  }
  if (input.coverButtonColor !== undefined) {
    body.coverButtonColor = coverColorToApiBackdropColor(input.coverButtonColor);
  }
  if (input.imageLayout !== undefined) {
    body.gridStyle = imageLayoutToApiGridStyle(normalizeGalleryImageLayout(input.imageLayout));
  }
  if (input.titleFont !== undefined) body.titleFont = input.titleFont.trim();
  if (input.bodyFont !== undefined) body.bodyFont = input.bodyFont.trim();
  return body;
}

const DEFAULT_TITLE_FONTS = [
  "Playfair Display",
  "Cormorant Garamond",
  "Libre Baskerville",
  "DM Serif Display",
] as const;

const DEFAULT_BODY_FONTS = ["Inter", "DM Sans", "Source Sans 3", "Nunito Sans"] as const;

function metaOptionIds(options: GalleryDesignMetaOption[] | undefined): string[] | null {
  if (!options?.length) return null;
  const ids = options.map((o) => apiSnakeToKebab(o.id)).filter(Boolean);
  return ids.length > 0 ? ids : null;
}

export function resolveMetaCoverFrames(
  meta: GalleriesMetaResponse | null | undefined,
): GalleryCoverFrameOption[] {
  const ids = metaOptionIds(meta?.design?.coverStyles);
  if (!ids) return [...GALLERY_COVER_FRAMES];
  const idSet = new Set(ids);
  const filtered = GALLERY_COVER_FRAMES.filter((frame) => idSet.has(frame.id));
  return filtered.length > 0 ? filtered : [...GALLERY_COVER_FRAMES];
}

export function resolveMetaGridLayouts(
  meta: GalleriesMetaResponse | null | undefined,
): GalleryImageLayoutOption[] {
  const ids = metaOptionIds(meta?.design?.gridStyles);
  if (!ids) return [...GALLERY_IMAGE_LAYOUTS];
  const idSet = new Set(ids);
  const filtered = GALLERY_IMAGE_LAYOUTS.filter((layout) => idSet.has(layout.id));
  return filtered.length > 0 ? filtered : [...GALLERY_IMAGE_LAYOUTS];
}

export function resolveMetaCoverColorPresets(
  meta: GalleriesMetaResponse | null | undefined,
): readonly GalleryCoverColorPreset[] {
  const colors = meta?.design?.generalColors;
  if (!colors?.length) return GALLERY_COVER_COLOR_PRESETS;
  const resolved = colors.map((entry) => {
    const id = entry.id.trim().toLowerCase();
    const preset = GALLERY_COVER_COLOR_PRESETS.find((p) => p.id === id);
    return {
      id,
      hex: preset?.hex ?? apiBackdropColorToHex(id),
      label: entry.label?.trim() || preset?.label || entry.id,
    };
  });
  return resolved.length > 0 ? resolved : GALLERY_COVER_COLOR_PRESETS;
}

export function resolveMetaTitleFonts(
  meta: GalleriesMetaResponse | null | undefined,
): readonly string[] {
  const fonts = meta?.design?.typography?.titleFonts?.map((f) => f.trim()).filter(Boolean);
  return fonts?.length ? fonts : DEFAULT_TITLE_FONTS;
}

export function resolveMetaBodyFonts(
  meta: GalleriesMetaResponse | null | undefined,
): readonly string[] {
  const fonts = meta?.design?.typography?.bodyFonts?.map((f) => f.trim()).filter(Boolean);
  return fonts?.length ? fonts : DEFAULT_BODY_FONTS;
}

export type UpdateGalleryBody = {
  name?: string;
  eventDate?: string;
  description?: string;
  galleryType?: string;
  slug?: string;
  status?: string;
  shareLinkExpiryDays?: number;
  useDefaultCover?: boolean;
  coverFrame?: GalleryCoverFrame;
  coverColor?: string;
  imageLayout?: GalleryImageLayout;
  generateDescriptionAi?: boolean;
};

const TRASH_RETENTION_DAYS = 30;

function isBrokenId(value: unknown): boolean {
  if (value == null) return true;
  const s = String(value).trim();
  return !s || s === "undefined" || s.includes("[object");
}

function readEntityId(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object") {
    const o = value as { id?: unknown; _id?: unknown };
    const fromId = o.id != null ? String(o.id).trim() : "";
    if (fromId && fromId !== "undefined" && !fromId.includes("[object")) return fromId;
    const fromMongoId = o._id != null ? String(o._id).trim() : "";
    if (fromMongoId && fromMongoId !== "undefined" && !fromMongoId.includes("[object")) {
      return fromMongoId;
    }
    return "";
  }
  const s = String(value).trim();
  return isBrokenId(s) ? "" : s;
}

function normalizeGalleryForClient(g: ApiGallery): ApiGallery {
  const raw = g as ApiGallery & Record<string, unknown>;
  let clientId = g.clientId;
  let client = g.client;
  let clientName = g.clientName;

  if (clientId != null && typeof clientId === "object") {
    const populated = clientId as {
      id?: unknown;
      _id?: unknown;
      name?: string;
      email?: string;
      contact?: string;
      location?: string;
    };
    if (!clientName?.trim() && populated.name?.trim()) {
      clientName = populated.name.trim();
    }
    if (!client || typeof client !== "object") {
      client = populated;
    }
    clientId = readEntityId(populated);
  }

  if (!readEntityId(clientId) && raw.client_id != null) {
    clientId = raw.client_id;
  }

  if (!clientName?.trim() && typeof raw.client_name === "string") {
    clientName = raw.client_name.trim();
  }

  return { ...g, clientId, client, clientName };
}

function resolveGalleryClientId(g: ApiGallery): string {
  const fromClientId = readEntityId(g.clientId);
  if (fromClientId) return fromClientId;
  if (typeof g.client === "string" && !isBrokenId(g.client)) return g.client.trim();
  if (g.client && typeof g.client === "object") {
    const fromClient = readEntityId(g.client);
    if (fromClient) return fromClient;
  }
  const raw = g as ApiGallery & { client_id?: unknown };
  return readEntityId(raw.client_id);
}

function resolveGalleryClient(g: ApiGallery, clientNameById?: Map<string, string>): ApiClient {
  const gallery = normalizeGalleryForClient(g);
  const id = resolveGalleryClientId(gallery);
  const rootClientName = gallery.clientName?.trim();
  if (rootClientName) {
    return {
      _id: id || "unknown",
      name: rootClientName,
      email: "",
      contact: "",
      location: "",
    };
  }

  if (typeof gallery.client === "string" && !isBrokenId(gallery.client)) {
    const clientId = gallery.client.trim();
    const name = clientNameById?.get(clientId)?.trim();
    return {
      _id: clientId,
      name: name || "Unknown client",
      email: "",
      contact: "",
      location: "",
    };
  }

  if (gallery.client && typeof gallery.client === "object") {
    const c = gallery.client;
    const clientObjId = readEntityId(c);
    const resolvedId = id || clientObjId;
    const name = c.name?.trim();
    if (name) {
      return {
        _id: resolvedId || "unknown",
        name,
        email: c.email?.trim() ?? "",
        contact: c.contact?.trim() ?? "",
        location: c.location?.trim() ?? "",
      };
    }
    const mappedName = resolvedId ? clientNameById?.get(resolvedId)?.trim() : undefined;
    if (mappedName) {
      return {
        _id: resolvedId,
        name: mappedName,
        email: c.email?.trim() ?? "",
        contact: c.contact?.trim() ?? "",
        location: c.location?.trim() ?? "",
      };
    }
  }

  const name = id ? clientNameById?.get(id) : undefined;
  return {
    _id: id || "unknown",
    name: name?.trim() || "Unknown client",
    email: "",
    contact: "",
    location: "",
  };
}

function shareLinkExpiryDaysToPreset(days: number | null | undefined): string | null {
  if (days == null) return "never";
  const presets: [number, string][] = [
    [7, "7d"],
    [14, "14d"],
    [30, "30d"],
    [60, "60d"],
    [90, "90d"],
    [180, "180d"],
    [365, "365d"],
  ];
  for (const [d, id] of presets) {
    if (days === d) return id;
  }
  return null;
}

export function shareLinkExpiryPresetToDays(presetId: string): number {
  const presets: Record<string, number> = {
    never: 3650,
    "7d": 7,
    "14d": 14,
    "30d": 30,
    "60d": 60,
    "90d": 90,
    "180d": 180,
    "365d": 365,
  };
  return presets[presetId] ?? 30;
}

export function resolveGalleryTypeId(g: ApiGallery): string | undefined {
  const raw =
    g.galleryType?.trim() ||
    g.shootType?.trim() ||
    g.category?.trim() ||
    undefined;
  return raw || undefined;
}

export function uiStatusToGalleryStatus(status: string): string {
  const v = status.trim().toLowerCase();
  if (v === "completed" || v === "complete" || v === "delivered" || v === "done") return "done";
  if (v === "selection_pending" || v === "selection-pending" || v === "selecting") return "selecting";
  return "draft";
}

export function mapGalleryToApiFolder(
  g: ApiGallery,
  clientNameById?: Map<string, string>,
): ApiFolder {
  const gallery = normalizeGalleryForClient(g);
  const raw = gallery as ApiGallery & { _id?: string };
  const token = gallery.shareToken?.trim() || "";
  const slugPath =
    g.companySlug?.trim() && g.slug?.trim()
      ? `/${g.companySlug.trim()}/${g.slug.trim()}`
      : null;
  const share: ApiFolderShare | undefined = token || g.isShared
    ? {
        enabled: g.isShared === true,
        code: token || undefined,
        slug: token || undefined,
        expiresAt: g.shareExpiresAt ?? null,
        linkExpiryPreset: shareLinkExpiryDaysToPreset(g.shareLinkExpiryDays),
      }
    : undefined;

  const design = g.design;
  const cover = g.coverImageUrl ?? g.displayCoverUrl ?? undefined;
  const coverFrame = apiCoverStyleToFrame(
    g.coverStyle ?? g.coverFrame ?? design?.coverStyle ?? g.shareCoverFrame,
  );
  const coverColor = normalizeGalleryCoverColor(
    apiBackdropColorToHex(
      g.generalColor ??
        g.backdropColor ??
        design?.generalColor ??
        design?.backdropColor ??
        g.coverColor ??
        g.shareCoverColor ??
        undefined,
    ),
  );
  const coverStyleConfigured = Boolean(
    g.coverStyle?.trim() ||
      g.coverFrame?.trim() ||
      design?.coverStyle?.trim() ||
      g.generalColor?.trim() ||
      g.backdropColor?.trim() ||
      design?.generalColor?.trim() ||
      design?.backdropColor?.trim() ||
      g.coverColor?.trim(),
  );
  const imageLayoutRaw =
    g.gridStyle ?? g.imageLayout ?? design?.gridStyle ?? g.shareImageLayout;
  const imageLayout = imageLayoutRaw
    ? apiGridStyleToLayout(imageLayoutRaw)
    : undefined;
  const shareCover =
    g.shareCoverImageUrl?.trim() ||
    (g.shareUseDefaultCover ? "(studio default at activation)" : undefined);
  const maxSelections = g.maxSelections;
  const selectionLimit =
    maxSelections == null || maxSelections === 0 ? null : Math.max(1, Math.floor(maxSelections));
  const galleryType = resolveGalleryTypeId(gallery);
  const rawGallery = gallery as ApiGallery & {
    sets_all_label?: string | null;
    sets_all_sort_order?: number | null;
  };
  const setsAllLabelRaw = g.setsAllLabel ?? rawGallery.sets_all_label;
  const setsAllSortOrderRaw = g.setsAllSortOrder ?? rawGallery.sets_all_sort_order;

  return {
    _id: String(gallery.id ?? raw._id ?? ""),
    client: resolveGalleryClient(gallery, clientNameById),
    eventName: gallery.eventName?.trim() || gallery.name?.trim() || "",
    eventDate: gallery.eventDate,
    description: gallery.description?.trim() ?? "",
    ...(galleryType ? { galleryType } : {}),
    ...(g.slug?.trim() ? { slug: g.slug.trim() } : {}),
    coverImageUrl: cover ?? undefined,
    coverFocalX: g.coverFocalX ?? 50,
    coverFocalY: g.coverFocalY ?? 50,
    coverFrame,
    coverColor,
    ...(g.coverTextColor?.trim() || design?.coverTextColor?.trim()
      ? {
          coverTextColor: normalizeGalleryCoverColor(
            apiBackdropColorToHex(g.coverTextColor ?? design?.coverTextColor ?? undefined),
          ),
        }
      : {}),
    ...(g.coverButtonColor?.trim() || design?.coverButtonColor?.trim()
      ? {
          coverButtonColor: normalizeGalleryCoverColor(
            apiBackdropColorToHex(g.coverButtonColor ?? design?.coverButtonColor ?? undefined),
          ),
        }
      : {}),
    ...(coverStyleConfigured ? { coverStyleConfigured: true } : {}),
    ...(imageLayout ? { imageLayout } : {}),
    ...(g.titleFont?.trim() || design?.typography?.titleFont?.trim()
      ? { titleFont: (g.titleFont ?? design?.typography?.titleFont ?? "").trim() }
      : {}),
    ...(g.bodyFont?.trim() || design?.typography?.bodyFont?.trim()
      ? { bodyFont: (g.bodyFont ?? design?.typography?.bodyFont ?? "").trim() }
      : {}),
    ...(g.allowDownloads !== undefined ? { allowDownloads: g.allowDownloads === true } : {}),
    ...(g.passwordProtected === true ? { sharePasswordEnabled: true } : {}),
    ...(g.emailGateEnabled === true || g.requireEmailToView === true
      ? { emailGateEnabled: true }
      : {}),
    usingDefaultCover: g.useDefaultCover !== false,
    ...(shareCover ? { shareCoverImageUrl: shareCover } : {}),
    ...(g.shareUseDefaultCover !== undefined
      ? { shareUseDefaultCover: g.shareUseDefaultCover }
      : {}),
    ...(g.shareCoverFocalX != null ? { shareCoverFocalX: g.shareCoverFocalX } : {}),
    ...(g.shareCoverFocalY != null ? { shareCoverFocalY: g.shareCoverFocalY } : {}),
    ...(g.shareCoverFrame ? { shareCoverFrame: normalizeGalleryCoverFrame(g.shareCoverFrame) } : {}),
    ...(g.shareImageLayout
      ? { shareImageLayout: normalizeGalleryImageLayout(g.shareImageLayout) }
      : {}),
    backgroundMusicUrl: g.backgroundMusicUrl?.trim() || undefined,
    backgroundMusicEnabled: g.backgroundMusicEnabled,
    share: share
      ? {
          ...share,
          selectionLimit,
          selectionLocked: g.selectionLocked === true,
          selectionSubmittedAt: g.selectionSubmittedAt ?? share.selectionSubmittedAt ?? null,
        }
      : selectionLimit != null || g.selectionSubmittedAt || g.selectionLocked
        ? {
            selectionLimit,
            selectionLocked: g.selectionLocked === true,
            selectionSubmittedAt: g.selectionSubmittedAt ?? null,
          }
        : undefined,
    selectionLocked: g.selectionLocked === true,
    finalDelivery: g.finalDeliveryEnabled !== false,
    watermarkPreviewEnabled: g.watermarkPreviewEnabled,
    watermarkFinalsEnabled: g.watermarkFinalsEnabled,
    shareUrl:
      g.shareUrl?.trim() ||
      slugPath ||
      (token ? `/g/${encodeURIComponent(token)}` : undefined),
    selectionLimit,
    status: g.status,
    createdAt: g.createdAt,
    updatedAt: g.updatedAt,
    deletedAt: g.deletedAt ?? null,
    uploads: [],
    selection: [],
    finals: [],
    ...(typeof setsAllLabelRaw === "string" && setsAllLabelRaw.trim()
      ? { setsAllLabel: setsAllLabelRaw.trim() }
      : {}),
    ...(typeof setsAllSortOrderRaw === "number" && Number.isFinite(setsAllSortOrderRaw)
      ? { setsAllSortOrder: Math.max(0, Math.floor(setsAllSortOrderRaw)) }
      : {}),
  };
}

export function trashRestoreBefore(deletedAt: string, retentionDays = TRASH_RETENTION_DAYS): string {
  const d = new Date(deletedAt);
  if (Number.isNaN(d.getTime())) {
    return new Date(Date.now() + retentionDays * 86400000).toISOString();
  }
  d.setDate(d.getDate() + retentionDays);
  return d.toISOString();
}

function galleryPath(id: string) {
  return `/api/galleries/${encodeURIComponent(id)}`;
}

function invalidateGalleryListCaches(galleryId?: string): void {
  invalidateApiCacheByTags(invalidateGalleryCaches(galleryId));
  invalidateApiCache("/api/galleries");
}

export async function listGalleries(params: {
  status?: string;
  trash?: boolean;
  search?: string;
} = {}): Promise<ListGalleriesResponse> {
  const q = new URLSearchParams();
  if (params.trash) {
    q.set("trash", "1");
  } else {
    q.set("status", params.status?.trim() || "all");
  }
  const search = params.search?.trim();
  if (search) q.set("search", search);

  const path = `/api/galleries?${q.toString()}`;

  return cachedApiCall(
    apiCacheKey("GET", path),
    async () => {
      const res = await authedJson<ListGalleriesResponse>(
        path,
        { method: "GET" },
        "Failed to load galleries",
        FoldersApiError,
      );

      return {
        counts: {
          all: res.counts?.all ?? res.galleries?.length ?? 0,
          draft: res.counts?.draft ?? 0,
          selecting: res.counts?.selecting ?? 0,
          done: res.counts?.done ?? 0,
          trash: res.counts?.trash ?? 0,
        },
        galleries: (res.galleries ?? []).map((gallery) => normalizeGalleryForClient(gallery)),
      };
    },
    { ttlMs: 20_000, tags: [CACHE_TAGS.galleries] },
  );
}

export async function getGallery(id: string): Promise<ApiGallery> {
  return getGalleryDetail(id);
}

export async function getGalleryDetail(id: string): Promise<ApiGallery> {
  try {
    const res = await authedJson<{ gallery: ApiGallery }>(
      `${galleryPath(id)}/detail`,
      { method: "GET" },
      "Failed to load gallery",
      FoldersApiError,
    );
    return res.gallery;
  } catch (e) {
    if (e instanceof FoldersApiError && e.status === 404) {
      const res = await authedJson<{ gallery: ApiGallery } | ApiGallery>(
        galleryPath(id),
        { method: "GET" },
        "Failed to load gallery",
        FoldersApiError,
      );
      if (res && typeof res === "object" && "gallery" in res && res.gallery) {
        return res.gallery;
      }
      return res as ApiGallery;
    }
    throw e;
  }
}

export async function getGalleriesMeta(): Promise<GalleriesMetaResponse> {
  return authedJson<GalleriesMetaResponse>(
    "/api/galleries/meta",
    { method: "GET" },
    "Failed to load gallery metadata",
    FoldersApiError,
  );
}

const MAX_GALLERY_COVER_BYTES = 5_242_880;

function appendGalleryFormFields(
  form: FormData,
  body: CreateGalleryBody | UpdateGalleryBody,
) {
  if ("clientId" in body && body.clientId !== undefined) {
    form.append("clientId", body.clientId);
  }
  if (body.name !== undefined) form.append("name", body.name);
  if (body.eventDate !== undefined) form.append("eventDate", body.eventDate);
  if (body.description !== undefined) form.append("description", body.description);
  if (body.galleryType !== undefined) form.append("galleryType", body.galleryType);
  if (body.slug !== undefined) form.append("slug", body.slug);
  if ("status" in body && body.status !== undefined) form.append("status", body.status);
  if (body.shareLinkExpiryDays !== undefined) {
    form.append("shareLinkExpiryDays", String(body.shareLinkExpiryDays));
  }
  if (body.useDefaultCover !== undefined) {
    form.append("useDefaultCover", body.useDefaultCover ? "true" : "false");
  }
  if (body.coverFrame !== undefined) {
    form.append("coverFrame", body.coverFrame);
  }
  if (body.coverColor !== undefined) {
    form.append("coverColor", body.coverColor);
  }
  if (body.imageLayout !== undefined) {
    form.append("imageLayout", body.imageLayout);
  }
  if (body.generateDescriptionAi !== undefined) {
    form.append("generateDescriptionAi", body.generateDescriptionAi ? "true" : "false");
  }
}

export async function createGallery(
  body: CreateGalleryBody,
  options?: { coverFile?: File | null },
): Promise<{ message?: string; gallery: ApiGallery }> {
  const coverFile = options?.coverFile;
  if (coverFile) {
    const form = new FormData();
    appendGalleryFormFields(form, { ...body, useDefaultCover: false });
    form.append("cover", coverFile);
    const result = await authedJson<{ message?: string; gallery: ApiGallery }>(
      "/api/galleries",
      { method: "POST", body: form },
      "Failed to create gallery",
      FoldersApiError,
    );
    invalidateGalleryListCaches(result.gallery.id);
    return result;
  }
  const result = await authedJson<{ message?: string; gallery: ApiGallery }>(
    "/api/galleries",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    "Failed to create gallery",
    FoldersApiError,
  );
  invalidateGalleryListCaches(result.gallery.id);
  return result;
}

export async function updateGallery(
  id: string,
  body: UpdateGalleryBody,
  options?: { coverFile?: File | null },
): Promise<{ message?: string; gallery: ApiGallery }> {
  const coverFile = options?.coverFile;
  if (coverFile) {
    if (coverFile.size > MAX_GALLERY_COVER_BYTES) {
      throw new FoldersApiError("Cover must be 5MB or smaller.", 400, null);
    }
    const form = new FormData();
    appendGalleryFormFields(form, { ...body, useDefaultCover: false });
    form.append("cover", coverFile);
    const result = await authedJson<{ message?: string; gallery: ApiGallery }>(
      galleryPath(id),
      { method: "PUT", body: form },
      "Failed to update gallery",
      FoldersApiError,
    );
    invalidateGalleryListCaches(result.gallery.id);
    return result;
  }
  const result = await authedJson<{ message?: string; gallery: ApiGallery }>(
    galleryPath(id),
    {
      method: "PUT",
      body: JSON.stringify(body),
    },
    "Failed to update gallery",
    FoldersApiError,
  );
  invalidateGalleryListCaches(id);
  return result;
}

export async function deleteGallery(id: string): Promise<{ message?: string; gallery: ApiGallery }> {
  const result = await authedJson<{ message?: string; gallery: ApiGallery }>(
    galleryPath(id),
    { method: "DELETE" },
    "Failed to delete gallery",
    FoldersApiError,
  );
  invalidateGalleryListCaches(id);
  return result;
}

export async function restoreGallery(id: string): Promise<{ message?: string; gallery: ApiGallery }> {
  const result = await authedJson<{ message?: string; gallery: ApiGallery }>(
    `${galleryPath(id)}/restore`,
    { method: "PATCH" },
    "Failed to restore gallery",
    FoldersApiError,
  );
  invalidateGalleryListCaches(id);
  return result;
}

export async function completeGallery(id: string): Promise<{ message?: string; gallery: ApiGallery }> {
  const result = await authedJson<{ message?: string; gallery: ApiGallery }>(
    `${galleryPath(id)}/complete`,
    { method: "PATCH" },
    "Failed to mark gallery completed",
    FoldersApiError,
  );
  invalidateGalleryListCaches(id);
  return result;
}

export async function updateGalleryCoverFocalPoint(
  id: string,
  body: { coverFocalX: number; coverFocalY: number },
): Promise<{ message?: string; gallery: ApiGallery }> {
  return authedJson<{ message?: string; gallery: ApiGallery }>(
    `${galleryPath(id)}/cover-focal-point`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
    "Failed to update cover focal point",
    FoldersApiError,
  );
}

export async function uploadGalleryBackgroundMusic(
  id: string,
  file: File,
): Promise<{ message?: string; gallery: ApiGallery }> {
  const form = new FormData();
  form.append("audio", file);
  return authedJson<{ message?: string; gallery: ApiGallery }>(
    `${galleryPath(id)}/music`,
    { method: "POST", body: form },
    "Failed to upload background music",
    FoldersApiError,
  );
}

export async function toggleGalleryBackgroundMusic(
  id: string,
  backgroundMusicEnabled: boolean,
): Promise<{ message?: string; gallery: ApiGallery }> {
  return authedJson<{ message?: string; gallery: ApiGallery }>(
    `${galleryPath(id)}/music`,
    {
      method: "PATCH",
      body: JSON.stringify({ backgroundMusicEnabled }),
    },
    "Failed to update background music setting",
    FoldersApiError,
  );
}

export async function deleteGalleryBackgroundMusic(
  id: string,
): Promise<{ message?: string; gallery: ApiGallery }> {
  return authedJson<{ message?: string; gallery: ApiGallery }>(
    `${galleryPath(id)}/music`,
    { method: "DELETE" },
    "Failed to remove background music",
    FoldersApiError,
  );
}

export async function updateGalleryUploadSettings(
  id: string,
  body: { watermarkPreviewEnabled: boolean },
): Promise<{ message?: string; gallery: ApiGallery }> {
  return authedJson<{ message?: string; gallery: ApiGallery }>(
    `${galleryPath(id)}/upload-settings`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
    "Failed to update upload settings",
    FoldersApiError,
  );
}

export async function updateGalleryFinalSettings(
  id: string,
  body: { watermarkFinalsEnabled: boolean },
): Promise<{ message?: string; gallery: ApiGallery }> {
  return authedJson<{ message?: string; gallery: ApiGallery }>(
    `${galleryPath(id)}/final-settings`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
    "Failed to update final delivery settings",
    FoldersApiError,
  );
}

export async function updateGallerySelectionSettings(
  id: string,
  body: GallerySelectionSettingsBody,
): Promise<{ message?: string; gallery: ApiGallery }> {
  return authedJson<{ message?: string; gallery: ApiGallery }>(
    `${galleryPath(id)}/selection-settings`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
    "Failed to update selection settings",
    FoldersApiError,
  );
}

export async function updateGalleryDesignSettings(
  id: string,
  body: GalleryDesignSettingsBody,
): Promise<{ message?: string; gallery: ApiGallery }> {
  const result = await authedJson<{ message?: string; gallery: ApiGallery }>(
    `${galleryPath(id)}/design-settings`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
    "Failed to update gallery design",
    FoldersApiError,
  );
  invalidateGalleryListCaches(result.gallery.id);
  return result;
}

export async function updateGalleryClientAccess(
  id: string,
  body: GalleryClientAccessBody,
): Promise<{ message?: string; gallery: ApiGallery }> {
  return authedJson<{ message?: string; gallery: ApiGallery }>(
    `${galleryPath(id)}/client-access`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
    "Failed to update client access",
    FoldersApiError,
  );
}

export type ActivateGalleryShareLinkInput = {
  notifyClientViaSms?: boolean;
  message?: string;
};

export type ActivateGalleryShareLinkResponse = {
  message?: string;
  gallery: ApiGallery;
  sms?: unknown;
  smsError?: { message?: string };
};

export async function activateGalleryShareLink(
  id: string,
  input?: ActivateGalleryShareLinkInput,
): Promise<ActivateGalleryShareLinkResponse> {
  const body =
    input?.notifyClientViaSms || input?.message?.trim()
      ? {
          ...(input.notifyClientViaSms ? { notifyClientViaSms: true } : {}),
          ...(input.message?.trim() ? { message: input.message.trim() } : {}),
        }
      : undefined;

  return authedJson<ActivateGalleryShareLinkResponse>(
    `${galleryPath(id)}/share-link`,
    {
      method: "POST",
      ...(body ? { body: JSON.stringify(body) } : {}),
    },
    "Failed to activate share link",
    FoldersApiError,
  );
}

export async function revokeGalleryShareLink(
  id: string,
): Promise<{ message?: string; gallery: ApiGallery }> {
  return authedJson<{ message?: string; gallery: ApiGallery }>(
    `${galleryPath(id)}/share-link`,
    { method: "DELETE" },
    "Failed to revoke share link",
    FoldersApiError,
  );
}

export async function generateGalleryDescription(eventName: string): Promise<string> {
  const res = await authedJson<{ description?: string }>(
    "/api/galleries/generate-description",
    {
      method: "POST",
      body: JSON.stringify({ eventName: eventName.trim() }),
    },
    "Failed to generate description",
    FoldersApiError,
    { redirectOn401: false },
  );
  return res.description?.trim() ?? "";
}

export async function getGalleryAnalytics(id: string): Promise<GalleryAnalyticsApi> {
  const res = await authedJson<{ analytics: GalleryAnalyticsApi }>(
    `${galleryPath(id)}/analytics`,
    { method: "GET" },
    "Failed to load gallery analytics",
    FoldersApiError,
  );
  return res.analytics;
}
