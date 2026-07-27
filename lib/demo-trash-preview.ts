import { trashRestoreBefore } from "@/lib/galleries-api";
import { filterRestorableTrash, isRestoreDeadlinePassed } from "@/lib/folders/helpers";
import type { ApiFolder } from "@/lib/folders/types";
import type { ListFoldersTrashResponse, TrashFolderRow, TrashMediaRow } from "@/lib/folders/types";

const STORAGE_KEY = "gidostorage_trash_preview_hidden_v1";
const RETENTION_DAYS = 30;
const PREVIEW_PREFIX = "trash-preview-";

type HiddenState = {
  folderIds: string[];
  mediaKeys: string[];
};

function readHidden(): HiddenState {
  if (typeof window === "undefined") return { folderIds: [], mediaKeys: [] };
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { folderIds: [], mediaKeys: [] };
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return { folderIds: [], mediaKeys: [] };
    const o = parsed as Record<string, unknown>;
    return {
      folderIds: Array.isArray(o.folderIds) ? o.folderIds.filter((x): x is string => typeof x === "string") : [],
      mediaKeys: Array.isArray(o.mediaKeys) ? o.mediaKeys.filter((x): x is string => typeof x === "string") : [],
    };
  } catch {
    return { folderIds: [], mediaKeys: [] };
  }
}

function writeHidden(state: HiddenState) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function isTrashPreviewEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}

export function isTrashPreviewFolderId(folderId: string): boolean {
  return folderId.startsWith(PREVIEW_PREFIX);
}

export function isTrashPreviewMediaKey(key: string): boolean {
  return key.startsWith(`${PREVIEW_PREFIX}media:`);
}

export function trashPreviewMediaKey(folderId: string, mediaId: string): string {
  return `${folderId}:${mediaId}`;
}

export function hideTrashPreviewFolder(folderId: string) {
  const hidden = readHidden();
  if (hidden.folderIds.includes(folderId)) return;
  writeHidden({ ...hidden, folderIds: [...hidden.folderIds, folderId] });
}

export function hideTrashPreviewMedia(folderId: string, mediaId: string) {
  const key = trashPreviewMediaKey(folderId, mediaId);
  const hidden = readHidden();
  if (hidden.mediaKeys.includes(key)) return;
  writeHidden({ ...hidden, mediaKeys: [...hidden.mediaKeys, key] });
}

export function hideAllTrashPreview() {
  const preview = buildDemoTrashPreviewRows();
  writeHidden({
    folderIds: preview.folders.map((r) => r.folder._id),
    mediaKeys: preview.deletedMedia.map((m) => trashPreviewMediaKey(m.folderId, m.mediaId)),
  });
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString();
}

function previewFolder(input: {
  id: string;
  eventName: string;
  clientName: string;
  coverImageUrl: string;
  deletedDaysAgo: number;
}): TrashFolderRow {
  const deletedAt = daysAgoIso(input.deletedDaysAgo);
  const folder: ApiFolder = {
    _id: input.id,
    client: {
      _id: `${input.id}-client`,
      name: input.clientName,
      email: "",
      contact: "",
      location: "",
    },
    eventName: input.eventName,
    eventDate: "2026-03-15",
    description: "",
    coverImageUrl: input.coverImageUrl,
    coverFocalX: 50,
    coverFocalY: 50,
    usingDefaultCover: false,
    status: "draft",
    createdAt: daysAgoIso(input.deletedDaysAgo + 14),
    updatedAt: deletedAt,
    deletedAt,
    uploads: [],
    selection: [],
    finals: [],
  };
  return {
    folder,
    deletedAt,
    restoreBefore: trashRestoreBefore(deletedAt, RETENTION_DAYS),
  };
}

function previewMedia(input: {
  folderId: string;
  folder: ApiFolder;
  mediaId: string;
  kind: string;
  filename: string;
  thumbUrl: string;
  deletedDaysAgo: number;
}): TrashMediaRow {
  const deletedAt = daysAgoIso(input.deletedDaysAgo);
  return {
    folderId: input.folderId,
    folder: input.folder,
    mediaId: input.mediaId,
    kind: input.kind,
    deletedAt,
    restoreBefore: trashRestoreBefore(deletedAt, RETENTION_DAYS),
    thumbUrl: input.thumbUrl,
    url: input.thumbUrl,
    originalFilename: input.filename,
  };
}

function buildDemoTrashPreviewRows(): Pick<
  ListFoldersTrashResponse,
  "folders" | "deletedMedia" | "deletedMediaTotal" | "deletedMediaPreviewLimit" | "deletedMediaPagingHint"
