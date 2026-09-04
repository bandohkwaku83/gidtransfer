"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { WeeklyBar } from "@/lib/dashboard-chart-data";
import { DashboardStatValueSkeleton } from "@/components/ui/skeletons";
import { cn } from "@/lib/utils";

type DashboardSoftEduChartCardProps = {
  bars: WeeklyBar[];
  todayCount: number;
  weekTotal: number;
  todayDelta: number;
  weekDelta: number;
  loading?: boolean;
};

function SoftAreaChart({ bars }: { bars: WeeklyBar[] }) {
  const width = 560;
  const height = 180;
  const padX = 10;
  const padY = 18;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const max = Math.max(1, ...bars.map((b) => b.value));

  const points = bars.map((bar, i) => {
    const x = padX + (i / Math.max(1, bars.length - 1)) * innerW;
    const y = padY + innerH - (bar.value / max) * innerH;
    return { x, y, bar };
  });

  const linePath =
    points.length > 0
      ? points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
      : "";
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1]!.x} ${height} L ${points[0]!.x} ${height} Z`
      : "";

  const last = points[points.length - 1];

  return (
    <div className="mt-4 w-full" role="img" aria-label="Studio activity over the last 7 days">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="block h-[160px] w-full sm:h-[180px]"
        aria-hidden
      >
        <defs>
          <linearGradient id="soft-edu-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#55001F" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#55001F" stopOpacity={0} />
          </linearGradient>
        </defs>
        {Array.from({ length: 4 }).map((_, i) => {
          const y = padY + (i / 3) * innerH;
          return (
            <line
              key={i}
              x1={padX}
              x2={width - padX}
              y1={y}
              y2={y}
              stroke="currentColor"
              className="text-zinc-100 dark:text-zinc-800"
              strokeWidth={1}
            />
          );
        })}
        {areaPath ? <path d={areaPath} fill="url(#soft-edu-fill)" /> : null}
        {linePath ? (
          <path
            d={linePath}
            fill="none"
            stroke="#55001F"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="dark:stroke-[#e899b0]"
          />
        ) : null}
        {last ? (
          <circle
            cx={last.x}
            cy={last.y}
            r={4.5}
            fill="#55001F"
            className="dark:fill-[#e899b0]"
          />
        ) : null}
      </svg>
      {bars.length > 0 ? (
        <div className="mt-2 flex justify-between px-1">
          {bars.map((bar) => (
            <span key={bar.dateKey} className="text-[10px] font-medium text-zinc-400">
              {bar.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) return null;
  const positive = delta > 0;
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
        positive
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300",
      )}
    >
      {positive ? "+" : ""}
      {delta}
    </span>
  );
}

export function DashboardSoftEduChartCard({
  bars,
  todayCount,
  weekTotal,
  todayDelta,
  weekDelta,
  loading,
}: DashboardSoftEduChartCardProps) {
  const onTrack = weekDelta >= 0;

  return (
    <div className="dashboard-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Studio activity
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">Gallery events over the last 7 days</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
              onTrack
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
            )}
          >
            <CheckCircle2 className="h-3 w-3" aria-hidden />
            {onTrack ? "On track" : "Slower week"}
          </span>
          <Link
            href="/dashboard/galleries"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand dark:text-brand-on-dark"
          >
            Details
            <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-6">
        <div>
          <p className="text-xs font-medium text-zinc-500">This week</p>
          {loading ? (
            <DashboardStatValueSkeleton className="mt-1" />
          ) : (
            <div className="mt-1 flex items-center gap-2">
              <span className="font-display text-3xl font-medium tabular-nums text-zinc-900 dark:text-zinc-50">
                {weekTotal}
              </span>
              <DeltaBadge delta={weekDelta} />
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-500">Today</p>
          {loading ? (
            <DashboardStatValueSkeleton className="mt-1" />
          ) : (
            <div className="mt-1 flex items-center gap-2">
              <span className="font-display text-2xl font-medium tabular-nums text-zinc-900 dark:text-zinc-50">
                {todayCount}
              </span>
              <DeltaBadge delta={todayDelta} />
            </div>
          )}
        </div>
      </div>

      <SoftAreaChart bars={bars} />
    </div>
  );
}
