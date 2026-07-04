"use client";

type AdaptivePollOptions = {
  /** Called on each tick while the document is visible. */
  poll: () => void | Promise<void>;
  /** Base interval when the tab is focused. Default 45s. */
  intervalMs?: number;
  /** Longer interval when the tab is hidden. Default 3× intervalMs. */
  hiddenIntervalMs?: number;
  /** Run immediately when the tab becomes visible again. Default true. */
  refreshOnVisible?: boolean;
};

/**
 * Visibility-aware polling — slows down when the tab is hidden and refreshes on focus.
 * Prefer this over fixed `setInterval` for background sync workloads.
 */
export function startAdaptivePoll({
  poll,
  intervalMs = 45_000,
  hiddenIntervalMs = intervalMs * 3,
  refreshOnVisible = true,
}: AdaptivePollOptions): () => void {
  if (typeof window === "undefined") return () => {};

  let timer: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;

  const schedule = (delay: number) => {
    if (disposed) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(tick, delay);
  };

  const tick = () => {
    if (disposed) return;
    const hidden = document.visibilityState === "hidden";
    void Promise.resolve(poll()).finally(() => {
      schedule(hidden ? hiddenIntervalMs : intervalMs);
    });
  };

  const onVisibility = () => {
    if (disposed) return;
    if (document.visibilityState === "visible") {
      if (refreshOnVisible) void poll();
      schedule(intervalMs);
    } else {
      schedule(hiddenIntervalMs);
    }
  };

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("focus", onVisibility);
  schedule(0);

  return () => {
    disposed = true;
    if (timer) clearTimeout(timer);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("focus", onVisibility);
  };
}
