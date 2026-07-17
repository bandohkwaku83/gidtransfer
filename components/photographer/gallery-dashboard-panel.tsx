"use client";

import { type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  Copy,
  ExternalLink,
  Flag,
  ImageIcon,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { DonutChart, WeeklyActivityChart } from "@/components/dashboard/dashboard-charts";
import {
  ToggleSwitch,
  type FolderEditorTab,
} from "@/components/photographer/folder-detail-editor-ui";
import type { GalleryAnalyticsSnapshot } from "@/lib/gallery-analytics";
import { cn } from "@/lib/utils";

export type GalleryDashboardPanelProps = {
  published: boolean;
  shareExpired?: boolean;
  sharedAt?: string | null;
  uploadsCount: number;
  finalsCount: number;
  commentsCount: number;
  flaggedFinalsCount: number;
  selectionLimit: number | null;
  shareActive: boolean;
  shareUrl: string;
  linkCopied: boolean;
  passwordProtection: boolean;
  finalImagesLocked: boolean;
  analytics: GalleryAnalyticsSnapshot;
  statusBusy?: boolean;
  activationHint: string;
  onNavigateTab: (tab: FolderEditorTab) => void;
  onCopyShare: () => void;
  onOnlineChange: (online: boolean) => void;
};

function GalleryMetricCard({
  label,
  value,
  icon: Icon,
  iconWrap,
  iconColor,
  onClick,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  iconWrap: string;
  iconColor: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex min-w-0 items-center gap-3 rounded-xl border border-zinc-200/90 bg-white p-3.5 text-left shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50/90 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/60 sm:p-4"
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          iconWrap,
        )}
      >
        <Icon className={cn("h-[18px] w-[18px]", iconColor)} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="mt-0.5 text-2xl font-semibold tabular-nums leading-none tracking-tight text-zinc-900 dark:text-zinc-50">
          {value}
        </p>
      </div>
      <ArrowUpRight
        className="h-3.5 w-3.5 shrink-0 text-zinc-300 opacity-0 transition group-hover:opacity-100 dark:text-zinc-600"
        aria-hidden
      />
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <li className="flex justify-between gap-4">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium text-zinc-800 dark:text-zinc-200">{value}</span>
    </li>
  );
}

function formatSharedAt(iso?: string | null): string {
  if (!iso?.trim()) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function GalleryPublishStatus({
  online,
  shareExpired,
  sharedAt,
  busy,
  activationHint,
  onOnlineChange,
}: {
  online: boolean;
  shareExpired?: boolean;
  sharedAt?: string | null;
  busy?: boolean;
  activationHint: string;
  onOnlineChange: (online: boolean) => void;
}) {
  const statusHint = online
    ? "Clients can open your gallery link."
    : shareExpired
      ? "Link expired — turn on to reactivate sharing."
      : activationHint;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
                online
                  ? "border-emerald-200/80 bg-emerald-50/80 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200"
                  : "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-300",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 shrink-0 rounded-full",
                  online ? "bg-emerald-500" : "bg-zinc-400",
                )}
                aria-hidden
              />
              {online ? "Online" : "Offline"}
            </span>
            {online && sharedAt ? (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Live since {formatSharedAt(sharedAt)}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{statusHint}</p>
        </div>
        <ToggleSwitch
          label={online ? "Set gallery offline" : "Set gallery online"}
          checked={online}
          disabled={busy}
          onChange={onOnlineChange}
        />
      </div>
    </div>
  );
}

