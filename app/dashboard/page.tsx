"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardSoftEduQuickAccess } from "@/components/dashboard/dashboard-soft-edu-quick-access";
import { DashboardSoftEduCalendar } from "@/components/dashboard/dashboard-soft-edu-calendar";
import { DashboardSoftEduProfile } from "@/components/dashboard/dashboard-soft-edu-profile";
import { DashboardActivityPanel } from "@/components/dashboard/dashboard-activity-panel";
import { StorageUpgradePrompt } from "@/components/billing/plan-storage-meter";
import { usePlanEntitlements } from "@/lib/use-plan-entitlements";
import { galleryLimitLabel, isAtGalleryLimit } from "@/lib/plan-entitlements";
import { isStorageCapped } from "@/lib/storage-api";
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
} from "@/lib/dashboard-api";
import { getAuth, getAuthToken } from "@/lib/auth-demo";
import { canOpen } from "@/lib/studio-access";
import { CreateFolderModal } from "@/components/photographer/create-folder-modal";
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
    <div className="dashboard-page space-y-4 pb-6 sm:space-y-6 sm:pb-8">
      <div className="flex flex-col gap-0.5 sm:gap-1">
        <p className="text-[11px] font-medium tabular-nums text-zinc-400 sm:text-xs">{todayLabel}</p>
        <h1 className="font-display text-[1.65rem] font-semibold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50 sm:mt-1 sm:text-2xl">
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

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-12 lg:gap-5">
        <div className="order-1 lg:col-span-5">
          <DashboardSoftEduQuickAccess
            onNewGallery={requestNewGallery}
            totalGalleries={displayStats.totalGalleries}
            clientCount={displayStats.totalClients}
            loading={loading}
          />
        </div>

        <div className="order-2 rounded-[1.25rem] bg-white p-4 dark:bg-zinc-950 sm:rounded-[1.35rem] sm:p-6 lg:order-4 lg:col-span-12">
          <DashboardActivityPanel
            rows={recentActivity}
            selectionRows={stats ? selectionRows : undefined}
            clientRows={stats ? clientRows : undefined}
            loading={loading}
            formatRelativeTime={formatRelativeTime}
          />
        </div>

        <div className="order-3 lg:col-span-4">
          <DashboardSoftEduCalendar
            shoots={calendarShoots}
            serverDateIso={serverDateIso}
          />
        </div>

        <div className="order-4 lg:order-3 lg:col-span-3">
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

      <CreateFolderModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        activeGalleryCount={activeGalleryCount}
        onSaved={handleSaved}
      />
    </div>
  );
}
