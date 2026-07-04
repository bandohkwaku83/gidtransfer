import { API_BASE_URL, resolveGridThumbUrl, sameOriginUploadsUrl } from "@/lib/api";
import { loadProjectById } from "@/lib/demo-data";
import type { DemoAsset, DemoFinalAsset, FolderStatus } from "@/lib/demo-data";
import type { ApiFolder, ApiFolderMedia } from "@/lib/folders/types";

/** True when the folder id refers to a local demo/seed gallery (not the remote API). */
export function isLocalDemoFolderId(folderId: string): boolean {
  return loadProjectById(folderId) != null;
}

export type FolderMediaDuplicatePreviewKind = "raw" | "final";

/** Human-readable local deadline for restore UI. */
export function formatRestoreBeforeLabel(iso: string | undefined | null): string {
  if (!iso?.trim()) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function isRestoreDeadlinePassed(restoreBefore: string): boolean {
  const d = new Date(restoreBefore);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
}

/** Trash rows past their restore window are permanently removed — not shown in the UI. */
export function filterRestorableTrash<T extends { restoreBefore: string }>(rows: T[]): T[] {
  return rows.filter((row) => !isRestoreDeadlinePassed(row.restoreBefore));
}

/** Label for client share gallery selection UI (e.g. `3/10` or `3`). */
export function formatClientSelectionCount(
  selectedCount: number,
  selectionLimit: number | null | undefined,
): string {
  const n = Math.max(0, Math.floor(selectedCount));
  if (selectionLimit != null && Number.isFinite(selectionLimit) && selectionLimit > 0) {
    return `${n}/${Math.floor(selectionLimit)}`;
  }
  return String(n);
}

/** Count of `ignoredDuplicatesCount` from a (possibly nested) upload response. */
export function readIgnoredDuplicatesCount(body: unknown): number {
  if (!body || typeof body !== "object") return 0;
  const o = body as Record<string, unknown>;
  const nested =
    o.data && typeof o.data === "object" ? (o.data as Record<string, unknown>) : null;
  const pick = (x: Record<string, unknown>) =>
    x.ignoredDuplicatesCount ?? x.ignored_duplicates_count;
  const raw = pick(o) ?? (nested ? pick(nested) : undefined);
  return typeof raw === "number" && Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : 0;
}

export function extractRawMediaList(folder: ApiFolder): ApiFolderMedia[] {
  const f = folder as Record<string, unknown>;
  for (const k of ["uploads", "rawMedia", "rawFiles", "mediaRaw"]) {
    const v = f[k];
    if (Array.isArray(v)) return v as ApiFolderMedia[];
  }
  const m = f.media;
  if (m && typeof m === "object" && Array.isArray((m as { raw?: unknown }).raw)) {
    return (m as { raw: ApiFolderMedia[] }).raw;
  }
  return [];
}

/**
 * GET `/api/folders/:id` often returns selection as
 * `{ _id, editStatus, raw: { url, originalFilename, ... }, rawMediaId }[]`.
 */
function normalizeSelectionListItem(item: unknown): ApiFolderMedia | null {
  if (!item || typeof item !== "object") return null;
  const row = item as Record<string, unknown>;
  const nestedRaw = row.raw;
  if (nestedRaw && typeof nestedRaw === "object") {
    const r = nestedRaw as Record<string, unknown>;
    const selectionId =
      (typeof row._id === "string" && row._id) ||
      (typeof row.id === "string" && row.id) ||
      "";
    if (selectionId) {
      const selectedAt =
        typeof row.selectedAt === "string" && row.selectedAt.trim()
          ? row.selectedAt
          : typeof (row as Record<string, unknown>).selected_at === "string" &&
              String((row as Record<string, unknown>).selected_at).trim()
            ? String((row as Record<string, unknown>).selected_at)
            : typeof (nestedRaw as Record<string, unknown>).selectedAt === "string" &&
                String((nestedRaw as Record<string, unknown>).selectedAt).trim()
              ? String((nestedRaw as Record<string, unknown>).selectedAt)
              : typeof (nestedRaw as Record<string, unknown>).selected_at === "string" &&
                  String((nestedRaw as Record<string, unknown>).selected_at).trim()
                ? String((nestedRaw as Record<string, unknown>).selected_at)
                : null;
      return {
        _id: selectionId,
        url: typeof r.url === "string" ? r.url : undefined,
        originalFilename:
          typeof r.originalFilename === "string" ? r.originalFilename : undefined,
        originalName: typeof r.originalName === "string" ? r.originalName : undefined,
        filename: typeof r.filename === "string" ? r.filename : undefined,
        name: typeof r.name === "string" ? r.name : undefined,
        editStatus: typeof row.editStatus === "string" ? row.editStatus : undefined,
        rawMediaId: typeof row.rawMediaId === "string" ? row.rawMediaId : undefined,
        clientComment:
          typeof row.clientComment === "string"
            ? row.clientComment
            : typeof row.comment === "string"
              ? row.comment
              : undefined,
        photographerReply:
          typeof row.photographerReply === "string"
            ? row.photographerReply
            : undefined,
        selected: true,
        selection: "SELECTED",
        isSelected: true,
        selectedAt,
      };
    }
  }
  return item as ApiFolderMedia;
}

export function extractSelectionMediaList(folder: ApiFolder): ApiFolderMedia[] {
  const f = folder as Record<string, unknown>;
  const chunks: unknown[] = [];
  for (const k of ["selection", "selectionMedia", "selections", "clientSelections"]) {
    const v = f[k];
    if (Array.isArray(v)) {
      chunks.push(...v);
      break;
    }
  }
  if (chunks.length === 0) {
    const m = f.media;
    if (m && typeof m === "object") {
      const o = m as { selections?: unknown[]; selection?: unknown[] };
      if (Array.isArray(o.selections)) chunks.push(...o.selections);
      else if (Array.isArray(o.selection)) chunks.push(...o.selection);
    }
  }
  const out: ApiFolderMedia[] = [];
  for (const item of chunks) {
    const n = normalizeSelectionListItem(item);
    if (n) out.push(n);
  }
  return out;
}

export function extractFinalMediaList(folder: ApiFolder): ApiFolderMedia[] {
  const f = folder as Record<string, unknown>;
  for (const k of ["finals", "finalMedia", "finalFiles"]) {
    const v = f[k];
    if (Array.isArray(v)) return v as ApiFolderMedia[];
  }
  const m = f.media;
  if (m && typeof m === "object") {
    const o = m as { finals?: ApiFolderMedia[]; final?: ApiFolderMedia[] };
    if (Array.isArray(o.finals)) return o.finals;
    if (Array.isArray(o.final)) return o.final;
  }
  return [];
}

export function folderMediaRowId(m: ApiFolderMedia): string {
  return (m._id || m.id || "").trim();
}

/** Reorder a full id list after a drag within a filtered visible subset. */
export function reorderMediaIds(
  allIds: string[],
  visibleIds: string[],
  fromIndex: number,
  toIndex: number,
): string[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return allIds;
  const reorderedVisible = [...visibleIds];
  const [moved] = reorderedVisible.splice(fromIndex, 1);
  if (!moved) return allIds;
  reorderedVisible.splice(toIndex, 0, moved);
  const visibleSet = new Set(visibleIds);
  let vi = 0;
  return allIds.map((id) => (visibleSet.has(id) ? reorderedVisible[vi++]! : id));
}

export function reorderApiFolderMedia(
  items: ApiFolderMedia[],
  orderedIds: string[],
): ApiFolderMedia[] {
  const byId = new Map<string, ApiFolderMedia>();
  for (const row of items) {
    const id = folderMediaRowId(row);
    if (id) byId.set(id, row);
  }
  const used = new Set<string>();
  const next: ApiFolderMedia[] = [];
  for (const id of orderedIds) {
    const row = byId.get(id);
    if (row) {
      next.push(row);
      used.add(id);
    }
  }
  for (const row of items) {
    const id = folderMediaRowId(row);
    if (id && !used.has(id)) next.push(row);
  }
  return next;
}

/** Apply a saved id order to any list of rows with `id`. */
export function applyOrderByIds<T extends { id: string }>(items: T[], orderedIds: string[]): T[] {
  if (orderedIds.length === 0) return items;
  const byId = new Map(items.map((row) => [row.id, row]));
  const used = new Set<string>();
  const next: T[] = [];
  for (const id of orderedIds) {
    const row = byId.get(id);
    if (row) {
      next.push(row);
      used.add(id);
    }
  }
  for (const row of items) {
    if (!used.has(row.id)) next.push(row);
  }
  return next;
}

/** Merge a reordered visible subset back into the full id list. */
export function mergeVisibleOrder(allIds: string[], visibleOrderedIds: string[]): string[] {
  const visibleSet = new Set(visibleOrderedIds);
  let vi = 0;
  return allIds.map((id) => (visibleSet.has(id) ? visibleOrderedIds[vi++]! : id));
}

/** Display filename for a folder media row (aligned with gallery / duplicate checks). */
export function folderMediaRowFilename(m: ApiFolderMedia): string {
  return (m.originalName || m.originalFilename || m.filename || m.name || "").trim();
}

/**
 * Filenames in {@link incoming} that match an existing file name in the folder
 * for raw uploads or finals (same string match as typical duplicate checks).
 */
export function incomingFilenamesConflictingWithFolder(
  kind: FolderMediaDuplicatePreviewKind,
  incoming: string[],
  folder: ApiFolder,
): string[] {
  const existingRows =
    kind === "raw" ? extractRawMediaList(folder) : extractFinalMediaList(folder);
  const existing = new Set<string>();
  for (const m of existingRows) {
    const n = folderMediaRowFilename(m);
    if (n) existing.add(n);
  }
  const out: string[] = [];
  const seenOut = new Set<string>();
  for (const raw of incoming) {
    const name = raw.trim();
    if (!name || !existing.has(name) || seenOut.has(name)) continue;
    seenOut.add(name);
    out.push(name);
  }
  return out;
}

function apiEditStatusToUi(s?: string): "NONE" | "IN_PROGRESS" | "EDITED" {
  const v = (s || "").toLowerCase().replace(/-/g, "_");
  if (v === "in_progress") return "IN_PROGRESS";
  if (v === "edited" || v === "complete" || v === "completed") return "EDITED";
  return "NONE";
}

/** Photographer dashboard grid — prefer gridUrl/thumbUrl, fall back to full image while processing. */
export function demoAssetGridSrc(
  asset: Pick<DemoAsset, "gridUrl" | "thumbUrl" | "url">,
): string {
  return asset.gridUrl?.trim() || asset.thumbUrl?.trim() || asset.url?.trim() || "";
}

/** Map API media row → in-app DemoAsset shape for folder detail UI. */
export function apiFolderMediaToDemoAsset(m: ApiFolderMedia): DemoAsset {
  const id =
    (typeof m.rawMediaId === "string" && m.rawMediaId.trim()) ||
    m._id ||
    m.id ||
    `m-${Math.random().toString(36).slice(2, 10)}`;
  const originalName =
    m.originalName || m.originalFilename || m.filename || m.name || "Photo";
  const smallThumb = m.gridUrl || m.thumbUrl || m.thumbnailUrl || "";
  const fullUrl = m.url || "";
  const largePreview = m.displayUrl || fullUrl || m.previewUrl || m.image || "";
  const thumbResolved = smallThumb ? resolveGridThumbUrl(smallThumb) || smallThumb : "";
  const largeResolved = largePreview ? resolveCoverUrl(largePreview) || largePreview : "";
  const resolvedUrl = fullUrl ? resolveCoverUrl(fullUrl) || fullUrl : largeResolved;
  const mimeType = (m.mimeType || m.contentType || m.content_type || "").toLowerCase();
  const isVideo =
    m.isVideo === true ||
    mimeType.startsWith("video/") ||
    /\.(mp4|mov|webm|m4v|avi|mkv|ogv)$/i.test(originalName);
  const mediaUrl = largeResolved || thumbResolved || resolvedUrl;
  const previewUrl = isVideo
    ? mediaUrl
    : largeResolved && thumbResolved && largeResolved !== thumbResolved
      ? largeResolved
      : undefined;
  const selected =
    m.selected === true ||
    (typeof m.selection === "string" && m.selection.toUpperCase() === "SELECTED") ||
    m.isSelected === true;
  let setId: string | null = null;
  if (m.setId != null && m.setId !== "") {
    setId = String(m.setId);
  } else if (m.raw && typeof m.raw === "object") {
    const nested = (m.raw as ApiFolderMedia).setId;
    if (nested != null && nested !== "") setId = String(nested);
  }
  return {
    id,
    originalName,
    selection: selected ? "SELECTED" : "UNSELECTED",
    editState: apiEditStatusToUi(m.editStatus),
    clientComment: m.clientComment || m.comment || "",
    photographerReply: m.photographerReply || "",
    hasEdited: false,
    selectedAt:
      (typeof m.selectedAt === "string" ? m.selectedAt : null) ??
      (typeof (m as Record<string, unknown>).selected_at === "string"
        ? ((m as Record<string, unknown>).selected_at as string)
        : null),
    thumbUrl: isVideo ? mediaUrl : thumbResolved,
    ...(thumbResolved && !isVideo ? { gridUrl: thumbResolved } : {}),
    url: isVideo ? mediaUrl : resolvedUrl,
    ...(previewUrl ? { previewUrl } : {}),
    ...(m.displayUrl ? { displayUrl: resolveCoverUrl(m.displayUrl) || m.displayUrl } : {}),
    ...(m.derivativesReady === false ? { derivativesReady: false } : {}),
    ...(isVideo ? { isVideo: true } : {}),
    setId,
  };
}

function readOutstandingAmountGhs(o: Record<string, unknown>): number {
  const raw =
    o.outstandingBalanceGhs ??
    o.outstanding_balance_ghs ??
    o.outstandingAmountGHS ??
    o.outstanding_amount_ghs ??
    o.amountRemainingGHS ??
    o.amount_remaining_ghs ??
    o.amountOwing ??
    o.amount_owing;
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.max(0, raw);
  if (typeof raw === "string" && raw.trim()) {
    const n = Number(raw.trim().replace(/,/g, ""));
    if (Number.isFinite(n)) return Math.max(0, n);
  }
  return 0;
}

function nestedRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function truthyFolderFlag(v: unknown): boolean {
  return v === true || v === "true" || v === 1 || v === "1";
}

/** True when the folder detail API indicates client finals are still payment-locked. */
export function folderFinalsPaymentLocked(folder: ApiFolder): boolean {
  const root = folder as Record<string, unknown>;

  if (readOutstandingAmountGhs(root) > 0) return true;

  const fd = nestedRecord(root.finalDelivery) ?? nestedRecord(root.final_delivery);
  if (fd) {
    if (
      truthyFolderFlag(fd.locked) ||
      truthyFolderFlag(fd.paymentLocked) ||
      truthyFolderFlag(fd.payment_locked)
    ) {
      return true;
    }
    if (readOutstandingAmountGhs(fd) > 0) return true;
  }

  if (truthyFolderFlag(root.finalDeliveryLock) || truthyFolderFlag(root.final_delivery_lock)) {
    return true;
  }
  if (truthyFolderFlag(root.finalsPaymentLocked) || truthyFolderFlag(root.finals_payment_locked)) {
    return true;
  }
  if (truthyFolderFlag(root.finalDeliveryLocked) || truthyFolderFlag(root.final_delivery_locked)) {
    return true;
  }
  const share = root.share;
  if (share && typeof share === "object") {
    const s = share as Record<string, unknown>;
    if (readOutstandingAmountGhs(s) > 0) return true;
    const shareLockKeys = [
      "finalsPaymentLocked",
      "finals_payment_locked",
      "finalsLocked",
      "finals_locked",
      "finalDeliveryLocked",
      "final_delivery_locked",
      "finalLocked",
      "final_locked",
      "paymentLockOnFinals",
      "payment_lock_on_finals",
    ] as const;
    for (const k of shareLockKeys) {
      if (truthyFolderFlag(s[k])) return true;
    }
  }
  return false;
}

export function apiFolderMediaToFinal(m: ApiFolderMedia): DemoFinalAsset {
  const id = m._id || m.id || `f-${Math.random().toString(36).slice(2, 10)}`;
  const name = m.originalName || m.originalFilename || m.filename || m.name || "Final";
  const urlRaw = m.url || m.displayUrl || m.previewUrl || m.thumbUrl || "";
  const url = resolveCoverUrl(urlRaw) || urlRaw || "";
  const mimeType = m.mimeType || m.contentType || m.content_type || "";
  const isVideo =
    m.isVideo === true ||
    mimeType.toLowerCase().startsWith("video/") ||
    /\.(mp4|mov|webm|m4v|avi|mkv|ogv)$/i.test(name) ||
    /\.(mp4|mov|webm|m4v|avi|mkv|ogv)(?:[?#].*)?$/i.test(url);
  const o = m as Record<string, unknown>;
  const truthyFlag = (v: unknown) => v === true || v === "true";
  const lockStatus =
    typeof o.lockStatus === "string"
      ? o.lockStatus
      : typeof o.lock_status === "string"
        ? o.lock_status
        : "";
  const locked =
    m.locked === true ||
    truthyFlag(o.isLocked) ||
    truthyFlag(o.is_locked) ||
    truthyFlag(o.isPaymentLocked) ||
    truthyFlag(o.is_payment_locked) ||
    truthyFlag(o.finalLocked) ||
    truthyFlag(o.final_locked) ||
    truthyFlag(o.clientLocked) ||
    truthyFlag(o.client_locked) ||
    truthyFlag(o.lockImages) ||
    truthyFlag(o.paymentLocked) ||
    truthyFlag(o.payment_locked) ||
    truthyFlag(o.downloadLocked) ||
    truthyFlag(o.download_locked) ||
    lockStatus.toLowerCase() === "locked";
  const setId =
    m.setId != null && m.setId !== "" ? String(m.setId) : null;
  const balanceRaw = m.outstandingBalanceGhs ?? readOutstandingAmountGhs(o);
  const outstandingBalanceGhs = balanceRaw > 0 ? balanceRaw : m.outstandingBalanceGhs ?? null;
  return {
    id,
    name,
    url,
    locked,
    setId,
    ...(outstandingBalanceGhs != null ? { outstandingBalanceGhs } : {}),
    ...(mimeType ? { mimeType } : {}),
    ...(isVideo ? { isVideo: true } : {}),
  };
}

/**
 * Whether client final images behave as locked (after `PATCH .../final-delivery/lock`, until unlock).
 * Combines folder-level flags, outstanding balance hints, and per-final `locked` from GET folder.
 */
export function finalImagesLockedForClient(folder: ApiFolder): boolean {
  if (folderFinalsPaymentLocked(folder)) return true;
  for (const m of extractFinalMediaList(folder)) {
    if (apiFolderMediaToFinal(m).locked) return true;
  }
  return false;
}

export function apiFolderStatusToUi(s?: string): FolderStatus {
  const v = (s || "").toLowerCase();
  if (v === "completed" || v === "complete" || v === "delivered" || v === "done")
    return "COMPLETED";
  if (
    v === "selection_pending" ||
    v === "selection-pending" ||
    v === "selectionpending" ||
    v === "selecting"
  )
    return "SELECTION_PENDING";
  return "DRAFT";
}

export const UNKNOWN_CLIENT_LABEL = "Unknown client";

export function getFolderClientId(folder: ApiFolder): string {
  return typeof folder.client === "string" ? folder.client : folder.client?._id ?? "";
}

export function getFolderClientName(
  folder: ApiFolder,
  clientNameById?: Map<string, string>,
): string {
  const id = getFolderClientId(folder);
  const fromMap = id ? clientNameById?.get(id)?.trim() : undefined;
  if (fromMap) return fromMap;

  if (typeof folder.client === "object" && folder.client?.name) {
    const embedded = folder.client.name.trim();
    if (embedded && embedded !== UNKNOWN_CLIENT_LABEL) {
      return embedded;
    }
  }

  return UNKNOWN_CLIENT_LABEL;
}

export function enrichFolderClientNames(
  folders: ApiFolder[],
  clientNameById?: Map<string, string>,
): ApiFolder[] {
  return folders.map((folder) => {
    const name = getFolderClientName(folder, clientNameById);
    if (typeof folder.client === "object") {
      if (folder.client.name === name) return folder;
      return { ...folder, client: { ...folder.client, name } };
    }
    const id = getFolderClientId(folder);
    return {
      ...folder,
      client: {
        _id: id || "unknown",
        name,
        email: "",
        contact: "",
        location: "",
      },
    };
  });
}

export function getFolderClientContact(folder: ApiFolder): string {
  if (typeof folder.client === "object") {
    return folder.client.contact?.trim() || folder.client.email?.trim() || "";
  }
  return "";
}

/** Selection lock may be on `share` (detail GET) or duplicated on the folder root. */
export function folderSelectionLocked(folder: ApiFolder): boolean {
  return Boolean(folder.share?.selectionLocked ?? folder.selectionLocked);
}

/** Max client heart-picks; omit or 0 = unlimited. */
export function folderSelectionLimit(folder: ApiFolder): number | null {
  const raw = folder.selectionLimit ?? folder.share?.selectionLimit;
  if (raw == null || raw === 0) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.floor(n);
}

/** Resolve a coverImage value (could be absolute URL or a relative path). */
export function resolveCoverUrl(coverImage?: string | null): string | null {
  if (!coverImage) return null;
  const normalized = sameOriginUploadsUrl(coverImage.trim());
  if (/^https?:\/\//i.test(normalized)) return normalized;
  if (normalized.startsWith("/")) {
    if (API_BASE_URL) return `${API_BASE_URL}${normalized}`;
    return normalized;
  }
  if (API_BASE_URL) return `${API_BASE_URL}/${normalized}`;
  return `/${normalized}`;
}

/** Pick the best cover URL for an ApiFolder (prefers full cover, then display variants). */
export function getFolderCoverUrl(folder: ApiFolder): string | null {
  if (folder.coverImageUrl) {
    const resolved = resolveCoverUrl(folder.coverImageUrl);
    if (resolved) return resolved;
  }
  const o = folder as Record<string, unknown>;
  const displayUrl = firstNonEmptyCoverRef(
    o.displayCoverUrl,
    o.display_cover_url,
    o.effectiveCoverUrl,
    o.effective_cover_url,
    o.resolvedCoverUrl,
    o.resolved_cover_url,
  );
  if (displayUrl) return resolveCoverUrl(displayUrl);
  return resolveCoverUrl(folder.coverImage);
}

function firstNonEmptyCoverRef(...values: unknown[]): string | null {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

/** Resolve cover `src` for dashboard cards (custom cover, studio default, or API-resolved URL). */
export function resolveFolderCoverSrc(
  folder: ApiFolder,
  studioDefaultCoverUrl?: string | null,
): string | null {
  const usesDefault = folder.usingDefaultCover !== false;
  if (usesDefault) {
    const studio = studioDefaultCoverUrl?.trim();
    if (studio) return resolveCoverUrl(studio) ?? studio;
  }

  return getFolderCoverUrl(folder);
}

/** Placeholder label when a folder has no renderable cover image. */
export function folderCoverPlaceholderLabel(folder: ApiFolder): string {
  return folder.usingDefaultCover !== false ? "Studio default" : "No image";
}

function readNumericField(o: Record<string, unknown>, camel: string, snake: string): number | null {
  const tryOne = (v: unknown): number | null => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
    return null;
  };
  return tryOne(o[camel]) ?? tryOne(o[snake]);
}

/** Read cover focal from API folder (camelCase or snake_case). Default center 50,50. */
export function parseFolderCoverFocal(
  source: ApiFolder | Record<string, unknown> | null | undefined,
): { x: number; y: number } {
  if (!source || typeof source !== "object") return { x: 50, y: 50 };
  const o = source as Record<string, unknown>;
  const x = readNumericField(o, "coverFocalX", "cover_focal_x");
  const y = readNumericField(o, "coverFocalY", "cover_focal_y");
  const clamp = (n: number) => Math.min(100, Math.max(0, n));
  return {
    x: x == null ? 50 : clamp(x),
    y: y == null ? 50 : clamp(y),
  };
}

/** CSS `object-position` for folder cover thumbnails / hero. */
export function folderCoverObjectPositionStyle(folder: ApiFolder): { objectPosition: string } {
  const { x, y } = parseFolderCoverFocal(folder);
  return { objectPosition: `${x}% ${y}%` };
}

function pathFromShareUrlField(shareUrl: string): string | null {
  const trimmed = shareUrl.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/")) {
    const i = trimmed.indexOf("#");
    return i >= 0 ? trimmed.slice(0, i) : trimmed;
  }
  try {
    const u = new URL(trimmed);
    return `${u.pathname}${u.search}` || null;
  } catch {
    return null;
  }
}

/** Client gallery lives at `/g/[token]`, `/[companySlug]/[gallerySlug]`, or `/client/[slug]` on tenant hosts. */
function pathToClientGalleryPath(pathWithSearch: string): string | null {
  const hashIdx = pathWithSearch.indexOf("#");
  const noHash = hashIdx >= 0 ? pathWithSearch.slice(0, hashIdx) : pathWithSearch;
  const qIdx = noHash.indexOf("?");
  const pathname = qIdx >= 0 ? noHash.slice(0, qIdx) : noHash;
  const search = qIdx >= 0 ? noHash.slice(qIdx) : "";

  const trySegment = (rawSegment: string) => {
    let slug = rawSegment;
    try {
      slug = decodeURIComponent(rawSegment);
    } catch {
      slug = rawSegment;
    }
    if (!slug) return null;
    return `/g/${encodeURIComponent(slug)}${search}`;
  };

  const shareM = pathname.match(/^\/share\/(.+)$/);
  if (shareM) return trySegment(shareM[1]);

  const gM = pathname.match(/^\/g\/(.+)$/);
  if (gM) return trySegment(gM[1]);

  const clientM = pathname.match(/^\/client\/([^/]+)$/);
  if (clientM?.[1]) {
    return `/client/${encodeURIComponent(clientM[1])}${search}`;
  }

  const slugM = pathname.match(/^\/([^/]+)\/([^/]+)$/);
  if (slugM?.[1] && slugM[2]) {
    return `/${encodeURIComponent(slugM[1])}/${encodeURIComponent(slugM[2])}${search}`;
  }

  return null;
}

/** True when the gallery has an uploaded custom cover (not the studio default). */
export function galleryHasCustomCoverImage(folder: ApiFolder): boolean {
  if (folder.usingDefaultCover !== false) return false;
  return Boolean(getFolderCoverUrl(folder));
}

/** True when cover style/design settings were saved for this gallery. */
export function galleryHasSavedCoverStyle(folder: ApiFolder): boolean {
  return folder.coverStyleConfigured === true;
}

/** Whether the photographer may activate the client share link. */
export function canActivateGalleryOnline(folder: ApiFolder): boolean {
  return galleryHasCustomCoverImage(folder) && galleryHasSavedCoverStyle(folder);
}

/** Hint shown on the offline publish toggle before requirements are met. */
export function galleryOnlineActivationHint(folder: ApiFolder): string {
  const hasCover = galleryHasCustomCoverImage(folder);
  const hasStyle = galleryHasSavedCoverStyle(folder);
  if (!hasCover && !hasStyle) {
    return "Upload a cover photo and choose a cover style in the Gallery tab before going online.";
  }
  if (!hasCover) {
    return "Upload a cover photo in the Gallery tab before going online.";
  }
  if (!hasStyle) {
    return "Choose a cover style in the Gallery tab before going online.";
  }
  return "Turn on to publish the client link.";
}

/** Client link is published (online) — share enabled, not expired, and has a share token or URL. */
export function isGalleryPublished(folder: ApiFolder): boolean {
  if (folder.shareExpired) return false;
  if (folder.share?.enabled !== true) return false;
  return Boolean(folder.shareUrl || folder.share?.code || folder.share?.slug);
}

/**
 * Relative client-gallery path on this app.
 * Prefers API `shareUrl` (slug or tenant `/client/...` format), then token fallback.
 */
export function getFolderSharePath(folder: ApiFolder): string | null {
  if (folder.shareUrl) {
    const raw = pathFromShareUrlField(folder.shareUrl);
    if (raw) {
      const normalized = pathToClientGalleryPath(raw);
      if (normalized) return normalized;
      if (raw.startsWith("/")) return raw;
    }
  }

  const code = folder.share?.slug ?? folder.share?.code;
  if (code) return `/g/${encodeURIComponent(code)}`;
  return null;
}

/** Same as {@link getFolderSharePath} — kept for existing imports. */
export function getFolderShareUrl(folder: ApiFolder): string | null {
  return getFolderSharePath(folder);
}

/** Absolute share URL on `appOrigin` (clipboard, "Open", email). */
export function getFolderShareAbsoluteUrl(
  folder: ApiFolder,
  appOrigin: string,
): string | null {
  const path = getFolderSharePath(folder);
  if (!path) return null;
  const origin = appOrigin.replace(/\/$/, "");
  return `${origin}${path}`;
}
