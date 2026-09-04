import { apiUrl } from "@/lib/api";
import { authHandoffPayload, getAuth, getAuthToken } from "@/lib/auth-demo";
import {
  authedJson,
  extractMessage,
  HttpError,
  parseJson,
  type AuthedFetchOptions,
} from "@/lib/http";
import {
  type BillingInterval,
  type BillingPlanId,
  type CheckoutPlanId,
  type PlanFeatures,
  type PlanPrices,
  normalizePlanId,
  parsePlanFeatures,
  parseUserPlan,
  sortBillingPlans as sortPlansByRank,
  type UserPlan,
} from "@/lib/plan-entitlements";
import {
  AUTH_HANDOFF_PARAM,
  isValidStudioSlug,
  normalizeStudioSlugInput,
  parseTenantFromHostname,
  tenantAppUrl,
} from "@/lib/studio-url";

export class BillingApiError extends HttpError {}

export type { BillingInterval, BillingPlanId, CheckoutPlanId };
export { isCheckoutPlanId, normalizePlanId } from "@/lib/plan-entitlements";

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
  aliases?: string[];
  highlighted?: boolean;
  storageLimitBytes?: number;
  storageLabel?: string;
  priceGhs: number;
  yearlyPriceGhs: number;
  interval: BillingInterval | null;
  prices: PlanPrices;
  perks?: string[];
  features?: PlanFeatures;
  available: boolean;
  current: boolean;
};

export type BillingFeatureCatalogItem = {
  key: string;
  label: string;
  category?: string;
  description?: string;
};

export type BillingComparisonRow = {
  key: string;
  label: string;
  category?: string;
  values: Record<string, string | boolean | number | null>;
};

export type BillingPlansCatalog = {
  plans: BillingPlan[];
  featureCatalog: BillingFeatureCatalogItem[];
  comparison: BillingComparisonRow[];
};

export type BillingSubscription = {
  planId: BillingPlanId;
  planName: string;
  storageLimitBytes?: number;
  storageLabel?: string;
  maxGalleries?: number | null;
  videoUploadLimitBytes?: number;
  videoUploadLimitLabel?: string;
  priceGhs: number;
  yearlyPriceGhs: number;
  interval: BillingInterval | null;
  prices?: PlanPrices;
  status: SubscriptionStatus;
  /** @deprecated Prefer `renewalDate` — kept for older callers. */
  currentPeriodEnd: string | null;
  renewalDate: string | null;
  upgradedAt: string | null;
  cancelAtPeriodEnd: boolean;
  pendingPlanId: BillingPlanId | null;
  paystackSubscriptionCode: string | null;
  canManage: boolean;
  trialDays?: number | null;
  trialEndsAt?: string | null;
  trialActive?: boolean;
  trialExpired?: boolean;
  graceDays?: number;
  graceEndsAt?: string | null;
  inGracePeriod?: boolean;
  viewOnly?: boolean;
  willRenew?: boolean;
  accessUntil?: string | null;
  canCancel?: boolean;
  canResume?: boolean;
  pendingInterval?: BillingInterval | null;
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
    interval?: BillingInterval;
  };
};

export type BillingVerifyResult = {
  verified: boolean;
  status?: string;
  message?: string;
  subscription?: BillingSubscription;
  /** Full entitlements payload from verify — apply this so the UI does not wait on a lagging /me. */
  plan?: UserPlan;
};

/** True only when Paystack verify reports success. Do not infer from landing on the callback URL. */
export function isBillingPaymentConfirmed(result: BillingVerifyResult): boolean {
  return result.verified === true;
}

const PLAN_RANK: Record<string, number> = {
  free: 0,
  basic: 1,
  pro: 2,
  premium: 3,
};

/** Keep the verify payload when /subscription or /me still return the pre-pay plan. */
export function preferConfirmedSubscription(
  incoming: BillingSubscription | null | undefined,
  confirmed: BillingSubscription | null | undefined,
): BillingSubscription | null {
  if (!incoming) return confirmed ?? null;
  if (!confirmed) return incoming;
  if (confirmed.status === "pending") return incoming;
  if (incoming.status === "pending") {
    return confirmed;
  }
  const incomingRank = PLAN_RANK[incoming.planId] ?? 0;
  const confirmedRank = PLAN_RANK[confirmed.planId] ?? 0;
  if (confirmedRank > incomingRank) return confirmed;
  if (
    confirmedRank === incomingRank &&
    confirmed.interval &&
    incoming.interval &&
    confirmed.interval !== incoming.interval
  ) {
    return confirmed;
  }
  return incoming;
}

