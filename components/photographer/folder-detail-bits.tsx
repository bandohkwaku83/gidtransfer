"use client";

import { CloudUpload, FileWarning, Images, Loader2, Save } from "lucide-react";
import { useMemo, useState } from "react";
import type { FolderStatus } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

/** Shared cover fallback when an API folder has no `coverImage` / `coverImageUrl`. */
export const FALLBACK_COVER = "https://picsum.photos/seed/gido-cover/1200/800";

export function statusLabel(s: FolderStatus): string {
  switch (s) {
    case "DRAFT":
      return "Draft";
    case "SELECTION_PENDING":
      return "Selection pending";
    case "COMPLETED":
      return "Completed";
    default:
      return s;
  }
}

export function statusStyles(s: FolderStatus): string {
  switch (s) {
    case "COMPLETED":
      return "bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-400/40";
    case "SELECTION_PENDING":
      return "bg-amber-500/20 text-amber-100 ring-1 ring-amber-400/40";
    default:
      return "bg-white/15 text-white ring-1 ring-white/25";
  }
}

export function formatUploadCount(count: number): string {
  return count.toLocaleString();
}

function uploadPhaseIcon(phase: "preparing" | "presigning" | "uploading" | "finalizing") {
  switch (phase) {
    case "preparing":
      return Images;
    case "presigning":
      return CloudUpload;
    case "finalizing":
      return Save;
    default:
      return Loader2;
  }
}

/** Sticky banner shown while a raw/final upload is in-flight in the folder detail view. */
export function UploadProgressBanner({
  kind,
  phase,
  computable,
  percent,
  filesUploaded,
  filesTotal,
  filesInGallery,
  batchIndex,
  batchCount,
}: {
  kind: "raw" | "final";
  phase: "preparing" | "presigning" | "uploading" | "finalizing";
  computable: boolean;
  percent: number;
  filesUploaded?: number;
  filesTotal?: number;
  filesInGallery?: number;
  batchIndex?: number;
  batchCount?: number;
}) {
  const mediaLabel = kind === "raw" ? "photos" : "finals";
  const showBatchDetail = batchCount != null && batchCount > 1;
  const label =
    phase === "preparing"
      ? `Preparing ${filesTotal ? `${formatUploadCount(filesTotal)} ` : ""}${mediaLabel}`
      : phase === "presigning"
        ? showBatchDetail
          ? `Preparing batch ${batchIndex} of ${batchCount}`
          : "Preparing upload"
        : phase === "finalizing"
          ? kind === "raw"
            ? "Saving photos to gallery"
            : "Saving finals to gallery"
          : kind === "raw"
            ? "Uploading raw photos"
            : "Uploading finals";

  const countDone = Math.max(filesUploaded ?? 0, filesInGallery ?? 0);
  const countLabel =
    filesTotal != null && filesTotal > 0
      ? `${formatUploadCount(Math.min(countDone, filesTotal))} of ${formatUploadCount(filesTotal)} ${mediaLabel}`
      : null;

  const galleryLabel =
    filesInGallery != null && filesInGallery > 0
      ? `${formatUploadCount(filesInGallery)} in gallery`
      : null;

  const metaParts = [countLabel, galleryLabel && phase !== "preparing" ? galleryLabel : null].filter(
    Boolean,
  ) as string[];

  const showDeterminateBar = phase === "uploading" && computable;
  const showLargePercent = showDeterminateBar;
  const statusLabel =
    phase === "preparing"
      ? "Checking"
      : phase === "presigning"
        ? "Preparing"
        : phase === "finalizing"
          ? "Saving"
          : computable
            ? `${percent}%`
            : "Sending";

  const PhaseIcon = uploadPhaseIcon(phase);
  const iconSpins = phase === "uploading" || phase === "finalizing";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex items-start gap-3.5">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            "bg-zinc-100 dark:bg-zinc-800/80",
          )}
        >
          <PhaseIcon
            className={cn(
              "h-[18px] w-[18px] text-brand dark:text-brand-on-dark",
              iconSpins && "motion-safe:animate-spin",
            )}
            aria-hidden
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {label}
                </p>
                {showBatchDetail && phase !== "preparing" ? (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    Batch {batchIndex}/{batchCount}
                  </span>
                ) : null}
              </div>
              {metaParts.length > 0 ? (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {metaParts.join(" · ")}
                </p>
              ) : null}
            </div>

            <div className="shrink-0 text-right">
              {showLargePercent ? (
                <p
                  className="text-xl font-semibold tabular-nums leading-none tracking-tight text-zinc-900 dark:text-zinc-50"
                  aria-hidden
                >
                  {percent}
                  <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500">%</span>
                </p>
              ) : (
                <p className="text-sm font-medium tabular-nums text-zinc-500 dark:text-zinc-400">
                  {statusLabel}
                </p>
              )}
            </div>
          </div>

          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={showDeterminateBar ? percent : undefined}
            aria-label={label}
          >
            {showDeterminateBar ? (
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-200 ease-out motion-reduce:transition-none dark:bg-brand-on-dark"
                style={{ width: `${percent}%` }}
              />
            ) : (
              <div className="relative h-full w-full overflow-hidden" aria-hidden>
                <div className="motion-safe:animate-splash-progress absolute inset-y-0 w-2/5 rounded-full bg-brand/70 dark:bg-brand-on-dark/70" />
              </div>
            )}
          </div>
        </div>
      </div>

      <span className="sr-only">
        {label}. {metaParts.join(". ")}. {statusLabel}.
      </span>
    </div>
  );
}

