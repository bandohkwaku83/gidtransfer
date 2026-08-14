import adminApi from "./admin-client";
import type { PaginatedResponse, TrashItem } from "@/lib/admin/types";

export async function getTrash(params: {
  ownerId?: string;
  page?: number;
  limit?: number;
} = {}): Promise<
  PaginatedResponse<TrashItem> & { retentionDays: number }
> {
  const { data } = await adminApi.get("/api/admin/trash", { params });
  return data;
}

export async function purgeExpiredTrash(body: {
  reason: string;
  ownerId?: string;
}): Promise<{ galleries: number; photos: number; finals: number }> {
  const { data } = await adminApi.post<{
    result: { galleries: number; photos: number; finals: number };
  }>("/api/admin/trash/purge-expired", body);
  return data.result;
}

export async function emptyPhotographerTrash(
  userId: string,
  reason: string,
): Promise<void> {
  await adminApi.post(`/api/admin/photographers/${userId}/trash/empty`, {
    reason,
  });
}
