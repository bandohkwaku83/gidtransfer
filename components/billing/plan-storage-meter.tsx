"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatStorageBytes } from "@/lib/storage-api";

export function storageUpgradeNeeded(percent: number | null | undefined): boolean {
  return percent != null && percent >= 90;
}

function formatCompactPct(percent: number | null | undefined): string | null {
  if (percent == null) return null;
  const pct = Math.min(100, Math.max(0, percent));
  if (pct > 0 && pct < 1) return pct.toFixed(1);
  return String(Math.round(pct));
}

function MeterBar({
  percent,
  warn,
  compact,
  label,
}: {
  percent: number | null | undefined;
  warn?: boolean;
  compact?: boolean;
  label: string;
}) {
  const pct = percent != null ? Math.min(100, Math.max(0, percent)) : null;
  return pct != null ? (
    <div
      className={cn(
        "overflow-hidden rounded-full bg-zinc-200/90 dark:bg-zinc-800",
        compact ? "h-1" : "h-1.5",
      )}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-out",
          warn ? "bg-amber-500" : "bg-brand",
        )}
        style={{ width: `${Math.min(100, Math.max(pct, pct > 0 ? 1.5 : 0))}%` }}
      />
    </div>
  ) : (
    <div
      className={cn(
        "overflow-hidden rounded-full bg-zinc-200/90 dark:bg-zinc-800",
        compact ? "h-1" : "h-1.5",
      )}
      aria-hidden
    />
  );
}

function CompactQuotaRow({
  label,
  percent,
  usedLabel,
}: {
  label: string;
  percent: number | null | undefined;
  usedLabel?: string;
}) {
  const warn = storageUpgradeNeeded(percent);

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400 dark:text-zinc-500">
          {label}
        </span>
        <span
          className={cn(
            "truncate text-[10px] tabular-nums",
            warn
              ? "font-semibold text-amber-700 dark:text-amber-300"
              : "text-zinc-500 dark:text-zinc-400",
          )}
        >
          {usedLabel ?? "—"}
        </span>
      </div>
      <MeterBar percent={percent} warn={warn} compact label={label} />
    </div>
  );
}

export function PlanStorageMeter({
  planName,
  percent,
  usedLabel,
  compact = false,
  className,
  title = "Plan storage",
}: {
  planName?: string;
  percent: number | null | undefined;
  usedLabel?: string;
  compact?: boolean;
  className?: string;
  title?: string;
}) {
  const pct = percent != null ? Math.min(100, Math.max(0, percent)) : null;
  const displayPct = formatCompactPct(pct);
  const warn = storageUpgradeNeeded(pct);

  if (compact) {
    return (
      <div className={cn(className)}>
        <CompactQuotaRow
          label={planName ? planName : title}
          percent={pct}
          usedLabel={usedLabel}
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        {planName ? (
          <p className="truncate text-xs font-semibold">{planName}</p>
        ) : (
          <p className="truncate text-xs font-medium text-zinc-500">{title}</p>
        )}
        {displayPct != null ? (
          <span
            className={cn(
              "text-xs tabular-nums",
              warn ? "font-semibold text-amber-700 dark:text-amber-300" : "text-zinc-500",
            )}
          >
            {displayPct}%
          </span>
        ) : null}
      </div>
      <MeterBar percent={pct} warn={warn} label={title} />
      {usedLabel ? <p className="text-xs text-zinc-500">{usedLabel}</p> : null}
    </div>
  );
}

/** Plan storage + video as separate caps (video is not “extra GB on top”). */
export function PlanQuotaMeters({
  planUsedBytes,
  planLimitBytes,
  planPercent,
  planName,
  videoEnabled,
  videoUsedBytes,
  videoLimitBytes,
  videoLimitLabel,
  compact = false,
  className,
}: {
  planUsedBytes?: number | null;
  planLimitBytes?: number | null;
  planPercent?: number | null;
  planName?: string;
  videoEnabled?: boolean;
  videoUsedBytes?: number | null;
  videoLimitBytes?: number | null;
  videoLimitLabel?: string | null;
  compact?: boolean;
  className?: string;
}) {
  const planLimit = planLimitBytes != null && planLimitBytes > 0 ? planLimitBytes : null;
  const planUsed = planUsedBytes != null && planUsedBytes >= 0 ? planUsedBytes : null;
  const resolvedPlanPct =
    planPercent != null
      ? planPercent
      : planLimit != null && planUsed != null
        ? Math.min(100, (planUsed / planLimit) * 100)
        : null;
  const planLabel =
    planUsed != null && planLimit != null
      ? `${formatStorageBytes(planUsed)} / ${formatStorageBytes(planLimit)}`
      : planUsed != null
        ? formatStorageBytes(planUsed)
        : planLimit != null
          ? `of ${formatStorageBytes(planLimit)}`
          : undefined;

  const videoLimit =
    videoLimitBytes != null && videoLimitBytes > 0 ? videoLimitBytes : null;
  const videoUsed =
    videoUsedBytes != null && videoUsedBytes >= 0 ? videoUsedBytes : null;
  const showVideo = Boolean(videoEnabled && (videoLimit != null || videoLimitLabel));
  const videoPct =
    videoLimit != null && videoUsed != null
      ? Math.min(100, (videoUsed / videoLimit) * 100)
      : null;
  const videoLabel =
    videoUsed != null && videoLimit != null
      ? `${formatStorageBytes(videoUsed)} / ${formatStorageBytes(videoLimit)}`
      : videoLimit != null
        ? `Cap ${formatStorageBytes(videoLimit)}`
        : videoLimitLabel
          ? `Cap ${videoLimitLabel}`
          : undefined;

  if (compact) {
    return (
      <div className={cn("space-y-2.5", className)}>
        <CompactQuotaRow label="Storage" percent={resolvedPlanPct} usedLabel={planLabel} />
        {showVideo ? (
          <CompactQuotaRow label="Video" percent={videoPct} usedLabel={videoLabel} />
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <PlanStorageMeter
        planName={planName}
        title="Plan storage"
        percent={resolvedPlanPct}
        usedLabel={planLabel}
      />
      {showVideo ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-xs font-medium text-zinc-500">Video storage</p>
            {videoPct != null ? (
              <span
                className={cn(
                  "text-xs tabular-nums",
                  storageUpgradeNeeded(videoPct)
                    ? "font-semibold text-amber-700 dark:text-amber-300"
                    : "text-zinc-500",
                )}
              >
                {Math.round(videoPct)}%
              </span>
            ) : null}
          </div>
          <MeterBar
            percent={videoPct}
            warn={storageUpgradeNeeded(videoPct)}
            label="Video storage"
          />
          {videoLabel ? (
            <p className="text-xs text-zinc-500">
              {videoLabel}
              {videoUsed == null ? " · usage shown when the API reports it" : null}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function StorageUpgradePrompt({
  percent,
  capped = false,
  className,
}: {
  percent: number | null | undefined;
  capped?: boolean;
  className?: string;
}) {
  if (!capped && !storageUpgradeNeeded(percent)) return null;
  const pct = Math.round(percent ?? 0);
  return (
    <div
      className={cn(
        "rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100",
        className,
      )}
    >
      {capped ? (
        <>You&apos;ve used your included plan storage. </>
      ) : (
        <>You&apos;ve used {pct}% of included storage. </>
      )}
      <Link
        href="/dashboard/settings?tab=billing"
        className="font-semibold underline underline-offset-2"
      >
        Upgrade your plan
      </Link>{" "}
      {capped
        ? "for more space. Uploads may still work until the backend enforces the limit."
        : "before you run out."}
    </div>
  );
}
