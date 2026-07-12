import type { BookedShoot } from "@/components/schedules/booking-types";
import {
  FALLBACK_SHOOT_TYPES,
  resolveShootCategoryFromApi,
} from "@/lib/booking-shoot-types";
import { ApiError } from "@/lib/clients-api";
import { authedJson } from "@/lib/http";

export type BookingShootTypeMeta = {
  id: string;
  label: string;
  color: string;
};

export type BookingsMetaResponse = {
  shootTypes: BookingShootTypeMeta[];
  legend: BookingShootTypeMeta[];
  clientsListPath?: string;
};

export type BookingsWeekSummary = {
  bookedCount: number;
  weekStartsAt: string;
  weekEndsAt: string;
};

export type BookingsStats = {
  thisWeekCount: number;
  thisMonthCount: number;
  todayCount: number;
};

export type ApiBookingClient = {
  _id: string;
  name: string;
  contact?: string;
  email?: string;
  location?: string;
} | null;

export type ApiBooking = {
  _id: string;
  title: string;
  client: ApiBookingClient;
  /** Display label (e.g. "Wedding"). */
  shootType: string;
  /** Category slug (e.g. "wedding"). */
  category?: string;
  color?: string;
  startsAt: string;
  endsAt: string | null;
  location?: string;
  notes?: string;
  description?: string;
  amountCharged?: number;
  currency?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ListBookingsResponse = {
  count?: number;
  bookings: ApiBooking[];
};

export type CreateBookingBody = {
  title: string;
  clientId: string;
  date: string;
  /** Category id or label — API accepts both. */
  shootType: string;
  start: string;
  end: string;
  location: string;
  notes?: string;
  description?: string;
  amountCharged?: number | null;
  currency?: string;
};

export type UpdateBookingBody = Partial<CreateBookingBody>;

const BOOKING_COLOR_DOT: Record<string, string> = {
  red: "bg-rose-500",
  teal: "bg-teal-500",
  purple: "bg-violet-500",
  green: "bg-emerald-500",
  pink: "bg-fuchsia-500",
  blue: "bg-indigo-500",
  orange: "bg-amber-500",
  sky: "bg-sky-500",
  amber: "bg-amber-500",
  indigo: "bg-indigo-500",
  rose: "bg-rose-500",
  cyan: "bg-cyan-500",
  lime: "bg-lime-500",
  violet: "bg-violet-500",
  fuchsia: "bg-fuchsia-500",
  emerald: "bg-emerald-500",
};

export function apiColorToDotClass(color?: string): string | null {
  if (!color) return null;
  return BOOKING_COLOR_DOT[color.trim().toLowerCase()] ?? null;
}

export function formatHmToApi12h(hm: string): string {
  const s = hm.trim();
  if (/am|pm/i.test(s)) return s;
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (!m) return s;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (Number.isNaN(h) || Number.isNaN(min)) return s;
  const d = new Date(2000, 0, 1, h, min, 0, 0);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function readAmountCharged(raw: unknown): number | undefined {
  if (raw == null || raw === "") return undefined;
  const n =
    typeof raw === "number"
      ? raw
      : Number(String(raw).trim().replace(/,/g, ""));
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}

export function formatBookingAmount(
  amount?: number,
  currency = "GHS",
): string | null {
  if (amount == null || !Number.isFinite(amount) || amount <= 0) return null;
  const code = currency.trim().toUpperCase() || "GHS";
  const prefix = code === "GHS" ? "GH₵" : `${code} `;
  return `${prefix}${amount.toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** @deprecated Use {@link formatBookingAmount} */
export function formatBookingAmountGhs(amount?: number): string | null {
  return formatBookingAmount(amount, "GHS");
}

export function mapApiBookingToBookedShoot(
  b: ApiBooking,
  shootTypes: BookingShootTypeMeta[] = FALLBACK_SHOOT_TYPES,
): BookedShoot {
  const client = b.client;
  const clientId = client?._id ?? "";
  const clientName = client?.name?.trim() || "Unknown client";

  const start = new Date(b.startsAt);
  const y = start.getFullYear();
  const mo = start.getMonth();
  const day = start.getDate();
  const date = `${y}-${pad2(mo + 1)}-${pad2(day)}`;
  const startTime = `${pad2(start.getHours())}:${pad2(start.getMinutes())}`;

  let endTime: string | undefined;
  if (b.endsAt) {
    const end = new Date(b.endsAt);
    endTime = `${pad2(end.getHours())}:${pad2(end.getMinutes())}`;
  }

  const resolved = resolveShootCategoryFromApi(
    { category: b.category, shootType: b.shootType },
    shootTypes,
  );
  const notes = (b.notes ?? b.description ?? "").trim();

  return {
    id: b._id,
    title: b.title,
    clientId,
    clientName,
    date,
    startTime,
    endTime,
    location: b.location?.trim() || undefined,
    shootCategory: resolved.category,
    shootTypeLabel: resolved.label,
    notes: notes || undefined,
    currency: (b.currency ?? "GHS").trim() || "GHS",
    amountCharged:
      readAmountCharged(b.amountCharged) ??
      readAmountCharged((b as { amount_charged?: unknown }).amount_charged),
    shootColor: b.color ?? resolved.color,
  };
}

function bookingMatchesCategoryFilter(b: ApiBooking, categoryId: string): boolean {
  const needle = categoryId.trim().toLowerCase();
  const cat = b.category?.trim().toLowerCase();
  if (cat && cat === needle) return true;
  if (b.shootType.trim().toLowerCase() === needle) return true;
  return false;
}

function filterByShootType(bookings: ApiBooking[], type?: string): ApiBooking[] {
  const t = type?.trim();
  if (!t) return bookings;
  return bookings.filter((b) => bookingMatchesCategoryFilter(b, t));
}

export async function getBookingsMeta(): Promise<BookingsMetaResponse> {
  const res = await authedJson<BookingsMetaResponse | null>(
    "/api/bookings/meta",
    { method: "GET" },
    "Failed to load booking types",
    ApiError,
  );
  const shootTypes = res?.shootTypes ?? [];
  return {
    shootTypes,
    legend: res?.legend ?? shootTypes,
    clientsListPath: res?.clientsListPath,
  };
}

export async function getBookingsWeekSummary(): Promise<BookingsWeekSummary> {
  return authedJson<BookingsWeekSummary>(
    "/api/bookings/week-summary",
    { method: "GET" },
    "Failed to load week summary",
    ApiError,
  );
}

export async function getBookingsStats(): Promise<BookingsStats> {
  const res = await authedJson<BookingsStats | null>(
    "/api/bookings/stats",
    { method: "GET" },
    "Failed to load booking stats",
    ApiError,
  );
  return {
    thisWeekCount: res?.thisWeekCount ?? 0,
    thisMonthCount: res?.thisMonthCount ?? 0,
    todayCount: res?.todayCount ?? 0,
  };
}

export async function listBookings(params: {
  year: number;
  month: number;
  type?: string;
  from?: string;
  to?: string;
}): Promise<ListBookingsResponse> {
  const q = new URLSearchParams({
    year: String(params.year),
    month: String(params.month),
  });
  if (params.from?.trim()) q.set("from", params.from.trim());
  if (params.to?.trim()) q.set("to", params.to.trim());

  const res = await authedJson<ListBookingsResponse | null>(
    `/api/bookings?${q.toString()}`,
    { method: "GET" },
    "Failed to load bookings",
    ApiError,
  );
  const bookings = filterByShootType(res?.bookings ?? [], params.type);
  return {
    count: params.type ? bookings.length : (res?.count ?? bookings.length),
    bookings,
  };
}

export async function getBooking(id: string): Promise<ApiBooking> {
  const res = await authedJson<{ booking?: ApiBooking | null } | null>(
    `/api/bookings/${encodeURIComponent(id)}`,
    { method: "GET" },
    "Failed to load booking",
    ApiError,
  );
  const booking = res?.booking;
  if (!booking) {
    throw new ApiError("Booking not found", 404, res);
  }
  return booking;
}

export async function getUpcomingBooking(): Promise<ApiBooking | null> {
  const res = await authedJson<{ booking?: ApiBooking | null } | null>(
    "/api/bookings/upcoming",
    { method: "GET" },
    "Failed to load upcoming booking",
    ApiError,
  );
  return res?.booking ?? null;
}

export async function createBooking(
  input: CreateBookingBody,
): Promise<{ message?: string; booking: ApiBooking }> {
  return authedJson<{ message?: string; booking: ApiBooking }>(
    "/api/bookings",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    "Failed to create booking",
    ApiError,
  );
}

export async function updateBooking(
  id: string,
  input: UpdateBookingBody,
): Promise<{ message?: string; booking: ApiBooking }> {
  return authedJson<{ message?: string; booking: ApiBooking }>(
    `/api/bookings/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: JSON.stringify(input),
    },
    "Failed to update booking",
    ApiError,
  );
}

export async function deleteBooking(id: string): Promise<void> {
  await authedJson<{ booking?: ApiBooking; message?: string }>(
    `/api/bookings/${encodeURIComponent(id)}`,
    { method: "DELETE" },
    "Failed to delete booking",
    ApiError,
  );
}
