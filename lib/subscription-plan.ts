import { getAuth } from "@/lib/auth-demo";
import { SEED_PROJECTS, loadAllProjects } from "@/lib/demo-data";
import { FoldersApiError } from "@/lib/folders/types";
import type { BillingPlanId } from "@/lib/plan-entitlements";
import { normalizePlanId } from "@/lib/plan-entitlements";
import {
  computeDemoStorageTotalBytes,
  estimateDemoBytesForNewFinalAssets,
  estimateDemoBytesForNewRawAssets,
} from "@/lib/usage-api";

export type PlanId = BillingPlanId;

export type PlanDefinition = {
  id: PlanId;
  label: string;
  description: string;
  storageBytes: number;
  /** null = unlimited */
  maxGalleries: number | null;
  priceLabel: string;
  perks: string[];
};

const SUBSCRIPTION_BY_EMAIL_KEY = "gidostorage_subscription_by_email_v1";

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    label: "Free",
    description: "Try the product with a few clients (30-day trial).",
    storageBytes: 5 * 1024 * 1024 * 1024,
    maxGalleries: 3,
    priceLabel: "Free (30-day trial)",
    perks: [
      "5 GB Cloud Storage",
      "Up to 3 galleries",
      "Client selections & share links",
      "Text watermarks",
      "Bookings, CRM & income tracking",
      "Analytics dashboard",
    ],
  },
  basic: {
    id: "basic",
    label: "Basic",
    description: "Share by SMS and deliver adaptive video.",
    storageBytes: 25 * 1024 * 1024 * 1024,
    maxGalleries: 10,
    priceLabel: "GH₵ 40 / mo",
    perks: [
      "25 GB Cloud Storage",
      "Up to 10 galleries",
      "Everything in Free, plus:",
      "SMS notifications",
      "Adaptive video (DASH)",
      "Priority support",
    ],
  },
  pro: {
    id: "pro",
    label: "Pro",
    description: "Branded downloads and deeper insights.",
    storageBytes: 100 * 1024 * 1024 * 1024,
    maxGalleries: 50,
    priceLabel: "GH₵ 70 / mo",
    perks: [
      "100 GB Cloud Storage",
      "Up to 50 galleries",
      "Everything in Basic, plus:",
      "Custom SMS sender ID",
      "Logo watermark on downloads",
      "Advanced analytics",
      "Restore from trash",
    ],
  },
  premium: {
    id: "premium",
    label: "Premium",
    description:
      "Top studio plan — Gallery AI, studio team, and shared shoots with other photographers.",
    storageBytes: 250 * 1024 * 1024 * 1024,
    maxGalleries: null,
    priceLabel: "GH₵ 120 / mo · GH₵ 1,300 / yr",
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
  },
};

const PLAN_IDS = new Set<PlanId>(["free", "basic", "pro", "premium"]);

function normEmail(email: string) {
  return email.trim().toLowerCase();
}

function readPlanMap(): Record<string, PlanId> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SUBSCRIPTION_BY_EMAIL_KEY);
    if (!raw) return {};
    const v = JSON.parse(raw) as unknown;
    return v && typeof v === "object" ? (v as Record<string, PlanId>) : {};
  } catch {
    return {};
  }
}

function writePlanMap(map: Record<string, PlanId>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SUBSCRIPTION_BY_EMAIL_KEY, JSON.stringify(map));
}

function accountEmail(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const a = getAuth();
  return a?.user?.email ?? a?.email;
}

function coerceStoredPlanId(value: string | undefined): PlanId {
  if (!value) return "free";
  const normalized = normalizePlanId(value);
  return normalized && PLAN_IDS.has(normalized) ? normalized : "free";
}

export function getSubscriptionPlanIdForEmail(email: string | undefined | null): PlanId {
  if (!email?.trim()) return "free";
  if (typeof window === "undefined") return "free";
  return coerceStoredPlanId(readPlanMap()[normEmail(email)]);
}

export function getSubscriptionPlanId(): PlanId {
  return getSubscriptionPlanIdForEmail(accountEmail());
}

export function getActivePlanDefinition(): PlanDefinition {
  if (typeof window !== "undefined") {
    const plan = getAuth()?.user?.plan;
    if (plan) {
      return {
        id: plan.planId,
        label: plan.planName,
        description: plan.planLabel,
        storageBytes: plan.storageLimitBytes,
        maxGalleries: plan.maxGalleries,
        priceLabel:
          plan.priceGhs <= 0
            ? plan.trialActive
              ? "Free (trial)"
              : "Free"
            : `GH₵ ${plan.priceGhs}${plan.interval === "yearly" ? " / yr" : plan.interval === "monthly" ? " / mo" : ""}`,
        perks: plan.perks,
      };
    }
  }
  return PLANS[getSubscriptionPlanId()];
}

export function setSubscriptionPlanIdForEmail(email: string, planId: PlanId): void {
  if (typeof window === "undefined") return;
  const key = normEmail(email);
  if (!key) return;
  const next = { ...readPlanMap(), [key]: coerceStoredPlanId(planId) };
  writePlanMap(next);
}

const _seedGalleryIds = new Set(SEED_PROJECTS.map((p) => p.id));

/** Galleries you created (demo seeds do not count toward limits). */
export function countGalleriesTowardQuota(): number {
  return loadAllProjects().filter((p) => !_seedGalleryIds.has(p.id)).length;
}

export function assertCanCreateGallery(): void {
  const plan = getActivePlanDefinition();
  if (plan.maxGalleries === null) return;
  const n = countGalleriesTowardQuota();
  if (n >= plan.maxGalleries) {
    throw new FoldersApiError(
      `${plan.label} includes up to ${plan.maxGalleries} galleries. Upgrade your plan in Settings to add more.`,
      400,
      null,
    );
  }
}

export function assertStorageAllowsDemoRawAdds(assetCount: number): void {
  assertStorageAllowsAdditionalBytes(estimateDemoBytesForNewRawAssets(assetCount));
}

export function assertStorageAllowsDemoFinalAdds(assetCount: number): void {
  assertStorageAllowsAdditionalBytes(estimateDemoBytesForNewFinalAssets(assetCount));
}

export function assertStorageAllowsAdditionalBytes(additionalBytes: number): void {
  if (additionalBytes <= 0) return;
  const plan = getActivePlanDefinition();
  const used = computeDemoStorageTotalBytes();
  if (used + additionalBytes > plan.storageBytes) {
    const g = plan.storageBytes / (1024 * 1024 * 1024);
    const cap =
      Math.abs(g - Math.round(g)) < 1e-6 ? `${Math.round(g)} GB` : `${g.toFixed(1)} GB`;
    throw new FoldersApiError(
      `Storage limit reached for ${plan.label} (${cap} included). Free up space or choose a larger plan in Settings.`,
      400,
      null,
    );
  }
}
