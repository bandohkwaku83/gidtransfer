"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, Clock, FileImage, FolderOpen, RotateCcw, Trash2 } from "lucide-react";
import { DashboardSpin, TrashPageSkeleton } from "@/components/ui/skeletons";
import { FolderCoverVisual } from "@/components/photographer/folder-cover-visual";
import {
  FoldersApiError,
  formatRestoreBeforeLabel,
  getFolderClientName,
  getFolderCoverUrl,
  listFoldersMediaTrash,
  listFoldersTrash,
  purgeFoldersTrash,
  restoreFolderFromTrash,
  restoreFolderTrashedMedia,
  restoreFoldersTrash,
  type ListFoldersTrashResponse,
  type TrashFolderRow,
  type TrashMediaRow,
} from "@/lib/folders-api";
import { listClients } from "@/lib/clients-api";
import { getSettings, getSettingsDefaultCoverUrl } from "@/lib/settings-api";
import { useToast } from "@/components/toast-provider";
import { PlanUpgradeHint } from "@/components/billing/plan-upgrade-hint";
import { usePlanEntitlements } from "@/lib/use-plan-entitlements";
import { cn } from "@/lib/utils";

function trashMediaKey(row: TrashMediaRow): string {
  return `${row.folderId}:${row.mediaId}`;
}

function trashKindMeta(kindRaw: string): { label: string; badgeClass: string } {
  const kind = (kindRaw || "file").toLowerCase().trim();
  const isFinalKind = /^finals?$/.test(kind);
  const isOriginalKind =
    kind === "raw" ||
    kind === "original" ||
    kind === "originals" ||
    kind === "upload" ||
    kind === "uploads";
  const label = isOriginalKind
    ? "Original"
    : isFinalKind
      ? "Final"
      : kindRaw
        ? kindRaw.charAt(0).toUpperCase() + kindRaw.slice(1)
        : "File";
  const badgeClass = isFinalKind
    ? "border-brand/30 bg-brand/10 text-brand-ink dark:border-brand/40 dark:bg-brand/15 dark:text-brand-on-dark"
    : isOriginalKind
      ? "border-brand/20 bg-brand-soft/70 text-brand-ink dark:border-brand/30 dark:bg-brand/10 dark:text-brand-on-dark"
      : "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300";
  return { label, badgeClass };
}

function TrashSectionShell({
  title,
  count,
  allSelected,
  onToggleSelectAll,
  selectDisabled,
  children,
}: {
  title: string;
  count: number;
  allSelected: boolean;
  onToggleSelectAll: () => void;
  selectDisabled?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50/90 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-700 dark:text-zinc-200">
            {title}
          </h2>
          <span className="rounded-full bg-zinc-200/80 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {count}
          </span>
        </div>
        <label className="inline-flex cursor-pointer select-none items-center gap-1.5 rounded-md px-1 py-0.5 text-[11px] font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200">
          <input
            type="checkbox"
            checked={allSelected}
            disabled={selectDisabled}
            onChange={onToggleSelectAll}
            className="h-3.5 w-3.5 rounded border-zinc-300 text-brand focus:ring-brand disabled:opacity-40"
          />
          All
        </label>
      </div>
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">{children}</ul>
    </section>
  );
}

function TrashRestoreButton({
  busy,
  disabled,
  onClick,
  label,
  compact,
}: {
  busy: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border font-semibold transition",
        compact ? "h-8 w-8" : "h-8 px-2.5 text-[11px]",
        disabled || busy
          ? "cursor-not-allowed border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-600"
          : "border-brand/25 bg-brand-soft/50 text-brand-ink hover:border-brand/40 hover:bg-brand-soft dark:border-brand/35 dark:bg-brand/10 dark:text-brand-on-dark dark:hover:bg-brand/20",
      )}
    >
      {busy ? (
        <DashboardSpin size="small" />
      ) : (
        <RotateCcw className="h-3.5 w-3.5" aria-hidden />
      )}
      {!compact ? <span>{busy ? "…" : "Restore"}</span> : null}
    </button>
  );
}

