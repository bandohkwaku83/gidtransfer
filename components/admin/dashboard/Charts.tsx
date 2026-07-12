import Link from "next/link";
import type { LucideIcon } from "lucide-react";

const CHART_COLORS = [
  "#5e001e",
  "#8c1f47",
  "#c990a0",
  "#10b981",
  "#f59e0b",
  "#64748b",
];

const CHART_COLORS_LIGHT = [
  "#f5e0e8",
  "#fdf2f5",
  "#c990a0",
  "#d1fae5",
  "#fef3c7",
  "#f1f5f9",
];

function formatLabel(key: string): string {
  return key.replace(/_/g, " ");
}

const KPI_VARIANTS = {
  primary: {
    icon: "bg-primary/10 text-primary ring-primary/10",
    corner: "from-primary/15",
    line: "from-primary via-primary/40 to-transparent",
  },
  rose: {
    icon: "bg-rose-50 text-rose-600 ring-rose-100",
    corner: "from-rose-100",
    line: "from-rose-500 via-rose-300 to-transparent",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    corner: "from-emerald-100",
    line: "from-emerald-500 via-emerald-300 to-transparent",
  },
  amber: {
    icon: "bg-amber-50 text-amber-600 ring-amber-100",
    corner: "from-amber-100",
    line: "from-amber-500 via-amber-300 to-transparent",
  },
} as const;

