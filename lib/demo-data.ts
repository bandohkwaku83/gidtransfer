import type { GalleryCoverFrame } from "@/lib/gallery-cover-frame";
import type { GalleryImageLayout } from "@/lib/gallery-image-layout";
import { ALL_SETS_PILL_ID } from "@/lib/gallery-set-filter";

export type SelectionState = "UNSELECTED" | "SELECTED";
export type EditState = "NONE" | "IN_PROGRESS" | "EDITED";
export type FolderStatus = "DRAFT" | "SELECTION_PENDING" | "COMPLETED";

export type DemoGallerySet = {
  id: string;
  name: string;
  sortOrder: number;
};

export type DemoAsset = {
  id: string;
  originalName: string;
  /** Optional gallery set (subsection) for this raw/selection item. */
  setId?: string | null;
  selection: SelectionState;
  editState: EditState;
  clientComment: string;
  photographerReply?: string;
  hasEdited: boolean;
  thumbUrl: string;
  /** Grid-optimized thumbnail (GET uploads?view=grid). */
  gridUrl?: string;
  /** Full-quality file URL — used as grid fallback while thumbnails process. */
  url?: string;
  /** ISO timestamp when the client selected/hearted this item. */
  selectedAt?: string | null;
  /** Watermarked client preview when distinct from thumb. */
  displayUrl?: string;
  /** Full-screen preview URL when better than {@link thumbUrl} (share galleries / API). */
  previewUrl?: string;
  /** False while thumbnails / watermarked previews are still processing. */
  derivativesReady?: boolean;
  editedPreviewUrl?: string;
  /** Raw upload or selection row is a video file. */
  isVideo?: boolean;
  rejectedByClient?: boolean;
  rejectionComment?: string;
};

export type DemoFinalAsset = {
  id: string;
  name: string;
  setId?: string | null;
  url: string;
  /** Final delivery file is a video. */
  isVideo?: boolean;
  mimeType?: string;
  /** Payment lock — client share hides full-res download until unlock. */
  locked?: boolean;
  outstandingBalanceGhs?: number | null;
};

export type DemoProject = {
  id: string;
  /** Client / job title shown on cards */
  clientName: string;
  /** Client contact details (used on Clients page). Optional in this demo. */
  contactEmail?: string;
  contactPhone?: string;
  shareToken: string;
  createdAt: string;
  eventDate: string;
  description: string;
  updatedAt: string;
  status: FolderStatus;
  assets: DemoAsset[];
  finalAssets: DemoFinalAsset[];
  sharePasswordEnabled: boolean;
  /** 4-digit client access code when {@link sharePasswordEnabled} is true (UI / demo). */
  shareAccessPin?: string;
  /** When true, clients must enter an email before viewing (UI / demo). */
  emailGateEnabled?: boolean;
  /** Relative days from “today” in UI; null = no expiry */
  shareExpiryDays: number | null;
  /** Client submitted picks */
  selectionSubmitted: boolean;
};

