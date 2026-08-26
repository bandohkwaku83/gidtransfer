import { sameOriginUploadsUrl } from "@/lib/api";
import { apiCacheKey, cachedApiCall } from "@/lib/api-cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { authedJson, HttpError } from "@/lib/http";
import type { WeeklyBar } from "@/lib/dashboard-chart-data";

import type { ApiClient } from "@/lib/clients-api";
import type { ApiFolder } from "@/lib/folders-api";
import { parseStorageSummary } from "@/lib/storage-api";

export type DashboardUser = {
  _id: string;
  name: string;
  email: string;
  companySlug?: string;
};

export type DashboardStats = {
  totalClients: number;
  totalGalleries: number;
  inProgressGalleries: number;
  completedGalleries: number;
  draft?: number;
  selecting?: number;
  trash?: number;
};

export type DashboardRecentGallery = {
  id: string;
  title?: string;
  clientId?: string;
  clientName: string;
  coverImageUrl?: string;
  status?: string;
  statusLabel?: string;
  updatedAt?: string;
  createdAt?: string;
  eventDate?: string;
};

export type DashboardActivityItem = {
  id?: string;
  action: string;
  actionLabel?: string;
  targetType: string;
  targetName?: string;
  clientName?: string;
  galleryId?: string;
  at: string;
  thumbnailUrl?: string;
  status?: string;
  statusLabel?: string;
  kind?: "new" | "updated" | "completed" | "selection";
};

export type DashboardNewClient = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  createdAt: string;
};

export type DashboardCurrentSelection = {
  id: string;
  galleryId: string;
  galleryName: string;
  clientName: string;
  status?: string;
  statusLabel?: string;
  selectionStatus?: string;
  selectedCount: number;
  maxSelections: number | null;
  selectionsRemaining: number | null;
  progressPercent: number;
  progressLabel: string;
  lastSelectedAt?: string;
  updatedAt?: string;
  thumbnailUrl?: string;
};

export type DashboardSchedule = {
  id: string;
  title: string;
  startsAt: string;
  endsAt?: string;
  clientName: string;
  clientId?: string;
  location?: string;
  coordinates?: { lat: number; lng: number } | null;
  shootType?: string;
  category?: string;
  color?: string;
  description?: string;
};

export type DashboardStorage = {
  total: number;
  raws: number;
  selections: number;
  finals: number;
  planBytes: number;
  planName?: string;
  percentOfPlan: number;
  focusLabel?: string;
};

export type DashboardWeeklyActivity = {
  today: number;
  thisWeek: number;
  previousWeek: number;
  todayDelta: number;
  weekDelta: number;
  status?: string;
  statusLabel?: string;
  chart: WeeklyBar[];
};

export type DashboardResponse = {
  user: DashboardUser;
  serverDate: string;
  stats: DashboardStats;
  recentGalleries: DashboardRecentGallery[];
  newGalleries: DashboardRecentGallery[];
  activity: DashboardActivityItem[];
  newClients: DashboardNewClient[];
  currentSelections: DashboardCurrentSelection[];
  schedules: DashboardSchedule[];
  storage: DashboardStorage;
  weeklyActivity: DashboardWeeklyActivity;
};

export class DashboardApiError extends HttpError {}

export const DASHBOARD_HOME_LIST_LIMIT = 5;
export const LIVE_FEED_LIMIT = 4;
export const DASHBOARD_CLIENTS_LIMIT = 4;
export const DASHBOARD_SELECTIONS_LIMIT = 4;
export const DASHBOARD_SCHEDULES_LIMIT = 12;

type BackendStats = {
  clients?: number;
  galleries?: number;
  inProgress?: number;
  completed?: number;
  draft?: number;
  selecting?: number;
  trash?: number;
};

type BackendStorage = {
  usedBytes?: number;
  limitBytes?: number;
  planName?: string;
  percentOfPlan?: number;
  breakdown?: {
    rawsBytes?: number;
    selectionsBytes?: number;
    finalsBytes?: number;
  };
  focus?: {
    categoryLabel?: string;
    percentOfTotalLabel?: string;
  };
};

type BackendWeeklySeries = {
  date?: string;
  label?: string;
  selections?: number;
  galleryEvents?: number;
  total?: number;
};

type BackendWeeklyActivity = {
  today?: number;
  thisWeek?: number;
  previousWeek?: number;
  trend?: number;
  status?: string;
  statusLabel?: string;
  chart?: {
    days?: number;
    series?: BackendWeeklySeries[];
  };
};

type BackendClientRef = {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
};

