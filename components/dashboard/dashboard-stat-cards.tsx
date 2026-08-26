"use client";

import Link from "next/link";
import type { DashboardStatItem } from "@/components/dashboard/dashboard-stat-strip";
import { cn } from "@/lib/utils";

type DashboardStatCardsProps = {
  items: DashboardStatItem[];
  loading?: boolean;
};

export function DashboardStatCards({ items, loading }: DashboardStatCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <StatMiniCard key={item.label} item={item} loading={loading} />
      ))}
    </div>
  );
}

function StatMiniCard({ item, loading }: { item: DashboardStatItem; loading?: boolean }) {
  const Icon = item.icon;
  const isZero = !loading && item.value === "0";
  const delta = item.delta;
  const hasDelta = typeof delta === "number" && delta !== 0;

  return (
    <Link href={item.href} className="dashboard-stat-card group">
      <div className="dashboard-stat-card-head">
        <p className="dashboard-stat-card-title">{item.label}</p>
        <span className={cn("dashboard-stat-card-icon", item.iconWrap)}>
          <Icon className={cn("h-3.5 w-3.5", item.iconColor)} strokeWidth={1.75} aria-hidden />
        </span>
      </div>

      <div className="dashboard-stat-card-foot">
        {loading ? (
          <span className="dashboard-stat-card-value-skeleton" aria-hidden />
        ) : (
          <div className="flex items-end justify-between gap-2">
            <p
              className={cn(
                "dashboard-stat-card-value",
                isZero && "text-zinc-300 dark:text-zinc-600",
              )}
            >
              {item.value}
            </p>
            {hasDelta ? (
              <span
                className={cn(
                  "mb-0.5 shrink-0 text-[11px] font-semibold tabular-nums",
                  delta! > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-500 dark:text-red-400",
                )}
              >
                {delta! > 0 ? "+" : ""}
                {delta}
              </span>
            ) : (
              <span className="mb-0.5 truncate text-[11px] text-zinc-400 dark:text-zinc-500">
                {item.hint}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
