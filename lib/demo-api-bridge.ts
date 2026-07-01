import type { ApiClient } from "@/lib/clients-api";
import type {
  ApiGallerySet,
} from "@/lib/gallery-sets-api";
import type { DemoAsset, DemoFinalAsset, DemoProject, FolderStatus } from "@/lib/demo-data";
import {
  listDemoGallerySets,
  resolveDemoAssetSetId,
  resolveDemoFinalSetId,
} from "@/lib/demo-data";
import {
  getFolderOverride,
  loadAllClients,
  loadAllProjects,
  loadAllProjectsWithTrash,
  loadProjectById,
  loadProjectForClientShare,
  SEED_PROJECTS,
} from "@/lib/demo-data";
import type { ApiFolder, ApiFolderMedia, ApiFolderShare } from "@/lib/folders/types";
import { normalizeGalleryCoverColor } from "@/lib/gallery-cover-color";
import { normalizeGalleryCoverFrame } from "@/lib/gallery-cover-frame";
import { normalizeGalleryImageLayout } from "@/lib/gallery-image-layout";

function normalizeSelectionLimit(raw: number | null | undefined): number | null {
  if (raw == null || raw === 0) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.floor(n);
}

function uiStatusToApi(status: FolderStatus): string {
  switch (status) {
    case "COMPLETED":
      return "completed";
    case "SELECTION_PENDING":
      return "selection_pending";
    default:
      return "draft";
  }
}

function expiryPresetFromDays(days: number | null | undefined): string {
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
  return "30d";
}

