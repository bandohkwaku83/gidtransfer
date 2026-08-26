import { HttpError } from "@/lib/http";

/** Canonical plan ids — never gate product features on these; use `features`. */
export type BillingPlanId = "free" | "basic" | "pro" | "premium";
export type CheckoutPlanId = Exclude<BillingPlanId, "free">;

export type PlanFeatureKey =
  | "clientGalleries"
  | "shareLinks"
  | "clientSelections"
  | "passwordProtectedGalleries"
  | "downloadControl"
  | "textWatermark"
  | "bookings"
  | "bookingReminders"
  | "clientsCrm"
  | "incomeTracking"
  | "customLabels"
  | "analyticsDashboard"
  | "galleryComments"
  | "gallerySets"
  | "videoUploads"
  | "smsNotifications"
  | "videoDash"
  | "customSmsSender"
  | "customBranding"
  | "advancedAnalytics"
  | "restoreTrashItems"
  | "galleryAi"
  | "collaboration"
  | "studioTeam";

export type PlanFeatures = Partial<Record<PlanFeatureKey | string, boolean>>;

export type PlanSupportTier = "contact" | "priority" | "premium";

export type UserPlanSubscription = {
  status: string;
  /** Next monthly renewal (same as API `renewalDate`). */
  currentPeriodEnd: string | null;
  renewalDate: string | null;
  /** When the user last upgraded / switched paid plans. */
  upgradedAt: string | null;
  cancelAtPeriodEnd: boolean;
  pendingPlanId: BillingPlanId | null;
  trialEndsAt: string | null;
  trialActive: boolean;
  trialExpired: boolean;
};

export type UserPlan = {
  planId: BillingPlanId;
  planName: string;
  planLabel: string;
  storageLimitBytes: number;
  storageLabel: string;
  maxGalleries: number | null;
  maxTeamMembers: number | null;
  videoUploadLimitBytes: number;
  videoUploadLimitLabel: string;
  perks: string[];
  features: PlanFeatures;
  featureKeys: string[];
  supportTier: PlanSupportTier;
  priceGhs: number;
  interval: "monthly" | null;
  trialDays: number | null;
  trialEndsAt: string | null;
  trialActive: boolean;
  trialExpired: boolean;
  subscription: UserPlanSubscription;
};

export type PlanFeatureRequiredError = {
  message: string;
  feature: string;
  requiredPlans: BillingPlanId[];
  currentPlanId: BillingPlanId;
  trialExpired: boolean;
  suggestedPlanId: CheckoutPlanId | null;
};

export type GalleryLimitReachedError = {
  message: string;
  maxGalleries: number | null;
  activeGalleries: number | null;
};

export type VideoLimitReachedError = {
  message: string;
  feature: string;
  videoUsedBytes: number | null;
  videoUploadLimitBytes: number | null;
};

export type StorageLimitReachedError = {
  message: string;
  usedBytes: number | null;
  limitBytes: number | null;
};

const PLAN_IDS: BillingPlanId[] = ["free", "basic", "pro", "premium"];
const CHECKOUT_PLAN_IDS: CheckoutPlanId[] = ["basic", "pro", "premium"];

/** Legacy API / Paystack aliases → canonical id. */
const ALIAS_TO_PLAN_ID: Record<string, BillingPlanId> = {
  free: "free",
  basic: "basic",
  starter: "basic",
  pro: "pro",
  business: "pro",
  premium: "premium",
  studio: "premium",
};

export const PLAN_RANK: Record<BillingPlanId, number> = {
  free: 0,
  basic: 1,
  pro: 2,
  premium: 3,
};

/** Free-trial feature defaults when `/api/auth/me` has not returned a plan yet. */
export const FALLBACK_FREE_FEATURES: PlanFeatures = {
  clientGalleries: true,
  shareLinks: true,
  clientSelections: true,
  passwordProtectedGalleries: true,
  downloadControl: true,
  textWatermark: true,
  bookings: true,
  bookingReminders: true,
  clientsCrm: true,
  incomeTracking: true,
  customLabels: true,
  analyticsDashboard: true,
  galleryComments: false,
  gallerySets: false,
  videoUploads: false,
  smsNotifications: false,
  videoDash: false,
  customSmsSender: false,
  customBranding: false,
  advancedAnalytics: false,
  restoreTrashItems: false,
  galleryAi: false,
  collaboration: false,
  studioTeam: false,
};

