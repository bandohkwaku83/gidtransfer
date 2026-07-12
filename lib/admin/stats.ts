import adminApi from "./admin-client";
import type { StatsResponse } from "@/lib/admin/types";

export async function getStats(): Promise<StatsResponse> {
  const { data } = await adminApi.get<StatsResponse>("/api/admin/stats");
  return data;
}
