import { authedJson } from "@/lib/http";
import { FoldersApiError } from "@/lib/folders/types";
import { ALL_SETS_PILL_ID } from "@/lib/gallery-set-filter";

export type GallerySetCounts = {
  uploads: number;
  finals: number;
};

export type ApiGallerySet = {
  id: string;
  galleryId?: string;
  name: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
  /** Present on public gallery payloads — nested media per set. */
  counts?: GallerySetCounts;
};

function galleryPath(id: string) {
  return `/api/galleries/${encodeURIComponent(id)}`;
}

export function normalizeGallerySets(raw: unknown): ApiGallerySet[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s): s is Record<string, unknown> => s && typeof s === "object")
    .map((s) => {
      const countsRaw = s.counts;
      let counts: GallerySetCounts | undefined;
      if (countsRaw && typeof countsRaw === "object") {
        const c = countsRaw as Record<string, unknown>;
        counts = {
          uploads: typeof c.uploads === "number" ? c.uploads : 0,
          finals: typeof c.finals === "number" ? c.finals : 0,
        };
      }
      return {
        id: String(s.id ?? s._id ?? ""),
        galleryId: s.galleryId != null ? String(s.galleryId) : undefined,
        name: String(s.name ?? "").trim(),
        sortOrder: typeof s.sortOrder === "number" ? s.sortOrder : 0,
        createdAt: typeof s.createdAt === "string" ? s.createdAt : undefined,
        updatedAt: typeof s.updatedAt === "string" ? s.updatedAt : undefined,
        ...(counts ? { counts } : {}),
      };
    })
    .filter((s) => s.id && s.name);
}

function normalizeSets(body: unknown): ApiGallerySet[] {
  if (!body || typeof body !== "object") return [];
  const o = body as Record<string, unknown>;
  return normalizeGallerySets(o.sets);
}

export async function listGallerySets(galleryId: string): Promise<ApiGallerySet[]> {
  const res = await authedJson<unknown>(
    `${galleryPath(galleryId)}/sets`,
    { method: "GET" },
    "Failed to load gallery sets",
    FoldersApiError,
  );
  return normalizeSets(res);
}

export async function createGallerySet(
  galleryId: string,
  name: string,
): Promise<ApiGallerySet> {
  const res = await authedJson<{ set?: ApiGallerySet }>(
    `${galleryPath(galleryId)}/sets`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    },
    "Failed to create set",
    FoldersApiError,
  );
  const set = res.set;
  if (!set?.id) {
    const listed = await listGallerySets(galleryId);
    const hit = listed.find((s) => s.name === name.trim());
    if (hit) return hit;
    throw new FoldersApiError("Set created but response was incomplete", 500, null);
  }
  return {
    id: String(set.id),
    galleryId: set.galleryId,
    name: set.name ?? name.trim(),
    sortOrder: typeof set.sortOrder === "number" ? set.sortOrder : 0,
    createdAt: set.createdAt,
    updatedAt: set.updatedAt,
  };
}

export async function updateGallerySet(
  galleryId: string,
  setId: string,
  patch: { name?: string; sortOrder?: number },
): Promise<ApiGallerySet> {
  const res = await authedJson<{ set?: ApiGallerySet }>(
    `${galleryPath(galleryId)}/sets/${encodeURIComponent(setId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    },
    "Failed to update set",
    FoldersApiError,
  );
  if (res.set?.id) {
    return {
      id: String(res.set.id),
      galleryId: res.set.galleryId,
      name: res.set.name ?? patch.name ?? "",
      sortOrder:
        typeof res.set.sortOrder === "number"
          ? res.set.sortOrder
          : (patch.sortOrder ?? 0),
    };
  }
  const listed = await listGallerySets(galleryId);
  const hit = listed.find((s) => s.id === setId);
  if (hit) return hit;
  throw new FoldersApiError("Set updated but response was incomplete", 500, null);
}

export async function deleteGallerySet(galleryId: string, setId: string): Promise<void> {
  await authedJson(
    `${galleryPath(galleryId)}/sets/${encodeURIComponent(setId)}`,
    { method: "DELETE" },
    "Failed to delete set",
    FoldersApiError,
  );
}

/** Persist a new pill order (0-based sortOrder per id, including {@link ALL_SETS_PILL_ID}). */
export type GallerySetsBarSettingsPatch = {
  setsAllLabel?: string;
  setsAllSortOrder?: number;
};

export async function patchGallerySetsBarSettings(
  galleryId: string,
  patch: GallerySetsBarSettingsPatch,
): Promise<void> {
  await authedJson(
    `${galleryPath(galleryId)}/sets-settings`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    },
    "Failed to update sets bar settings",
    FoldersApiError,
  );
}

export async function reorderSetsBarPills(
  galleryId: string,
  orderedIds: string[],
): Promise<ApiGallerySet[]> {
  const allIndex = orderedIds.indexOf(ALL_SETS_PILL_ID);
  const updates: Promise<unknown>[] = [];

  if (allIndex >= 0) {
    updates.push(patchGallerySetsBarSettings(galleryId, { setsAllSortOrder: allIndex }));
  }

  orderedIds.forEach((id, sortOrder) => {
    if (id !== ALL_SETS_PILL_ID) {
      updates.push(updateGallerySet(galleryId, id, { sortOrder }));
    }
  });

  await Promise.all(updates);
  return listGallerySets(galleryId);
}

/** @deprecated Use {@link reorderSetsBarPills} — kept for callers that omit the All pill. */
export async function reorderGallerySets(
  galleryId: string,
  orderedIds: string[],
): Promise<ApiGallerySet[]> {
  return reorderSetsBarPills(galleryId, orderedIds);
}
