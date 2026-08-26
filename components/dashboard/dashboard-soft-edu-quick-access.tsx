"use client";

import Link from "next/link";
import {
  CalendarDays,
  FolderOpen,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type QuickAccessRow = {
  key: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  href: string;
};

type DashboardSoftEduQuickAccessProps = {
  onNewGallery: () => void;
  totalGalleries: number;
  clientCount: number;
  loading?: boolean;
};

function SoftLineArt() {
  return (
    <svg
      viewBox="0 0 120 56"
      className="h-14 w-[7.5rem] shrink-0 text-white/90"
      aria-hidden
    >
      <path
        d="M4 42 C18 38, 22 20, 34 22 C46 24, 48 40, 60 36 C72 32, 74 12, 86 16 C98 20, 102 34, 116 28"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="86" cy="16" r="3.5" fill="currentColor" />
    </svg>
  );
}

function QuickAccessRowItem({
  row,
  loading,
}: {
  row: QuickAccessRow;
  loading?: boolean;
}) {
  const Icon = row.icon;
  return (
    <Link
      href={row.href}
      className="flex w-full items-center gap-3 rounded-[1.15rem] bg-white px-4 py-3.5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{row.label}</p>
        {loading ? (
          <span className="mt-1.5 block h-3 w-28 animate-pulse rounded bg-zinc-300/80 dark:bg-zinc-700" />
        ) : (
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{row.hint}</p>
        )}
      </div>
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-on-dark">
        <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      </span>
    </Link>
  );
}

export function DashboardSoftEduQuickAccess({
  onNewGallery,
  totalGalleries,
  clientCount,
  loading,
}: DashboardSoftEduQuickAccessProps) {
  const galleryHint =
    totalGalleries === 1 ? "1 gallery · open all" : `${totalGalleries} galleries · open all`;
  const clientHint =
    clientCount === 1 ? "1 client · open directory" : `${clientCount} clients · open directory`;

  const rows: QuickAccessRow[] = [
    {
      key: "galleries",
      label: "Galleries",
      hint: galleryHint,
      href: "/dashboard/galleries",
      icon: FolderOpen,
    },
    {
      key: "clients",
      label: "Clients",
      hint: clientHint,
      href: "/dashboard/clients",
      icon: Users,
    },
    {
      key: "bookings",
      label: "Bookings",
      hint: "Schedule & reminders",
      href: "/dashboard/schedules",
      icon: CalendarDays,
    },
  ];

  return (
    <section className="flex h-full flex-col">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Quick access
      </h2>

      <button
        type="button"
        onClick={onNewGallery}
        className="mt-4 flex w-full items-center justify-between gap-4 rounded-[1.35rem] bg-[#231519] px-5 py-5 text-left shadow-[0_18px_40px_rgba(0,0,0,0.18)] transition hover:bg-[#2e1c22]"
      >
        <div className="min-w-0">
          <p className="font-display text-xl font-semibold leading-tight tracking-tight text-white sm:text-[1.35rem]">
            Your own delivery way
          </p>
          <p className="mt-1.5 max-w-[14rem] text-xs leading-relaxed text-white/70">
            Set your gallery plan and grow with every client share.
          </p>
        </div>
        <SoftLineArt />
      </button>

      <ul className="mt-3 flex flex-1 flex-col gap-2.5">
        {rows.map((row) => (
          <li key={row.key}>
            <QuickAccessRowItem row={row} loading={loading} />
          </li>
        ))}
      </ul>
    </section>
  );
}
