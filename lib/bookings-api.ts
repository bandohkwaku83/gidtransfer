import type { BookedShoot, ShootKind } from "@/components/schedules/booking-types";
import { KIND_META } from "@/components/schedules/booking-types";
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
  shootType: string;
  color?: string;
  startsAt: string;
  endsAt: string | null;
  location?: string;
  description?: string;
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
  shootType: string;
  start: string;
  end: string;
  location: string;
  description: string;
};

export type UpdateBookingBody = Partial<CreateBookingBody>;

export function apiShootTypeToKind(shootType: string): ShootKind {
  const k = shootType.trim().toLowerCase();
  const map: Record<string, ShootKind> = {
    wedding: "wedding",
    christening: "christening",
    portraits: "portraits",
    portrait: "portraits",
    outdoor: "outdoor",
    birthday: "birthday",
    graduation: "graduation",
    commercial: "commercial",
    other: "other",
  };
  return map[k] ?? "other";
}

export function apiColorToDotClass(color?: string): string | null {
  if (!color) return null;
  const c: Record<string, string> = {
    red: "bg-rose-500",
    teal: "bg-teal-500",
    purple: "bg-violet-500",
    green: "bg-emerald-500",
    pink: "bg-fuchsia-500",
    blue: "bg-indigo-500",
    orange: "bg-amber-500",
    sky: "bg-sky-500",
  };
  return c[color.trim().toLowerCase()] ?? null;
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

export function mapApiBookingToBookedShoot(b: ApiBooking): BookedShoot {
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

  return {
    id: b._id,
    title: b.title,
    clientId,
    clientName,
    date,
    startTime,
    endTime,
    location: b.location?.trim() || undefined,
    kind: apiShootTypeToKind(b.shootType),
    description: b.description?.trim() || undefined,
    shootColor: b.color,
  };
}

export function kindToApiShootType(kind: ShootKind): string {
  return KIND_META[kind].label;
}

function filterByShootType(bookings: ApiBooking[], type?: string): ApiBooking[] {
  const t = type?.trim();
  if (!t) return bookings;
  const needle = t.toLowerCase();
  return bookings.filter((b) => b.shootType.trim().toLowerCase() === needle);
}

export async function getBookingsMeta(): Promise<BookingsMetaResponse> {
  return authedJson<BookingsMetaResponse>(
    "/api/bookings/meta",
    { method: "GET" },
    "Failed to load booking types",
    ApiError,
  );
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
  return authedJson<BookingsStats>(
    "/api/bookings/stats",
    { method: "GET" },
    "Failed to load booking stats",
    ApiError,
  );
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

  const res = await authedJson<ListBookingsResponse>(
    `/api/bookings?${q.toString()}`,
    { method: "GET" },
    "Failed to load bookings",
    ApiError,
  );
  const bookings = filterByShootType(res.bookings ?? [], params.type);
  return {
    count: params.type ? bookings.length : (res.count ?? bookings.length),
    bookings,
  };
}

export async function getBooking(id: string): Promise<ApiBooking> {
  const res = await authedJson<{ booking: ApiBooking }>(
    `/api/bookings/${encodeURIComponent(id)}`,
    { method: "GET" },
    "Failed to load booking",
    ApiError,
  );
  return res.booking;
}

export async function getUpcomingBooking(): Promise<ApiBooking | null> {
  const res = await authedJson<{ booking?: ApiBooking | null }>(
    "/api/bookings/upcoming",
    { method: "GET" },
    "Failed to load upcoming booking",
    ApiError,
  );
  return res.booking ?? null;
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
