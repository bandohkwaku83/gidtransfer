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

const STRIP_CARD_CLASS =
  "group relative flex flex-col overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#171717] px-3.5 py-3 shadow-sm transition hover:border-[#333333] hover:bg-[#1f1f1f]";

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
    <article className={STRIP_CARD_CLASS}>
      <span
        className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/5 opacity-60 blur-2xl transition group-hover:opacity-80"
        aria-hidden
      />

      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold leading-tight tracking-tight text-zinc-50">
            {item.label}
          </p>
          <p className="mt-0.5 text-[10px] leading-snug text-zinc-500">{item.hint}</p>
        </div>
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2a2a2a]">
          <Icon className="h-3.5 w-3.5 text-zinc-500" strokeWidth={1.75} aria-hidden />
        </span>
      </div>

      <div className="mt-2.5">
        {loading ? (
          <span className="inline-block h-6 w-8 animate-pulse rounded bg-[#2a2a2a]" aria-hidden />
        ) : (
          <p
            className={cn(
              "font-display text-[1.35rem] font-normal leading-none tabular-nums text-zinc-50",
              isZero && "text-zinc-600",
            )}
          >
            {item.value}
          </p>
        )}
      </div>
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