type BackendActivity = {
  id?: string;
  galleryId?: string;
  name?: string;
  title?: string;
  action?: string;
  actionLabel?: string;
  status?: string;
  statusLabel?: string;
  client?: BackendClientRef;
  project?: string;
  occurredAt?: string;
  date?: string;
  thumbnailUrl?: string;
};

type BackendRecentGallery = {
  id?: string;
  name?: string;
  description?: string;
  eventDate?: string;
  status?: string;
  statusLabel?: string;
  coverImageUrl?: string | null;
  displayCoverUrl?: string | null;
  thumbnailUrl?: string | null;
  client?: BackendClientRef;
  updatedAt?: string;
  createdAt?: string;
};

type BackendNewClient = {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  createdAt?: string;
  dateAdded?: string;
};

type BackendCurrentSelection = {
  id?: string;
  galleryId?: string;
  name?: string;
  galleryName?: string;
  status?: string;
  statusLabel?: string;
  selectionStatus?: string;
  client?: BackendClientRef;
  selectedCount?: number;
  maxSelections?: number | null;
  selectionsRemaining?: number | null;
  progressPercent?: number;
  progressLabel?: string;
  lastSelectedAt?: string;
  updatedAt?: string;
  thumbnailUrl?: string | null;
};

type BackendSchedule = {
  id?: string;
  bookingId?: string;
  title?: string;
  date?: string;
  startsAt?: string;
  endsAt?: string;
  time?: string;
  client?: BackendClientRef | string | null;
  location?: string;
  locationLabel?: string;
  coordinates?: unknown;
  shootType?: string;
  category?: string;
  color?: string;
  description?: string;
};

type BackendUser = {
  id?: string;
  _id?: string;
  email?: string;
  companyName?: string;
  companySlug?: string;
  studio?: { companyName?: string; companySlug?: string };
};

type BackendDashboardResponse = {
  stats?: BackendStats;
  storage?: BackendStorage;
  weeklyActivity?: BackendWeeklyActivity;
  recentActivity?: BackendActivity[];
  newClients?: BackendNewClient[];
  currentSelections?: BackendCurrentSelection[];
  newGalleries?: BackendRecentGallery[];
  schedules?: BackendSchedule[];
  recentGalleries?: BackendRecentGallery[];
  user?: BackendUser;
};

function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url?.trim()) return undefined;
  const normalized = sameOriginUploadsUrl(url.trim());
  return normalized || undefined;
}

function readUserName(user: BackendUser | undefined): string {
  const company =
    user?.companyName?.trim() || user?.studio?.companyName?.trim();
  if (company) return company;
  const email = user?.email?.trim();
  if (email) {
    const local = email.split("@")[0]?.trim();
    if (local) return local;
  }
  return "there";
}

function actionToKind(action?: string, status?: string): DashboardActivityItem["kind"] {
  const a = (action ?? "").toLowerCase();
  const s = (status ?? "").toLowerCase();
  if (a === "created" || a === "new") return "new";
  if (a === "delivered" || a === "completed" || a === "done" || s === "completed") {
    return "completed";
  }
  if (
    a === "selection" ||
    a === "selecting" ||
    a === "proofing" ||
    s === "selecting" ||
    s === "selection"
  ) {
    return "selection";
  }
  return "updated";
}

function mapStats(raw: BackendStats | undefined): DashboardStats {
  return {
    totalClients: raw?.clients ?? 0,
    totalGalleries: raw?.galleries ?? 0,
    inProgressGalleries: raw?.inProgress ?? 0,
    completedGalleries: raw?.completed ?? 0,
    draft: raw?.draft,
    selecting: raw?.selecting,
    trash: raw?.trash,
  };
}

function mapStorage(raw: BackendStorage | undefined): DashboardStorage {
  const summary = parseStorageSummary(raw);
  return {
    total: summary.usedBytes,
    raws: summary.breakdown.rawsBytes,
    selections: summary.breakdown.selectionsBytes,
    finals: summary.breakdown.finalsBytes,
    planBytes: summary.limitBytes,
    planName: summary.planName,
    percentOfPlan: summary.percentOfPlan,
    focusLabel:
      raw?.focus?.percentOfTotalLabel?.trim() ||
      raw?.focus?.categoryLabel?.trim() ||
      undefined,
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
    value: point.total ?? (point.selections ?? 0) + (point.galleryEvents ?? 0),
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
    status: raw?.status,
    statusLabel: raw?.statusLabel,
    chart,
  };
}

