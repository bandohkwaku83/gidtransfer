"use client";

import Link from "next/link";
import { CalendarDays, Link2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { FolderCoverVisual } from "@/components/photographer/folder-cover-visual";
import {
  apiFolderStatusToUi,
  getFolderClientName,
  isGalleryPublished,
  type ApiFolder,
} from "@/lib/folders-api";
import type { FolderStatus } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const STATUS_DOT: Record<FolderStatus, string> = {
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

export function FolderCard({
  folder,
  clientNameById,
  studioDefaultCoverUrl,
  onEdit,
  onDelete,
  busy,
  compact = true,
  reorderable = false,
  isDragging = false,
  isDropTarget = false,
  isPressing = false,
  blockNavigation = false,
  onReorderPointerDown,
}: {
  folder: ApiFolder;
  clientNameById?: Map<string, string>;
  studioDefaultCoverUrl?: string | null;
  onEdit?: (folder: ApiFolder) => void;
  onDelete?: (folder: ApiFolder) => void | Promise<void>;
  busy?: boolean;
  compact?: boolean;
  reorderable?: boolean;
  isDragging?: boolean;
  isDropTarget?: boolean;
  isPressing?: boolean;
  blockNavigation?: boolean;
  onReorderPointerDown?: (event: React.PointerEvent<HTMLElement>) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const clientName = getFolderClientName(folder, clientNameById);
  const eventTitle = folder.eventName?.trim() || clientName;
  const subline = folder.eventName?.trim() ? clientName : folder.description || "—";
  const uiStatus = apiFolderStatusToUi(folder.status);
  const eventDateLabel = formatEventDate(folder.eventDate);
  const shared = isGalleryPublished(folder);
  const hasActions = Boolean(onEdit || onDelete);

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden border border-zinc-200/80 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-zinc-300/90 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700",
        compact ? "rounded-lg" : "rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-zinc-900/[0.03] hover:ring-zinc-900/[0.06] dark:ring-white/[0.04]",
        reorderable && "[-webkit-touch-callout:none]",
        busy && "pointer-events-none opacity-60",
        isDragging && "opacity-35",
        isPressing && "scale-[0.98] ring-2 ring-brand/40",
        isDropTarget && "ring-2 ring-brand/40 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950",
      )}
      onPointerDown={(event) => {
        if (!reorderable || !onReorderPointerDown) return;
        const target = event.target as HTMLElement;
        if (target.closest("button, [data-card-more-menu]")) return;
        onReorderPointerDown(event);
      }}
      onContextMenu={(event) => {
        if (!reorderable) return;
        event.preventDefault();
      }}
      onClickCapture={(event) => {
        if (!blockNavigation) return;
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <div className="relative">
        <Link
          href={`/dashboard/folder/${folder._id}`}
          className={cn(
            "relative block w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800/50",
            compact ? "aspect-[4/3]" : "aspect-[16/11] sm:aspect-[5/3]",
          )}
        >
          <FolderCoverVisual
            folder={folder}
            studioDefaultCoverUrl={studioDefaultCoverUrl}
            imgClassName="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent opacity-80 transition group-hover:opacity-100" />
        </Link>

        {shared ? (
          <div
            className={cn(
              "pointer-events-none absolute z-10 flex flex-wrap items-center gap-1",
              compact ? "left-1.5 top-1.5" : "left-2 top-2 sm:left-3 sm:top-3 sm:gap-1.5",
            )}
          >
            <span
              className={cn(
                "pointer-events-auto inline-flex items-center gap-0.5 rounded-full bg-zinc-900/55 font-semibold uppercase tracking-wide text-white ring-1 ring-white/20 backdrop-blur-md",
                compact ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-0.5 text-[9px]",
              )}
            >
              <Link2 className={compact ? "h-2 w-2" : "h-2.5 w-2.5"} aria-hidden />
              Shared
            </span>
          </div>
        ) : null}

        {hasActions ? (
          <div
            className={cn(
              "absolute z-10 flex items-center gap-0.5 transition",
              compact
                ? "right-1.5 top-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                : "bottom-0 left-0 right-0 justify-end gap-1 bg-gradient-to-t from-black/75 via-black/45 to-transparent px-1.5 pb-1.5 pt-8 sm:px-2 sm:pb-2.5 sm:top-auto sm:pt-10",
            )}
          >
            {compact ? (
              <div className="relative" data-card-more-menu>
                <button
                  type="button"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/90 text-zinc-700 shadow-sm backdrop-blur-sm transition hover:bg-white dark:bg-zinc-900/90 dark:text-zinc-200"
                  aria-label="Gallery actions"
                  aria-expanded={menuOpen}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenuOpen((open) => !open);
                  }}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" aria-hidden />
                </button>
                {menuOpen ? (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      aria-hidden
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute right-0 z-20 mt-1 min-w-[9rem] overflow-hidden rounded-lg border border-zinc-200/90 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-950">
                      {onEdit ? (
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setMenuOpen(false);
                            onEdit(folder);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                          Edit
                        </button>
                      ) : null}
                      {onDelete ? (
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40"
                          disabled={busy}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setMenuOpen(false);
                            if (busy) return;
                            if (
                              !window.confirm(
                                `Move gallery "${eventTitle}" to trash? You can restore it from Trash before the deadline.`,
                              )
                            ) {
                              return;
                            }
                            void onDelete(folder);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          Move to trash
                        </button>
                      ) : null}
                    </div>
                  </>
                ) : null}
              </div>
            ) : (
              <>
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
                    <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
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
                      if (
                        !window.confirm(
                          `Move gallery "${eventTitle}" to trash? You can restore it from Trash before the deadline.`,
                        )
                      ) {
                        return;
                      }
                      void onDelete(folder);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                  </button>
                ) : null}
              </>
            )}
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          "flex flex-1 flex-col border-t border-zinc-100 dark:border-zinc-800/80",
          compact ? "gap-1 p-2" : "p-2.5 pl-3 sm:p-4 sm:pl-5",
        )}
      >
        <Link
          href={`/dashboard/folder/${folder._id}`}
          className="block min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950"
        >
          <div className="flex items-center gap-1.5">
            <span
              className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_DOT[uiStatus])}
              aria-hidden
            />
            <h2
              className={cn(
                "min-w-0 flex-1 truncate font-semibold text-zinc-900 dark:text-zinc-50",
                compact ? "text-xs" : "text-[12px] sm:text-[15px]",
              )}
            >
              {eventTitle}
            </h2>
          </div>
          <p
            className={cn(
              "truncate text-zinc-500 dark:text-zinc-400",
              compact ? "mt-0.5 text-[10px]" : "mt-0.5 text-[10px] font-medium sm:mt-1 sm:text-xs",
            )}
          >
            {subline}
          </p>
        </Link>
        {eventDateLabel ? (
          <p
            className={cn(
              "flex items-center gap-1 tabular-nums text-zinc-400 dark:text-zinc-500",
              compact ? "text-[10px]" : "text-[10px] sm:text-[11px]",
            )}
          >
            <CalendarDays className="h-2.5 w-2.5 shrink-0 opacity-70" aria-hidden />
            {eventDateLabel}
          </p>
        ) : null}
      </div>
    </article>
  );
}