export function KpiTile({
  label,
  value,
  icon: Icon,
  suffix,
  hint,
  variant = "primary",
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  suffix?: string;
  hint?: string;
  variant?: keyof typeof KPI_VARIANTS;
}) {
  const styles = KPI_VARIANTS[variant];

  return (
    <div className="group relative h-[8.75rem] overflow-hidden rounded-2xl border border-slate-100/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
      <div
        className={`absolute top-0 right-0 h-14 w-14 bg-gradient-to-bl ${styles.corner} to-transparent opacity-70`}
      />
      <div
        className={`absolute top-0 right-0 left-0 h-px bg-gradient-to-r ${styles.line}`}
      />

      <div className="relative flex h-full flex-col gap-4">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-4 ${styles.icon}`}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="mt-auto">
          <p className="text-xs text-slate-500">{label}</p>
          <p className="mt-1 text-xl font-bold tracking-tight tabular-nums text-slate-900">
            {typeof value === "number" ? value.toLocaleString() : value}
            {suffix}
          </p>
          {hint && (
            <p className="mt-1.5 text-[11px] text-slate-400">{hint}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function OverviewCard({
  photographers,
  support,
}: {
  photographers: {
    total: number;
    active: number;
    onboarded: number;
    emailVerified: number;
  };
  support: { openIssueReports: number };
}) {
  const { total, active, onboarded, emailVerified } = photographers;
  const openTickets = support.openIssueReports;

  const healthRows = [
    {
      label: "Active accounts",
      value: active,
      pct: total > 0 ? Math.round((active / total) * 100) : 0,
    },
    {
      label: "Onboarded",
      value: onboarded,
      pct: total > 0 ? Math.round((onboarded / total) * 100) : 0,
    },
    {
      label: "Email verified",
      value: emailVerified,
      pct: total > 0 ? Math.round((emailVerified / total) * 100) : 0,
    },
  ];

  return (
    <div className="card flex h-full overflow-hidden p-0">
      {/* Featured panel */}
      <div className="flex w-[38%] min-w-[120px] flex-col justify-between bg-primary p-5 text-white">
        <div>
          <p className="text-[11px] font-medium tracking-wide text-primary-subtle uppercase">
            Photographers
          </p>
          <p className="mt-3 text-4xl font-bold tabular-nums leading-none">
            {total.toLocaleString()}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-white/70">
            {active.toLocaleString()} active on the platform
          </p>
        </div>

        <div className="mt-4 border-t border-white/15 pt-4">
          <p className="text-[10px] font-medium tracking-wide text-primary-subtle uppercase">
            Support
          </p>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-white/80">Open tickets</span>
            <span className="font-semibold">{openTickets}</span>
          </div>
        </div>
      </div>

      {/* Health panel */}
      <div className="flex flex-1 flex-col justify-center gap-3 px-5 py-4">
        <p className="text-sm font-semibold text-slate-900">Account health</p>

        <div className="space-y-3.5">
          {healthRows.map((row, i) => (
            <div key={row.label}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-slate-500">{row.label}</span>
                <span className="font-semibold tabular-nums text-slate-900">
                  {row.value.toLocaleString()}
                  <span className="ml-1 font-normal text-slate-400">
                    ({row.pct}%)
                  </span>
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${row.pct}%`,
                    backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HorizontalBarChart({
  title,
  data,
  legend,
}: {
  title: string;
  data: Record<string, number>;
  legend?: { label: string; color: string }[];
}) {
  const entries = Object.entries(data).filter(([, v]) => v > 0);
  const max = Math.max(...entries.map(([, v]) => v), 1);

  if (entries.length === 0) {
    return (
      <div className="card flex h-full flex-col p-6">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="mt-8 text-center text-sm text-slate-400">No data</p>
      </div>
    );
  }

  return (
    <div className="card flex h-full flex-col p-6">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>

      {legend && (
        <div className="mt-4 flex flex-wrap gap-4">
          {legend.map((item) => (
            <span
              key={item.label}
              className="flex items-center gap-1.5 text-xs text-slate-600"
            >
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </span>
          ))}
        </div>
      )}

      <div className="mt-6 flex-1 space-y-3">
        {entries.map(([key, value], i) => (
          <div key={key} className="flex items-center gap-3">
            <span className="w-24 shrink-0 truncate text-right text-xs capitalize text-slate-500">
              {formatLabel(key)}
            </span>
            <div className="relative flex-1">
              <div className="h-7 overflow-hidden rounded-md bg-slate-50">
                <div
                  className="flex h-full items-center rounded-md px-2 transition-all duration-500"
                  style={{
                    width: `${Math.max((value / max) * 100, 8)}%`,
                    backgroundColor:
                      CHART_COLORS_LIGHT[i % CHART_COLORS_LIGHT.length],
                    borderLeft: `3px solid ${CHART_COLORS[i % CHART_COLORS.length]}`,
                  }}
                >
                  <span className="text-xs font-semibold tabular-nums text-slate-700">
                    {value.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RadarChart({
  title,
  datasets,
}: {
  title: string;
  datasets: { label: string; data: Record<string, number>; color: string }[];
}) {
  const allKeys = [
    ...new Set(datasets.flatMap((d) => Object.keys(d.data))),
  ].filter((k) => datasets.some((d) => (d.data[k] ?? 0) > 0));

  if (allKeys.length < 3) {
    return (
      <div className="card flex h-full flex-col p-6">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="mt-8 text-center text-sm text-slate-400">
          Not enough data
        </p>
      </div>
    );
  }

  const size = 220;
  const center = size / 2;
  const radius = 72;
  const levels = 4;
  const angleStep = (2 * Math.PI) / allKeys.length;

  const getPoint = (index: number, value: number, max: number) => {
    const r = max > 0 ? (value / max) * radius : 0;
    const angle = index * angleStep - Math.PI / 2;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const globalMax = Math.max(
    ...datasets.flatMap((d) => allKeys.map((k) => d.data[k] ?? 0)),
    1,
  );

  return (
    <div className="card flex h-full flex-col p-6">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>

      <div className="mt-4 flex flex-1 flex-col items-center justify-center">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="h-52 w-52"
          aria-hidden
        >
          {Array.from({ length: levels }).map((_, level) => {
            const r = ((level + 1) / levels) * radius;
            const points = allKeys
              .map((_, i) => {
                const angle = i * angleStep - Math.PI / 2;
                return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
              })
              .join(" ");
            return (
              <polygon
                key={level}
                points={points}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="1"
              />
            );
          })}

          {allKeys.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={center + radius * Math.cos(angle)}
                y2={center + radius * Math.sin(angle)}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
            );
          })}

          {datasets.map((dataset) => {
            const points = allKeys
              .map((key, i) => {
                const p = getPoint(i, dataset.data[key] ?? 0, globalMax);
                return `${p.x},${p.y}`;
              })
              .join(" ");
            return (
              <polygon
                key={dataset.label}
                points={points}
                fill={`${dataset.color}33`}
                stroke={dataset.color}
                strokeWidth="2"
              />
            );
          })}
        </svg>

        <div className="mt-2 flex flex-wrap justify-center gap-4">
          {datasets.map((d) => (
            <span
              key={d.label}
              className="flex items-center gap-1.5 text-xs text-slate-600"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: d.color }}
              />
              {d.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PhotographersTable({
  photographers,
}: {
  photographers: {
    userId: string;
    companyName: string;
    planName: string;
    subscriptionStatus: string;
    isActive: boolean;
  }[];
}) {
  return (
    <div className="card flex h-full flex-col p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">Photographers</h3>
        <Link
          href="/admin/photographers"
          className="text-xs font-medium text-primary hover:text-primary-hover"
        >
          View all
        </Link>
      </div>

      <div className="mt-4 flex-1 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
              <th className="pb-3 pr-4">Name</th>
              <th className="pb-3 pr-4">Plan</th>
              <th className="pb-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {photographers.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-slate-400">
                  No photographers yet
                </td>
              </tr>
            ) : (
              photographers.map((p) => (
                <tr key={p.userId} className="group">
                  <td className="py-3 pr-4">
                    <Link
                      href={`/admin/photographers/${p.userId}`}
                      className="flex items-center gap-2.5"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-semibold text-primary">
                        {p.companyName.charAt(0).toUpperCase()}
                      </span>
                      <span className="truncate font-medium text-slate-900 group-hover:text-primary">
                        {p.companyName}
                      </span>
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{p.planName || "—"}</td>
                  <td className="py-3">
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                        p.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