const FEATURE_CHECKOUT_DEFAULT: Partial<Record<string, CheckoutPlanId>> = {
  galleryComments: "basic",
  gallerySets: "basic",
  videoUploads: "basic",
  smsNotifications: "basic",
  videoDash: "basic",
  customSmsSender: "pro",
  customBranding: "pro",
  advancedAnalytics: "pro",
  restoreTrashItems: "pro",
  galleryAi: "premium",
  collaboration: "premium",
  studioTeam: "premium",
  storage: "basic",
};

export function isBillingPlanId(value: string): value is BillingPlanId {
  return PLAN_IDS.includes(value as BillingPlanId);
}

export function isCheckoutPlanId(value: string): value is CheckoutPlanId {
  return CHECKOUT_PLAN_IDS.includes(value as CheckoutPlanId);
}

/** Prefer canonical ids; accepts legacy aliases (`starter` / `business` / `studio`). */
export function normalizePlanId(value: string | null | undefined): BillingPlanId | null {
  if (!value?.trim()) return null;
  const key = value.trim().toLowerCase();
  return ALIAS_TO_PLAN_ID[key] ?? (isBillingPlanId(key) ? key : null);
}

export function normalizeCheckoutPlanId(
  value: string | null | undefined,
): CheckoutPlanId | null {
  const id = normalizePlanId(value);
  return id && isCheckoutPlanId(id) ? id : null;
}

export function canUseFeature(
  features: PlanFeatures | null | undefined,
  key: string,
): boolean {
  return features?.[key] === true;
}

/** Prefer `user.plan.features` — never branch on planId for product features. */
export function can(
  user: { plan?: UserPlan | null } | null | undefined,
  feature: PlanFeatureKey | string,
): boolean {
  return canUseFeature(user?.plan?.features, feature);
}

export function isTrialExpired(
  user: { plan?: UserPlan | null } | null | undefined,
): boolean {
  return user?.plan?.trialExpired === true;
}

export function isTrialActive(
  user: { plan?: UserPlan | null } | null | undefined,
): boolean {
  return user?.plan?.trialActive === true;
}

export function galleryLimitLabel(plan: Pick<UserPlan, "maxGalleries"> | null | undefined): string {
  if (plan == null || plan.maxGalleries == null) return "Unlimited";
  return String(plan.maxGalleries);
}

export function isAtGalleryLimit(
  plan: Pick<UserPlan, "maxGalleries" | "trialExpired"> | null | undefined,
  used: number,
): boolean {
  if (plan?.trialExpired === true) return true;
  const limit = plan?.maxGalleries;
  if (limit == null) return false;
  return used >= limit;
}

export function nextCheckoutPlanId(
  currentPlanId: BillingPlanId | null | undefined,
): CheckoutPlanId {
  const rank = currentPlanId ? (PLAN_RANK[currentPlanId] ?? 0) : 0;
  if (rank < PLAN_RANK.basic) return "basic";
  if (rank < PLAN_RANK.pro) return "pro";
  return "premium";
}

export function suggestedCheckoutPlanId(
  requiredPlans?: string[] | null,
  feature?: string | null,
): CheckoutPlanId | null {
  const fromRequired = requiredPlans
    ?.map((id) => normalizeCheckoutPlanId(id))
    .find((id): id is CheckoutPlanId => id != null);
  if (fromRequired) return fromRequired;
  if (feature && FEATURE_CHECKOUT_DEFAULT[feature]) {
    return FEATURE_CHECKOUT_DEFAULT[feature] ?? null;
  }
  return "basic";
}

