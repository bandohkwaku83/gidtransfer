"use client";

import Link from "next/link";
import { CalendarDays, Link2, Pencil, Trash2 } from "lucide-react";
import { FolderCoverVisual } from "@/components/photographer/folder-cover-visual";
import {
  apiFolderStatusToUi,
  getFolderClientName,
  type ApiFolder,
} from "@/lib/folders-api";
import type { FolderStatus } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const STATUS_ACCENT: Record<FolderStatus, string> = {
  COMPLETED: "bg-emerald-500",
  SELECTION_PENDING: "bg-amber-500",
  DRAFT: "bg-zinc-400",
};

function formatEventDate(iso?: string): string | null {
  const raw = iso?.trim();
  if (!raw) return null;
  const d = new Date(raw.includes("T") ? raw : `${raw}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function shareIsActive(folder: ApiFolder): boolean {
  if (folder.shareExpired) return false;
  if (folder.share?.enabled === false) return false;
  return Boolean(folder.shareUrl || folder.share?.code || folder.share?.slug);
}

function statusPill(folder: ApiFolder) {
  const s = apiFolderStatusToUi(folder.status);
  if (s === "COMPLETED") {
    return (
      <span className="rounded-full bg-emerald-500/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm sm:px-2 sm:text-[10px]">
        Done
      </span>
    );
  }
  if (s === "SELECTION_PENDING") {
    return (
      <span className="rounded-full bg-amber-500/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm sm:px-2 sm:text-[10px]">
        Selecting
      </span>
    );
  }
  return (
    <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white ring-1 ring-white/25 backdrop-blur-sm sm:px-2 sm:text-[10px]">
      Draft
    </span>
  );
}

export function FolderCard({
  folder,
  clientNameById,
  studioDefaultCoverUrl,
  onEdit,
  onDelete,
  busy,
}: {
  folder: ApiFolder;
  clientNameById?: Map<string, string>;
  studioDefaultCoverUrl?: string | null;
  onEdit?: (folder: ApiFolder) => void;
  onDelete?: (folder: ApiFolder) => void | Promise<void>;
  busy?: boolean;
}) {
  const clientName = getFolderClientName(folder, clientNameById);
  const created = folder.createdAt
    ? new Date(folder.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";

  const eventTitle = folder.eventName?.trim() || clientName;
  const subline = folder.eventName?.trim() ? clientName : folder.description || "N/A";
  const uiStatus = apiFolderStatusToUi(folder.status);
  const eventDateLabel = formatEventDate(folder.eventDate);
  const shared = shareIsActive(folder);

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-zinc-900/[0.03] transition-shadow duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-zinc-900/[0.06] dark:border-zinc-800 dark:bg-zinc-950 dark:ring-white/[0.04]",
        busy && "pointer-events-none opacity-60",
      )}
    >
      <span
        className={cn("absolute inset-y-0 left-0 z-10 w-1", STATUS_ACCENT[uiStatus])}
        aria-hidden
      />
      <div className="relative">
        <Link
          href={`/dashboard/folder/${folder._id}`}
          className="relative block aspect-[16/11] w-full overflow-hidden bg-zinc-100 sm:aspect-[5/3] dark:bg-zinc-800/50"
        >
          <FolderCoverVisual
            folder={folder}
            studioDefaultCoverUrl={studioDefaultCoverUrl}
            imgClassName="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        </Link>

        <div className="pointer-events-none absolute left-2 top-2 z-10 flex flex-wrap items-center gap-1 sm:left-3 sm:top-3 sm:gap-1.5">
          <span className="pointer-events-auto">{statusPill(folder)}</span>
          {shared ? (
            <span className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-semibold text-white ring-1 ring-white/25 backdrop-blur-sm sm:px-2 sm:text-[10px]">
              <Link2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" aria-hidden />
              Shared
            </span>
          ) : null}
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-end gap-1 bg-gradient-to-t from-black/75 via-black/45 to-transparent px-1.5 pb-1.5 pt-8 sm:px-2 sm:pb-2.5 sm:pt-10">
          {onEdit ? (
            <button
              type="button"
              className="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/20 text-white shadow-sm backdrop-blur-sm transition hover:bg-white/35 sm:h-9 sm:w-9 sm:rounded-lg"
              aria-label="Edit gallery"
              title="Edit"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(folder);
              }}
            >
              <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
            </button>
          ) : null}

          {onDelete ? (
            <button
              type="button"
              className="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/15 text-red-200 shadow-sm backdrop-blur-sm transition hover:bg-red-500/90 hover:text-white sm:h-9 sm:w-9 sm:rounded-lg"
              aria-label="Move gallery to trash"
              title="Move to trash"
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (busy) return;
                if (!window.confirm(`Move gallery "${eventTitle}" to trash? You can restore it from Trash before the deadline.`)) return;
                void onDelete(folder);
              }}
            >
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col border-t border-zinc-100 p-2.5 pl-3 sm:p-4 sm:pl-5 dark:border-zinc-800/80">
        <Link
          href={`/dashboard/folder/${folder._id}`}
          className="block min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950"
        >
          <h2 className="truncate text-[12px] font-semibold leading-snug text-zinc-900 sm:text-[15px] dark:text-zinc-50">
            {eventTitle}
          </h2>
          <p className="mt-0.5 truncate text-[10px] font-medium text-zinc-500 sm:mt-1 sm:text-xs dark:text-zinc-400">{subline}</p>
        </Link>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-medium text-zinc-400 sm:mt-3 sm:gap-x-3 sm:text-[11px] dark:text-zinc-500">
          {eventDateLabel ? (
            <span className="inline-flex items-center gap-1 tabular-nums">
              <CalendarDays className="h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3" aria-hidden />
              {eventDateLabel}
            </span>
          ) : null}
          <span className="tabular-nums">Created {created}</span>
        </div>
      </div>
    </article>
  );
}
