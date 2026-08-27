"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  BookOpen,
  CheckCircle2,
  Globe2,
  Handshake,
  Heart,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react";
import { ActivityFeedSkeleton } from "@/components/ui/skeletons";
import { LIVE_FEED_LIMIT } from "@/lib/dashboard-api";
import { cn } from "@/lib/utils";

export type ActivityRow = {
  title: string;
  when: string;
  galleryId?: string;
  href?: string;
  coverUrl?: string | null;
  kind?: "new" | "updated" | "completed" | "selection";
  /** Optional pre-parsed action (e.g. actionLabel) */
  action?: string;
  /** Optional secondary line (client, progress, etc.) */
  meta?: string;
  progressPercent?: number;
};

type DashboardActivityPanelProps = {
  rows: ActivityRow[];
  selectionRows?: ActivityRow[];
  clientRows?: ActivityRow[];
  loading?: boolean;
  formatRelativeTime: (iso: string) => string;
};

type TabKey = "activity" | "selections" | "clients";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "activity", label: "Activity" },
  { key: "selections", label: "Selections" },
  { key: "clients", label: "Clients" },
];

const KIND_ICON: Record<NonNullable<ActivityRow["kind"]>, typeof Sparkles> = {
  new: Sparkles,
  updated: RefreshCw,
  selection: Heart,
  completed: CheckCircle2,
};

const FALLBACK_ICONS = [Globe2, Handshake, BookOpen];

function inferKind(title: string): ActivityRow["kind"] {
  const lower = title.toLowerCase();
  if (lower.includes("new gallery")) return "new";
  if (lower.includes("completed") || lower.includes("delivered")) return "completed";
  if (lower.includes("selection") || lower.includes("proof")) return "selection";
  return "updated";
}

function parseSubtitle(title: string): { name: string; action: string } {
  const comma = title.indexOf(", ");
  if (comma === -1) return { action: title, name: "" };
  return { action: title.slice(0, comma), name: title.slice(comma + 2) };
}

function rowsForTab(
  tab: TabKey,
  rows: ActivityRow[],
  selectionRows: ActivityRow[] | undefined,
  clientRows: ActivityRow[] | undefined,
): ActivityRow[] {
  if (tab === "selections") {
    if (selectionRows) return selectionRows;
    return rows.filter((r) => (r.kind ?? inferKind(r.title)) === "selection");
  }
  if (tab === "clients") {
    if (clientRows) return clientRows;
    return rows.filter((r) => {
      const kind = r.kind ?? inferKind(r.title);
      return kind === "new" || kind === "completed" || kind === "updated";
    });
  }
  return rows;
}

function ActivityItem({
  row,
  idx,
  formatRelativeTime,
  tab,
}: {
  row: ActivityRow;
  idx: number;
  formatRelativeTime: (iso: string) => string;
  tab: TabKey;
}) {
  const [coverFailed, setCoverFailed] = useState(false);
  const kind = row.kind ?? inferKind(row.title);
  const Icon =
    tab === "clients"
      ? Users
      : (KIND_ICON[kind ?? "updated"] ?? FALLBACK_ICONS[idx % FALLBACK_ICONS.length]);
  const parsed = parseSubtitle(row.title);
  const name = row.action != null ? row.title : parsed.name || parsed.action;
  const action = row.action ?? parsed.action;
  const metaParts = [
    row.meta,
    action && action !== name ? action : null,
  ].filter(Boolean) as string[];
  const timeLabel = row.when ? formatRelativeTime(row.when) : null;
  const showCover = Boolean(row.coverUrl) && !coverFailed;

  const inner = (
    <div className="flex w-full items-start gap-3 py-3 sm:items-center sm:gap-4">
      {showCover ? (
        <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800 sm:h-10 sm:w-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={row.coverUrl!}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setCoverFailed(true)}
          />
        </span>
      ) : (
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#efefef] text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 sm:h-10 sm:w-10">
          <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </span>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3 sm:block">
            <p className="min-w-0 truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {name || action}
            </p>
            {timeLabel ? (
              <span className="shrink-0 text-[11px] tabular-nums text-zinc-400 sm:hidden">{timeLabel}</span>
            ) : null}
          </div>
          {typeof row.progressPercent === "number" ? (
            <div className="mt-1.5 h-1 w-full max-w-[12rem] overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800 sm:max-w-[16rem]">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${Math.max(0, Math.min(100, row.progressPercent))}%` }}
              />
            </div>
          ) : null}
          {metaParts.length > 0 ? (
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-zinc-400">
              {metaParts.map((part, i) => (
                <span key={`${part}-${i}`} className="contents">
                  {i > 0 ? <span className="shrink-0" aria-hidden>·</span> : null}
                  <span className="min-w-0">{part}</span>
                </span>
              ))}
            </p>
          ) : null}
        </div>
        {timeLabel ? (
          <span className="hidden shrink-0 text-[11px] tabular-nums text-zinc-400 sm:inline">{timeLabel}</span>
        ) : null}
      </div>
    </div>
  );

  const href =
    row.href ??
    (row.galleryId ? `/dashboard/folder/${row.galleryId}` : undefined);

  if (href) {
    return (
      <li>
        <Link
          href={href}
          className="block transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/40"
        >
          {inner}
        </Link>
      </li>
    );
  }

  return <li>{inner}</li>;
}

export function DashboardActivityPanel({
  rows,
  selectionRows,
  clientRows,
  loading,
  formatRelativeTime,
}: DashboardActivityPanelProps) {
  const [tab, setTab] = useState<TabKey>("activity");
  const filtered = rowsForTab(tab, rows, selectionRows, clientRows).slice(
    0,
    LIVE_FEED_LIMIT,
  );
  const emptyHint =
    tab === "selections"
      ? "Active client selections will show up here."
      : tab === "clients"
        ? "Recently added clients will show up here."
        : "Gallery updates and client selections will show up in this list.";

  return (
    <section className="flex h-full min-h-0 flex-col sm:min-h-[280px]">
      <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-lg">
        Today&apos;s Tasks
      </h2>

      <div className="mt-3 grid w-full grid-cols-3 gap-1 rounded-full bg-[#efefef] p-1 dark:bg-zinc-900 sm:mt-4 sm:inline-flex sm:w-fit sm:grid-cols-none">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "rounded-full px-2 py-1.5 text-[11px] font-semibold transition sm:px-3.5 sm:py-1.5 sm:text-xs",
                active
                  ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {loading && rows.length === 0 && !selectionRows?.length && !clientRows?.length ? (
        <div className="mt-2">
          <ActivityFeedSkeleton rows={LIVE_FEED_LIMIT} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 flex flex-1 flex-col items-center justify-center text-center">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#efefef] dark:bg-zinc-900">
            <Activity className="h-4 w-4 text-zinc-500" aria-hidden />
          </span>
          <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Nothing here yet
          </p>
          <p className="mt-1 max-w-xs text-xs text-zinc-500">{emptyHint}</p>
        </div>
      ) : (
        <ul className="mt-2 flex-1 divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {filtered.map((row, idx) => (
            <ActivityItem
              key={`${row.title}-${row.when}-${idx}`}
              row={row}
              idx={idx}
              formatRelativeTime={formatRelativeTime}
              tab={tab}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