function mapRecentGallery(raw: BackendRecentGallery): DashboardRecentGallery | null {
  const id = raw.id?.trim();
  if (!id) return null;
  // Prefer real covers; `thumbnailUrl` is often a weaker/legacy field.
  const cover =
    resolveMediaUrl(raw.coverImageUrl) ??
    resolveMediaUrl(raw.displayCoverUrl) ??
    resolveMediaUrl(raw.thumbnailUrl);
  return {
    id,
    title: raw.name?.trim() || undefined,
    clientId: raw.client?.id?.trim() || undefined,
    clientName: raw.client?.name?.trim() || "Client",
    coverImageUrl: cover,
    status: raw.status ?? undefined,
    statusLabel: raw.statusLabel?.trim() || undefined,
    updatedAt: raw.updatedAt,
    createdAt: raw.createdAt,
    eventDate: raw.eventDate,
  };
}

function mapActivity(raw: BackendActivity): DashboardActivityItem | null {
  const galleryId = raw.galleryId?.trim() || raw.id?.trim();
  const at = raw.occurredAt?.trim() || raw.date?.trim();
  if (!at) return null;
  const actionLabel = raw.actionLabel?.trim() || undefined;
  const action = actionLabel || raw.action?.trim() || "Updated";
  const name = raw.title?.trim() || raw.name?.trim() || raw.project?.trim();
  return {
    id: raw.id?.trim(),
    action,
    actionLabel,
    targetType: "gallery",
    targetName: name,
    clientName: raw.client?.name?.trim() || undefined,
    galleryId: galleryId || undefined,
    at,
    thumbnailUrl: resolveMediaUrl(raw.thumbnailUrl),
    status: raw.status,
    statusLabel: raw.statusLabel?.trim() || undefined,
    kind: actionToKind(raw.action, raw.status),
  };
}

function mapNewClient(raw: BackendNewClient): DashboardNewClient | null {
  const id = raw.id?.trim();
  const name = raw.name?.trim();
  const createdAt = raw.dateAdded?.trim() || raw.createdAt?.trim();
  if (!id || !name || !createdAt) return null;
  return {
    id,
    name,
    email: raw.email?.trim() || undefined,
    phone: raw.phone?.trim() || undefined,
    location: raw.location?.trim() || undefined,
    createdAt,
  };
}

function mapCurrentSelection(raw: BackendCurrentSelection): DashboardCurrentSelection | null {
  const galleryId = raw.galleryId?.trim() || raw.id?.trim();
  if (!galleryId) return null;
  const galleryName =
    raw.galleryName?.trim() || raw.name?.trim() || "Gallery";
  const selectedCount = raw.selectedCount ?? 0;
  const maxSelections =
    typeof raw.maxSelections === "number" && Number.isFinite(raw.maxSelections)
      ? raw.maxSelections
      : null;
  const progressPercent =
    typeof raw.progressPercent === "number" && Number.isFinite(raw.progressPercent)
      ? Math.max(0, Math.min(100, raw.progressPercent))
      : maxSelections && maxSelections > 0
        ? Math.round((selectedCount / maxSelections) * 100)
        : 0;
  const progressLabel =
    raw.progressLabel?.trim() ||
    (maxSelections != null
      ? `${selectedCount} of ${maxSelections} selected`
      : `${selectedCount} selected`);

  return {
    id: raw.id?.trim() || galleryId,
    galleryId,
    galleryName,
    clientName: raw.client?.name?.trim() || "Client",
    status: raw.status,
    statusLabel: raw.statusLabel?.trim() || undefined,
    selectionStatus: raw.selectionStatus,
    selectedCount,
    maxSelections,
    selectionsRemaining:
      typeof raw.selectionsRemaining === "number" ? raw.selectionsRemaining : null,
    progressPercent,
    progressLabel,
    lastSelectedAt: raw.lastSelectedAt,
    updatedAt: raw.updatedAt,
    thumbnailUrl: resolveMediaUrl(raw.thumbnailUrl),
  };
}

function parseCoordinates(raw: unknown): { lat: number; lng: number } | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const lat = typeof o.lat === "number" ? o.lat : typeof o.latitude === "number" ? o.latitude : null;
  const lng =
    typeof o.lng === "number"
      ? o.lng
      : typeof o.lon === "number"
        ? o.lon
        : typeof o.longitude === "number"
          ? o.longitude
          : null;
  if (lat == null || lng == null) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function mapSchedule(raw: BackendSchedule): DashboardSchedule | null {
  const id = raw.id?.trim() || raw.bookingId?.trim();
  const startsAt = raw.startsAt?.trim() || raw.time?.trim() || raw.date?.trim();
  const title = raw.title?.trim() || raw.shootType?.trim() || "Shoot";
  if (!id || !startsAt) return null;
  const location = raw.locationLabel?.trim() || raw.location?.trim() || undefined;
  const clientRaw = raw.client;
  const clientName =
    (clientRaw && typeof clientRaw === "object" && clientRaw.name?.trim()) ||
    (typeof clientRaw === "string" ? clientRaw.trim() : "") ||
    "Client";
  const clientId =
    clientRaw && typeof clientRaw === "object" ? clientRaw.id?.trim() : undefined;
  return {
    id,
    title,
    startsAt,
    endsAt: raw.endsAt?.trim() || undefined,
    clientName,
    clientId,
    location,
    coordinates: parseCoordinates(raw.coordinates),
    shootType: raw.shootType?.trim() || undefined,
    category: raw.category?.trim() || undefined,
    color: raw.color?.trim() || undefined,
    description: raw.description?.trim() || undefined,
  };
}

