"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Heart,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { ActivityFeedSkeleton } from "@/components/ui/skeletons";
import { LIVE_FEED_LIMIT } from "@/lib/dashboard-api";
import { cn } from "@/lib/utils";

export type ActivityRow = {
  title: string;
  when: string;
  galleryId?: string;
  coverUrl?: string | null;
  kind?: "new" | "updated" | "completed" | "selection";
};


type DashboardActivityPanelProps = {
  rows: ActivityRow[];
  loading?: boolean;
  formatRelativeTime: (iso: string) => string;
  formatDateColumn: (iso: string) => string;
};

const KIND_CONFIG: Record<
  NonNullable<ActivityRow["kind"]>,
  {
    label: string;
    icon: typeof Sparkles;
    iconWrap: string;
    iconColor: string;
    ring: string;
  }
> = {
  new: {
    label: "New gallery",
    icon: Sparkles,
    iconWrap: "bg-brand/10 dark:bg-brand/20",
    iconColor: "text-brand dark:text-brand-on-dark",
    ring: "ring-brand/20",
  },
  updated: {
    label: "Updated",
    icon: RefreshCw,
    iconWrap: "bg-sky-50 dark:bg-sky-950/40",
    iconColor: "text-sky-600 dark:text-sky-300",
    ring: "ring-sky-200/60 dark:ring-sky-800/50",
  },
  selection: {
    label: "Proofing",
    icon: Heart,
    iconWrap: "bg-amber-50 dark:bg-amber-950/40",
    iconColor: "text-amber-600 dark:text-amber-300",
    ring: "ring-amber-200/60 dark:ring-amber-800/50",
  },
  completed: {
    label: "Delivered",
    icon: CheckCircle2,
    iconWrap: "bg-emerald-50 dark:bg-emerald-950/40",
    iconColor: "text-emerald-600 dark:text-emerald-300",
    ring: "ring-emerald-200/60 dark:ring-emerald-800/50",
  },
};

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

function groupByDate(
  rows: ActivityRow[],
  formatDateColumn: (iso: string) => string,
): { label: string; rows: ActivityRow[] }[] {
  const groups = new Map<string, ActivityRow[]>();
  for (const row of rows) {
    const label = formatDateColumn(row.when);
    const existing = groups.get(label);
    if (existing) existing.push(row);
    else groups.set(label, [row]);
  }
  return Array.from(groups.entries()).map(([label, groupRows]) => ({
    label,
    rows: groupRows,
  }));
}

function ActivityItem({
  row,
  idx,
  formatRelativeTime,
}: {
  row: ActivityRow;
  idx: number;
  formatRelativeTime: (iso: string) => string;
}) {
  const kind = row.kind ?? inferKind(row.title);
  const config = KIND_CONFIG[kind ?? "updated"];
  const Icon = config.icon;
  const { action, name } = parseSubtitle(row.title);
  const key = `${row.title}-${row.when}-${idx}`;

  const inner = (
    <div className="relative flex gap-2 rounded-lg p-1.5">
      {row.coverUrl ? (
        <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg ring-1 ring-inset ring-zinc-200/70 dark:ring-zinc-700/60">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={row.coverUrl} alt="" className="h-full w-full object-cover" />
          <span
            className={cn(
              "absolute bottom-0 right-0 inline-flex h-3.5 w-3.5 items-center justify-center rounded-sm ring-1 ring-inset ring-white/20",
              config.iconWrap,
              config.ring,
            )}
          >
            <Icon className={cn("h-2 w-2", config.iconColor)} strokeWidth={2} aria-hidden />
          </span>
        </span>
      ) : (
        <span
          className={cn(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
            config.iconWrap,
            config.ring,
          )}
        >
          <Icon className={cn("h-3.5 w-3.5", config.iconColor)} strokeWidth={1.75} aria-hidden />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            {name || action}
          </p>
          <span className="shrink-0 text-[10px] font-medium tabular-nums text-zinc-400 dark:text-zinc-500">
            {formatRelativeTime(row.when)}
          </span>
        </div>
        <span
          className={cn(
            "mt-0.5 inline-flex items-center rounded px-1 py-px text-[9px] font-semibold leading-tight",
            config.iconWrap,
            config.iconColor,
          )}
        >
          {config.label}
        </span>
      </div>
    </div>
  );

  if (row.galleryId) {
    return (
      <li key={key}>
        <Link
          href={`/dashboard/folder/${row.galleryId}`}
          className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          {inner}
        </Link>
      </li>
    );
  }

  return (
    <li key={key}>
      {inner}
    </li>
  );
}

export function DashboardActivityPanel({
  rows,
  loading,
  formatRelativeTime,
  formatDateColumn,
}: DashboardActivityPanelProps) {
  const visibleRows = rows.slice(0, LIVE_FEED_LIMIT);
  const groups = groupByDate(visibleRows, formatDateColumn);

  return (
    <div className="dashboard-panel relative flex h-full min-h-[320px] flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand/[0.06] blur-3xl dark:bg-brand/10"
        aria-hidden
      />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="dashboard-section-label">Live feed</p>
          <h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Recent activity
          </h2>
          <p className="mt-1 text-xs text-zinc-500">Proofing, uploads & delivery</p>
        </div>
        <Link
          href="/dashboard/galleries"
          className="dashboard-icon-btn"
          aria-label="Open galleries"
        >
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      {loading && rows.length === 0 ? (
        <ActivityFeedSkeleton rows={LIVE_FEED_LIMIT} />
      ) : rows.length === 0 ? (
        <div className="relative mt-8 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200/80 bg-zinc-50/50 px-6 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 dark:bg-brand/20">
            <Activity className="h-5 w-5 text-brand dark:text-brand-on-dark" aria-hidden />
          </span>
          <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-200">No activity yet</p>
          <p className="mt-1 max-w-xs text-xs text-zinc-500">
            Gallery updates and client proofing will show up here.
          </p>
        </div>
      ) : (
        <div className="relative mt-3 flex-1 space-y-2">
          {groups.map((group) => (
            <section key={group.label}>
              <div className="mb-1 flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                  {group.label}
                </span>
                <span className="h-px flex-1 bg-gradient-to-r from-zinc-200 to-transparent dark:from-zinc-800" />
              </div>
              <ul className="relative space-y-0 pl-0.5 before:absolute before:bottom-1 before:left-[1.125rem] before:top-1 before:w-px before:bg-gradient-to-b before:from-zinc-200 before:via-zinc-200/60 before:to-transparent dark:before:from-zinc-800 dark:before:via-zinc-800/60">
                {group.rows.map((row, idx) => (
                  <ActivityItem
                    key={`${row.title}-${row.when}-${idx}`}
                    row={row}
                    idx={idx}
                    formatRelativeTime={formatRelativeTime}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {rows.length > 0 ? (
        <Link
          href="/dashboard/galleries"
          className="relative mt-3 inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200/80 bg-zinc-50/80 py-2 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-200"
        >
          View all activity
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}
