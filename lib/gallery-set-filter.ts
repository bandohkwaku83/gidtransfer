import type { ApiGallerySet } from "@/lib/gallery-sets-api";

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

/** Resolve set id to send on upload; omit when viewing all (caller should block upload). */
export function uploadSetIdForFilter(filter: GallerySetFilter): string | undefined {
  if (filter === "all") return undefined;
  return filter;
}
