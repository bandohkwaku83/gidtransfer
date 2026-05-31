import {
  bulkDeleteGalleryFinals,
  bulkDeleteGalleryUploads,
  deleteGalleryFinal,
  deleteGalleryUpload,
  fetchGalleryMedia,
  listGalleryFinals,
  listGalleryUploads,
  patchGalleryFinalReply,
  patchGalleryFinalsLock,
  patchGallerySelectionReply,
  uploadGalleryFinals,
  uploadGalleryPhotos,
} from "@/lib/gallery-media-api";
import {
  activateGalleryShareLink,
  completeGallery,
  createGallery,
  deleteGallery,
  deleteGalleryBackgroundMusic,
  getGalleryDetail,
  listGalleries,
  mapGalleryToApiFolder,
  restoreGallery,
  revokeGalleryShareLink,
  shareLinkExpiryPresetToDays,
  toggleGalleryBackgroundMusic,
  trashRestoreBefore,
  uiStatusToGalleryStatus,
  updateGallery,
  updateGalleryCoverFocalPoint,
  updateGallerySelectionSettings,
  uploadGalleryBackgroundMusic,
} from "@/lib/galleries-api";
import {
  getDemoFolderApiModel,
} from "@/lib/demo-api-bridge";
import {
  createDemoGallerySet,
  deleteDemoGallerySet,
  getFolderOverride,
  listDemoGallerySets,
  loadProjectById,
  patchFolderOverride,
  purgeFolderFromTrashDemo,
  saveProjectSnapshot,
  updateDemoGallerySet,
} from "@/lib/demo-data";
import {
  createGallerySet,
  deleteGallerySet,
  listGallerySets,
  updateGallerySet,
} from "@/lib/gallery-sets-api";
import { normalizeGalleryCoverColor } from "@/lib/gallery-cover-color";
import { normalizeGalleryCoverFrame } from "@/lib/gallery-cover-frame";
import {
  incomingFilenamesConflictingWithFolder,
  isLocalDemoFolderId,
  type FolderMediaDuplicatePreviewKind,
} from "@/lib/folders/helpers";
import {
  assertCanCreateGallery,
  assertStorageAllowsDemoFinalAdds,
  assertStorageAllowsDemoRawAdds,
} from "@/lib/subscription-plan";
import {
  type ApiFolder,
  type BulkMediaSoftDeleteResult,
  type CreateFolderInput,
  type DuplicateUploadAction,
  FoldersApiError,
  type FolderMoveToTrashResult,
  type ListFoldersTrashResponse,
  type ListFoldersMediaTrashParams,
  type ListFoldersMediaTrashResponse,
  type MediaSoftDeleteResult,
  type PurgeFoldersTrashPayload,
  type TrashFolderRow,
  type TrashMediaRow,
  type TrashPurgeResult,
  type UpdateFolderInput,
} from "@/lib/folders/types";

export * from "@/lib/folders/types";
export * from "@/lib/folders/helpers";
export { generateGalleryDescription, type GalleryListCounts } from "@/lib/galleries-api";

async function delay(ms = 35) {
  await new Promise((r) => setTimeout(r, ms));
}

function softDeleteMeta(): { deletedAt: string; restoreBefore: string } {
  const deletedAt = new Date().toISOString();
  const restoreBefore = new Date(Date.now() + 30 * 86400000).toISOString();
  return { deletedAt, restoreBefore };
}

function emptyTrashMediaResult(restoreBefore: string): BulkMediaSoftDeleteResult {
  return {
    message: "Items moved to trash.",
    deletedCount: 0,
    restoreBefore,
  };
}

function applyFolderPresentationOverride(folder: ApiFolder): ApiFolder {
  const override = getFolderOverride(folder._id);
  if (!override?.coverFrame && !override?.coverColor) return folder;
  return {
    ...folder,
    ...(override?.coverFrame
      ? { coverFrame: normalizeGalleryCoverFrame(override.coverFrame) }
      : {}),
    ...(override?.coverColor
      ? { coverColor: normalizeGalleryCoverColor(override.coverColor) }
      : {}),
  };
}

export type ShareLinkExpiryPreset = {
  id: string;
  label: string;
  days?: number | null;
};

