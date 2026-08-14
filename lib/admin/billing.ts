import adminApi from "./admin-client";
import type {
  BillingEvent,
  BillingPlan,
  LimitOverride,
  PaginatedResponse,
} from "@/lib/admin/types";

export async function getBillingPlans(): Promise<BillingPlan[]> {
  const { data } = await adminApi.get<{ plans: BillingPlan[] }>(
    "/api/admin/billing/plans",
  );
  return data.plans;
}

export async function updateBillingPlan(
  planId: string,
  body: {
    reason: string;
    storageLimitBytes?: number;
    maxGalleries?: number | null;
    priceGhs?: number;
    perks?: string[];
    description?: string;
    name?: string;
  },
): Promise<BillingPlan> {
  const { data } = await adminApi.patch<{ plan: BillingPlan }>(
    `/api/admin/billing/plans/${planId}`,
    body,
  );
  return data.plan;
}

export async function setLimitOverride(
  userId: string,
  body:
    | {
        reason: string;
        storageLimitBytes?: number;
        maxGalleries?: number | null;
        expiresInDays?: number;
      }
    | { clear: true; reason: string },
): Promise<{
  planId: string;
  planName: string;
  storageLimitBytes: number;
  storageLabel: string;
  maxGalleries: number | null;
  status: string;
  limitOverride: LimitOverride | null;
}> {
  const { data } = await adminApi.put<{
    subscription: {
      planId: string;
      planName: string;
      storageLimitBytes: number;
      storageLabel: string;
      maxGalleries: number | null;
      status: string;
      limitOverride: LimitOverride | null;
    };
  }>(`/api/admin/photographers/${userId}/limit-override`, body);
  return data.subscription;
}

export async function getBillingEvents(params: {
  category?: string;
  userId?: string;
  eventType?: string;
  reference?: string;
  page?: number;
  limit?: number;
} = {}): Promise<PaginatedResponse<BillingEvent>> {
  const { data } = await adminApi.get<PaginatedResponse<BillingEvent>>(
    "/api/admin/billing/events",
    { params },
  );
  return data;
}
