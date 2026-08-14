import {
  mapGalleryToApiFolder,
  type ApiGallery,
} from "@/lib/galleries-api";
import { loadClientNameById } from "@/lib/clients-api";
import { filterRestorableTrash } from "@/lib/folders/helpers";
import {
  FoldersApiError,
  type ApiFolder,
  type ListFoldersTrashResponse,
  type TrashFolderRow,
  type TrashMediaRow,
  type TrashPurgeResult,
} from "@/lib/folders/types";
import { authedJson, extractMessage } from "@/lib/http";
import { sameOriginUploadsUrl } from "@/lib/api";

export type ApiTrashPhoto = {
  id: string;
  galleryId: string;
  originalFilename?: string;
  url?: string;
  mimeType?: string;
  type?: "original" | "final" | string;
  galleryName?: string | null;
  deletedAt?: string | null;
  restoreDeadline?: string | null;
  restoreExpired?: boolean;
};

export type ApiTrashGallery = ApiGallery & {
  restoreDeadline?: string | null;
  restoreExpired?: boolean;
};

export type ListTrashApiResponse = {
  retentionDays?: number;
  restoreAvailable?: boolean;
  counts?: {
    galleries?: number;
    photos?: number;
  };
  galleries?: ApiTrashGallery[];
  photos?: ApiTrashPhoto[];
};

export type RestoreTrashPayload = {
  galleryIds?: string[];
  photoIds?: string[];
};

export type RestoreTrashApiResponse = {
  message?: string;
  restored?: {
    galleries?: number;
    photos?: number;
  };
  expired?: {
    galleries?: number;
    photos?: number;
  };
};

export type EmptyTrashPayload = {
  galleryIds?: string[];
  photoIds?: string[];
};

export type EmptyTrashApiResponse = {
  message?: string;
  deleted?: {
    galleries?: number;
    photos?: number;
  };
};

function strId(value: unknown): string {
  if (value == null) return "";
  const s = String(value).trim();
  return s.includes("[object") ? "" : s;
}

function isoOrNow(value: string | null | undefined): string {
  if (value?.trim()) return value;
  return new Date().toISOString();
}

function restoreBeforeFromRow(row: {
  restoreDeadline?: string | null;
  restoreBefore?: string | null;
  deletedAt?: string | null;
}, retentionDays: number): string {
  const explicit = row.restoreDeadline ?? row.restoreBefore;
  if (explicit?.trim()) return explicit;
  const deletedAt = isoOrNow(row.deletedAt ?? undefined);
  const d = new Date(deletedAt);
  if (Number.isNaN(d.getTime())) {
    return new Date(Date.now() + retentionDays * 86400000).toISOString();
  }
  d.setDate(d.getDate() + retentionDays);
  return d.toISOString();
}

function minimalFolderForTrashPhoto(photo: ApiTrashPhoto): ApiFolder {
  const galleryId = strId(photo.galleryId);
  const title = photo.galleryName?.trim() || `Gallery ${galleryId.slice(-6)}`;
  return {
    _id: galleryId,
    client: {
      _id: `trash-gallery-${galleryId}`,
      name: title,
      email: "",
      contact: "",
      location: "",
    },
    eventName: title,
    eventDate: "",
    description: "",
    usingDefaultCover: true,
    uploads: [],
    selection: [],
    finals: [],
  };
}

function mapTrashPhotoToMediaRow(photo: ApiTrashPhoto, retentionDays: number): TrashMediaRow {
  const galleryId = strId(photo.galleryId);
  const mediaId = strId(photo.id);
  const deletedAt = isoOrNow(photo.deletedAt ?? undefined);
  const url = photo.url?.trim() ? sameOriginUploadsUrl(photo.url.trim()) : undefined;
  const kind = photo.type === "final" ? "final" : "raw";

  return {
    folderId: galleryId,
    folder: minimalFolderForTrashPhoto(photo),
    mediaId,
    kind,
    deletedAt,
    restoreBefore: restoreBeforeFromRow(photo, retentionDays),
    url,
    thumbUrl: url,
    originalFilename: photo.originalFilename?.trim() || mediaId,
  };
}