export const FALLBACK_SHARE_EXPIRY_PRESETS: ShareLinkExpiryPreset[] = [
  { id: "never", label: "Never", days: null },
  { id: "7d", label: "7 days", days: 7 },
  { id: "14d", label: "14 days", days: 14 },
  { id: "30d", label: "30 days", days: 30 },
  { id: "60d", label: "60 days", days: 60 },
  { id: "90d", label: "90 days", days: 90 },
  { id: "180d", label: "180 days", days: 180 },
  { id: "365d", label: "1 year", days: 365 },
];

export async function listFoldersTrash(options: {
  mediaLimit?: number;
} = {}): Promise<ListFoldersTrashResponse> {
  void options;
  const res = await listGalleries({ trash: true });
  const retentionDays = 30;
  return {
    retentionDays,
    count: res.galleries.length,
    folders: res.galleries.map((g) => {
      const folder = mapGalleryToApiFolder(g);
      const deletedAt = g.deletedAt ?? new Date().toISOString();
      return {
        folder,
        deletedAt,
        restoreBefore: trashRestoreBefore(deletedAt, retentionDays),
      };
    }),
    deletedMedia: [] as TrashMediaRow[],
    deletedMediaTotal: 0,
    deletedMediaPreviewLimit: 0,
  };
}

export async function listFoldersMediaTrash(
  _params: ListFoldersMediaTrashParams = {},
): Promise<ListFoldersMediaTrashResponse> {
  await delay();
  return { items: [], total: 0, page: 1, limit: _params.limit ?? 50 };
}

export async function restoreFolderFromTrash(folderId: string): Promise<ApiFolder> {
  const { gallery } = await restoreGallery(folderId);
  return mapGalleryToApiFolder(gallery);
}

export async function restoreFolderTrashedMedia(
  _folderId: string,
  _mediaId: string,
): Promise<{ message: string; kind: string; mediaId: string }> {
  await delay();
  return { message: "Media restored", kind: "raw", mediaId: _mediaId };
}

export async function purgeFoldersTrash(payload: PurgeFoldersTrashPayload): Promise<TrashPurgeResult> {
  await delay();
  if ("all" in payload && payload.all) {
    const res = await listGalleries({ trash: true });
    for (const g of res.galleries) {
      purgeFolderFromTrashDemo(g.id);
    }
    return { message: "Trash emptied.", purgedFolderCount: res.galleries.length, purgedMediaCount: 0 };
  }
  if ("purgeAll" in payload && payload.purgeAll) {
    const res = await listGalleries({ trash: true });
    for (const g of res.galleries) {
      purgeFolderFromTrashDemo(g.id);
    }
    return { message: "Trash emptied.", purgedFolderCount: res.galleries.length, purgedMediaCount: 0 };
  }
  const sel = payload as { folderIds?: string[]; mediaIds?: string[] };
  let fc = 0;
  for (const id of sel.folderIds ?? []) {
    purgeFolderFromTrashDemo(id);
    fc += 1;
  }
  void sel.mediaIds;
  return {
    message: "Trash purge completed.",
    purgedFolderCount: fc,
    purgedMediaCount: 0,
  };
}

export async function listFolders(params: {
  clientId?: string;
  search?: string;
  status?: string;
} = {}): Promise<ApiFolder[]> {
  const res = await listGalleries({ status: params.status ?? "all" });
  let folders = res.galleries.map((g) => applyFolderPresentationOverride(mapGalleryToApiFolder(g)));
  if (params.clientId?.trim()) {
    const id = params.clientId.trim();
    folders = folders.filter((f) => {
      const c = f.client;
      return (typeof c === "string" ? c : c._id) === id;
    });
  }
  if (params.search?.trim()) {
    const q = params.search.trim().toLowerCase();
    folders = folders.filter((f) => {
      const title = (f.eventName ?? "").toLowerCase();
      const desc = (f.description ?? "").toLowerCase();
      const clientName = typeof f.client === "object" ? (f.client.name ?? "").toLowerCase() : "";
      return title.includes(q) || desc.includes(q) || clientName.includes(q);
    });
  }
  return folders;
}