export function billingSettingsPath(query?: {
  success?: boolean;
  paymentFailed?: boolean;
}): string {
  const params = new URLSearchParams({ tab: "billing" });
  if (query?.success) params.set("success", "1");
  if (query?.paymentFailed) params.set("payment", "failed");
  return `/dashboard/settings?${params.toString()}`;
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
const BILLING_STUDIO_KEY = "gidostorage_billing_studio";

export type BillingStudioContext = {
  slug: string;
  studioUrl?: string;
  studioUrlSuffix?: string;
};

function billingSharedCookieDomain(): string | null {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) {
    return ".localhost";
  }
  const base = process.env.NEXT_PUBLIC_STUDIO_BASE_DOMAIN?.trim().toLowerCase();
  if (!base) return null;
  const bare = base.replace(/^\./, "");
  if (host === bare || host.endsWith(`.${bare}`)) {
    return `.${bare}`;
  }
  return null;
}

function writeBillingStudioCookie(ctx: BillingStudioContext): void {
  const domain = billingSharedCookieDomain();
  if (!domain) return;
  try {
    const value = encodeURIComponent(JSON.stringify(ctx));
    let cookie = `${BILLING_STUDIO_KEY}=${value}; path=/; max-age=${60 * 60 * 6}; SameSite=Lax; domain=${domain}`;
    if (window.location.protocol === "https:") cookie += "; Secure";
    document.cookie = cookie;
  } catch {
    /* ignore */
  }
}

function readBillingStudioCookie(): BillingStudioContext | null {
  if (typeof document === "undefined") return null;
  const prefix = `${BILLING_STUDIO_KEY}=`;
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    if (!trimmed.startsWith(prefix)) continue;
    try {
      const parsed = JSON.parse(decodeURIComponent(trimmed.slice(prefix.length))) as BillingStudioContext;
      const slug = normalizeStudioSlugInput(parsed?.slug ?? "");
      if (!slug || !isValidStudioSlug(slug)) return null;
      return {
        slug,
        studioUrl: typeof parsed.studioUrl === "string" ? parsed.studioUrl : undefined,
        studioUrlSuffix:
          typeof parsed.studioUrlSuffix === "string" ? parsed.studioUrlSuffix : undefined,
      };
    } catch {
      return null;
    }
  }
  return null;
}

function clearBillingStudioCookie(): void {
  const domain = billingSharedCookieDomain();
  const base = `${BILLING_STUDIO_KEY}=; path=/; max-age=0; SameSite=Lax`;
  document.cookie = domain ? `${base}; domain=${domain}` : base;
}

/**
 * Remember which studio host started Paystack checkout.
 * Paystack returns to the apex host; session localStorage lives on `{slug}.localhost`.
 * A small shared cookie lets apex bounce back to the studio callback without a forced login.
 */
export function rememberBillingStudioContext(ctx: BillingStudioContext): void {
  if (typeof window === "undefined") return;
  const slug = normalizeStudioSlugInput(ctx.slug);
  if (!slug || !isValidStudioSlug(slug)) return;
  const value: BillingStudioContext = {
    slug,
    studioUrl: ctx.studioUrl?.trim() || undefined,
    studioUrlSuffix: ctx.studioUrlSuffix?.trim() || undefined,
  };
  try {
    window.localStorage.setItem(BILLING_STUDIO_KEY, JSON.stringify(value));
  } catch {
    /* ignore */
  }
  writeBillingStudioCookie(value);
}

export function readBillingStudioContext(): BillingStudioContext | null {
  if (typeof window === "undefined") return null;
  const fromCookie = readBillingStudioCookie();
  if (fromCookie) return fromCookie;
  try {
    const raw = window.localStorage.getItem(BILLING_STUDIO_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BillingStudioContext;
    const slug = normalizeStudioSlugInput(parsed?.slug ?? "");
    if (!slug || !isValidStudioSlug(slug)) return null;
    return {
      slug,
      studioUrl: typeof parsed.studioUrl === "string" ? parsed.studioUrl : undefined,
      studioUrlSuffix:
        typeof parsed.studioUrlSuffix === "string" ? parsed.studioUrlSuffix : undefined,
    };
  } catch {
    return null;
  }
}

export function clearBillingStudioContext(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(BILLING_STUDIO_KEY);
  } catch {
    /* ignore */
  }
  clearBillingStudioCookie();
}

