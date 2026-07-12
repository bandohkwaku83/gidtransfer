import adminApi from "./admin-client";
import type { PaginatedResponse, SmsSenderItem } from "@/lib/admin/types";

export async function getSmsSenderIds(params: {
  status?: string;
  page?: number;
  limit?: number;
} = {}): Promise<PaginatedResponse<SmsSenderItem>> {
  const { data } = await adminApi.get<PaginatedResponse<SmsSenderItem>>(
    "/api/admin/sms/sender-ids",
    { params },
  );
  return data;
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