export type ListFoldersWithCountsResult = {
  folders: ApiFolder[];
  counts: import("@/lib/galleries-api").GalleryListCounts;
};

export async function listFoldersWithCounts(params: {
  clientId?: string;
  search?: string;
  status?: string;
} = {}): Promise<ListFoldersWithCountsResult> {
  const res = await listGalleries({ status: params.status ?? "all" });
  let folders = res.galleries.map((g) => mapGalleryToApiFolder(g));
  if (params.clientId?.trim()) {
    const id = params.clientId.trim();
    folders = folders.filter((f) => {
      const c = f.client;
      return (typeof c === "string" ? c : c._id) === id;
    });
  }
  if (params.search?.trim()) {
    const q = params.search.trim().toLowerCase();
    folders = folders.filter((f) => {
      const title = (f.eventName ?? "").toLowerCase();
      const desc = (f.description ?? "").toLowerCase();
      const clientName = typeof f.client === "object" ? (f.client.name ?? "").toLowerCase() : "";
      return title.includes(q) || desc.includes(q) || clientName.includes(q);
    });
  }
  return { folders, counts: res.counts };
}

export async function getFolder(id: string): Promise<ApiFolder> {
  try {
    const [gallery, media, sets] = await Promise.all([
      getGalleryDetail(id),
      fetchGalleryMedia(id),
      listGallerySets(id).catch(() => []),
    ]);
    return applyFolderPresentationOverride({
      ...mapGalleryToApiFolder(gallery),
      uploads: media.uploads,
      selection: media.selection,
      finals: media.finals,
      flaggedFinals: media.flaggedFinals,
      sets,
    });
  } catch (e) {
    if (e instanceof FoldersApiError && e.status === 404) {
      const demo = getDemoFolderApiModel(id);
      if (demo) return demo;
    }
    throw e;
  }
}

export async function listFolderGallerySets(folderId: string) {
  if (isLocalDemoFolderId(folderId)) {
    return listDemoGallerySets(folderId);
  }
  return listGallerySets(folderId);
}

export async function createFolderGallerySet(folderId: string, name: string) {
  if (isLocalDemoFolderId(folderId)) {
    return createDemoGallerySet(folderId, name);
  }
  return createGallerySet(folderId, name);
}

export async function updateFolderGallerySet(
  folderId: string,
  setId: string,
  patch: { name?: string; sortOrder?: number },
) {
  if (isLocalDemoFolderId(folderId)) {
    return updateDemoGallerySet(folderId, setId, patch);
  }
  return updateGallerySet(folderId, setId, patch);
}

export async function deleteFolderGallerySet(folderId: string, setId: string) {
  if (isLocalDemoFolderId(folderId)) {
    deleteDemoGallerySet(folderId, setId);
    return;
  }
  await deleteGallerySet(folderId, setId);
}

export async function createFolder(input: CreateFolderInput): Promise<ApiFolder> {
  assertCanCreateGallery();

  const coverFile = input.coverImage instanceof File ? input.coverImage : null;
  const { gallery } = await createGallery(
    {
      clientId: input.clientId,
      name: input.eventName.trim(),
      eventDate: input.eventDate,
      description: input.description.trim(),
      shareLinkExpiryDays: shareLinkExpiryPresetToDays(input.linkExpiry),
      useDefaultCover: coverFile ? false : (input.useDefaultCover ?? true),
      generateDescriptionAi: false,
    },
    { coverFile },
  );

  let result = gallery;
  const focalX = input.coverFocalX;
  const focalY = input.coverFocalY;
  if (
    focalX != null &&
    focalY != null &&
    (focalX !== 50 || focalY !== 50)
  ) {
    const { gallery: withFocal } = await updateGalleryCoverFocalPoint(gallery.id, {
      coverFocalX: focalX,
      coverFocalY: focalY,
    });
    result = withFocal;
  }

  return mapGalleryToApiFolder(result);
}

