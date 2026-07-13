export type IncomeStatus = "paid" | "pending" | "partial" | "invoiced";

export type IncomeEntry = {
  id: string;
  date: string;
  clientId?: string;
  clientName: string;
  title: string;
  shootType: string;
  totalAmount: number;
  amountPaying: number;
  currency: string;
  status: IncomeStatus;
  bookingId?: string;
};

export type IncomeSummary = {
  collectedThisMonth: number;
  pendingTotal: number;
  invoicedThisMonth: number;
  paidBookingsCount: number;
  currency: string;
};

export type MonthlyRevenueBar = {
  label: string;
  value: number;
  dateKey: string;
};

export const DEMO_INCOME_SUMMARY: IncomeSummary = {
  collectedThisMonth: 24_700,
  pendingTotal: 7_800,
  invoicedThisMonth: 32_500,
  paidBookingsCount: 8,
  currency: "GHS",
};

export const DEMO_MONTHLY_REVENUE: MonthlyRevenueBar[] = [
  { label: "Jan", value: 12_400, dateKey: "2026-01" },
  { label: "Feb", value: 18_200, dateKey: "2026-02" },
  { label: "Mar", value: 15_600, dateKey: "2026-03" },
  { label: "Apr", value: 22_100, dateKey: "2026-04" },
  { label: "May", value: 19_350, dateKey: "2026-05" },
  { label: "Jun", value: 24_700, dateKey: "2026-06" },
];

export const DEMO_YEARLY_REVENUE: MonthlyRevenueBar[] = [
  { label: "Jan", value: 12_400, dateKey: "2026-01" },
  { label: "Feb", value: 18_200, dateKey: "2026-02" },
  { label: "Mar", value: 15_600, dateKey: "2026-03" },
  { label: "Apr", value: 22_100, dateKey: "2026-04" },
  { label: "May", value: 19_350, dateKey: "2026-05" },
  { label: "Jun", value: 24_700, dateKey: "2026-06" },
  { label: "Jul", value: 0, dateKey: "2026-07" },
  { label: "Aug", value: 0, dateKey: "2026-08" },
  { label: "Sep", value: 0, dateKey: "2026-09" },
  { label: "Oct", value: 0, dateKey: "2026-10" },
  { label: "Nov", value: 0, dateKey: "2026-11" },
  { label: "Dec", value: 0, dateKey: "2026-12" },
];

export type IncomeKpiTrend = {
  label: string;
  value: string;
  hint: string;
  delta?: string;
  deltaPositive?: boolean;
  sparkline: number[];
  tone: "emerald" | "amber" | "brand" | "slate";
};

