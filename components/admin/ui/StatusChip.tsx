const STATUS_COLORS: Record<
  string,
  { bg: string; text: string; dot: string }
> = {
  active: {
    bg: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  approved: {
    bg: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  sent: {
    bg: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  pending: {
    bg: "bg-amber-50 text-amber-700 ring-amber-600/20",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  open: {
    bg: "bg-amber-50 text-amber-700 ring-amber-600/20",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  inactive: {
    bg: "bg-red-50 text-red-700 ring-red-600/20",
    text: "text-red-700",
    dot: "bg-red-500",
  },
  rejected: {
    bg: "bg-red-50 text-red-700 ring-red-600/20",
    text: "text-red-700",
    dot: "bg-red-500",
  },
  failed: {
    bg: "bg-red-50 text-red-700 ring-red-600/20",
    text: "text-red-700",
    dot: "bg-red-500",
  },
  skipped: {
    bg: "bg-slate-50 text-slate-600 ring-slate-500/20",
    text: "text-slate-600",
    dot: "bg-slate-400",
  },
  resolved: {
    bg: "bg-primary-light text-primary ring-primary/20",
    text: "text-primary",
    dot: "bg-primary",
  },
};

const DEFAULT_COLORS = {
  bg: "bg-slate-50 text-slate-700 ring-slate-500/20",
  text: "text-slate-700",
  dot: "bg-slate-400",
};

export function StatusChip({ status }: { status: string }) {
  const normalized = status?.toLowerCase() ?? "unknown";
  const colors = STATUS_COLORS[normalized] ?? DEFAULT_COLORS;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${colors.bg}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
      {status}
    </span>
  );
}