/** Shown after a batch partially fails so the user can retry only the rest. */
export function UploadPartialFailureBanner({
  succeeded,
  total,
  failedCount,
  onRetry,
  onDismiss,
  busy,
}: {
  succeeded: number;
  total: number;
  failedCount: number;
  onRetry: () => void;
  onDismiss: () => void;
  busy?: boolean;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <p className="font-semibold tabular-nums">
          {succeeded}/{total} uploaded — retry failed
        </p>
        <p className="mt-0.5 text-xs opacity-90">
          {failedCount === 1
            ? "1 file still needs to upload."
            : `${failedCount} files still need to upload.`}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onDismiss}
          disabled={busy}
          className="rounded-xl px-3 py-2 text-xs font-semibold text-amber-900/80 transition hover:bg-amber-100/80 disabled:opacity-50 dark:text-amber-100/80 dark:hover:bg-amber-900/40"
        >
          Dismiss
        </button>
        <button
          type="button"
          onClick={onRetry}
          disabled={busy}
          className="rounded-xl bg-brand px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-hover disabled:opacity-50"
        >
          Retry failed
        </button>
      </div>
    </div>
  );
}

export type DuplicateUploadConflictPrompt = {
  kind: "raw" | "final";
  files: File[];
  conflictingNames: string[];
};

/** Modal that surfaces a filename overlap during a folder upload and offers skip / replace / cancel. */
export function DuplicateUploadConflictDialog({
  prompt,
  onCancel,
  onSkip,
  onReplace,
}: {
  prompt: DuplicateUploadConflictPrompt;
  onCancel: () => void;
  onSkip: () => void;
  onReplace: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const conflictSet = useMemo(
    () => new Set(prompt.conflictingNames),
    [prompt.conflictingNames],
  );
  const newFilesCount = useMemo(
    () => prompt.files.filter((f) => !conflictSet.has(f.name)).length,
    [prompt.files, conflictSet],
  );
  const scopeLabel = prompt.kind === "raw" ? "raw uploads" : "delivered finals";
  const knowsConflictNames = prompt.conflictingNames.length > 0;
  const conflictCount = prompt.conflictingNames.length;
  const totalCount = prompt.files.length;
  const allConflicting = newFilesCount === 0 && conflictCount > 0;
  const canUploadNonDuplicates = newFilesCount > 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="duplicate-filename-dialog-title"
    >
      <div className="flex max-h-[min(90vh,40rem)] w-full max-w-md flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-950">
        <div className="flex shrink-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/60">
            <FileWarning className="h-5 w-5 text-amber-800 dark:text-amber-300" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="duplicate-filename-dialog-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Some filenames already exist
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {knowsConflictNames ? (
                <>
                  You’re adding{" "}
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {formatUploadCount(totalCount)}
                  </span>{" "}
                  file{totalCount === 1 ? "" : "s"} to {scopeLabel}.{" "}
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {formatUploadCount(conflictCount)}
                  </span>{" "}
                  already match names in this gallery
                  {canUploadNonDuplicates ? (
                    <>
                      ;{" "}
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {formatUploadCount(newFilesCount)}
                      </span>{" "}
                      {newFilesCount === 1 ? "is new" : "are new"}.
                    </>
                  ) : (
                    "."
                  )}
                </>
              ) : (
                <>
                  You’re adding{" "}
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {formatUploadCount(totalCount)}
                  </span>{" "}
                  file{totalCount === 1 ? "" : "s"}. At least one filename matches an existing file
                  in {scopeLabel}, but the exact names couldn’t be listed.
                </>
              )}
            </p>

            {knowsConflictNames ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold tabular-nums text-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-200">
                  {formatUploadCount(conflictCount)} already in gallery
                </span>
                {canUploadNonDuplicates ? (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold tabular-nums text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
                    {formatUploadCount(newFilesCount)} new
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => setShowDetails((v) => !v)}
                  className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
                  aria-expanded={showDetails}
                >
                  {showDetails ? "Hide names" : "View names"}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {knowsConflictNames && showDetails ? (
          <div className="mt-4 flex min-h-0 shrink flex-col">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Matching names
            </p>
            <ul className="mt-2 max-h-36 shrink overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50/90 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900/60">
              {prompt.conflictingNames.map((name) => (
                <li
                  key={name}
                  className="truncate border-b border-zinc-100 py-1.5 font-medium text-zinc-800 last:border-b-0 dark:border-zinc-800 dark:text-zinc-200"
                  title={name}
                >
                  {name}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-5 flex shrink-0 flex-col gap-2">
          <button
            type="button"
            onClick={onReplace}
            className="inline-flex min-h-[2.75rem] flex-col items-stretch justify-center rounded-xl bg-brand px-4 py-2.5 text-left text-white shadow-sm transition hover:bg-brand-hover"
          >
            <span className="text-sm font-semibold">
              {allConflicting
                ? `Replace all ${formatUploadCount(totalCount)}`
                : `Upload all ${formatUploadCount(totalCount)}`}
            </span>
            <span className="mt-0.5 text-xs font-medium text-white/80">
              {allConflicting
                ? "Overwrite matching files in this gallery"
                : `Add ${formatUploadCount(newFilesCount)} new · replace ${formatUploadCount(conflictCount)} matching`}
            </span>
          </button>

          {canUploadNonDuplicates ? (
            <button
              type="button"
              onClick={onSkip}
              className="inline-flex min-h-[2.75rem] flex-col items-stretch justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-left transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            >
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Upload {formatUploadCount(newFilesCount)} new only
              </span>
              <span className="mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Skip the {formatUploadCount(conflictCount)} that already exist
              </span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-[2.5rem] items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
