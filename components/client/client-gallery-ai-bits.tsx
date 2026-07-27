"use client";

import type { ReactNode } from "react";
import { Loader2, Pause, Play, RotateCcw, Sparkles, Square } from "lucide-react";
import type { DemoAsset } from "@/lib/demo-data";
import type {
  AiSuggestionControlAction,
  GalleryAiSelection,
} from "@/lib/share-gallery-api";
import { SELECTED_STRIP_IMAGE_SIZES } from "@/components/client/share-gallery-bits";
import { clientGalleryGridSrc } from "@/lib/preview-watermark-display";
import { cn } from "@/lib/utils";

export type GalleryAiFilterState = {
  suggestedOnly: boolean;
  hideSkipped: boolean;
  hideBlurry: boolean;
  showSimilarShots: boolean;
};

export function GalleryAiToolbar({
  aiSelection,
  selectionLimit,
  selectionsRemaining,
  editingLocked,
  applyBusy,
  syncBusy,
  controlBusy,
  filters,
  onFiltersChange,
  onApplySuggestions,
  onControl,
  showAdvancedFilters,
}: {
  aiSelection: GalleryAiSelection;
  selectionLimit: number | null;
  selectionsRemaining: number | null;
  editingLocked: boolean;
  applyBusy: boolean;
  syncBusy: boolean;
  controlBusy: boolean;
  filters: GalleryAiFilterState;
  onFiltersChange: (next: GalleryAiFilterState) => void;
  onApplySuggestions: () => void;
  onControl: (action: AiSuggestionControlAction) => void;
  /** Hide suggested / blurry / similar chips until AI has ready results (or has been started). */
  showAdvancedFilters?: boolean;
}) {
  const { runStatus } = aiSelection;
  const showSuggestions =
    runStatus !== "terminated" && aiSelection.suggestedCount > 0;
  const showFilterChips = showAdvancedFilters === true && showSuggestions;
  const canApply =
    showSuggestions &&
    !editingLocked &&
    !applyBusy &&
    !syncBusy &&
    !controlBusy &&
    (selectionsRemaining == null || selectionsRemaining > 0);
  const busy = controlBusy || syncBusy;
  const canRerun = showSuggestions && !editingLocked && runStatus === "idle";

  const totalForProgress = aiSelection.readyCount + aiSelection.pendingCount;
  const progress =
    runStatus === "running" && totalForProgress > 0
      ? Math.min(100, Math.round((aiSelection.readyCount / totalForProgress) * 100))
      : null;

  const statusTitle = (() => {
    if (runStatus === "running") return "Analyzing photos";
    if (runStatus === "paused") return "Paused";
    if (runStatus === "terminated") return "Suggestions stopped";
    if (showSuggestions) return "Suggestions ready";
    return "AI suggestions";
  })();

  const statusDetail = (() => {
    if (runStatus === "running") {
      return (
        <span className="tabular-nums">
          {aiSelection.readyCount}
          {aiSelection.pendingCount > 0
            ? ` ready · ${aiSelection.pendingCount} left`
            : " ready"}
        </span>
      );
    }
    if (runStatus === "paused") {
      return aiSelection.suggestedCount > 0 ? (
        <span className="tabular-nums">
          {aiSelection.suggestedCount} suggestion
          {aiSelection.suggestedCount === 1 ? "" : "s"} so far
        </span>
      ) : (
        <span>Resume to continue</span>
      );
    }
    if (runStatus === "terminated") {
      return <span>Start again for a new run</span>;
    }
    if (showSuggestions) {
      return (
        <span className="tabular-nums">
          {aiSelection.suggestedCount} photo
          {aiSelection.suggestedCount === 1 ? "" : "s"}
          {selectionLimit != null ? (
            <span className="hidden sm:inline"> · choose up to {selectionLimit}</span>
          ) : null}
        </span>
      );
    }
    return <span>Find your strongest photos automatically</span>;
  })();

  const showStartOnly =
    (runStatus === "idle" || runStatus === "terminated") && !showSuggestions;
  const showApply = showSuggestions && !editingLocked;
  const showTransport = runStatus === "running" || runStatus === "paused";

  const applyLabel = (
    <>
      <span className="sm:hidden">Apply {aiSelection.suggestedCount} picks</span>
      <span className="hidden sm:inline">
        {selectionLimit != null
          ? `Apply ${aiSelection.suggestedCount} picks`
          : "Apply suggestions"}
      </span>
    </>
  );

  return (
    <section
      aria-label="AI photo suggestions"
      className="mb-6 border-b border-zinc-200/90 pb-5 sm:mb-8 sm:pb-6 dark:border-zinc-800"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <span
            className={cn(
              "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:h-9 sm:w-9",
              runStatus === "running"
                ? "bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-100"
                : showSuggestions
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400",
            )}
            aria-hidden
          >
            {runStatus === "running" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-5 text-zinc-900 dark:text-zinc-100">
              {statusTitle}
            </p>
            <p className="mt-0.5 text-xs leading-4 text-zinc-500 dark:text-zinc-400">
              {statusDetail}
            </p>
            {progress != null ? (
              <div
                className="mt-2 h-1 w-28 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800 sm:w-36"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="AI analysis progress"
              >
                <div
                  className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            ) : null}
          </div>
        </div>

        {(showTransport || showStartOnly || showApply) ? (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
            {showTransport ? (
              <RunControls
                mode={runStatus === "running" ? "running" : "paused"}
                disabled={busy}
                busy={controlBusy}
                onPause={() => onControl("pause")}
                onResume={() => onControl("resume")}
                onStop={() => onControl("terminate")}
              />
            ) : null}
            {showStartOnly ? (
              <PrimaryButton
                className="w-full sm:w-auto"
                disabled={busy}
                onClick={() => onControl("start")}
                busy={controlBusy}
                icon={<Sparkles className="h-3.5 w-3.5" aria-hidden />}
                label="Start AI"
              />
            ) : null}
            {showApply ? (
              <>
                <PrimaryButton
                  className="w-full sm:w-auto"
                  disabled={!canApply}
                  onClick={onApplySuggestions}
                  busy={applyBusy}
                  label={applyLabel}
                />
                {canRerun ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onControl("start")}
                    className="inline-flex h-10 w-full items-center justify-center gap-1.5 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-45 dark:text-zinc-400 dark:hover:text-zinc-100 sm:w-auto sm:px-1 sm:text-xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5 sm:hidden" aria-hidden />
                    Run again
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      {showFilterChips ? (
        <div className="-mx-4 mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800/80 sm:mx-0">
          <div className="flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
            <FilterChip
              active={filters.suggestedOnly}
              onClick={() =>
                onFiltersChange({
                  ...filters,
                  suggestedOnly: !filters.suggestedOnly,
                })
              }
              label="Suggested"
            />
            <FilterChip
              active={filters.hideSkipped}
              onClick={() =>
                onFiltersChange({ ...filters, hideSkipped: !filters.hideSkipped })
              }
              label="Hide skipped"
            />
            <FilterChip
              active={filters.hideBlurry}
              onClick={() =>
                onFiltersChange({ ...filters, hideBlurry: !filters.hideBlurry })
              }
              label="Hide blurry"
            />
            <FilterChip
              active={filters.showSimilarShots}
              onClick={() =>
                onFiltersChange({
                  ...filters,
                  showSimilarShots: !filters.showSimilarShots,
                })
              }
              label="Show similar"
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function PrimaryButton({
  className,
  disabled,
  onClick,
  busy,
  label,
  icon,
}: {
  className?: string;
  disabled: boolean;
  onClick: () => void;
  busy?: boolean;
  label: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 sm:h-10 sm:rounded-lg sm:px-3.5 sm:text-xs",
        className,
      )}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : icon}
      {label}
    </button>
  );
}

function RunControls({
  mode,
  disabled,
  busy,
  onPause,
  onResume,
  onStop,
}: {
  mode: "running" | "paused";
  disabled: boolean;
  busy: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}) {
  return (
    <div className="grid w-full grid-cols-2 gap-1.5 rounded-xl border border-zinc-200/90 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-900/60 sm:inline-flex sm:w-auto sm:items-center">
      {mode === "running" ? (
        <CompactTransportButton
          disabled={disabled}
          busy={busy}
          onClick={onPause}
          label="Pause"
          tone="live"
          icon={<Pause className="h-3.5 w-3.5 fill-current" aria-hidden />}
        />
      ) : (
        <CompactTransportButton
          disabled={disabled}
          busy={busy}
          onClick={onResume}
          label="Play"
          tone="play"
          icon={<Play className="h-3.5 w-3.5 fill-current" aria-hidden />}
        />
      )}
      <CompactTransportButton
        disabled={disabled}
        onClick={onStop}
        label="Stop"
        tone="stop"
        icon={<Square className="h-3 w-3 fill-current" aria-hidden />}
      />
    </div>
  );
}

function CompactTransportButton({
  disabled,
  busy,
  onClick,
  label,
  icon,
  tone,
}: {
  disabled: boolean;
  busy?: boolean;
  onClick: () => void;
  label: string;
  icon: ReactNode;
  tone: "live" | "play" | "stop";
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 sm:h-8 sm:flex-none sm:px-2.5 sm:text-xs",
        tone === "live" &&
          "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100",
        tone === "play" && "bg-brand text-white hover:bg-brand-hover",
        tone === "stop" &&
          "bg-white text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white",
      )}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : icon}
      {label}
    </button>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition",
        active
          ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800",
      )}
    >
      {label}
    </button>
  );
}

export function SuggestedPicksStrip({
  assets,
  onOpen,
}: {
  assets: DemoAsset[];
  onOpen: (id: string) => void;
}) {
  if (assets.length === 0) return null;

  return (
    <section className="mb-6 sm:mb-8" aria-label="Suggested picks">
      <h2 className="mb-2.5 text-sm font-medium text-zinc-900 dark:text-zinc-100 sm:mb-3">
        Suggested picks
        <span className="ml-1.5 font-normal tabular-nums text-zinc-400 dark:text-zinc-500">
          {assets.length}
        </span>
      </h2>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-1 sm:px-1 [&::-webkit-scrollbar]:hidden">
        {assets.map((asset) => (
          <button
            key={asset.id}
            type="button"
            onClick={() => onOpen(asset.id)}
            className="group relative h-[4.25rem] w-[4.25rem] shrink-0 overflow-hidden rounded-lg bg-zinc-100 ring-1 ring-zinc-200/80 transition hover:ring-zinc-400 dark:bg-zinc-900 dark:ring-zinc-700 dark:hover:ring-zinc-500 sm:h-24 sm:w-24 sm:rounded-md"
            aria-label={`Open suggested photo ${asset.originalName}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={clientGalleryGridSrc(asset)}
              alt=""
              loading="lazy"
              decoding="async"
              sizes={SELECTED_STRIP_IMAGE_SIZES}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            />
            <span className="pointer-events-none absolute bottom-1.5 left-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm">
              <Sparkles className="h-2.5 w-2.5" aria-hidden />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