export type DemoClient = {
  id: string;
  name: string;
  /** Optional in this demo (user can register without email). */
  contactEmail?: string;
  /** Required in this demo. */
  contactPhone: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_EXTRA = "gidostorage_demo_projects_v2";
const STORAGE_OVERRIDES = "gidostorage_folder_overrides_v1";
const STORAGE_CLIENTS_EXTRA = "gidostorage_demo_clients_v1";
const STORAGE_CLIENT_PATCH = "gidostorage_demo_client_patch_v1";

export type FolderOverride = Partial<DemoProject> & {
  deleted?: boolean;
  deletedAt?: string;
  restoreBefore?: string;
  /** Photographer lock on client selections (demo UI). */
  selectionLocked?: boolean;
  /** Max photos the client may heart-select; omit or 0 = unlimited (demo UI). */
  selectionLimit?: number | null;
  /** Simulate payment lock on finals for client share. */
  finalsPaymentLocked?: boolean;
  /** Cover focal point (demo — stored only in overrides). */
  coverFocalX?: number;
  coverFocalY?: number;
  /** Client gallery cover frame (demo — stored only in overrides). */
  coverFrame?: GalleryCoverFrame;
  /** Cover backdrop color (demo — stored only in overrides). */
  coverColor?: string;
  /** Default client grid layout (demo — stored only in overrides). */
  imageLayout?: GalleryImageLayout;
  /** Permanently hidden after trash purge (demo). */
  purged?: boolean;
  /** Demo-only streamed URL for gallery background music. */
  demoBackgroundMusicUrl?: string;
  /** Demo-only photographer replies keyed by `sel:<photoId>` or `fin:<finalId>`. */
  feedbackReplies?: Record<string, string>;
  /** Per-gallery watermark for finals (demo UI). */
  watermarkFinalsEnabled?: boolean;
  /** Named subsections within this demo gallery. */
  gallerySets?: DemoGallerySet[];
  /** Client-facing label for the combined “All” sets pill (demo). */
  setsAllLabel?: string;
  /** Sort position of the “All” pill among set pills (demo). */
  setsAllSortOrder?: number;
  /** Demo-only set assignment when not stored on the asset row. */
  assetSetIds?: Record<string, string | null>;
  finalSetIds?: Record<string, string | null>;
  /** Gallery blog posts (demo — stored in overrides). */
  galleryBlogPosts?: import("@/lib/gallery-blog").GalleryBlogPost[];
  /** Client gallery 4-digit gate (demo — stored in overrides). */
  sharePasswordEnabled?: boolean;
  shareAccessPin?: string;
  /** Require email before client gallery opens (demo — stored in overrides). */
  emailGateEnabled?: boolean;
  /** Per-gallery preview watermark for client originals (demo — stored in overrides). */
  watermarkPreviewEnabled?: boolean;
  /** When true, the client share link is live (demo — stored in overrides). */
  shareEnabled?: boolean;
  shareSharedAt?: string;
};

const OVERRIDE_ONLY_FIELDS = new Set([
  "deleted",
  "deletedAt",
  "restoreBefore",
  "selectionLocked",
  "selectionLimit",
  "finalsPaymentLocked",
  "purged",
  "demoBackgroundMusicUrl",
  "coverFocalX",
  "coverFocalY",
  "coverFrame",
  "coverColor",
  "imageLayout",
  "gallerySets",
  "setsAllLabel",
  "setsAllSortOrder",
  "assetSetIds",
  "finalSetIds",
  "galleryBlogPosts",
  "sharePasswordEnabled",
  "shareAccessPin",
  "emailGateEnabled",
  "shareEnabled",
  "shareSharedAt",
  "watermarkFinalsEnabled",
  "watermarkPreviewEnabled",
]);

function emptyFinals(): DemoFinalAsset[] {
  return [];
}

export const SEED_PROJECTS: DemoProject[] = [
  {
    id: "p-kwaku",
    clientName: "Kwaku Wedding",
    contactEmail: "kwaku.wedding@client.gido",
    shareToken: "demo-kwaku-gallery",
    createdAt: "2026-04-01T10:00:00.000Z",
    eventDate: "2026-05-18",
    description: "Full-day coverage, ceremony and reception.",
    updatedAt: "2026-04-10T15:30:00.000Z",
    status: "DRAFT",
    selectionSubmitted: false,
    sharePasswordEnabled: false,
    shareExpiryDays: 30,
    assets: [
      {
        id: "kw-1",
        originalName: "ceremony_001.jpg",
        selection: "SELECTED",
        editState: "EDITED",
        clientComment: "Love the light on the aisle.",
        hasEdited: true,
        thumbUrl: "https://picsum.photos/seed/kwaku1/900/700",
        editedPreviewUrl: "https://picsum.photos/seed/kwaku1e/900/700",
      },
      {
        id: "kw-2",
        originalName: "reception_014.jpg",
        selection: "SELECTED",
        editState: "IN_PROGRESS",
        clientComment: "",
        hasEdited: false,
        thumbUrl: "https://picsum.photos/seed/kwaku2/900/700",
      },
      {
        id: "kw-3",
        originalName: "details_rings.jpg",
        selection: "UNSELECTED",
        editState: "NONE",
        clientComment: "",
        hasEdited: false,
        thumbUrl: "https://picsum.photos/seed/kwaku3/900/700",
      },
    ],
    finalAssets: [
      {
        id: "f-kw-1",
        name: "ceremony_001_final.jpg",
        url: "https://picsum.photos/seed/kwakuf1/1200/900",
      },
    ],
  },
  {
    id: "p-portrait",
    clientName: "Studio Portraits, April",
    contactEmail: "studio.portraits.april@client.gido",
    shareToken: "demo-portraits-april",
    createdAt: "2026-04-05T12:00:00.000Z",
    eventDate: "2026-04-12",
    description: "",
    updatedAt: "2026-04-08T10:00:00.000Z",
    status: "DRAFT",
    selectionSubmitted: false,
    sharePasswordEnabled: false,
    shareExpiryDays: null,
    assets: [
      {
        id: "pr-1",
        originalName: "look_01.jpg",
        selection: "UNSELECTED",
        editState: "NONE",
        clientComment: "",
        hasEdited: false,
        thumbUrl: "https://picsum.photos/seed/portrait1/900/700",
      },
      {
        id: "pr-2",
        originalName: "look_02.jpg",
        selection: "UNSELECTED",
        editState: "NONE",
        clientComment: "",
        hasEdited: false,
        thumbUrl: "https://picsum.photos/seed/portrait2/900/700",
      },
    ],
    finalAssets: emptyFinals(),
  },
  {
    id: "p-engagement",
    clientName: "Engagement — Adwoa & Yaw",
    contactEmail: "adwoa.engagement@client.gido",
    shareToken: "demo-adwoa-engagement",
    createdAt: "2026-06-18T08:00:00.000Z",
    eventDate: "2026-06-19",
    description: "Sunset engagement portraits.",
    updatedAt: "2026-06-27T16:45:00.000Z",
    status: "SELECTION_PENDING",
    selectionSubmitted: true,
    sharePasswordEnabled: false,
    shareExpiryDays: 14,
    assets: [
      {
        id: "en-1",
        originalName: "sunset_01.jpg",
        selection: "SELECTED",
        editState: "NONE",
        clientComment: "Love this angle.",
        hasEdited: false,
        thumbUrl: "/images/gallery-covers/IMG_5261.JPG",
      },
      {
        id: "en-2",
        originalName: "sunset_02.jpg",
        selection: "SELECTED",
        editState: "NONE",
        clientComment: "",
        hasEdited: false,
        thumbUrl: "https://picsum.photos/seed/engagement2/900/700",
      },
    ],
    finalAssets: emptyFinals(),
  },
];

function seedClientsFromProjects(projects: DemoProject[]): DemoClient[] {
  const map = new Map<string, DemoClient>();
  for (const p of projects) {
    const key = p.clientName.toLowerCase();
    if (map.has(key)) continue;
    const emailBase = p.clientName.toLowerCase().replace(/[^a-z0-9]+/g, ".");
    const contactEmail = p.contactEmail?.trim() || `${emailBase}@client.gido`;
    const contactPhone = p.contactPhone?.trim() || "555-0100";
    const id = `seed-${key.replace(/[^a-z0-9]+/g, "-")}`;
    map.set(key, {
      id,
      name: p.clientName,
      contactEmail: contactEmail || undefined,
      contactPhone,
      location: "Unknown",
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    });
  }
  return Array.from(map.values());
}

export const SEED_CLIENTS: DemoClient[] = seedClientsFromProjects(SEED_PROJECTS);

function nextClientId(): string {
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function readExtraClients(): DemoClient[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_CLIENTS_EXTRA);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as DemoClient[]) : [];
  } catch {
    return [];
  }
}