export function planCtaLabel(input: {
  planId: BillingPlanId;
  current: boolean;
  available: boolean;
  currentPlanId?: BillingPlanId | null;
  trialActive?: boolean;
}): string {
  if (input.current && input.planId === "free" && input.trialActive) {
    return "Trial active";
  }
  if (input.current) return "Current plan";
  if (!input.available) return "Coming soon";
  if (input.planId === "free") return "Included";
  const currentRank = input.currentPlanId ? (PLAN_RANK[input.currentPlanId] ?? 0) : 0;
  const targetRank = PLAN_RANK[input.planId] ?? 0;
  return targetRank > currentRank ? "Upgrade" : "Switch";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function readNullableLimit(value: unknown): number | null {
  if (value == null) return null;
  return readNumber(value);
}

function readStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function readSupportTier(value: unknown): PlanSupportTier {
  const raw = readString(value)?.toLowerCase();
  if (raw === "priority" || raw === "premium" || raw === "contact") return raw;
  if (raw === "email" || raw === "standard") return "contact";
  return "contact";
}

export function parsePlanFeatures(raw: unknown): PlanFeatures {
  const obj = asRecord(raw);
  if (!obj) return {};
  const features: PlanFeatures = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "boolean") features[key] = value;
  }
  // Legacy key aliases from older API payloads
  if (features.basicAnalytics === true && features.analyticsDashboard == null) {
    features.analyticsDashboard = true;
  }
  return features;
}

export function parseUserPlan(raw: unknown): UserPlan | null {
  const obj = asRecord(raw);
  if (!obj) return null;

  const planId =
    normalizePlanId(readString(obj.planId) ?? readString(obj.id)) ?? "free";
  const planName = readString(obj.planName) ?? readString(obj.name) ?? "Free";
  const features = parsePlanFeatures(obj.features);
  const featureKeys = readStringList(obj.featureKeys);
  const sub = asRecord(obj.subscription);

  const trialEndsAt =
    readString(obj.trialEndsAt) ?? readString(sub?.trialEndsAt);
  const trialActive =
    obj.trialActive === true ||
    sub?.trialActive === true ||
    (planId === "free" &&
      trialEndsAt != null &&
      !Number.isNaN(Date.parse(trialEndsAt)) &&
      Date.parse(trialEndsAt) > Date.now());
  const trialExpired =
    obj.trialExpired === true ||
    sub?.trialExpired === true ||
    (planId === "free" && !trialActive && trialEndsAt != null);

  const supportTier = readSupportTier(obj.supportTier ?? obj.support);
  const cancelAtPeriodEnd =
    sub?.cancelAtPeriodEnd === true || obj.cancelAtPeriodEnd === true;

  const renewalDate =
    readString(sub?.renewalDate) ??
    readString(obj.renewalDate) ??
    readString(sub?.currentPeriodEnd) ??
    readString(obj.currentPeriodEnd) ??
    readString(sub?.nextPaymentDate) ??
    readString(obj.nextPaymentDate) ??
    readString(sub?.next_payment_date) ??
    readString(obj.next_payment_date) ??
    readString(sub?.periodEnd) ??
    readString(obj.periodEnd);

  const upgradedAt =
    readString(sub?.upgradedAt) ??
    readString(obj.upgradedAt) ??
    readString(sub?.upgraded_at) ??
    readString(obj.upgraded_at);

  return {
    planId,
    planName,
    planLabel: readString(obj.planLabel) ?? `${planName} plan`,
    storageLimitBytes: readNumber(obj.storageLimitBytes) ?? 0,
    storageLabel: readString(obj.storageLabel) ?? "—",
    maxGalleries: readNullableLimit(obj.maxGalleries),
    maxTeamMembers: readNullableLimit(obj.maxTeamMembers),
    videoUploadLimitBytes: readNumber(obj.videoUploadLimitBytes) ?? 0,
    videoUploadLimitLabel: readString(obj.videoUploadLimitLabel) ?? "0 B",
    perks: readStringList(obj.perks),
    features,
    featureKeys,
    supportTier,
    priceGhs: readNumber(obj.priceGhs) ?? readNumber(obj.price) ?? 0,
    interval: obj.interval === "monthly" ? "monthly" : null,
    trialDays: readNumber(obj.trialDays),
    trialEndsAt,
    trialActive,
    trialExpired,
    subscription: {
      status:
        readString(sub?.status) ??
        readString(obj.status) ??
        (planId === "free" ? "free" : "active"),
      currentPeriodEnd: renewalDate,
      renewalDate,
      upgradedAt,
      cancelAtPeriodEnd,
      pendingPlanId: normalizePlanId(
        readString(sub?.pendingPlanId) ?? readString(obj.pendingPlanId),
      ),
      trialEndsAt: readString(sub?.trialEndsAt) ?? trialEndsAt,
      trialActive: sub?.trialActive === true || trialActive,
      trialExpired: sub?.trialExpired === true || trialExpired,
    },
  };
}

