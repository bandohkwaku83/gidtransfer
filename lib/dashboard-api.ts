import { sameOriginUploadsUrl } from "@/lib/api";
import { apiCacheKey, cachedApiCall } from "@/lib/api-cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { authedJson, HttpError } from "@/lib/http";
import type { WeeklyBar } from "@/lib/dashboard-chart-data";

import type { ApiClient } from "@/lib/clients-api";
import type { ApiFolder } from "@/lib/folders-api";

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
  clientId?: string;
  clientName: string;
  coverImageUrl?: string;
  status?: string;
  updatedAt?: string;
  createdAt?: string;
  eventDate?: string;
};

export type DashboardActivityItem = {
  action: string;
  targetType: string;
  targetName?: string;
  galleryId?: string;
  at: string;
  thumbnailUrl?: string;
  kind?: "new" | "updated" | "completed" | "selection";
};

export type DashboardStorage = {
  total: number;
  raws: number;
  selections: number;
  finals: number;
  planBytes: number;
  planName?: string;
};

export type DashboardWeeklyActivity = {
  today: number;
  thisWeek: number;
  previousWeek: number;
  todayDelta: number;
  weekDelta: number;
  chart: WeeklyBar[];
};

export type DashboardResponse = {
  user: DashboardUser;
  serverDate: string;
  stats: DashboardStats;
  recentGalleries: DashboardRecentGallery[];
  activity: DashboardActivityItem[];
  storage: DashboardStorage;
  weeklyActivity: DashboardWeeklyActivity;
};

export class DashboardApiError extends HttpError {}

export const DASHBOARD_HOME_LIST_LIMIT = 5;
export const LIVE_FEED_LIMIT = 2;

type BackendStats = {
  clients?: number;
  galleries?: number;
  inProgress?: number;
  completed?: number;
};

type BackendStorage = {
  usedBytes?: number;
  limitBytes?: number;
  planName?: string;
  breakdown?: {
    rawsBytes?: number;
    selectionsBytes?: number;
    finalsBytes?: number;
  };
};

type BackendWeeklySeries = {
  date?: string;
  label?: string;
  total?: number;
};

type BackendWeeklyActivity = {
  today?: number;
  thisWeek?: number;
  previousWeek?: number;
  trend?: number;
  chart?: {
    series?: BackendWeeklySeries[];
  };
};

type BackendActivity = {
  id?: string;
  galleryId?: string;
  name?: string;
  action?: string;
  actionLabel?: string;
  occurredAt?: string;
  thumbnailUrl?: string;
};

type BackendRecentGallery = {
  id?: string;
  name?: string;
  eventDate?: string;
  status?: string;
  coverImageUrl?: string;
  displayCoverUrl?: string;
  thumbnailUrl?: string;
  client?: { id?: string; name?: string };
  updatedAt?: string;
  createdAt?: string;
};

type BackendUser = {
  _id?: string;
  email?: string;
  studio?: { companyName?: string };
};

type BackendDashboardResponse = {
  stats?: BackendStats;
  storage?: BackendStorage;
  weeklyActivity?: BackendWeeklyActivity;
  recentActivity?: BackendActivity[];
  recentGalleries?: BackendRecentGallery[];
  user?: BackendUser;
};

function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url?.trim()) return undefined;
  return sameOriginUploadsUrl(url.trim());
}

function readUserName(user: BackendUser | undefined): string {
  const company = user?.studio?.companyName?.trim();
  if (company) return company;
  const email = user?.email?.trim();
  if (email) {
    const local = email.split("@")[0]?.trim();
    if (local) return local;
  }
  return "there";
}

function actionToKind(action?: string): DashboardActivityItem["kind"] {
  const a = (action ?? "").toLowerCase();
  if (a === "created" || a === "new") return "new";
  if (a === "delivered" || a === "completed" || a === "done") return "completed";
  if (a === "selection" || a === "selecting" || a === "proofing") return "selection";
  return "updated";
}

function mapStats(raw: BackendStats | undefined): DashboardStats {
  return {
    totalClients: raw?.clients ?? 0,
    totalGalleries: raw?.galleries ?? 0,
    inProgressGalleries: raw?.inProgress ?? 0,
    completedGalleries: raw?.completed ?? 0,
  };
}

function mapStorage(raw: BackendStorage | undefined): DashboardStorage {
  const breakdown = raw?.breakdown;
  return {
    total: raw?.usedBytes ?? 0,
    raws: breakdown?.rawsBytes ?? 0,
    selections: breakdown?.selectionsBytes ?? 0,
    finals: breakdown?.finalsBytes ?? 0,
    planBytes: raw?.limitBytes ?? 5 * 1024 * 1024 * 1024,
    planName: raw?.planName,
  };
}

