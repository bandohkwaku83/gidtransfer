"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatBytesShort,
  type PipelineSlice,
  type StorageSlice,
  type WeeklyBar,
} from "@/lib/dashboard-chart-data";

const cardClass =
  "flex h-full flex-col rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950";

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

type DonutProps = {
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
  const size = 128;
  const stroke = 14;
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

export function WeeklyActivityChart({ bars }: { bars: WeeklyBar[] }) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  const chartH = 120;

  return (
    <div
      className="flex items-end justify-between gap-1.5 sm:gap-2"
      style={{ height: chartH }}
      role="img"
      aria-label="Gallery activity over the last 7 days"
    >
      {bars.map((bar) => {
        const h = bar.value === 0 ? 4 : Math.max(8, (bar.value / max) * chartH);
        return (
          <div key={bar.dateKey} className="group flex flex-1 flex-col items-center gap-2">
            <span className="text-[10px] font-medium tabular-nums text-zinc-400 opacity-0 transition group-hover:opacity-100">
              {bar.value || ""}
            </span>
            <div className="flex w-full flex-1 items-end justify-center">
              <ActivityBar h={h} bar={bar} />
            </div>
            <span className="text-[10px] font-medium text-zinc-500">{bar.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function ActivityBar({ h, bar }: { h: number; bar: WeeklyBar }) {
  return (
    <div
      className={cn(
        "w-full max-w-[28px] rounded-t-md bg-gradient-to-t transition-all duration-300",
        bar.value > 0
          ? "from-brand/70 to-brand shadow-sm shadow-brand/20 group-hover:from-brand group-hover:to-brand-hover"
          : "from-zinc-200 to-zinc-100 dark:from-zinc-800 dark:to-zinc-800/60",
      )}
      style={{ height: h }}
      title={`${bar.label}: ${bar.value} event${bar.value === 1 ? "" : "s"}`}
    />
  );
}

export function ChartCardSkeleton() {
  return (
    <div className={cn(cardClass, "min-h-[220px]")}>
      <div className="h-4 w-32 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-2 h-3 w-48 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800/60" />
      <div className="mt-8 flex flex-1 items-center justify-center">
        <div className="h-28 w-28 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800/60" />
      </div>
    </div>
  );
}