export async function updateFolder(id: string, input: UpdateFolderInput): Promise<ApiFolder> {
  const body: import("@/lib/galleries-api").UpdateGalleryBody = {};
  if (input.eventName !== undefined) body.name = input.eventName.trim();
  if (input.eventDate !== undefined) body.eventDate = input.eventDate.slice(0, 10);
  if (input.description !== undefined) body.description = input.description.trim();
  if (input.coverFrame !== undefined) body.coverFrame = normalizeGalleryCoverFrame(input.coverFrame);
  if (input.coverColor !== undefined) {
    body.coverColor = input.coverColor;
  }

  const coverFile = input.coverImage instanceof File ? input.coverImage : null;
  if (coverFile) {
    body.useDefaultCover = false;
  } else if (input.useDefaultCover !== undefined) {
    body.useDefaultCover = input.useDefaultCover;
  }

  const hasPutFields = Object.keys(body).length > 0 || Boolean(coverFile);
  const hasFocal =
    input.coverFocalX !== undefined && input.coverFocalY !== undefined;
  const hasMusicToggle = input.backgroundMusicEnabled !== undefined;

  if (!hasPutFields && !hasFocal && !hasMusicToggle) {
    return getFolder(id);
  }

  let gallery: import("@/lib/galleries-api").ApiGallery | undefined;

  if (hasPutFields) {
    ({ gallery } = await updateGallery(id, body, { coverFile }));
  }

  if (hasFocal) {
    ({ gallery } = await updateGalleryCoverFocalPoint(id, {
      coverFocalX: input.coverFocalX!,
      coverFocalY: input.coverFocalY!,
    }));
  }

  if (hasMusicToggle) {
    ({ gallery } = await toggleGalleryBackgroundMusic(id, input.backgroundMusicEnabled!));
  }

  if (!gallery) {
    return getFolder(id);
  }

  if (input.coverFrame !== undefined || input.coverColor !== undefined) {
    patchFolderOverride(id, {
      ...(input.coverFrame !== undefined
        ? { coverFrame: normalizeGalleryCoverFrame(input.coverFrame) }
        : {}),
      ...(input.coverColor !== undefined ? { coverColor: input.coverColor } : {}),
    });
  }

  return {
    ...mapGalleryToApiFolder(gallery),
    ...(input.coverFrame !== undefined
      ? { coverFrame: normalizeGalleryCoverFrame(input.coverFrame) }
      : {}),
    ...(input.coverColor !== undefined ? { coverColor: input.coverColor } : {}),
  };
}

export async function deleteFolder(id: string): Promise<FolderMoveToTrashResult> {
  const { message, gallery } = await deleteGallery(id);
  const folder = mapGalleryToApiFolder(gallery);
  const deletedAt = gallery.deletedAt ?? new Date().toISOString();
  const retentionDays = 30;
  return {
    message: message ?? "Gallery moved to trash.",
    deletedAt,
    restoreBefore: trashRestoreBefore(deletedAt, retentionDays),
    retentionDays,
    folder,
  };
}

export async function uploadFolderBackgroundMusic(folderId: string, file: File): Promise<ApiFolder> {
  const { gallery } = await uploadGalleryBackgroundMusic(folderId, file);
  return mapGalleryToApiFolder(gallery);
}

export async function deleteFolderBackgroundMusic(folderId: string): Promise<ApiFolder> {
  const { gallery } = await deleteGalleryBackgroundMusic(folderId);
  return mapGalleryToApiFolder(gallery);
}

export async function getShareLinkExpiryPresets(): Promise<ShareLinkExpiryPreset[]> {
  await delay();
  return [...FALLBACK_SHARE_EXPIRY_PRESETS];
}

export async function patchFolderShare(
  folderId: string,
  input: {
    selectionLocked?: boolean;
    selectionLimit?: number | null;
    clearSelectionSubmit?: boolean;
  },
): Promise<ApiFolder> {
  if (input.selectionLimit !== undefined) {
    const n = input.selectionLimit;
    const maxSelections = n == null || n === 0 ? null : Math.max(1, Math.floor(n));
    const { gallery } = await updateGallerySelectionSettings(folderId, { maxSelections });
    return mapGalleryToApiFolder(gallery);
  }

  // Selection lock / clear-submit not yet on gallery API — keep demo fallback.
  await delay();
  if (input.selectionLocked !== undefined) {
    patchFolderOverride(folderId, { selectionLocked: input.selectionLocked });
  }
  if (input.clearSelectionSubmit) {
    const p = loadProjectById(folderId);
    if (p) {
      saveProjectSnapshot({ ...p, selectionSubmitted: false });
    }
  }
  const f = getDemoFolderApiModel(folderId);
  if (!f) throw new FoldersApiError("Gallery not found.", 404, null);
  return f;
}