function writeExtraClients(clients: DemoClient[]) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_CLIENTS_EXTRA, JSON.stringify(clients));
}

export function appendExtraClient(client: DemoClient) {
  writeExtraClients([...readExtraClients(), client]);
}

function readClientPatches(): Record<string, Partial<DemoClient>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(STORAGE_CLIENT_PATCH);
    if (!raw) return {};
    const p = JSON.parse(raw) as unknown;
    return typeof p === "object" && p !== null ? (p as Record<string, Partial<DemoClient>>) : {};
  } catch {
    return {};
  }
}

function writeClientPatches(next: Record<string, Partial<DemoClient>>) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_CLIENT_PATCH, JSON.stringify(next));
}

export function patchDemoClientFields(id: string, patch: Partial<DemoClient>) {
  const cur = readClientPatches();
  writeClientPatches({ ...cur, [id]: { ...cur[id], ...patch, updatedAt: new Date().toISOString() } });
}

export function deleteExtraClientById(id: string): boolean {
  const before = readExtraClients();
  const next = before.filter((c) => c.id !== id);
  if (next.length === before.length) return false;
  writeExtraClients(next);
  const cp = readClientPatches();
  if (cp[id]) {
    const { [id]: _r, ...rest } = cp;
    writeClientPatches(rest);
  }
  return true;
}

