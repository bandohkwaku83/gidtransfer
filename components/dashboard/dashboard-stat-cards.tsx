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

  return (
    <Link href={item.href} className="dashboard-stat-card group">
      <span className="dashboard-stat-card-glow" aria-hidden />

      <div className="dashboard-stat-card-head">
        <div className="min-w-0">
          <p className="dashboard-stat-card-title">{item.label}</p>
          <p className="dashboard-stat-card-hint">{item.hint}</p>
        </div>
        <span className={cn("dashboard-stat-card-icon", item.iconWrap)}>
          <Icon className={cn("h-3.5 w-3.5", item.iconColor)} strokeWidth={1.75} aria-hidden />
        </span>
      </div>

      <div className="dashboard-stat-card-foot">
        {loading ? (
          <span className="dashboard-stat-card-value-skeleton" aria-hidden />
        ) : (
          <p
            className={cn(
              "dashboard-stat-card-value",
              isZero && "text-zinc-300 dark:text-zinc-600",
            )}
          >
            {item.value}
          </p>
        )}
      </div>
    </Link>
  );
}
