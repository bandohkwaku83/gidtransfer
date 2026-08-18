"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Mouse / trackpad: start reorder after this much movement. */
export const POINTER_DRAG_START_PX = 8;
/** Touch: wait this long without scrolling, then lift the tile. */
export const POINTER_LONG_PRESS_MS = 320;
/** Touch: more movement than this before the hold completes = scroll, not drag. */
export const POINTER_SCROLL_CANCEL_PX = 12;

export type ArmedPointer<T> = {
  payload: T;
  pointerId: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  touchLike: boolean;
  captureEl: HTMLElement | null;
};

type PendingPointer<T> = ArmedPointer<T> & { holdTimer: number | null };

export function isTouchLikePointer(event: { pointerType: string }): boolean {
  return event.pointerType === "touch" || event.pointerType === "pen";
}

export function capturePointer(el: EventTarget | null, pointerId: number) {
  if (!el || !("setPointerCapture" in el)) return;
  try {
    (el as HTMLElement).setPointerCapture(pointerId);
  } catch {
    /* pointer already released */
  }
}

export function releasePointer(el: EventTarget | null, pointerId: number) {
  if (!el || !("hasPointerCapture" in el)) return;
  const node = el as HTMLElement;
  try {
    if (node.hasPointerCapture(pointerId)) node.releasePointerCapture(pointerId);
  } catch {
    /* already released */
  }
}

export function preventTouchScroll(event: TouchEvent) {
  if (event.cancelable) event.preventDefault();
}

export function lockPageScrollForDrag() {
  const html = document.documentElement;
  const body = document.body;
  const prev = {
    htmlOverflow: html.style.overflow,
    bodyOverflow: body.style.overflow,
    bodyTouch: body.style.touchAction,
  };
  html.style.overflow = "hidden";
  body.style.overflow = "hidden";
  body.style.touchAction = "none";
  window.addEventListener("touchmove", preventTouchScroll, { passive: false });
  return () => {
    html.style.overflow = prev.htmlOverflow;
    body.style.overflow = prev.bodyOverflow;
    body.style.touchAction = prev.bodyTouch;
    window.removeEventListener("touchmove", preventTouchScroll);
  };
}

export function usePointerReorderArm<T>({
  enabled,
  isDragging,
  onBegin,
}: {
  enabled: boolean;
  isDragging: boolean;
  onBegin: (armed: ArmedPointer<T>, pointerX: number, pointerY: number) => void;
}) {
  const pendingRef = useRef<PendingPointer<T> | null>(null);
  const onBeginRef = useRef(onBegin);
  onBeginRef.current = onBegin;
  const unlockScrollRef = useRef<(() => void) | null>(null);
  const [pressingId, setPressingId] = useState<string | null>(null);

  const clearPending = useCallback(() => {
    const pending = pendingRef.current;
    if (pending?.holdTimer != null) window.clearTimeout(pending.holdTimer);
    pendingRef.current = null;
    unlockScrollRef.current?.();
    unlockScrollRef.current = null;
    setPressingId(null);
  }, []);

  useEffect(() => () => {
    const pending = pendingRef.current;
    if (pending?.holdTimer != null) window.clearTimeout(pending.holdTimer);
    pendingRef.current = null;
    unlockScrollRef.current?.();
    unlockScrollRef.current = null;
  }, []);

  const startFromArmed = useCallback((armed: ArmedPointer<T>, pointerX: number, pointerY: number) => {
    const pending = pendingRef.current;
    if (pending?.holdTimer != null) window.clearTimeout(pending.holdTimer);
    pendingRef.current = null;
    setPressingId(null);
    capturePointer(armed.captureEl, armed.pointerId);
    if (!unlockScrollRef.current) {
      unlockScrollRef.current = lockPageScrollForDrag();
    }
    if (armed.touchLike && typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(12);
    }
    onBeginRef.current(armed, pointerX, pointerY);
  }, []);

  useEffect(() => {
    if (isDragging || !enabled) return;

    const onPointerMove = (event: PointerEvent) => {
      const pending = pendingRef.current;
      if (!pending || event.pointerId !== pending.pointerId) return;
      const dist = Math.hypot(event.clientX - pending.startX, event.clientY - pending.startY);

      if (pending.touchLike && pending.holdTimer != null) {
        if (dist >= POINTER_SCROLL_CANCEL_PX) clearPending();
        return;
      }

      if (dist < POINTER_DRAG_START_PX) return;
      startFromArmed(pending, event.clientX, event.clientY);
    };

    const onPointerUp = (event: PointerEvent) => {
      const pending = pendingRef.current;
      if (!pending || event.pointerId !== pending.pointerId) return;
      clearPending();
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [clearPending, enabled, isDragging, startFromArmed]);

  const arm = useCallback(
    (
      event: React.PointerEvent<HTMLElement>,
      captureEl: HTMLElement | null,
      payload: T,
      options?: { pressKey?: string; captureImmediately?: boolean },
    ) => {
      if (!enabled) return;
      if (!captureEl) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;

      clearPending();

      const rect = captureEl.getBoundingClientRect();
      const touchLike = isTouchLikePointer(event);
      const captureImmediately = Boolean(options?.captureImmediately);
      const armed: PendingPointer<T> = {
        payload,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
        width: rect.width,
        height: rect.height,
        touchLike,
        captureEl,
        holdTimer: null,
      };

      if (captureImmediately) {
        capturePointer(captureEl, event.pointerId);
        pendingRef.current = armed;
        return;
      }

      if (touchLike) {
        if (options?.pressKey) setPressingId(options.pressKey);
        armed.holdTimer = window.setTimeout(() => {
          const current = pendingRef.current;
          if (!current || current.pointerId !== armed.pointerId) return;
          startFromArmed(current, current.startX, current.startY);
        }, POINTER_LONG_PRESS_MS);
      }

      pendingRef.current = armed;
    },
    [clearPending, enabled, startFromArmed],
  );

  return { arm, clearPending, pressingId };
}
