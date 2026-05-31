"use client";

import type { LucideIcon } from "lucide-react";
import { CalendarCheck, CalendarDays, CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";

type OverviewStat = {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  accent: string;
  iconWrap: string;
  iconColor: string;
};

type BookingsOverviewStripProps = {
  weekCount: number | null;
  monthCount: number;
  todayCount: number;
  loading?: boolean;
};

export function BookingsOverviewStrip({
  weekCount,
  monthCount,
  todayCount,
  loading,
}: BookingsOverviewStripProps) {
  const items: OverviewStat[] = [
    {
      label: "This week",
      value: weekCount == null ? "N/A" : String(weekCount),
      hint: "Booked shoots",
      icon: CalendarRange,
      accent: "bg-brand",
      iconWrap: "bg-brand/10",
      iconColor: "text-brand",
    },
    {
      label: "This month",
      value: String(monthCount),
      hint: "In calendar view",
      icon: CalendarDays,
      accent: "bg-indigo-500",
      iconWrap: "bg-indigo-500/10",
      iconColor: "text-indigo-600 dark:text-indigo-400",
    },
    {
      label: "Today",
      value: String(todayCount),
      hint: "Shoots scheduled",
      icon: CalendarCheck,
      accent: "bg-emerald-500",
      iconWrap: "bg-emerald-500/10",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
  ];

  return (
    <section
      className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      aria-label="Bookings overview"
    >
      <div className="grid divide-y divide-zinc-100 sm:grid-cols-3 sm:divide-y-0 sm:divide-x dark:divide-zinc-800">
        {items.map((item) => (
          <div
            key={item.label}
            className="relative flex items-center gap-4 p-4 sm:p-5"
          >
            <span
              className={cn("absolute inset-y-0 left-0 w-1 opacity-80", item.accent)}
              aria-hidden
            />
            <span
              className={cn(
                "ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                item.iconWrap,
              )}
            >
              <item.icon className={cn("h-5 w-5", item.iconColor)} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {item.label}
              </p>
              <p className="mt-0.5 truncate text-xs text-zinc-500">{item.hint}</p>
            </div>
            {loading ? (
              <div
                className="h-8 w-12 shrink-0 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800"
                aria-hidden
              />
            ) : (
              <p className="shrink-0 text-2xl font-semibold tabular-nums leading-none text-zinc-900 dark:text-zinc-50">
                {item.value}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