export function demoClientToApiClient(c: {
  id: string;
  name: string;
  contactEmail?: string;
  contactPhone: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}): ApiClient {
  return {
    _id: c.id,
    name: c.name,
    email: c.contactEmail ?? "",
    contact: c.contactPhone,
    location: c.location ?? "",
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

function resolveClientForProject(project: DemoProject): ApiClient {
  const clients = loadAllClients();
  const byEmail = project.contactEmail?.trim()
    ? clients.find(
        (c) => c.contactEmail?.toLowerCase() === project.contactEmail?.trim().toLowerCase(),
      )
    : undefined;
  const byName = clients.find((c) => c.name === project.clientName);
  const picked = byEmail ?? byName;
  if (picked) return demoClientToApiClient(picked);
  return {
    _id: `virtual-${project.id}`,
    name: project.clientName,
    email: project.contactEmail ?? "",
    contact: project.contactPhone ?? "",
    location: "",
  };
}

function assetToRawMedia(a: DemoAsset, folderId: string): ApiFolderMedia {
  const editMap = { NONE: "none", IN_PROGRESS: "in_progress", EDITED: "edited" } as const;
  const setId = resolveDemoAssetSetId(folderId, a.id, a);
  return {
    _id: a.id,
    id: a.id,
    originalFilename: a.originalName,
    originalName: a.originalName,
    thumbUrl: a.thumbUrl,
    url: a.previewUrl ?? a.thumbUrl,
    displayUrl: a.previewUrl ?? a.thumbUrl,
    previewUrl: a.previewUrl,
    isVideo: a.isVideo === true,
    editStatus: editMap[a.editState],
    clientComment: a.clientComment,
    photographerReply: a.photographerReply ?? "",
    selected: a.selection === "SELECTED",
    selection: a.selection,
    setId,
  };
}

function assetToSelectionRow(a: DemoAsset, folderId: string): ApiFolderMedia | null {
  if (a.selection !== "SELECTED") return null;
  const raw = assetToRawMedia(a, folderId);
  return {
    _id: `sel-${a.id}`,
    raw,
    rawMediaId: a.id,
    editStatus: raw.editStatus,
    clientComment: a.clientComment,
    photographerReply: a.photographerReply ?? "",
    selected: true,
    selection: "SELECTED",
    setId: raw.setId ?? null,
  };
}

function finalToMedia(f: DemoFinalAsset, folderId: string): ApiFolderMedia {
  return {
    _id: f.id,
    id: f.id,
    name: f.name,
    originalName: f.name,
    originalFilename: f.name,
    url: f.url,
    mimeType: f.mimeType,
    isVideo: f.isVideo === true,
    locked: f.locked === true,
    ...(f.outstandingBalanceGhs != null ? { outstandingBalanceGhs: f.outstandingBalanceGhs } : {}),
    setId: resolveDemoFinalSetId(folderId, f.id, f),
  };
}

function demoSetsToApi(folderId: string): ApiGallerySet[] {
  return listDemoGallerySets(folderId).map((s) => ({
    id: s.id,
    name: s.name,
    sortOrder: s.sortOrder,
  }));
}

export function demoProjectToApiFolder(project: DemoProject): ApiFolder {
  const client = resolveClientForProject(project);
  const override = getFolderOverride(project.id);
  const uploads = project.assets.map((a) => assetToRawMedia(a, project.id));
  const selection = project.assets
    .map((a) => assetToSelectionRow(a, project.id))
    .filter(Boolean) as ApiFolderMedia[];
  const finals = project.finalAssets.map((f) => finalToMedia(f, project.id));
  const sets = demoSetsToApi(project.id);
  const firstCover = project.assets[0]?.thumbUrl;
  const bg = override?.demoBackgroundMusicUrl;
  const isSeedProject = SEED_PROJECTS.some((seed) => seed.id === project.id);
  const shareEnabled = override?.shareEnabled ?? isSeedProject;
  const share: ApiFolderShare = {
    code: project.shareToken,
    slug: project.shareToken,
    enabled: shareEnabled,
    sharedAt: override?.shareSharedAt ?? (shareEnabled ? project.updatedAt : null),
    selectionSubmittedAt: project.selectionSubmitted ? project.updatedAt : null,
    selectionLocked: override?.selectionLocked ?? false,
    selectionLimit: normalizeSelectionLimit(override?.selectionLimit),
    linkExpiryPreset: expiryPresetFromDays(project.shareExpiryDays),
    finalsLocked: override?.finalsPaymentLocked ?? false,
  };
  const sitePath = `/g/${encodeURIComponent(project.shareToken)}`;
  const focalX = override?.coverFocalX ?? 50;
  const focalY = override?.coverFocalY ?? 50;
  return {
    _id: project.id,
    client,
    eventName: project.clientName,
    eventDate: project.eventDate,
    description: project.description,
    coverImageUrl: firstCover,
    coverFocalX: focalX,
    coverFocalY: focalY,
    coverFrame: normalizeGalleryCoverFrame(override?.coverFrame),
    coverColor: normalizeGalleryCoverColor(override?.coverColor),
    ...(override?.coverFrame || override?.coverColor || isSeedProject
      ? { coverStyleConfigured: true }
      : {}),
    ...(override?.imageLayout
      ? { imageLayout: normalizeGalleryImageLayout(override.imageLayout) }
      : {}),
    usingDefaultCover: !firstCover,
    share,
    shareUrl: sitePath,
    status: uiStatusToApi(project.status),
    uploads,
    selection,
    finals,
    sets,
    ...(override?.setsAllLabel?.trim() ? { setsAllLabel: override.setsAllLabel.trim() } : {}),
    ...(override?.setsAllSortOrder !== undefined
      ? { setsAllSortOrder: override.setsAllSortOrder }
      : {}),
    finalDelivery: project.finalAssets.length > 0 || project.status !== "DRAFT",
    finalsPaymentLocked: override?.finalsPaymentLocked ?? false,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    selectionLocked: override?.selectionLocked ?? false,
    selectionLimit: normalizeSelectionLimit(override?.selectionLimit),
    ...(override?.watermarkFinalsEnabled !== undefined
      ? { watermarkFinalsEnabled: override.watermarkFinalsEnabled }
      : {}),
    backgroundMusicEnabled: Boolean(bg?.trim()),
    backgroundMusicUrl: bg?.trim() || undefined,
    ...(override?.sharePasswordEnabled !== undefined
      ? { sharePasswordEnabled: override.sharePasswordEnabled }
      : {}),
    ...(override?.emailGateEnabled !== undefined
      ? { emailGateEnabled: override.emailGateEnabled }
      : {}),
  };
}

export function listDemoFoldersApiModels(): ApiFolder[] {
  return loadAllProjects().map(demoProjectToApiFolder);
}

export function getDemoFolderApiModel(id: string): ApiFolder | null {
  const p = loadProjectById(id);
  return p ? demoProjectToApiFolder(p) : null;
}

export function listTrashedDemoFolderRows(): {
  folder: ApiFolder;
  deletedAt: string;
  restoreBefore: string;
}[] {
  const out: { folder: ApiFolder; deletedAt: string; restoreBefore: string }[] = [];
  for (const p of loadAllProjectsWithTrash()) {
    const o = getFolderOverride(p.id);
    if (o?.deleted === true && !o.purged) {
      out.push({
        folder: demoProjectToApiFolder(p),
        deletedAt: o.deletedAt ?? new Date().toISOString(),
        restoreBefore: o.restoreBefore ?? new Date().toISOString(),
      });
    }
  }
  return out;
}

export function applyLinkExpiryPresetToProject(project: DemoProject, presetId: string): DemoProject {
  const presets: Record<string, number | null> = {
    never: null,
    "7d": 7,
    "14d": 14,
    "30d": 30,
    "60d": 60,
    "90d": 90,
    "180d": 180,
    "365d": 365,
  };
  const days = presets[presetId];
  if (days === undefined) return project;
  return { ...project, shareExpiryDays: days };
}

export function thumbUrlForUploadedFile(file: File): string {
  const base = `${file.name}-${file.size}-${file.lastModified}`;
  const seed = encodeURIComponent(base.slice(0, 80));
  return `https://picsum.photos/seed/${seed}/900/700`;
}

/** Resolved demo project for a share token (includes UI-dev placeholder galleries). */
export function demoProjectForShareToken(shareToken: string): DemoProject {
  return loadProjectForClientShare(shareToken);
}
