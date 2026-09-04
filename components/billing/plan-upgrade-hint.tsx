"use client";

import type { CheckoutPlanId } from "@/lib/billing-api";
import { usePlanEntitlements } from "@/lib/use-plan-entitlements";
import { cn } from "@/lib/utils";

const PLAN_BADGE: Record<CheckoutPlanId, string> = {
  basic: "Basic",
  pro: "Pro",
  premium: "Premium",
};

type PlanUpgradeHintProps = {
  feature: string;
  title: string;
  description?: string;
  label?: string;
  suggestedPlanId?: CheckoutPlanId;
  /** Compact row for inline warnings (seat limits). */
  compact?: boolean;
  className?: string;
};

export function PlanUpgradeHint({
  feature,
  title,
  description,
  label,
  suggestedPlanId = "premium",
  compact = false,
  className,
}: PlanUpgradeHintProps) {
  const { openUpgrade } = usePlanEntitlements();
  const planName = PLAN_BADGE[suggestedPlanId];
  const cta = label ?? `Upgrade to ${planName}`;

  return (
    <div
      role="status"
      className={cn(
        "flex flex-col gap-3 border border-brand-muted/80 border-l-[3px] border-l-brand bg-brand-soft px-4 py-3 dark:border-brand/25 dark:border-l-brand-on-dark dark:bg-brand/10 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          <span className="mr-2 inline-flex rounded bg-brand px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white dark:bg-brand-on-dark dark:text-zinc-950">
            {planName}
          </span>
          {title}
        </p>
        {description && !compact ? (
          <p className="mt-1 text-sm leading-snug text-zinc-600 dark:text-zinc-400">{description}</p>
        ) : null}
        {description && compact ? (
          <p className="mt-1 text-xs leading-snug text-zinc-600 dark:text-zinc-400">{description}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => openUpgrade({ feature, suggestedPlanId })}
        className="inline-flex shrink-0 items-center justify-center self-start rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover sm:self-center"
      >
        {cta}
      </button>
    </div>
  );
}
