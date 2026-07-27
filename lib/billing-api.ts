import { authedJson, extractMessage, HttpError, type AuthedFetchOptions } from "@/lib/http";

export class BillingApiError extends HttpError {}

export type BillingPlanId = "free" | "starter" | "pro" | "studio";
export type CheckoutPlanId = Exclude<BillingPlanId, "free">;

export type SubscriptionStatus =
  | "free"
  | "pending"
  | "active"
  | "past_due"
  | "non_renewing"
  | "cancelled";

export type BillingPlan = {
  id: BillingPlanId;
  name: string;
  description?: string;
  storageLimitBytes?: number;
  storageLabel?: string;
  priceGhs: number;
  interval: "monthly" | null;
  available: boolean;
  current: boolean;
};

export type BillingSubscription = {
  planId: BillingPlanId;
  planName: string;
  storageLimitBytes?: number;
  storageLabel?: string;
  priceGhs: number;
  interval: "monthly" | null;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  pendingPlanId: BillingPlanId | null;
  paystackSubscriptionCode: string | null;
  canManage: boolean;
};

export type BillingCheckoutResult = {
  message: string;
  checkout: {
    planId: CheckoutPlanId;
    planName: string;
    authorizationUrl: string;
    accessCode: string;
    reference: string;
    subscriptionCode: string | null;
  };
};

export type BillingVerifyResult = {
  verified: boolean;
  message?: string;
  subscription?: BillingSubscription;
};

const CONFIRMED_SUBSCRIPTION_STATUSES = new Set<SubscriptionStatus>([
  "active",
  "non_renewing",
]);

/** Paystack verify may return verified:false when the webhook already activated the plan. */
export function isBillingPaymentConfirmed(result: BillingVerifyResult): boolean {
  if (result.verified) return true;
  const sub = result.subscription;
  if (!sub) return false;
  return CONFIRMED_SUBSCRIPTION_STATUSES.has(sub.status) && sub.pendingPlanId == null;
}

export type BillingCancelResult = {
  message?: string;
  subscription: BillingSubscription;
};

export type BillingConfig = {
  configured: boolean;
  publicKey?: string;
  currency: string;
};

/** Paystack redirect target after payment (must match API callback URL config). */
export const BILLING_CALLBACK_PATH = "/billing/callback";

const BILLING_CHECKOUT_REF_KEY = "gidostorage_billing_checkout_ref";

/** Keep Paystack reference across redirect so billing can verify if callback fails. */
export function rememberBillingCheckoutReference(reference: string): void {
  if (typeof window === "undefined") return;
  const value = reference.trim();
  if (!value) return;
  try {
    window.sessionStorage.setItem(BILLING_CHECKOUT_REF_KEY, value);
  } catch {
    /* ignore */
  }
}

export function readBillingCheckoutReference(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(BILLING_CHECKOUT_REF_KEY)?.trim() || null;
  } catch {
    return null;
  }
}

export function clearBillingCheckoutReference(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(BILLING_CHECKOUT_REF_KEY);
  } catch {
    /* ignore */
  }
}

export function billingErrorCode(err: unknown): string | null {
  if (err instanceof HttpError && err.body && typeof err.body === "object") {
    const code = (err.body as { code?: unknown }).code;
    return typeof code === "string" ? code : null;
  }
  return null;
}

export function isBillingNotConfigured(err: unknown): boolean {
  return billingErrorCode(err) === "NOT_CONFIGURED";
}

export function formatPlanPriceGhs(priceGhs: number, interval: BillingPlan["interval"]): string {
  if (priceGhs <= 0) return "Free";
  const cadence = interval === "monthly" ? " / mo" : "";
  return `GHS ${priceGhs}${cadence}`;
}

