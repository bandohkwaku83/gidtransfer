"use client";

import { Banknote, Clock, FileText, MapPin, Pencil, Trash2 } from "lucide-react";
import { DashboardSpin } from "@/components/ui/skeletons";
import { formatBookedTimeLabel, type BookedShoot } from "@/components/schedules/booking-types";
import { formatBookingAmount } from "@/lib/bookings-api";
import { bookingDotClass } from "@/lib/booking-shoot-types";
import { cn } from "@/lib/utils";

type BookingCardProps = {
  shoot: BookedShoot;
  compact?: boolean;
  className?: string;
  onEdit?: (shoot: BookedShoot) => void;
  onDelete?: (shoot: BookedShoot) => void;
  onInvoice?: (shoot: BookedShoot) => void;
  deleting?: boolean;
};

function accentBarClass(shoot: BookedShoot): string {
  return bookingDotClass(shoot.shootColor);
}

export function BookingCard({
  shoot,
  compact,
  className,
  onEdit,
  onDelete,
  onInvoice,
  deleting,
}: BookingCardProps) {
  const amountLabel = formatBookingAmount(shoot.amountCharged, shoot.currency);

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950",
        className,
      )}
    >
      <span
        className={cn("absolute inset-y-0 left-0 w-1", accentBarClass(shoot))}
        aria-hidden
      />
      <div className={cn("pl-3.5", compact ? "p-3" : "p-4")}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {shoot.title}
            </p>
            <p className="mt-0.5 truncate text-xs text-zinc-600 dark:text-zinc-400">
              {shoot.clientName}
            </p>
          </div>
          <div className="flex shrink-0 items-start gap-1.5">
            {(onEdit || onDelete || onInvoice) && !compact ? (
              <div className="flex items-center gap-1">
                {onInvoice ? (
                  <button
                    type="button"
                    onClick={() => onInvoice(shoot)}
                    disabled={deleting}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                    aria-label={`Invoice for ${shoot.title}`}
                    title="Create invoice"
                  >
                    <FileText className="h-3.5 w-3.5" aria-hidden />
                  </button>
                ) : null}
                {onEdit ? (
                  <button
                    type="button"
                    onClick={() => onEdit(shoot)}
                    disabled={deleting}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                    aria-label={`Edit ${shoot.title}`}
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                  </button>
                ) : null}
                {onDelete ? (
                  <button
                    type="button"
                    onClick={() => onDelete(shoot)}
                    disabled={deleting}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
                    aria-label={`Delete ${shoot.title}`}
                  >
                    {deleting ? (
                      <DashboardSpin size="small" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    )}
                  </button>
                ) : null}
              </div>
            ) : null}
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-700">
              <span
                className={cn("h-2 w-2 shrink-0 rounded-full", accentBarClass(shoot))}
                aria-hidden
              />
              {shoot.shootTypeLabel}
            </span>
          </div>
        </div>
        <div className="mt-2.5 flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
            {formatBookedTimeLabel(shoot.startTime)}
            {shoot.endTime ? ` – ${formatBookedTimeLabel(shoot.endTime)}` : ""}
          </span>
          {amountLabel ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300">
              <Banknote className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
              {amountLabel}
            </span>
          ) : null}
          {shoot.location ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
              <span className="truncate">{shoot.location}</span>
            </span>
          ) : null}
          {shoot.notes && !compact ? (
            <p className="mt-1 border-t border-zinc-100 pt-2 text-[11px] leading-snug text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
              {shoot.notes}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/** Compact label for calendar day cells */
export function BookingDayPill({ shoot }: { shoot: BookedShoot }) {
  const bar = accentBarClass(shoot);
  return (
    <span
      title={`${shoot.title} · ${shoot.shootTypeLabel}, ${formatBookedTimeLabel(shoot.startTime)}`}
      className="flex min-w-0 items-center gap-1 rounded-md bg-zinc-100/95 px-1 py-0.5 dark:bg-zinc-800/90"
    >
      <span className={cn("h-2 w-0.5 shrink-0 rounded-full", bar)} aria-hidden />
      <span className="truncate text-[9px] font-medium leading-tight text-zinc-700 dark:text-zinc-200">
        {shoot.title}
      </span>
    </span>
  );
}
