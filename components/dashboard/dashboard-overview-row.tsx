"use client";

import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { DashboardStackedCardsArt } from "@/components/dashboard/dashboard-stacked-cards-art";
import { PRODUCT_TAGLINE } from "@/lib/branding";
import { cn } from "@/lib/utils";

type DashboardOverviewRowProps = {
  greeting: string;
  todayLabel: string;
  onNewGallery: () => void;
  onAddClient: () => void;
};

export function DashboardOverviewRow({
  greeting,
  todayLabel,
  onNewGallery,
  onAddClient,
}: DashboardOverviewRowProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:gap-5">
      <div className="dashboard-panel dashboard-panel--elevated dashboard-workspace-card flex flex-col justify-between gap-8">
        <WorkspaceWavePattern className="dashboard-workspace-wave" aria-hidden />
        <DashboardStackedCardsArt className="dashboard-workspace-art" />

        <div className="relative z-[1] min-w-0 pr-28 sm:pr-40">
          <p className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand/70" aria-hidden />
            Your workspace
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-[1.65rem]">
            Hi, {greeting}
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-500">{PRODUCT_TAGLINE}</p>
          <p className="mt-3 text-xs text-zinc-400">{todayLabel}</p>
        </div>

        <div className="relative z-[1] flex flex-wrap items-center gap-3">
          <button type="button" onClick={onNewGallery} className="dashboard-btn-primary">
            New gallery
          </button>
          <button type="button" onClick={onAddClient} className="dashboard-btn-secondary">
            Add client
          </button>
        </div>
      </div>

      <DashboardPromoCard />
    </div>
  );
}

function DashboardPromoCard() {
  return (
    <div className="dashboard-promo-card relative overflow-hidden">
      <PromoWavePattern className="dashboard-promo-wave" aria-hidden />

      <div className="relative z-[1] flex h-full flex-col justify-between gap-6 p-6 sm:p-7">
        <div className="max-w-[14rem]">
          <h2 className="text-lg font-semibold leading-snug text-white">Manage your bookings</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/70">
            Schedule shoots, send reminders, and keep your calendar in sync with client galleries.
          </p>
        </div>

        <Link href="/dashboard/schedules" className="dashboard-promo-btn">
          Open schedules
        </Link>
      </div>

      <div className="dashboard-promo-art" aria-hidden>
        <span className="dashboard-promo-icon-ring">
          <CalendarDays className="h-7 w-7 text-brand" strokeWidth={1.5} />
        </span>
      </div>
    </div>
  );
}

function WorkspaceWavePattern({ className }: { className?: string }) {
  return (
    <svg
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      viewBox="0 0 640 280"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M0 210C120 170 180 250 320 200C460 150 520 230 640 190V280H0V210Z"
        fill="rgba(232, 153, 176, 0.12)"
      />
      <path
        d="M0 235C100 200 200 265 340 225C480 185 560 245 640 215V280H0V235Z"
        fill="rgba(85, 0, 31, 0.04)"
      />
    </svg>
  );
}

function PromoWavePattern({ className }: { className?: string }) {
  return (
    <svg
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      viewBox="0 0 400 240"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M0 180C80 140 120 220 200 170C280 120 320 200 400 150V240H0V180Z"
        fill="rgba(255,255,255,0.06)"
      />
      <path
        d="M0 200C90 160 140 230 220 190C300 150 340 210 400 170V240H0V200Z"
        fill="rgba(255,255,255,0.04)"
      />
    </svg>
  );
}
