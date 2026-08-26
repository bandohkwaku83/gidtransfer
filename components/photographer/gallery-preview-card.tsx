"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { FolderCoverVisual } from "@/components/photographer/folder-cover-visual";
import {
  getFolderClientName,
  type ApiFolder,
} from "@/lib/folders-api";

export function GalleryPreviewCard({
  folder,
  clientNameById,
  studioDefaultCoverUrl,
  compact = false,
}: {
  folder: ApiFolder;
  clientNameById?: Map<string, string>;
  studioDefaultCoverUrl?: string | null;
  compact?: boolean;
}) {
  const clientName = getFolderClientName(folder, clientNameById);
  const updated = folder.updatedAt ?? folder.createdAt;
  const dateLabel = updated
    ? new Date(updated).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : "N/A";

  const title = folder.eventName?.trim() || clientName;
  const sub = folder.eventName?.trim() ? clientName : folder.description || "N/A";

  return (
    <Link
      href={`/dashboard/folder/${folder._id}`}
      className={`group flex flex-col overflow-hidden border border-zinc-200/70 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-16px_rgba(15,23,42,0.18)] dark:border-zinc-800 dark:bg-zinc-950 ${
        compact ? "rounded-[1rem]" : "rounded-[1.15rem]"
      }`}
    >
      <div
        className={`relative w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800/50 ${
          compact ? "aspect-[16/9]" : "aspect-[5/3]"
        }`}
      >
        <FolderCoverVisual
          folder={folder}
          studioDefaultCoverUrl={studioDefaultCoverUrl}
          imgClassName="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        <div
          className={`absolute right-1.5 top-1.5 flex items-center justify-center rounded-md bg-white/90 text-zinc-700 opacity-0 shadow-sm backdrop-blur-sm transition group-hover:opacity-100 dark:bg-zinc-900/90 dark:text-zinc-200 ${
            compact ? "h-6 w-6" : "right-2 top-2 h-8 w-8 rounded-lg"
          }`}
        >
          <ArrowUpRight className={compact ? "h-3 w-3" : "h-4 w-4"} aria-hidden="true" />
        </div>
      </div>
      <div
        className={`flex flex-1 flex-col border-t border-zinc-100 dark:border-zinc-800/80 ${
          compact ? "p-2" : "p-3.5"
        }`}
      >
        <div className="flex items-start justify-between gap-1.5">
          <p
            className={`min-w-0 flex-1 truncate font-semibold text-zinc-900 dark:text-zinc-50 ${
              compact ? "text-xs" : "text-sm"
            }`}
          >
            {title}
          </p>
          <p
            className={`shrink-0 font-medium tabular-nums text-zinc-400 ${
              compact ? "text-[10px]" : "text-[11px]"
            }`}
          >
            {dateLabel}
          </p>
        </div>
        <p
          className={`truncate text-zinc-500 dark:text-zinc-400 ${
            compact ? "mt-0 text-[10px]" : "mt-0.5 text-xs"
          }`}
        >
          {sub}
        </p>
      </div>
    </Link>
  );
}