/**
 * Keep Paystack reference across Paystack redirect + re-login.
 * Prefer localStorage: session can expire on Paystack, and sessionStorage is
 * per-tab and per-host (localhost vs *.localhost).
 */
export function rememberBillingCheckoutReference(reference: string): void {
  if (typeof window === "undefined") return;
  const value = reference.trim();
  if (!value) return;
  try {
    window.localStorage.setItem(BILLING_CHECKOUT_REF_KEY, value);
  } catch {
    /* ignore */
  }
  try {
    window.sessionStorage.setItem(BILLING_CHECKOUT_REF_KEY, value);
  } catch {
    /* ignore */
  }
}

export function readBillingCheckoutReference(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const fromLocal = window.localStorage.getItem(BILLING_CHECKOUT_REF_KEY)?.trim();
    if (fromLocal) return fromLocal;
  } catch {
    /* ignore */
  }
  try {
    return window.sessionStorage.getItem(BILLING_CHECKOUT_REF_KEY)?.trim() || null;
  } catch {
    return null;
  }
}

export function clearBillingCheckoutReference(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(BILLING_CHECKOUT_REF_KEY);
  } catch {
    /* ignore */
  }
  try {
    window.sessionStorage.removeItem(BILLING_CHECKOUT_REF_KEY);
  } catch {
    /* ignore */
  }
  clearBillingStudioContext();
}

/** Safe post-login path so we can finish GET /api/billing/verify after re-auth. */
export function billingCallbackReturnPath(reference: string): string {
  const ref = reference.trim();
  return `${BILLING_CALLBACK_PATH}?reference=${encodeURIComponent(ref)}`;
}

/**
 * Paystack callback is configured on the apex host, but the JWT lives on the studio
 * subdomain localStorage. Bounce there before verify so we do not force a re-login.
 */
export function redirectToStudioBillingCallbackIfNeeded(reference: string): boolean {
  if (typeof window === "undefined") return false;
  const ctx = readBillingStudioContext();
  if (!ctx?.slug) return false;

  const currentTenant = parseTenantFromHostname(window.location.host);
  if (currentTenant === ctx.slug) return false;

  const path = billingCallbackReturnPath(reference);
  const target = tenantAppUrl(ctx.slug, path, {
    studioUrl: ctx.studioUrl,
    studioUrlSuffix: ctx.studioUrlSuffix,
  });
  if (!target.startsWith("http")) return false;

  try {
    const url = new URL(target);
    const handoff = authHandoffPayload();
    if (handoff) {
      url.searchParams.set(AUTH_HANDOFF_PARAM, handoff);
    }
    window.location.replace(url.toString());
  } catch {
    window.location.replace(target);
  }
  return true;
}

const BILLING_RETURN_PATH_KEY = "gidostorage_billing_return_path";

/** Persist post-login destination across signedOut wipes / lost query params. */
export function rememberBillingReturnPath(path: string): void {
  if (typeof window === "undefined") return;
  const value = path.trim();
  if (!value.startsWith("/") || value.startsWith("//")) return;
  try {
    window.localStorage.setItem(BILLING_RETURN_PATH_KEY, value);
  } catch {
    /* ignore */
  }
}

export function readBillingReturnPath(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(BILLING_RETURN_PATH_KEY)?.trim() || null;
  } catch {
    return null;
  }
}

