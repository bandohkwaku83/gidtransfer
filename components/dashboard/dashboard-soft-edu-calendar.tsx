"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Popover } from "antd";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export type CalendarShoot = {
  id: string;
  title: string;
  startsAt: string;
  clientName: string;
  location?: string;
};

type DashboardSoftEduCalendarProps = {
  /** Shoots to mark on the calendar (tap a marked day for details) */
  shoots?: CalendarShoot[];
  /** Optional server “today” ISO for consistency */
  serverDateIso?: string | null;
};

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function toKey(y: number, m: number, day: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Local calendar day for an ISO timestamp (avoids UTC slice mismatches). */
function localDateKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    const raw = iso.trim().slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "";
  }
  return toKey(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatShootTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDayHeading(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d) return key;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function ShootPopoverContent({
  dateKey,
  shoots,
}: {
  dateKey: string;
  shoots: CalendarShoot[];
}) {
  return (
    <div className="w-[220px] max-w-[70vw]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand dark:text-brand-on-dark">
        {formatDayHeading(dateKey)}
      </p>
      <ul className="mt-2.5 space-y-3">
        {shoots.map((shoot) => (
          <li key={shoot.id} className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {shoot.title}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              {formatShootTime(shoot.startsAt)}
              {shoot.clientName ? ` · ${shoot.clientName}` : ""}
            </p>
            {shoot.location ? (
              <p className="mt-1 flex items-start gap-1 text-[11px] text-zinc-500">
                <MapPin
                  className="mt-px h-3 w-3 shrink-0 text-brand dark:text-brand-on-dark"
                  aria-hidden
                />
                <span className="min-w-0 leading-snug">{shoot.location}</span>
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      <Link
        href="/dashboard/schedules"
        className="mt-3 inline-block text-[11px] font-semibold uppercase tracking-[0.1em] text-brand transition hover:text-brand-hover dark:text-brand-on-dark"
      >
        Open bookings
      </Link>
    </div>
  );
}

export function DashboardSoftEduCalendar({
  shoots = [],
  serverDateIso,
}: DashboardSoftEduCalendarProps) {
  const today = useMemo(() => {
    if (serverDateIso) {
      const d = new Date(serverDateIso);
      if (!Number.isNaN(d.getTime())) return d;
    }
    return new Date();
  }, [serverDateIso]);

  const [cursor, setCursor] = useState(() => startOfMonth(today));
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [popoverPlacement, setPopoverPlacement] = useState<"bottom" | "right">("bottom");

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const sync = () => setPopoverPlacement(mq.matches ? "right" : "bottom");
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const shootsByDate = useMemo(() => {
    const map = new Map<string, CalendarShoot[]>();
    for (const shoot of shoots) {
      const key = localDateKey(shoot.startsAt);
      if (!key) continue;
      const list = map.get(key) ?? [];
      list.push(shoot);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    }
    return map;
  }, [shoots]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDow = startOfMonth(cursor).getDay();
  const totalDays = daysInMonth(cursor);
  const label = cursor
    .toLocaleDateString(undefined, { month: "long", year: "numeric" })
    .toUpperCase();

  const cells: Array<{ day: number | null; key: string }> = [];
  for (let i = 0; i < firstDow; i += 1) cells.push({ day: null, key: `pad-${i}` });
  for (let day = 1; day <= totalDays; day += 1) {
    cells.push({ day, key: toKey(year, month, day) });
  }

  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <section className="relative flex h-full flex-col rounded-[1.25rem] bg-white p-4 dark:bg-zinc-950 sm:rounded-[1.35rem] sm:p-5 lg:p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="min-w-0 truncate text-xs font-semibold tracking-wide text-zinc-900 dark:text-zinc-50 sm:text-sm">
          {label}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setOpenKey(null);
              setCursor(new Date(year, month - 1, 1));
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => {
              setOpenKey(null);
              setCursor(new Date(year, month + 1, 1));
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <p className="mt-1 text-[11px] text-zinc-400 sm:text-xs">Tap a wine-marked day for shoot details</p>

      <div className="mt-3 grid grid-cols-7 gap-y-1.5 text-center sm:mt-4 sm:gap-y-2">
        {WEEKDAYS.map((d, i) => (
          <span key={`${d}-${i}`} className="text-[10px] font-semibold text-zinc-400">
            {d}
          </span>
        ))}
        {cells.map((cell) => {
          if (cell.day == null) {
            return <span key={cell.key} className="h-9" />;
          }
          const dayShoots = shootsByDate.get(cell.key) ?? [];
          const hasShoot = dayShoots.length > 0;
          const isToday = cell.key === todayKey;
          const isOpen = openKey === cell.key;

          const dayNumber = (
            <span
              className={cn(
                "relative z-[1] text-xs font-medium tabular-nums",
                isOpen || (hasShoot && isToday)
                  ? "font-semibold text-brand dark:text-brand-on-dark"
                  : isToday
                    ? "font-semibold text-zinc-950 dark:text-white"
                    : hasShoot
                      ? "font-semibold text-brand dark:text-brand-on-dark"
                      : "text-zinc-600 dark:text-zinc-300",
              )}
            >
              {cell.day}
            </span>
          );

          if (!hasShoot) {
            return (
              <span key={cell.key} className="relative flex h-9 items-center justify-center">
                {isToday ? (
                  <span
                    className="absolute inset-[3px] rounded-full border border-zinc-300 dark:border-zinc-600"
                    aria-hidden
                  />
                ) : null}
                {dayNumber}
              </span>
            );
          }

          return (
            <span key={cell.key} className="relative flex h-9 items-center justify-center">
              <Popover
                trigger="click"
                placement={popoverPlacement}
                open={isOpen}
                onOpenChange={(next) => setOpenKey(next ? cell.key : null)}
                content={<ShootPopoverContent dateKey={cell.key} shoots={dayShoots} />}
                arrow
              >
                <button
                  type="button"
                  className="relative flex h-9 w-9 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  aria-label={`${dayShoots.length} shoot${dayShoots.length === 1 ? "" : "s"} on ${formatDayHeading(cell.key)}`}
                >
                  <span
                    className={cn(
                      "absolute inset-[3px] rounded-full border-2 border-brand dark:border-brand-on-dark",
                      isOpen && "bg-brand/15 dark:bg-brand/25",
                    )}
                    aria-hidden
                  />
                  {dayNumber}
                </button>
              </Popover>
            </span>
          );
        })}
      </div>

      <Link
        href="/dashboard/schedules"
        className="mt-auto pt-5 text-center text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-400 transition hover:text-zinc-800 dark:hover:text-zinc-200"
      >
        Open bookings
      </Link>
    </section>
  );
}
