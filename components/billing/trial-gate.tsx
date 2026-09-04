"use client";

import Link from "next/link";
import { formatBillingDate } from "@/lib/billing-api";
import { BILLING_HREF, isInGrace, isTrialActive, isViewOnly } from "@/lib/plan";
import { usePlanEntitlements } from "@/lib/use-plan-entitlements";
import { cn } from "@/lib/utils";

function Banner({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "warning" | "danger";
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex shrink-0 items-center justify-end gap-x-1.5 border-b px-4 py-2 text-sm sm:px-6 lg:px-8",
        tone === "danger"
          ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
          : tone === "warning"
            ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
            : "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300",
      )}
    >
      {children}
    </div>
  );
}

export function TrialActiveBanner() {
  const { plan } = usePlanEntitlements();
  if (!isTrialActive({ plan })) return null;

  const ends = formatBillingDate(plan?.trialEndsAt);

  return (
    <Banner>
      <span>Free trial{ends ? ` ends ${ends}` : " is active"}</span>
      <span className="text-zinc-300 dark:text-zinc-600" aria-hidden>
        ·
      </span>
      <Link
        href={BILLING_HREF}
        className="font-semibold text-brand underline-offset-2 hover:underline dark:text-brand-on-dark"
      >
        Upgrade
      </Link>
    </Banner>
  );
}

export function GracePeriodBanner() {
  const { plan } = usePlanEntitlements();
  if (!isInGrace({ plan })) return null;

  const until = formatBillingDate(plan?.accessUntil ?? plan?.graceEndsAt);

  return (
    <Banner tone="warning">
      <span>
        Your plan ended.
        {until
          ? ` You have until ${until} to renew, then the account becomes view-only.`
          : " Renew soon, then the account becomes view-only."}
      </span>
      <span className="text-amber-300 dark:text-amber-700" aria-hidden>
        ·
      </span>
      <Link
        href={BILLING_HREF}
        className="font-semibold underline underline-offset-2"
      >
        Renew
      </Link>
    </Banner>
  );
}

export function ViewOnlyBanner() {
  const { plan } = usePlanEntitlements();
  if (!isViewOnly({ plan })) return null;

  return (
    <Banner tone="danger">
      <span>You can view existing work only.</span>
      <span className="text-red-300 dark:text-red-800" aria-hidden>
        ·
      </span>
      <Link
        href={BILLING_HREF}
        className="font-semibold underline underline-offset-2"
      >
        Subscribe to continue
      </Link>
    </Banner>
  );
}

export function PlanStatusBanners() {
  const { plan } = usePlanEntitlements();
  return (
    <>
      {isTrialActive({ plan }) ? <TrialActiveBanner /> : null}
      {isInGrace({ plan }) ? <GracePeriodBanner /> : null}
      {isViewOnly({ plan }) ? <ViewOnlyBanner /> : null}
    </>
  );
}

/** @deprecated View-only accounts keep reading routes; do not replace the app with a wall. */
export function TrialExpiredWall() {
  return null;
}