function monthOverMonthDelta(series: number[]): Pick<IncomeKpiTrend, "delta" | "deltaPositive"> {
  if (series.length < 2) return {};
  const prev = series[series.length - 2];
  const curr = series[series.length - 1];
  if (prev <= 0) return {};
  const pct = ((curr - prev) / prev) * 100;
  return {
    delta: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`,
    deltaPositive: pct >= 0,
  };
}

function flatSparkline(value: number, length = 6): number[] {
  return Array.from({ length }, () => value);
}

export function buildIncomeKpiTrends(
  summary: IncomeSummary,
  monthlyRevenue: MonthlyRevenueBar[] = DEMO_MONTHLY_REVENUE,
): IncomeKpiTrend[] {
  const collectedSeries = monthlyRevenue.map((bar) => bar.value);
  const collectedDelta = monthOverMonthDelta(collectedSeries);

  return [
    {
      label: "Collected",
      value: formatIncomeCompact(summary.collectedThisMonth, summary.currency),
      hint: "Received this month",
      ...collectedDelta,
      sparkline: collectedSeries,
      tone: "emerald",
    },
    {
      label: "Pending",
      value: formatIncomeCompact(summary.pendingTotal, summary.currency),
      hint: "Awaiting payment",
      sparkline: flatSparkline(summary.pendingTotal),
      tone: "amber",
    },
    {
      label: "Invoiced",
      value: formatIncomeCompact(summary.invoicedThisMonth, summary.currency),
      hint: "Sent this month",
      sparkline: flatSparkline(summary.invoicedThisMonth),
      tone: "brand",
    },
    {
      label: "Paid bookings",
      value: String(summary.paidBookingsCount),
      hint: "Completed shoots",
      sparkline: flatSparkline(summary.paidBookingsCount),
      tone: "slate",
    },
  ];
}

export const INCOME_STATUS_COLORS: Record<string, { color: string; darkColor: string }> = {
  paid: { color: "#10b981", darkColor: "#34d399" },
  partial: { color: "#f59e0b", darkColor: "#fbbf24" },
  pending: { color: "#94a3b8", darkColor: "#64748b" },
  invoiced: { color: "#55001f", darkColor: "#e899b0" },
};

export const DEMO_INCOME_BY_STATUS = [
  { key: "paid", label: "Paid", value: 18_400, color: "#10b981", darkColor: "#34d399" },
  { key: "partial", label: "Partial", value: 2_500, color: "#f59e0b", darkColor: "#fbbf24" },
  { key: "pending", label: "Pending", value: 7_800, color: "#94a3b8", darkColor: "#64748b" },
  { key: "invoiced", label: "Invoiced", value: 3_800, color: "#55001f", darkColor: "#e899b0" },
] as const;

export const DEMO_INCOME_ENTRIES: IncomeEntry[] = [
  {
    id: "inc-1",
    date: "2026-06-18T14:30:00.000Z",
    clientName: "Amoa & Kofi Mensah",
    title: "Wedding — Labadi Beach",
    shootType: "Wedding",
    totalAmount: 8_500,
    amountPaying: 8_500,
    currency: "GHS",
    status: "paid",
    bookingId: "demo-bk-1",
  },
  {
    id: "inc-2",
    date: "2026-06-15T10:00:00.000Z",
    clientName: "Ama Serwaa",
    title: "Portrait session",
    shootType: "Portrait",
    totalAmount: 1_200,
    amountPaying: 1_200,
    currency: "GHS",
    status: "paid",
    bookingId: "demo-bk-2",
  },
  {
    id: "inc-3",
    date: "2026-06-12T09:00:00.000Z",
    clientName: "TechCorp Ghana",
    title: "Corporate headshots",
    shootType: "Corporate",
    totalAmount: 4_800,
    amountPaying: 0,
    currency: "GHS",
    status: "invoiced",
    bookingId: "demo-bk-3",
  },
  {
    id: "inc-4",
    date: "2026-06-08T16:45:00.000Z",
    clientName: "Efua Mensah",
    title: "Maternity — home studio",
    shootType: "Maternity",
    totalAmount: 5_000,
    amountPaying: 2_500,
    currency: "GHS",
    status: "partial",
    bookingId: "demo-bk-4",
  },
  {
    id: "inc-5",
    date: "2026-06-05T11:20:00.000Z",
    clientName: "Boateng family",
    title: "Family portraits",
    shootType: "Family",
    totalAmount: 3_000,
    amountPaying: 0,
    currency: "GHS",
    status: "invoiced",
    bookingId: "demo-bk-5",
  },
  {
    id: "inc-6",
    date: "2026-06-02T13:00:00.000Z",
    clientName: "Yaw & Akosua",
    title: "Engagement shoot",
    shootType: "Engagement",
    totalAmount: 5_200,
    amountPaying: 5_200,
    currency: "GHS",
    status: "paid",
    bookingId: "demo-bk-6",
  },
  {
    id: "inc-7",
    date: "2026-05-28T08:30:00.000Z",
    clientName: "Nana Adwoa",
    title: "Graduation portraits",
    shootType: "Portrait",
    totalAmount: 950,
    amountPaying: 950,
    currency: "GHS",
    status: "paid",
    bookingId: "demo-bk-7",
  },
  {
    id: "inc-8",
    date: "2026-05-22T15:10:00.000Z",
    clientName: "Kojo Asante",
    title: "Product shoot — skincare line",
    shootType: "Commercial",
    totalAmount: 3_800,
    amountPaying: 0,
    currency: "GHS",
    status: "invoiced",
    bookingId: "demo-bk-8",
  },
];

export function formatIncomeCompact(amount: number, currency = "GHS"): string {
  const code = currency.trim().toUpperCase() || "GHS";
  const prefix = code === "GHS" ? "GH₵" : `${code} `;
  if (Number.isInteger(amount)) {
    return `${prefix}${amount.toLocaleString("en-GH")}`;
  }
  return `${prefix}${amount.toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function incomeStatusLabel(status: IncomeStatus): string {
  switch (status) {
    case "paid":
      return "Paid";
    case "pending":
      return "Pending";
    case "partial":
      return "Partial";
    case "invoiced":
      return "Invoiced";
  }
}

/** Derive payment status from total charged vs amount paid. */
export function deriveIncomeStatus(totalAmount: number, amountPaying: number): IncomeStatus {
  const total = Math.max(0, totalAmount);
  const paid = Math.max(0, amountPaying);
  if (total <= 0) return "pending";
  if (paid <= 0) return "invoiced";
  if (paid >= total) return "paid";
  return "partial";
}

export function incomePaymentPercent(totalAmount: number, amountPaying: number): number {
  if (totalAmount <= 0) return 0;
  return Math.min(100, Math.round((amountPaying / totalAmount) * 1000) / 10);
}