export function loadAllClients(): DemoClient[] {
  return [...SEED_CLIENTS, ...readExtraClients()].map((c) => {
    const p = readClientPatches()[c.id];
    return p ? { ...c, ...p } : c;
  });
}

export function createClientDraft(input: {
  name: string;
  contactEmail?: string;
  contactPhone: string;
  location?: string;
}): DemoClient {
  const now = new Date().toISOString();
  return {
    id: nextClientId(),
    name: input.name.trim(),
    contactEmail: input.contactEmail?.trim() || undefined,
    contactPhone: input.contactPhone.trim(),
    location: input.location?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
}

function readOverrides(): Record<string, FolderOverride> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(STORAGE_OVERRIDES);
    if (!raw) return {};
    const p = JSON.parse(raw) as unknown;
    return typeof p === "object" && p !== null ? (p as Record<string, FolderOverride>) : {};
  } catch {
    return {};
  }
}

function writeOverrides(next: Record<string, FolderOverride>) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_OVERRIDES, JSON.stringify(next));
}

export function patchFolderOverride(id: string, patch: FolderOverride) {
  const cur = readOverrides();
  writeOverrides({ ...cur, [id]: { ...cur[id], ...patch } });
}

export function getFolderOverride(id: string): FolderOverride | undefined {
  return readOverrides()[id];
}

function demoSetId(): string {
  return `set-${Math.random().toString(36).slice(2, 11)}`;
}

