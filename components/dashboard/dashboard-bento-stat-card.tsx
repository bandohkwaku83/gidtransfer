"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { WeeklyBar } from "@/lib/dashboard-chart-data";
import { cn } from "@/lib/utils";

type DashboardBentoStatCardProps = {
  label: string;
  value: string;
  hint?: string;
  href: string;
  icon: LucideIcon;
  iconWrap: string;
  iconColor: string;
  delta?: number;
  sparkline?: WeeklyBar[];
  sparklineColor?: string;
  loading?: boolean;
};

function MiniSparkline({
  bars,
  color = "#55001F",
}: {
  bars: WeeklyBar[];
  color?: string;
}) {
  const width = 120;
  const height = 36;
  const pad = 2;
  const values = bars.map((b) => b.value);
  const max = Math.max(1, ...values);

  const points = bars.map((bar, i) => {
    const x = pad + (i / Math.max(1, bars.length - 1)) * (width - pad * 2);
    const y = pad + (height - pad * 2) - (bar.value / max) * (height - pad * 2);
    return `${x},${y}`;
  });

  const linePath =
    points.length > 0 ? `M ${points.join(" L ")}` : "";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-9 w-[7.5rem] shrink-0"
      aria-hidden
    >
      {linePath ? (
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </svg>
  );
}

export function DashboardBentoStatCard({
  label,
  value,
  hint,
  href,
  icon: Icon,
  iconWrap,
  iconColor,
  delta,
  sparkline,
  sparklineColor,
  loading,
}: DashboardBentoStatCardProps) {
  const hasDelta = typeof delta === "number" && delta !== 0;
  const positive = (delta ?? 0) > 0;

  return (
    <Link href={href} className="dashboard-panel group flex flex-1 flex-col justify-between transition hover:border-brand/20">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-zinc-500">{label}</p>
          {loading ? (
            <span className="dashboard-stat-card-value-skeleton mt-2 block" aria-hidden />
          ) : (
            <p className="mt-1 font-display text-[2rem] font-medium leading-none tabular-nums text-zinc-900 dark:text-zinc-50">
              {value}
            </p>
          )}
        </div>
        <span className={cn("inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", iconWrap)}>
          <Icon className={cn("h-3.5 w-3.5", iconColor)} strokeWidth={1.75} aria-hidden />
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-2">
        {sparkline && sparkline.length > 0 ? (
          <MiniSparkline bars={sparkline} color={sparklineColor} />
        ) : (
          <span className="text-[11px] text-zinc-400">{hint}</span>
        )}
        {hasDelta ? (
          <span
            className={cn(
              "shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
              positive
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300",
            )}
          >
            {positive ? "+" : ""}
            {delta}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
