"use client";

import type { LucideIcon } from "lucide-react";
import {
  ChevronRight,
  Copy,
  ExternalLink,
  Flag,
  ImageIcon,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { WeeklyActivityChart } from "@/components/dashboard/dashboard-charts";
import {
  ToggleSwitch,
  type FolderEditorTab,
} from "@/components/photographer/folder-detail-editor-ui";
import type { GalleryAnalyticsSnapshot } from "@/lib/gallery-analytics";
import { usePlanEntitlements } from "@/lib/use-plan-entitlements";
import { cn } from "@/lib/utils";

export type GalleryDashboardPanelProps = {
  title: string;
  clientName: string;
  eventDateLabel: string;
  coverSrc: string;
  hasCover: boolean;
  published: boolean;
  shareExpired?: boolean;
  uploadsCount: number;
  finalsCount: number;
  commentsCount: number;
  flaggedFinalsCount: number;
  shareActive: boolean;
  shareUrl: string;
  linkCopied: boolean;
  analytics: GalleryAnalyticsSnapshot;
  statusBusy?: boolean;
  activationHint: string;
  onNavigateTab: (tab: FolderEditorTab) => void;
  onCopyShare: () => void;
  onOnlineChange: (online: boolean) => void;
};

const card =
  "rounded-[1.75rem] bg-white shadow-[0_12px_40px_-20px_rgba(15,23,42,0.22)] dark:bg-zinc-950 dark:shadow-none dark:ring-1 dark:ring-zinc-800";

function WorkspaceRow({
  icon: Icon,
  label,
  detail,
  onClick,
  active,
}: {
  icon: LucideIcon;
  label: string;
  detail: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition",
        active
          ? "bg-zinc-100 dark:bg-zinc-900"
          : "hover:bg-zinc-50 dark:hover:bg-zinc-900/70",
      )}
    >
      <span
        className={cn(
          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          active
            ? "bg-brand text-white"
            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">{label}</span>
        <span className="block truncate text-xs text-zinc-500">{detail}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300 dark:text-zinc-600" aria-hidden />
    </button>
  );
}

export function GalleryDashboardPanel({
  title,
  clientName,
  eventDateLabel,
  coverSrc,
  hasCover,
  published,
  shareExpired,
  uploadsCount,
  finalsCount,
  commentsCount,
  flaggedFinalsCount,
  shareActive,
  shareUrl,
  linkCopied,
  analytics,
  statusBusy,
  activationHint,
  onNavigateTab,
  onCopyShare,
  onOnlineChange,
}: GalleryDashboardPanelProps) {
  const { openUpgrade, can } = usePlanEntitlements();
  const advancedLocked =
    analytics.upgrade != null ||
    analytics.tier === "basic" ||
    !can("advancedAnalytics");
  const mediaTotal = analytics.mediaSlices.reduce((sum, s) => sum + s.value, 0);
  const selectionsCount =
    analytics.mediaSlices.find((s) => s.key === "selections")?.value ?? 0;
  const online = published && !shareExpired;
  const showClient =
    Boolean(clientName?.trim()) &&
    clientName.trim().toLowerCase() !== title.trim().toLowerCase();
  const statusHint = online
    ? "Clients can open your gallery link."
    : shareExpired
      ? "Link expired — turn on to reactivate sharing."
      : activationHint;

  const weekTotal = analytics.weeklyActivity.reduce((sum, b) => sum + b.value, 0);
  const peakDay = analytics.weeklyActivity.reduce(
    (best, bar) => (bar.value > best.value ? bar : best),
    analytics.weeklyActivity[0] ?? { label: "—", value: 0, dateKey: "" },
  );

  const ringPct = analytics.selectionRate ?? 0;
  const ringCenter =
    analytics.selectionRate != null ? `${analytics.selectionRate}%` : "—";

  const size = 140;
  const stroke = 11;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const ringOffset = circ - (Math.min(100, Math.max(0, ringPct)) / 100) * circ;

  const mediaRows = [
    { label: "Uploads", value: uploadsCount, tab: "uploads" as const, color: "bg-brand" },
    {
      label: "Selections",
      value: selectionsCount,
      tab: "selection" as const,
      color: "bg-zinc-400 dark:bg-zinc-500",
    },
    { label: "Finals", value: finalsCount, tab: "finals" as const, color: "bg-emerald-500" },
  ];

  return (
    <div className="rounded-[2rem] bg-zinc-100 p-3 dark:bg-zinc-900/50 sm:p-4">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:grid-rows-[auto_auto_auto]">
        {/* Hero — photographic, like the profile card */}
        <section
          className={cn(
            card,
            "relative overflow-hidden lg:col-span-4 lg:row-span-2 lg:min-h-[420px]",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverSrc}
            alt=""
            className={cn(
              "absolute inset-0 h-full w-full object-cover",
              !hasCover && "opacity-40",
            )}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(12,16,28,0.15) 0%, rgba(12,16,28,0.25) 40%, rgba(12,16,28,0.88) 100%)",
            }}
            aria-hidden
          />
          <div className="relative z-[1] flex h-full min-h-[320px] flex-col justify-between p-5 text-white sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md",
                  online ? "bg-emerald-400/20 text-emerald-100" : "bg-white/15 text-white/80",
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    online ? "bg-emerald-300" : "bg-white/50",
                  )}
                  aria-hidden
                />
                {online ? "Online" : "Offline"}
              </span>
              <div className="flex items-center gap-2 rounded-full bg-black/25 py-1 pr-1 pl-2.5 backdrop-blur-md">
                <span className="text-[11px] font-medium text-white/70">
                  {online ? "Live" : "Off"}
                </span>
                <ToggleSwitch
                  label={online ? "Set gallery offline" : "Set gallery online"}
                  checked={online}
                  disabled={statusBusy}
                  onChange={onOnlineChange}
                />
              </div>
            </div>

            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/50">
                {eventDateLabel}
              </p>
              <h2 className="mt-2 max-w-[16ch] text-3xl font-semibold leading-tight tracking-tight">
                {title}
              </h2>
              {showClient ? (
                <p className="mt-1.5 text-sm text-white/65">{clientName}</p>
              ) : null}
              <p className="mt-3 max-w-sm text-xs leading-relaxed text-white/45">{statusHint}</p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={!shareActive}
                  onClick={onCopyShare}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/25 disabled:opacity-40"
                >
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                  {linkCopied ? "Copied" : "Copy link"}
                </button>
                {shareActive ? (
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900 transition hover:bg-zinc-100"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    Open
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {/* Progress chart */}
        <section className={cn(card, "p-5 lg:col-span-5 sm:p-6")}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Progress</p>
              {advancedLocked ? (
                <p className="mt-1 text-xs text-zinc-500">7-day activity is on Premium and Studio.</p>
              ) : (
                <p className="mt-1 text-xs text-zinc-500">
                  <span className="font-semibold text-brand dark:text-brand-on-dark">{weekTotal}</span>{" "}
                  events this week
                  {peakDay.value > 0 ? (
                    <>
                      {" "}
                      · peak{" "}
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        {peakDay.label}
                      </span>
                    </>
                  ) : null}
                </p>
              )}
            </div>
            {!advancedLocked && peakDay.value > 0 ? (
              <span className="rounded-full bg-brand px-2.5 py-1 text-[11px] font-semibold text-white">
                {peakDay.label} · {peakDay.value}
              </span>
            ) : null}
          </div>
          <div className="mt-5">
            {advancedLocked ? (
              <div className="flex h-[120px] flex-col items-center justify-center gap-3 rounded-2xl bg-zinc-100 px-4 text-center dark:bg-zinc-900">
                <p className="text-xs text-zinc-500">
                  {analytics.upgrade?.message ?? "Unlock reports for daily activity and downloads."}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    openUpgrade({
                      feature: analytics.upgrade?.feature ?? "advancedAnalytics",
                      message: analytics.upgrade?.message ?? undefined,
                      requiredPlans: analytics.upgrade?.requiredPlans,
                    })
                  }
                  className="rounded-xl bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover"
                >
                  Unlock reports
                </button>
              </div>
            ) : published ? (
              <WeeklyActivityChart bars={analytics.weeklyActivity} />
            ) : (
              <div className="flex h-[120px] items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900">
                <p className="text-xs text-zinc-400">Go live to track weekly progress.</p>
              </div>
            )}
          </div>
        </section>

        {/* Engagement ring — meaningful percent */}
        <section
          className={cn(card, "flex flex-col items-center justify-center p-5 lg:col-span-3")}
        >
          <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90" aria-hidden>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke="currentColor"
                strokeWidth={stroke}
                className="text-zinc-100 dark:text-zinc-800"
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke="currentColor"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={ringOffset}
                className="text-brand transition-[stroke-dashoffset] duration-700 dark:text-brand-on-dark"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <p className="text-[1.65rem] font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
                {ringCenter}
              </p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                Select rate
              </p>
            </div>
          </div>
          <div className="mt-4 grid w-full grid-cols-2 gap-2 text-center">
            <div className="rounded-2xl bg-zinc-100 px-2 py-2 dark:bg-zinc-900">
              <p className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {published ? analytics.totalViews : "—"}
              </p>
              <p className="text-[10px] text-zinc-500">Views</p>
            </div>
            <div className="rounded-2xl bg-zinc-100 px-2 py-2 dark:bg-zinc-900">
              <p className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {published && !advancedLocked ? analytics.clientDownloads : "—"}
              </p>
              <p className="text-[10px] text-zinc-500">Downloads</p>
            </div>
          </div>
        </section>

        {/* Library — sits beside cover (cover is row-span-2) */}
        <section className={cn(card, "p-5 lg:col-span-8 sm:p-6")}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Library</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {mediaTotal} items · jump into any section
              </p>
            </div>
            <p className="text-xs font-semibold tabular-nums text-zinc-400">
              {analytics.clientPicks} picks
            </p>
          </div>

          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            {mediaRows.map((row) => {
              const pct = mediaTotal > 0 ? (row.value / mediaTotal) * 100 : 0;
              if (pct <= 0) return null;
              return (
                <button
                  key={row.label}
                  type="button"
                  title={`${row.label}: ${row.value}`}
                  onClick={() => onNavigateTab(row.tab)}
                  className={cn("h-full transition hover:opacity-85", row.color)}
                  style={{ width: `${pct}%` }}
                />
              );
            })}
          </div>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {mediaRows.map((row) => (
              <span
                key={row.label}
                className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500"
              >
                <span className={cn("h-2 w-2 rounded-full", row.color)} aria-hidden />
                {row.label}{" "}
                <span className="font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">
                  {row.value}
                </span>
              </span>
            ))}
          </div>

          <div className="mt-4 grid gap-0.5 sm:grid-cols-2">
            <WorkspaceRow
              icon={ImageIcon}
              label="Uploads"
              detail="Raw files"
              onClick={() => onNavigateTab("uploads")}
              active={uploadsCount > 0}
            />
            <WorkspaceRow
              icon={Sparkles}
              label="Finals"
              detail="Deliverables"
              onClick={() => onNavigateTab("finals")}
              active={finalsCount > 0}
            />
            <WorkspaceRow
              icon={MessageSquare}
              label="Comments"
              detail={commentsCount > 0 ? `${commentsCount} notes` : "Client notes"}
              onClick={() => onNavigateTab("selection")}
              active={commentsCount > 0}
            />
            <WorkspaceRow
              icon={Flag}
              label="Flagged"
              detail={flaggedFinalsCount > 0 ? `${flaggedFinalsCount} to review` : "Needs review"}
              onClick={() => onNavigateTab("finals")}
              active={flaggedFinalsCount > 0}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
