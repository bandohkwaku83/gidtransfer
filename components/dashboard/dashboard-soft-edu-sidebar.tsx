"use client";

import Link from "next/link";
import { Check, Flame, Sparkles } from "lucide-react";
import type { WeeklyBar } from "@/lib/dashboard-chart-data";
import { cn } from "@/lib/utils";

type DashboardSoftEduSidebarProps = {
  bars: WeeklyBar[];
  weekTotal: number;
  weekDelta: number;
  onNewGallery: () => void;
};

export function DashboardSoftEduCtaCard({ onNewGallery }: { onNewGallery: () => void }) {
  return (
    <div className="dashboard-edu-cta relative overflow-hidden rounded-[1.25rem] p-5 sm:p-6">
      <div className="relative z-[1]">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand dark:text-brand-on-dark">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Boost your studio
        </p>
        <h3 className="mt-2 font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Keep delivery moving
        </h3>
        <p className="mt-1.5 max-w-[16rem] text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Create a gallery, invite a client, and stay on top of selections this week.
        </p>
        <button
          type="button"
          onClick={onNewGallery}
          className="mt-5 inline-flex items-center rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
        >
          New gallery
        </button>
        <Link
          href="/dashboard/schedules"
          className="mt-3 block text-xs font-semibold text-brand hover:underline dark:text-brand-on-dark"
        >
          Or open bookings →
        </Link>
      </div>
    </div>
  );
}

export function DashboardSoftEduStreakCard({
  bars,
  weekTotal,
  weekDelta,
}: {
  bars: WeeklyBar[];
  weekTotal: number;
  weekDelta: number;
}) {
  const activeDays = bars.filter((b) => b.value > 0).length;
  const streakLabel = activeDays === 1 ? "1 active day" : `${activeDays} active days`;

  return (
    <div className="dashboard-panel !rounded-[1.25rem]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Delivery streak</h3>
          <p className="mt-0.5 text-xs text-zinc-500">{streakLabel} this week</p>
        </div>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300">
          <Flame className="h-4 w-4" aria-hidden />
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between gap-1.5">
        {bars.map((bar) => {
          const done = bar.value > 0;
          return (
            <div key={bar.dateKey} className="flex flex-1 flex-col items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition",
                  done
                    ? "bg-brand text-white dark:bg-brand/90"
                    : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500",
                )}
                title={`${bar.label}: ${bar.value}`}
              >
                {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden /> : bar.label.slice(0, 1)}
              </span>
              <span className="text-[10px] font-medium text-zinc-400">{bar.label}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2.5 dark:bg-zinc-900/50">
        <span className="text-xs text-zinc-500">This week</span>
        <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
          {weekTotal}
          {weekDelta !== 0 ? (
            <span
              className={cn(
                "ml-2 text-[11px] font-semibold",
                weekDelta > 0 ? "text-emerald-600" : "text-red-500",
              )}
            >
              {weekDelta > 0 ? "+" : ""}
              {weekDelta}
            </span>
          ) : null}
        </span>
      </div>
    </div>
  );
}

export function DashboardSoftEduPipelineCard({
  inProgress,
  completed,
  total,
}: {
  inProgress: number;
  completed: number;
  total: number;
}) {
  const other = Math.max(0, total - inProgress - completed);
  const rows = [
    { label: "In progress", value: inProgress, color: "bg-amber-400" },
    { label: "Delivered", value: completed, color: "bg-emerald-500" },
    { label: "Other", value: other, color: "bg-zinc-300 dark:bg-zinc-600" },
  ].filter((row) => row.value > 0 || row.label !== "Other");
  const denom = Math.max(1, total);

  return (
    <div className="dashboard-panel !rounded-[1.25rem]">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Gallery pipeline</h3>
      <p className="mt-0.5 text-xs text-zinc-500">Where your projects sit right now</p>
      <ul className="mt-5 space-y-4">
        {rows.map((row) => {
          const pct = Math.round((row.value / denom) * 100);
          return (
            <li key={row.label}>
              <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">{row.label}</span>
                <span className="tabular-nums text-zinc-500">
                  {row.value} · {pct}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", row.color)}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function DashboardSoftEduSidebarWidgets(props: DashboardSoftEduSidebarProps & {
  inProgress: number;
  completed: number;
  total: number;
}) {
  return (
    <div className="flex flex-col gap-4">
      <DashboardSoftEduCtaCard onNewGallery={props.onNewGallery} />
      <DashboardSoftEduStreakCard
        bars={props.bars}
        weekTotal={props.weekTotal}
        weekDelta={props.weekDelta}
      />
      <DashboardSoftEduPipelineCard
        inProgress={props.inProgress}
        completed={props.completed}
        total={props.total}
      />
    </div>
  );
}