export function mapListTrashApiResponse(
  body: ListTrashApiResponse | null | undefined,
  clientNameById?: Map<string, string>,
): ListFoldersTrashResponse {
  const safeBody = body && typeof body === "object" ? body : {};
  const retentionDays =
    typeof safeBody.retentionDays === "number" && safeBody.retentionDays > 0
      ? safeBody.retentionDays
      : 30;

  const folders: TrashFolderRow[] = (safeBody.galleries ?? [])
    .map((g) => {
      const id = strId(g.id);
      if (!id) return null;
      const deletedAt = isoOrNow(g.deletedAt ?? undefined);
      return {
        folder: mapGalleryToApiFolder({ ...g, id }, clientNameById),
        deletedAt,
        restoreBefore: restoreBeforeFromRow(g, retentionDays),
      };
    })
    .filter((row): row is TrashFolderRow => row != null);

  const deletedMedia: TrashMediaRow[] = (safeBody.photos ?? [])
    .map((p) => mapTrashPhotoToMediaRow({ ...p, id: strId(p.id), galleryId: strId(p.galleryId) }, retentionDays))
    .filter((row) => row.folderId && row.mediaId);

  const restorableFolders = filterRestorableTrash(folders);
  const restorableMedia = filterRestorableTrash(deletedMedia);

  return {
    retentionDays,
    count: restorableFolders.length,
    folders: restorableFolders,
    deletedMedia: restorableMedia,
    deletedMediaTotal: restorableMedia.length,
    deletedMediaPreviewLimit: restorableMedia.length,
    restoreAvailable: safeBody.restoreAvailable !== false,
  };
}

export async function listTrash(): Promise<ListFoldersTrashResponse> {
  const [body, clientNameById] = await Promise.all([
    authedJson<ListTrashApiResponse>(
      "/api/trash",
      { method: "GET" },
      "Failed to load trash",
      FoldersApiError,
    ),
    loadClientNameById(),
  ]);
  return mapListTrashApiResponse(body, clientNameById);
}

export async function restoreTrashItems(
  payload: RestoreTrashPayload,
): Promise<RestoreTrashApiResponse> {
  const galleryIds = (payload.galleryIds ?? []).filter(Boolean);
  const photoIds = (payload.photoIds ?? []).filter(Boolean);
  if (!galleryIds.length && !photoIds.length) {
    throw new FoldersApiError("Nothing selected to restore.", 400, null);
  }

  return authedJson<RestoreTrashApiResponse>(
    "/api/trash/restore",
    {
      method: "POST",
      body: JSON.stringify({ galleryIds, photoIds }),
    },
    "Failed to restore trash items",
    FoldersApiError,
  );
}

export async function emptyTrash(payload: EmptyTrashPayload = {}): Promise<EmptyTrashApiResponse> {
  const galleryIds = (payload.galleryIds ?? []).filter(Boolean);
  const photoIds = (payload.photoIds ?? []).filter(Boolean);
  const selective = galleryIds.length > 0 || photoIds.length > 0;

  return authedJson<EmptyTrashApiResponse>(
    "/api/trash",
    selective
      ? {
          method: "DELETE",
          body: JSON.stringify({ galleryIds, photoIds }),
        }
      : { method: "DELETE" },
    selective ? "Failed to delete selected trash items" : "Failed to empty trash",
    FoldersApiError,
  );
}

export function mapEmptyTrashToPurgeResult(body: EmptyTrashApiResponse): TrashPurgeResult {
  return {
    message: extractMessage(body, "Trash updated."),
    purgedFolderCount: body.deleted?.galleries ?? 0,
    purgedMediaCount: body.deleted?.photos ?? 0,
  };
}
