"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownAZ,
  ArrowDownWideNarrow,
  ArrowUpAZ,
  ArrowUpNarrowWide,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fetchStorage,
  StorageApiError,
  type StorageGalleryRow,
  type StorageSummary,
} from "@/lib/storage-api";
import { isAbortError } from "@/lib/http";
import { getActivePlanDefinition } from "@/lib/subscription-plan";

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "N/A";
  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  let v = bytes;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u += 1;
  }
  const digits = u === 0 ? 0 : u === 1 ? 0 : v >= 10 ? 1 : 2;
  return `${v.toFixed(digits)} ${units[u]}`;
}

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.min(100, Math.round((part / whole) * 1000) / 10);
}

function formatPercentDisplay(value: number): string {
  if (!Number.isFinite(value)) return "0%";
  const rounded = Math.round(value * 100) / 100;
  const text = rounded % 1 === 0 ? String(rounded) : rounded.toFixed(2);
  return `${text}%`;
}

type SortKey = "name" | "total";

const PAGE_SIZE = 15;

function mapGalleryToRow(g: StorageGalleryRow) {
  return {
    id: g.id,
    eventName: g.name || "N/A",
    clientName: g.clientName?.trim() || "N/A",
    bytesRaw: g.rawsBytes,
    bytesSelection: g.selectionsBytes,
    bytesFinals: g.finalsBytes,
    total: g.totalBytes,
  };
}