export function clearBillingReturnPath(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(BILLING_RETURN_PATH_KEY);
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

export function formatPlanPriceGhs(
  priceGhs: number,
  interval: BillingPlan["interval"] | BillingInterval,
): string {
  if (priceGhs <= 0) return "Free";
  const cadence =
    interval === "yearly" ? " / yr" : interval === "monthly" ? " / mo" : "";
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

export function sortBillingPlans(plans: BillingPlan[]): BillingPlan[] {
  return sortPlansByRank(plans);
}

/** Pricing catalog + config are public; attach JWT when present so `current` can be set. */
async function publicBillingJson<T>(
  path: string,
  fallbackError: string,
): Promise<T> {
  const headers = new Headers({ Accept: "application/json" });
  const token = getAuthToken()?.trim();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(apiUrl(path), { method: "GET", headers, cache: "no-store" });
  const body = await parseJson(res);
  if (!res.ok) {
    throw new BillingApiError(
      extractMessage(body, `${fallbackError} (${res.status})`),
      res.status,
      body,
    );
  }
  return body as T;
}

function parsedPlanPrices(o: Record<string, unknown>): PlanPrices {
  const fromUser = parseUserPlan({
    planId: "basic",
    planName: "Plan",
    priceGhs: o.priceGhs,
    yearlyPriceGhs: o.yearlyPriceGhs,
    prices: o.prices,
  });
  return fromUser?.prices ?? {
    monthly: {
      interval: "monthly",
      priceGhs: typeof o.priceGhs === "number" ? o.priceGhs : 0,
      available: true,
    },
    yearly: {
      interval: "yearly",
      priceGhs: typeof o.yearlyPriceGhs === "number" ? o.yearlyPriceGhs : 0,
      available: typeof o.yearlyPriceGhs === "number" && o.yearlyPriceGhs > 0,
    },
  };
}

function parseBillingPlan(raw: unknown): BillingPlan | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = normalizePlanId(typeof o.id === "string" ? o.id : null);
  if (!id) return null;
  const aliases = Array.isArray(o.aliases)
    ? o.aliases.filter((a): a is string => typeof a === "string")
    : undefined;
  const perks = Array.isArray(o.perks)
    ? o.perks.filter((p): p is string => typeof p === "string")
    : undefined;
  return {
    id,
    name: typeof o.name === "string" && o.name.trim() ? o.name.trim() : id,
    description: typeof o.description === "string" ? o.description : undefined,
    aliases,
    highlighted: o.highlighted === true,
    storageLimitBytes:
      typeof o.storageLimitBytes === "number" ? o.storageLimitBytes : undefined,
    storageLabel: typeof o.storageLabel === "string" ? o.storageLabel : undefined,
    priceGhs: typeof o.priceGhs === "number" && Number.isFinite(o.priceGhs) ? o.priceGhs : 0,
    yearlyPriceGhs:
      typeof o.yearlyPriceGhs === "number" && Number.isFinite(o.yearlyPriceGhs)
        ? o.yearlyPriceGhs
        : 0,
    interval: o.interval === "yearly" || o.interval === "monthly" ? o.interval : null,
    prices: parsedPlanPrices(o),
    perks,
    features: o.features ? parsePlanFeatures(o.features) : undefined,
    available: o.available !== false,
    current: o.current === true,
  };
}

function parseComparisonRow(raw: unknown): BillingComparisonRow | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const key = typeof o.key === "string" ? o.key : "";
  const label = typeof o.label === "string" ? o.label : key;
  if (!key && !label) return null;
  const values =
    o.values && typeof o.values === "object"
      ? (o.values as Record<string, string | boolean | number | null>)
      : {};
  return {
    key: key || label,
    label: label || key,
    category: typeof o.category === "string" ? o.category : undefined,
    values,
  };
}

function catalogFromPayload(data: {
  plans?: unknown[];
  featureCatalog?: unknown[];
  comparison?: unknown[];
} | null): BillingPlansCatalog {
  const plans = sortBillingPlans(
    (data && Array.isArray(data.plans) ? data.plans : [])
      .map(parseBillingPlan)
      .filter((p): p is BillingPlan => p != null),
  );
  const featureCatalog = (
    data && Array.isArray(data.featureCatalog) ? data.featureCatalog : []
  ).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const o = item as Record<string, unknown>;
    const key = typeof o.key === "string" ? o.key : "";
    const label = typeof o.label === "string" ? o.label : key;
    if (!key && !label) return [];
    return [
      {
        key: key || label,
        label: label || key,
        category: typeof o.category === "string" ? o.category : undefined,
        description: typeof o.description === "string" ? o.description : undefined,
      } satisfies BillingFeatureCatalogItem,
    ];
  });
  const comparison = (data && Array.isArray(data.comparison) ? data.comparison : [])
    .map(parseComparisonRow)
    .filter((row): row is BillingComparisonRow => row != null);
  return { plans, featureCatalog, comparison };
}

