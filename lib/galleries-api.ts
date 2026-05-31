import type { ApiClient } from "@/lib/clients-api";
import { authedJson } from "@/lib/http";
import type { ApiFolder, ApiFolderShare } from "@/lib/folders/types";
import { FoldersApiError } from "@/lib/folders/types";
import { normalizeGalleryCoverColor } from "@/lib/gallery-cover-color";
import { normalizeGalleryCoverFrame, type GalleryCoverFrame } from "@/lib/gallery-cover-frame";

export type ApiGalleryStats = {
  uploadCount?: number;
  selectionCount?: number;
  finalCount?: number;
};

export type ApiGallery = {
  id: string;
  owner?: string;
  clientId?: unknown;
  client?: {
    id?: unknown;
    name?: string;
    email?: string;
    contact?: string;
    location?: string;
  } | null;
  name: string;
  eventName?: string;
  eventDate: string;
  description?: string;
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
  coverColor?: string | null;
  shareCoverColor?: string | null;
  backgroundMusicUrl?: string | null;
  backgroundMusicEnabled?: boolean;
  maxSelections?: number | null;
  selectionSubmittedAt?: string | null;
  shareToken?: string | null;
  shareExpiresAt?: string | null;
  isShared?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  stats?: ApiGalleryStats;
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

export type CreateGalleryBody = {
  clientId: string;
  name: string;
  eventDate: string;
  description?: string;
  shareLinkExpiryDays?: number;
  useDefaultCover?: boolean;
  coverFrame?: GalleryCoverFrame;
  coverColor?: string;
  generateDescriptionAi?: boolean;
};

export type UpdateGalleryBody = {
  name?: string;
  eventDate?: string;
  description?: string;
  status?: string;
  shareLinkExpiryDays?: number;
  useDefaultCover?: boolean;
  coverFrame?: GalleryCoverFrame;
  coverColor?: string;
  generateDescriptionAi?: boolean;
};

const TRASH_RETENTION_DAYS = 30;

function isBrokenId(value: unknown): boolean {
  if (value == null) return true;
  const s = String(value).trim();
  return !s || s.includes("[object");
}

function resolveGalleryClientId(g: ApiGallery): string {
  if (!isBrokenId(g.clientId)) return String(g.clientId).trim();
  if (g.client && !isBrokenId(g.client.id)) return String(g.client.id).trim();
  return "";
}

function resolveGalleryClient(g: ApiGallery, clientNameById?: Map<string, string>): ApiClient {
  const id = resolveGalleryClientId(g);
  if (g.client && typeof g.client === "object" && g.client.name?.trim()) {
    return {
      _id: id || "unknown",
      name: g.client.name.trim(),
      email: g.client.email?.trim() ?? "",
      contact: g.client.contact?.trim() ?? "",
      location: g.client.location?.trim() ?? "",
    };
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
  const token = g.shareToken?.trim() || "";
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

  const cover = g.displayCoverUrl ?? g.coverImageUrl ?? undefined;
  const coverFrame = normalizeGalleryCoverFrame(g.coverFrame ?? g.shareCoverFrame);
  const coverColor = normalizeGalleryCoverColor(
    g.coverColor ?? g.shareCoverColor ?? undefined,
  );
  const shareCover =
    g.shareCoverImageUrl?.trim() ||
    (g.shareUseDefaultCover ? "(studio default at activation)" : undefined);
  const maxSelections = g.maxSelections;
  const selectionLimit =
    maxSelections == null || maxSelections === 0 ? null : Math.max(1, Math.floor(maxSelections));

  return {
    _id: g.id,
    client: resolveGalleryClient(g, clientNameById),
    eventName: g.eventName?.trim() || g.name?.trim() || "",
    eventDate: g.eventDate,
    description: g.description?.trim() ?? "",
    coverImageUrl: cover ?? undefined,
    coverFocalX: g.coverFocalX ?? 50,
    coverFocalY: g.coverFocalY ?? 50,
    coverFrame,
    coverColor,
    usingDefaultCover: g.useDefaultCover !== false,
    ...(shareCover ? { shareCoverImageUrl: shareCover } : {}),
    ...(g.shareUseDefaultCover !== undefined
      ? { shareUseDefaultCover: g.shareUseDefaultCover }
      : {}),
    ...(g.shareCoverFocalX != null ? { shareCoverFocalX: g.shareCoverFocalX } : {}),
    ...(g.shareCoverFocalY != null ? { shareCoverFocalY: g.shareCoverFocalY } : {}),
    ...(g.shareCoverFrame ? { shareCoverFrame: normalizeGalleryCoverFrame(g.shareCoverFrame) } : {}),
    backgroundMusicUrl: g.backgroundMusicUrl?.trim() || undefined,
    backgroundMusicEnabled: g.backgroundMusicEnabled,
    share: share
      ? {
          ...share,
          selectionLimit,
          selectionSubmittedAt: g.selectionSubmittedAt ?? share.selectionSubmittedAt ?? null,
        }
      : selectionLimit != null || g.selectionSubmittedAt
        ? {
            selectionLimit,
            selectionSubmittedAt: g.selectionSubmittedAt ?? null,
          }
        : undefined,
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

export async function listGalleries(params: {
  status?: string;
  trash?: boolean;
} = {}): Promise<ListGalleriesResponse> {
  const q = new URLSearchParams();
  if (params.trash) {
    q.set("trash", "1");
  } else {
    q.set("status", params.status?.trim() || "all");
  }

  const res = await authedJson<ListGalleriesResponse>(
    `/api/galleries?${q.toString()}`,
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
    galleries: res.galleries ?? [],
  };
}

export async function getGallery(id: string): Promise<ApiGallery> {
  return getGalleryDetail(id);
}

export async function getGalleryDetail(id: string): Promise<ApiGallery> {
  const res = await authedJson<{ gallery: ApiGallery }>(
    `${galleryPath(id)}/detail`,
    { method: "GET" },
    "Failed to load gallery",
    FoldersApiError,
  );
  return res.gallery;
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
    return authedJson<{ message?: string; gallery: ApiGallery }>(
      "/api/galleries",
      { method: "POST", body: form },
      "Failed to create gallery",
      FoldersApiError,
    );
  }
  return authedJson<{ message?: string; gallery: ApiGallery }>(
    "/api/galleries",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    "Failed to create gallery",
    FoldersApiError,
  );
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
    return authedJson<{ message?: string; gallery: ApiGallery }>(
      galleryPath(id),
      { method: "PUT", body: form },
      "Failed to update gallery",
      FoldersApiError,
    );
  }
  return authedJson<{ message?: string; gallery: ApiGallery }>(
    galleryPath(id),
    {
      method: "PUT",
      body: JSON.stringify(body),
    },
    "Failed to update gallery",
    FoldersApiError,
  );
}

export async function deleteGallery(id: string): Promise<{ message?: string; gallery: ApiGallery }> {
  return authedJson<{ message?: string; gallery: ApiGallery }>(
    galleryPath(id),
    { method: "DELETE" },
    "Failed to delete gallery",
    FoldersApiError,
  );
}

export async function restoreGallery(id: string): Promise<{ message?: string; gallery: ApiGallery }> {
  return authedJson<{ message?: string; gallery: ApiGallery }>(
    `${galleryPath(id)}/restore`,
    { method: "PATCH" },
    "Failed to restore gallery",
    FoldersApiError,
  );
}

export async function completeGallery(id: string): Promise<{ message?: string; gallery: ApiGallery }> {
  return authedJson<{ message?: string; gallery: ApiGallery }>(
    `${galleryPath(id)}/complete`,
    { method: "PATCH" },
    "Failed to mark gallery completed",
    FoldersApiError,
  );
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

export async function updateGallerySelectionSettings(
  id: string,
  body: { maxSelections: number | null },
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

export async function activateGalleryShareLink(
  id: string,
): Promise<{ message?: string; gallery: ApiGallery }> {
  return authedJson<{ message?: string; gallery: ApiGallery }>(
    `${galleryPath(id)}/share-link`,
    { method: "POST" },
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
