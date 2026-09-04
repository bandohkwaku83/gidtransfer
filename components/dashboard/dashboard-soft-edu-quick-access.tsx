"use client";

import Link from "next/link";
import {
  CalendarDays,
  FolderOpen,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Skeleton } from "antd";

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
      className="h-14 w-[7.5rem] shrink-0 text-white/90 max-sm:hidden"
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
      className="flex w-full items-center gap-3 rounded-[1rem] bg-[#f6f6f7] px-3.5 py-3 text-left transition hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 sm:rounded-[1.15rem] sm:bg-white sm:px-4 sm:py-3.5 sm:shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:sm:bg-zinc-950 dark:sm:hover:bg-zinc-900"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{row.label}</p>
        {loading ? (
          <span className="mt-1.5 block">
            <Skeleton active title={{ width: 112, style: { height: 12, margin: 0 } }} paragraph={false} />
          </span>
        ) : (
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{row.hint}</p>
        )}
      </div>
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-on-dark sm:h-11 sm:w-11 sm:rounded-2xl">
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
    <section className="flex h-full flex-col rounded-[1.25rem] bg-white p-4 dark:bg-zinc-950 sm:rounded-[1.35rem] sm:p-0 sm:bg-transparent dark:sm:bg-transparent">
      <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-lg">
        Quick access
      </h2>

      <button
        type="button"
        onClick={onNewGallery}
        className="mt-3 flex w-full flex-col items-start gap-3 rounded-[1.15rem] bg-[#231519] px-4 py-4 text-left shadow-[0_18px_40px_rgba(0,0,0,0.18)] transition hover:bg-[#2e1c22] sm:mt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:rounded-[1.35rem] sm:px-5 sm:py-5"
      >
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold leading-tight tracking-tight text-white sm:text-xl lg:text-[1.35rem]">
            Your own delivery way
          </p>
          <p className="mt-1 text-xs leading-relaxed text-white/70 sm:mt-1.5 sm:max-w-[14rem]">
            Set your gallery plan and grow with every client share.
          </p>
        </div>
        <SoftLineArt />
      </button>

      <ul className="mt-2.5 flex flex-1 flex-col gap-2 sm:mt-3 sm:gap-2.5">
        {rows.map((row) => (
          <li key={row.key}>
            <QuickAccessRowItem row={row} loading={loading} />
          </li>
        ))}
      </ul>
    </section>
  );
}