/** Used on the public pricing page when the API still requires auth. */
export const MARKETING_BILLING_PLANS_FALLBACK: BillingPlansCatalog = {
  plans: [
    {
      id: "free",
      name: "Free",
      description: "30-day trial with core gallery tools.",
      priceGhs: 0,
      yearlyPriceGhs: 0,
      interval: null,
      prices: {
        monthly: { interval: "monthly", priceGhs: 0, available: true },
        yearly: { interval: "yearly", priceGhs: 0, available: false },
      },
      storageLabel: "5 GB",
      perks: [
        "5 GB Cloud Storage",
        "Up to 3 galleries",
        "Share links & client selections",
        "Text watermarks",
        "Bookings, CRM & income tracking",
        "Analytics dashboard",
      ],
      features: {
        analyticsDashboard: true,
        textWatermark: true,
        smsNotifications: false,
        videoDash: false,
        customSmsSender: false,
        customBranding: false,
        advancedAnalytics: false,
        restoreTrashItems: false,
        galleryAi: false,
      },
      available: true,
      current: false,
    },
    {
      id: "basic",
      name: "Basic",
      aliases: ["starter"],
      description: "SMS sharing and adaptive video for active studios.",
      priceGhs: 32,
      yearlyPriceGhs: 380,
      interval: "monthly",
      prices: {
        monthly: { interval: "monthly", priceGhs: 32, available: true },
        yearly: { interval: "yearly", priceGhs: 380, available: true },
      },
      storageLabel: "25 GB",
      perks: [
        "25 GB Cloud Storage",
        "Up to 10 galleries",
        "Everything in Free, plus:",
        "SMS notifications",
        "Adaptive video (DASH)",
        "Priority support",
      ],
      features: {
        analyticsDashboard: true,
        textWatermark: true,
        smsNotifications: true,
        videoDash: true,
        customSmsSender: false,
        customBranding: false,
        advancedAnalytics: false,
        restoreTrashItems: false,
        galleryAi: false,
      },
      available: true,
      current: false,
    },
    {
      id: "pro",
      name: "Pro",
      aliases: ["business"],
      description: "Branded downloads, trash restore, and deeper analytics.",
      priceGhs: 60,
      yearlyPriceGhs: 650,
      interval: "monthly",
      prices: {
        monthly: { interval: "monthly", priceGhs: 60, available: true },
        yearly: { interval: "yearly", priceGhs: 650, available: true },
      },
      storageLabel: "100 GB",
      perks: [
        "100 GB Cloud Storage",
        "Up to 50 galleries",
        "Everything in Basic, plus:",
        "Custom SMS sender ID",
        "Logo watermark on downloads",
        "Advanced analytics",
        "Restore from trash",
      ],
      features: {
        analyticsDashboard: true,
        textWatermark: true,
        smsNotifications: true,
        videoDash: true,
        customSmsSender: true,
        customBranding: true,
        advancedAnalytics: true,
        restoreTrashItems: true,
        galleryAi: false,
      },
      available: true,
      current: false,
    },
    {
      id: "premium",
      name: "Premium",
      aliases: ["studio"],
      highlighted: true,
      description:
        "Top studio plan — everything in Pro, then Gallery AI, a studio team, and shared shoots with other photographers.",
      priceGhs: 120,
      yearlyPriceGhs: 1300,
      interval: "monthly",
      prices: {
        monthly: { interval: "monthly", priceGhs: 120, available: true },
        yearly: { interval: "yearly", priceGhs: 1300, available: true },
      },
      storageLabel: "250 GB",
      perks: [
        "250 GB Cloud Storage",
        "Unlimited client galleries",
        "Video uploads up to 20 GB",
        "Everything in Pro, plus:",
        "Gallery AI — descriptions & client smart picks",
        "Studio team — up to 10 members with roles",
        "Team collaboration — invite photographers on Gidtransfer & share shoots",
        "Premium support",
      ],
      features: {
        analyticsDashboard: true,
        textWatermark: true,
        smsNotifications: true,
        videoDash: true,
        customSmsSender: true,
        customBranding: true,
        advancedAnalytics: true,
        restoreTrashItems: true,
        galleryAi: true,
      },
      available: true,
      current: false,
    },
  ],
  featureCatalog: [],
  comparison: [
    {
      key: "storageLimitBytes",
      label: "Cloud storage",
      category: "limits",
      values: {
        free: "5 GB",
        basic: "25 GB",
        pro: "100 GB",
        premium: "250 GB",
      },
    },
    {
      key: "maxGalleries",
      label: "Client galleries",
      category: "limits",
      values: {
        free: 3,
        basic: 10,
        pro: 50,
        premium: "Unlimited",
      },
    },
    {
      key: "videoUploadLimit",
      label: "Video uploads",
      category: "limits",
      values: {
        free: "—",
        basic: "5 GB",
        pro: "10 GB",
        premium: "20 GB",
      },
    },
    {
      key: "clientSelections",
      label: "Client selections",
      category: "core",
      values: { free: true, basic: true, pro: true, premium: true },
    },
    {
      key: "textWatermark",
      label: "Text watermarks",
      category: "branding",
      values: { free: true, basic: true, pro: true, premium: true },
    },
    {
      key: "smsNotifications",
      label: "SMS notifications",
      category: "comms",
      values: { free: false, basic: true, pro: true, premium: true },
    },
    {
      key: "videoDash",
      label: "Adaptive video",
      category: "media",
      values: { free: false, basic: true, pro: true, premium: true },
    },
    {
      key: "customSmsSender",
      label: "Custom SMS sender ID",
      category: "comms",
      values: { free: false, basic: false, pro: true, premium: true },
    },
    {
      key: "customBranding",
      label: "Logo watermark on downloads",
      category: "branding",
      values: { free: false, basic: false, pro: true, premium: true },
    },
    {
      key: "advancedAnalytics",
      label: "Advanced analytics",
      category: "analytics",
      values: { free: false, basic: false, pro: true, premium: true },
    },
    {
      key: "restoreTrashItems",
      label: "Restore from trash",
      category: "storage",
      values: { free: false, basic: false, pro: true, premium: true },
    },
    {
      key: "galleryAi",
      label: "Gallery AI",
      category: "ai",
      values: { free: false, basic: false, pro: false, premium: true },
    },
    {
      key: "studioTeam",
      label: "Studio team (roles & menus)",
      category: "team",
      values: {
        free: false,
        basic: false,
        pro: false,
        premium: "Up to 10",
      },
    },
    {
      key: "collaboration",
      label: "Team collaboration workspaces",
      category: "team",
      values: { free: false, basic: false, pro: false, premium: true },
    },
    {
      key: "support",
      label: "Support",
      category: "support",
      values: {
        free: "Contact",
        basic: "Priority",
        pro: "Priority",
        premium: "Premium",
      },
    },
  ],
};

