"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardStatItem = {
  label: string;
  value: string;
  hint: string;
  href: string;
  icon: LucideIcon;
  accent: string;
  iconWrap: string;
  iconColor: string;
};

type DashboardStatStripProps = {
  items: DashboardStatItem[];
  loading?: boolean;
};

export function DashboardStatStrip({ items, loading }: DashboardStatStripProps) {
  return (
    <section
      className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      aria-label="Workspace overview"
    >
      <div className="grid divide-y divide-zinc-100 sm:grid-cols-2 sm:divide-y-0 sm:divide-x dark:divide-zinc-800 xl:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="group relative flex items-center gap-4 p-5 transition hover:bg-zinc-50/90 dark:hover:bg-zinc-900/50"
          >
            <span
              className={cn(
                "absolute inset-y-0 left-0 w-1 opacity-80 transition group-hover:opacity-100",
                item.accent,
              )}
              aria-hidden
            />
            <span
              className={cn(
                "ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                item.iconWrap,
              )}
            >
              <item.icon className={cn("h-5 w-5", item.iconColor)} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{item.label}</p>
              <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-500">{item.hint}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {loading ? (
                <div className="h-9 w-10 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" aria-hidden />
              ) : (
                <p className="text-3xl font-semibold tabular-nums leading-none text-zinc-900 dark:text-zinc-50">
                  {item.value}
                </p>
              )}
              <ArrowUpRight
                className="h-3.5 w-3.5 text-zinc-300 opacity-0 transition group-hover:opacity-100 dark:text-zinc-600"
                aria-hidden
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
