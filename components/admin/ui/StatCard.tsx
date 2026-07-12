import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

const ACCENT_STYLES = {
  primary: {
    icon: "bg-primary-light text-primary",
    accent: "bg-primary",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-600",
    accent: "bg-emerald-500",
  },
  amber: {
    icon: "bg-amber-50 text-amber-600",
    accent: "bg-amber-500",
  },
  rose: {
    icon: "bg-rose-50 text-rose-600",
    accent: "bg-rose-500",
  },
} as const;

type Accent = keyof typeof ACCENT_STYLES;

export function StatCard({
  title,
  value,
  subtitle,
  href,
  icon: Icon,
  accent = "primary",
  children,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  href?: string;
  icon?: LucideIcon;
  accent?: Accent;
  children?: ReactNode;
}) {
  const styles = ACCENT_STYLES[accent];

  const content = (
    <div className="card group relative overflow-hidden p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
      <div className={`absolute top-0 left-0 h-full w-1 ${styles.accent}`} />

      <div className="flex items-start gap-4 pl-2">
        {Icon && (
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${styles.icon}`}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
          )}
        </div>
        {href && (
          <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-primary" />
        )}
      </div>
      {children}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

const CHART_COLORS = [
  "bg-primary",
  "bg-primary-hover",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-primary-subtle",
];

const CHART_DOT_COLORS = [
  "bg-primary",
  "bg-primary-hover",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-primary-subtle",
];

export function BreakdownChart({
  title,
  data,
}: {
  title: string;
  data: Record<string, number>;
}) {
  const entries = Object.entries(data);
  const total = entries.reduce((sum, [, v]) => sum + v, 0) || 1;

  return (
    <div className="card flex h-full flex-col p-6">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <span className="text-2xl font-bold tabular-nums text-slate-900">
          {total.toLocaleString()}
        </span>
      </div>

      <div className="mt-5 flex-1 space-y-3.5">
        {entries.length === 0 ? (
          <p className="text-sm text-slate-400">No data available</p>
        ) : (
          entries.map(([key, value], i) => {
            const pct = Math.round((value / total) * 100);
            return (
              <div key={key}>
                <div className="mb-2 flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2 font-medium capitalize text-slate-700">
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${CHART_DOT_COLORS[i % CHART_DOT_COLORS.length]}`}
                    />
                    {key.replace(/_/g, " ")}
                  </span>
                  <span className="shrink-0 tabular-nums text-slate-500">
                    {value.toLocaleString()}
                    <span className="ml-1 text-slate-400">({pct}%)</span>
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${CHART_COLORS[i % CHART_COLORS.length]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
