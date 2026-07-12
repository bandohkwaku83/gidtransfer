"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { BookingCard, BookingDayPill } from "@/components/schedules/booking-card";
import { BookingCategoryFilter } from "@/components/schedules/booking-category-filter";
import { BookingsOverviewStrip } from "@/components/schedules/bookings-overview-strip";
import { BookingInvoiceModal } from "@/components/schedules/booking-invoice-modal";
import { NewBookingModal, type NewBookingDraft } from "@/components/schedules/new-booking-modal";
import {
  formatBookedTimeLabel,
  type BookedShoot,
  timeSortMinutes,
} from "@/components/schedules/booking-types";
import { FALLBACK_SHOOT_TYPES, bookingDotClass } from "@/lib/booking-shoot-types";
import {
  createBooking,
  deleteBooking,
  formatHmToApi12h,
  getBooking,
  getBookingsMeta,
  getBookingsStats,
  getUpcomingBooking,
  listBookings,
  mapApiBookingToBookedShoot,
  updateBooking,
  type ApiBooking,
  type BookingShootTypeMeta,
} from "@/lib/bookings-api";
import { ApiError } from "@/lib/clients-api";
import { cn } from "@/lib/utils";
import {
  DashboardPageHeader,
  dashboardPageHeaderChipClassName,
  dashboardPageHeaderCtaClassName,
  dashboardPageHeaderDescriptionClassName,
  dashboardPageHeaderTitleClassName,
} from "@/components/dashboard/dashboard-page-header";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toIso(y: number, m: number, day: number) {
  return `${y}-${pad2(m + 1)}-${pad2(day)}`;
}

function parseIso(iso: string) {
  const [yy, mm, dd] = iso.split("-").map(Number);
  return { y: yy, m: mm - 1, d: dd };
}

function buildMonthGrid(year: number, month: number): (number | null)[][] {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rows: (number | null)[][] = [];
  let row: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) row.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    row.push(d);
    if (row.length === 7) {
      rows.push(row);
      row = [];
    }
  }
  if (row.length) {
    while (row.length < 7) row.push(null);
    rows.push(row);
  }
  return rows;
}

function isToday(y: number, m: number, day: number) {
  const t = new Date();
  return t.getFullYear() === y && t.getMonth() === m && t.getDate() === day;
}

function todayIsoLocal() {
  const t = new Date();
  return toIso(t.getFullYear(), t.getMonth(), t.getDate());
}

function relativeDayLabel(iso: string): string {
  const today = todayIsoLocal();
  if (iso === today) return "Today";
  const t0 = new Date(today + "T12:00:00").getTime();
  const t1 = new Date(iso + "T12:00:00").getTime();
  const diff = Math.round((t1 - t0) / 86400000);
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1 && diff <= 7) return `In ${diff} days`;
  return new Date(iso + "T12:00:00").toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function shootDotClass(s: BookedShoot): string {
  return bookingDotClass(s.shootColor);
}

