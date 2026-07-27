"use client";

import type { LucideIcon } from "lucide-react";
import { CalendarCheck, CalendarDays, CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";

type OverviewStat = {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
};

type BookingsOverviewStripProps = {
  weekCount: number | null;
  monthCount: number;
  todayCount: number;
  loading?: boolean;
};

function OverviewCard({
  item,
  loading,
}: {
  item: OverviewStat;
  loading?: boolean;
}) {
  const Icon = item.icon;
  const isZero = !loading && item.value === "0";

  return (
    <article className="dashboard-stat-card group">
      <span className="dashboard-stat-card-glow" aria-hidden />

      <div className="relative z-[1] min-w-0 pr-8">
        <p className="dashboard-stat-card-title">{item.label}</p>
        <p className="dashboard-stat-card-hint">{item.hint}</p>

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
      </div>

      <span className="dashboard-stat-card-corner-icon" aria-hidden>
        <Icon strokeWidth={1.75} />
      </span>
    </article>
  );
}

export function BookingsOverviewStrip({
  weekCount,
  monthCount,
  todayCount,
  loading,
}: BookingsOverviewStripProps) {
  const items: OverviewStat[] = [
    {
      label: "Today",
      value: String(todayCount),
      hint: "Shoots scheduled",
      icon: CalendarCheck,
    },
    {
      label: "This week",
      value: weekCount == null ? "N/A" : String(weekCount),
      hint: "Booked shoots",
      icon: CalendarRange,
    },
    {
      label: "This month",
      value: String(monthCount),
      hint: "In calendar view",
      icon: CalendarDays,
    },
  ];

  return (
    <section
      className="grid gap-3 sm:grid-cols-3"
      aria-label="Bookings overview"
      aria-busy={loading}
    >
      {items.map((item) => (
        <OverviewCard key={item.label} item={item} loading={loading} />
      ))}
    </section>
  );
}
