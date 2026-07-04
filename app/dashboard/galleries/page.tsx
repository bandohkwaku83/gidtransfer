"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  FolderOpen,
  LayoutGrid,
  Link2,
  Pencil,
  Plus,
  Rows3,
  Trash2,
} from "lucide-react";
import { Dropdown, type MenuProps } from "antd";
import Link from "next/link";
import { FolderCard } from "@/components/photographer/folder-card";
import { FolderCoverVisual } from "@/components/photographer/folder-cover-visual";
import { ReorderableGalleryGrid } from "@/components/photographer/reorderable-gallery-grid";
import { useFolderListSearch } from "@/components/photographer/photographer-shell";
import { CreateFolderModal } from "@/components/photographer/create-folder-modal";
import { useToast } from "@/components/toast-provider";
import {
  apiFolderStatusToUi,
  deleteFolder,
  enrichFolderClientNames,
  getFolderClientName,
  isGalleryPublished,
  listFoldersWithCounts,
  FoldersApiError,
  formatRestoreBeforeLabel,
  type ApiFolder,
} from "@/lib/folders-api";
import { listClients } from "@/lib/clients-api";
import {
  DashboardPageHeader,
  dashboardPageHeaderCtaClassName,
  dashboardPageHeaderDescriptionClassName,
  dashboardPageHeaderTitleClassName,
} from "@/components/dashboard/dashboard-page-header";
import { getSettings, getSettingsDefaultCoverUrl } from "@/lib/settings-api";
import {
  type GalleryStatusFilter,
} from "@/lib/gallery-list-stats";
import {
  applyGalleryListOrder,
  loadGalleryListOrder,
  loadGalleryListSort,
  mergeGalleryListOrder,
  saveGalleryListOrder,
  saveGalleryListSort,
  type GalleryListSort,
} from "@/lib/gallery-list-order";
import { FilterChipSelect } from "@/components/ui/filter-chip-select";
import { GalleryCardSkeleton, ListRefreshSkeleton } from "@/components/ui/skeletons";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { batchApiCalls } from "@/lib/http";
import { cn } from "@/lib/utils";

const STATUS_FILTERS: { key: GalleryStatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "DRAFT", label: "Draft" },
  { key: "SELECTION_PENDING", label: "Selecting" },
  { key: "COMPLETED", label: "Done" },
];

type ExpiryFilter = "all" | "active" | "expired" | "noExpiry";
type StarredFilter = "all" | "highTraffic" | "neverOpened";

const GRID_CLASS_NAME =
  "grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";

function statusFilterToApi(status: GalleryStatusFilter): string {
  switch (status) {
    case "DRAFT":
      return "draft";
    case "SELECTION_PENDING":
      return "selecting";
    case "COMPLETED":
      return "done";
    default:
      return "all";
  }
}