export function formatBillingDate(iso: string | null | undefined): string | null {
  if (!iso?.trim()) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const PLAN_DISPLAY_ORDER: BillingPlanId[] = ["free", "starter", "pro", "studio"];

export function sortBillingPlans(plans: BillingPlan[]): BillingPlan[] {
  const rank = new Map(PLAN_DISPLAY_ORDER.map((id, i) => [id, i]));
  return [...plans].sort(
    (a, b) => (rank.get(a.id) ?? 99) - (rank.get(b.id) ?? 99),
  );
}

export async function fetchBillingPlans(): Promise<BillingPlan[]> {
  const data = await authedJson<{ plans?: BillingPlan[] } | null>(
    "/api/billing/plans",
    { method: "GET" },
    "Failed to load plans",
    BillingApiError,
  );
  const plans = data && Array.isArray(data.plans) ? data.plans : [];
  return sortBillingPlans(plans);
}

export async function fetchBillingSubscription(): Promise<BillingSubscription | null> {
  const data = await authedJson<{ subscription?: BillingSubscription | null } | null>(
    "/api/billing/subscription",
    { method: "GET" },
    "Failed to load subscription",
    BillingApiError,
  );
  if (!data || typeof data !== "object") return null;
  return data.subscription ?? null;
}

export async function fetchBillingPageData(): Promise<{
  plans: BillingPlan[];
  subscription: BillingSubscription | null;
}> {
  const [plans, subscription] = await Promise.all([
    fetchBillingPlans(),
    fetchBillingSubscription(),
  ]);
  return { plans, subscription };
}

export async function billingCheckout(planId: CheckoutPlanId): Promise<BillingCheckoutResult> {
  return authedJson<BillingCheckoutResult>(
    "/api/billing/checkout",
    {
      method: "POST",
      body: JSON.stringify({ planId }),
    },
    "Checkout failed",
    BillingApiError,
  );
}

export async function verifyBillingPayment(
  reference: string,
  options: AuthedFetchOptions = {},
): Promise<BillingVerifyResult> {
  const qs = new URLSearchParams({ reference: reference.trim() });
  return authedJson<BillingVerifyResult>(
    `/api/billing/verify?${qs.toString()}`,
    { method: "GET" },
    "Payment verification failed",
    BillingApiError,
    options,
  );
}

export async function cancelBillingSubscription(): Promise<BillingCancelResult> {
  return authedJson<BillingCancelResult>(
    "/api/billing/cancel",
    { method: "POST" },
    "Failed to cancel subscription",
    BillingApiError,
  );
}

export async function fetchBillingConfig(): Promise<BillingConfig | null> {
  try {
    return await authedJson<BillingConfig>(
      "/api/billing/config",
      { method: "GET" },
      "Failed to load billing config",
      BillingApiError,
    );
  } catch {
    return null;
  }
}

/** Redirect to Paystack hosted checkout (full page navigation). */
export async function startBillingCheckout(planId: CheckoutPlanId): Promise<void> {
  const data = await billingCheckout(planId);
  const url = data.checkout?.authorizationUrl?.trim();
  const reference = data.checkout?.reference?.trim();
  if (!url) {
    throw new BillingApiError("Checkout URL missing from response.", 500, data);
  }
  if (reference) rememberBillingCheckoutReference(reference);
  window.location.href = url;
}

/** Verify a stored Paystack reference when the API still shows checkout as pending. */
export async function reconcilePendingBillingPayment(
  options: AuthedFetchOptions = {},
): Promise<BillingVerifyResult | null> {
  const reference = readBillingCheckoutReference();
  if (!reference) return null;
  return verifyBillingPayment(reference, options);
}

export function paystackReferenceFromSearchParams(
  params: Pick<URLSearchParams, "get">,
): string | null {
  for (const key of ["reference", "trxref"] as const) {
    const value = params.get(key)?.trim();
    if (value) return value;
  }
  return null;
}

export function humanizeBillingErrorMessage(message: string): string {
  const normalized = message.trim().toLowerCase();
  if (!normalized) return message;

  if (normalized.includes("no saved authorizations")) {
    return "We could not start checkout because no payment method is saved yet. Try again — you should be redirected to Paystack to enter card details. If this keeps happening, contact support.";
  }

  if (normalized.includes("duplicate transaction reference")) {
    return "A checkout is already in progress. Wait a moment, then try again.";
  }

  return message;
}

export async function readBillingErrorMessage(
  err: unknown,
  fallback: string,
): Promise<string> {
  let message = fallback;
  if (err instanceof HttpError) message = extractMessage(err.body, err.message || fallback);
  else if (err instanceof Error && err.message.trim()) message = err.message;
  return humanizeBillingErrorMessage(message);
}
