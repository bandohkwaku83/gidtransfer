"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Images, Plus } from "lucide-react";
import { FolderCoverVisual } from "@/components/photographer/folder-cover-visual";
import {
  apiFolderStatusToUi,
  getFolderClientName,
  type ApiFolder,
} from "@/lib/folders-api";
import type { FolderStatus } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<FolderStatus, string> = {
  DRAFT: "Draft",
  SELECTION_PENDING: "Selecting",
  COMPLETED: "Delivered",
};

const STATUS_BADGE: Record<FolderStatus, string> = {
  DRAFT: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  SELECTION_PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  COMPLETED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
};

type DashboardFeaturedGalleryCardProps = {
  folder: ApiFolder | null;
  clientNameById?: Map<string, string>;
  studioDefaultCoverUrl?: string | null;
  onNewGallery: () => void;
  loading?: boolean;
};

export function DashboardFeaturedGalleryCard({
  folder,
  clientNameById,
  studioDefaultCoverUrl,
  onNewGallery,
  loading,
}: DashboardFeaturedGalleryCardProps) {
  if (loading && !folder) {
    return (
      <div className="dashboard-panel flex h-full min-h-[320px] flex-col overflow-hidden p-0">
        <div className="aspect-[16/10] animate-pulse bg-zinc-100 dark:bg-zinc-800/60" />
        <div className="space-y-3 p-5">
          <div className="h-5 w-40 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-4 w-56 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="dashboard-panel flex h-full min-h-[320px] flex-col items-center justify-center p-6 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 dark:bg-brand/20">
          <Images className="h-5 w-5 text-brand dark:text-brand-on-dark" aria-hidden />
        </span>
        <h2 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          No active gallery
        </h2>
        <p className="mt-1 max-w-xs text-sm text-zinc-500">
          Create a gallery to start delivery, selections, and client sharing.
        </p>
        <button type="button" onClick={onNewGallery} className="dashboard-btn-primary mt-5">
          <Plus className="mr-1.5 h-4 w-4" aria-hidden />
          New gallery
        </button>
      </div>
    );
  }

  const clientName = getFolderClientName(folder, clientNameById);
  const title = folder.eventName?.trim() || clientName;
  const status = apiFolderStatusToUi(folder.status);
  const eventDate = folder.eventDate
    ? new Date(folder.eventDate.includes("T") ? folder.eventDate : `${folder.eventDate}T12:00:00`).toLocaleDateString(
        undefined,
        { month: "short", day: "numeric", year: "numeric" },
      )
    : "—";
  const updated = folder.updatedAt ?? folder.createdAt;
  const updatedLabel = updated
    ? new Date(updated).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "—";

  return (
    <Link
      href={`/dashboard/folder/${folder._id}`}
      className="dashboard-panel group flex h-full min-h-[320px] flex-col overflow-hidden p-0 transition hover:border-brand/20"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800/50">
        <FolderCoverVisual
          folder={folder}
          studioDefaultCoverUrl={studioDefaultCoverUrl}
          imgClassName="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
        <span
          className={cn(
            "absolute left-4 top-4 inline-flex rounded-lg px-2 py-1 text-[11px] font-semibold",
            STATUS_BADGE[status],
          )}
        >
          {STATUS_LABEL[status]}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
          Latest gallery
        </p>
        <h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h2>
        <p className="mt-1 truncate text-sm text-zinc-500">{clientName}</p>

        <div className="mt-auto grid grid-cols-3 gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <MetaCell icon={CalendarDays} label="Shoot" value={eventDate} />
          <MetaCell label="Updated" value={updatedLabel} />
          <MetaCell
            label="Status"
            value={STATUS_LABEL[status]}
            valueClassName={status === "COMPLETED" ? "text-emerald-600 dark:text-emerald-400" : undefined}
          />
        </div>

        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand dark:text-brand-on-dark">
          Open gallery
          <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

function MetaCell({
  label,
  value,
  icon: Icon,
  valueClassName,
}: {
  label: string;
  value: string;
  icon?: typeof CalendarDays;
  valueClassName?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
        {Icon ? <Icon className="h-3 w-3" aria-hidden /> : null}
        {label}
      </p>
      <p className={cn("mt-0.5 truncate text-xs font-semibold text-zinc-800 dark:text-zinc-200", valueClassName)}>
        {value}
      </p>
    </div>
  );
}