export function listDemoGallerySets(folderId: string): DemoGallerySet[] {
  const sets = getFolderOverride(folderId)?.gallerySets ?? [];
  return [...sets].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export function createDemoGallerySet(folderId: string, name: string): DemoGallerySet {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Set name is required");
  const existing = listDemoGallerySets(folderId);
  const sortOrder =
    existing.length > 0 ? Math.max(...existing.map((s) => s.sortOrder)) + 1 : 0;
  const row: DemoGallerySet = { id: demoSetId(), name: trimmed, sortOrder };
  patchFolderOverride(folderId, { gallerySets: [...existing, row] });
  return row;
}

export function updateDemoGallerySet(
  folderId: string,
  setId: string,
  patch: { name?: string; sortOrder?: number },
): DemoGallerySet {
  const existing = listDemoGallerySets(folderId);
  const idx = existing.findIndex((s) => s.id === setId);
  if (idx < 0) throw new Error("Set not found");
  const cur = existing[idx]!;
  const next: DemoGallerySet = {
    ...cur,
    ...(patch.name !== undefined ? { name: patch.name.trim() || cur.name } : {}),
    ...(patch.sortOrder !== undefined ? { sortOrder: patch.sortOrder } : {}),
  };
  const gallerySets = [...existing];
  gallerySets[idx] = next;
  patchFolderOverride(folderId, { gallerySets });
  return next;
}

export function reorderDemoGallerySets(folderId: string, orderedIds: string[]): DemoGallerySet[] {
  const allIndex = orderedIds.indexOf(ALL_SETS_PILL_ID);
  const existing = listDemoGallerySets(folderId);
  const byId = new Map(existing.map((s) => [s.id, s]));
  const gallerySets = orderedIds
    .filter((id) => id !== ALL_SETS_PILL_ID)
    .map((id, sortOrder) => {
      const row = byId.get(id);
      return row ? { ...row, sortOrder } : null;
    })
    .filter((s): s is DemoGallerySet => Boolean(s));
  patchFolderOverride(folderId, {
    gallerySets,
    ...(allIndex >= 0 ? { setsAllSortOrder: allIndex } : {}),
  });
  return gallerySets;
}

export function patchDemoSetsBarSettings(
  folderId: string,
  patch: { setsAllLabel?: string; setsAllSortOrder?: number },
): void {
  const next: FolderOverride = {};
  if (patch.setsAllLabel !== undefined) {
    next.setsAllLabel = patch.setsAllLabel.trim() || undefined;
  }
  if (patch.setsAllSortOrder !== undefined) {
    next.setsAllSortOrder = Math.max(0, Math.floor(patch.setsAllSortOrder));
  }
  patchFolderOverride(folderId, next);
}

export function deleteDemoGallerySet(folderId: string, setId: string): void {
  const o = getFolderOverride(folderId);
  const existing = o?.gallerySets ?? [];
  const gallerySets = existing.filter((s) => s.id !== setId);
  const assetSetIds = { ...(o?.assetSetIds ?? {}) };
  const finalSetIds = { ...(o?.finalSetIds ?? {}) };
  for (const [id, sid] of Object.entries(assetSetIds)) {
    if (sid === setId) assetSetIds[id] = null;
  }
  for (const [id, sid] of Object.entries(finalSetIds)) {
    if (sid === setId) finalSetIds[id] = null;
  }
  const project = loadProjectById(folderId);
  if (project) {
    const assets = project.assets.map((a) =>
      (a.setId === setId ? { ...a, setId: null } : a),
    );
    const finalAssets = project.finalAssets.map((f) =>
      (f.setId === setId ? { ...f, setId: null } : f),
    );
    saveProjectSnapshot({ ...project, assets, finalAssets });
  }
  patchFolderOverride(folderId, { gallerySets, assetSetIds, finalSetIds });
}

function reorderDemoProjectMedia<T extends { id: string }>(
  folderId: string,
  orderedIds: string[],
  pick: (project: DemoProject) => T[],
  save: (project: DemoProject, next: T[]) => DemoProject,
): void {
  const project = loadProjectById(folderId);
  if (!project) return;
  const current = pick(project);
  const byId = new Map(current.map((row) => [row.id, row]));
  const next: T[] = [];
  const used = new Set<string>();
  for (const id of orderedIds) {
    const row = byId.get(id);
    if (row) {
      next.push(row);
      used.add(id);
    }
  }
  for (const row of current) {
    if (!used.has(row.id)) next.push(row);
  }
  saveProjectSnapshot(save(project, next));
}

export function reorderDemoProjectRawMedia(folderId: string, orderedIds: string[]): void {
  reorderDemoProjectMedia(
    folderId,
    orderedIds,
    (project) => project.assets,
    (project, assets) => ({ ...project, assets }),
  );
}

export function reorderDemoProjectFinalMedia(folderId: string, orderedIds: string[]): void {
  reorderDemoProjectMedia(
    folderId,
    orderedIds,
    (project) => project.finalAssets,
    (project, finalAssets) => ({ ...project, finalAssets }),
  );
}

function resolveDemoAssetSetId(
  folderId: string,
  assetId: string,
  asset?: DemoAsset,
): string | null {
  if (asset?.setId != null && asset.setId !== "") return asset.setId;
  const mapped = getFolderOverride(folderId)?.assetSetIds?.[assetId];
  if (mapped === undefined) return null;
  return mapped;
}

function resolveDemoFinalSetId(
  folderId: string,
  finalId: string,
  fin?: DemoFinalAsset,
): string | null {
  if (fin?.setId != null && fin.setId !== "") return fin.setId;
  const mapped = getFolderOverride(folderId)?.finalSetIds?.[finalId];
  if (mapped === undefined) return null;
  return mapped;
}

export { resolveDemoAssetSetId, resolveDemoFinalSetId };

function readExtraProjects(): DemoProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_EXTRA);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as DemoProject[]) : [];
  } catch {
    return [];
  }
}