> {
  const activeGalleryId = `${PREVIEW_PREFIX}folder-kwaku`;
  const activeGallery: ApiFolder = {
    _id: activeGalleryId,
    client: {
      _id: `${PREVIEW_PREFIX}client-kwaku`,
      name: "Amoa & Mensa",
      email: "amoa.mensa@client.gido",
      contact: "+233 24 000 0000",
      location: "Accra",
    },
    eventName: "Traditional wedding — day 2",
    eventDate: "2026-02-08",
    description: "",
    coverImageUrl: "/images/gallery-covers/Amoa-Mensa_0571-min.jpg",
    coverFocalX: 50,
    coverFocalY: 42,
    usingDefaultCover: false,
    status: "completed",
    createdAt: daysAgoIso(45),
    updatedAt: daysAgoIso(3),
    deletedAt: daysAgoIso(3),
    uploads: [],
    selection: [],
    finals: [],
  };

  const folders: TrashFolderRow[] = [
    previewFolder({
      id: activeGalleryId,
      eventName: "Traditional wedding — day 2",
      clientName: "Amoa & Mensa",
      coverImageUrl: "/images/gallery-covers/Amoa-Mensa_0571-min.jpg",
      deletedDaysAgo: 3,
    }),
    previewFolder({
      id: `${PREVIEW_PREFIX}folder-engagement`,
      eventName: "Engagement session",
      clientName: "Efua & Kojo",
      coverImageUrl: "/images/gallery-covers/IMG_5261.JPG",
      deletedDaysAgo: 11,
    }),
  ];

  const deletedMedia: TrashMediaRow[] = [
    previewMedia({
      folderId: activeGalleryId,
      folder: activeGallery,
      mediaId: `${PREVIEW_PREFIX}media-ceremony-001`,
      kind: "raw",
      filename: "ceremony_014.jpg",
      thumbUrl: "/images/gallery-covers/IMG_2185.JPG",
      deletedDaysAgo: 2,
    }),
    previewMedia({
      folderId: activeGalleryId,
      folder: activeGallery,
      mediaId: `${PREVIEW_PREFIX}media-ceremony-final`,
      kind: "final",
      filename: "ceremony_014_final.jpg",
      thumbUrl: "/images/gallery-covers/GIDO9970.JPG",
      deletedDaysAgo: 2,
    }),
    previewMedia({
      folderId: activeGalleryId,
      folder: activeGallery,
      mediaId: `${PREVIEW_PREFIX}media-reception`,
      kind: "upload",
      filename: "reception_toast_032.jpg",
      thumbUrl: "/images/gallery-covers/IMG_5566.JPG",
      deletedDaysAgo: 5,
    }),
    previewMedia({
      folderId: `${PREVIEW_PREFIX}folder-engagement`,
      folder: folders[1]!.folder,
      mediaId: `${PREVIEW_PREFIX}media-engagement-look`,
      kind: "original",
      filename: "engagement_look_03.jpg",
      thumbUrl: "/images/gallery-covers/website_3-min.jpg",
      deletedDaysAgo: 8,
    }),
  ];

  return {
    folders,
    deletedMedia,
    deletedMediaTotal: deletedMedia.length,
    deletedMediaPreviewLimit: deletedMedia.length,
  };
}

function discardExpiredPreviewItems(
  rows: Pick<ListFoldersTrashResponse, "folders" | "deletedMedia">,
): void {
  for (const row of rows.folders) {
    if (isRestoreDeadlinePassed(row.restoreBefore)) {
      hideTrashPreviewFolder(row.folder._id);
    }
  }
  for (const row of rows.deletedMedia) {
    if (isRestoreDeadlinePassed(row.restoreBefore)) {
      hideTrashPreviewMedia(row.folderId, row.mediaId);
    }
  }
}

export function buildDemoTrashPreview(): ListFoldersTrashResponse {
  const rows = buildDemoTrashPreviewRows();
  discardExpiredPreviewItems(rows);
  const hidden = readHidden();
  const folders = filterRestorableTrash(
    rows.folders.filter((r) => !hidden.folderIds.includes(r.folder._id)),
  );
  const deletedMedia = filterRestorableTrash(
    rows.deletedMedia.filter(
      (m) => !hidden.mediaKeys.includes(trashPreviewMediaKey(m.folderId, m.mediaId)),
    ),
  );

  return {
    retentionDays: RETENTION_DAYS,
    count: folders.length,
    folders,
    deletedMedia,
    deletedMediaTotal: deletedMedia.length,
    deletedMediaPreviewLimit: rows.deletedMediaPreviewLimit,
  };
}

export function mergeTrashWithDemoPreview(
  api: ListFoldersTrashResponse | null | undefined,
): ListFoldersTrashResponse {
  const safeApi: ListFoldersTrashResponse = api ?? {
    retentionDays: 30,
    count: 0,
    folders: [],
    deletedMedia: [],
    deletedMediaTotal: 0,
    deletedMediaPreviewLimit: 0,
  };

  if (!isTrashPreviewEnabled()) {
    const folders = filterRestorableTrash(safeApi.folders);
    const deletedMedia = filterRestorableTrash(safeApi.deletedMedia);
    return {
      ...safeApi,
      count: folders.length,
      folders,
      deletedMedia,
      deletedMediaTotal: deletedMedia.length,
    };
  }

  const preview = buildDemoTrashPreview();
  const folderIds = new Set(safeApi.folders.map((r) => r.folder._id));
  const mediaKeys = new Set(safeApi.deletedMedia.map((m) => trashPreviewMediaKey(m.folderId, m.mediaId)));

  const merged: ListFoldersTrashResponse = {
    retentionDays: safeApi.retentionDays || preview.retentionDays,
    count: 0,
    folders: filterRestorableTrash([
      ...safeApi.folders,
      ...preview.folders.filter((r) => !folderIds.has(r.folder._id)),
    ]),
    deletedMedia: filterRestorableTrash([
      ...safeApi.deletedMedia,
      ...preview.deletedMedia.filter(
        (m) => !mediaKeys.has(trashPreviewMediaKey(m.folderId, m.mediaId)),
      ),
    ]),
    deletedMediaTotal: 0,
    deletedMediaPreviewLimit: Math.max(
      safeApi.deletedMediaPreviewLimit,
      preview.deletedMediaPreviewLimit,
    ),
    deletedMediaPagingHint: safeApi.deletedMediaPagingHint,
  };
  merged.count = merged.folders.length;
  merged.deletedMediaTotal = merged.deletedMedia.length;
  return merged;
}