export function SchedulesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingFocusId = searchParams.get("booking")?.trim() ?? "";
  const { showToast } = useToast();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");

  const [bookings, setBookings] = useState<BookedShoot[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<BookedShoot | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [invoiceBooking, setInvoiceBooking] = useState<BookedShoot | null>(null);
  const [shootTypesMeta, setShootTypesMeta] = useState<BookingShootTypeMeta[]>([]);
  const [stats, setStats] = useState<{
    thisWeekCount: number;
    thisMonthCount: number;
    todayCount: number;
  } | null>(null);
  const [nextShoot, setNextShoot] = useState<BookedShoot | null>(null);

  const effectiveShootTypes = useMemo(
    () => (shootTypesMeta.length > 0 ? shootTypesMeta : FALLBACK_SHOOT_TYPES),
    [shootTypesMeta],
  );

  const mapBooking = useCallback(
    (b: ApiBooking) => mapApiBookingToBookedShoot(b, effectiveShootTypes),
    [effectiveShootTypes],
  );

  const loadMonth = useCallback(async () => {
    setBookingsLoading(true);
    try {
      const typeParam = categoryFilter === "all" ? "" : categoryFilter;
      const res = await listBookings({
        year: viewYear,
        month: viewMonth + 1,
        type: typeParam,
      });
      setBookings((res?.bookings ?? []).map(mapBooking));
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Could not load bookings.";
      showToast(msg, "error");
      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  }, [viewYear, viewMonth, categoryFilter, mapBooking, showToast]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const meta = await getBookingsMeta();
        if (cancelled) return;
        setShootTypesMeta(meta.shootTypes);
      } catch (e) {
        if (!cancelled) {
          showToast(e instanceof Error ? e.message : "Could not load booking types.", "error");
          setShootTypesMeta([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const refreshStats = useCallback(async () => {
    try {
      const s = await getBookingsStats();
      setStats(s);
    } catch {
      setStats(null);
    }
  }, []);

  const refreshUpcoming = useCallback(async () => {
    try {
      const b = await getUpcomingBooking();
      setNextShoot(b ? mapBooking(b) : null);
    } catch {
      setNextShoot(null);
    }
  }, [mapBooking]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.all([refreshStats(), refreshUpcoming()]);
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshStats, refreshUpcoming]);

  useEffect(() => {
    void loadMonth();
  }, [loadMonth]);

  useEffect(() => {
    if (!bookingFocusId) return;
    let cancelled = false;
    void (async () => {
      try {
        const b = await getBooking(bookingFocusId);
        if (cancelled) return;
        const shoot = mapBooking(b);
        const { y, m, d } = parseIso(shoot.date);
        setViewYear(y);
        setViewMonth(m);
        setSelectedDay(d);
        router.replace("/dashboard/schedules", { scroll: false });
      } catch (e) {
        if (!cancelled) {
          showToast(
            e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Could not open that booking.",
            "error",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingFocusId, mapBooking, router, showToast]);

  const shoots = useMemo(() => {
    return bookings.filter((b) => {
      const { y, m } = parseIso(b.date);
      return y === viewYear && m === viewMonth;
    });
  }, [bookings, viewYear, viewMonth]);

  const byDate = useMemo(() => {
    const map = new Map<string, BookedShoot[]>();
    for (const s of shoots) {
      const list = map.get(s.date) ?? [];
      list.push(s);
      map.set(s.date, list);
    }
    for (const [, list] of map) {
      list.sort((a, b) => timeSortMinutes(a.startTime) - timeSortMinutes(b.startTime));
    }
    return map;
  }, [shoots]);

  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const monthTitle = new Date(viewYear, viewMonth, 1).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  function goPrev() {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }

  function goNext() {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }

  function goToday() {
    const n = new Date();
    setViewYear(n.getFullYear());
    setViewMonth(n.getMonth());
    setSelectedDay(n.getDate());
  }

  const selectedIso =
    selectedDay != null ? toIso(viewYear, viewMonth, selectedDay) : null;
  const selectedShoots = selectedIso ? (byDate.get(selectedIso) ?? []) : [];

  const modalDefaultDate =
    selectedIso ??
    toIso(today.getFullYear(), today.getMonth(), today.getDate());

  const upcomingSorted = useMemo(() => {
    return [...shoots].sort((a, b) => {
      const c = a.date.localeCompare(b.date);
      if (c !== 0) return c;
      return timeSortMinutes(a.startTime) - timeSortMinutes(b.startTime);
    });
  }, [shoots]);

  const todayIso = todayIsoLocal();

  const futureUpcoming = useMemo(() => {
    return upcomingSorted.filter((s) => s.date >= todayIso).slice(0, 10);
  }, [upcomingSorted, todayIso]);

  function bookingPayloadFromDraft(draft: NewBookingDraft) {
    return {
      title: draft.title,
      clientId: draft.clientId,
      date: draft.date,
      shootType: draft.shootCategory,
      start: formatHmToApi12h(draft.startTime),
      end: draft.endTime ? formatHmToApi12h(draft.endTime) : "",
      location: draft.location?.trim() ?? "",
      notes: draft.notes?.trim() ?? "",
      amountCharged:
        draft.amountCharged && draft.amountCharged > 0 ? draft.amountCharged : null,
      currency: draft.currency ?? "GHS",
    };
  }

  function applyBookingToState(mapped: BookedShoot, focusDate: string) {
    setBookings((prev) => {
      const rest = prev.filter((b) => b.id !== mapped.id);
      return [...rest, mapped];
    });
    const { y, m, d } = parseIso(focusDate);
    setViewYear(y);
    setViewMonth(m);
    setSelectedDay(d);
    void loadMonth();
    void refreshStats();
    void refreshUpcoming();
  }

  function openCreateBooking() {
    setEditingBooking(null);
    setBookingModalOpen(true);
  }

  function openEditBooking(shoot: BookedShoot) {
    setEditingBooking(shoot);
    setBookingModalOpen(true);
  }

  function closeBookingModal() {
    setBookingModalOpen(false);
    setEditingBooking(null);
  }

  function openInvoiceForBooking(shoot: BookedShoot) {
    setInvoiceBooking(shoot);
  }

  function closeInvoiceModal() {
    setInvoiceBooking(null);
  }

  async function handleSaveBooking(draft: NewBookingDraft) {
    const { booking } = await createBooking(bookingPayloadFromDraft(draft));
    const mapped = mapBooking(booking);
    applyBookingToState(mapped, draft.date);
    showToast("Booking saved.", "success");
    if (mapped.amountCharged && mapped.amountCharged > 0) {
      setInvoiceBooking(mapped);
    }
  }

  async function handleUpdateBooking(draft: NewBookingDraft) {
    if (!editingBooking) return;
    const { booking } = await updateBooking(
      editingBooking.id,
      bookingPayloadFromDraft(draft),
    );
    const mapped = mapBooking(booking);
    applyBookingToState(mapped, draft.date);
    showToast("Booking updated.", "success");
  }

  const handleDeleteBooking = useCallback(
    async (shoot: BookedShoot) => {
      if (pendingDeleteId) return;
      if (
        !window.confirm(
          `Delete "${shoot.title}"? This cannot be undone.`,
        )
      ) {
        return;
      }
      setPendingDeleteId(shoot.id);
      try {
        await deleteBooking(shoot.id);
        setBookings((prev) => prev.filter((b) => b.id !== shoot.id));
        if (nextShoot?.id === shoot.id) setNextShoot(null);
        showToast("Booking deleted.", "success");
        void loadMonth();
        void refreshStats();
        void refreshUpcoming();
      } catch (e) {
        showToast(
          e instanceof ApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Could not delete booking.",
          "error",
        );
      } finally {
        setPendingDeleteId(null);
      }
    },
    [pendingDeleteId, nextShoot?.id, showToast, loadMonth, refreshStats, refreshUpcoming],
  );

  return (
    <div className="dashboard-page space-y-6">
      <DashboardPageHeader innerClassName="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className={dashboardPageHeaderTitleClassName()}>Bookings</h1>
          <p className={dashboardPageHeaderDescriptionClassName()}>
            Plan shoots, see what&apos;s on the calendar, and keep session details next to each
            client.
          </p>
          {nextShoot ? (
            <p className={dashboardPageHeaderChipClassName("mt-3 max-w-full flex-wrap")}>
              <span className="font-semibold">Next up</span>
              <span className="truncate text-brand-ink/80 dark:text-brand-on-dark/90">
                {nextShoot.title}, {relativeDayLabel(nextShoot.date)},{" "}
                {formatBookedTimeLabel(nextShoot.startTime)}
              </span>
            </p>
          ) : null}
        </div>
        <button type="button" onClick={openCreateBooking} className={dashboardPageHeaderCtaClassName()}>
          <Plus className="h-4 w-4" aria-hidden />
          New booking
        </button>
      </DashboardPageHeader>

      <BookingsOverviewStrip
        weekCount={stats?.thisWeekCount ?? null}
        monthCount={stats?.thisMonthCount ?? shoots.length}
        todayCount={stats?.todayCount ?? 0}
        loading={bookingsLoading && stats == null}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] 2xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] 2xl:gap-8">
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-brand dark:text-brand-on-dark" aria-hidden />
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{monthTitle}</h2>
              {!bookingsLoading ? (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {shoots.length} shoot{shoots.length === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <BookingCategoryFilter
                shootTypes={effectiveShootTypes}
                value={categoryFilter}
                onChange={setCategoryFilter}
                disabled={bookingsLoading}
                showLabel={false}
                className="w-full sm:w-auto"
              />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={goPrev}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={goToday}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {bookingsLoading ? (
            <div
              className="mt-4 grid grid-cols-7 gap-2"
              aria-hidden
            >
              {Array.from({ length: 35 }).map((_, i) => (
                <div
                  key={i}
                  className="min-h-[6.5rem] animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-900"
                />
              ))}
            </div>
          ) : null}

          <div
            className={cn(
              "mt-4 grid grid-cols-7 gap-px rounded-xl bg-zinc-200 dark:bg-zinc-800",
              bookingsLoading && "pointer-events-none opacity-0",
            )}
          >
            {WEEKDAYS.map((wd) => (
              <div
                key={wd}
                className="bg-zinc-50 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
              >
                {wd}
              </div>
            ))}
            {grid.flat().map((day, idx) => {
              if (day == null) {
                return (
                  <div
                    key={`e-${idx}`}
                    className="min-h-[5.5rem] bg-zinc-50/80 dark:bg-zinc-900/40"
                  />
                );
              }
              const iso = toIso(viewYear, viewMonth, day);
              const dayShoots = byDate.get(iso) ?? [];
              const selected = selectedDay === day;
              const todayCell = isToday(viewYear, viewMonth, day);

              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "flex min-h-[6.5rem] flex-col items-stretch border border-transparent bg-white p-1.5 text-left transition hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900/80",
                    selected && "ring-2 ring-inset ring-brand dark:ring-brand-on-dark",
                    todayCell && !selected && "ring-1 ring-inset ring-zinc-300 dark:ring-zinc-600",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                      todayCell
                        ? "bg-brand text-white dark:bg-brand-on-dark dark:text-zinc-950"
                        : "text-zinc-800 dark:text-zinc-100",
                    )}
                  >
                    {day}
                  </span>
                  <div className="mt-1 flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
                    {dayShoots.slice(0, 2).map((s) => (
                      <BookingDayPill key={s.id} shoot={s} />
                    ))}
                    {dayShoots.length > 2 ? (
                      <span className="px-0.5 text-[9px] font-semibold text-zinc-500">
                        +{dayShoots.length - 2} more
                      </span>
                    ) : dayShoots.length === 0 ? (
                      <span className="flex-1" aria-hidden />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {selectedIso
                    ? new Date(selectedIso + "T12:00:00").toLocaleDateString(undefined, {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })
                    : "Pick a day"}
                </h3>
                {selectedIso ? (
                  <p className="mt-0.5 text-[11px] text-zinc-500">
                    {relativeDayLabel(selectedIso)}
                    {selectedShoots.length > 0
                      ? `, ${selectedShoots.length} shoot${selectedShoots.length === 1 ? "" : "s"}`
                      : ""}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={openCreateBooking}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <Plus className="h-3 w-3" aria-hidden />
                Add
              </button>
            </div>
            {selectedShoots.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-6 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
                <CalendarDays className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-600" aria-hidden />
                <p className="mt-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Nothing scheduled
                </p>
                <p className="mt-1 text-xs text-zinc-500">Add a booking for this day.</p>
                <button
                  type="button"
                  onClick={openCreateBooking}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  New booking
                </button>
              </div>
            ) : (
              <ul className="mt-3 space-y-3">
                {selectedShoots.map((s) => (
                  <li key={s.id}>
                    <BookingCard
                      shoot={s}
                      onEdit={openEditBooking}
                      onDelete={handleDeleteBooking}
                      onInvoice={openInvoiceForBooking}
                      deleting={pendingDeleteId === s.id}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Upcoming</h3>
            <p className="mt-0.5 text-[11px] text-zinc-500">From today onward in this month</p>
            {futureUpcoming.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-500">No upcoming shoots this month.</p>
            ) : (
              <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto pr-1 [scrollbar-width:thin]">
                {futureUpcoming.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => {
                        const { y, m, d } = parseIso(s.date);
                        setViewYear(y);
                        setViewMonth(m);
                        setSelectedDay(d);
                      }}
                      className="flex w-full items-start gap-3 rounded-xl border border-transparent px-2 py-2.5 text-left transition hover:border-zinc-200 hover:bg-zinc-50 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/60"
                    >
                      <span
                        className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", shootDotClass(s))}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                          {s.title}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-zinc-500">
                          {s.clientName}
                        </span>
                        <span className="mt-0.5 block text-[11px] font-medium text-brand dark:text-brand-on-dark">
                          {relativeDayLabel(s.date)}, {formatBookedTimeLabel(s.startTime)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      <NewBookingModal
        open={bookingModalOpen}
        onClose={closeBookingModal}
        defaultDate={modalDefaultDate}
        booking={editingBooking}
        shootTypes={shootTypesMeta}
        onSave={editingBooking ? handleUpdateBooking : handleSaveBooking}
      />

      <BookingInvoiceModal
        open={invoiceBooking != null}
        booking={invoiceBooking}
        onClose={closeInvoiceModal}
      />
    </div>
  );
}
