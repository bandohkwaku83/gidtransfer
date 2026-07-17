"use client";

import {
  CalendarDays,
  CircleDollarSign,
  Clock3,
  FileText,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import { DonutChart } from "@/components/dashboard/dashboard-charts";
import { useDashboardUiTheme } from "@/components/dashboard-ui-theme";
import {
  buildIncomeKpiTrends,
  formatIncomeCompact,
  INCOME_STATUS_COLORS,
  type IncomeKpiTrend,
  type IncomeSummary,
  type MonthlyRevenueBar,
} from "@/lib/income-demo";
import type { IncomeStatusSlice } from "@/lib/income-api";
import { cn } from "@/lib/utils";

const KPI_ICONS = {
  Collected: CircleDollarSign,
  Pending: Clock3,
  Invoiced: FileText,
  "Paid bookings": CalendarDays,
} as const;

const KPI_CARD_CLASS =
  "group relative flex flex-col overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#171717] px-3.5 py-3 shadow-sm transition hover:border-[#333333] hover:bg-[#1f1f1f]";

const KPI_ICON_WRAP = "bg-[#2a2a2a]";
const KPI_ICON_COLOR = "text-zinc-500";

function KpiCard({ kpi, loading }: { kpi: IncomeKpiTrend; loading?: boolean }) {
  const Icon = KPI_ICONS[kpi.label as keyof typeof KPI_ICONS] ?? CircleDollarSign;
  const DeltaIcon = kpi.deltaPositive ? TrendingUp : TrendingDown;
  const isZero = !loading && (kpi.value === "0" || kpi.value === "GH₵0");

  return (
    <article className={KPI_CARD_CLASS}>
      <span
        className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/5 opacity-60 blur-2xl transition group-hover:opacity-80"
        aria-hidden
      />

      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold leading-tight tracking-tight text-zinc-50">
            {kpi.label}
          </p>
          <p className="mt-0.5 text-[10px] leading-snug text-zinc-500">{kpi.hint}</p>
        </div>
        <span
          className={cn(
            "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
            KPI_ICON_WRAP,
          )}
        >
          <Icon className={cn("h-3.5 w-3.5", KPI_ICON_COLOR)} strokeWidth={1.75} aria-hidden />
        </span>
      </div>

      <div className="mt-2.5 flex items-end justify-between gap-2">
        {loading ? (
          <span className="inline-block h-6 w-8 animate-pulse rounded bg-[#2a2a2a]" aria-hidden />
        ) : (
          <p
            className={cn(
              "font-display text-[1.35rem] font-normal leading-none tabular-nums text-zinc-50",
              isZero && "text-zinc-600",
            )}
          >
            {kpi.value}
          </p>
        )}
        {!loading && kpi.delta ? (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold",
              kpi.deltaPositive
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-red-500/15 text-red-400",
            )}
          >
            <DeltaIcon className="h-3 w-3" aria-hidden />
            {kpi.delta}
          </span>
        ) : null}
      </div>
    </article>
  );
}

