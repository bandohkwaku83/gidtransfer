"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Images } from "lucide-react";
import { DashboardSoftEduQuickAccess } from "@/components/dashboard/dashboard-soft-edu-quick-access";
import { DashboardSoftEduCalendar } from "@/components/dashboard/dashboard-soft-edu-calendar";
import { DashboardSoftEduProfile } from "@/components/dashboard/dashboard-soft-edu-profile";
import { DashboardSoftEduSuccess } from "@/components/dashboard/dashboard-soft-edu-success";
import { DashboardActivityPanel } from "@/components/dashboard/dashboard-activity-panel";
import { StorageUpgradePrompt } from "@/components/billing/plan-storage-meter";
import { usePlanEntitlements } from "@/lib/use-plan-entitlements";
import { galleryLimitLabel, isAtGalleryLimit } from "@/lib/plan-entitlements";
import { isStorageCapped } from "@/lib/storage-api";
import type { WeeklyBar } from "@/lib/dashboard-chart-data";
import {
  activityItemToLabel,
  DASHBOARD_HOME_LIST_LIMIT,
  dashboardRecentGalleryToApiFolder,
  DashboardApiError,
  fetchDashboard,
  LIVE_FEED_LIMIT,
  type DashboardCurrentSelection,
  type DashboardNewClient,
  type DashboardSchedule,
  type DashboardStats,
  type DashboardWeeklyActivity,
} from "@/lib/dashboard-api";
import { getAuth, getAuthToken } from "@/lib/auth-demo";
import { canOpen } from "@/lib/studio-access";
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
import { listBookings } from "@/lib/bookings-api";
import { getSettings, getSettingsDefaultCoverUrl } from "@/lib/settings-api";
import { GalleryCardSkeleton } from "@/components/ui/skeletons";
import { STUDIO_NAME } from "@/lib/branding";

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
  href?: string;
  coverUrl?: string | null;
  kind?: "new" | "updated" | "completed" | "selection";
  action?: string;
  meta?: string;
  progressPercent?: number;
};