export function GalleryDashboardPanel({
  published,
  shareExpired,
  sharedAt,
  uploadsCount,
  finalsCount,
  commentsCount,
  flaggedFinalsCount,
  selectionLimit,
  shareActive,
  shareUrl,
  linkCopied,
  passwordProtection,
  finalImagesLocked,
  analytics,
  statusBusy,
  activationHint,
  onNavigateTab,
  onCopyShare,
  onOnlineChange,
}: GalleryDashboardPanelProps) {
  const mediaTotal = analytics.mediaSlices.reduce((sum, s) => sum + s.value, 0);
  const online = published && !shareExpired;

  return (
    <div className="space-y-4">
      <GalleryPublishStatus
        online={online}
        shareExpired={shareExpired}
        sharedAt={sharedAt}
        busy={statusBusy}
        activationHint={activationHint}
        onOnlineChange={onOnlineChange}
      />

      <section aria-label="Gallery overview" className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <GalleryMetricCard
          label="Uploads"
          value={uploadsCount}
          icon={ImageIcon}
          iconWrap="bg-indigo-50 dark:bg-indigo-950/50"
          iconColor="text-indigo-600 dark:text-indigo-400"
          onClick={() => onNavigateTab("uploads")}
        />
        <GalleryMetricCard
          label="Finals"
          value={finalsCount}
          icon={Sparkles}
          iconWrap="bg-emerald-50 dark:bg-emerald-950/50"
          iconColor="text-emerald-600 dark:text-emerald-400"
          onClick={() => onNavigateTab("finals")}
        />
        <GalleryMetricCard
          label="Comments"
          value={commentsCount}
          icon={MessageSquare}
          iconWrap="bg-amber-50 dark:bg-amber-950/50"
          iconColor="text-amber-600 dark:text-amber-400"
          onClick={() => onNavigateTab("selection")}
        />
        <GalleryMetricCard
          label="Flagged"
          value={flaggedFinalsCount}
          icon={Flag}
          iconWrap="bg-rose-50 dark:bg-rose-950/50"
          iconColor="text-rose-600 dark:text-rose-400"
          onClick={() => onNavigateTab("finals")}
        />
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Analytics</p>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          {published
            ? "Link views and downloads are tracked from when the gallery went online. Earlier visits aren’t included."
            : "Publish the gallery to start collecting link analytics."}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-zinc-100 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/40">
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Link views</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {published ? analytics.totalViews : "—"}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-100 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/40">
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              Client downloads
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {published ? analytics.clientDownloads : "—"}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-100 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/40">
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              Selection rate
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {analytics.selectionRate != null ? `${analytics.selectionRate}%` : "—"}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-100 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/40">
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              Client picks
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {analytics.clientPicks}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Activity (7 days)</p>
            <p className="mt-0.5 text-[11px] text-zinc-500">Selections and gallery events</p>
            <div className="mt-3">
              {published ? (
                <WeeklyActivityChart bars={analytics.weeklyActivity} />
              ) : (
                <p className="py-10 text-center text-xs text-zinc-400">
                  Offline — no activity tracked yet.
                </p>
              )}
            </div>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Media breakdown</p>
            <p className="mt-0.5 text-[11px] text-zinc-500">Uploads, selections, and finals</p>
            <div className="mt-4 flex min-h-[168px] items-center">
              <DonutChart
                slices={analytics.mediaSlices}
                totalLabel="Items"
                totalValue={String(mediaTotal)}
                emptyLabel="No media uploaded yet"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Share & access</p>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          {shareActive ? "Share this URL with your client." : "Enable sharing to send a link."}
        </p>

        <div className="mt-4 flex overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
          <p className="min-w-0 flex-1 truncate px-3 py-2.5 font-mono text-xs text-zinc-600 dark:text-zinc-300">
            {shareActive ? shareUrl : "Link not active yet"}
          </p>
          <div className="flex shrink-0 border-l border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              disabled={!shareActive}
              onClick={onCopyShare}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-zinc-700 transition hover:bg-white disabled:opacity-40 dark:text-zinc-200 dark:hover:bg-zinc-950"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden />
              {linkCopied ? "Copied" : "Copy"}
            </button>
            {shareActive ? (
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 border-l border-zinc-200 px-3 py-2.5 text-xs font-semibold text-brand transition hover:bg-white dark:border-zinc-700 dark:hover:bg-zinc-950"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                Open
              </a>
            ) : null}
          </div>
        </div>

        <ul className="mt-4 space-y-2 border-t border-zinc-100 pt-4 text-xs dark:border-zinc-800">
          <InfoRow label="Status" value={online ? "Online" : "Offline"} />
          <InfoRow label="Password" value={passwordProtection ? "Required" : "Off"} />
          <InfoRow
            label="Selection limit"
            value={selectionLimit != null ? `${selectionLimit} photos` : "Unlimited"}
          />
          <InfoRow label="Final delivery" value={finalImagesLocked ? "Locked" : "Open"} />
        </ul>
      </section>
    </div>
  );
}
