"use client";

import { Moon, Timer } from "lucide-react";
import type { WeeklyBar } from "@/lib/dashboard-chart-data";
import { formatBytesShort } from "@/lib/dashboard-chart-data";
import { cn } from "@/lib/utils";

type DashboardSoftEduSuccessProps = {
  bars: WeeklyBar[];
  weekTotal: number;
  weekDelta: number;
  completedGalleries: number;
  storageUsed?: number | null;
  storageLimit?: number | null;
  statusLabel?: string | null;
  loading?: boolean;
};

function SoftLineChart({ bars }: { bars: WeeklyBar[] }) {
  const width = 320;
  const height = 88;
  const padX = 8;
  const padY = 12;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const max = Math.max(1, ...bars.map((b) => b.value));

  const points = bars.map((bar, i) => {
    const x = padX + (i / Math.max(1, bars.length - 1)) * innerW;
    const y = padY + innerH - (bar.value / max) * innerH;
    return { x, y, value: bar.value };
  });

  const linePath =
    points.length > 0
      ? points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
      : "";

  const peak = points.reduce<(typeof points)[0] | null>((best, p) => {
    if (!best || p.value > best.value) return p;
    return best;
  }, null);

  return (
    <div className="relative mt-3 w-full" role="img" aria-label="Weekly activity">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="block h-[72px] w-full"
        aria-hidden
      >
        {linePath ? (
          <path
            d={linePath}
            fill="none"
            stroke="#059669"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
        {peak && peak.value > 0 ? (
          <circle cx={peak.x} cy={peak.y} r={3.5} fill="#059669" />
        ) : null}
      </svg>
      {peak && peak.value > 0 ? (
        <span
          className="pointer-events-none absolute rounded-lg bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold text-white"
          style={{
            left: `clamp(0%, calc(${(peak.x / width) * 100}% - 12px), calc(100% - 28px))`,
            top: Math.max(0, (peak.y / height) * 100 - 18) + "%",
          }}
        >
          {peak.value}
        </span>
      ) : null}
    </div>
  );
}

function SoftBarChart({ bars }: { bars: WeeklyBar[] }) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  return (
    <div className="mt-3 flex h-16 items-end justify-between gap-1.5 px-0.5">
      {bars.map((bar, i) => {
        const h = Math.max(8, Math.round((bar.value / max) * 100));
        const highlight = i === bars.length - 2 || (bars.length <= 2 && i === bars.length - 1);
        return (
          <div key={bar.dateKey} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex h-12 w-full items-end justify-center">
              <span
                className={cn(
                  "w-full max-w-[14px] rounded-sm transition",
                  highlight || bar.value === max
                    ? "bg-emerald-600"
                    : "bg-emerald-200 dark:bg-emerald-900/60",
                )}
                style={{ height: `${h}%` }}
                title={`${bar.label}: ${bar.value}`}
              />
            </div>
            <span className="text-[9px] font-medium text-zinc-400">{bar.label.slice(0, 1)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function DashboardSoftEduSuccess({
  bars,
  weekTotal,
  weekDelta,
  completedGalleries,
  storageUsed,
  storageLimit,
  statusLabel,
  loading,
}: DashboardSoftEduSuccessProps) {
  const storageLabel =
    storageUsed != null
      ? formatBytesShort(storageUsed)
      : loading
        ? "—"
        : "0 B";
  const storageHint =
    storageLimit != null && storageLimit > 0
      ? `of ${formatBytesShort(storageLimit)} plan`
      : "Storage used";

  return (
    <section className="h-full rounded-[1.5rem] bg-[#231519] p-4 text-white sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Your success</h2>
          {statusLabel ? (
            <p className="mt-0.5 text-[11px] text-white/55">{statusLabel}</p>
          ) : null}
        </div>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white">
          <Moon className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>

      <div className="mt-4 rounded-[1.15rem] bg-white p-4 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
        <div className="flex items-start justify-between gap-3">
          <div>
            {loading ? (
              <span className="inline-block h-8 w-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            ) : (
              <p className="font-display text-3xl font-semibold tabular-nums leading-none">
                {completedGalleries || weekTotal}
              </p>
            )}
            <p className="mt-1.5 text-[11px] text-zinc-500">
              {completedGalleries > 0 ? "Galleries delivered" : "Events this week"}
            </p>
          </div>
          <span className="rounded-lg bg-[#efefef] px-2 py-1 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            Last week
            {weekDelta !== 0 ? (
              <span className={cn("ml-1", weekDelta > 0 ? "text-emerald-600" : "text-red-500")}>
                {weekDelta > 0 ? "+" : ""}
                {weekDelta}
              </span>
            ) : null}
          </span>
        </div>
        <SoftLineChart bars={bars} />
      </div>

      <div className="mt-3 rounded-[1.15rem] bg-white p-4 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-xl font-semibold tabular-nums leading-none sm:text-2xl">
              {storageLabel}
            </p>
            <p className="mt-1.5 max-w-[11rem] text-[11px] leading-snug text-zinc-500">
              {storageHint}
            </p>
          </div>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#efefef] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            <Timer className="h-3.5 w-3.5" aria-hidden />
          </span>
        </div>
        <SoftBarChart bars={bars} />
      </div>
    </section>
  );
}