function MonthlyRevenueAreaChart({
  bars,
  currency,
}: {
  bars: MonthlyRevenueBar[];
  currency: string;
}) {
  const width = 480;
  const height = 148;
  const padX = 8;
  const padY = 16;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const max = Math.max(1, ...bars.map((b) => b.value));
  const hasData = bars.some((b) => b.value > 0);

  const points = bars.map((bar, i) => {
    const x = padX + (i / Math.max(1, bars.length - 1)) * innerW;
    const y = padY + innerH - (bar.value / max) * innerH;
    return { x, y, bar };
  });

  const linePath =
    points.length > 0
      ? points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
      : "";

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1]!.x} ${height - 4} L ${points[0]!.x} ${height - 4} Z`
      : "";

  if (!hasData) {
    return (
      <div className="flex h-[148px] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">No revenue yet</p>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          Income you record will appear here month by month.
        </p>
      </div>
    );
  }

  return (
    <div role="img" aria-label="Monthly revenue trend">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="block h-[148px] w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id="income-revenue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#55001f" stopOpacity={0.22} />
            <stop offset="100%" stopColor="#55001f" stopOpacity={0} />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((pct) => {
          const y = padY + innerH * (1 - pct);
          return (
            <line
              key={pct}
              x1={padX}
              y1={y}
              x2={width - padX}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.08}
              className="text-zinc-900 dark:text-zinc-100"
            />
          );
        })}
        {areaPath ? <path d={areaPath} fill="url(#income-revenue-fill)" stroke="none" /> : null}
        {linePath ? (
          <path
            d={linePath}
            fill="none"
            stroke="#55001f"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="dark:stroke-brand-on-dark"
          />
        ) : null}
        {points.map((p) =>
          p.bar.value > 0 ? (
            <circle
              key={p.bar.dateKey}
              cx={p.x}
              cy={p.y}
              r={4}
              fill="#55001f"
              className="dark:fill-brand-on-dark"
            >
              <title>{`${p.bar.label}: ${formatIncomeCompact(p.bar.value, currency)}`}</title>
            </circle>
          ) : null,
        )}
      </svg>
      <div className="mt-2 flex justify-between gap-1 px-0.5">
        {bars.map((bar) => (
          <span
            key={bar.dateKey}
            className={cn(
              "flex-1 text-center text-[9px] font-medium tabular-nums sm:text-[10px]",
              bar.value > 0
                ? "text-brand dark:text-brand-on-dark"
                : "text-zinc-400 dark:text-zinc-500",
            )}
          >
            {bar.label}
          </span>
        ))}
      </div>
    </div>
  );
}

type IncomeAnalyticsPanelProps = {
  summary: IncomeSummary;
  monthlyRevenue: MonthlyRevenueBar[];
  byStatus: IncomeStatusSlice[];
  loading?: boolean;
};

export function IncomeAnalyticsPanel({
  summary,
  monthlyRevenue,
  byStatus,
  loading = false,
}: IncomeAnalyticsPanelProps) {
  const { darkUi } = useDashboardUiTheme();

  const kpiTrends = useMemo(
    () => buildIncomeKpiTrends(summary, monthlyRevenue),
    [summary, monthlyRevenue],
  );

  const statusSlices = useMemo(
    () =>
      byStatus.map((slice) => {
        const colors = INCOME_STATUS_COLORS[slice.key] ?? INCOME_STATUS_COLORS.pending;
        return {
          key: slice.key,
          label: slice.label,
          value: slice.value,
          color: darkUi ? colors.darkColor : colors.color,
        };
      }),
    [byStatus, darkUi],
  );

  const totalStatusValue = statusSlices.reduce((sum, slice) => sum + slice.value, 0);
  const ytdRevenue = monthlyRevenue.reduce((sum, bar) => sum + bar.value, 0);
  const collectionRate =
    summary.invoicedThisMonth > 0
      ? Math.round((summary.collectedThisMonth / summary.invoicedThisMonth) * 100)
      : null;

  const donutSlices = statusSlices.map((s) => {
    const colors = INCOME_STATUS_COLORS[s.key] ?? INCOME_STATUS_COLORS.pending;
    return {
      key: s.key,
      label: s.label,
      value: s.value,
      color: s.color,
      darkColor: colors.darkColor,
    };
  });

  return (
    <section className="space-y-4" aria-label="Income analytics" aria-busy={loading}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={cn(KPI_CARD_CLASS, "animate-pulse")} aria-hidden>
                <div className="h-8 w-24 rounded bg-[#2a2a2a]" />
                <div className="mt-4 h-7 w-16 rounded bg-[#2a2a2a]" />
              </div>
            ))
          : kpiTrends.map((kpi) => <KpiCard key={kpi.label} kpi={kpi} />)}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="dashboard-panel flex min-h-[280px] flex-col">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Revenue trend
              </h3>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Monthly income this year
              </p>
            </div>
            {!loading ? (
              <div className="text-right">
                <p className="font-display text-xl font-medium tabular-nums text-zinc-900 dark:text-zinc-50">
                  {formatIncomeCompact(ytdRevenue, summary.currency)}
                </p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                  year to date
                </p>
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex flex-1 flex-col justify-end">
            {loading ? (
              <div className="h-[148px] animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800/60" />
            ) : (
              <MonthlyRevenueAreaChart bars={monthlyRevenue} currency={summary.currency} />
            )}
          </div>
        </div>

        <div className="dashboard-panel flex min-h-[280px] flex-col">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Payment status
              </h3>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {collectionRate != null
                  ? `${collectionRate}% collected of invoiced this month`
                  : "Breakdown by payment state"}
              </p>
            </div>
          </div>

          <div className="mt-2 flex flex-1 items-center justify-center">
            {loading ? (
              <div className="h-36 w-36 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800/60" />
            ) : (
              <DonutChart
                slices={donutSlices}
                totalLabel="total"
                totalValue={formatIncomeCompact(totalStatusValue, summary.currency)}
                emptyLabel="No payments recorded yet"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
