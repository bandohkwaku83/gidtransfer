"use client";

import { memo, useState } from "react";
import { Heart, Loader2, MessageCircle, PlayCircle, Sparkles, AlertTriangle, EyeOff } from "lucide-react";
import type { DemoAsset } from "@/lib/demo-data";
import {
  galleryListClass,
  isClientAssetVideo,
  isCollageGridLayout,
  uploadImageWrapClass,
  uploadItemClass,
  type GridLayout,
} from "@/components/client/share-gallery-bits";
import { ClientPreviewWatermarkOverlay } from "@/components/client/preview-watermark-overlay";
import {
  clientGalleryGridSrc,
  shouldShowClientPreviewWatermarkOverlay,
} from "@/lib/preview-watermark-display";
import { mediaNeedsGridSkeleton, videoElementPreviewSrc } from "@/lib/gallery-media-streaming";
import { cn } from "@/lib/utils";

function VideoTileOverlay() {
  return (
    <span className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center bg-black/10 text-white">
      <PlayCircle className="h-9 w-9 drop-shadow-md" aria-hidden />
    </span>
  );
}

function tileActionClass(active = false): string {
  return cn(
    "inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/45 text-white shadow-sm backdrop-blur-md transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 disabled:cursor-not-allowed disabled:opacity-45",
    active ? "bg-brand/90 hover:bg-brand" : "bg-black/35 hover:bg-black/60",
  );
}

