import adminApi from "./admin-client";
import type {
  GalleryDetail,
  GalleryFilters,
  GalleryListItem,
  PaginatedResponse,
} from "@/lib/admin/types";

export async function getGalleries(
  filters: GalleryFilters = {},
): Promise<PaginatedResponse<GalleryListItem>> {
  const { data } = await adminApi.get<PaginatedResponse<GalleryListItem>>(
    "/api/admin/galleries",
    { params: filters },
  );
  return data;
}

export async function getGallery(galleryId: string): Promise<GalleryDetail> {
  const { data } = await adminApi.get<{ gallery: GalleryDetail }>(
    `/api/admin/galleries/${galleryId}`,
  );
  return data.gallery;
}

export async function getPhotographerGalleries(
  userId: string,
  params: {
    status?: string;
    trashOnly?: string;
    page?: number;
    limit?: number;
  } = {},
): Promise<
  PaginatedResponse<GalleryListItem> & {
    photographer: {
      userId: string;
      email: string;
      companyName: string;
      companySlug: string;
      isActive: boolean;
    };
    counts: {
      all: number;
      draft: number;
      selecting: number;
      done: number;
      trash: number;
    };
  }
> {
  const { data } = await adminApi.get(
    `/api/admin/photographers/${userId}/galleries`,
    { params },
  );
  return data;
}

/** Share mutation responses are often partial — merge into current detail. */
export type GallerySharePatch = Partial<
  Omit<GalleryDetail, "share" | "selection">
> & {
  share?: Partial<GalleryDetail["share"]>;
  selection?: Partial<GalleryDetail["selection"]>;
};

export function mergeGalleryDetail(
  current: GalleryDetail,
  patch: GallerySharePatch,
): GalleryDetail {
  return {
    ...current,
    ...patch,
    share: patch.share
      ? { ...current.share, ...patch.share }
      : current.share,
    selection: patch.selection
      ? { ...current.selection, ...patch.selection }
      : current.selection,
    studio: patch.studio ?? current.studio,
    client: patch.client !== undefined ? patch.client : current.client,
    trash: patch.trash !== undefined ? patch.trash : current.trash,
    photographerGalleryCounts:
      patch.photographerGalleryCounts ?? current.photographerGalleryCounts,
  };
}

export async function revokeGalleryShare(
  galleryId: string,
  reason: string,
): Promise<GallerySharePatch> {
  const { data } = await adminApi.post<{ gallery: GallerySharePatch }>(
    `/api/admin/galleries/${galleryId}/share/revoke`,
    { reason },
  );
  return data.gallery;
}

export async function extendGalleryShare(
  galleryId: string,
  body: { reason: string; extendDays?: number; days?: number | null },
): Promise<GallerySharePatch> {
  const { data } = await adminApi.post<{ gallery: GallerySharePatch }>(
    `/api/admin/galleries/${galleryId}/share/extend`,
    body,
  );
  return data.gallery;
}

export async function patchGalleryShare(
  galleryId: string,
  body: {
    reason: string;
    allowDownloads?: boolean;
    selectionLocked?: boolean;
  },
): Promise<GallerySharePatch> {
  const { data } = await adminApi.patch<{ gallery: GallerySharePatch }>(
    `/api/admin/galleries/${galleryId}/share`,
    body,
  );
  return data.gallery;
}

export async function restoreGallery(
  galleryId: string,
  reason: string,
): Promise<void> {
  await adminApi.post(`/api/admin/galleries/${galleryId}/restore`, { reason });
}

export async function purgeGallery(
  galleryId: string,
  reason: string,
): Promise<void> {
  await adminApi.delete(`/api/admin/galleries/${galleryId}/purge`, {
    data: { reason },
  });
}