export default function GalleriesPage() {
  const { query } = useFolderListSearch();
  const { showToast } = useToast();

  const [folders, setFolders] = useState<ApiFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<GalleryStatusFilter>("all");
  const [listSort, setListSort] = useState<GalleryListSort>("newest");
  const [galleryOrder, setGalleryOrder] = useState<string[]>([]);
  const [orderReady, setOrderReady] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>("all");
  const [starredFilter, setStarredFilter] = useState<StarredFilter>("all");

  const [clientNameById, setClientNameById] = useState<Map<string, string>>(
    new Map(),
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ApiFolder | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [studioDefaultCoverUrl, setStudioDefaultCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    setGalleryOrder(loadGalleryListOrder());
    setListSort(loadGalleryListSort());
    setOrderReady(true);
  }, []);

  useEffect(() => {
    if (!orderReady) return;
    setGalleryOrder((prev) =>
      mergeGalleryListOrder(
        prev,
        folders.map((folder) => folder._id),
      ),
    );
  }, [folders, orderReady]);

  const fetchFolders = useCallback(
    async (search: string, filter: GalleryStatusFilter, signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const { folders: list } = await listFoldersWithCounts({
          search,
          status: statusFilterToApi(filter),
        });
        if (signal?.aborted) return;
        setFolders(list);
      } catch (err) {
        if (signal?.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load folders.");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [],
  );

  const debouncedSearch = useDebouncedValue(query.trim(), 250);

  useEffect(() => {
    const controller = new AbortController();
    void fetchFolders(debouncedSearch, statusFilter, controller.signal);
    return () => controller.abort();
  }, [debouncedSearch, statusFilter, fetchFolders]);

  useEffect(() => {
    let cancelled = false;
    void batchApiCalls([
      () => listClients(),
      () => getSettings(),
    ]).then(([clientsRes, settings]) => {
      if (cancelled) return;
      const map = new Map<string, string>();
      for (const c of clientsRes.clients) map.set(c._id, c.name);
      setClientNameById(map);
      setFolders((prev) => enrichFolderClientNames(prev, map));
      setStudioDefaultCoverUrl(getSettingsDefaultCoverUrl(settings));
    }).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaved = useCallback((saved: ApiFolder) => {
    setFolders((prev) => {
      const exists = prev.some((f) => f._id === saved._id);
      const next = exists
        ? prev.map((f) => (f._id === saved._id ? saved : f))
        : [saved, ...prev];
      setGalleryOrder((order) => {
        const merged = mergeGalleryListOrder(
          [saved._id, ...order.filter((id) => id !== saved._id)],
          next.map((folder) => folder._id),
        );
        saveGalleryListOrder(merged);
        return merged;
      });
      return next;
    });
  }, []);

  const handleDelete = useCallback(
    async (folder: ApiFolder) => {
      if (pendingDeleteId) return;
      setPendingDeleteId(folder._id);
      const previousFolders = folders;
      const previousOrder = galleryOrder;
      setFolders((prev) => prev.filter((f) => f._id !== folder._id));
      setGalleryOrder((order) => {
        const next = order.filter((id) => id !== folder._id);
        saveGalleryListOrder(next);
        return next;
      });
      try {
        const result = await deleteFolder(folder._id);
        const deadline = formatRestoreBeforeLabel(result.restoreBefore);
        showToast(
          deadline
            ? `Gallery moved to trash. Restore by ${deadline} (${result.retentionDays}-day window). Open Trash in the sidebar to restore.`
            : result.message,
          "success",
        );
      } catch (err) {
        setFolders(previousFolders);
        setGalleryOrder(previousOrder);
        saveGalleryListOrder(previousOrder);
        showToast(
          err instanceof FoldersApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to move gallery to trash.",
          "error",
        );
      } finally {
        setPendingDeleteId(null);
      }
    },
    [folders, galleryOrder, pendingDeleteId, showToast],
  );

  const handleReorder = useCallback((orderedIds: string[]) => {
    setGalleryOrder(orderedIds);
    setListSort("custom");
    saveGalleryListOrder(orderedIds);
    saveGalleryListSort("custom");
  }, []);

  const trimmed = debouncedSearch;
  const displayedFolders = useMemo(() => {
    const matchesExpiry = (folder: ApiFolder) => {
      if (expiryFilter === "all") return true;
      const expiresAt = folder.share?.expiresAt;
      if (!expiresAt) return expiryFilter === "noExpiry";
      const expiryTime = new Date(expiresAt).getTime();
      if (Number.isNaN(expiryTime)) return true;
      const now = Date.now();
      if (expiryFilter === "expired") return expiryTime < now;
      if (expiryFilter === "active") return expiryTime >= now;
      return true;
    };

    const matchesStarred = (folder: ApiFolder) => {
      if (starredFilter === "all") return true;
      const views = Number(folder.share?.viewCount ?? 0);
      if (starredFilter === "highTraffic") return views >= 10;
      if (starredFilter === "neverOpened") return views === 0;
      return true;
    };

    const filtered = folders.filter(
      (folder) => matchesExpiry(folder) && matchesStarred(folder),
    );

    if (listSort === "custom" && galleryOrder.length > 0) {
      return applyGalleryListOrder(filtered, galleryOrder);
    }

    return filtered.sort((a, b) => {
      const eventA = new Date(a.eventDate).getTime();
      const eventB = new Date(b.eventDate).getTime();
      const safeEventA = Number.isNaN(eventA) ? 0 : eventA;
      const safeEventB = Number.isNaN(eventB) ? 0 : eventB;

      return listSort === "oldest" ? safeEventA - safeEventB : safeEventB - safeEventA;
    });
  }, [folders, expiryFilter, starredFilter, galleryOrder, listSort]);

  const canReorderGrid =
    viewMode === "grid" &&
    !trimmed &&
    statusFilter === "all" &&
    expiryFilter === "all" &&
    starredFilter === "all" &&
    displayedFolders.length > 1;
  const showEmpty = !loading && displayedFolders.length === 0;
  const showSpinner = loading && folders.length === 0;
  const viewMenuItems = useMemo<MenuProps["items"]>(
    () => [
      {
        key: "grid",
        label: "Grid",
        icon: <LayoutGrid className="h-3.5 w-3.5" aria-hidden />,
      },
      {
        key: "list",
        label: "List",
        icon: <Rows3 className="h-3.5 w-3.5" aria-hidden />,
      },
    ],
    [],
  );

  const openCreate = () => {
    setEditing(null);
    setCreateOpen(true);
  };

  return (
    <div className="dashboard-page space-y-6">
      <DashboardPageHeader innerClassName="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className={dashboardPageHeaderTitleClassName()}>Galleries</h1>
          <p className={dashboardPageHeaderDescriptionClassName()}>
            Upload raws, track client selections, and deliver finals from one place per shoot.
          </p>
        </div>
        <button type="button" onClick={openCreate} className={dashboardPageHeaderCtaClassName()}>
          <Plus className="h-4 w-4" aria-hidden />
          New gallery
        </button>
      </DashboardPageHeader>

      <div className="space-y-2">
        <div className="overflow-visible rounded-sm bg-zinc-100 px-2 py-1.5 dark:bg-zinc-900">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5 sm:min-w-max sm:flex-nowrap sm:gap-2">
              <FilterChipSelect<GalleryStatusFilter>
                aria-label="Filter by status"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: "all", label: "Status" },
                  ...STATUS_FILTERS.filter((f) => f.key !== "all").map(({ key, label }) => ({
                    value: key,
                    label,
                  })),
                ]}
              />
              <FilterChipSelect<GalleryListSort>
                aria-label="Sort galleries"
                value={listSort}
                onChange={(value) => {
                  setListSort(value);
                  saveGalleryListSort(value);
                }}
                options={[
                  { value: "newest", label: "Event Date" },
                  { value: "oldest", label: "Event Date (oldest)" },
                  ...(listSort === "custom" || galleryOrder.length > 0
                    ? [{ value: "custom" as const, label: "Custom order" }]
                    : []),
                ]}
              />
              <FilterChipSelect<ExpiryFilter>
                aria-label="Filter by expiry"
                value={expiryFilter}
                onChange={setExpiryFilter}
                options={[
                  { value: "all", label: "Expiry Date" },
                  { value: "active", label: "Not expired" },
                  { value: "expired", label: "Expired" },
                  { value: "noExpiry", label: "No expiry" },
                ]}
              />
              <FilterChipSelect<StarredFilter>
                aria-label="Filter by popularity"
                value={starredFilter}
                onChange={setStarredFilter}
                options={[
                  { value: "all", label: "Starred" },
                  { value: "highTraffic", label: "Popular (10+)" },
                  { value: "neverOpened", label: "Never opened" },
                ]}
              />
            </div>

            <div className="relative flex items-center justify-end gap-1.5 sm:pl-2">
              <Dropdown
                trigger={["click"]}
                placement="bottomRight"
                menu={{
                  items: viewMenuItems,
                  selectedKeys: [viewMode],
                  onClick: ({ key }) => setViewMode(key as "grid" | "list"),
                }}
              >
                <button
                  type="button"
                  className="hidden h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-700 sm:inline-flex dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  aria-label="Change layout view"
                  title="Layout options"
                >
                  {viewMode === "grid" ? (
                    <LayoutGrid className="h-4 w-4" aria-hidden />
                  ) : (
                    <Rows3 className="h-4 w-4" aria-hidden />
                  )}
                </button>
              </Dropdown>
            </div>
          </div>
        </div>

        {!loading && folders.length > 0 ? (
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {trimmed
              ? `${displayedFolders.length} of ${folders.length} matching “${trimmed}”`
              : `${displayedFolders.length} galler${displayedFolders.length === 1 ? "y" : "ies"}`}
          </p>
        ) : null}
      </div>

      {error ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200/90 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => fetchFolders(trimmed, statusFilter)}
            className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/60 dark:text-red-200 dark:hover:bg-red-900/40"
          >
            Retry
          </button>
        </div>
      ) : null}

      {showSpinner ? (
        <div className="space-y-4">
          {viewMode === "list" ? (
            <div className="hidden md:grid gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <GalleryCardSkeleton key={`list-skeleton-${i}`} />
              ))}
            </div>
          ) : null}
          <div
            className={cn(
              GRID_CLASS_NAME,
              viewMode === "list" && "md:hidden",
            )}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <GalleryCardSkeleton key={`grid-skeleton-${i}`} compact />
            ))}
          </div>
        </div>
      ) : showEmpty ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-zinc-200 bg-gradient-to-b from-zinc-50/80 to-white px-6 py-16 text-center dark:border-zinc-800 dark:from-zinc-900/40 dark:to-zinc-950 sm:px-10">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-brand dark:bg-brand/25 dark:text-brand-on-dark">
            <FolderOpen className="h-8 w-8" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {trimmed
              ? "No matches"
              : statusFilter !== "all"
                ? `No ${STATUS_FILTERS.find((f) => f.key === statusFilter)?.label.toLowerCase()} galleries`
                : "Create your first gallery"}
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {trimmed
              ? "Try another search, or clear the search box to see all galleries."
              : statusFilter !== "all"
                ? "Switch to All or pick a different status filter."
                : "Galleries hold raws, client picks, and finals. Add one to get started."}
          </p>
          {!trimmed && statusFilter === "all" ? (
            <button
              type="button"
              onClick={openCreate}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand/25 transition hover:bg-brand-hover"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              New gallery
            </button>
          ) : statusFilter !== "all" ? (
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className="mt-8 inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              Show all galleries
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <div className={cn("space-y-4", viewMode === "list" ? "hidden md:block" : "hidden")}>
            {displayedFolders.map((g) => {
              const busy = pendingDeleteId === g._id;
              const title = g.eventName?.trim() || getFolderClientName(g, clientNameById);
              const clientName = getFolderClientName(g, clientNameById);
              const status = apiFolderStatusToUi(g.status);
              const statusLabel = status === "COMPLETED" ? "Done" : status === "DRAFT" ? "Draft" : "Selecting";
              const hasSharedLink = isGalleryPublished(g);
              const createdDate = g.createdAt
                ? new Date(g.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "—";
              const eventDate = g.eventDate
                ? new Date(g.eventDate).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "—";

              return (
                <article
                  key={g._id}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white p-2 shadow-[0_1px_0_rgba(0,0,0,0.02)] dark:border-zinc-800 dark:bg-zinc-950 sm:gap-3 sm:p-2.5",
                    busy && "pointer-events-none opacity-60",
                  )}
                >
                  <Link
                    href={`/dashboard/folder/${g._id}`}
                    className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-zinc-100 sm:h-16 sm:w-16 dark:bg-zinc-800"
                  >
                    <FolderCoverVisual
                      folder={g}
                      studioDefaultCoverUrl={studioDefaultCoverUrl}
                      imgClassName="h-full w-full object-cover"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/dashboard/folder/${g._id}`}
                      className="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100 sm:text-base"
                    >
                      {title}
                    </Link>

                    <p className="mt-0.5 truncate text-[11px] text-zinc-500 dark:text-zinc-400 sm:text-xs">
                      {clientName}
                    </p>

                    <p className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 sm:text-xs">
                      <CalendarDays className="h-3 w-3 shrink-0 opacity-75" aria-hidden />
                      <span>{eventDate}</span>
                      <span aria-hidden>•</span>
                      <span>Created {createdDate}</span>
                    </p>

                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.04em]",
                          status === "COMPLETED" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
                          status === "DRAFT" && "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
                          status === "SELECTION_PENDING" &&
                            "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
                        )}
                      >
                        {statusLabel}
                      </span>
                      {hasSharedLink ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.04em] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                          <Link2 className="h-2.5 w-2.5" aria-hidden />
                          Shared
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(g);
                        setCreateOpen(true);
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-zinc-100 text-zinc-600 transition hover:bg-zinc-200 hover:text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
                      aria-label={`Edit ${title}`}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!window.confirm(`Move gallery "${title}" to trash?`)) return;
                        void handleDelete(g);
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-rose-50 text-rose-600 transition hover:bg-rose-100 hover:text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 dark:hover:bg-rose-500/20 dark:hover:text-rose-200"
                      aria-label={`Move ${title} to trash`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <div className={cn(viewMode === "list" && "md:hidden")}>
            <ReorderableGalleryGrid
              items={displayedFolders}
              getItemId={(folder) => folder._id}
              reorderable={canReorderGrid}
              onReorder={handleReorder}
              className={GRID_CLASS_NAME}
              renderGhost={(folder) => (
                <FolderCard
                  folder={folder}
                  clientNameById={clientNameById}
                  studioDefaultCoverUrl={studioDefaultCoverUrl}
                  compact
                />
              )}
              renderItem={(folder, state) => (
                <FolderCard
                  folder={folder}
                  clientNameById={clientNameById}
                  studioDefaultCoverUrl={studioDefaultCoverUrl}
                  busy={pendingDeleteId === folder._id}
                  reorderable={canReorderGrid}
                  isDragging={state.isDragging}
                  isDropTarget={state.isDropTarget}
                  blockNavigation={state.blockNavigation}
                  onReorderPointerDown={state.onReorderPointerDown}
                  onEdit={(f) => {
                    setEditing(f);
                    setCreateOpen(true);
                  }}
                  onDelete={handleDelete}
                />
              )}
            />
          </div>
        </>
      )}

      {loading && folders.length > 0 ? <ListRefreshSkeleton /> : null}

      <CreateFolderModal
        open={createOpen}
        folder={editing}
        onClose={() => {
          setCreateOpen(false);
          setEditing(null);
        }}
        onSaved={handleSaved}
      />
    </div>
  );
}