export default function StoragePage() {
  const plan = getActivePlanDefinition();
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [summary, setSummary] = useState<StorageSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [galleries, setGalleries] = useState<StorageGalleryRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [listVersion, setListVersion] = useState(0);
  const [page, setPage] = useState(1);

  const loadStorage = useCallback(
    async (signal?: AbortSignal) => {
      setSummaryError(null);
      setListError(null);
      setSummaryLoading(true);
      setListLoading(true);
      try {
        const sort = sortKey === "total" ? "size" : "name";
        const data = await fetchStorage({ sort, order: sortDir, signal });
        if (signal?.aborted) return;
        setSummary(data.summary);
        setGalleries(data.galleries);
      } catch (err) {
        if (isAbortError(err) || signal?.aborted) return;
        setSummary(null);
        setGalleries([]);
        const message =
          err instanceof StorageApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Could not load storage.";
        setSummaryError(message);
        setListError(message);
      } finally {
        if (!signal?.aborted) {
          setSummaryLoading(false);
          setListLoading(false);
        }
      }
    },
    [sortKey, sortDir],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadStorage(controller.signal);
    return () => controller.abort();
  }, [loadStorage, listVersion]);

  useEffect(() => {
    setPage(1);
  }, [sortKey, sortDir]);

  const sortedRows = useMemo(() => galleries.map(mapGalleryToRow), [galleries]);

  const { pageRows, totalPages, rangeStart, rangeEnd, displayPage } = useMemo(() => {
    const total = sortedRows.length;
    const tp = Math.max(1, Math.ceil(total / PAGE_SIZE) || 1);
    const safePage = Math.min(page, tp);
    const start = (safePage - 1) * PAGE_SIZE;
    const slice = sortedRows.slice(start, start + PAGE_SIZE);
    return {
      pageRows: slice,
      totalPages: tp,
      rangeStart: total === 0 ? 0 : start + 1,
      rangeEnd: Math.min(start + PAGE_SIZE, total),
      displayPage: safePage,
    };
  }, [sortedRows, page]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE) || 1);
    setPage((p) => Math.min(p, maxPage));
  }, [sortedRows.length]);

  const usedBytes = summary?.usedBytes ?? 0;
  const planBytes = summary?.limitBytes ?? plan.storageBytes;
  const planLabel = summary?.planName ?? plan.label;

  function toggleSort(key: SortKey) {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDir(key === "total" ? "desc" : "asc");
      return key;
    });
  }

  const showEmptyList = !listLoading && sortedRows.length === 0 && !listError;

  const usedPct = pct(usedBytes, planBytes);
  const ringCircumference = 2 * Math.PI * 42;
  const ringOffset = ringCircumference - (usedPct / 100) * ringCircumference;

  const breakdown = summary?.breakdown;
  const rawsBytes = breakdown?.rawsBytes ?? 0;
  const selectionsBytes = breakdown?.selectionsBytes ?? 0;
  const finalsBytes = breakdown?.finalsBytes ?? 0;

  return (
    <div className="dashboard-page space-y-6">
      <header>
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
              <span className="font-semibold text-zinc-600 dark:text-zinc-400">Studio</span>
            </li>
            <li className="text-zinc-300 dark:text-zinc-600" aria-hidden>
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
            </li>
            <li className="font-semibold text-zinc-900 dark:text-zinc-50">Storage</li>
          </ol>
        </nav>
      </header>

      {summaryError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {summaryError}
          <button
            type="button"
            className="ml-3 font-semibold underline"
            onClick={() => void loadStorage()}
          >
            Retry
          </button>
        </div>
      ) : summaryLoading ? (
        <div className="dashboard-panel space-y-4">
          <div className="h-5 w-24 animate-pulse rounded bg-zinc-200/80 dark:bg-zinc-800" />
          <div className="flex gap-6">
            <div className="flex-1 space-y-3">
              <div className="h-9 w-32 animate-pulse rounded-lg bg-zinc-200/80 dark:bg-zinc-800" />
              <div className="h-3 animate-pulse rounded-full bg-zinc-200/80 dark:bg-zinc-800" />
            </div>
            <div className="h-28 w-28 shrink-0 animate-pulse rounded-full bg-zinc-200/80 dark:bg-zinc-800" />
          </div>
        </div>
      ) : (
        <section className="dashboard-panel">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Plan usage</p>
                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {planLabel}
                </span>
              </div>

              <div>
                <p className="font-display text-3xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
                  {formatBytes(usedBytes)}
                </p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  of {formatBytes(planBytes)} · {formatBytes(Math.max(0, planBytes - usedBytes))}{" "}
                  free
                </p>
              </div>

              <div className="space-y-2.5">
                <div
                  className="flex h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
                  role="progressbar"
                  aria-valuenow={usedPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Storage breakdown by type"
                >
                  {rawsBytes > 0 ? (
                    <div
                      className="h-full bg-brand transition-[width]"
                      style={{ width: `${pct(rawsBytes, planBytes)}%` }}
                    />
                  ) : null}
                  {selectionsBytes > 0 ? (
                    <div
                      className="h-full bg-brand/65 transition-[width]"
                      style={{ width: `${pct(selectionsBytes, planBytes)}%` }}
                    />
                  ) : null}
                  {finalsBytes > 0 ? (
                    <div
                      className="h-full bg-brand/35 transition-[width]"
                      style={{ width: `${pct(finalsBytes, planBytes)}%` }}
                    />
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-brand" aria-hidden />
                    Raws {formatBytes(rawsBytes)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-brand/65" aria-hidden />
                    Selections {formatBytes(selectionsBytes)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-brand/35" aria-hidden />
                    Finals {formatBytes(finalsBytes)}
                  </span>
                </div>
              </div>
            </div>

            <div
              className="relative mx-auto h-28 w-28 shrink-0 sm:mx-0"
              aria-label={`${formatPercentDisplay(usedPct)} of plan used`}
            >
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-zinc-100 dark:text-zinc-800"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  className="text-brand transition-[stroke-dashoffset]"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {formatPercentDisplay(usedPct)}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                  used
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-4 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              <FolderOpen className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Per-gallery usage
              </h2>
              {!listLoading && sortedRows.length > 0 ? (
                <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                  {sortedRows.length === 1
                    ? "1 gallery"
                    : `${sortedRows.length} galleries`}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => toggleSort("total")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                sortKey === "total"
                  ? "border-emerald-600/40 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950/50 dark:text-emerald-100"
                  : "border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900",
              )}
            >
              {sortKey === "total" && sortDir === "desc" ? (
                <ArrowDownWideNarrow className="h-3.5 w-3.5" aria-hidden />
              ) : sortKey === "total" ? (
                <ArrowUpNarrowWide className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <ArrowDownWideNarrow className="h-3.5 w-3.5 opacity-50" aria-hidden />
              )}
              Total size
            </button>
            <button
              type="button"
              onClick={() => toggleSort("name")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                sortKey === "name"
                  ? "border-emerald-600/40 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950/50 dark:text-emerald-100"
                  : "border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900",
              )}
            >
              {sortKey === "name" && sortDir === "desc" ? (
                <ArrowDownAZ className="h-3.5 w-3.5" aria-hidden />
              ) : sortKey === "name" ? (
                <ArrowUpAZ className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <ArrowDownAZ className="h-3.5 w-3.5 opacity-50" aria-hidden />
              )}
              Name
            </button>
          </div>
        </div>

        {listError ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800 sm:px-6">
            <span className="text-sm text-red-700 dark:text-red-300">{listError}</span>
            <button
              type="button"
              className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-50 dark:border-red-800 dark:bg-red-950/60 dark:text-red-200 dark:hover:bg-red-900/40"
              onClick={() => setListVersion((v) => v + 1)}
            >
              Retry
            </button>
          </div>
        ) : null}

        {listLoading && sortedRows.length === 0 ? (
          <div className="space-y-3 px-5 py-8 sm:px-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
            ))}
          </div>
        ) : showEmptyList ? (
          <div className="px-5 py-16 text-center text-sm text-zinc-500 dark:text-zinc-400 sm:px-6">
            No galleries with usage data yet.
          </div>
        ) : (
          <>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 md:hidden">
              {pageRows.map((row) => (
                <div key={row.id} className="space-y-3 px-5 py-4 sm:px-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                        {row.eventName}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {row.clientName}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/folder/${row.id}`}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    >
                      Open
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </div>
                  <p className="text-lg font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                    {formatBytes(row.total)}{" "}
                    <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                      total
                    </span>
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div className="rounded-lg bg-zinc-50 px-2 py-1.5 dark:bg-zinc-900/60">
                      <p className="text-zinc-500 dark:text-zinc-400">Raws</p>
                      <p className="font-medium tabular-nums text-zinc-800 dark:text-zinc-200">
                        {formatBytes(row.bytesRaw)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-zinc-50 px-2 py-1.5 dark:bg-zinc-900/60">
                      <p className="text-zinc-500 dark:text-zinc-400">Selections</p>
                      <p className="font-medium tabular-nums text-zinc-800 dark:text-zinc-200">
                        {formatBytes(row.bytesSelection)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-zinc-50 px-2 py-1.5 dark:bg-zinc-900/60">
                      <p className="text-zinc-500 dark:text-zinc-400">Finals</p>
                      <p className="font-medium tabular-nums text-zinc-800 dark:text-zinc-200">
                        {formatBytes(row.bytesFinals)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative hidden overflow-x-auto md:block">
              {listLoading ? (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-start justify-end bg-white/60 px-4 py-3 dark:bg-zinc-950/60">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Updating…
                  </span>
                </div>
              ) : null}
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/80 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                    <th className="px-5 py-3 sm:px-6">Gallery</th>
                    <th className="px-3 py-3">Client</th>
                    <th className="px-3 py-3 text-right tabular-nums">Raws</th>
                    <th className="px-3 py-3 text-right tabular-nums">Selections</th>
                    <th className="px-3 py-3 text-right tabular-nums">Finals</th>
                    <th className="px-5 py-3 text-right tabular-nums sm:px-6">Total</th>
                    <th className="w-px px-5 py-3 sm:px-6" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {pageRows.map((row) => (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40"
                    >
                      <td className="px-5 py-3.5 font-medium text-zinc-900 dark:text-zinc-100 sm:px-6">
                        {row.eventName}
                      </td>
                      <td className="px-3 py-3.5 text-zinc-600 dark:text-zinc-300">
                        {row.clientName}
                      </td>
                      <td className="px-3 py-3.5 text-right tabular-nums text-zinc-700 dark:text-zinc-200">
                        {formatBytes(row.bytesRaw)}
                      </td>
                      <td className="px-3 py-3.5 text-right tabular-nums text-zinc-700 dark:text-zinc-200">
                        {formatBytes(row.bytesSelection)}
                      </td>
                      <td className="px-3 py-3.5 text-right tabular-nums text-zinc-700 dark:text-zinc-200">
                        {formatBytes(row.bytesFinals)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-base font-semibold tabular-nums text-zinc-900 dark:text-zinc-50 sm:px-6">
                        {formatBytes(row.total)}
                      </td>
                      <td className="px-5 py-3.5 sm:px-6">
                        <Link
                          href={`/dashboard/folder/${row.id}`}
                          className="inline-flex items-center justify-center rounded-lg border border-zinc-200 p-2 text-zinc-500 transition hover:border-zinc-300 hover:bg-white hover:text-zinc-800 dark:border-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                          aria-label={`Open gallery ${row.eventName}`}
                        >
                          <ExternalLink className="h-4 w-4" aria-hidden />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {sortedRows.length > PAGE_SIZE ? (
              <div className="flex flex-col gap-4 border-t border-zinc-100 px-5 py-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-center text-xs font-medium text-zinc-600 sm:text-left dark:text-zinc-400">
                  {`${rangeStart}–${rangeEnd} of ${sortedRows.length} galleries`}
                </p>
                <div className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white p-0.5 shadow-sm dark:border-zinc-700 dark:bg-zinc-950 sm:justify-end">
                  <button
                    type="button"
                    disabled={displayPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                  </button>
                  <span className="min-w-[5.5rem] px-1 text-center text-xs font-medium tabular-nums text-zinc-600 dark:text-zinc-300">
                    {displayPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={displayPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
            ) : sortedRows.length > 0 ? (
              <div className="border-t border-zinc-100 px-5 py-4 dark:border-zinc-800 sm:px-6">
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  {sortedRows.length === 1
                    ? "1 gallery"
                    : `${rangeStart}–${rangeEnd} of ${sortedRows.length} galleries`}
                </p>
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
