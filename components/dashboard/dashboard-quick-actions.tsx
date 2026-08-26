"use client";

import Link from "next/link";
import { FolderPlus, UserPlus, CalendarDays, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

type DashboardQuickActionsProps = {
  onNewGallery: () => void;
  onAddClient: () => void;
};

const ACTIONS = [
  {
    key: "gallery",
    label: "New gallery",
    hint: "Start a delivery project",
    icon: FolderPlus,
  },
  {
    key: "client",
    label: "Add client",
    hint: "Grow your CRM",
    icon: UserPlus,
  },
  {
    key: "bookings",
    label: "Bookings",
    hint: "Schedule & reminders",
    icon: CalendarDays,
    href: "/dashboard/schedules",
  },
  {
    key: "income",
    label: "Income",
    hint: "Track studio revenue",
    icon: Wallet,
    href: "/dashboard/income",
  },
] as const;

export function DashboardQuickActions({ onNewGallery, onAddClient }: DashboardQuickActionsProps) {
  return (
    <div className="dashboard-panel flex h-full flex-col">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Quick actions</h3>
      <p className="mt-0.5 text-xs text-zinc-500">Common studio tasks</p>
      <div className="mt-4 grid flex-1 grid-cols-2 gap-2.5">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          const className = cn(
            "flex flex-col items-start rounded-xl border border-zinc-200/80 bg-zinc-50/40 p-3 text-left transition hover:border-brand/20 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-brand/30 dark:hover:bg-zinc-900",
          );
          const body = (
            <>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-on-dark">
                <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="mt-3 block text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                {action.label}
              </span>
              <span className="mt-0.5 block text-[10px] text-zinc-500">{action.hint}</span>
            </>
          );
          if ("href" in action && action.href) {
            return (
              <Link key={action.key} href={action.href} className={className}>
                {body}
              </Link>
            );
          }
          return (
            <button
              key={action.key}
              type="button"
              onClick={action.key === "gallery" ? onNewGallery : onAddClient}
              className={className}
            >
              {body}
            </button>
          );
        })}
      </div>
    </div>
  );
}
