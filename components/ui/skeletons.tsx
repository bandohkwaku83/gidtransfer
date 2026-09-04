"use client";

import { Skeleton, Spin } from "antd";
import { cn } from "@/lib/utils";

type DashboardSpinSize = "small" | "default" | "large";

/** Ant Design spinner for dashboard actions and page loads. */
export function DashboardSpin({
  size = "default",
  className,
}: {
  size?: DashboardSpinSize;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center justify-center", className)} aria-hidden>
      <Spin size={size} />
    </span>
  );
}

/** Centered page/panel loader. */
export function DashboardPageSpin({
  label,
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-3 py-16 text-zinc-500 dark:text-zinc-400", className)}
      role="status"
    >
      <Spin />
      {label ? <span className="text-sm">{label}</span> : null}
    </div>
  );
}

/** Inline stat number placeholder (stat cards, KPI tiles). */
export function DashboardStatValueSkeleton({ className }: { className?: string }) {
  return (
    <span className={cn("inline-block", darkSkeleton, className)} aria-hidden>
      <Skeleton active title={{ width: 48, style: { height: 28, margin: 0 } }} paragraph={false} />
    </span>
  );
}

const darkSkeleton =
  "[&_.ant-skeleton-content_.ant-skeleton-title]:rounded-md [&_.ant-skeleton-content_.ant-skeleton-paragraph>li]:rounded-md dark:[&_.ant-skeleton-content_.ant-skeleton-title]:!bg-zinc-700 dark:[&_.ant-skeleton-content_.ant-skeleton-paragraph>li]:!bg-zinc-700";

/** Gallery card placeholder (dashboard + galleries grid). */
export function GalleryCardSkeleton({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950",
        compact ? "rounded-lg" : "rounded-xl",
        darkSkeleton,
        className,
      )}
    >
      <div className={cn("w-full overflow-hidden", compact ? "aspect-[4/3]" : "aspect-[5/3]")}>
        <Skeleton.Image
          active
          className={cn(
            "!flex !h-full !w-full !items-center !justify-center !rounded-none",
            compact ? "!min-h-[88px]" : "!min-h-[140px]",
          )}
        />
      </div>
      <div className={cn("border-t border-zinc-100 dark:border-zinc-800", compact ? "space-y-1.5 p-2" : "p-4")}>
        <Skeleton
          active
          title={{ width: "72%", style: compact ? { height: 12, marginTop: 0 } : undefined }}
          paragraph={{ rows: compact ? 1 : 2, width: compact ? ["55%"] : ["52%", "36%"] }}
        />
      </div>
    </div>
  );
}

/** Stat card number area while loading. */
export function StatValueSkeleton() {
  return (
    <div className={cn("mt-4", darkSkeleton)}>
      <Skeleton active title={{ width: 56, style: { height: 36, marginTop: 0 } }} paragraph={false} />
    </div>
  );
}

/** Full folder detail page initial load. */
export function FolderDetailPageSkeleton() {
  return (
    <div className={cn("dashboard-page space-y-5", darkSkeleton)}>
      <Skeleton active title={{ width: 220 }} paragraph={false} />
      <Skeleton active title={{ width: "40%" }} paragraph={{ rows: 1, width: "28%" }} />
      <Skeleton active title={false} paragraph={{ rows: 1, width: "100%", style: { height: 44 } }} />
      <div className="flex flex-col gap-6 lg:flex-row">
        <Skeleton active title={false} paragraph={{ rows: 1, width: "100%", style: { height: 420 } }} className="flex-1" />
        <Skeleton active title={false} paragraph={{ rows: 1, width: "100%", style: { height: 420 } }} className="!w-full lg:!max-w-[380px]" />
      </div>
    </div>
  );
}

/** Shimmer tile without SVG `<title>` text (social crawlers concat those titles into link previews). */
function GalleryOgSafeImageTileSkeleton() {
  return (
    <div
      className="aspect-square overflow-hidden rounded-lg bg-zinc-200/85 dark:bg-zinc-800/90"
      aria-hidden
    >
      <div
        className="h-full w-full animate-pulse bg-gradient-to-r from-zinc-200/40 via-white/55 to-zinc-200/40 bg-[length:180%_100%] dark:from-zinc-700/50 dark:via-zinc-500/25 dark:to-zinc-700/50 dark:bg-[length:180%_100%]"
      />
    </div>
  );
}

/**
 * Tailwind-only shimmer block (no AntD).
 * Used inside the public share-route skeletons so `/g/[token]` and `/share/[code]` do not
 * pull AntD into their JS bundles.
 */
function TwShimmer({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-800/80",
        className,
      )}
    />
  );
}

