"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, FolderOpen, Plus, Sparkles, Users } from "lucide-react";
import { DashboardOverviewRow } from "@/components/dashboard/dashboard-overview-row";
import { DashboardStatCards } from "@/components/dashboard/dashboard-stat-cards";
import { DashboardActivityPanel } from "@/components/dashboard/dashboard-activity-panel";
import {
  ChartCardSkeleton,
  StorageBreakdownCard,
  WeeklyActivityCard,
} from "@/components/dashboard/dashboard-charts";
import { getActivePlanDefinition } from "@/lib/subscription-plan";
import type { DashboardStatItem } from "@/components/dashboard/dashboard-stat-strip";
import type { WeeklyBar } from "@/lib/dashboard-chart-data";
import {
  activityItemToLabel,
  DASHBOARD_HOME_LIST_LIMIT,
  dashboardRecentGalleryToApiFolder,
  DashboardApiError,
  fetchDashboard,
  LIVE_FEED_LIMIT,
  type DashboardStats,
  type DashboardWeeklyActivity,
} from "@/lib/dashboard-api";
import { getAuth, getAuthToken } from "@/lib/auth-demo";
import { CreateClientModal } from "@/components/photographer/create-client-modal";
import { CreateFolderModal } from "@/components/photographer/create-folder-modal";
import { GalleryPreviewCard } from "@/components/photographer/gallery-preview-card";
import {
  apiFolderStatusToUi,
  getFolderClientName,
  listFolders,
  type ApiFolder,
} from "@/lib/folders-api";
import { resolveFolderCoverSrc } from "@/lib/folders/helpers";
import { listClients } from "@/lib/clients-api";
import { getSettings, getSettingsDefaultCoverUrl } from "@/lib/settings-api";
import { GalleryCardSkeleton } from "@/components/ui/skeletons";

function firstWordFromName(name: string): string {
  const t = name.trim();
  if (!t) return "";
  const first = t.split(/\s+/)[0];
  return first ?? t;
}

function firstNameFromAuth(): string {
  if (typeof window === "undefined") return "there";
  const a = getAuth();
  const n = a?.user?.name?.trim();
  if (n) {
    const first = n.split(/\s+/)[0];
    if (first) return first;
  }
  const email = a?.email?.trim();
  if (email) {
    const local = email.split("@")[0];
    if (local) return local;
  }
  return "there";
}

type ActivityRow = {
  title: string;
  when: string;
  galleryId?: string;
  coverUrl?: string | null;
  kind?: "new" | "updated" | "completed" | "selection";
};