export function writeExtraProjects(projects: DemoProject[]) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_EXTRA, JSON.stringify(projects));
}

export function appendExtraProject(project: DemoProject) {
  writeExtraProjects([...readExtraProjects(), project]);
}

function mergeProject(base: DemoProject): DemoProject {
  const o = readOverrides()[base.id];
  if (!o) return base;
  const projectPatch: Partial<DemoProject> = {};
  for (const [key, val] of Object.entries(o)) {
    if (OVERRIDE_ONLY_FIELDS.has(key)) continue;
    (projectPatch as Record<string, unknown>)[key] = val;
  }
  return {
    ...base,
    ...projectPatch,
    assets: o.assets ?? base.assets,
    finalAssets: o.finalAssets ?? base.finalAssets,
  };
}

function isRemoved(p: DemoProject): boolean {
  return readOverrides()[p.id]?.deleted === true;
}

function isPurgedId(id: string): boolean {
  return readOverrides()[id]?.purged === true;
}

export function loadAllProjects(): DemoProject[] {
  const merged = [...SEED_PROJECTS, ...readExtraProjects()].map(mergeProject);
  return merged.filter((p) => !isPurgedId(p.id) && !isRemoved(p));
}

export function loadProjectById(id: string): DemoProject | undefined {
  return loadAllProjects().find((p) => p.id === id);
}

export function loadProjectByShareToken(token: string): DemoProject | undefined {
  return loadAllProjects().find((p) => p.shareToken === token);
}

/** In-memory clone for React state (avoid mutating seed/extra references). */
export function cloneDemoProject(project: DemoProject): DemoProject {
  return {
    ...project,
    assets: project.assets.map((a) => ({ ...a })),
    finalAssets: project.finalAssets.map((f) => ({ ...f })),
  };
}

/**
 * Rich placeholder gallery for any share URL while the backend is not wired.
 * Uses picsum images only — no API or database.
 */
export function buildUiDevGallery(shareToken: string): DemoProject {
  const safe =
    shareToken.replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "preview";
  const id = `ui-dev-${safe}`;
  const seeds = ["uidev1", "uidev2", "uidev3", "uidev4", "uidev5", "uidev6"];
  const assets: DemoAsset[] = seeds.map((seed, i) => ({
    id: `${id}-a-${i}`,
    originalName: `photo_${String(i + 1).padStart(2, "0")}.jpg`,
    selection: i % 4 === 0 ? "SELECTED" : "UNSELECTED",
    editState: "NONE",
    clientComment: i === 2 ? "Sample client note for layout." : "",
    hasEdited: false,
    thumbUrl: `https://picsum.photos/seed/${seed}-${safe.slice(0, 8)}/900/700`,
  }));

  return {
    id,
    clientName: "Preview client (UI only)",
    contactEmail: undefined,
    contactPhone: "",
    shareToken,
    createdAt: new Date().toISOString(),
    eventDate: new Date().toISOString().slice(0, 10),
    description: "",
    updatedAt: new Date().toISOString(),
    status: "DRAFT",
    selectionSubmitted: false,
    assets,
    finalAssets: [
      {
        id: `${id}-f-1`,
        name: "sample_delivery.jpg",
        url: `https://picsum.photos/seed/uidevfinal-${safe.slice(0, 8)}/900/700`,
      },
    ],
    sharePasswordEnabled: false,
    shareExpiryDays: null,
  };
}

/** Seed gallery by token, otherwise a static UI-dev gallery (no network). */
export function loadProjectForClientShare(shareToken: string): DemoProject {
  return loadProjectByShareToken(shareToken) ?? buildUiDevGallery(shareToken);
}