/** Client share gallery full-screen load (AntD-free; loaded by `/g/[token]`). */
export function ClientGalleryPageSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <div className="border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950 lg:px-8">
        <TwShimmer className="h-8 w-40" />
      </div>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 lg:px-8">
        <div className="space-y-3">
          <TwShimmer className="h-6 w-2/5" />
          <TwShimmer className="h-4 w-full" />
          <TwShimmer className="h-4 w-7/12" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <GalleryOgSafeImageTileSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Settings workflow block. */
export function SettingsWorkflowSkeleton() {
  return (
    <div className={cn("space-y-4", darkSkeleton)}>
      <Skeleton active title={{ width: "50%" }} paragraph={{ rows: 1, width: ["100%"] }} />
      <Skeleton active title={false} paragraph={{ rows: 4, width: ["100%", "100%", "80%", "60%"] }} />
    </div>
  );
}

/** Small square for icon-sized loading (e.g. delete in progress). */
export function InlineActionSkeleton({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center justify-center", darkSkeleton, className)} aria-hidden>
      <Skeleton.Avatar active size={16} shape="square" />
    </span>
  );
}

/** Indeterminate segment inside an existing progress track (parent sets height/radius). */
export function UploadIndeterminateBarSkeleton() {
  return (
    <div className={cn("h-full w-full", darkSkeleton)}>
      <Skeleton active title={{ width: "100%", style: { height: 8, margin: 0 } }} paragraph={false} />
    </div>
  );
}

/** Compact spinner while a list/grid refreshes in place. */
export function ListRefreshSkeleton() {
  return (
    <div className="flex justify-center py-2" role="status">
      <Spin size="small" />
    </div>
  );
}

/** Clients table initial load. */
export function ClientListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className={cn("dashboard-panel !overflow-hidden !p-0", darkSkeleton)}>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton.Avatar active size={32} />
            <Skeleton active title={{ width: "32%" }} paragraph={{ rows: 1, width: "48%" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Notifications page initial load. */
export function NotificationsListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950", darkSkeleton)}>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-5 py-4">
            <Skeleton active title={{ width: "42%" }} paragraph={{ rows: 1, width: "72%" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Trash page initial load. */
export function TrashPageSkeleton() {
  return (
    <div className={cn("space-y-4", darkSkeleton)}>
      <Skeleton active title={{ width: 120 }} paragraph={{ rows: 2, width: ["100%", "68%"] }} />
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border-b border-zinc-100 px-4 py-3 last:border-b-0 dark:border-zinc-800">
            <Skeleton active avatar paragraph={{ rows: 1, width: "55%" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Storage summary panel initial load. */
export function StorageSummarySkeleton() {
  return (
    <div className={cn("dashboard-panel space-y-4", darkSkeleton)}>
      <Skeleton active title={{ width: 96 }} paragraph={false} />
      <div className="flex gap-6">
        <div className="flex-1 space-y-3">
          <Skeleton active title={{ width: 128, style: { height: 36 } }} paragraph={false} />
          <Skeleton active title={{ width: "100%", style: { height: 12 } }} paragraph={false} />
        </div>
        <Skeleton.Avatar active size={112} shape="circle" />
      </div>
    </div>
  );
}

/** Storage gallery breakdown table initial load. */
export function StorageTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className={cn("space-y-2", darkSkeleton)}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} active title={{ width: "100%", style: { height: 56 } }} paragraph={false} />
      ))}
    </div>
  );
}

/** Schedules calendar month initial load. */
export function CalendarMonthSkeleton({ cells = 35 }: { cells?: number }) {
  return (
    <div className={cn("mt-4 grid grid-cols-7 gap-2", darkSkeleton)} aria-hidden>
      {Array.from({ length: cells }).map((_, i) => (
        <Skeleton key={i} active title={{ width: "100%", style: { height: 104, margin: 0 } }} paragraph={false} />
      ))}
    </div>
  );
}

/**
 * Header / banner "activity" indicator while a request runs (replaces spinners).
 * AntD-free so the public share route does not pull AntD into its bundle.
 */
export function InlineStatusSkeleton({ size = 16 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 animate-pulse rounded-full bg-zinc-200/85 dark:bg-zinc-700/85"
      style={{ width: size, height: size }}
    />
  );
}

/** Dashboard activity sidebar while data is loading. */
export function ActivityFeedSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className={cn("mt-3 space-y-2", darkSkeleton)}>
      <Skeleton active title={{ width: 48, style: { height: 12, margin: 0 } }} paragraph={false} />
      <ul className="space-y-0">
        {Array.from({ length: rows }).map((_, i) => (
          <li key={i} className="rounded-lg p-1.5">
            <Skeleton active avatar paragraph={{ rows: 1, width: "62%" }} />
          </li>
        ))}
      </ul>
    </div>
  );
}