export default function DashboardPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [folders, setFolders] = useState<ApiFolder[]>([]);
  const [clientCount, setClientCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("there");
  const [clientNameById, setClientNameById] = useState<Map<string, string>>(new Map());
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [serverDateIso, setServerDateIso] = useState<string | null>(null);
  const [dashboardActivity, setDashboardActivity] = useState<ActivityRow[]>([]);
  const [storageBytes, setStorageBytes] = useState<{
    total: number;
    raws: number;
    selections: number;
    finals: number;
    planBytes: number;
  } | null>(null);
  const [weeklyFromApi, setWeeklyFromApi] = useState<DashboardWeeklyActivity | null>(null);
  const [studioDefaultCoverUrl, setStudioDefaultCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    setGreeting(firstNameFromAuth());
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getSettings().then((settings) => {
      if (!cancelled) setStudioDefaultCoverUrl(getSettingsDefaultCoverUrl(settings));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (token) {
        try {
          const d = await fetchDashboard();
          setStats(d.stats);
          setServerDateIso(d.serverDate);
          const fromUser = firstWordFromName(d.user.name);
          setGreeting(fromUser || firstNameFromAuth());
          setFolders(d.recentGalleries.map(dashboardRecentGalleryToApiFolder));
          setClientCount(d.stats.totalClients);
          const clientMap = new Map<string, string>();
          for (const g of d.recentGalleries) {
            if (g.clientId) clientMap.set(g.clientId, g.clientName);
          }
          setClientNameById(clientMap);
          setDashboardActivity(
            d.activity.map((a) => ({
              title: activityItemToLabel(a),
              when: a.at,
              galleryId: a.galleryId,
              coverUrl: a.thumbnailUrl ?? null,
              kind: a.kind,
            })),
          );
          setStorageBytes({
            total: d.storage.total,
            raws: d.storage.raws,
            selections: d.storage.selections,
            finals: d.storage.finals,
            planBytes: d.storage.planBytes,
          });
          setWeeklyFromApi(d.weeklyActivity);
          return;
        } catch (e) {
          if (e instanceof DashboardApiError && e.status === 401) return;
          console.warn("[dashboard] GET /api/dashboard failed, using folder/client lists", e);
        }
      }

      setStats(null);
      setServerDateIso(null);
      setDashboardActivity([]);
      setWeeklyFromApi(null);
      const [foldersList, clientsRes] = await Promise.all([
        listFolders().catch(() => [] as ApiFolder[]),
        listClients().catch(() => ({ count: 0, clients: [] as { _id: string; name: string }[] })),
      ]);
      setFolders(foldersList);
      setClientCount(clientsRes.count ?? clientsRes.clients.length);
      setStorageBytes(null);
      const map = new Map<string, string>();
      for (const c of clientsRes.clients) map.set(c._id, c.name);
      setClientNameById(map);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function handleSaved(_saved?: ApiFolder) {
    void refresh();
  }

  const pipeline = useMemo(() => {
    let draft = 0;
    let selectionPending = 0;
    let completed = 0;
    for (const f of folders) {
      const s = apiFolderStatusToUi(f.status);
      if (s === "COMPLETED") completed += 1;
      else if (s === "SELECTION_PENDING") selectionPending += 1;
      else draft += 1;
    }
    const inProgress = draft + selectionPending;
    return { draft, selectionPending, completed, inProgress };
  }, [folders]);

  const displayStats = useMemo(() => {
    if (stats) return stats;
    return {
      totalClients: clientCount,
      totalGalleries: folders.length,
      inProgressGalleries: pipeline.inProgress,
      completedGalleries: pipeline.completed,
    };
  }, [stats, clientCount, folders.length, pipeline]);

  const recentGalleries = useMemo(() => {
    return [...folders]
      .sort((a, b) => {
        const ta = a.updatedAt ?? a.createdAt ?? "";
        const tb = b.updatedAt ?? b.createdAt ?? "";
        return tb.localeCompare(ta);
      })
      .slice(0, DASHBOARD_HOME_LIST_LIMIT);
  }, [folders]);

  const derivedActivity = useMemo(() => {
    return [...folders]
      .map((f) => {
        const displayName = f.eventName?.trim() || getFolderClientName(f, clientNameById);
        const created = f.createdAt ?? "";
        const updated = f.updatedAt ?? "";
        const when = updated || created;
        const isLikelyNew =
          created &&
          (!updated || updated === created || new Date(updated).getTime() - new Date(created).getTime() < 120000);
        return {
          title: isLikelyNew ? `New gallery, ${displayName}` : `Updated, ${displayName}`,
          when,
          galleryId: f._id,
          coverUrl: resolveFolderCoverSrc(f, studioDefaultCoverUrl),
        };
      })
      .filter((a) => a.when)
      .sort((a, b) => b.when.localeCompare(a.when))
      .slice(0, LIVE_FEED_LIMIT);
  }, [folders, clientNameById, studioDefaultCoverUrl]);

  const recentActivity = useMemo(() => {
    const coverByGalleryId = new Map(
      folders.map((f) => [f._id, resolveFolderCoverSrc(f, studioDefaultCoverUrl)]),
    );
    const rows = stats ? dashboardActivity : derivedActivity;
    return rows.slice(0, LIVE_FEED_LIMIT).map((row) => ({
      ...row,
      coverUrl:
        row.coverUrl ??
        (row.galleryId ? (coverByGalleryId.get(row.galleryId) ?? null) : null),
    }));
  }, [stats, dashboardActivity, derivedActivity, folders, studioDefaultCoverUrl]);

  const compact = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
    return String(n);
  };

  const todayLabel = useMemo(() => {
    if (serverDateIso) {
      try {
        const d = new Date(serverDateIso);
        if (!Number.isNaN(d.getTime())) {
          return d.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          });
        }
      } catch {
        /* ignore */
      }
    }
    return new Date().toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }, [serverDateIso]);

  const weeklyActivity = useMemo((): WeeklyBar[] => {
    if (weeklyFromApi?.chart.length) return weeklyFromApi.chart;
    return [];
  }, [weeklyFromApi]);

  const activityDeltas = useMemo(() => {
    if (weeklyFromApi) {
      return {
        todayDelta: weeklyFromApi.todayDelta,
        weekDelta: weeklyFromApi.weekDelta,
      };
    }
    return { todayDelta: 0, weekDelta: 0 };
  }, [weeklyFromApi]);

  const todayCount = weeklyFromApi?.today ?? 0;
  const weekTotal = weeklyFromApi?.thisWeek ?? weeklyActivity.reduce((sum, bar) => sum + bar.value, 0);

  const statItems: DashboardStatItem[] = [
    {
      label: "Clients",
      value: compact(displayStats.totalClients),
      hint: "CRM directory",
      href: "/dashboard/clients",
      icon: Users,
      iconWrap: "bg-brand-soft ring-1 ring-brand/10 dark:bg-brand/15 dark:ring-brand/20",
      iconColor: "text-brand dark:text-brand-on-dark",
    },
    {
      label: "Galleries",
      value: compact(displayStats.totalGalleries),
      hint: "Delivery projects",
      href: "/dashboard/galleries",
      icon: FolderOpen,
      iconWrap: "bg-brand-soft ring-1 ring-brand/10 dark:bg-brand/15 dark:ring-brand/20",
      iconColor: "text-brand dark:text-brand-on-dark",
    },
    {
      label: "In progress",
      value: compact(displayStats.inProgressGalleries),
      hint: "Draft or proofing",
      href: "/dashboard/galleries",
      icon: Clock3,
      iconWrap: "bg-amber-50 ring-1 ring-amber-200/80 dark:bg-amber-950/40 dark:ring-amber-900/50",
      iconColor: "text-amber-700 dark:text-amber-300",
    },
    {
      label: "Completed",
      value: compact(displayStats.completedGalleries),
      hint: "Delivered",
      href: "/dashboard/galleries",
      icon: CheckCircle2,
      iconWrap: "bg-emerald-50 ring-1 ring-emerald-200/80 dark:bg-emerald-950/40 dark:ring-emerald-900/50",
      iconColor: "text-emerald-700 dark:text-emerald-300",
    },
  ];

  function formatRelativeTime(iso: string) {
    if (!iso) return "N/A";
    const t = new Date(iso).getTime();
    const diffMs = Date.now() - t;
    if (!Number.isFinite(diffMs)) return new Date(iso).toLocaleDateString();
    if (diffMs < 0) return new Date(iso).toLocaleDateString();

    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Now";
    if (mins < 60) return `${mins}m`;

    const hours = Math.floor(diffMs / 3600000);
    if (hours < 24) return `${hours}h`;

    const days = Math.floor(diffMs / 86400000);
    if (days === 1) return "1d";
    if (days < 7) return `${days}d`;

    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }

  function formatDateColumn(iso: string) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";

    const ref = serverDateIso ? new Date(serverDateIso) : new Date();
    const sameDay =
      d.getFullYear() === ref.getFullYear() &&
      d.getMonth() === ref.getMonth() &&
      d.getDate() === ref.getDate();
    if (sameDay) return "Today";

    const yesterday = new Date(ref);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      d.getFullYear() === yesterday.getFullYear() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getDate() === yesterday.getDate();
    if (isYesterday) return "Yday";

    return d.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit" });
  }

  return (
    <div className="dashboard-page space-y-5 pb-6 sm:space-y-6">
      <DashboardOverviewRow
        greeting={greeting}
        todayLabel={todayLabel}
        onNewGallery={() => setCreateOpen(true)}
        onAddClient={() => setAddClientOpen(true)}
      />

      <DashboardStatCards items={statItems} loading={loading} />

      <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
        <DashboardActivityPanel
          rows={recentActivity}
          loading={loading}
          formatRelativeTime={formatRelativeTime}
          formatDateColumn={formatDateColumn}
        />

        {loading && !storageBytes ? (
          <>
            <ChartCardSkeleton variant="storage" />
            <ChartCardSkeleton variant="activity" />
          </>
        ) : storageBytes ? (
          <>
            <StorageBreakdownCard
              totalBytes={storageBytes.total}
              raws={storageBytes.raws}
              selections={storageBytes.selections}
              finals={storageBytes.finals}
              planBytes={storageBytes.planBytes || getActivePlanDefinition().storageBytes}
            />
            <WeeklyActivityCard
              bars={weeklyActivity}
              todayCount={todayCount}
              weekTotal={weekTotal}
              todayDelta={activityDeltas.todayDelta}
              weekDelta={activityDeltas.weekDelta}
            />
          </>
        ) : null}
      </div>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="dashboard-section-label">Portfolio</p>
            <h2 className="mt-1 font-display text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Recent galleries
            </h2>
          </div>
          <Link
            href="/dashboard/galleries"
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand transition hover:text-brand-hover dark:text-brand-on-dark"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
        {loading && recentGalleries.length === 0 ? (
          <div className="gallery-card-grid-compact mt-5">
            {Array.from({ length: DASHBOARD_HOME_LIST_LIMIT }).map((_, i) => (
              <GalleryCardSkeleton key={i} compact />
            ))}
          </div>
        ) : recentGalleries.length === 0 ? (
          <div className="dashboard-panel mt-5 flex flex-col items-center py-16 text-center">
            <Sparkles className="h-8 w-8 text-zinc-300 dark:text-zinc-600" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-200">No galleries yet</p>
            <p className="mt-1 max-w-sm text-xs text-zinc-500">
              Create a client gallery for delivery, proofing, and sharing.
            </p>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="dashboard-btn-primary mt-5"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              New gallery
            </button>
          </div>
        ) : (
          <div className="gallery-card-grid-compact mt-5">
            {recentGalleries.map((g) => (
              <GalleryPreviewCard
                key={g._id}
                folder={g}
                clientNameById={clientNameById}
                studioDefaultCoverUrl={studioDefaultCoverUrl}
                compact
              />
            ))}
          </div>
        )}
      </section>

      <CreateFolderModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={handleSaved}
      />
      <CreateClientModal
        open={addClientOpen}
        onClose={() => setAddClientOpen(false)}
        onSaved={() => {
          void refresh();
        }}
      />
    </div>
  );
}