import adminApi from "./admin-client";
import type { FlaggedFinal, PaginatedResponse } from "@/lib/admin/types";

export async function getFlaggedFinals(params: {
  ownerId?: string;
  page?: number;
  limit?: number;
} = {}): Promise<PaginatedResponse<FlaggedFinal>> {
  const { data } = await adminApi.get<PaginatedResponse<FlaggedFinal>>(
    "/api/admin/moderation/flagged-finals",
    { params },
  );
  return data;
}
