import { authedJson } from "@/lib/http";
import { FoldersApiError } from "@/lib/folders/types";

export type ApiGallerySet = {
  id: string;
  galleryId?: string;
  name: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

function galleryPath(id: string) {
  return `/api/galleries/${encodeURIComponent(id)}`;
}

function normalizeSets(body: unknown): ApiGallerySet[] {
  if (!body || typeof body !== "object") return [];
  const o = body as Record<string, unknown>;
  const raw = o.sets;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s): s is Record<string, unknown> => s && typeof s === "object")
    .map((s) => ({
      id: String(s.id ?? s._id ?? ""),
      galleryId: s.galleryId != null ? String(s.galleryId) : undefined,
      name: String(s.name ?? "").trim(),
      sortOrder: typeof s.sortOrder === "number" ? s.sortOrder : 0,
      createdAt: typeof s.createdAt === "string" ? s.createdAt : undefined,
      updatedAt: typeof s.updatedAt === "string" ? s.updatedAt : undefined,
    }))
    .filter((s) => s.id && s.name);
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
