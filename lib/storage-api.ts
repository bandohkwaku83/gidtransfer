import { getAuthToken } from "@/lib/auth-demo";
import { authedJson, HttpError } from "@/lib/http";

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

export type StorageSummary = {
  usedBytes: number;
  limitBytes: number;
  planName: string;
  percentOfPlan: number;
  breakdown: {
    rawsBytes: number;
    selectionsBytes: number;
    finalsBytes: number;
  };
};

export type StorageResponse = {
  summary: StorageSummary;
  galleries: StorageGalleryRow[];
  sort: { by: StorageSortBy; order: "asc" | "desc" };
};

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
  const raw = await authedJson<StorageResponse | null>(
    `/api/storage?${qs.toString()}`,
    { method: "GET", signal: params.signal },
    "Failed to load storage",
    StorageApiError,
  );
  const data = raw && typeof raw === "object" ? raw : null;
  return {
    summary: data?.summary ?? {
      usedBytes: 0,
      limitBytes: 0,
      planName: "",
      percentOfPlan: 0,
      breakdown: { rawsBytes: 0, selectionsBytes: 0, finalsBytes: 0 },
    },
    galleries: Array.isArray(data?.galleries) ? data.galleries : [],
    sort: data?.sort ?? { by: sort, order },
  };
}
