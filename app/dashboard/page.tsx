"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FolderOpen,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { DashboardWelcomePanel } from "@/components/dashboard/dashboard-welcome-panel";
import { useDashboardUiTheme } from "@/components/dashboard-ui-theme";
import {
  ChartCard,
  ChartCardSkeleton,
  DonutChart,
  WeeklyActivityChart,
} from "@/components/dashboard/dashboard-charts";
import {
  DashboardStatStrip,
  type DashboardStatItem,
} from "@/components/dashboard/dashboard-stat-strip";
import {
  computePipelineSlices,
  computeWeeklyActivity,
  formatBytesShort,
  storageSlicesFromUsage,
} from "@/lib/dashboard-chart-data";
import { fetchUsageSummary } from "@/lib/usage-api";
import {
  activityItemToLabel,
  DASHBOARD_HOME_LIST_LIMIT,
  dashboardRecentGalleryToApiFolder,
  DashboardApiError,
  fetchDashboard,
  type DashboardStats,
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
import { listClients } from "@/lib/clients-api";
import { getSettings, getSettingsDefaultCoverUrl } from "@/lib/settings-api";
import {
  ActivityFeedSkeleton,
  GalleryCardSkeleton,
} from "@/components/ui/skeletons";

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
};

export default function DashboardPage() {
  const { darkUi } = useDashboardUiTheme();
  const [createOpen, setCreateOpen] = useState(false);
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [folders, setFolders] = useState<ApiFolder[]>([]);
  const [clientCount, setClientCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("there");
  const [clientNameById, setClientNameById] = useState<Map<string, string>>(
    new Map(),
  );
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [serverDateIso, setServerDateIso] = useState<string | null>(null);
  const [dashboardActivity, setDashboardActivity] = useState<ActivityRow[]>([]);
  const [storageBytes, setStorageBytes] = useState<{
    total: number;
    raws: number;
    selections: number;
    finals: number;
  } | null>(null);
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
          setClientNameById(new Map());
          setDashboardActivity(
            d.activity.map((a) => ({
              title: activityItemToLabel(a),
              when: a.at,
              galleryId: a.galleryId,
            })),
          );
          const usage = await fetchUsageSummary().catch(() => null);
          if (usage) {
            setStorageBytes({
              total: usage.total_storage_bytes,
              raws: usage.raws_size_bytes,
              selections: usage.selections_size_bytes,
              finals: usage.finals_size_bytes,
            });
          }
          return;
        } catch (e) {
          if (e instanceof DashboardApiError && e.status === 401) return;
          console.warn("[dashboard] GET /api/dashboard failed, using folder/client lists", e);
        }
      }

      setStats(null);
      setServerDateIso(null);
      setDashboardActivity([]);
      const [foldersList, clientsRes, usage] = await Promise.all([
        listFolders().catch(() => [] as ApiFolder[]),
        listClients().catch(() => ({ count: 0, clients: [] as { _id: string; name: string }[] })),
        fetchUsageSummary().catch(() => null),
      ]);
      setFolders(foldersList);
      setClientCount(clientsRes.count ?? clientsRes.clients.length);
      if (usage) {
        setStorageBytes({
          total: usage.total_storage_bytes,
          raws: usage.raws_size_bytes,
          selections: usage.selections_size_bytes,
          finals: usage.finals_size_bytes,
        });
      } else {
        setStorageBytes(null);
      }
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
        };
      })
      .filter((a) => a.when)
      .sort((a, b) => b.when.localeCompare(a.when))
      .slice(0, DASHBOARD_HOME_LIST_LIMIT);
  }, [folders, clientNameById]);

  const recentActivity = useMemo(() => {
    const rows = stats ? dashboardActivity : derivedActivity;
    return rows.slice(0, DASHBOARD_HOME_LIST_LIMIT);
  }, [stats, dashboardActivity, derivedActivity]);

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

  const pipelineSlices = useMemo(
    () => computePipelineSlices(folders, darkUi),
    [folders, darkUi],
  );

  const weeklyActivity = useMemo(() => {
    const stamps = [
      ...folders.map((f) => f.updatedAt ?? f.createdAt ?? ""),
      ...recentActivity.map((a) => a.when),
    ].filter(Boolean);
    return computeWeeklyActivity(stamps, serverDateIso);
  }, [folders, recentActivity, serverDateIso]);

  const storageSlices = useMemo(() => {
    if (!storageBytes) return [];
    return storageSlicesFromUsage(
      storageBytes.raws,
      storageBytes.selections,
      storageBytes.finals,
      darkUi,
    );
  }, [storageBytes, darkUi]);

  const statItems: DashboardStatItem[] = [
    {
      label: "Clients",
      value: compact(displayStats.totalClients),
      hint: "Your CRM directory",
      href: "/dashboard/clients",
      icon: Users,
      accent: "bg-slate-400",
      iconWrap: "bg-slate-100 dark:bg-slate-800/80",
      iconColor: "text-slate-600 dark:text-slate-300",
    },
    {
      label: "Galleries",
      value: compact(displayStats.totalGalleries),
      hint: "Client delivery projects",
      href: "/dashboard/galleries",
      icon: FolderOpen,
      accent: "bg-brand",
      iconWrap: "bg-brand/10 dark:bg-brand/20",
      iconColor: "text-brand dark:text-brand-on-dark",
    },
    {
      label: "In progress",
      value: compact(displayStats.inProgressGalleries),
      hint: "Draft, proofing, or selection",
      href: "/dashboard/galleries",
      icon: Clock3,
      accent: "bg-amber-500",
      iconWrap: "bg-amber-50 dark:bg-amber-950/40",
      iconColor: "text-amber-600 dark:text-amber-300",
    },
    {
      label: "Completed",
      value: compact(displayStats.completedGalleries),
      hint: "Delivered to clients",
      href: "/dashboard/galleries",
      icon: CheckCircle2,
      accent: "bg-emerald-500",
      iconWrap: "bg-emerald-50 dark:bg-emerald-950/40",
      iconColor: "text-emerald-600 dark:text-emerald-300",
    },
  ];

  function formatRelativeTime(iso: string) {
    if (!iso) return "N/A";
    const t = new Date(iso).getTime();
    const diffMs = Date.now() - t;
    if (!Number.isFinite(diffMs)) return new Date(iso).toLocaleDateString();
    if (diffMs < 0) return new Date(iso).toLocaleDateString();

    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;

    const hours = Math.floor(diffMs / 3600000);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(diffMs / 86400000);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;

    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year:
        new Date(iso).getFullYear() === new Date().getFullYear()
          ? undefined
          : "numeric",
    });
  }

  return (
    <div className="dashboard-page relative space-y-8 pb-4">
      <DashboardWelcomePanel
        greeting={greeting}
        todayLabel={todayLabel}
        onNewGallery={() => setCreateOpen(true)}
        onAddClient={() => setAddClientOpen(true)}
      />

      <DashboardStatStrip items={statItems} loading={loading} />

      <section className="grid gap-4 lg:grid-cols-3 2xl:gap-5">
        {loading && folders.length === 0 ? (
          <>
            <ChartCardSkeleton />
            <ChartCardSkeleton />
            <ChartCardSkeleton />
          </>
        ) : (
          <>
            <ChartCard
              title="Gallery pipeline"
              subtitle="Draft, selection & completed"
              href="/dashboard/galleries"
              hrefLabel="Galleries"
            >
              <DonutChart
                slices={pipelineSlices}
                totalLabel="galleries"
                totalValue={String(displayStats.totalGalleries)}
                emptyLabel="Create a gallery to see pipeline"
              />
            </ChartCard>
            <ChartCard title="Weekly activity" subtitle="Updates across your workspace">
              <WeeklyActivityChart bars={weeklyActivity} />
            </ChartCard>
            <ChartCard
              title="Storage breakdown"
              subtitle="RAWs, selections & finals"
              href="/dashboard/storage"
              hrefLabel="Storage"
            >
              <DonutChart
                slices={storageSlices}
                totalLabel="used"
                totalValue={formatBytesShort(storageBytes?.total ?? 0)}
                valueKey="bytes"
                emptyLabel="No storage data yet"
              />
            </ChartCard>
          </>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-3 2xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)] 2xl:gap-8">
        <div className="lg:col-span-2 2xl:col-span-1">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Recent galleries</h2>
              <p className="mt-0.5 text-xs text-zinc-500">What clients see, newest activity first</p>
            </div>
            <Link
              href="/dashboard/galleries"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand transition hover:text-brand-hover dark:text-brand-on-dark dark:hover:text-white"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          {loading && recentGalleries.length === 0 ? (
            <div className="gallery-card-grid mt-4">
              {Array.from({ length: DASHBOARD_HOME_LIST_LIMIT }).map((_, i) => (
                <GalleryCardSkeleton key={i} />
              ))}
            </div>
          ) : recentGalleries.length === 0 ? (
            <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/20">
              <Sparkles className="h-8 w-8 text-zinc-300 dark:text-zinc-600" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-200">No galleries yet</p>
              <p className="mt-1 max-w-sm text-xs text-zinc-500">
                Create a client gallery for delivery, proofing, and sharing.
              </p>
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow-sm hover:bg-brand-hover"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                New gallery
              </button>
            </div>
          ) : (
            <div className="gallery-card-grid mt-4">
              {recentGalleries.map((g) => (
                <GalleryPreviewCard
                  key={g._id}
                  folder={g}
                  clientNameById={clientNameById}
                  studioDefaultCoverUrl={studioDefaultCoverUrl}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Activity</h2>
          <p className="mt-0.5 text-xs text-zinc-500">Proofing, uploads & delivery touchpoints</p>
          {loading && recentActivity.length === 0 ? (
            <ActivityFeedSkeleton rows={DASHBOARD_HOME_LIST_LIMIT} />
          ) : recentActivity.length === 0 ? (
            <p className="mt-6 text-sm text-zinc-500">No activity yet.</p>
          ) : (
            <ul className="mt-4 space-y-0">
              {recentActivity.map((a, idx) => {
                const key = `${a.title}-${a.when}-${idx}`;
                const body = (
                  <>
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-on-dark">
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug text-zinc-900 dark:text-zinc-100">{a.title}</p>
                      <p className="mt-0.5 text-xs text-zinc-400">{formatRelativeTime(a.when)}</p>
                    </div>
                  </>
                );
                if (a.galleryId) {
                  return (
                    <li key={key} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/80">
                      <Link
                        href={`/dashboard/folder/${a.galleryId}`}
                        className="flex gap-3 py-3 transition hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40"
                      >
                        {body}
                      </Link>
                    </li>
                  );
                }
                return (
                  <li
                    key={key}
                    className="flex gap-3 border-b border-zinc-100 py-3 last:border-0 dark:border-zinc-800/80"
                  >
                    {body}
                  </li>
                );
              })}
            </ul>
          )}
          <Link
            href="/dashboard/galleries"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-200 dark:hover:bg-zinc-800/80"
          >
            Open galleries
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
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