export async function postFolderMediaDuplicatePreview(
  folderId: string,
  input: { kind: FolderMediaDuplicatePreviewKind; filenames: string[] },
): Promise<{ hasConflicts: boolean; conflictingFilenames?: string[] }> {
  const rows =
    input.kind === "raw"
      ? await listGalleryUploads(folderId)
      : await listGalleryFinals(folderId);
  const folder: ApiFolder = {
    _id: folderId,
    client: "unknown",
    eventDate: "",
    description: "",
    uploads: input.kind === "raw" ? rows : [],
    finals: input.kind === "final" ? rows : [],
  };
  const names = incomingFilenamesConflictingWithFolder(input.kind, input.filenames, folder);
  return names.length ? { hasConflicts: true, conflictingFilenames: names } : { hasConflicts: false };
}

export async function regenerateFolderShare(
  folderId: string,
  input: { clearSlug?: boolean; linkExpiry?: string },
): Promise<ApiFolder> {
  void input.clearSlug;
  void input.linkExpiry;
  const { gallery } = await activateGalleryShareLink(folderId);
  return mapGalleryToApiFolder(gallery);
}

export async function revokeFolderShare(folderId: string): Promise<ApiFolder> {
  const { gallery } = await revokeGalleryShareLink(folderId);
  return mapGalleryToApiFolder(gallery);
}

export type UploadFolderMediaFormOptions = {
  duplicateAction?: DuplicateUploadAction;
  markUploadComplete?: boolean;
  /** Target gallery set id; omit to leave set unchanged on replace. */
  setId?: string | null;
};

export type FinalDeliveryUploadFields = {
  clientHasPaidForFinals: boolean;
  amountRemainingGHS?: string;
  lockImagesBeforeUpload?: boolean;
};

export type UploadFolderFinalMediaFormOptions = UploadFolderMediaFormOptions &
  Partial<FinalDeliveryUploadFields> & {
    selectionMediaId?: string;
  };

export type UploadFolderMediaResult = {
  lastBody: unknown;
  ignoredDuplicatesCount: number;
};

export type FolderMediaBatchProgress = {
  fileIndex: number;
  fileCount: number;
};

export async function uploadFolderRawMedia(
  folderId: string,
  files: File[],
  onProgress?: (
    loaded: number,
    total: number,
    lengthComputable: boolean,
    batch?: FolderMediaBatchProgress,
  ) => void,
  formOptions?: UploadFolderMediaFormOptions,
): Promise<UploadFolderMediaResult | null> {
  if (files.length === 0) return null;
  if (isLocalDemoFolderId(folderId)) {
    assertStorageAllowsDemoRawAdds(files.length);
  }

  const result = await uploadGalleryPhotos(folderId, files, {
    onConflict: formOptions?.duplicateAction,
    setId: formOptions?.setId,
    onProgress: (loaded, total, lengthComputable, batch) => {
      onProgress?.(loaded, total, lengthComputable, batch);
    },
  });

  return {
    lastBody: result,
    ignoredDuplicatesCount: result.ignoredDuplicatesCount,
  };
}

export async function uploadFolderFinalMedia(
  folderId: string,
  files: File[],
  onProgress?: (
    loaded: number,
    total: number,
    lengthComputable: boolean,
    batch?: FolderMediaBatchProgress,
  ) => void,
  formOptions?: UploadFolderFinalMediaFormOptions,
): Promise<UploadFolderMediaResult | null> {
  if (files.length === 0) return null;
  if (isLocalDemoFolderId(folderId)) {
    assertStorageAllowsDemoFinalAdds(files.length);
  }

  const clientPaid = formOptions?.clientHasPaidForFinals !== false;
  const result = await uploadGalleryFinals(folderId, files, {
    clientPaid,
    outstandingBalanceGhs: formOptions?.amountRemainingGHS,
    lockPreviews: formOptions?.lockImagesBeforeUpload,
    setId: formOptions?.setId,
    onProgress: (loaded, total, lengthComputable, batch) => {
      onProgress?.(loaded, total, lengthComputable, batch);
    },
  });

  return {
    lastBody: result,
    ignoredDuplicatesCount: result.ignoredDuplicatesCount,
  };
}

