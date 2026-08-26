"use client";

import Link from "next/link";
import { ArrowRight, Images } from "lucide-react";
import { FolderCoverVisual } from "@/components/photographer/folder-cover-visual";
import {
  apiFolderStatusToUi,
  getFolderClientName,
  type ApiFolder,
} from "@/lib/folders-api";
import type { FolderStatus } from "@/lib/demo-data";

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
      <section className="flex h-full flex-col justify-center rounded-[1.35rem] bg-white p-5 dark:bg-zinc-950 sm:p-6">
        <div className="aspect-[4/3] w-full animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
        <div className="mx-auto mt-4 h-4 w-28 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="mx-auto mt-2 h-3 w-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="mt-5 h-11 w-full animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
      </section>
    );
  }

  if (!folder) {
    return (
      <section className="flex h-full flex-col justify-center rounded-[1.35rem] bg-white p-5 text-center dark:bg-zinc-950 sm:p-6">
        <span className="inline-flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-[#efefef] text-zinc-500 dark:bg-zinc-900">
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
    <section className="flex h-full flex-col rounded-[1.35rem] bg-white p-5 dark:bg-zinc-950 sm:p-6">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
        <FolderCoverVisual
          folder={folder}
          studioDefaultCoverUrl={studioDefaultCoverUrl}
          imgClassName="h-full w-full object-cover"
        />
      </div>

      <div className="mt-4 min-w-0 text-center">
        <h3 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
        </h3>
        {showClient ? (
          <p className="mt-0.5 truncate text-xs text-zinc-500">{clientName}</p>
        ) : null}
        <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400">
          {STATUS_LABEL[status]}
        </p>
      </div>

      <Link
        href={`/dashboard/folder/${folder._id}`}
        className="mt-auto pt-5 text-center text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-400 transition hover:text-zinc-800 dark:hover:text-zinc-200"
      >
        Open gallery
      </Link>
    </section>
  );
}