export default function DashboardPage() {
  const { plan, openUpgrade, trialExpired } = usePlanEntitlements();
  const [createOpen, setCreateOpen] = useState(false);
  const [folders, setFolders] = useState<ApiFolder[]>([]);
  const [clientCount, setClientCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("there");
  const [clientNameById, setClientNameById] = useState<Map<string, string>>(new Map());
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [serverDateIso, setServerDateIso] = useState<string | null>(null);
  const [dashboardActivity, setDashboardActivity] = useState<ActivityRow[]>([]);
  const [newClients, setNewClients] = useState<DashboardNewClient[]>([]);
  const [currentSelections, setCurrentSelections] = useState<DashboardCurrentSelection[]>([]);
  const [schedules, setSchedules] = useState<DashboardSchedule[]>([]);
  const [storageBytes, setStorageBytes] = useState<{
    total: number;
    raws: number;
    selections: number;
    finals: number;
    planBytes: number;
    percentOfPlan: number;
  } | null>(null);
  const [weeklyFromApi, setWeeklyFromApi] = useState<DashboardWeeklyActivity | null>(null);
  const [studioDefaultCoverUrl, setStudioDefaultCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    setGreeting(firstNameFromAuth());
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Settings chrome is owner/settings-menu only — avoid MENU_FORBIDDEN for staff.
    if (!canOpen(getAuth()?.user, "settings")) {
      return;
    }
    void getSettings().then((settings) => {
      if (!cancelled) setStudioDefaultCoverUrl(getSettingsDefaultCoverUrl(settings));
    }).catch(() => {
      /* optional cover fallback */
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
          setFolders(d.newGalleries.map(dashboardRecentGalleryToApiFolder));
          setClientCount(d.stats.totalClients);
          const clientMap = new Map<string, string>();
          for (const g of d.newGalleries) {
            if (g.clientId) clientMap.set(g.clientId, g.clientName);
          }
          for (const c of d.newClients) clientMap.set(c.id, c.name);
          setClientNameById(clientMap);
          setDashboardActivity(
            d.activity.map((a) => ({
              title: a.targetName?.trim() || activityItemToLabel(a),
              action: a.actionLabel?.trim() || a.action,
              meta: a.clientName,
              when: a.at,
              galleryId: a.galleryId,
              coverUrl: a.thumbnailUrl ?? null,
              kind: a.kind,
            })),
          );
          setNewClients(d.newClients);
          setCurrentSelections(d.currentSelections);
          if (d.schedules.length > 0) {
            setSchedules(d.schedules);
          } else {
            // Fallback when dashboard schedules is empty — use month bookings.
            const now = new Date();
            try {
              const res = await listBookings({
                year: now.getFullYear(),
                month: now.getMonth() + 1,
              });
              setSchedules(
                res.bookings.map((b) => ({
                  id: b._id,
                  title: b.title,
                  startsAt: b.startsAt,
                  endsAt: b.endsAt ?? undefined,
                  clientName: b.client?.name?.trim() || "Client",
                  clientId: b.client?._id,
                  location: b.location?.trim() || undefined,
                  coordinates: null,
                  shootType: b.shootType,
                  category: b.category,
                  color: b.color,
                  description: b.description ?? b.notes,
                })),
              );
            } catch {
              setSchedules([]);
            }
          }
          setStorageBytes({
            total: d.storage.total,
            raws: d.storage.raws,
            selections: d.storage.selections,
            finals: d.storage.finals,
            planBytes: d.storage.planBytes,
            percentOfPlan: d.storage.percentOfPlan,
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
      setNewClients([]);
      setCurrentSelections([]);
      setSchedules([]);
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
    return { draft, selectionPending, completed, inProgress: draft + selectionPending };
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
        const ta = a.createdAt ?? a.updatedAt ?? "";
        const tb = b.createdAt ?? b.updatedAt ?? "";
        return tb.localeCompare(ta);
      })
      .slice(0, DASHBOARD_HOME_LIST_LIMIT);
  }, [folders]);

  const featuredGallery = recentGalleries[0] ?? null;

  const derivedActivity = useMemo(() => {
    return [...folders]
      .map((f) => {
        const displayName = f.eventName?.trim() || getFolderClientName(f, clientNameById);
        const created = f.createdAt ?? "";
        const updated = f.updatedAt ?? "";
        const when = updated || created;
        const isLikelyNew =
          created &&
          (!updated ||
            updated === created ||
            new Date(updated).getTime() - new Date(created).getTime() < 120000);
        return {
          title: displayName,
          action: isLikelyNew ? "New gallery" : "Updated",
          when,
          galleryId: f._id,
          coverUrl: resolveFolderCoverSrc(f, studioDefaultCoverUrl),
          kind: (isLikelyNew ? "new" : "updated") as ActivityRow["kind"],
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

  const selectionRows = useMemo((): ActivityRow[] => {
    return currentSelections.map((s) => ({
      title: s.galleryName,
      action: s.statusLabel || "Selecting",
      meta: [s.clientName, s.progressLabel].filter(Boolean).join(" · "),
      when: s.lastSelectedAt || s.updatedAt || "",
      galleryId: s.galleryId,
      coverUrl: s.thumbnailUrl ?? null,
      kind: "selection" as const,
      progressPercent: s.progressPercent,
    }));
  }, [currentSelections]);

  const clientRows = useMemo((): ActivityRow[] => {
    return newClients.map((c) => ({
      title: c.name,
      action: "New client",
      meta: [c.location, c.email, c.phone].filter(Boolean).join(" · ") || undefined,
      when: c.createdAt,
      href: `/dashboard/clients/${c.id}`,
      kind: "new" as const,
    }));
  }, [newClients]);

  const weeklyActivity = useMemo((): WeeklyBar[] => {
    if (weeklyFromApi?.chart.length) return weeklyFromApi.chart;
    return [];
  }, [weeklyFromApi]);

  const weekTotal = weeklyFromApi?.thisWeek ?? weeklyActivity.reduce((sum, bar) => sum + bar.value, 0);
  const weekDelta = weeklyFromApi?.weekDelta ?? 0;

  const calendarShoots = useMemo(
    () =>
      schedules.map((s) => ({
        id: s.id,
        title: s.title,
        startsAt: s.startsAt,
        clientName: s.clientName,
        location: s.location,
      })),
    [schedules],
  );

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

  const activeGalleryCount = stats?.totalGalleries ?? folders.length;
  const galleryLimitReached = isAtGalleryLimit(plan, activeGalleryCount);

  function requestNewGallery() {
    if (trialExpired || galleryLimitReached) {
      openUpgrade({
        feature: "clientGalleries",
        trialExpired: trialExpired || undefined,
        message: trialExpired
          ? "Your free trial has ended. Upgrade to create galleries."
          : plan?.maxGalleries != null
            ? `Gallery limit reached (${galleryLimitLabel(plan)}). Upgrade for more galleries.`
            : "Gallery limit reached. Upgrade for more galleries.",
      });
      return;
    }
    setCreateOpen(true);
  }

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

  return (
    <div className="dashboard-page space-y-5 pb-8 sm:space-y-6">
      <div>
        <p className="text-xs font-medium tabular-nums text-zinc-400">{todayLabel}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Hi, {greeting}
        </h1>
      </div>

      <StorageUpgradePrompt
        percent={
          storageBytes
            ? storageBytes.planBytes > 0
              ? storageBytes.percentOfPlan ||
                (storageBytes.total / storageBytes.planBytes) * 100
              : null
            : null
        }
        capped={Boolean(
          storageBytes &&
            isStorageCapped({
              usedBytes: storageBytes.total,
              limitBytes: storageBytes.planBytes,
            }),
        )}
      />

      <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
        <div className="lg:col-span-5">
          <DashboardSoftEduQuickAccess
            onNewGallery={requestNewGallery}
            totalGalleries={displayStats.totalGalleries}
            clientCount={displayStats.totalClients}
            loading={loading}
          />
        </div>
        <div className="lg:col-span-4">
          <DashboardSoftEduCalendar
            shoots={calendarShoots}
            serverDateIso={serverDateIso}
          />
        </div>
        <div className="lg:col-span-3">
          <DashboardSoftEduProfile
            folder={featuredGallery}
            clientNameById={clientNameById}
            studioDefaultCoverUrl={studioDefaultCoverUrl}
            studioName={STUDIO_NAME}
            onNewGallery={requestNewGallery}
            loading={loading}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
        <div className="rounded-[1.35rem] bg-white p-5 dark:bg-zinc-950 sm:p-6 lg:col-span-5">
          <DashboardActivityPanel
            rows={recentActivity}
            selectionRows={stats ? selectionRows : undefined}
            clientRows={stats ? clientRows : undefined}
            loading={loading}
            formatRelativeTime={formatRelativeTime}
          />
        </div>
        <div className="lg:col-span-7">
          <DashboardSoftEduSuccess
            bars={weeklyActivity}
            weekTotal={weekTotal}
            weekDelta={weekDelta}
            completedGalleries={displayStats.completedGalleries}
            storageUsed={storageBytes?.total ?? null}
            storageLimit={storageBytes?.planBytes ?? plan?.storageLimitBytes ?? null}
            statusLabel={weeklyFromApi?.statusLabel ?? null}
            loading={loading}
          />
        </div>
      </div>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            New galleries
          </h2>
          <Link
            href="/dashboard/galleries"
            className="inline-flex items-center gap-1 text-sm font-semibold text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        {loading && recentGalleries.length === 0 ? (
          <div className="gallery-card-grid-compact mt-4">
            {Array.from({ length: DASHBOARD_HOME_LIST_LIMIT }).map((_, i) => (
              <GalleryCardSkeleton key={i} compact />
            ))}
          </div>
        ) : recentGalleries.length === 0 ? (
          <div className="mt-4 flex flex-col items-center rounded-[1.35rem] bg-white py-14 text-center dark:bg-zinc-950">
            <Images className="h-8 w-8 text-zinc-300 dark:text-zinc-600" aria-hidden />
            <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-200">No galleries yet</p>
            <p className="mt-1 max-w-sm text-xs text-zinc-500">
              Create a client gallery for delivery, selections, and sharing.
            </p>
            <button
              type="button"
              onClick={requestNewGallery}
              className="mt-5 inline-flex items-center justify-center rounded-2xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black dark:bg-zinc-100 dark:text-zinc-950"
            >
              New gallery
            </button>
          </div>
        ) : (
          <div className="gallery-card-grid-compact mt-4">
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
        activeGalleryCount={activeGalleryCount}
        onSaved={handleSaved}
      />
    </div>
  );
}
