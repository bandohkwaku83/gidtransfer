import type { ApiGallerySet } from "@/lib/gallery-sets-api";

/** Virtual id for the combined “All” filter pill in drag/reorder UIs. */
export const ALL_SETS_PILL_ID = "__all__";

export const DEFAULT_ALL_SETS_LABEL = "All";

/** Active filter for gallery set pills: all items, or one named set. */
export type GallerySetFilter = "all" | string;

export function readMediaSetId(item: { setId?: string | null }): string | null {
  const id = item.setId;
  if (id == null || id === "") return null;
  return String(id);
}

export function filterMediaByGallerySet<T extends { setId?: string | null }>(
  items: T[],
  filter: GallerySetFilter,
): T[] {
  if (filter === "all") return items;
  return items.filter((item) => readMediaSetId(item) === filter);
}

export function countMediaByGallerySet<T extends { setId?: string | null }>(
  items: T[],
): { all: number; unsorted: number; bySet: Record<string, number> } {
  const bySet: Record<string, number> = {};
  let unsorted = 0;
  for (const item of items) {
    const sid = readMediaSetId(item);
    if (sid === null) {
      unsorted += 1;
    } else {
      bySet[sid] = (bySet[sid] ?? 0) + 1;
    }
  }
  return { all: items.length, unsorted, bySet };
}

export function sortGallerySets(sets: ApiGallerySet[]): ApiGallerySet[] {
  return [...sets].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.name.localeCompare(b.name);
  });
}

export function resolveAllSetsLabel(label?: string | null): string {
  const trimmed = label?.trim();
  return trimmed || DEFAULT_ALL_SETS_LABEL;
}

export function resolveAllSetsSortOrder(order?: number | null): number {
  return typeof order === "number" && Number.isFinite(order)
    ? Math.max(0, Math.floor(order))
    : 0;
}

/** Merge the “All” pill with named sets using shared sortOrder positions. */
export function buildSetsBarOrder(
  sets: ApiGallerySet[],
  allSortOrder?: number | null,
): string[] {
  const sorted = sortGallerySets(sets);
  const allOrder = resolveAllSetsSortOrder(allSortOrder);
  const entries: { id: string; sortOrder: number }[] = [
    { id: ALL_SETS_PILL_ID, sortOrder: allOrder },
    ...sorted.map((s) => ({ id: s.id, sortOrder: s.sortOrder })),
  ];
  entries.sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    if (a.id === ALL_SETS_PILL_ID) return -1;
    if (b.id === ALL_SETS_PILL_ID) return 1;
    return a.id.localeCompare(b.id);
  });
  return entries.map((e) => e.id);
}

/** Resolve sets bar settings from API payloads (snake_case tolerant). */
export function readSetsBarSettingsFromApiBody(body: unknown): {
  setsAllLabel?: string;
  setsAllSortOrder?: number;
} {
  if (!body || typeof body !== "object") return {};
  const o = body as Record<string, unknown>;
  const labelRaw = o.setsAllLabel ?? o.sets_all_label;
  const orderRaw = o.setsAllSortOrder ?? o.sets_all_sort_order;
  const setsAllLabel =
    typeof labelRaw === "string" && labelRaw.trim() ? labelRaw.trim() : undefined;
  const setsAllSortOrder =
    typeof orderRaw === "number" && Number.isFinite(orderRaw)
      ? Math.max(0, Math.floor(orderRaw))
      : undefined;
  return {
    ...(setsAllLabel ? { setsAllLabel } : {}),
    ...(setsAllSortOrder !== undefined ? { setsAllSortOrder } : {}),
  };
}

/** Resolve set id to send on upload; omit when viewing all (caller should block upload). */
export function uploadSetIdForFilter(filter: GallerySetFilter): string | undefined {
  if (filter === "all") return undefined;
  return filter;
}
