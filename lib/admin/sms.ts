import adminApi from "./admin-client";
import type { PaginatedResponse, SmsSenderItem } from "@/lib/admin/types";

export async function getSmsSenderIds(params: {
  status?: string;
  page?: number;
  limit?: number;
} = {}): Promise<PaginatedResponse<SmsSenderItem>> {
  const { data } = await adminApi.get<{
    items: SmsSenderItem[];
    pagination?: PaginatedResponse<SmsSenderItem>["pagination"];
  }>("/api/admin/sms/sender-ids", { params });

  const items = data.items ?? [];
  const page = params.page ?? 1;
  const limit = params.limit ?? (items.length || 50);

  // API may return a flat list without pagination.
  return {
    items,
    pagination: data.pagination ?? {
      page,
      limit,
      total: items.length,
      totalPages: 1,
      hasMore: false,
    },
  };
}

export async function approveSmsSender(userId: string): Promise<void> {
  await adminApi.patch(`/api/admin/sms/sender-ids/${userId}/approve`);
}

export async function rejectSmsSender(
  userId: string,
  reason?: string,
): Promise<void> {
  await adminApi.patch(`/api/admin/sms/sender-ids/${userId}/reject`, {
    reason,
  });
}
