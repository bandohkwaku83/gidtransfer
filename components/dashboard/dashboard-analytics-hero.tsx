"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { WeeklyBar } from "@/lib/dashboard-chart-data";
import { DashboardStatValueSkeleton } from "@/components/ui/skeletons";
import { cn } from "@/lib/utils";

type SideStat = {
  label: string;
  value: string;
  delta?: number;
  href: string;
  hint: string;
};

type DashboardAnalyticsHeroProps = {
  primaryLabel: string;
  primaryValue: string;
  primaryDelta: number;
  primaryHref: string;
  bars: WeeklyBar[];
  sideStats: SideStat[];
  loading?: boolean;
};

function TrendAreaChart({ bars }: { bars: WeeklyBar[] }) {
  const width = 520;
  const height = 160;
  const padX = 8;
  const padY = 16;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const max = Math.max(1, ...bars.map((b) => b.value));

  const points = bars.map((bar, i) => {
    const x = padX + (i / Math.max(1, bars.length - 1)) * innerW;
    const y = padY + innerH - (bar.value / max) * innerH;
    return { x, y };
  });

  const linePath =
    points.length > 0
      ? points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
      : "";
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1]!.x} ${height} L ${points[0]!.x} ${height} Z`
      : "";

  return (
    <div className="mt-2 w-full" role="img" aria-label="Activity trend">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="block h-[140px] w-full sm:h-[160px]"
        aria-hidden
      >
        <defs>
          <linearGradient id="analytics-trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#55001F" stopOpacity={0.16} />
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
              strokeWidth={1}
              className="text-zinc-100 dark:text-zinc-800"
            />
          );
        })}
        {areaPath ? <path d={areaPath} fill="url(#analytics-trend-fill)" stroke="none" /> : null}
        {linePath ? (
          <path
            d={linePath}
            fill="none"
            stroke="#55001F"
            strokeWidth={2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="dark:stroke-[#e899b0]"
          />
        ) : null}
      </svg>
      {bars.length > 0 ? (
        <div className="mt-1 flex justify-between px-1">
          {bars.map((bar) => (
            <span
              key={bar.dateKey}
              className="text-[10px] font-medium tabular-nums text-zinc-400 dark:text-zinc-500"
            >
              {bar.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DeltaLabel({ delta }: { delta: number }) {
  if (delta === 0) {
    return <span className="text-xs font-semibold tabular-nums text-zinc-400">0</span>;
  }
  const positive = delta > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums",
        positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400",
      )}
    >
      <ArrowUpRight className={cn("h-3.5 w-3.5", !positive && "rotate-90")} aria-hidden />
      {positive ? "+" : ""}
      {delta}
    </span>
  );
}

export function DashboardAnalyticsHero({
  primaryLabel,
  primaryValue,
  primaryDelta,
  primaryHref,
  bars,
  sideStats,
  loading,
}: DashboardAnalyticsHeroProps) {
  return (
    <div className="dashboard-panel overflow-hidden">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.35fr)_minmax(11rem,0.75fr)] lg:items-stretch">
        <div className="min-w-0">
          <p className="text-xs font-medium text-zinc-500">{primaryLabel}</p>
          {loading ? (
            <DashboardStatValueSkeleton className="mt-2" />
          ) : (
            <div className="mt-1 flex items-end gap-3">
              <Link
                href={primaryHref}
                className="font-display text-[2.5rem] font-medium leading-none tabular-nums tracking-tight text-zinc-900 transition hover:text-brand dark:text-zinc-50 dark:hover:text-brand-on-dark"
              >
                {primaryValue}
              </Link>
              <DeltaLabel delta={primaryDelta} />
            </div>
          )}
          <p className="mt-2 text-xs text-zinc-400">vs previous period</p>
        </div>

        <div className="min-w-0 lg:border-l lg:border-zinc-100 lg:pl-6 dark:lg:border-zinc-800">
          <TrendAreaChart bars={bars} />
        </div>

        <div className="flex flex-col justify-center gap-4 border-t border-zinc-100 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0 dark:border-zinc-800">
          {sideStats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="group flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-zinc-500">{stat.label}</p>
                {loading ? (
                  <DashboardStatValueSkeleton className="mt-1" />
                ) : (
                  <p className="mt-0.5 font-display text-xl font-medium tabular-nums text-zinc-900 group-hover:text-brand dark:text-zinc-50 dark:group-hover:text-brand-on-dark">
                    {stat.value}
                  </p>
                )}
                <p className="mt-0.5 text-[10px] text-zinc-400">{stat.hint}</p>
              </div>
              {typeof stat.delta === "number" ? <DeltaLabel delta={stat.delta} /> : null}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
