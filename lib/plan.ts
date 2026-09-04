import type { PlanFeatureKey, UserPlan } from "@/lib/plan-entitlements";

export const BILLING_HREF = "/billing";

export type BillingInterval = "monthly" | "yearly";

export type PlanLike = {
  priceGhs?: number;
  yearlyPriceGhs?: number;
  prices?: {
    monthly?: { priceGhs?: number; available?: boolean };
    yearly?: { priceGhs?: number; available?: boolean };
  };
} | null | undefined;

export type UserWithPlan = { plan?: UserPlan | null } | null | undefined;

/** Prefer `user.plan.features` — never branch on planId for product features. */
export const can = (
  user: UserWithPlan,
  feature: PlanFeatureKey | string,
): boolean => user?.plan?.features?.[feature] === true;

export const isViewOnly = (user: UserWithPlan): boolean =>
  user?.plan?.viewOnly === true;

export const isInGrace = (user: UserWithPlan): boolean =>
  user?.plan?.inGracePeriod === true;

export const isTrialActive = (user: UserWithPlan): boolean =>
  user?.plan?.trialActive === true;

export const isTrialExpired = (user: UserWithPlan): boolean =>
  user?.plan?.trialExpired === true;

/** Catalog monthly amount, or the user's current charge on `user.plan`. */
export const planPrice = (
  plan: PlanLike,
  interval: BillingInterval,
): number =>
  interval === "yearly"
    ? (plan?.prices?.yearly?.priceGhs ?? plan?.yearlyPriceGhs ?? 0)
    : (plan?.prices?.monthly?.priceGhs ?? plan?.priceGhs ?? 0);

export function planIntervalAvailable(
  plan: PlanLike,
  interval: BillingInterval,
): boolean {
  const slot = plan?.prices?.[interval];
  if (slot && typeof slot.available === "boolean") return slot.available;
  return true;
}

export function isBillingPath(pathname = "", search = ""): boolean {
  if (pathname === "/billing" || pathname.startsWith("/billing/")) return true;
  if (pathname.startsWith("/dashboard/settings") && search.includes("tab=billing")) {
    return true;
  }
  return false;
}

export function billingAppPath(query?: {
  upgraded?: boolean;
  paymentFailed?: boolean;
  status?: string | null;
}): string {
  const params = new URLSearchParams();
  if (query?.upgraded) params.set("upgraded", "1");
  if (query?.paymentFailed) {
    params.set("payment", "failed");
    if (query.status) params.set("status", query.status);
  }
  const qs = params.toString();
  return qs ? `${BILLING_HREF}?${qs}` : BILLING_HREF;
}

export function settingsBillingPathFromAppQuery(search: string): string {
  const incoming = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const params = new URLSearchParams({ tab: "billing" });
  if (incoming.get("upgraded") === "1" || incoming.get("success") === "1") {
    params.set("success", "1");
  }
  if (incoming.get("payment") === "failed") {
    params.set("payment", "failed");
    const status = incoming.get("status");
    if (status) params.set("status", status);
  }
  return `/dashboard/settings?${params.toString()}`;
}