export function parsePlanFeatureRequired(err: unknown): PlanFeatureRequiredError | null {
  const body =
    err instanceof HttpError && err.body && typeof err.body === "object"
      ? (err.body as Record<string, unknown>)
      : asRecord(err);
  if (!body || body.code !== "PLAN_FEATURE_REQUIRED") return null;

  const requiredPlans = Array.isArray(body.requiredPlans)
    ? body.requiredPlans
        .map((id) => (typeof id === "string" ? normalizePlanId(id) : null))
        .filter((id): id is BillingPlanId => id != null)
    : [];
  const feature = readString(body.feature) ?? "";
  const currentPlanId = normalizePlanId(readString(body.currentPlanId)) ?? "free";
  const message =
    readString(body.message) ??
    "This feature is available on a higher plan.";

  return {
    message,
    feature,
    requiredPlans,
    currentPlanId,
    trialExpired: body.trialExpired === true,
    suggestedPlanId: suggestedCheckoutPlanId(requiredPlans, feature),
  };
}

export function parseGalleryLimitReached(err: unknown): GalleryLimitReachedError | null {
  const body =
    err instanceof HttpError && err.body && typeof err.body === "object"
      ? (err.body as Record<string, unknown>)
      : asRecord(err);
  if (!body || body.code !== "GALLERY_LIMIT_REACHED") return null;

  return {
    message:
      readString(body.message) ??
      "Gallery limit reached. Upgrade for more galleries.",
    maxGalleries: readNullableLimit(body.maxGalleries),
    activeGalleries: readNullableLimit(body.activeGalleries),
  };
}

export function parseVideoLimitReached(err: unknown): VideoLimitReachedError | null {
  const body =
    err instanceof HttpError && err.body && typeof err.body === "object"
      ? (err.body as Record<string, unknown>)
      : asRecord(err);
  if (!body || body.code !== "VIDEO_LIMIT_REACHED") return null;

  return {
    message:
      readString(body.message) ??
      "Video storage limit reached. Upgrade for more video space.",
    feature: readString(body.feature) ?? "videoUploads",
    videoUsedBytes: readNullableLimit(body.videoUsedBytes),
    videoUploadLimitBytes: readNullableLimit(body.videoUploadLimitBytes),
  };
}

export function parseStorageLimitReached(err: unknown): StorageLimitReachedError | null {
  const body =
    err instanceof HttpError && err.body && typeof err.body === "object"
      ? (err.body as Record<string, unknown>)
      : asRecord(err);
  if (!body) return null;
  const code = readString(body.code);
  if (code !== "STORAGE_LIMIT_REACHED" && code !== "PLAN_STORAGE_LIMIT") return null;

  return {
    message:
      readString(body.message) ??
      "Storage limit reached. Upgrade for more space.",
    usedBytes: readNullableLimit(body.usedBytes),
    limitBytes: readNullableLimit(body.limitBytes ?? body.storageLimitBytes),
  };
}

export function featuresFromUserPlan(plan: UserPlan | null | undefined): PlanFeatures {
  if (plan?.trialExpired) {
    return Object.fromEntries(
      Object.keys(FALLBACK_FREE_FEATURES).map((key) => [key, false]),
    ) as PlanFeatures;
  }
  return plan?.features ?? FALLBACK_FREE_FEATURES;
}

export function sortBillingPlans<T extends { id: string }>(plans: T[]): T[] {
  return [...plans].sort(
    (a, b) =>
      (PLAN_RANK[a.id as BillingPlanId] ?? 99) - (PLAN_RANK[b.id as BillingPlanId] ?? 99),
  );
}