function mapWeeklyActivity(raw: BackendWeeklyActivity | undefined): DashboardWeeklyActivity {
  const today = raw?.today ?? 0;
  const thisWeek = raw?.thisWeek ?? 0;
  const previousWeek = raw?.previousWeek ?? 0;
  const series = raw?.chart?.series ?? [];
  const chart: WeeklyBar[] = series.map((point) => ({
    dateKey: point.date ?? "",
    label: point.label ?? "",
    value: point.total ?? 0,
  }));

  const todayPoint = series[series.length - 1];
  const yesterdayPoint = series[series.length - 2];
  const todayDelta =
    todayPoint != null && yesterdayPoint != null
      ? (todayPoint.total ?? 0) - (yesterdayPoint.total ?? 0)
      : today;

  return {
    today,
    thisWeek,
    previousWeek,
    todayDelta,
    weekDelta: raw?.trend ?? thisWeek - previousWeek,
    chart,
  };
}

function mapRecentGallery(raw: BackendRecentGallery): DashboardRecentGallery | null {
  const id = raw.id?.trim();
  if (!id) return null;
  const cover =
    resolveMediaUrl(raw.displayCoverUrl) ??
    resolveMediaUrl(raw.coverImageUrl) ??
    resolveMediaUrl(raw.thumbnailUrl);
  return {
    id,
    title: raw.name?.trim() || undefined,
    clientId: raw.client?.id?.trim() || undefined,
    clientName: raw.client?.name?.trim() || "Client",
    coverImageUrl: cover,
    status: raw.status,
    updatedAt: raw.updatedAt,
    createdAt: raw.createdAt,
    eventDate: raw.eventDate,
  };
}

function mapActivity(raw: BackendActivity): DashboardActivityItem | null {
  const galleryId = raw.galleryId?.trim() || raw.id?.trim();
  const at = raw.occurredAt?.trim();
  if (!at) return null;
  const action = raw.actionLabel?.trim() || raw.action?.trim() || "Updated";
  const name = raw.name?.trim();
  return {
    action,
    targetType: "gallery",
    targetName: name,
    galleryId: galleryId || undefined,
    at,
    thumbnailUrl: resolveMediaUrl(raw.thumbnailUrl),
    kind: actionToKind(raw.action),
  };
}

function mapDashboardResponse(raw: BackendDashboardResponse): DashboardResponse {
  const userRaw = raw.user;
  const user: DashboardUser = {
    _id: userRaw?._id?.trim() || "",
    name: readUserName(userRaw),
    email: userRaw?.email?.trim() || "",
  };

  const recentGalleries = (raw.recentGalleries ?? [])
    .map(mapRecentGallery)
    .filter((g): g is DashboardRecentGallery => g != null);

  const activity = (raw.recentActivity ?? [])
    .map(mapActivity)
    .filter((a): a is DashboardActivityItem => a != null);

  const latestStamp =
    activity[0]?.at ??
    recentGalleries[0]?.updatedAt ??
    recentGalleries[0]?.createdAt ??
    new Date().toISOString();

  return {
    user,
    serverDate: latestStamp,
    stats: mapStats(raw.stats),
    recentGalleries,
    activity,
    storage: mapStorage(raw.storage),
    weeklyActivity: mapWeeklyActivity(raw.weeklyActivity),
  };
}

export function dashboardRecentGalleryToApiFolder(g: DashboardRecentGallery): ApiFolder {
  const title = g.title?.trim() || "";
  const clientObj: ApiClient = {
    _id: g.clientId?.trim() || `${g.id}-client`,
    name: g.clientName,
    email: "",
    contact: "",
    location: "",
  };
  return {
    _id: g.id,
    client: clientObj,
    eventName: title,
    eventDate: (g.eventDate ?? g.createdAt ?? "").slice(0, 10),
    description: g.clientName,
    coverImageUrl: g.coverImageUrl,
    status: g.status,
    createdAt: g.createdAt,
    updatedAt: g.updatedAt,
  };
}

export function activityItemToLabel(a: DashboardActivityItem): string {
  const target = a.targetName?.trim() || a.targetType;
  return `${a.action}, ${target}`;
}

export type FetchDashboardOptions = {
  recentLimit?: number;
  activityDays?: number;
};

export async function fetchDashboard(
  options: FetchDashboardOptions = {},
): Promise<DashboardResponse> {
  const recentLimit = options.recentLimit ?? 10;
  const activityDays = options.activityDays ?? 7;
  const qs = new URLSearchParams({
    recentLimit: String(recentLimit),
    activityDays: String(activityDays),
  });
  const path = `/api/dashboard?${qs.toString()}`;

  return cachedApiCall(
    apiCacheKey("GET", path),
    async () => {
      const raw = await authedJson<BackendDashboardResponse>(
        path,
        { method: "GET" },
        "Failed to load dashboard",
        DashboardApiError,
      );
      return mapDashboardResponse(raw);
    },
    { ttlMs: 30_000, tags: [CACHE_TAGS.dashboard] },
  );
}
