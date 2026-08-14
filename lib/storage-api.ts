import { getAuthToken } from "@/lib/auth-demo";
import { authedJson, HttpError } from "@/lib/http";
import {
  normalizePlanId,
  parsePlanFeatures,
  type BillingPlanId,
  type PlanFeatures,
} from "@/lib/plan-entitlements";

export class StorageApiError extends HttpError {}

export type StorageSortBy = "size" | "name";

export type StorageGalleryRow = {
  id: string;
  name: string;
  clientId: string | null;
  clientName: string;
  rawsBytes: number;
  selectionsBytes: number;
  finalsBytes: number;
  totalBytes: number;
};

export type StorageBreakdown = {
  rawsBytes: number;
  selectionsBytes: number;
  finalsBytes: number;
};

export type StorageSummary = {
  usedBytes: number;
  limitBytes: number;
  planName: string;
  planId: BillingPlanId;
  features: PlanFeatures;
  percentOfPlan: number;
  breakdown: StorageBreakdown;
  /** Present only when the API exposes video usage (rare; often only via VIDEO_LIMIT_REACHED). */
  videoUsedBytes: number | null;
  videoUploadLimitBytes: number | null;
};

export type StorageResponse = {
  summary: StorageSummary;
  galleries: StorageGalleryRow[];
  sort: { by: StorageSortBy; order: "asc" | "desc" };
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function formatStorageBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  let v = bytes;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u += 1;
  }
  const digits = u === 0 ? 0 : u === 1 ? 0 : v >= 10 ? 1 : 2;
  return `${v.toFixed(digits)} ${units[u]}`;
}

/** Prefer live bytes; fall back to the API's `percentOfPlan`. */
export function storageUsagePercent(
  summary: Pick<StorageSummary, "usedBytes" | "limitBytes" | "percentOfPlan">,
): number {
  if (summary.limitBytes > 0) {
    return Math.min(100, Math.max(0, (summary.usedBytes / summary.limitBytes) * 100));
  }
  return Math.min(100, Math.max(0, summary.percentOfPlan));
}

export function isStorageCapped(
  summary: Pick<StorageSummary, "usedBytes" | "limitBytes">,
): boolean {
  if (summary.limitBytes <= 0) return summary.usedBytes > 0;
  return summary.usedBytes >= summary.limitBytes;
}

export function parseStorageSummary(raw: unknown): StorageSummary {
  const o = asRecord(raw) ?? {};
  const breakdown = asRecord(o.breakdown) ?? {};
  const usedBytes = readNumber(o.usedBytes);
  const limitBytes = readNumber(o.limitBytes);
  const percentRaw = o.percentOfPlan;
  const percentOfPlan =
    typeof percentRaw === "number" && Number.isFinite(percentRaw)
      ? percentRaw
      : limitBytes > 0
        ? (usedBytes / limitBytes) * 100
        : 0;

  const videoUsedRaw = o.videoUsedBytes ?? o.videoUsed;
  const videoLimitRaw = o.videoUploadLimitBytes ?? o.videoLimitBytes;
  const videoUsedParsed =
    typeof videoUsedRaw === "number" || typeof videoUsedRaw === "string"
      ? readNumber(videoUsedRaw)
      : null;
  const videoLimitParsed =
    typeof videoLimitRaw === "number" || typeof videoLimitRaw === "string"
      ? readNumber(videoLimitRaw)
      : null;

  return {
    usedBytes,
    limitBytes,
    planName: readString(o.planName) ?? "Free",
    planId: normalizePlanId(readString(o.planId)) ?? "free",
    features: parsePlanFeatures(o.features),
    percentOfPlan,
    breakdown: {
      rawsBytes: readNumber(breakdown.rawsBytes),
      selectionsBytes: readNumber(breakdown.selectionsBytes),
      finalsBytes: readNumber(breakdown.finalsBytes),
    },
    videoUsedBytes:
      videoUsedParsed != null && videoUsedParsed >= 0 ? videoUsedParsed : null,
    videoUploadLimitBytes:
      videoLimitParsed != null && videoLimitParsed > 0 ? videoLimitParsed : null,
  };
}

function parseGalleryRow(raw: unknown): StorageGalleryRow | null {
  const o = asRecord(raw);
  if (!o) return null;
  const id = readString(o.id);
  if (!id) return null;
  const rawsBytes = readNumber(o.rawsBytes);
  const selectionsBytes = readNumber(o.selectionsBytes);
  const finalsBytes = readNumber(o.finalsBytes);
  const totalBytes = readNumber(o.totalBytes) || rawsBytes + selectionsBytes + finalsBytes;
  return {
    id,
    name: readString(o.name) ?? "Untitled",
    clientId: readString(o.clientId),
    clientName: readString(o.clientName) ?? "",
    rawsBytes,
    selectionsBytes,
    finalsBytes,
    totalBytes,
  };
}

function parseSort(
  raw: unknown,
  fallback: { by: StorageSortBy; order: "asc" | "desc" },
): { by: StorageSortBy; order: "asc" | "desc" } {
  const o = asRecord(raw);
  if (!o) return fallback;
  const by = o.by === "name" || o.by === "size" ? o.by : fallback.by;
  const order = o.order === "asc" || o.order === "desc" ? o.order : fallback.order;
  return { by, order };
}

export function parseStorageResponse(
  raw: unknown,
  fallbackSort: { by: StorageSortBy; order: "asc" | "desc" },
): StorageResponse {
  const o = asRecord(raw);
  return {
    summary: parseStorageSummary(o?.summary),
    galleries: Array.isArray(o?.galleries)
      ? o.galleries.flatMap((row) => {
          const parsed = parseGalleryRow(row);
          return parsed ? [parsed] : [];
        })
      : [],
    sort: parseSort(o?.sort, fallbackSort),
  };
}

function requireAuthToken(): string {
  const token = getAuthToken();
  if (!token) {
    throw new StorageApiError("Not signed in. Please log in again.", 401, null);
  }
  return token;
}

export async function fetchStorage(params: {
  sort?: StorageSortBy;
  order?: "asc" | "desc";
  signal?: AbortSignal;
} = {}): Promise<StorageResponse> {
  requireAuthToken();
  const sort = params.sort ?? "size";
  const order = params.order ?? (sort === "name" ? "asc" : "desc");
  const qs = new URLSearchParams({ sort, order });
  const raw = await authedJson<unknown>(
    `/api/storage?${qs.toString()}`,
    { method: "GET", signal: params.signal },
    "Failed to load storage",
    StorageApiError,
  );
  return parseStorageResponse(raw, { by: sort, order });
}