export async function lockFolderFinalDelivery(
  folderId: string,
  input: { outstandingAmountGHS: number },
): Promise<ApiFolder> {
  await patchGalleryFinalsLock(folderId, {
    isLocked: true,
    clientPaid: false,
    outstandingBalanceGhs: input.outstandingAmountGHS,
  });
  return getFolder(folderId);
}

export async function unlockFolderFinalDelivery(folderId: string): Promise<ApiFolder> {
  await patchGalleryFinalsLock(folderId, {
    isLocked: false,
    clientPaid: true,
    outstandingBalanceGhs: 0,
  });
  return getFolder(folderId);
}

export async function deleteFolderRawMedia(
  folderId: string,
  mediaId: string,
): Promise<MediaSoftDeleteResult> {
  const result = await deleteGalleryUpload(folderId, mediaId);
  return {
    message: result.message,
    deleted: { _id: mediaId, kind: "raw" },
    restoreBefore: result.restoreBefore,
  };
}

export async function deleteFolderFinalMedia(
  folderId: string,
  mediaId: string,
): Promise<MediaSoftDeleteResult> {
  const result = await deleteGalleryFinal(folderId, mediaId);
  return {
    message: result.message,
    deleted: { _id: mediaId, kind: "final" },
    restoreBefore: result.restoreBefore,
  };
}

export async function deleteAllFolderRawMedia(folderId: string): Promise<BulkMediaSoftDeleteResult> {
  const uploads = await listGalleryUploads(folderId);
  if (uploads.length === 0) {
    return emptyTrashMediaResult(new Date(Date.now() + 30 * 86400000).toISOString());
  }
  const photoIds = uploads
    .map((m) => m._id || m.id)
    .filter((id): id is string => Boolean(id));
  const result = await bulkDeleteGalleryUploads(folderId, { photoIds });
  return {
    message: result.message,
    deletedCount: result.deletedCount,
    restoreBefore: result.restoreBefore,
  };
}

export async function deleteAllFolderFinalMedia(folderId: string): Promise<BulkMediaSoftDeleteResult> {
  const result = await bulkDeleteGalleryFinals(folderId, { all: true });
  return {
    message: result.message,
    deletedCount: result.deletedCount,
    restoreBefore: result.restoreBefore,
  };
}

export async function patchFolderStatus(folderId: string, status: string): Promise<ApiFolder> {
  const normalized = uiStatusToGalleryStatus(status);
  if (normalized === "done") {
    const { gallery } = await completeGallery(folderId);
    return mapGalleryToApiFolder(gallery);
  }
  const { gallery } = await updateGallery(folderId, { status: normalized });
  return mapGalleryToApiFolder(gallery);
}

export async function patchFolderSelectionFeedbackReply(
  folderId: string,
  photoId: string,
  reply: string,
): Promise<void> {
  if (isLocalDemoFolderId(folderId)) {
    const project = loadProjectById(folderId);
    if (!project) {
      throw new FoldersApiError("Gallery not found", 404, null);
    }
    const assets = project.assets.map((asset) =>
      asset.id === photoId ? { ...asset, photographerReply: reply } : asset,
    );
    saveProjectSnapshot({ ...project, assets });
    return;
  }
  await patchGallerySelectionReply(folderId, photoId, reply);
}

export async function patchFolderFinalFeedbackReply(
  folderId: string,
  finalId: string,
  reply: string,
): Promise<void> {
  if (isLocalDemoFolderId(folderId)) {
    patchFolderOverride(folderId, {
      feedbackReplies: {
        ...(getFolderOverride(folderId)?.feedbackReplies ?? {}),
        [`fin:${finalId}`]: reply,
      },
    });
    return;
  }
  await patchGalleryFinalReply(folderId, finalId, reply);
}
