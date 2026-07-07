import {
  bulkDeleteGalleryFinals,
  bulkDeleteGalleryUploads,
  deleteGalleryFinal,
  deleteGalleryUpload,
  fetchGalleryMedia,
  listAllGalleryUploads,
  listGalleryFinals,
  patchGalleryFinalReply,
  patchGalleryFinalLock,
  patchGalleryFinalsLock,
  patchGallerySelectionReply,
  reorderGalleryFinals,
  reorderGalleryUploads,
  uploadGalleryFinals,
  uploadGalleryPhotos,
  galleryPhotoToApiFolderMedia,
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
  revokeGalleryShareLink,
  shareLinkExpiryPresetToDays,
  toggleGalleryBackgroundMusic,
  trashRestoreBefore,
  uiStatusToGalleryStatus,
  updateGallery,
  updateGalleryClientAccess,
  updateGalleryCoverFocalPoint,
  updateGalleryDesignSettings,
  galleryDesignInputToApiBody,
  updateGallerySelectionSettings,
  updateGalleryUploadSettings,
  updateGalleryFinalSettings,
  uploadGalleryBackgroundMusic,
} from "@/lib/galleries-api";
import {
  emptyTrash,
  listTrash,
  mapEmptyTrashToPurgeResult,
  restoreTrashItems,
} from "@/lib/trash-api";
import {
  getDemoFolderApiModel,
} from "@/lib/demo-api-bridge";
import {
  buildDemoTrashPreview,
  hideAllTrashPreview,
  hideTrashPreviewFolder,
  hideTrashPreviewMedia,
  isTrashPreviewFolderId,
  mergeTrashWithDemoPreview,
} from "@/lib/demo-trash-preview";
import {
  createDemoGallerySet,
  deleteDemoGallerySet,
  getFolderOverride,
  listDemoGallerySets,
  loadProjectById,
  patchFolderOverride,
  patchDemoSetsBarSettings,
  reorderDemoGallerySets,
  reorderDemoProjectFinalMedia,
  reorderDemoProjectRawMedia,
  saveProjectSnapshot,
  updateDemoGallerySet,
} from "@/lib/demo-data";
import {
  createGallerySet,
  deleteGallerySet,
  listGallerySets,
  patchGallerySetsBarSettings,
  reorderGallerySets,
  reorderSetsBarPills,
  updateGallerySet,
} from "@/lib/gallery-sets-api";
import { loadClientNameById } from "@/lib/clients-api";
import { apiCacheKey, cachedApiCall } from "@/lib/api-cache";
import { invalidateGalleryCaches } from "@/lib/cache-tags";
import { normalizeGalleryCoverColor } from "@/lib/gallery-cover-color";
import { normalizeGalleryCoverFrame } from "@/lib/gallery-cover-frame";
import { normalizeGalleryImageLayout } from "@/lib/gallery-image-layout";
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
  type ApiFolderMedia,
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
export { generateGalleryDescription, getGalleriesMeta, type GalleryListCounts, type GalleryTypeMeta } from "@/lib/galleries-api";

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
  if (!override?.coverFrame && !override?.coverColor && !override?.imageLayout) return folder;
  return {
    ...folder,
    ...(override?.coverFrame
      ? { coverFrame: normalizeGalleryCoverFrame(override.coverFrame) }
      : {}),
    ...(override?.coverColor
      ? { coverColor: normalizeGalleryCoverColor(override.coverColor) }
      : {}),
    ...(override?.imageLayout
      ? { imageLayout: normalizeGalleryImageLayout(override.imageLayout) }
      : {}),
  };
}