function mapDashboardResponse(raw: BackendDashboardResponse): DashboardResponse {
  const userRaw = raw.user;
  const user: DashboardUser = {
    _id: userRaw?.id?.trim() || userRaw?._id?.trim() || "",
    name: readUserName(userRaw),
    email: userRaw?.email?.trim() || "",
    companySlug:
      userRaw?.companySlug?.trim() || userRaw?.studio?.companySlug?.trim() || undefined,
  };

  const newGalleries = (raw.newGalleries ?? [])
    .map(mapRecentGallery)
    .filter((g): g is DashboardRecentGallery => g != null);

  const legacyRecent = (raw.recentGalleries ?? [])
    .map(mapRecentGallery)
    .filter((g): g is DashboardRecentGallery => g != null);

  /** Prefer `newGalleries` for the New galleries section; fall back to legacy list. */
  const recentGalleries = newGalleries.length > 0 ? newGalleries : legacyRecent;

  const activity = (raw.recentActivity ?? [])
    .map(mapActivity)
    .filter((a): a is DashboardActivityItem => a != null);

  const newClients = (raw.newClients ?? [])
    .map(mapNewClient)
    .filter((c): c is DashboardNewClient => c != null);

  const currentSelections = (raw.currentSelections ?? [])
    .map(mapCurrentSelection)
    .filter((s): s is DashboardCurrentSelection => s != null);

  const schedules = (raw.schedules ?? [])
    .map(mapSchedule)
    .filter((s): s is DashboardSchedule => s != null);

  const latestStamp =
    activity[0]?.at ??
    schedules[0]?.startsAt ??
    recentGalleries[0]?.updatedAt ??
    recentGalleries[0]?.createdAt ??
    new Date().toISOString();

  return {
    user,
    serverDate: latestStamp,
    stats: mapStats(raw.stats),
    recentGalleries,
    newGalleries: newGalleries.length > 0 ? newGalleries : recentGalleries,
    activity,
    newClients,
    currentSelections,
    schedules,
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
  const hasCover = Boolean(g.coverImageUrl?.trim());
  return {
    _id: g.id,
    client: clientObj,
    eventName: title,
    eventDate: (g.eventDate ?? g.createdAt ?? "").slice(0, 10),
    description: g.clientName,
    coverImageUrl: g.coverImageUrl,
    /** Custom cover from dashboard → do not force studio default over it. */
    usingDefaultCover: !hasCover,
    status: g.status,
    createdAt: g.createdAt,
    updatedAt: g.updatedAt,
  };
}

export function activityItemToLabel(a: DashboardActivityItem): string {
  const target = a.targetName?.trim() || a.targetType;
  const action = a.actionLabel?.trim() || a.action;
  return `${action}, ${target}`;
}

export type FetchDashboardOptions = {
  activityLimit?: number;
  clientsLimit?: number;
  selectionsLimit?: number;
  galleriesLimit?: number;
  schedulesLimit?: number;
  recentLimit?: number;
  activityDays?: number;
};

export async function fetchDashboard(
  options: FetchDashboardOptions = {},
): Promise<DashboardResponse> {
  const activityLimit = options.activityLimit ?? LIVE_FEED_LIMIT;
  const clientsLimit = options.clientsLimit ?? DASHBOARD_CLIENTS_LIMIT;
  const selectionsLimit = options.selectionsLimit ?? DASHBOARD_SELECTIONS_LIMIT;
  const galleriesLimit = options.galleriesLimit ?? DASHBOARD_HOME_LIST_LIMIT;
  const schedulesLimit = options.schedulesLimit ?? DASHBOARD_SCHEDULES_LIMIT;
  const recentLimit = options.recentLimit ?? 10;
  const activityDays = options.activityDays ?? 7;

  const qs = new URLSearchParams({
    activityLimit: String(activityLimit),
    clientsLimit: String(clientsLimit),
    selectionsLimit: String(selectionsLimit),
    galleriesLimit: String(galleriesLimit),
    schedulesLimit: String(schedulesLimit),
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
