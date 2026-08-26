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
    row.when ? formatRelativeTime(row.when) : null,
  ].filter(Boolean) as string[];
  const showCover = Boolean(row.coverUrl) && !coverFailed;

  const inner = (
    <div className="flex items-center gap-3 py-3">
      {showCover ? (
        <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={row.coverUrl!}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setCoverFailed(true)}
          />
        </span>
      ) : (
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#efefef] text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
          <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {name || action}
        </p>
        {typeof row.progressPercent === "number" ? (
          <div className="mt-1.5 h-1 w-full max-w-[9rem] overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${Math.max(0, Math.min(100, row.progressPercent))}%` }}
            />
          </div>
        ) : null}
        <p className="mt-0.5 flex items-center gap-x-2.5 overflow-hidden text-[11px] text-zinc-400">
          {metaParts.map((part, i) => (
            <span key={`${part}-${i}`} className="contents">
              {i > 0 ? <span className="shrink-0" aria-hidden>·</span> : null}
              <span className="min-w-0 truncate">{part}</span>
            </span>
          ))}
        </p>
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
    <section className="flex h-full min-h-[280px] flex-col">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Today&apos;s Tasks
      </h2>

      <div className="mt-4 inline-flex w-fit items-center gap-1 rounded-full bg-[#efefef] p-1 dark:bg-zinc-900">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
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