export function nextAssetId(): string {
  return `a-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function nextFolderId(): string {
  return `p-${Date.now().toString(36)}`;
}

export function nextShareToken(): string {
  return `share-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createFolderDraft(input: {
  clientName: string;
  eventDate: string;
  description: string;
  contactEmail?: string;
  contactPhone?: string;
}): DemoProject {
  return {
    id: nextFolderId(),
    clientName: input.clientName.trim(),
    contactEmail: input.contactEmail?.trim() || undefined,
    contactPhone: input.contactPhone?.trim() || undefined,
    shareToken: nextShareToken(),
    createdAt: new Date().toISOString(),
    eventDate: input.eventDate,
    description: input.description.trim(),
    updatedAt: new Date().toISOString(),
    status: "DRAFT",
    selectionSubmitted: false,
    assets: [],
    finalAssets: [],
    sharePasswordEnabled: false,
    shareExpiryDays: 14,
  };
}

export function replaceExtraProject(updated: DemoProject) {
  const extras = readExtraProjects();
  const idx = extras.findIndex((p) => p.id === updated.id);
  const next =
    idx >= 0
      ? extras.map((p) => (p.id === updated.id ? updated : p))
      : [...extras, updated];
  writeExtraProjects(next);
}

export function deleteFolder(id: string) {
  const deletedAt = new Date().toISOString();
  const restoreBefore = new Date(Date.now() + 30 * 86400000).toISOString();
  if (SEED_PROJECTS.some((s) => s.id === id)) {
    patchFolderOverride(id, { deleted: true, deletedAt, restoreBefore });
    return;
  }
  if (readExtraProjects().some((p) => p.id === id)) {
    patchFolderOverride(id, { deleted: true, deletedAt, restoreBefore });
    return;
  }
}

/** All merged projects including those in trash (for admin trash UI). */
export function loadAllProjectsWithTrash(): DemoProject[] {
  return [...SEED_PROJECTS, ...readExtraProjects()].map(mergeProject);
}

export function restoreFolderFromTrashDemo(id: string) {
  patchFolderOverride(id, {
    deleted: false,
    deletedAt: undefined,
    restoreBefore: undefined,
  });
}

export function purgeFolderFromTrashDemo(id: string) {
  if (SEED_PROJECTS.some((s) => s.id === id)) {
    patchFolderOverride(id, {
      purged: true,
      deleted: false,
      deletedAt: undefined,
      restoreBefore: undefined,
    });
    return;
  }
  writeExtraProjects(readExtraProjects().filter((p) => p.id !== id));
  const cur = readOverrides();
  const { [id]: _removed, ...rest } = cur;
  writeOverrides(rest);
}

export function upsertDemoProject(project: DemoProject) {
  if (SEED_PROJECTS.some((s) => s.id === project.id)) {
    saveProjectSnapshot(project);
    return;
  }
  const extras = readExtraProjects();
  if (extras.some((p) => p.id === project.id)) {
    replaceExtraProject(project);
    return;
  }
  appendExtraProject(project);
}

export function saveProjectSnapshot(project: DemoProject) {
  const nextUpdated = new Date().toISOString();
  if (SEED_PROJECTS.some((s) => s.id === project.id)) {
    patchFolderOverride(project.id, {
      clientName: project.clientName,
      contactEmail: project.contactEmail,
      contactPhone: project.contactPhone,
      eventDate: project.eventDate,
      description: project.description,
      assets: project.assets,
      finalAssets: project.finalAssets,
      status: project.status,
      selectionSubmitted: project.selectionSubmitted,
      shareToken: project.shareToken,
      sharePasswordEnabled: project.sharePasswordEnabled,
      shareExpiryDays: project.shareExpiryDays,
      updatedAt: nextUpdated,
    });
    return;
  }
  replaceExtraProject({ ...project, updatedAt: nextUpdated });
}

export function regenerateShareLink(id: string): string {
  const token = nextShareToken();
  patchFolderOverride(id, { shareToken: token });
  return token;
}
