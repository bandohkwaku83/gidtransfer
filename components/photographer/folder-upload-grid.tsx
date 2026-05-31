"use client";

import type { ComponentType, RefObject } from "react";
import { Flag, Lock, Trash2, Upload } from "lucide-react";
import { InlineActionSkeleton } from "@/components/ui/skeletons";
import { cn } from "@/lib/utils";

export type FolderUploadGridItem = {
  id: string;
  name: string;
  mediaSrc: string;
  isVideo: boolean;
  locked?: boolean;
  flagged?: boolean;
};

function MediaThumb({ src, name, isVideo }: { src: string; name: string; isVideo: boolean }) {
  return (
    <>
      {isVideo ? (
        <video
          src={src}
          muted
          playsInline
          preload="metadata"
          aria-label={name}
          className="pointer-events-none h-full w-full bg-black object-cover"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="pointer-events-none h-full w-full object-cover" loading="lazy" />
      )}
      {isVideo ? (
        <span className="pointer-events-none absolute left-2 bottom-2 z-[5] rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
          Video
        </span>
      ) : null}
    </>
  );
}

export function FolderUploadSectionHeader({
  icon: Icon,
  title,
  description,
  count,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
  count?: number;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand dark:bg-brand/15 dark:text-brand-on-dark">
        <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h3>
          {count != null && count > 0 ? (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {count} {count === 1 ? "file" : "files"}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
    </div>
  );
}

export function FolderUploadBulkToolbar({
  selectedCount,
  allSelected,
  onSelectAll,
  onDeleteSelected,
  onDeleteAll,
  deletingKey,
  mediaDeleteBlocked,
  deleteKeyPrefix,
  selectAllRef,
}: {
  selectedCount: number;
  allSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  onDeleteSelected: () => void;
  onDeleteAll: () => void;
  deletingKey: string | null;
  mediaDeleteBlocked: boolean;
  deleteKeyPrefix: "raw" | "final";
  selectAllRef?: RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50/80 px-2.5 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
      <label className="inline-flex cursor-pointer select-none items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-white/80 dark:text-zinc-300 dark:hover:bg-zinc-800/80">
        <input
          ref={selectAllRef}
          type="checkbox"
          checked={allSelected}
          disabled={mediaDeleteBlocked}
          onChange={(e) => onSelectAll(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-zinc-300 text-brand focus:ring-brand dark:border-zinc-600"
        />
        Select all
      </label>
      <span className="hidden h-4 w-px bg-zinc-200 sm:block dark:bg-zinc-700" aria-hidden />
      {selectedCount > 0 ? (
        <span className="px-1 text-[11px] font-medium tabular-nums text-zinc-500 dark:text-zinc-400">
          {selectedCount} selected
        </span>
      ) : null}
      <button
        type="button"
        onClick={onDeleteSelected}
        disabled={mediaDeleteBlocked || selectedCount === 0}
        className="ml-auto inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        {deletingKey === `${deleteKeyPrefix}:bulk` ? <InlineActionSkeleton /> : "Delete selected"}
      </button>
      <button
        type="button"
        onClick={onDeleteAll}
        disabled={mediaDeleteBlocked}
        className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-950/40"
      >
        {deletingKey === `${deleteKeyPrefix}:all` ? <InlineActionSkeleton /> : "Delete all"}
      </button>
    </div>
  );
}

/** Always visible on touch-sized viewports; on `sm+` show on hover unless selected. */
function tileChromeVisibility(selected: boolean) {
  return selected
    ? "opacity-100"
    : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100";
}

export function FolderUploadMediaGrid({
  items,
  selectedIds,
  onToggleSelected,
  onOpenPreview,
  onDelete,
  deletingKey,
  mediaDeleteBlocked,
  deleteKeyPrefix,
}: {
  items: FolderUploadGridItem[];
  selectedIds: Set<string>;
  onToggleSelected: (id: string) => void;
  onOpenPreview: (id: string) => void;
  onDelete: (id: string) => void;
  deletingKey: string | null;
  mediaDeleteBlocked: boolean;
  deleteKeyPrefix: "raw" | "final";
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((item) => {
        const selected = selectedIds.has(item.id);
        const deleting = deletingKey === `${deleteKeyPrefix}:${item.id}`;
        return (
          <li key={item.id}>
            <article
              className={cn(
                "group relative overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-900/5 transition dark:bg-zinc-800/80 dark:ring-white/10",
                selected && "ring-2 ring-inset ring-brand",
              )}
            >
              <div className="relative aspect-square w-full overflow-hidden">
                <button
                  type="button"
                  className="absolute inset-0 z-0 flex h-full w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/50"
                  onClick={() => onOpenPreview(item.id)}
                  aria-label={`Preview ${item.name}`}
                >
                  <MediaThumb src={item.mediaSrc} name={item.name} isVideo={item.isVideo} />
                </button>

                <div
                  className={cn(
                    "pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25 transition-opacity",
                    tileChromeVisibility(selected),
                  )}
                  aria-hidden
                />

                <label
                  className={cn(
                    "absolute left-1.5 top-1.5 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md bg-black/40 text-white backdrop-blur-sm transition",
                    tileChromeVisibility(selected),
                    selected && "bg-brand",
                  )}
                >
                  <input
                    type="checkbox"
                    className="h-3 w-3 shrink-0 rounded-[2px] border-0 bg-white/90 text-brand outline-none accent-brand focus:ring-0 focus:ring-offset-0"
                    checked={selected}
                    onChange={() => onToggleSelected(item.id)}
                    disabled={mediaDeleteBlocked}
                    aria-label={`Select ${item.name}`}
                  />
                </label>

                <button
                  type="button"
                  disabled={mediaDeleteBlocked || deleting}
                  onClick={() => onDelete(item.id)}
                  className={cn(
                    "absolute right-1.5 top-1.5 z-10 inline-flex h-6 w-6 items-center justify-center rounded-md bg-black/40 text-white backdrop-blur-sm transition hover:bg-red-600/90",
                    tileChromeVisibility(selected),
                  )}
                  title="Move to trash"
                >
                  {deleting ? (
                    <InlineActionSkeleton />
                  ) : (
                    <Trash2 className="h-3 w-3" aria-hidden />
                  )}
                  <span className="sr-only">Move to trash</span>
                </button>

                {item.flagged ? (
                  <span className="pointer-events-none absolute bottom-2 left-2 z-10 inline-flex items-center gap-0.5 rounded-md bg-rose-600/90 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                    <Flag className="h-2.5 w-2.5" aria-hidden />
                    Flagged
                  </span>
                ) : null}
                {item.locked ? (
                  <span className="pointer-events-none absolute bottom-2 right-2 z-10 inline-flex items-center gap-0.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                    <Lock className="h-2.5 w-2.5" aria-hidden />
                    Locked
                  </span>
                ) : null}
                <p
                  className={cn(
                    "pointer-events-none absolute inset-x-0 bottom-0 z-10 truncate px-2.5 pb-2 pt-6 text-[10px] font-medium text-white transition-opacity",
                    tileChromeVisibility(selected),
                  )}
                  title={item.name}
                >
                  {item.name}
                </p>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}

export function FolderUploadEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200/90 bg-zinc-50/40 px-6 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/25">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
        <Upload className="h-5 w-5" strokeWidth={1.5} aria-hidden />
      </span>
      <p className="mt-3 text-sm font-medium text-zinc-800 dark:text-zinc-200">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{description}</p>
    </div>
  );
}