function formatAiIssueLabel(issue: string): string {
  const trimmed = issue.trim();
  if (!trimmed) return issue;
  return trimmed
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export type ClientGalleryAssetGridProps = {
  assets: DemoAsset[];
  gridLayout: GridLayout;
  previewWatermarkEnabled: boolean;
  previewWatermarkLabel: string;
  rightsProtection?: boolean;
  editingLocked: boolean;
  syncBusy: boolean;
  onOpen: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onOpenComment: (asset: DemoAsset) => void;
  onToggleReject?: (id: string) => void;
  commentsEnabled?: boolean;
  indexOffset?: number;
};

type ClientGalleryAssetTileProps = {
  asset: DemoAsset;
  globalIndex: number;
  gridLayout: GridLayout;
  previewWatermarkEnabled: boolean;
  previewWatermarkLabel: string;
  rightsProtection?: boolean;
  editingLocked: boolean;
  syncBusy: boolean;
  onOpen: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onOpenComment: (asset: DemoAsset) => void;
  onToggleReject?: (id: string) => void;
  commentsEnabled?: boolean;
};

const ClientGalleryAssetTile = memo(function ClientGalleryAssetTile({
  asset: a,
  globalIndex,
  gridLayout,
  previewWatermarkEnabled,
  previewWatermarkLabel,
  rightsProtection,
  editingLocked,
  syncBusy,
  onOpen,
  onToggleSelect,
  onOpenComment,
  onToggleReject,
  commentsEnabled = true,
}: ClientGalleryAssetTileProps) {
  const isVideo = isClientAssetVideo(a);
  const mediaSrc = clientGalleryGridSrc(a);
  const playbackSrc = isVideo ? a.url?.trim() || "" : "";
  const [posterFailed, setPosterFailed] = useState(false);
  const showPoster = isVideo && Boolean(mediaSrc) && !posterFailed;
  const showVideoFrame = isVideo && !showPoster && Boolean(playbackSrc);
  const showPreviewWatermark = shouldShowClientPreviewWatermarkOverlay(
    a,
    previewWatermarkEnabled,
    isVideo,
  );
  const isSelected = a.selection === "SELECTED";
  const assetComment = a.clientComment?.trim() ?? "";
  const hasAssetComment = assetComment.length > 0;
  // Until derivativesReady, gridUrl may still equal the master — skeleton instead
  // of baseline JPEG top-to-bottom paint. Videos: poster, else a muted frame.
  const thumbsPending =
    (!isVideo && (mediaNeedsGridSkeleton(a) || !mediaSrc)) ||
    (isVideo && !showPoster && !showVideoFrame);
  const aiSuggested = a.ai?.suggested === true;
  const aiBlurry = a.ai?.isBlurry === true;
  const aiIssues = a.ai?.issues ?? [];
  const aiIssueLabels = aiIssues.map(formatAiIssueLabel).filter(Boolean);
  const isSkipped = a.rejectedByClient === true;

  return (
    <li
      className={cn(
        uploadItemClass(gridLayout, globalIndex, isSelected),
        (aiBlurry || isSkipped) && "opacity-60",
      )}
    >
      <div className={uploadImageWrapClass(gridLayout, globalIndex)}>
        <button
          type="button"
          className={
            isCollageGridLayout(gridLayout)
              ? "block w-full text-left"
              : "absolute inset-0 block h-full w-full text-left"
          }
          onClick={() => onOpen(a.id)}
        >
          {isVideo ? (
            showPoster ? (
              // Progressive JPEG poster — avoid loading the master video in the grid.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaSrc}
                alt={a.originalName}
                loading={globalIndex < 12 ? "eager" : "lazy"}
                decoding="async"
                draggable={!rightsProtection}
                onError={() => setPosterFailed(true)}
                className={
                  isCollageGridLayout(gridLayout)
                    ? "block h-auto w-full bg-black transition group-hover:brightness-[0.97]"
                    : "absolute inset-0 h-full w-full bg-black object-cover transition group-hover:brightness-[0.97]"
                }
              />
            ) : showVideoFrame ? (
              <video
                src={videoElementPreviewSrc(playbackSrc)}
                muted
                playsInline
                preload="metadata"
                draggable={!rightsProtection}
                className={
                  isCollageGridLayout(gridLayout)
                    ? "block h-auto w-full bg-black transition group-hover:brightness-[0.97]"
                    : "absolute inset-0 h-full w-full bg-black object-cover transition group-hover:brightness-[0.97]"
                }
              />
            ) : (
              <div
                className={
                  isCollageGridLayout(gridLayout)
                    ? "block aspect-video w-full bg-zinc-900"
                    : "absolute inset-0 bg-zinc-900"
                }
                aria-label={a.originalName}
              />
            )
          ) : thumbsPending ? (
            <div
              className={
                isCollageGridLayout(gridLayout)
                  ? "block aspect-[4/3] w-full animate-pulse bg-zinc-200 dark:bg-zinc-800"
                  : "absolute inset-0 animate-pulse bg-zinc-200 dark:bg-zinc-800"
              }
              aria-hidden
            />
          ) : isCollageGridLayout(gridLayout) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaSrc}
              alt={a.originalName}
              loading={globalIndex < 12 ? "eager" : "lazy"}
              decoding="async"
              draggable={!rightsProtection}
              className="block h-auto w-full transition group-hover:brightness-[0.97]"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaSrc}
              alt={a.originalName}
              loading={globalIndex < 10 ? "eager" : "lazy"}
              decoding="async"
              draggable={!rightsProtection}
              className="absolute inset-0 h-full w-full object-cover transition group-hover:brightness-[0.97]"
            />
          )}
          {isVideo ? <VideoTileOverlay /> : null}
        </button>
        {thumbsPending ? (
          <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-zinc-400 dark:text-zinc-500" aria-hidden />
            <span className="sr-only">Processing preview</span>
          </div>
        ) : null}
        {showPreviewWatermark ? (
          <ClientPreviewWatermarkOverlay text={previewWatermarkLabel} />
        ) : null}

        {aiSuggested ? (
          <div className="pointer-events-none absolute left-2 top-2 z-10">
            <span
              className="inline-flex max-w-[min(100%,9rem)] items-center gap-1 rounded-full border border-white/30 bg-black/55 px-1.5 py-1 text-white shadow-sm backdrop-blur-md"
              title="AI suggested"
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate text-[10px] font-semibold leading-none">
                Suggested
              </span>
            </span>
          </div>
        ) : null}

        {aiIssueLabels.length > 0 ? (
          <div className="absolute right-2 top-2 z-10">
            <div className="group/ai-issue relative max-w-[min(100%,11rem)]">
              <span
                className="inline-flex max-w-full items-center gap-1 rounded-full bg-amber-500/95 px-1.5 py-1 text-white shadow-sm backdrop-blur-sm"
                aria-label={aiIssueLabels.join(", ")}
              >
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="truncate text-[10px] font-semibold leading-none">
                  {aiIssueLabels[0]}
                  {aiIssueLabels.length > 1 ? ` +${aiIssueLabels.length - 1}` : ""}
                </span>
              </span>
              <div
                role="tooltip"
                className="pointer-events-none absolute right-0 top-full z-20 mt-1.5 hidden w-max max-w-[14rem] rounded-md bg-zinc-950/95 px-2.5 py-1.5 text-left text-[11px] leading-snug text-white shadow-lg group-hover/ai-issue:block group-focus-within/ai-issue:block"
              >
                {aiIssueLabels.join(" · ")}
              </div>
            </div>
          </div>
        ) : null}

        {!editingLocked ? (
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-end bg-gradient-to-t from-black/55 via-black/20 to-transparent p-2 transition group-focus-within:opacity-100 group-hover:opacity-100",
              isSelected || hasAssetComment ? "opacity-100" : "opacity-100 sm:opacity-0",
            )}
          >
            <div className="pointer-events-auto flex items-center gap-1.5">
              {onToggleReject ? (
                <button
                  type="button"
                  disabled={syncBusy}
                  onClick={(e) => {
                    e.stopPropagation();
                    void onToggleReject(a.id);
                  }}
                  className={tileActionClass(isSkipped)}
                  aria-label={isSkipped ? `Unskip ${a.originalName}` : `Skip ${a.originalName}`}
                  title={isSkipped ? "Unskip" : "Skip"}
                >
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : null}
              {commentsEnabled || hasAssetComment ? (
              <button
                type="button"
                disabled={syncBusy}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenComment(a);
                }}
                className={tileActionClass(hasAssetComment)}
                aria-label={
                  hasAssetComment
                    ? `View note for ${a.originalName}`
                    : `Add note for ${a.originalName}`
                }
                title={hasAssetComment ? "View note" : "Add note"}
              >
                <MessageCircle
                  className={cn("h-4 w-4", hasAssetComment && "fill-white")}
                  aria-hidden="true"
                />
              </button>
              ) : null}
              <button
                type="button"
                disabled={syncBusy}
                onClick={(e) => {
                  e.stopPropagation();
                  void onToggleSelect(a.id);
                }}
                className={tileActionClass(isSelected)}
                aria-label={isSelected ? "Unselect photo" : "Select photo"}
                title={isSelected ? "Unselect" : "Select"}
              >
                <Heart className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : hasAssetComment ? (
          <div className="absolute right-2 top-2 z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenComment(a);
              }}
              className="inline-flex items-center gap-1 rounded-full bg-sky-500/90 px-2 py-1 text-[10px] font-semibold text-white shadow-sm backdrop-blur-sm transition hover:bg-sky-500"
              aria-label={`View note for ${a.originalName}`}
            >
              <MessageCircle className="h-3 w-3 fill-white" aria-hidden />
              Note
            </button>
          </div>
        ) : null}
      </div>
    </li>
  );
});

export const ClientGalleryAssetGrid = memo(function ClientGalleryAssetGrid({
  assets,
  gridLayout,
  previewWatermarkEnabled,
  previewWatermarkLabel,
  rightsProtection,
  editingLocked,
  syncBusy,
  onOpen,
  onToggleSelect,
  onOpenComment,
  onToggleReject,
  commentsEnabled = true,
  indexOffset = 0,
}: ClientGalleryAssetGridProps) {
  return (
    <ul className={galleryListClass(gridLayout)}>
      {assets.map((asset, index) => (
        <ClientGalleryAssetTile
          key={asset.id}
          asset={asset}
          globalIndex={indexOffset + index}
          gridLayout={gridLayout}
          previewWatermarkEnabled={previewWatermarkEnabled}
          previewWatermarkLabel={previewWatermarkLabel}
          rightsProtection={rightsProtection}
          editingLocked={editingLocked}
          syncBusy={syncBusy}
          onOpen={onOpen}
          onToggleSelect={onToggleSelect}
          onOpenComment={onOpenComment}
          onToggleReject={onToggleReject}
          commentsEnabled={commentsEnabled}
        />
      ))}
    </ul>
  );
});
