"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type SoftEduStatItem = {
  label: string;
  value: string;
  hint: string;
  href: string;
  icon: LucideIcon;
  iconWrap: string;
  iconColor: string;
  delta?: number;
  deltaLabel?: string;
};

type DashboardSoftEduStatCardsProps = {
  items: SoftEduStatItem[];
  loading?: boolean;
};

export function DashboardSoftEduStatCards({ items, loading }: DashboardSoftEduStatCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <SoftEduStatCard key={item.label} item={item} loading={loading} />
      ))}
    </div>
  );
}

function SoftEduStatCard({ item, loading }: { item: SoftEduStatItem; loading?: boolean }) {
  const Icon = item.icon;
  const hasDelta = typeof item.delta === "number" && item.delta !== 0;
  const positive = (item.delta ?? 0) > 0;

  return (
    <Link href={item.href} className="dashboard-stat-card group !px-4 !py-4">
      <div className="flex items-start justify-between gap-3">
        <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-xl", item.iconWrap)}>
          <Icon className={cn("h-4 w-4", item.iconColor)} strokeWidth={1.75} aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-xs font-medium text-zinc-500">{item.label}</p>
      {loading ? (
        <span className="dashboard-stat-card-value-skeleton mt-2 block" aria-hidden />
      ) : (
        <p className="mt-1 font-display text-[1.85rem] font-medium leading-none tabular-nums text-zinc-900 dark:text-zinc-50">
          {item.value}
        </p>
      )}
      <div className="mt-3 flex items-center gap-1.5 text-[11px]">
        {hasDelta ? (
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-0.5 font-semibold tabular-nums",
              positive
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300",
            )}
          >
            {positive ? "+" : ""}
            {item.delta}
          </span>
        ) : null}
        <span className="text-zinc-400">{item.deltaLabel ?? item.hint}</span>
      </div>
    </Link>
  );
}
