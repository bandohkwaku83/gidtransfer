"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { formatBillingDate } from "@/lib/billing-api";
import { usePlanEntitlements } from "@/lib/use-plan-entitlements";

const BILLING_HREF = "/dashboard/settings?tab=billing";

export function TrialExpiredWall() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <Sparkles className="h-6 w-6" aria-hidden />
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Your free trial has ended
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Upgrade to Basic, Pro, or Premium to keep creating galleries and uploading.
        </p>
        <Link
          href={BILLING_HREF}
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover"
        >
          View plans
        </Link>
      </div>
    </div>
  );
}

export function TrialActiveBanner() {
  const { plan } = usePlanEntitlements();
  if (!plan?.trialActive) return null;

  const ends = formatBillingDate(plan.trialEndsAt);

  return (
    <div
      role="status"
      className="flex shrink-0 items-center justify-end gap-x-1.5 border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-600 sm:px-6 lg:px-8 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300"
    >
      <span>
        Free trial{ends ? ` ends ${ends}` : " is active"}
      </span>
      <span className="text-zinc-300 dark:text-zinc-600" aria-hidden>
        ·
      </span>
      <Link
        href={BILLING_HREF}
        className="font-semibold text-brand underline-offset-2 hover:underline dark:text-brand-on-dark"
      >
        Upgrade
      </Link>
    </div>
  );
}
