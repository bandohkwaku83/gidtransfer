"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ShowcaseCoverPreview } from "@/components/marketing/showcase-cover-preview";
import type { GalleryCoverFrame } from "@/lib/gallery-cover-frame";
import { cn } from "@/lib/utils";

export type ShowcaseCarouselItem = {
  id: string;
  src: string;
  alt: string;
  title: string;
  tag: string;
  coverFrame: GalleryCoverFrame;
  coverColor?: string;
};

const AUTO_ADVANCE_MS = 4500;
const MAX_VISIBLE_OFFSET = 3;
const PIXELS_PER_SLIDE = 150;
const SNAP_DURATION_MS = 480;
const WHEEL_SNAP_DELAY_MS = 140;
const SELECTED_BORDER = "#55001F";

function normalizePosition(value: number, total: number) {
  if (total === 0) return 0;
  let next = value % total;
  if (next < 0) next += total;
  return next;
}

function wrapOffset(index: number, active: number, total: number) {
  let offset = index - active;
  if (offset > total / 2) offset -= total;
  if (offset < -total / 2) offset += total;
  return offset;
}

function cardStyle(offset: number, compact: boolean, viewportWidth: number) {
  const abs = Math.abs(offset);
  const maxOffset = compact ? 1 : MAX_VISIBLE_OFFSET;

  if (abs > maxOffset) {
    return {
      visible: false,
      transform: "translate(-50%, -50%) rotateY(0deg) scale(0.5)",
      opacity: 0,
      zIndex: 0,
      blur: 0,
    };
  }

  if (compact) {
    const cardW = Math.min(viewportWidth * 0.78, 300);
    const scale = offset === 0 ? 1 : 0.82;
    const sideHalf = (cardW * scale) / 2;
    const gap = 10;
    const step = cardW / 2 + sideHalf + gap;
    const translateX = offset * step;
    const opacity = offset === 0 ? 1 : 0.5;

    return {
      visible: true,
      transform: `translate(calc(-50% + ${translateX}px), -50%) scale(${scale})`,
      opacity,
      zIndex: offset === 0 ? 100 : 10,
      blur: 0,
    };
  }

  const translateX = offset * (abs === 0 ? 0 : 148 + abs * 62);
  const rotateY = offset * -32;
  const scale = offset === 0 ? 1 : 0.84 - abs * 0.1;
  const opacity = offset === 0 ? 1 : Math.max(0.28, 0.92 - abs * 0.22);
  const blur = abs === 0 ? 0 : abs * 2.5;
  const zIndex = 50 - abs * 10;

  return {
    visible: true,
    transform: `translate(calc(-50% + ${translateX}px), -50%) rotateY(${rotateY}deg) scale(${scale})`,
    opacity,
    zIndex,
    blur,
  };
}