export async function fetchBillingPlansCatalog(): Promise<BillingPlansCatalog> {
  const data = await publicBillingJson<{
    plans?: unknown[];
    featureCatalog?: unknown[];
    comparison?: unknown[];
  } | null>("/api/billing/plans", "Failed to load plans");
  return catalogFromPayload(data);
}

/**
 * Public pricing page: prefer the live catalog, but never surface auth errors.
 * Falls back to the marketing catalog when the API requires a session.
 * Always overlays marketing card copy (description, perks, highlight) so pricing
 * messaging stays accurate even when the API returns sparse plan text.
 */
export function withMarketingPlanCopy(catalog: BillingPlansCatalog): BillingPlansCatalog {
  const marketingById = new Map(
    MARKETING_BILLING_PLANS_FALLBACK.plans.map((plan) => [plan.id, plan]),
  );
  const plans = catalog.plans.map((plan) => {
    const marketing = marketingById.get(plan.id);
    if (!marketing) return plan;
    return {
      ...plan,
      description: marketing.description ?? plan.description,
      perks: marketing.perks?.length ? marketing.perks : plan.perks,
      highlighted: marketing.highlighted === true,
      storageLabel: plan.storageLabel ?? marketing.storageLabel,
    };
  });

  const marketingKeys = new Set(
    MARKETING_BILLING_PLANS_FALLBACK.comparison.map((row) => row.key),
  );
  const apiExtra = catalog.comparison.filter((row) => !marketingKeys.has(row.key));
  const comparison =
    catalog.comparison.length > 0
      ? [...MARKETING_BILLING_PLANS_FALLBACK.comparison, ...apiExtra]
      : MARKETING_BILLING_PLANS_FALLBACK.comparison;

  return {
    ...catalog,
    plans: sortBillingPlans(plans),
    comparison,
  };
}

export async function fetchPublicPricingCatalog(): Promise<{
  catalog: BillingPlansCatalog;
  config: BillingConfig | null;
}> {
  const [catalogResult, config] = await Promise.all([
    fetchBillingPlansCatalog()
      .then((catalog) => ({ catalog, ok: true as const }))
      .catch((err: unknown) => {
        const status = err instanceof HttpError ? err.status : 0;
        if (status === 401 || status === 403) {
          return { catalog: MARKETING_BILLING_PLANS_FALLBACK, ok: false as const };
        }
        throw err;
      }),
    fetchBillingConfig(),
  ]);

  return {
    catalog: withMarketingPlanCopy(catalogResult.catalog),
    config,
  };
}

