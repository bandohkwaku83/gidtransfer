"use client";

import Link from "next/link";
import { ArrowRight, Images } from "lucide-react";
import { FolderCoverVisual } from "@/components/photographer/folder-cover-visual";
import { GalleryCardSkeleton } from "@/components/ui/skeletons";
import {
  apiFolderStatusToUi,
  getFolderClientName,
  type ApiFolder,
} from "@/lib/folders-api";
import type { FolderStatus } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<FolderStatus, string> = {
  DRAFT: "Draft gallery",
  SELECTION_PENDING: "Selecting",
  COMPLETED: "Delivered",
};

type DashboardSoftEduProfileProps = {
  folder: ApiFolder | null;
  clientNameById?: Map<string, string>;
  studioDefaultCoverUrl?: string | null;
  studioName?: string;
  onNewGallery: () => void;
  loading?: boolean;
};

export function DashboardSoftEduProfile({
  folder,
  clientNameById,
  studioDefaultCoverUrl,
  studioName,
  onNewGallery,
  loading,
}: DashboardSoftEduProfileProps) {
  if (loading && !folder) {
    return (
      <section className="flex h-full flex-col justify-center rounded-[1.25rem] bg-white p-4 dark:bg-zinc-950 sm:rounded-[1.35rem] sm:p-5 lg:p-6">
        <GalleryCardSkeleton compact className="border-0 shadow-none" />
      </section>
    );
  }

  if (!folder) {
    return (
      <section className="flex h-full flex-col justify-center rounded-[1.25rem] bg-white p-4 text-center dark:bg-zinc-950 sm:rounded-[1.35rem] sm:p-5 lg:p-6">
        <span className="inline-flex aspect-[16/10] w-full items-center justify-center rounded-2xl bg-[#efefef] text-zinc-500 dark:bg-zinc-900 sm:aspect-[4/3]">
          <Images className="h-7 w-7" aria-hidden />
        </span>
        <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {studioName || "Your studio"}
        </h3>
        <p className="mt-1 text-xs text-zinc-500">No featured gallery yet</p>
        <button
          type="button"
          onClick={onNewGallery}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 py-3 text-sm font-semibold text-white transition hover:bg-black dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
        >
          New gallery
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </section>
    );
  }

  const clientName = getFolderClientName(folder, clientNameById);
  const title = folder.eventName?.trim() || clientName;
  const showClient = Boolean(folder.eventName?.trim() && clientName && clientName !== title);
  const status = apiFolderStatusToUi(folder.status);

  return (
    <section className="flex h-full flex-col rounded-[1.25rem] bg-white p-4 dark:bg-zinc-950 sm:rounded-[1.35rem] sm:p-5 lg:p-6">
      <div className="flex min-w-0 items-center gap-3.5 sm:block sm:gap-0">
        <div className="relative aspect-square w-[5.25rem] shrink-0 overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800 sm:aspect-[4/3] sm:w-full">
          <FolderCoverVisual
            folder={folder}
            studioDefaultCoverUrl={studioDefaultCoverUrl}
            imgClassName="h-full w-full object-cover"
          />
        </div>

        <div className="min-w-0 flex-1 text-left sm:mt-4 sm:text-center">
          <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50 sm:text-base">
            {title}
          </h3>
          {showClient ? (
            <p className="mt-0.5 truncate text-xs text-zinc-500">{clientName}</p>
          ) : null}
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-400 sm:text-[11px]">
            {STATUS_LABEL[status]}
          </p>
        </div>
      </div>

      <Link
        href={`/dashboard/folder/${folder._id}`}
        className={cn(
          "mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-zinc-950 py-2.5 text-xs font-semibold text-white transition hover:bg-black",
          "dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white",
          "sm:mt-auto sm:block sm:rounded-none sm:bg-transparent sm:py-0 sm:pt-5 sm:text-center sm:text-[11px] sm:font-semibold sm:uppercase sm:tracking-[0.1em] sm:text-zinc-400 sm:hover:text-zinc-800",
          "dark:sm:bg-transparent dark:sm:text-zinc-400 dark:sm:hover:text-zinc-200",
        )}
      >
        Open gallery
      </Link>
    </section>
  );
}
