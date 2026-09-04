"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Skeleton } from "antd";
import { cn } from "@/lib/utils";
import {
  formatBytesShort,
  type PipelineSlice,
  type StorageSlice,
  type WeeklyBar,
} from "@/lib/dashboard-chart-data";

const cardClass = "dashboard-panel flex h-full flex-col";

type ChartCardProps = {
  title: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
  children: React.ReactNode;
  className?: string;
};

export function ChartCard({
  title,
  subtitle,
  href,
  hrefLabel = "View details",
  children,
  className,
}: ChartCardProps) {
  return (
    <ChartShell className={className}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-500">{subtitle}</p>
          ) : null}
        </div>
        {href ? (
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand transition hover:text-brand-hover dark:text-brand-on-dark"
          >
            {hrefLabel}
            <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        ) : null}
      </div>
      <div className="mt-4 flex flex-1 flex-col justify-center">{children}</div>
    </ChartShell>
  );
}

function ChartShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(cardClass, className)}>{children}</div>;
}

function formatDelta(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}`;
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
        0
      </span>
    );
  }
  const positive = delta > 0;
  return (
    <span
      className={cn(
        "rounded-md px-2 py-0.5 text-[11px] font-semibold tabular-nums",
        positive
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
          : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300",
      )}
    >
      {formatDelta(delta)}
    </span>
  );
}

function SemiCircularGauge({ percent }: { percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent));
  const width = 220;
  const height = 118;
  const cx = width / 2;
  const cy = height - 8;
  const r = 88;
  const stroke = 14;

  const startAngle = Math.PI;
  const endAngle = 0;
  const progressAngle = startAngle - (clamped / 100) * Math.PI;

  const polar = (angle: number) => ({
    x: cx + r * Math.cos(angle),
    y: cy - r * Math.sin(angle),
  });

  const start = polar(startAngle);
  const end = polar(endAngle);
  const progress = polar(progressAngle);

  const trackPath = `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`;
  const progressPath =
    clamped > 0
      ? `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${progress.x} ${progress.y}`
      : "";

  const needleLen = 10;
  const needleX = progress.x + (cx - progress.x) * (needleLen / r);
  const needleY = progress.y + (cy - progress.y) * (needleLen / r);

  return (
    <div className="relative mx-auto w-full max-w-[240px]" role="img" aria-label={`${clamped}% of plan used`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mx-auto block w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id="storage-gauge-fill" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8DA399" />
            <stop offset="100%" stopColor="#5E756B" />
          </linearGradient>
        </defs>
        <path
          d={trackPath}
          fill="none"
          stroke="#F0F2F1"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="dark:stroke-zinc-800"
        />
        {progressPath ? (
          <path
            d={progressPath}
            fill="none"
            stroke="url(#storage-gauge-fill)"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        ) : null}
        {clamped > 0 ? (
          <line
            x1={progress.x}
            y1={progress.y}
            x2={needleX}
            y2={needleY}
            stroke="#525252"
            strokeWidth={2}
            strokeLinecap="round"
            className="dark:stroke-zinc-400"
          />
        ) : null}
      </svg>
      <div className="pointer-events-none absolute inset-x-0 bottom-1 flex justify-center">
        <span className="font-display text-[2rem] font-semibold leading-none tabular-nums text-zinc-900 dark:text-zinc-50">
          {clamped}%
        </span>
      </div>
    </div>
  );
}

export type StorageBreakdownCardProps = {
  totalBytes: number;
  raws: number;
  selections: number;
  finals: number;
  planBytes: number;
  href?: string;
};

export function StorageBreakdownCard({
  totalBytes,
  raws,
  selections,
  finals,
  planBytes,
  href = "/dashboard/storage",
}: StorageBreakdownCardProps) {
  const total = raws + selections + finals;
  const planPct =
    planBytes > 0 ? Math.min(100, Math.round((totalBytes / planBytes) * 100)) : 0;

  const dominant = [
    { label: "Proofs", bytes: raws },
    { label: "Selected", bytes: selections },
    { label: "Finals", bytes: finals },
  ]
    .filter((item) => item.bytes > 0)
    .sort((a, b) => b.bytes - a.bytes)[0];

  const dominantPct =
    dominant && total > 0 ? Math.round((dominant.bytes / total) * 100) : 0;

  return (
    <div className={cn(cardClass, "min-h-[280px]")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Storage
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            {dominant ? dominant.label : "Proofs, selected & finals"}
          </p>
        </div>
        {href ? (
          <Link
            href={href}
            className="text-xs font-semibold text-brand transition hover:text-brand-hover dark:text-brand-on-dark"
          >
            Details
          </Link>
        ) : null}
      </div>

      <p className="mt-4 font-display text-[1.75rem] font-medium leading-none tabular-nums tracking-tight text-zinc-900 dark:text-zinc-100">
        {formatBytesShort(totalBytes)}
      </p>
      <p className="mt-1.5 text-xs text-zinc-500">
        {dominant
          ? `${dominant.label} are ${dominantPct}% of total storage`
          : "No storage data yet"}
      </p>

      <div className="mt-auto flex flex-1 flex-col justify-end pt-4">
        <SemiCircularGauge percent={planPct} />
      </div>
    </div>
  );
}

export type WeeklyActivityCardProps = {
  bars: WeeklyBar[];
  todayCount: number;
  weekTotal: number;
  todayDelta: number;
  weekDelta: number;
  highlightDateKey?: string;
};

export function WeeklyActivityCard({
  bars,
  todayCount,
  weekTotal,
  todayDelta,
  weekDelta,
  highlightDateKey,
}: WeeklyActivityCardProps) {
  const onTrack = weekDelta >= 0;
  const highlightKey =
    highlightDateKey ?? (bars.length > 0 ? bars[bars.length - 1]!.dateKey : undefined);

  return (
    <div className={cn(cardClass, "min-h-[320px]")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Weekly activity
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            By keeping track of activity, you can see how delivery is trending.
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold",
            onTrack
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
          )}
        >
          <CheckCircle2 className="h-3 w-3" aria-hidden />
          {onTrack ? "On track" : "Slower week"}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:max-w-xs">
        <div className="rounded-xl border border-zinc-100 bg-zinc-50/60 px-3.5 py-3 dark:border-zinc-800 dark:bg-zinc-900/40">
          <p className="text-xs font-medium text-zinc-500">Today</p>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="font-display text-2xl font-medium tabular-nums text-zinc-900 dark:text-zinc-50">
              {todayCount}
            </span>
            <DeltaBadge delta={todayDelta} />
          </div>
        </div>
        <div className="rounded-xl border border-zinc-100 bg-zinc-50/60 px-3.5 py-3 dark:border-zinc-800 dark:bg-zinc-900/40">
          <p className="text-xs font-medium text-zinc-500">This week</p>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="font-display text-2xl font-medium tabular-nums text-zinc-900 dark:text-zinc-50">
              {weekTotal}
            </span>
            <DeltaBadge delta={weekDelta} />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <WeeklyActivityChart bars={bars} highlightDateKey={highlightKey} />
      </div>
    </div>
  );
}

export type DonutProps = {
  slices: PipelineSlice[] | StorageSlice[];
  totalLabel: string;
  totalValue: string;
  valueKey?: "value" | "bytes";
  emptyLabel?: string;
};

export function DonutChart({
  slices,
  totalLabel,
  totalValue,
  valueKey = "value",
  emptyLabel = "No data yet",
}: DonutProps) {
  const size = 148;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  const numericSlices = slices.map((s) => ({
    color: s.color,
    value: valueKey === "bytes" ? (s as StorageSlice).bytes : (s as PipelineSlice).value,
    label: s.label,
  }));
  const total = numericSlices.reduce((sum, x) => sum + x.value, 0);

  if (total <= 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <svg width={size} height={size} className="text-zinc-200 dark:text-zinc-800" aria-hidden>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
          />
        </svg>
        <p className="mt-3 text-xs text-zinc-500">{emptyLabel}</p>
      </div>
    );
  }

  let cumulative = 0;
  const arcs = numericSlices.map((slice) => {
    const len = (slice.value / total) * c;
    const dasharray = `${len} ${c - len}`;
    const dashoffset = -cumulative;
    cumulative += len;
    return { ...slice, dasharray, dashoffset };
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={totalLabel}>
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            {arcs.map((arc) => (
              <circle
                key={arc.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={arc.color}
                strokeWidth={stroke}
                strokeDasharray={arc.dasharray}
                strokeDashoffset={arc.dashoffset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            ))}
          </g>
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {totalValue}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            {totalLabel}
          </span>
        </div>
      </div>
      <ChartLegend
        items={numericSlices.map((s) => ({
          label: s.label,
          value: valueKey === "bytes" ? formatBytesShort(s.value) : String(s.value),
          color: s.color,
        }))}
      />
    </div>
  );
}

function ChartLegend({
  items,
}: {
  items: { label: string; value: string; color: string }[];
}) {
  return (
    <ul className="w-full min-w-0 space-y-2 sm:flex-1">
      {items.map((item) => (
        <li key={item.label} className="flex items-center justify-between gap-3 text-sm">
          <span className="flex min-w-0 items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
              aria-hidden
            />
            <span className="truncate text-zinc-600 dark:text-zinc-400">{item.label}</span>
          </span>
          <span className="shrink-0 font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
            {item.value}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function WeeklyActivityChart({
  bars,
  highlightDateKey,
}: {
  bars: WeeklyBar[];
  highlightDateKey?: string;
}) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  const chartH = 140;
  const highlightIdx = highlightDateKey
    ? bars.findIndex((b) => b.dateKey === highlightDateKey)
    : -1;

  return (
    <div className="w-full" role="img" aria-label="Gallery activity over the last 7 days">
      <div
        className="relative flex items-end justify-between gap-1.5 sm:gap-2"
        style={{ height: chartH }}
      >
        {bars.map((bar, idx) => {
          const h = bar.value === 0 ? 6 : Math.max(12, (bar.value / max) * chartH);
          const highlighted = idx === highlightIdx;
          return (
            <div key={bar.dateKey} className="group relative flex flex-1 flex-col items-center gap-2">
              {highlighted && bar.value > 0 ? (
                <span className="absolute -top-7 z-10 whitespace-nowrap rounded-lg bg-brand px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm dark:bg-brand/90">
                  {bar.value} event{bar.value === 1 ? "" : "s"}
                </span>
              ) : (
                <span className="text-[10px] font-medium tabular-nums text-zinc-400 opacity-0 transition group-hover:opacity-100">
                  {bar.value || ""}
                </span>
              )}
              <div className="flex w-full flex-1 items-end justify-center">
                <div
                  className={cn(
                    "relative w-full max-w-[36px] rounded-t-xl transition-colors duration-300",
                    highlighted
                      ? "bg-brand dark:bg-brand/80"
                      : bar.value > 0
                        ? "bg-zinc-200 group-hover:bg-zinc-300 dark:bg-zinc-700 dark:group-hover:bg-zinc-600"
                        : "bg-zinc-100 dark:bg-zinc-800/80",
                  )}
                  style={{ height: h }}
                  title={`${bar.label}: ${bar.value} event${bar.value === 1 ? "" : "s"}`}
                >
                  {highlighted ? (
                    <span
                      className="absolute -top-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-brand ring-2 ring-white dark:ring-zinc-950"
                      aria-hidden
                    />
                  ) : null}
                </div>
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium",
                  highlighted ? "font-semibold text-brand dark:text-brand-on-dark" : "text-zinc-500",
                )}
              >
                {bar.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ChartCardSkeleton({ variant = "storage" }: { variant?: "storage" | "activity" }) {
  if (variant === "activity") {
    return (
      <div className={cn(cardClass, "min-h-[320px]")}>
        <Skeleton active title={{ width: "36%" }} paragraph={false} />
        <div className="mt-5 grid grid-cols-2 gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} active title={{ width: "100%", style: { height: 72, margin: 0 } }} paragraph={false} />
          ))}
        </div>
        <Skeleton active title={{ width: "100%", style: { height: 168, marginTop: 24 } }} paragraph={false} />
      </div>
    );
  }

  return (
    <div className={cn(cardClass, "min-h-[320px]")}>
      <Skeleton active title={{ width: "36%" }} paragraph={{ rows: 2, width: ["24%", "48%"] }} />
      <div className="mt-auto flex justify-center pt-8">
        <Skeleton.Avatar active size={192} shape="square" className="!rounded-t-full !rounded-b-none" />
      </div>
    </div>
  );
}
