"use client";

import { memo } from "react";
import { Heart, Loader2, MessageCircle, PlayCircle } from "lucide-react";
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
}: ClientGalleryAssetTileProps) {
  const isVideo = isClientAssetVideo(a);
  const mediaSrc = clientGalleryGridSrc(a);
  const showPreviewWatermark = shouldShowClientPreviewWatermarkOverlay(
    a,
    previewWatermarkEnabled,
    isVideo,
  );
  const isSelected = a.selection === "SELECTED";
  const assetComment = a.clientComment?.trim() ?? "";
  const hasAssetComment = assetComment.length > 0;
  const thumbsPending = a.derivativesReady === false;

  return (
    <li className={uploadItemClass(gridLayout, globalIndex, isSelected)}>
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
            <video
              src={mediaSrc}
              muted
              playsInline
              preload="metadata"
              aria-label={a.originalName}
              className={
                isCollageGridLayout(gridLayout)
                  ? "block h-auto w-full bg-black transition group-hover:brightness-[0.97]"
                  : "absolute inset-0 h-full w-full bg-black object-cover transition group-hover:brightness-[0.97]"
              }
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
          <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center bg-black/25">
            <Loader2 className="h-7 w-7 animate-spin text-white/90" aria-hidden />
            <span className="sr-only">Processing preview</span>
          </div>
        ) : null}
        {showPreviewWatermark ? (
          <ClientPreviewWatermarkOverlay text={previewWatermarkLabel} />
        ) : null}

        {!editingLocked ? (
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-end bg-gradient-to-t from-black/55 via-black/20 to-transparent p-2 transition group-focus-within:opacity-100 group-hover:opacity-100",
              isSelected || hasAssetComment ? "opacity-100" : "opacity-100 sm:opacity-0",
            )}
          >
            <div className="pointer-events-auto flex items-center gap-1.5">
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
        />
      ))}
    </ul>
  );
});