export async function fetchBillingPlans(): Promise<BillingPlan[]> {
  const catalog = await fetchBillingPlansCatalog();
  return catalog.plans;
}

const SUBSCRIPTION_STATUSES = new Set<SubscriptionStatus>([
  "free",
  "pending",
  "active",
  "past_due",
  "non_renewing",
  "cancelled",
]);

function parseBillingSubscription(raw: unknown): BillingSubscription | null {
  const plan = parseUserPlan(raw);
  if (!plan) return null;
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const nestedSub =
    o.subscription && typeof o.subscription === "object"
      ? (o.subscription as Record<string, unknown>)
      : null;
  const statusRaw = typeof o.status === "string" ? o.status : plan.subscription.status;
  const status = SUBSCRIPTION_STATUSES.has(statusRaw as SubscriptionStatus)
    ? (statusRaw as SubscriptionStatus)
    : plan.planId === "free"
      ? "free"
      : "active";
  const cancelAtPeriodEnd =
    plan.subscription.cancelAtPeriodEnd === true ||
    o.cancelAtPeriodEnd === true ||
    nestedSub?.cancelAtPeriodEnd === true;
  const explicitCanManage =
    o.canManage === true || nestedSub?.canManage === true
      ? true
      : o.canManage === false || nestedSub?.canManage === false
        ? false
        : null;
  const canManage =
    explicitCanManage ??
    (plan.planId !== "free" &&
      (status === "active" || status === "past_due" || status === "non_renewing"));

  const renewalDate =
    plan.subscription.renewalDate ??
    plan.subscription.currentPeriodEnd ??
    readBillingDateString(o.renewalDate) ??
    readBillingDateString(nestedSub?.renewalDate) ??
    readBillingDateString(o.currentPeriodEnd) ??
    readBillingDateString(nestedSub?.currentPeriodEnd) ??
    readBillingDateString(o.nextPaymentDate) ??
    readBillingDateString(nestedSub?.nextPaymentDate) ??
    readBillingDateString(o.next_payment_date) ??
    readBillingDateString(nestedSub?.next_payment_date) ??
    null;

  const upgradedAt =
    plan.subscription.upgradedAt ??
    readBillingDateString(o.upgradedAt) ??
    readBillingDateString(nestedSub?.upgradedAt) ??
    readBillingDateString(o.upgraded_at) ??
    readBillingDateString(nestedSub?.upgraded_at) ??
    null;

  return {
    planId: plan.planId,
    planName: plan.planName,
    storageLimitBytes: plan.storageLimitBytes,
    storageLabel: plan.storageLabel,
    maxGalleries: plan.maxGalleries,
    videoUploadLimitBytes: plan.videoUploadLimitBytes,
    videoUploadLimitLabel: plan.videoUploadLimitLabel,
    priceGhs: plan.priceGhs,
    yearlyPriceGhs: plan.yearlyPriceGhs,
    interval: plan.interval,
    prices: plan.prices,
    status,
    currentPeriodEnd: renewalDate,
    renewalDate,
    upgradedAt,
    cancelAtPeriodEnd,
    pendingPlanId: plan.subscription.pendingPlanId,
    paystackSubscriptionCode:
      typeof o.paystackSubscriptionCode === "string"
        ? o.paystackSubscriptionCode
        : typeof nestedSub?.paystackSubscriptionCode === "string"
          ? nestedSub.paystackSubscriptionCode
          : null,
    canManage,
    trialDays: plan.trialDays,
    trialEndsAt: plan.trialEndsAt,
    trialActive: plan.trialActive,
    trialExpired: plan.trialExpired,
    graceDays: plan.graceDays,
    graceEndsAt: plan.graceEndsAt,
    inGracePeriod: plan.inGracePeriod,
    viewOnly: plan.viewOnly,
    willRenew: plan.subscription.willRenew,
    accessUntil: plan.accessUntil ?? plan.subscription.accessUntil,
    canCancel:
      o.canCancel === true ||
      nestedSub?.canCancel === true ||
      (canManage &&
        o.canCancel !== false &&
        nestedSub?.canCancel !== false &&
        !cancelAtPeriodEnd &&
        status !== "non_renewing"),
    canResume:
      o.canResume === true ||
      nestedSub?.canResume === true ||
      (canManage && (cancelAtPeriodEnd || status === "non_renewing")),
    pendingInterval: plan.subscription.pendingInterval,
  };
}

