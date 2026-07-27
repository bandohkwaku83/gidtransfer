/** Shared gallery photo search filters (API query params — not OpenSearch). */

export type GalleryPhotoSearchFilters = {
  /** Free-text query → `q` */
  q: string;
  /** Scene label → `scene` (e.g. ceremony) */
  scene: string;
  /** AI suggested picks → `suggested=true` */
  suggested: boolean;
  /** Blurry photos → `blurry=true` */
  blurry: boolean;
  /** Minimum AI quality score → `minQuality` */
  minQuality: number | null;
};

export const EMPTY_GALLERY_PHOTO_SEARCH: GalleryPhotoSearchFilters = {
  q: "",
  scene: "",
  suggested: false,
  blurry: false,
  minQuality: null,
};

/** Common scene chip values (free-text `scene` still accepted). */
export const GALLERY_PHOTO_SCENE_CHIPS = [
  "ceremony",
  "reception",
  "portraits",
  "details",
  "getting-ready",
] as const;

export const GALLERY_PHOTO_MIN_QUALITY_PRESETS = [50, 70, 85] as const;

export function galleryPhotoSearchActive(
  filters: Pick<
    GalleryPhotoSearchFilters,
    "q" | "scene" | "suggested" | "blurry" | "minQuality"
  >,
): boolean {
  return (
    Boolean(filters.q.trim()) ||
    Boolean(filters.scene.trim()) ||
    filters.suggested ||
    filters.blurry ||
    (filters.minQuality != null && filters.minQuality > 0)
  );
}

/** Append non-empty search params to a URLSearchParams instance. */
export function appendGalleryPhotoSearchParams(
  qs: URLSearchParams,
  filters: GalleryPhotoSearchFilters,
): void {
  const q = filters.q.trim();
  if (q) qs.set("q", q);
  const scene = filters.scene.trim();
  if (scene) qs.set("scene", scene);
  if (filters.suggested) qs.set("suggested", "true");
  if (filters.blurry) qs.set("blurry", "true");
  if (filters.minQuality != null && filters.minQuality > 0) {
    qs.set("minQuality", String(Math.round(filters.minQuality)));
  }
}

export type GalleryPhotoSearchMeta = {
  engine?: string;
  q?: string;
  filters?: Record<string, unknown>;
};

export function readGalleryPhotoSearchMeta(body: unknown): GalleryPhotoSearchMeta | undefined {
  if (!body || typeof body !== "object") return undefined;
  const raw = (body as Record<string, unknown>).search;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const o = raw as Record<string, unknown>;
  const engine = typeof o.engine === "string" ? o.engine : undefined;
  const q = typeof o.q === "string" ? o.q : undefined;
  const filters =
    o.filters && typeof o.filters === "object" && !Array.isArray(o.filters)
      ? (o.filters as Record<string, unknown>)
      : undefined;
  if (!engine && q == null && !filters) return undefined;
  return {
    ...(engine ? { engine } : {}),
    ...(q != null ? { q } : {}),
    ...(filters ? { filters } : {}),
  };
}