export default function GalleriesTrashPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const { can, openUpgrade, handlePlanError } = usePlanEntitlements();
  const canRestore = can("restoreTrashItems");
  const [data, setData] = useState<ListFoldersTrashResponse | null>(null);
  const [extraMediaRows, setExtraMediaRows] = useState<TrashMediaRow[]>([]);
  const [mediaNextPage, setMediaNextPage] = useState<number | null>(null);
  const [mediaLoadingMore, setMediaLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientNameById, setClientNameById] = useState<Map<string, string>>(new Map());
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [restoringMediaKey, setRestoringMediaKey] = useState<string | null>(null);
  const [purging, setPurging] = useState(false);
  const [restoringSelected, setRestoringSelected] = useState(false);
  /** Gallery folder ids selected for bulk restore or permanent delete. */
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  /** Keys `folderId:mediaId` for file-level bulk actions. */
  const [selectedMediaKeys, setSelectedMediaKeys] = useState<string[]>([]);
  const [studioDefaultCoverUrl, setStudioDefaultCoverUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listFoldersTrash();
      setData(res);
      setExtraMediaRows([]);
      setMediaNextPage(
        res.deletedMediaTotal > res.deletedMedia.length
          ? res.deletedMedia.length === 0
            ? 1
            : 2
          : null,
      );
    } catch (e) {
      setData(null);
      setExtraMediaRows([]);
      setMediaNextPage(null);
      setError(
        e instanceof FoldersApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not load trash.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    listClients()
      .then(({ clients }) => {
        if (cancelled) return;
        const map = new Map<string, string>();
        for (const c of clients) map.set(c._id, c.name);
        setClientNameById(map);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getSettings().then((settings) => {
      if (!cancelled) setStudioDefaultCoverUrl(getSettingsDefaultCoverUrl(settings));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const allTrashedMedia = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, TrashMediaRow>();
    for (const m of data.deletedMedia) {
      map.set(trashMediaKey(m), m);
    }
    for (const m of extraMediaRows) {
      map.set(trashMediaKey(m), m);
    }
    return [...map.values()];
  }, [data, extraMediaRows]);

  const selectedCount = selectedFolderIds.length + selectedMediaKeys.length;
  const batchBusy = purging || restoringSelected;
  const rowBusy = batchBusy || restoringId !== null || restoringMediaKey !== null;
  const restoreAvailable = canRestore && data?.restoreAvailable !== false;
  const retentionDays = data?.retentionDays ?? 0;

  const allFoldersSelected = useMemo(() => {
    if (!data?.folders.length) return false;
    return data.folders.every((r) => selectedFolderIds.includes(r.folder._id));
  }, [data?.folders, selectedFolderIds]);

  const allMediaSelected = useMemo(() => {
    if (!allTrashedMedia.length) return false;
    return allTrashedMedia.every((r) => selectedMediaKeys.includes(trashMediaKey(r)));
  }, [allTrashedMedia, selectedMediaKeys]);

  const mediaPageLimit = useMemo(() => {
    if (!data) return 50;
    if (data.deletedMediaPreviewLimit > 0) {
      return Math.min(500, data.deletedMediaPreviewLimit);
    }
    return Math.max(50, data.deletedMedia.length || 50);
  }, [data]);

  const loadMoreMedia = useCallback(async () => {
    if (!data || mediaNextPage === null || mediaLoadingMore) return;
    setMediaLoadingMore(true);
    try {
      const res = await listFoldersMediaTrash({
        page: mediaNextPage,
        limit: mediaPageLimit,
      });

      setExtraMediaRows((prev) => {
        const seen = new Set<string>();
        for (const m of data.deletedMedia) seen.add(trashMediaKey(m));
        for (const m of prev) seen.add(trashMediaKey(m));
        const next = [...prev];
        for (const item of res.items) {
          const k = trashMediaKey(item);
          if (!seen.has(k)) {
            seen.add(k);
            next.push(item);
          }
        }
        return next;
      });

      const seen = new Set<string>();
      for (const m of data.deletedMedia) seen.add(trashMediaKey(m));
      for (const m of extraMediaRows) seen.add(trashMediaKey(m));
      for (const item of res.items) {
        seen.add(trashMediaKey(item));
      }
      const totalAfter = seen.size;

      if (res.items.length === 0 || totalAfter >= data.deletedMediaTotal) {
        setMediaNextPage(null);
      } else {
        setMediaNextPage((p) => (p == null ? 2 : p + 1));
      }
    } catch (e) {
      showToast(
        e instanceof FoldersApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not load more files.",
        "error",
      );
    } finally {
      setMediaLoadingMore(false);
    }
  }, [data, extraMediaRows, mediaLoadingMore, mediaNextPage, mediaPageLimit, showToast]);

  async function onRestore(row: TrashFolderRow) {
    const id = row.folder._id;
    if (restoringId || batchBusy) return;
    if (!restoreAvailable) {
      openUpgrade({ feature: "restoreTrashItems" });
      return;
    }
    setRestoringId(id);
    try {
      await restoreFolderFromTrash(id);
      showToast("Gallery restored.", "success");
      setData((prev) =>
        prev
          ? {
              ...prev,
              folders: prev.folders.filter((f) => f.folder._id !== id),
              count: Math.max(0, prev.count - 1),
            }
          : prev,
      );
      router.push(`/dashboard/folder/${id}`);
    } catch (e) {
      if (handlePlanError(e)) return;
      const msg =
        e instanceof FoldersApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not restore gallery.";
      showToast(msg, "error");
      if (e instanceof FoldersApiError && e.status === 410) {
        void load();
      }
    } finally {
      setRestoringId(null);
    }
  }

  async function onRestoreMedia(row: TrashMediaRow) {
    const key = trashMediaKey(row);
    if (restoringMediaKey || batchBusy) return;
    if (!restoreAvailable) {
      openUpgrade({ feature: "restoreTrashItems" });
      return;
    }
    setRestoringMediaKey(key);
    try {
      await restoreFolderTrashedMedia(row.folderId, row.mediaId);
      showToast("File restored.", "success");
      setData((prev) =>
        prev
          ? {
              ...prev,
              deletedMedia: prev.deletedMedia.filter(
                (m) => !(m.folderId === row.folderId && m.mediaId === row.mediaId),
              ),
              deletedMediaTotal: Math.max(0, prev.deletedMediaTotal - 1),
            }
          : prev,
      );
      setExtraMediaRows((prev) =>
        prev.filter((m) => !(m.folderId === row.folderId && m.mediaId === row.mediaId)),
      );
    } catch (e) {
      if (handlePlanError(e)) return;
      const msg =
        e instanceof FoldersApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not restore file.";
      showToast(msg, "error");
      if (e instanceof FoldersApiError && e.status === 410) {
        void load();
      }
    } finally {
      setRestoringMediaKey(null);
    }
  }

  function toggleFolderSelection(id: string) {
    setSelectedFolderIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleMediaSelection(key: string) {
    setSelectedMediaKeys((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));
  }

  function toggleSelectAllFolders() {
    if (!data?.folders.length) return;
    if (allFoldersSelected) {
      setSelectedFolderIds([]);
    } else {
      setSelectedFolderIds(data.folders.map((r) => r.folder._id));
    }
  }

  function toggleSelectAllMedia() {
    if (!allTrashedMedia.length) return;
    if (allMediaSelected) {
      setSelectedMediaKeys([]);
    } else {
      setSelectedMediaKeys(allTrashedMedia.map(trashMediaKey));
    }
  }

  function clearSelection() {
    setSelectedFolderIds([]);
    setSelectedMediaKeys([]);
  }

  async function onRestoreSelectedTrash() {
    if (batchBusy || selectedCount === 0) return;
    if (!restoreAvailable) {
      openUpgrade({ feature: "restoreTrashItems" });
      return;
    }
    setRestoringSelected(true);
    try {
      const mediaIds = selectedMediaKeys.map((key) => {
        const i = key.indexOf(":");
        return i >= 0 ? key.slice(i + 1) : key;
      });
      const result = await restoreFoldersTrash({
        folderIds: [...selectedFolderIds],
        mediaIds,
      });
      clearSelection();
      await load();
      const parts: string[] = [];
      if (result.restoredFolderCount) parts.push(`${result.restoredFolderCount} gallery/galleries`);
      if (result.restoredMediaCount) parts.push(`${result.restoredMediaCount} file(s)`);
      showToast(
        parts.length ? `Restored ${parts.join(" and ")}.` : result.message,
        "success",
      );
    } catch (e) {
      if (handlePlanError(e)) return;
      showToast(
        e instanceof FoldersApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not restore selected items.",
        "error",
      );
      if (e instanceof FoldersApiError && e.status === 410) {
        await load();
      }
    } finally {
      setRestoringSelected(false);
    }
  }

  async function onPurgeAllTrash() {
    if (batchBusy || !data) return;
    const confirmed = window.confirm(
      "Permanently delete everything in trash?\n\nThis cannot be undone. All trashed galleries and files are removed from the server immediately. The restore window does not apply.\n\nOnly choose OK if you are certain.",
    );
    if (!confirmed) return;
    setPurging(true);
    try {
      const result = await purgeFoldersTrash({ all: true });
      let msg = result.message;
      if (result.purgedFolderCount > 0 || result.purgedMediaCount > 0) {
        msg += ` (${result.purgedFolderCount} galleries, ${result.purgedMediaCount} files.)`;
      }
      if (result.skipped?.length) {
        msg += ` ${result.skipped.length} item(s) skipped.`;
      }
      showToast(msg, result.skipped?.length ? "info" : "success");
      clearSelection();
      await load();
    } catch (e) {
      showToast(
        e instanceof FoldersApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not empty trash.",
        "error",
      );
    } finally {
      setPurging(false);
    }
  }

  async function onPurgeSelectedTrash() {
    if (batchBusy) return;
    const nFolders = selectedFolderIds.length;
    const nMedia = selectedMediaKeys.length;
    if (nFolders === 0 && nMedia === 0) return;
    const confirmed = window.confirm(
      `Permanently delete ${nFolders} gallery/galleries and ${nMedia} file(s)?\n\nThis cannot be undone. These items are removed from the server immediately.`,
    );
    if (!confirmed) return;
    setPurging(true);
    try {
      const mediaIds = selectedMediaKeys.map((key) => {
        const i = key.indexOf(":");
        return i >= 0 ? key.slice(i + 1) : key;
      });
      const payload: { folderIds?: string[]; mediaIds?: string[] } = {};
      if (nFolders) payload.folderIds = [...selectedFolderIds];
      if (nMedia) payload.mediaIds = mediaIds;
      const result = await purgeFoldersTrash(payload);
      let msg = result.message;
      if (result.purgedFolderCount > 0 || result.purgedMediaCount > 0) {
        msg += ` Removed ${result.purgedFolderCount} galleries, ${result.purgedMediaCount} files.`;
      }
      if (result.skipped?.length) {
        const first = result.skipped[0]?.reason ?? "";
        msg += ` ${result.skipped.length} skipped.${first ? ` (${first})` : ""}`;
      }
      showToast(msg, result.skipped?.length ? "info" : "success");
      clearSelection();
      await load();
    } catch (e) {
      showToast(
        e instanceof FoldersApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not purge selected items.",
        "error",
      );
    } finally {
      setPurging(false);
    }
  }

  const hasFolderTrash = (data?.folders.length ?? 0) > 0;
  const hasMediaTrash = (data?.deletedMediaTotal ?? 0) > 0;
  const fullyEmpty = data && !hasFolderTrash && !hasMediaTrash;

  return (
    <div className="dashboard-page space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm">
            <li>
              <Link
                href="/dashboard"
                className="font-medium text-zinc-400 transition hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
              >
                Dashboard
              </Link>
            </li>
            <li className="text-zinc-300 dark:text-zinc-600" aria-hidden>
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
            </li>
            <li>
              <Link
                href="/dashboard/galleries"
                className="font-semibold text-zinc-600 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Galleries
              </Link>
            </li>
            <li className="text-zinc-300 dark:text-zinc-600" aria-hidden>
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
            </li>
            <li className="font-semibold text-zinc-900 dark:text-zinc-50">Trash</li>
          </ol>
        </nav>
        {data && !fullyEmpty ? (
          <button
            type="button"
            disabled={rowBusy}
            onClick={() => void onPurgeAllTrash()}
            className={cn(
              "inline-flex shrink-0 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 transition",
              "hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-45 dark:border-red-400/40 dark:bg-red-500/15 dark:text-red-100 dark:hover:bg-red-500/25",
            )}
          >
            {purging ? "Deleting…" : "Empty trash"}
          </button>
        ) : null}
      </header>

      {!restoreAvailable ? (
        <PlanUpgradeHint
          feature="restoreTrashItems"
          suggestedPlanId="pro"
          title="Restore from trash is on Pro"
          description={
            retentionDays > 0
              ? `Bring back deleted galleries and files within ${retentionDays} days. Included on Pro and Premium.`
              : "Bring back deleted galleries and files while they are still in the restore window. Included on Pro and Premium."
          }
          label="Upgrade to Pro"
        />
      ) : (
      <div
        role="status"
        className="flex flex-col gap-3 rounded-2xl border border-zinc-200/90 bg-white px-4 py-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
      >
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            <Clock className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Restore window
              </p>
              {retentionDays > 0 ? (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {retentionDays} days
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              Galleries and files can be restored until each row&apos;s deadline. After that
              they&apos;re removed automatically.
            </p>
          </div>
        </div>
      </div>
      )}

      {data && !fullyEmpty && selectedCount > 0 ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200/90 bg-zinc-50/90 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50 sm:px-4">
          <p className="min-w-0 text-xs text-zinc-600 dark:text-zinc-400">
            <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{selectedCount}</span>{" "}
            selected
          </p>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              disabled={batchBusy || !restoreAvailable}
              onClick={() => void onRestoreSelectedTrash()}
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold text-zinc-800 transition hover:bg-white disabled:opacity-45 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              {restoringSelected ? (
                <DashboardSpin size="small" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5 opacity-70" aria-hidden />
              )}
              Restore
            </button>
            <span className="text-zinc-300 dark:text-zinc-600" aria-hidden>
              ·
            </span>
            <button
              type="button"
              disabled={batchBusy}
              onClick={() => void onPurgeSelectedTrash()}
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-45 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              {purging ? (
                <DashboardSpin size="small" />
              ) : (
                <Trash2 className="h-3.5 w-3.5 opacity-80" aria-hidden />
              )}
              Delete
            </button>
            <span className="mx-0.5 hidden h-4 w-px bg-zinc-200 sm:block dark:bg-zinc-700" aria-hidden />
            <button
              type="button"
              disabled={batchBusy}
              onClick={clearSelection}
              className="rounded-md px-2 py-1.5 text-xs font-medium text-zinc-500 transition hover:text-zinc-800 disabled:opacity-45 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200/90 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/60 dark:text-red-200 dark:hover:bg-red-900/40"
          >
            Retry
          </button>
        </div>
      ) : null}

      {loading && !data ? <TrashPageSkeleton /> : null}

      {!loading && fullyEmpty ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 px-6 py-14 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Trash is empty.</p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Deleted galleries and removed files will appear here when you move them to trash.
          </p>
        </div>
      ) : null}

      {data && hasFolderTrash ? (
        <TrashSectionShell
          title="Galleries"
          count={data.folders.length}
          allSelected={allFoldersSelected}
          onToggleSelectAll={toggleSelectAllFolders}
          selectDisabled={rowBusy || data.folders.length === 0}
        >
          {data.folders.map((row) => {
            const folder = row.folder;
            const clientName = getFolderClientName(folder, clientNameById);
            const title = folder.eventName?.trim() || clientName;
            const deadlineLabel = formatRestoreBeforeLabel(row.restoreBefore);
            const busy = restoringId === folder._id;
            const checked = selectedFolderIds.includes(folder._id);

            return (
              <li
                key={folder._id}
                className="flex items-center gap-2.5 px-3 py-2 transition-colors hover:bg-zinc-50/90 dark:hover:bg-zinc-900/40 sm:gap-3 sm:px-4 sm:py-2.5"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={rowBusy}
                  onChange={() => toggleFolderSelection(folder._id)}
                  className="h-3.5 w-3.5 shrink-0 rounded border-zinc-300 text-brand focus:ring-brand"
                  aria-label={`Select gallery: ${title}`}
                />
                <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md bg-zinc-100 ring-1 ring-zinc-200/80 dark:bg-zinc-800 dark:ring-zinc-700 sm:h-11 sm:w-[4.5rem]">
                  <FolderCoverVisual
                    folder={folder}
                    studioDefaultCoverUrl={studioDefaultCoverUrl}
                    imgClassName="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{title}</p>
                  <p className="mt-0.5 truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                    {clientName}
                    {deadlineLabel ? (
                      <>
                        <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">·</span>
                        <Clock className="mr-0.5 inline h-3 w-3 -translate-y-px opacity-60" aria-hidden />
                        <span className="tabular-nums">Restore by {deadlineLabel}</span>
                      </>
                    ) : null}
                  </p>
                </div>
                <TrashRestoreButton
                  busy={busy}
                  disabled={rowBusy || !restoreAvailable}
                  onClick={() => void onRestore(row)}
                  label={`Restore gallery ${title}`}
                  compact
                />
              </li>
            );
          })}
        </TrashSectionShell>
      ) : null}

      {data && hasMediaTrash ? (
        <TrashSectionShell
          title="Files"
          count={data.deletedMediaTotal}
          allSelected={allMediaSelected}
          onToggleSelectAll={toggleSelectAllMedia}
          selectDisabled={rowBusy || allTrashedMedia.length === 0}
        >
          {allTrashedMedia.map((row) => {
            const folder = row.folder;
            const clientName = folder ? getFolderClientName(folder, clientNameById) : "";
            const galleryTitle =
              folder?.eventName?.trim() || clientName || `Gallery ${row.folderId.slice(-6)}`;
            const previewSrc =
              row.thumbUrl ?? row.url ?? (folder ? getFolderCoverUrl(folder) : null) ?? "";
            const label = row.originalFilename?.trim() || row.mediaId;
            const deadlineLabel = formatRestoreBeforeLabel(row.restoreBefore);
            const busy = restoringMediaKey === trashMediaKey(row);
            const { label: kindLabel, badgeClass: kindBadgeClass } = trashKindMeta(row.kind || "file");
            const mkey = trashMediaKey(row);
            const mediaChecked = selectedMediaKeys.includes(mkey);

            return (
              <li
                key={mkey}
                className="flex items-center gap-2.5 px-3 py-2 transition-colors hover:bg-zinc-50/90 dark:hover:bg-zinc-900/40 sm:gap-3 sm:px-4 sm:py-2.5"
              >
                <input
                  type="checkbox"
                  checked={mediaChecked}
                  disabled={rowBusy}
                  onChange={() => toggleMediaSelection(mkey)}
                  className="h-3.5 w-3.5 shrink-0 rounded border-zinc-300 text-brand focus:ring-brand"
                  aria-label={`Select file: ${label}`}
                />
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-zinc-100 ring-1 ring-zinc-200/80 dark:bg-zinc-800 dark:ring-zinc-700 sm:h-10 sm:w-10">
                  {previewSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewSrc} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <FileImage className="h-4 w-4 text-zinc-400 dark:text-zinc-500" aria-hidden />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <p className="min-w-0 truncate text-sm font-medium text-zinc-900 dark:text-zinc-50" title={label}>
                      {label}
                    </p>
                    <span
                      className={cn(
                        "shrink-0 rounded border px-1 py-px text-[9px] font-bold uppercase tracking-wide",
                        kindBadgeClass,
                      )}
                    >
                      {kindLabel}
                    </span>
                  </div>
                  <p className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                    <Link
                      href={`/dashboard/folder/${row.folderId}`}
                      className="inline-flex max-w-[min(100%,12rem)] items-center gap-0.5 font-medium text-brand-ink hover:text-brand dark:text-brand-on-dark dark:hover:text-brand"
                    >
                      <FolderOpen className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                      <span className="truncate">{galleryTitle}</span>
                    </Link>
                    {deadlineLabel ? (
                      <>
                        <span className="text-zinc-300 dark:text-zinc-600">·</span>
                        <span className="inline-flex items-center gap-0.5 tabular-nums">
                          <Clock className="h-3 w-3 opacity-60" aria-hidden />
                          {deadlineLabel}
                        </span>
                      </>
                    ) : null}
                  </p>
                </div>
                <TrashRestoreButton
                  busy={busy}
                  disabled={rowBusy || !restoreAvailable}
                  onClick={() => void onRestoreMedia(row)}
                  label={`Restore ${label}`}
                  compact
                />
              </li>
            );
          })}
        </TrashSectionShell>
      ) : null}

      {data && hasMediaTrash && mediaNextPage !== null && allTrashedMedia.length < data.deletedMediaTotal ? (
        <div className="flex justify-center">
          <button
            type="button"
            disabled={mediaLoadingMore || rowBusy}
            onClick={() => void loadMoreMedia()}
            className={cn(
              "inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 shadow-sm transition",
              "hover:border-brand/30 hover:bg-brand-soft/40 hover:text-brand-ink dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200",
              "disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-brand/10 dark:hover:text-brand-on-dark",
            )}
          >
            {mediaLoadingMore ? (
              <>
                <DashboardSpin size="small" />
                Loading…
              </>
            ) : (
              <>
                <span>Load more files</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
              </>
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}
