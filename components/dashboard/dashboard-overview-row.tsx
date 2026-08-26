"use client";

import Link from "next/link";
import { CalendarDays } from "lucide-react";

type DashboardOverviewRowProps = {
  greeting: string;
  todayLabel: string;
  onNewGallery: () => void;
  onAddClient: () => void;
};

export function DashboardOverviewRow({
  greeting,
  todayLabel,
  onNewGallery,
  onAddClient,
}: DashboardOverviewRowProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-medium tabular-nums text-zinc-400 dark:text-zinc-500">
          {todayLabel}
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-[1.85rem]">
          Hi, {greeting}
        </h1>
        <p className="mt-1 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
          Your studio at a glance — galleries, clients, and delivery activity.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button type="button" onClick={onNewGallery} className="dashboard-btn-primary">
          New gallery
        </button>
        <button type="button" onClick={onAddClient} className="dashboard-btn-secondary">
          Add client
        </button>
        <Link
          href="/dashboard/schedules"
          className="inline-flex items-center gap-1.5 px-2 py-2 text-sm font-medium text-zinc-500 transition hover:text-brand dark:text-zinc-400 dark:hover:text-brand-on-dark"
        >
          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
          Bookings
        </Link>
      </div>
    </div>
  );
}
