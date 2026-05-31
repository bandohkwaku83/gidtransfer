"use client";

import Link from "next/link";
import { Check, CreditCard, FolderOpen, HardDrive } from "lucide-react";
import {
  PLANS,
  type PlanId,
} from "@/lib/subscription-plan";
import { cn } from "@/lib/utils";

function formatPlanStorage(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  if (Math.abs(gb - Math.round(gb)) < 1e-6) return `${Math.round(gb)} GB`;
  return `${gb.toFixed(0)} GB`;
}

type SettingsBillingSectionProps = {
  planId: PlanId;
  galleriesUsed: number;
  onSelectPlan: (id: PlanId) => void;
};

const PLAN_ORDER: PlanId[] = ["free", "studio", "pro"];

export function SettingsBillingSection({
  planId,
  galleriesUsed,
  onSelectPlan,
}: SettingsBillingSectionProps) {
  const activePlan = PLANS[planId];
  const galleryMax = activePlan.maxGalleries;
  const galleryPct =
    galleryMax != null && galleryMax > 0
      ? Math.min(100, Math.round((galleriesUsed / galleryMax) * 100))
      : null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 via-white to-brand/5 p-5 dark:border-zinc-800 dark:from-zinc-900/80 dark:via-zinc-950 dark:to-brand/10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <CreditCard className="h-3.5 w-3.5" aria-hidden />
              Your plan
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {activePlan.label}
            </p>
            <p className="mt-0.5 text-sm text-zinc-500">{activePlan.priceLabel}</p>
          </div>
          <span className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">
            Active
          </span>
        </div>

        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{activePlan.description}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-200/90 bg-white/80 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-950/60">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <FolderOpen className="h-3.5 w-3.5" aria-hidden />
              Galleries
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {galleriesUsed}
              {galleryMax != null ? (
                <span className="text-sm font-normal text-zinc-500"> / {galleryMax}</span>
              ) : (
                <span className="text-sm font-normal text-zinc-500"> in use</span>
              )}
            </p>
            {galleryPct != null ? (
              <div
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
                role="progressbar"
                aria-valuenow={galleryPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Galleries used"
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-[width]",
                    galleryPct >= 100 ? "bg-amber-500" : "bg-brand",
                  )}
                  style={{ width: `${galleryPct}%` }}
                />
              </div>
            ) : null}
          </div>
          <div className="rounded-xl border border-zinc-200/90 bg-white/80 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-950/60">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <HardDrive className="h-3.5 w-3.5" aria-hidden />
              Included storage
            </p>
            <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {formatPlanStorage(activePlan.storageBytes)}
            </p>
            <Link
              href="/dashboard/storage"
              className="mt-1 inline-block text-xs font-semibold text-brand hover:underline dark:text-brand-on-dark"
            >
              View usage
            </Link>
          </div>
        </div>
      </div>

      <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs leading-relaxed text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
        Plan switching here is for demo limits only. Billing history and invoices will show up
        when payments are connected.
      </p>

      <section className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">All plans</p>
          <p className="mt-0.5 text-xs text-zinc-500">Pick a tier to try different gallery and storage limits.</p>
        </div>

        <ul className="space-y-3">
          {PLAN_ORDER.map((id) => {
            const p = PLANS[id];
            const current = id === planId;
            const recommended = id === "studio";
            return (
              <li key={id}>
                <div
                  className={cn(
                    "rounded-2xl border p-4 transition sm:p-5",
                    current
                      ? "border-brand bg-brand/5 shadow-sm shadow-brand/10 ring-1 ring-brand/20"
                      : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/50 dark:hover:border-zinc-700",
                  )}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                          {p.label}
                        </p>
                        {current ? (
                          <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                            Current
                          </span>
                        ) : recommended ? (
                          <span className="rounded-full border border-brand/30 bg-brand/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand dark:text-brand-on-dark">
                            Popular
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-sm font-medium text-brand dark:text-brand-on-dark">
                        {p.priceLabel}
                      </p>
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{p.description}</p>
                      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                        {p.perks.map((line) => (
                          <li key={line} className="flex items-center gap-1.5">
                            <Check className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
                            {line}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button
                      type="button"
                      disabled={current}
                      onClick={() => onSelectPlan(id)}
                      className={cn(
                        "shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-default",
                        current
                          ? "border border-brand/30 bg-brand/10 text-brand dark:text-brand-on-dark"
                          : "bg-brand text-white shadow-sm hover:bg-brand-hover",
                      )}
                    >
                      {current ? "Current plan" : id === "free" ? "Use Free" : `Switch to ${p.label}`}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

    </div>
  );
}
