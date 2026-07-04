/** Cache tag helpers for targeted invalidation without clearing unrelated entries. */

export function galleryDetailTag(galleryId: string): string {
  return `gallery:${galleryId.trim()}`;
}

export function galleryMediaTag(galleryId: string): string {
  return `gallery-media:${galleryId.trim()}`;
}

export const CACHE_TAGS = {
  clients: "clients",
  galleries: "galleries",
  dashboard: "dashboard",
  settings: "settings",
} as const;

export function invalidateGalleryCaches(galleryId?: string): string[] {
  const tags: string[] = [CACHE_TAGS.galleries, CACHE_TAGS.dashboard];
  if (galleryId?.trim()) {
    tags.push(galleryDetailTag(galleryId), galleryMediaTag(galleryId));
  }
  return tags;
}