/** Apply gallery PATCH metadata onto an in-memory folder without refetching uploads/finals. */
export function mergeGalleryPatchIntoFolder(
  existing: ApiFolder,
  gallery: import("@/lib/galleries-api").ApiGallery,
): ApiFolder {
  const mapped = applyFolderPresentationOverride(mapGalleryToApiFolder(gallery));
  const {
    uploads: _uploads,
    uploadsPagination: _uploadsPagination,
    selection: _selection,
    finals: _finals,
    flaggedFinals: _flaggedFinals,
    sets: _sets,
    ...metadata
  } = mapped;
  return {
    ...existing,
    ...metadata,
    uploads: existing.uploads,
    uploadsPagination: existing.uploadsPagination,
    selection: existing.selection,
    finals: existing.finals,
    flaggedFinals: existing.flaggedFinals,
    sets: existing.sets,
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
  const apiTrash = await listTrash();
  return mergeTrashWithDemoPreview(apiTrash);
}

export async function listFoldersMediaTrash(
  _params: ListFoldersMediaTrashParams = {},
): Promise<ListFoldersMediaTrashResponse> {
  void _params;
  return { items: [], total: 0, page: 1, limit: 50 };
}

export async function restoreFoldersTrash(payload: {
  folderIds?: string[];
  mediaIds?: string[];
}): Promise<{ message: string; restoredFolderCount: number; restoredMediaCount: number }> {
  const galleryIds = [...(payload.folderIds ?? [])];
  const photoIds = [...(payload.mediaIds ?? [])];

  for (const id of galleryIds) {
    if (isTrashPreviewFolderId(id)) {
      hideTrashPreviewFolder(id);
    }
  }
  for (const photoId of photoIds) {
    if (photoId.startsWith("trash-preview-")) {
      const row = buildDemoTrashPreview().deletedMedia.find((m) => m.mediaId === photoId);
      if (row) hideTrashPreviewMedia(row.folderId, row.mediaId);
    }
  }

  const realGalleryIds = galleryIds.filter((id) => !isTrashPreviewFolderId(id));
  const realPhotoIds = photoIds.filter((id) => !id.startsWith("trash-preview-"));

  let restoredFolderCount = galleryIds.length - realGalleryIds.length;
  let restoredMediaCount = photoIds.length - realPhotoIds.length;

  if (realGalleryIds.length || realPhotoIds.length) {
    const result = await restoreTrashItems({
      galleryIds: realGalleryIds,
      photoIds: realPhotoIds,
    });
    restoredFolderCount += result.restored?.galleries ?? 0;
    restoredMediaCount += result.restored?.photos ?? 0;
    return {
      message: result.message ?? "Trash items restored.",
      restoredFolderCount,
      restoredMediaCount,
    };
  }

  return {
    message: "Trash items restored.",
    restoredFolderCount,
    restoredMediaCount,
  };
}

export async function restoreFolderFromTrash(folderId: string): Promise<ApiFolder> {
  if (isTrashPreviewFolderId(folderId)) {
    await delay();
    const row = buildDemoTrashPreview().folders.find((r) => r.folder._id === folderId);
    hideTrashPreviewFolder(folderId);
    if (!row) {
      throw new FoldersApiError("Preview gallery no longer in trash.", 404, null);
    }
    return row.folder;
  }
  await restoreTrashItems({ galleryIds: [folderId] });
  return getFolder(folderId);
}

export async function restoreFolderTrashedMedia(
  _folderId: string,
  mediaId: string,
): Promise<{ message: string; kind: string; mediaId: string }> {
  if (mediaId.startsWith("trash-preview-")) {
    await delay();
    hideTrashPreviewMedia(_folderId, mediaId);
    return { message: "Media restored", kind: "raw", mediaId };
  }
  await restoreTrashItems({ photoIds: [mediaId] });
  return { message: "Media restored", kind: "raw", mediaId };
}

export async function purgeFoldersTrash(payload: PurgeFoldersTrashPayload): Promise<TrashPurgeResult> {
  if ("all" in payload && payload.all) {
    const preview = buildDemoTrashPreview();
    hideAllTrashPreview();
    const result = await emptyTrash();
    const mapped = mapEmptyTrashToPurgeResult(result);
    return {
      ...mapped,
      purgedFolderCount: mapped.purgedFolderCount + preview.folders.length,
      purgedMediaCount: mapped.purgedMediaCount + preview.deletedMedia.length,
    };
  }
  if ("purgeAll" in payload && payload.purgeAll) {
    const preview = buildDemoTrashPreview();
    hideAllTrashPreview();
    const result = await emptyTrash();
    const mapped = mapEmptyTrashToPurgeResult(result);
    return {
      ...mapped,
      purgedFolderCount: mapped.purgedFolderCount + preview.folders.length,
      purgedMediaCount: mapped.purgedMediaCount + preview.deletedMedia.length,
    };
  }

  const sel = payload as { folderIds?: string[]; mediaIds?: string[] };
  let previewFolderCount = 0;
  let previewMediaCount = 0;

  for (const id of sel.folderIds ?? []) {
    if (isTrashPreviewFolderId(id)) {
      hideTrashPreviewFolder(id);
      previewFolderCount += 1;
    }
  }
  for (const mediaId of sel.mediaIds ?? []) {
    if (mediaId.startsWith("trash-preview-")) {
      const row = buildDemoTrashPreview().deletedMedia.find((m) => m.mediaId === mediaId);
      if (row) {
        hideTrashPreviewMedia(row.folderId, row.mediaId);
        previewMediaCount += 1;
      }
    }
  }

  const galleryIds = (sel.folderIds ?? []).filter((id) => !isTrashPreviewFolderId(id));
  const photoIds = (sel.mediaIds ?? []).filter((id) => !id.startsWith("trash-preview-"));

  if (!galleryIds.length && !photoIds.length) {
    return {
      message: "Trash purge completed.",
      purgedFolderCount: previewFolderCount,
      purgedMediaCount: previewMediaCount,
    };
  }

  const result = await emptyTrash({ galleryIds, photoIds });
  const mapped = mapEmptyTrashToPurgeResult(result);
  return {
    ...mapped,
    purgedFolderCount: mapped.purgedFolderCount + previewFolderCount,
    purgedMediaCount: mapped.purgedMediaCount + previewMediaCount,
  };
}

export async function listFolders(params: {
  clientId?: string;
  search?: string;
  status?: string;
} = {}): Promise<ApiFolder[]> {
  const [res, clientNameById] = await Promise.all([
    listGalleries({
      status: params.status ?? "all",
      search: params.search,
    }),
    loadClientNameById(),
  ]);
  let folders = res.galleries.map((g) =>
    applyFolderPresentationOverride(mapGalleryToApiFolder(g, clientNameById)),
  );
  if (params.clientId?.trim()) {
    const id = params.clientId.trim();
    folders = folders.filter((f) => {
      const c = f.client;
      return (typeof c === "string" ? c : c._id) === id;
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
  const [res, clientNameById] = await Promise.all([
    listGalleries({
      status: params.status ?? "all",
      search: params.search,
    }),
    loadClientNameById(),
  ]);
  let folders = res.galleries.map((g) => mapGalleryToApiFolder(g, clientNameById));
  if (params.clientId?.trim()) {
    const id = params.clientId.trim();
    folders = folders.filter((f) => {
      const c = f.client;
      return (typeof c === "string" ? c : c._id) === id;
    });
  }
  return { folders, counts: res.counts };
}

export async function getFolder(id: string, options?: { force?: boolean }): Promise<ApiFolder> {
  const cacheKey = apiCacheKey("GET", `/api/folders/composite/${encodeURIComponent(id)}`);
  return cachedApiCall(
    cacheKey,
    async () => {
      try {
        const [gallery, media, sets, clientNameById] = await Promise.all([
          getGalleryDetail(id),
          fetchGalleryMedia(id),
          listGallerySets(id).catch(() => []),
          loadClientNameById(),
        ]);
        return applyFolderPresentationOverride({
          ...mapGalleryToApiFolder(gallery, clientNameById),
          uploads: media.uploads,
          uploadsPagination: media.uploadsPagination,
          selection: media.selection,
          finals: media.finals,
          flaggedFinals: media.flaggedFinals,
          ...(media.selectionLocked !== undefined
            ? { selectionLocked: media.selectionLocked }
            : {}),
          sets,
        });
      } catch (e) {
        if (e instanceof FoldersApiError && e.status === 404) {
          const demo = getDemoFolderApiModel(id);
          if (demo) return demo;
        }
        throw e;
      }
    },
    {
      ttlMs: 12_000,
      tags: invalidateGalleryCaches(id),
      force: options?.force,
    },
  );
}

/** Refresh only media lists — avoids reloading gallery metadata, sets, and client names. */
export async function refreshFolderMedia(id: string): Promise<
  Pick<
    ApiFolder,
    "uploads" | "uploadsPagination" | "selection" | "finals" | "flaggedFinals" | "selectionLocked"
  >
> {
  const media = await fetchGalleryMedia(id);
  return {
    uploads: media.uploads,
    uploadsPagination: media.uploadsPagination,
    selection: media.selection,
    finals: media.finals,
    flaggedFinals: media.flaggedFinals,
    ...(media.selectionLocked !== undefined ? { selectionLocked: media.selectionLocked } : {}),
  };
}

/** Metadata-only gallery writes omit uploads/finals — reload so the dashboard keeps media visible. */
async function reloadFolderAfterGalleryPatch(folderId: string): Promise<ApiFolder> {
  return getFolder(folderId);
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

export async function reorderFolderGallerySets(folderId: string, orderedIds: string[]) {
  if (isLocalDemoFolderId(folderId)) {
    reorderDemoGallerySets(folderId, orderedIds);
    return listDemoGallerySets(folderId);
  }
  return reorderSetsBarPills(folderId, orderedIds);
}

export async function patchFolderSetsBarSettings(
  folderId: string,
  patch: { setsAllLabel?: string; setsAllSortOrder?: number },
) {
  if (isLocalDemoFolderId(folderId)) {
    patchDemoSetsBarSettings(folderId, patch);
    return;
  }
  await patchGallerySetsBarSettings(folderId, patch);
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
      galleryType: input.galleryType,
      slug: input.slug,
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

  const clientNameById = await loadClientNameById();
  return mapGalleryToApiFolder(result, clientNameById);
}

export async function updateFolder(
  id: string,
  input: UpdateFolderInput,
  existingFolder?: ApiFolder,
): Promise<ApiFolder> {
  const body: import("@/lib/galleries-api").UpdateGalleryBody = {};
  if (input.eventName !== undefined) body.name = input.eventName.trim();
  if (input.eventDate !== undefined) body.eventDate = input.eventDate.slice(0, 10);
  if (input.description !== undefined) body.description = input.description.trim();
  if (input.galleryType !== undefined) body.galleryType = input.galleryType;
  if (input.slug !== undefined) body.slug = input.slug;

  const coverFile = input.coverImage instanceof File ? input.coverImage : null;
  if (coverFile) {
    body.useDefaultCover = false;
  } else if (input.useDefaultCover !== undefined) {
    body.useDefaultCover = input.useDefaultCover;
  }

  const hasPutFields = Object.keys(body).length > 0 || Boolean(coverFile);
  const hasDesign =
    input.coverFrame !== undefined ||
    input.coverColor !== undefined ||
    input.imageLayout !== undefined ||
    input.titleFont !== undefined ||
    input.bodyFont !== undefined;
  const hasFocal =
    input.coverFocalX !== undefined && input.coverFocalY !== undefined;
  const hasMusicToggle = input.backgroundMusicEnabled !== undefined;

  if (!hasPutFields && !hasDesign && !hasFocal && !hasMusicToggle) {
    return getFolder(id);
  }

  let gallery: import("@/lib/galleries-api").ApiGallery | undefined;

  if (hasPutFields) {
    ({ gallery } = await updateGallery(id, body, { coverFile }));
  }

  if (hasDesign) {
    ({ gallery } = await updateGalleryDesignSettings(
      id,
      galleryDesignInputToApiBody({
        ...(input.coverFrame !== undefined
          ? { coverFrame: normalizeGalleryCoverFrame(input.coverFrame) }
          : {}),
        ...(input.coverColor !== undefined ? { coverColor: input.coverColor } : {}),
        ...(input.imageLayout !== undefined
          ? { imageLayout: normalizeGalleryImageLayout(input.imageLayout) }
          : {}),
        ...(input.titleFont !== undefined ? { titleFont: input.titleFont } : {}),
        ...(input.bodyFont !== undefined ? { bodyFont: input.bodyFont } : {}),
      }),
    ));
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
    return existingFolder ?? getFolder(id);
  }

  if (existingFolder && existingFolder._id === id) {
    return mergeGalleryPatchIntoFolder(existingFolder, gallery);
  }

  return reloadFolderAfterGalleryPatch(id);
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
  await uploadGalleryBackgroundMusic(folderId, file);
  return reloadFolderAfterGalleryPatch(folderId);
}

export async function deleteFolderBackgroundMusic(folderId: string): Promise<ApiFolder> {
  await deleteGalleryBackgroundMusic(folderId);
  return reloadFolderAfterGalleryPatch(folderId);
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
    finalDeliveryEnabled?: boolean;
    clearSelectionSubmit?: boolean;
  },
): Promise<ApiFolder> {
  const hasApiPatch =
    input.selectionLimit !== undefined ||
    input.selectionLocked !== undefined ||
    input.finalDeliveryEnabled !== undefined;

  if (hasApiPatch && !isLocalDemoFolderId(folderId)) {
    const body: import("@/lib/galleries-api").GallerySelectionSettingsBody = {};
    if (input.selectionLimit !== undefined) {
      const n = input.selectionLimit;
      body.maxSelections = n == null || n === 0 ? null : Math.max(1, Math.floor(n));
    }
    if (input.selectionLocked !== undefined) body.selectionLocked = input.selectionLocked;
    if (input.finalDeliveryEnabled !== undefined) {
      body.finalDeliveryEnabled = input.finalDeliveryEnabled;
    }
    await updateGallerySelectionSettings(folderId, body);
    return reloadFolderAfterGalleryPatch(folderId);
  }

  if (input.selectionLimit !== undefined && isLocalDemoFolderId(folderId)) {
    const n = input.selectionLimit;
    const maxSelections = n == null || n === 0 ? null : Math.max(1, Math.floor(n));
    patchFolderOverride(folderId, { selectionLimit: maxSelections ?? undefined });
  }

  if (isLocalDemoFolderId(folderId)) {
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

  return getFolder(folderId);
}

export async function patchFolderUploadSettings(
  folderId: string,
  input: { watermarkPreviewEnabled: boolean },
): Promise<ApiFolder> {
  if (isLocalDemoFolderId(folderId)) {
    await delay();
    patchFolderOverride(folderId, { watermarkPreviewEnabled: input.watermarkPreviewEnabled });
    const f = getDemoFolderApiModel(folderId);
    if (!f) throw new FoldersApiError("Gallery not found.", 404, null);
    return { ...f, watermarkPreviewEnabled: input.watermarkPreviewEnabled };
  }
  await updateGalleryUploadSettings(folderId, input);
  return reloadFolderAfterGalleryPatch(folderId);
}

export async function patchFolderFinalSettings(
  folderId: string,
  input: { watermarkFinalsEnabled: boolean },
): Promise<ApiFolder> {
  if (isLocalDemoFolderId(folderId)) {
    await delay();
    patchFolderOverride(folderId, { watermarkFinalsEnabled: input.watermarkFinalsEnabled });
    const f = getDemoFolderApiModel(folderId);
    if (!f) throw new FoldersApiError("Gallery not found.", 404, null);
    return { ...f, watermarkFinalsEnabled: input.watermarkFinalsEnabled };
  }
  await updateGalleryFinalSettings(folderId, input);
  return reloadFolderAfterGalleryPatch(folderId);
}

export async function patchFolderDesignSettings(
  folderId: string,
  input: import("@/lib/galleries-api").GalleryDesignSettingsInput,
  existingFolder?: ApiFolder,
): Promise<ApiFolder> {
  if (isLocalDemoFolderId(folderId)) {
    await delay();
    patchFolderOverride(folderId, {
      ...(input.coverFrame !== undefined
        ? { coverFrame: normalizeGalleryCoverFrame(input.coverFrame) }
        : {}),
      ...(input.coverColor !== undefined ? { coverColor: input.coverColor } : {}),
      ...(input.coverTextColor !== undefined ? { coverTextColor: input.coverTextColor } : {}),
      ...(input.coverButtonColor !== undefined ? { coverButtonColor: input.coverButtonColor } : {}),
      ...(input.imageLayout !== undefined
        ? { imageLayout: normalizeGalleryImageLayout(input.imageLayout) }
        : {}),
    });
    const f = getDemoFolderApiModel(folderId);
    if (!f) throw new FoldersApiError("Gallery not found.", 404, null);
    return {
      ...f,
      ...(input.coverFrame !== undefined
        ? { coverFrame: normalizeGalleryCoverFrame(input.coverFrame) }
        : {}),
      ...(input.coverColor !== undefined ? { coverColor: input.coverColor } : {}),
      ...(input.coverTextColor !== undefined ? { coverTextColor: input.coverTextColor } : {}),
      ...(input.coverButtonColor !== undefined ? { coverButtonColor: input.coverButtonColor } : {}),
      ...(input.imageLayout !== undefined
        ? { imageLayout: normalizeGalleryImageLayout(input.imageLayout) }
        : {}),
      ...(input.titleFont !== undefined ? { titleFont: input.titleFont.trim() } : {}),
      ...(input.bodyFont !== undefined ? { bodyFont: input.bodyFont.trim() } : {}),
    };
  }

  const { gallery } = await updateGalleryDesignSettings(
    folderId,
    galleryDesignInputToApiBody(input),
  );
  if (existingFolder && existingFolder._id === folderId) {
    return mergeGalleryPatchIntoFolder(existingFolder, gallery);
  }
  return reloadFolderAfterGalleryPatch(folderId);
}

export async function patchFolderClientAccess(
  folderId: string,
  input: {
    passwordProtected?: boolean;
    password?: string;
    allowDownloads?: boolean;
    emailGateEnabled?: boolean;
  },
): Promise<ApiFolder> {
  if (isLocalDemoFolderId(folderId)) {
    await delay();
    patchFolderOverride(folderId, {
      ...(input.passwordProtected !== undefined
        ? { sharePasswordEnabled: input.passwordProtected }
        : {}),
      ...(input.password?.trim() ? { shareAccessPin: input.password.trim() } : {}),
      ...(input.emailGateEnabled !== undefined
        ? { emailGateEnabled: input.emailGateEnabled }
        : {}),
    });
    const f = getDemoFolderApiModel(folderId);
    if (!f) throw new FoldersApiError("Gallery not found.", 404, null);
    return {
      ...f,
      ...(input.passwordProtected !== undefined
        ? { sharePasswordEnabled: input.passwordProtected }
        : {}),
      ...(input.allowDownloads !== undefined ? { allowDownloads: input.allowDownloads } : {}),
      ...(input.emailGateEnabled !== undefined ? { emailGateEnabled: input.emailGateEnabled } : {}),
    };
  }

  const body: import("@/lib/galleries-api").GalleryClientAccessBody = {};
  if (input.passwordProtected !== undefined) body.passwordProtected = input.passwordProtected;
  if (input.password !== undefined) body.password = input.password;
  if (input.allowDownloads !== undefined) body.allowDownloads = input.allowDownloads;
  if (input.emailGateEnabled !== undefined) body.emailGateEnabled = input.emailGateEnabled;
  await updateGalleryClientAccess(folderId, body);
  return reloadFolderAfterGalleryPatch(folderId);
}

export async function postFolderMediaDuplicatePreview(
  folderId: string,
  input: { kind: FolderMediaDuplicatePreviewKind; filenames: string[] },
): Promise<{ hasConflicts: boolean; conflictingFilenames?: string[] }> {
  const rows =
    input.kind === "raw"
      ? await listAllGalleryUploads(folderId)
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

export type RegenerateFolderShareResult = {
  folder: ApiFolder;
  smsError?: { message?: string };
};

export async function regenerateFolderShare(
  folderId: string,
  input: { clearSlug?: boolean; linkExpiry?: string; notifyClientViaSms?: boolean; message?: string },
): Promise<RegenerateFolderShareResult> {
  void input.clearSlug;
  void input.linkExpiry;
  if (isLocalDemoFolderId(folderId)) {
    patchFolderOverride(folderId, {
      shareEnabled: true,
      shareSharedAt: new Date().toISOString(),
    });
    const folder = await getFolder(folderId);
    if (!folder) {
      throw new FoldersApiError("Folder not found.", 404, null);
    }
    return { folder };
  }
  const res = await activateGalleryShareLink(folderId, {
    notifyClientViaSms: input.notifyClientViaSms,
    message: input.message,
  });
  const folder = await reloadFolderAfterGalleryPatch(folderId);
  return {
    folder,
    ...(res.smsError ? { smsError: res.smsError } : {}),
  };
}

export async function revokeFolderShare(folderId: string): Promise<ApiFolder> {
  if (isLocalDemoFolderId(folderId)) {
    patchFolderOverride(folderId, { shareEnabled: false });
    const folder = await getFolder(folderId);
    if (!folder) {
      throw new FoldersApiError("Folder not found.", 404, null);
    }
    return folder;
  }
  await revokeGalleryShareLink(folderId);
  return reloadFolderAfterGalleryPatch(folderId);
}

export type UploadFolderMediaFormOptions = {
  duplicateAction?: DuplicateUploadAction;
  markUploadComplete?: boolean;
  /** Target gallery set id; omit to leave set unchanged on replace. */
  setId?: string | null;
  /** When true, backend should generate watermarked preview derivatives for raw uploads. */
  applyPreviewWatermark?: boolean;
};

export type FinalDeliveryUploadFields = {
  clientHasPaidForFinals: boolean;
  amountRemainingGHS?: string;
  lockImagesBeforeUpload?: boolean;
};

export type UploadFolderFinalMediaFormOptions = UploadFolderMediaFormOptions &
  Partial<FinalDeliveryUploadFields> & {
    selectionMediaId?: string;
    /** When true, backend should apply the brand watermark to uploaded finals. */
    applyWatermark?: boolean;
  };

export type UploadFolderMediaResult = {
  lastBody: unknown;
  ignoredDuplicatesCount: number;
};

export type FolderMediaBatchProgress = {
  fileIndex: number;
  fileCount: number;
  filesUploaded: number;
  filesTotal: number;
  batchIndex: number;
  batchCount: number;
  phase?: "presigning" | "uploading" | "finalizing";
};

export type FolderMediaUploadCallbacks = {
  onProgress?: (
    loaded: number,
    total: number,
    lengthComputable: boolean,
    batch?: FolderMediaBatchProgress,
  ) => void;
  onBatchComplete?: (body: unknown) => void;
};

export async function uploadFolderRawMedia(
  folderId: string,
  files: File[],
  onProgress?: FolderMediaUploadCallbacks["onProgress"],
  formOptions?: UploadFolderMediaFormOptions,
  callbacks?: Pick<FolderMediaUploadCallbacks, "onBatchComplete">,
): Promise<UploadFolderMediaResult | null> {
  if (files.length === 0) return null;
  if (isLocalDemoFolderId(folderId)) {
    assertStorageAllowsDemoRawAdds(files.length);
  }

  const result = await uploadGalleryPhotos(folderId, files, {
    onConflict: formOptions?.duplicateAction,
    setId: formOptions?.setId,
    applyPreviewWatermark: formOptions?.applyPreviewWatermark,
    onProgress: (loaded, total, lengthComputable, batch) => {
      onProgress?.(loaded, total, lengthComputable, batch);
    },
    onBatchComplete: callbacks?.onBatchComplete,
  });

  return {
    lastBody: result,
    ignoredDuplicatesCount: result.ignoredDuplicatesCount,
  };
}

export async function uploadFolderFinalMedia(
  folderId: string,
  files: File[],
  onProgress?: FolderMediaUploadCallbacks["onProgress"],
  formOptions?: UploadFolderFinalMediaFormOptions,
  callbacks?: Pick<FolderMediaUploadCallbacks, "onBatchComplete">,
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
    applyWatermark: formOptions?.applyWatermark,
    onProgress: (loaded, total, lengthComputable, batch) => {
      onProgress?.(loaded, total, lengthComputable, batch);
    },
    onBatchComplete: callbacks?.onBatchComplete,
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

export async function patchFolderFinalLock(
  folderId: string,
  finalId: string,
  input: { isLocked: boolean; amountOwing?: number },
): Promise<ApiFolderMedia> {
  if (isLocalDemoFolderId(folderId)) {
    const project = loadProjectById(folderId);
    if (!project) {
      throw new FoldersApiError("Gallery not found", 404, null);
    }
    const target = project.finalAssets.find((f) => f.id === finalId);
    if (!target) {
      throw new FoldersApiError("Final not found", 404, null);
    }
    if (input.isLocked) {
      const raw = input.amountOwing;
      const hasStoredBalance = target.outstandingBalanceGhs != null && target.outstandingBalanceGhs > 0;
      if (raw == null && !hasStoredBalance) {
        throw new FoldersApiError("Amount owing (GHS) is required when locking a final", 400, null);
      }
      if (raw != null && (Number.isNaN(raw) || raw < 0)) {
        throw new FoldersApiError("Amount owing must be a non-negative number", 400, null);
      }
    }
    const finalAssets = project.finalAssets.map((f) => {
      if (f.id !== finalId) return f;
      if (input.isLocked) {
        const amount =
          input.amountOwing ??
          (f.outstandingBalanceGhs != null && f.outstandingBalanceGhs > 0
            ? f.outstandingBalanceGhs
            : 0);
        return { ...f, locked: true, outstandingBalanceGhs: amount };
      }
      return { ...f, locked: false, outstandingBalanceGhs: null };
    });
    saveProjectSnapshot({ ...project, finalAssets });
    const updated = finalAssets.find((f) => f.id === finalId)!;
    return {
      _id: updated.id,
      id: updated.id,
      name: updated.name,
      originalName: updated.name,
      originalFilename: updated.name,
      url: updated.url,
      mimeType: updated.mimeType,
      isVideo: updated.isVideo === true,
      locked: updated.locked === true,
      outstandingBalanceGhs: updated.outstandingBalanceGhs ?? null,
      clientPaid: !updated.locked,
      setId: updated.setId ?? null,
    };
  }

  const body = input.isLocked
    ? { isLocked: true as const, amountOwing: input.amountOwing }
    : { isLocked: false as const };
  const res = await patchGalleryFinalLock(folderId, finalId, body);
  return galleryPhotoToApiFolderMedia(res.final);
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
  const uploads = await listAllGalleryUploads(folderId);
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

export async function reorderFolderRawMedia(
  folderId: string,
  orderedIds: string[],
): Promise<ApiFolder> {
  if (isLocalDemoFolderId(folderId)) {
    reorderDemoProjectRawMedia(folderId, orderedIds);
    return getFolder(folderId);
  }
  await reorderGalleryUploads(folderId, orderedIds);
  return getFolder(folderId);
}

export async function reorderFolderFinalMedia(
  folderId: string,
  orderedIds: string[],
): Promise<ApiFolder> {
  if (isLocalDemoFolderId(folderId)) {
    reorderDemoProjectFinalMedia(folderId, orderedIds);
    return getFolder(folderId);
  }
  await reorderGalleryFinals(folderId, orderedIds);
  return getFolder(folderId);
}

export async function patchFolderStatus(folderId: string, status: string): Promise<ApiFolder> {
  const normalized = uiStatusToGalleryStatus(status);
  if (normalized === "done") {
    await completeGallery(folderId);
  } else {
    await updateGallery(folderId, { status: normalized });
  }
  return reloadFolderAfterGalleryPatch(folderId);
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
