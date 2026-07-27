import { ApiError } from "@/lib/clients-api";
import {
  deriveIncomeStatus,
  type IncomeEntry,
  type IncomeStatus,
  type IncomeSummary,
  type MonthlyRevenueBar,
} from "@/lib/income-demo";
import { authedJson, HttpError } from "@/lib/http";

export class IncomeApiError extends HttpError {}

type RawIncomeEntry = {
  _id?: string;
  id?: string;
  date: string;
  clientId?: string;
  client?: { _id?: string; name?: string } | null;
  clientName?: string;
  title: string;
  shootType: string;
  totalAmount: number;
  amountPaying: number;
  currency?: string;
  status?: IncomeStatus;
  bookingId?: string;
  source?: "income" | "booking" | string;
};

export type IncomeStatusSlice = {
  key: string;
  label: string;
  value: number;
};

export type IncomeSummaryResponse = {
  summary: IncomeSummary;
  monthlyRevenue: MonthlyRevenueBar[];
  byStatus: IncomeStatusSlice[];
};

export type ListIncomeResponse = {
  count: number;
  entries: IncomeEntry[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
};

export const EMPTY_INCOME_SUMMARY: IncomeSummary = {
  collectedThisMonth: 0,
  pendingTotal: 0,
  invoicedThisMonth: 0,
  paidBookingsCount: 0,
  currency: "GHS",
};

export const EMPTY_INCOME_SUMMARY_RESPONSE: IncomeSummaryResponse = {
  summary: EMPTY_INCOME_SUMMARY,
  monthlyRevenue: [],
  byStatus: [],
};

export type CreateIncomeBody = {
  date: string;
  clientId?: string;
  title: string;
  shootType: string;
  totalAmount: number;
  amountPaying: number;
  currency: string;
  bookingId?: string;
};

export type UpdateIncomeBody = Partial<CreateIncomeBody>;

function readId(raw: RawIncomeEntry): string {
  const id = raw._id ?? raw.id;
  if (!id) throw new IncomeApiError("Income entry is missing an id.", 500, raw);
  return String(id);
}

export function mapApiIncomeToEntry(raw: RawIncomeEntry): IncomeEntry {
  const totalAmount = Number(raw.totalAmount) || 0;
  const amountPaying = Number(raw.amountPaying) || 0;
  const status = raw.status ?? deriveIncomeStatus(totalAmount, amountPaying);
  const clientName =
    raw.clientName?.trim() ||
    raw.client?.name?.trim() ||
    "Unknown client";

  return {
    id: readId(raw),
    date: raw.date,
    clientId: raw.clientId ?? raw.client?._id,
    clientName,
    title: raw.title?.trim() || "",
    shootType: raw.shootType?.trim() || "",
    totalAmount,
    amountPaying,
    currency: (raw.currency ?? "GHS").trim() || "GHS",
    status,
    bookingId: raw.bookingId?.trim() || undefined,
  };
}

function unwrapEntryResponse(body: unknown): IncomeEntry {
  if (!body || typeof body !== "object") {
    throw new IncomeApiError("Invalid income response", 500, body);
  }
  const record = body as Record<string, unknown>;
  const raw =
    (record.entry as RawIncomeEntry | undefined) ??
    (record.income as RawIncomeEntry | undefined) ??
    ("_id" in record || "id" in record ? (record as unknown as RawIncomeEntry) : undefined);
  if (!raw) {
    throw new IncomeApiError("Invalid income response", 500, body);
  }
  return mapApiIncomeToEntry(raw);
}

export async function listIncome(params: { year: number }): Promise<ListIncomeResponse> {
  const res = await authedJson<{
    count?: number;
    entries?: RawIncomeEntry[];
    pagination?: ListIncomeResponse["pagination"];
  } | null>(
    `/api/income?year=${params.year}`,
    { method: "GET" },
    "Failed to load income",
    IncomeApiError,
  );

  const rawEntries =
    res && typeof res === "object" && Array.isArray(res.entries) ? res.entries : [];
  const entries = rawEntries
    .filter((raw) => raw._id || raw.id)
    .map(mapApiIncomeToEntry);

  return {
    count:
      res && typeof res === "object" && typeof res.count === "number"
        ? res.count
        : entries.length,
    entries,
    pagination:
      res && typeof res === "object" && res.pagination && typeof res.pagination === "object"
        ? res.pagination
        : undefined,
  };
}

export async function getIncomeSummary(params: {
  year: number;
}): Promise<IncomeSummaryResponse> {
  const res = await authedJson<IncomeSummaryResponse | null>(
    `/api/income/summary?year=${params.year}`,
    { method: "GET" },
    "Failed to load income summary",
    IncomeApiError,
  );

  if (!res || typeof res !== "object") {
    return EMPTY_INCOME_SUMMARY_RESPONSE;
  }

  const rawSummary = res.summary;
  const summary: IncomeSummary =
    rawSummary && typeof rawSummary === "object"
      ? {
          collectedThisMonth: Number(rawSummary.collectedThisMonth) || 0,
          pendingTotal: Number(rawSummary.pendingTotal) || 0,
          invoicedThisMonth: Number(rawSummary.invoicedThisMonth) || 0,
          paidBookingsCount: Number(rawSummary.paidBookingsCount) || 0,
          currency: (rawSummary.currency ?? "GHS").trim() || "GHS",
        }
      : EMPTY_INCOME_SUMMARY;

  return {
    summary,
    monthlyRevenue: Array.isArray(res.monthlyRevenue) ? res.monthlyRevenue : [],
    byStatus: Array.isArray(res.byStatus) ? res.byStatus : [],
  };
}

export async function getIncome(id: string): Promise<IncomeEntry> {
  const res = await authedJson<{ entry?: RawIncomeEntry; income?: RawIncomeEntry }>(
    `/api/income/${encodeURIComponent(id)}`,
    { method: "GET" },
    "Failed to load income entry",
    IncomeApiError,
  );
  return unwrapEntryResponse(res.entry ?? res.income ?? res);
}

export async function createIncome(
  input: CreateIncomeBody,
): Promise<{ message?: string; entry: IncomeEntry }> {
  const body: Record<string, unknown> = {
    date: input.date.trim(),
    title: input.title.trim(),
    shootType: input.shootType.trim(),
    totalAmount: input.totalAmount,
    amountPaying: input.amountPaying,
    currency: input.currency.trim() || "GHS",
  };
  if (input.clientId?.trim()) body.clientId = input.clientId.trim();
  if (input.bookingId?.trim()) body.bookingId = input.bookingId.trim();

  const res = await authedJson<{ message?: string; entry?: RawIncomeEntry; income?: RawIncomeEntry }>(
    "/api/income",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    "Failed to create income",
    IncomeApiError,
  );
  return { message: res.message, entry: unwrapEntryResponse(res) };
}

export async function updateIncome(
  id: string,
  input: UpdateIncomeBody,
): Promise<{ message?: string; entry: IncomeEntry }> {
  const body: Record<string, unknown> = {};
  if (input.date !== undefined) body.date = input.date.trim();
  if (input.title !== undefined) body.title = input.title.trim();
  if (input.shootType !== undefined) body.shootType = input.shootType.trim();
  if (input.totalAmount !== undefined) body.totalAmount = input.totalAmount;
  if (input.amountPaying !== undefined) body.amountPaying = input.amountPaying;
  if (input.currency !== undefined) body.currency = input.currency.trim() || "GHS";
  if (input.clientId !== undefined) body.clientId = input.clientId.trim();
  if (input.bookingId !== undefined) body.bookingId = input.bookingId.trim();

  const res = await authedJson<{ message?: string; entry?: RawIncomeEntry; income?: RawIncomeEntry }>(
    `/api/income/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: JSON.stringify(body),
    },
    "Failed to update income",
    IncomeApiError,
  );
  return { message: res.message, entry: unwrapEntryResponse(res) };
}

export async function deleteIncome(id: string): Promise<void> {
  await authedJson<{ message?: string }>(
    `/api/income/${encodeURIComponent(id)}`,
    { method: "DELETE" },
    "Failed to delete income",
    ApiError,
  );
}

export type RecordBookingInvoiceBody = {
  issuedOn?: string;
  addOns?: { label: string; amount: number }[];
  amountPaying?: number;
};

export async function recordBookingInvoice(
  bookingId: string,
  input: RecordBookingInvoiceBody = {},
): Promise<{ message?: string; invoiceNumber?: string; entry: IncomeEntry }> {
  const body: Record<string, unknown> = {};
  if (input.issuedOn?.trim()) body.issuedOn = input.issuedOn.trim();
  if (input.addOns?.length) body.addOns = input.addOns;
  if (input.amountPaying !== undefined) body.amountPaying = input.amountPaying;

  const res = await authedJson<{
    message?: string;
    invoiceNumber?: string;
    entry?: RawIncomeEntry;
    income?: RawIncomeEntry;
  }>(
    `/api/bookings/${encodeURIComponent(bookingId)}/invoice`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    "Failed to record invoice in income",
    IncomeApiError,
  );

  return {
    message: res.message,
    invoiceNumber: res.invoiceNumber,
    entry: unwrapEntryResponse(res),
  };
}
