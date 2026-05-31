"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ZOOM_MIN = 1;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.25;

/** Applied to img/video inside the lightbox so full-resolution media can fill the stage. */
export const lightboxMediaClass =
  "block h-auto w-auto max-h-[var(--lb-max-h)] max-w-[var(--lb-max-w)] object-contain select-none";

const chromeBtnClass =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white backdrop-blur-md transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:pointer-events-none disabled:opacity-35 sm:size-10";

const edgeNavClass =
  "pointer-events-auto absolute top-1/2 z-30 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white shadow-lg backdrop-blur-md transition hover:bg-black/75 disabled:pointer-events-none disabled:opacity-25 sm:size-12";

export type MediaLightboxProps = {
  open: boolean;
  onClose: () => void;
  ariaLabel?: string;
  zIndexClass?: string;
  mediaKey?: string;
  title?: string;
  subtitle?: string;
  counter?: { current: number; total: number };
  onPrevious?: () => void;
  onNext?: () => void;
  canPrevious?: boolean;
  canNext?: boolean;
  zoomEnabled?: boolean;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  footer?: ReactNode;
  children: ReactNode;
  viewportClassName?: string;
};

function ZoomableStage({
  mediaKey,
  zoom,
  canZoom,
  onZoomChange,
  children,
  viewportClassName,
}: {
  mediaKey?: string;
  zoom: number;
  canZoom: boolean;
  onZoomChange?: (zoom: number) => void;
  children: ReactNode;
  viewportClassName?: string;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(
    null,
  );
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const clampZoom = useCallback(
    (value: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value)),
    [],
  );

  const setZoom = useCallback(
    (value: number | ((prev: number) => number)) => {
      if (!onZoomChange) return;
      const next = typeof value === "function" ? value(zoom) : value;
      onZoomChange(clampZoom(next));
    },
    [clampZoom, onZoomChange, zoom],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!canZoom) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoom((z) => z + delta);
    },
    [canZoom, setZoom],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!canZoom || zoom <= 1 || e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest("button, a, video")) return;
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [canZoom, pan.x, pan.y, zoom],
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const start = panStartRef.current;
    if (!start) return;
    setPan({
      x: start.panX + (e.clientX - start.x),
      y: start.panY + (e.clientY - start.y),
    });
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (panStartRef.current) {
      panStartRef.current = null;
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);

  const handleDoubleClick = useCallback(() => {
    if (!canZoom) return;
    if (zoom > 1) {
      setZoom(ZOOM_MIN);
      setPan({ x: 0, y: 0 });
    } else {
      setZoom(2);
    }
  }, [canZoom, setZoom, zoom]);

  return (
    <div
      ref={viewportRef}
      className={cn(
        "relative flex h-full min-h-0 w-full items-center justify-center overflow-hidden",
        canZoom && zoom > 1 ? "cursor-grab active:cursor-grabbing" : canZoom ? "cursor-zoom-in" : "",
        viewportClassName,
      )}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={handleDoubleClick}
    >
      <div
        key={mediaKey}
        className="flex items-center justify-center transition-transform duration-200 ease-out will-change-transform"
        style={{
          transform: `translate(${canZoom && zoom > 1 ? pan.x : 0}px, ${
            canZoom && zoom > 1 ? pan.y : 0
          }px) scale(${canZoom ? zoom : 1})`,
        }}
      >
        <div
          className={cn(
            lightboxMediaClass,
            "[&_img]:block [&_img]:h-auto [&_img]:w-auto [&_img]:max-h-[var(--lb-max-h)] [&_img]:max-w-[var(--lb-max-w)] [&_img]:object-contain",
            "[&_video]:block [&_video]:h-auto [&_video]:w-auto [&_video]:max-h-[var(--lb-max-h)] [&_video]:max-w-[var(--lb-max-w)] [&_video]:object-contain",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function MediaLightbox({
  open,
  onClose,
  ariaLabel = "Media preview",
  zIndexClass = "z-50",
  mediaKey,
  title,
  subtitle,
  counter,
  onPrevious,
  onNext,
  canPrevious = false,
  canNext = false,
  zoomEnabled = true,
  zoom = 1,
  onZoomChange,
  footer,
  children,
  viewportClassName,
}: MediaLightboxProps) {
  const showNav = Boolean(onPrevious || onNext);
  const canZoom = zoomEnabled && Boolean(onZoomChange);
  const [stageBump, setStageBump] = useState(0);

  const clampZoom = useCallback(
    (value: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value)),
    [],
  );

  const setZoom = useCallback(
    (value: number | ((prev: number) => number)) => {
      if (!onZoomChange) return;
      const next = typeof value === "function" ? value(zoom) : value;
      onZoomChange(clampZoom(next));
    },
    [clampZoom, onZoomChange, zoom],
  );

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      const target = e.target as HTMLElement | null;
      if (
        target?.closest("input, textarea, select") ||
        target?.isContentEditable
      ) {
        return;
      }
      if (e.key === "ArrowLeft" && canPrevious && onPrevious) {
        e.preventDefault();
        onPrevious();
      }
      if (e.key === "ArrowRight" && canNext && onNext) {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, canPrevious, canNext, onPrevious, onNext]);

  if (!open) return null;

  const hasMeta = Boolean(title || subtitle || counter);

  return (
    <div
      className={cn("fixed inset-0", zIndexClass)}
      style={
        {
          "--lb-max-h": footer
            ? "min(92dvh, calc(100dvh - 9.5rem))"
            : "min(94dvh, calc(100dvh - 5.5rem))",
          "--lb-max-w": "min(96vw, 1680px)",
        } as CSSProperties
      }
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/92"
        aria-label="Close preview"
        onClick={onClose}
      />

      <div className="relative z-10 flex h-full min-h-0 flex-col">
        {/* Top chrome — compact so the stage keeps maximum height */}
        <div className="pointer-events-none flex shrink-0 items-start justify-between gap-3 px-3 pb-2 pt-[max(0.65rem,env(safe-area-inset-top))] sm:px-4">
          {hasMeta ? (
            <div className="pointer-events-auto min-w-0 max-w-[min(70vw,28rem)] rounded-xl bg-black/55 px-3 py-2 backdrop-blur-md">
              {title ? (
                <p className="truncate text-sm font-medium text-white" title={title}>
                  {title}
                </p>
              ) : null}
              {(subtitle || counter) && (
                <p className="mt-0.5 truncate text-xs text-white/60">
                  {counter ? (
                    <span className="tabular-nums">
                      {counter.current} / {counter.total}
                    </span>
                  ) : null}
                  {counter && subtitle ? <span className="mx-1.5 text-white/30">·</span> : null}
                  {subtitle ? <span>{subtitle}</span> : null}
                </p>
              )}
            </div>
          ) : (
            <span className="sr-only">{ariaLabel}</span>
          )}

          <div className="pointer-events-auto ml-auto flex items-center gap-1.5">
            {canZoom ? (
              <>
                <button
                  type="button"
                  aria-label="Zoom out"
                  disabled={zoom <= ZOOM_MIN}
                  className={chromeBtnClass}
                  onClick={() => setZoom((z) => z - ZOOM_STEP)}
                >
                  <Minus className="size-4" aria-hidden />
                </button>
                <span className="hidden min-w-[2.75rem] text-center text-[11px] tabular-nums text-white/70 sm:inline">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  aria-label="Zoom in"
                  disabled={zoom >= ZOOM_MAX}
                  className={chromeBtnClass}
                  onClick={() => setZoom((z) => z + ZOOM_STEP)}
                >
                  <Plus className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label="Reset zoom"
                  disabled={zoom <= ZOOM_MIN}
                  className={cn(chromeBtnClass, "hidden sm:inline-flex")}
                  onClick={() => {
                    setZoom(ZOOM_MIN);
                    setStageBump((n) => n + 1);
                  }}
                >
                  <RotateCcw className="size-4" aria-hidden />
                </button>
              </>
            ) : null}
            <button
              type="button"
              aria-label="Close"
              className={cn(chromeBtnClass, "bg-white text-zinc-900 hover:bg-white/90")}
              onClick={onClose}
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        </div>

        {/* Main stage — fills remaining viewport */}
        <div className="relative min-h-0 flex-1 px-2 pb-2 sm:px-4 sm:pb-3">
          {showNav ? (
            <>
              <button
                type="button"
                aria-label="Previous"
                disabled={!canPrevious}
                className={cn(edgeNavClass, "left-1 sm:left-3")}
                onClick={onPrevious}
              >
                <ChevronLeft className="size-5 sm:size-6" aria-hidden />
              </button>
              <button
                type="button"
                aria-label="Next"
                disabled={!canNext}
                className={cn(edgeNavClass, "right-1 sm:right-3")}
                onClick={onNext}
              >
                <ChevronRight className="size-5 sm:size-6" aria-hidden />
              </button>
            </>
          ) : null}

          <div className="pointer-events-auto h-full min-h-0 w-full">
            <ZoomableStage
              key={`${mediaKey ?? "media"}-${stageBump}`}
              mediaKey={mediaKey}
              zoom={zoom}
              canZoom={canZoom}
              onZoomChange={onZoomChange}
              viewportClassName={viewportClassName}
            >
              {children}
            </ZoomableStage>
          </div>
        </div>

        {footer ? (
          <footer className="pointer-events-auto shrink-0 border-t border-white/10 bg-black/55 px-4 py-3 backdrop-blur-md sm:px-5">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