function useCompactCarousel() {
  const [compact, setCompact] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(390);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => {
      setCompact(mq.matches);
      setViewportWidth(window.innerWidth);
    };
    update();
    mq.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      mq.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return { compact, viewportWidth };
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export function ShowcaseCarousel({ items }: { items: readonly ShowcaseCarouselItem[] }) {
  const { compact, viewportWidth } = useCompactCarousel();
  const [position, setPosition] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [snapping, setSnapping] = useState(false);

  const positionRef = useRef(0);
  const pausedRef = useRef(false);
  const dragRef = useRef({ startX: 0, startPosition: 0, moved: false });
  const snapFrameRef = useRef<number | null>(null);
  const wheelSnapTimerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const total = items.length;
  const activeIndex = total === 0 ? 0 : normalizePosition(Math.round(position), total);
  const motionEnabled = !dragging;

  const cancelSnap = useCallback(() => {
    if (snapFrameRef.current !== null) {
      cancelAnimationFrame(snapFrameRef.current);
      snapFrameRef.current = null;
    }
    setSnapping(false);
  }, []);

  const pauseAutoAdvance = useCallback((ms = 6000) => {
    pausedRef.current = true;
    window.setTimeout(() => {
      pausedRef.current = false;
    }, ms);
  }, []);

  const snapToNearest = useCallback(
    (from = positionRef.current) => {
      if (total <= 1) return;

      cancelSnap();
      setSnapping(true);

      const start = from;
      const end = Math.round(from);
      const duration = SNAP_DURATION_MS;
      const startedAt = performance.now();

      const tick = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / duration);
        const eased = easeOutCubic(progress);
        const next = normalizePosition(start + (end - start) * eased, total);

        positionRef.current = next;
        setPosition(next);

        if (progress < 1) {
          snapFrameRef.current = requestAnimationFrame(tick);
          return;
        }

        const settled = normalizePosition(end, total);
        positionRef.current = settled;
        setPosition(settled);
        snapFrameRef.current = null;
        setSnapping(false);
      };

      snapFrameRef.current = requestAnimationFrame(tick);
    },
    [cancelSnap, total],
  );

  const goTo = useCallback(
    (index: number) => {
      if (total === 0) return;
      pauseAutoAdvance();

      const target = normalizePosition(index, total);
      const current = positionRef.current;
      let delta = target - Math.round(current);

      if (delta > total / 2) delta -= total;
      if (delta < -total / 2) delta += total;

      cancelSnap();
      setSnapping(true);

      const start = current;
      const end = current + delta;
      const duration = SNAP_DURATION_MS;
      const startedAt = performance.now();

      const tick = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / duration);
        const eased = easeOutCubic(progress);
        const next = normalizePosition(start + (end - start) * eased, total);

        positionRef.current = next;
        setPosition(next);

        if (progress < 1) {
          snapFrameRef.current = requestAnimationFrame(tick);
          return;
        }

        positionRef.current = target;
        setPosition(target);
        snapFrameRef.current = null;
        setSnapping(false);
      };

      snapFrameRef.current = requestAnimationFrame(tick);
    },
    [cancelSnap, pauseAutoAdvance, total],
  );

  const step = useCallback(
    (delta: number) => {
      goTo(activeIndex + delta);
    },
    [activeIndex, goTo],
  );

  const setPositionImmediate = useCallback(
    (next: number) => {
      const normalized = normalizePosition(next, total);
      positionRef.current = normalized;
      setPosition(normalized);
    },
    [total],
  );

  useEffect(() => {
    if (total <= 1) return;
    const id = window.setInterval(() => {
      if (pausedRef.current || dragging || snapping) return;
      goTo(activeIndex + 1);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [activeIndex, dragging, goTo, snapping, total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  useEffect(
    () => () => {
      cancelSnap();
      if (wheelSnapTimerRef.current !== null) {
        window.clearTimeout(wheelSnapTimerRef.current);
      }
    },
    [cancelSnap],
  );

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (total <= 1) return;
    cancelSnap();
    if (wheelSnapTimerRef.current !== null) {
      window.clearTimeout(wheelSnapTimerRef.current);
      wheelSnapTimerRef.current = null;
    }

    pausedRef.current = true;
    setDragging(true);
    dragRef.current = {
      startX: event.clientX,
      startPosition: positionRef.current,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || total <= 1) return;
    const deltaX = event.clientX - dragRef.current.startX;
    if (Math.abs(deltaX) > 4) dragRef.current.moved = true;
    const delta = deltaX / PIXELS_PER_SLIDE;
    setPositionImmediate(dragRef.current.startPosition - delta);
  };

  const endDrag = () => {
    if (!dragging) return;
    setDragging(false);
    snapToNearest();
    pauseAutoAdvance();
  };

  const onWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (total <= 1) return;
    event.preventDefault();

    cancelSnap();
    pausedRef.current = true;

    const dominantDelta =
      Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    setPositionImmediate(positionRef.current + dominantDelta / PIXELS_PER_SLIDE);

    if (wheelSnapTimerRef.current !== null) {
      window.clearTimeout(wheelSnapTimerRef.current);
    }

    wheelSnapTimerRef.current = window.setTimeout(() => {
      snapToNearest();
      pauseAutoAdvance();
      wheelSnapTimerRef.current = null;
    }, WHEEL_SNAP_DELAY_MS);
  };

  if (total === 0) return null;

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className={cn(
          "relative mx-auto w-full max-w-6xl touch-pan-y select-none [perspective:1400px]",
          "h-[min(104vw,400px)] sm:h-[min(64vw,453px)] md:h-[min(51vw,507px)] lg:h-[533px] lg:max-h-[640px]",
          dragging ? "cursor-grabbing" : "cursor-grab",
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={onWheel}
        onMouseEnter={() => {
          pausedRef.current = true;
        }}
        onMouseLeave={() => {
          if (!dragging) pausedRef.current = false;
        }}
        aria-roledescription="carousel"
        aria-label="Sample gallery showcase"
      >
        <div className="relative flex h-full items-center justify-center [transform-style:preserve-3d]">
          {items.map((item, index) => {
            const offset = wrapOffset(index, position, total);
            const style = cardStyle(offset, compact, viewportWidth);
            const isSelected = index === activeIndex;

            return (
              <button
                key={item.id}
                type="button"
                aria-hidden={!style.visible}
                aria-label={
                  isSelected ? `${item.tag}: ${item.alt}` : `View ${item.tag} gallery`
                }
                tabIndex={isSelected ? 0 : -1}
                onClick={() => {
                  if (dragRef.current.moved || isSelected) return;
                  goTo(index);
                }}
                className={cn(
                  "absolute top-1/2 left-1/2 w-[min(78vw,300px)] sm:w-[min(48vw,340px)] md:w-[min(38vw,380px)] lg:w-[400px]",
                  "aspect-[3/4] overflow-hidden bg-slate-100 [transform-style:preserve-3d] [backface-visibility:hidden]",
                  motionEnabled
                    ? "transition-[transform,opacity,filter,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    : "transition-none",
                  isSelected
                    ? "cursor-default rounded-[1.75rem] border-[3px] shadow-[0_42px_90px_-28px_rgba(85,0,31,0.4)]"
                    : "cursor-pointer rounded-2xl border border-slate-200/80 shadow-[0_24px_50px_-28px_rgba(15,23,42,0.28)]",
                  compact && !isSelected && "pointer-events-none",
                  !style.visible && "pointer-events-none",
                )}
                style={{
                  transform: style.transform,
                  opacity: style.visible ? style.opacity : 0,
                  zIndex: style.zIndex,
                  filter: style.blur > 0 ? `blur(${style.blur}px)` : undefined,
                  borderColor: isSelected ? SELECTED_BORDER : undefined,
                }}
              >
                <ShowcaseCoverPreview
                  src={item.src}
                  alt={item.alt}
                  title={item.title}
                  coverFrame={item.coverFrame}
                  coverColor={item.coverColor}
                  priority={isSelected}
                />
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-slate-500 sm:text-sm">
        <span className="sm:hidden">Swipe to browse galleries</span>
        <span className="hidden sm:inline">Drag or scroll to browse galleries</span>
      </p>

      <div className="mt-4 flex items-center justify-center gap-2 sm:mt-5">
        {items.map((item, index) => (
          <button
            key={`dot-${item.id}`}
            type="button"
            aria-label={`Go to ${item.tag} gallery`}
            aria-current={index === activeIndex ? "true" : undefined}
            onClick={() => goTo(index)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              index === activeIndex ? "w-7" : "w-2 bg-slate-300 hover:bg-slate-400",
            )}
            style={
              index === activeIndex ? { backgroundColor: SELECTED_BORDER } : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
