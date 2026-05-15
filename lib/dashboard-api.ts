import type { ApiClient } from "@/lib/clients-api";
import type { ApiFolder } from "@/lib/folders-api";
import { authedFetch, extractMessage, HttpError, parseJson } from "@/lib/http";

export type DashboardUser = {
  _id: string;
  name: string;
  email: string;
};

export type DashboardStats = {
  totalClients: number;
  totalGalleries: number;
  inProgressGalleries: number;
  completedGalleries: number;
};

export type DashboardRecentGallery = {
  id: string;
  title?: string;
  clientName: string;
  coverImageUrl?: string;
  status?: string;
  updatedAt?: string;
  createdAt?: string;
};

export type DashboardActivityItem = {
  action: string;
  targetType: string;
  targetName?: string;
  galleryId?: string;
  at: string;
};

export type DashboardResponse = {
  user: DashboardUser;
  serverDate: string;
  stats: DashboardStats;
  recentGalleries: DashboardRecentGallery[];
  activity: DashboardActivityItem[];
};

export class DashboardApiError extends HttpError {}

/** Map dashboard recent gallery row to {@link ApiFolder} for shared card UI. */
export function dashboardRecentGalleryToApiFolder(g: DashboardRecentGallery): ApiFolder {
  const title = g.title?.trim() || "";
  const clientObj: ApiClient = {
    _id: `${g.id}-client`,
    name: g.clientName,
    email: "",
    contact: "",
    location: "",
  };
  return {
    _id: g.id,
    client: clientObj,
    eventName: title,
    eventDate: (g.createdAt ?? "").slice(0, 10),
    description: g.clientName,
    coverImageUrl: g.coverImageUrl,
    status: g.status,
    createdAt: g.createdAt,
    updatedAt: g.updatedAt,
  };
}

export function activityItemToLabel(a: DashboardActivityItem): string {
  const target = a.targetName?.trim() || a.targetType;
  return `${a.action} · ${target}`;
}

/** Dashboard home shows this many recent galleries and activity rows (newest first). */
export const DASHBOARD_HOME_LIST_LIMIT = 6;

/**
 * GET /api/dashboard — aggregated stats, recent galleries, activity.
 * Requires a stored Bearer token. Uses same-origin `/api/dashboard` (Next rewrite → backend).
 * Prefer returning at least {@link DASHBOARD_HOME_LIST_LIMIT} items each for `recentGalleries` and `activity` so the home grid is filled.
 */
export async function fetchDashboard(): Promise<DashboardResponse> {
  const res = await authedFetch("/api/dashboard", { method: "GET", cache: "no-store" });
  const body = await parseJson(res);
  if (!res.ok) {
    throw new DashboardApiError(
      extractMessage(body, `Dashboard request failed (${res.status})`),
      res.status,
      body,
    );
  }
  return body as DashboardResponse;
}