function readBillingDateString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function fetchBillingSubscription(): Promise<BillingSubscription | null> {
  const data = await authedJson<{ subscription?: unknown } | null>(
    "/api/billing/subscription",
    { method: "GET" },
    "Failed to load subscription",
    BillingApiError,
  );
  if (!data || typeof data !== "object") return null;
  return parseBillingSubscription(data.subscription) ?? null;
}

export async function fetchBillingPageData(): Promise<{
  plans: BillingPlan[];
  subscription: BillingSubscription | null;
  config: BillingConfig | null;
}> {
  const [plans, subscription, config] = await Promise.all([
    fetchBillingPlans(),
    fetchBillingSubscription(),
    fetchBillingConfig(),
  ]);
  return { plans, subscription, config };
}

export async function billingCheckout(
  planId: CheckoutPlanId,
  interval: BillingInterval = "monthly",
  callbackUrl?: string,
): Promise<BillingCheckoutResult> {
  return authedJson<BillingCheckoutResult>(
    "/api/billing/checkout",
    {
      method: "POST",
      body: JSON.stringify({
        planId,
        interval,
        ...(callbackUrl ? { callbackUrl } : {}),
      }),
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
  const data = await authedJson<{
    verified?: unknown;
    status?: unknown;
    message?: unknown;
    subscription?: unknown;
    plan?: unknown;
  }>(
    `/api/billing/verify?${qs.toString()}`,
    { method: "GET" },
    "Payment verification failed",
    BillingApiError,
    options,
  );
  return {
    verified: data.verified === true,
    status: typeof data.status === "string" ? data.status : undefined,
    message: typeof data.message === "string" ? data.message : undefined,
    subscription: parseBillingSubscription(data.subscription) ?? undefined,
    plan:
      parseUserPlan(data.plan) ??
      parseUserPlan(data.subscription) ??
      undefined,
  };
}

export async function resumeBillingSubscription(): Promise<BillingCancelResult> {
  const data = await authedJson<{ message?: string; subscription?: unknown }>(
    "/api/billing/resume",
    { method: "POST" },
    "Failed to resume subscription",
    BillingApiError,
  );
  const subscription = parseBillingSubscription(data.subscription);
  if (!subscription) {
    throw new BillingApiError("Subscription missing from resume response.", 500, data);
  }
  return { message: data.message, subscription };
}

export async function cancelBillingSubscription(): Promise<BillingCancelResult> {
  const data = await authedJson<{ message?: string; subscription?: unknown }>(
    "/api/billing/cancel",
    { method: "POST" },
    "Failed to cancel subscription",
    BillingApiError,
  );
  const subscription = parseBillingSubscription(data.subscription);
  if (!subscription) {
    throw new BillingApiError("Subscription missing from cancel response.", 500, data);
  }
  return { message: data.message, subscription };
}

export async function fetchBillingConfig(): Promise<BillingConfig | null> {
  try {
    return await publicBillingJson<BillingConfig>(
      "/api/billing/config",
      "Failed to load billing config",
    );
  } catch {
    return null;
  }
}

/** Redirect to Paystack hosted checkout (full page navigation). */
export async function startBillingCheckout(
  planId: CheckoutPlanId,
  interval: BillingInterval = "monthly",
): Promise<void> {
  const config = await fetchBillingConfig();
  if (config && config.configured === false) {
    throw new BillingApiError("Billing is not available yet", 503, {
      code: "NOT_CONFIGURED",
    });
  }
  const callbackUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${BILLING_CALLBACK_PATH}`
      : undefined;
  const data = await billingCheckout(planId, interval, callbackUrl);
  const url = data.checkout?.authorizationUrl?.trim();
  const reference = data.checkout?.reference?.trim();
  if (!url) {
    throw new BillingApiError("Checkout URL missing from response.", 500, data);
  }
  if (reference) rememberBillingCheckoutReference(reference);

  const studio = getAuth()?.user?.studio;
  const slug = studio?.companySlug?.trim();
  if (slug) {
    rememberBillingStudioContext({
      slug,
      studioUrl: studio?.studioUrl,
      studioUrlSuffix: studio?.studioUrlSuffix,
    });
  }

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
