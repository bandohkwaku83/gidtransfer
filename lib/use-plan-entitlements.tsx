"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  applyAuthUserPlan,
  fetchAuthMe,
  preferFresherUserPlan,
  refreshAuthSessionFromApi,
} from "@/lib/auth-api";
import { getAuth } from "@/lib/auth-demo";
import type { CheckoutPlanId } from "@/lib/billing-api";
import { subscribePlanApiError } from "@/lib/plan-api-errors";
import {
  canUseFeature,
  featuresFromUserPlan,
  nextCheckoutPlanId,
  parseGalleryLimitReached,
  parsePlanFeatureRequired,
  parseStorageLimitReached,
  parseSubscriptionViewOnly,
  parseUserPlan,
  parseVideoLimitReached,
  suggestedCheckoutPlanId,
  isCheckoutPlanId,
  type PlanFeatureRequiredError,
  type PlanFeatures,
  type UserPlan,
} from "@/lib/plan-entitlements";
import { rememberVideoUsage } from "@/lib/video-usage";

export type PlanUpgradeRequest = {
  feature?: string;
  message?: string;
  requiredPlans?: string[];
  suggestedPlanId?: CheckoutPlanId | null;
  trialExpired?: boolean;
};

type PlanEntitlementsContextValue = {
  plan: UserPlan | null;
  features: PlanFeatures;
  can: (key: string) => boolean;
  trialExpired: boolean;
  trialActive: boolean;
  viewOnly: boolean;
  inGracePeriod: boolean;
  refreshPlan: () => Promise<UserPlan | null>;
  applyPlan: (plan: UserPlan) => void;
  upgrade: PlanUpgradeRequest | null;
  openUpgrade: (request?: PlanUpgradeRequest) => void;
  closeUpgrade: () => void;
  handlePlanError: (err: unknown) => boolean;
};

const PlanEntitlementsContext = createContext<PlanEntitlementsContextValue | null>(null);

export function PlanEntitlementsProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<UserPlan | null>(() => getAuth()?.user?.plan ?? null);
  const [upgrade, setUpgrade] = useState<PlanUpgradeRequest | null>(null);
  const planRef = useRef(plan);
  planRef.current = plan;

  const applyPlan = useCallback((next: UserPlan) => {
    applyAuthUserPlan(next);
    setPlan(next);
  }, []);

  const refreshPlan = useCallback(async () => {
    const prior = getAuth()?.user?.plan ?? planRef.current;
    try {
      const { user } = await fetchAuthMe({ redirectOn401: false });
      const next = refreshAuthSessionFromApi(user);
      const parsed =
        preferFresherUserPlan(next?.plan ?? parseUserPlan(user.plan), prior) ??
        next?.plan ??
        parseUserPlan(user.plan);
      if (parsed) applyAuthUserPlan(parsed);
      setPlan(parsed ?? null);
      return parsed ?? null;
    } catch {
      const stored = getAuth()?.user?.plan ?? prior ?? null;
      setPlan(stored);
      return stored;
    }
  }, []);

  useEffect(() => {
    void refreshPlan();
  }, [refreshPlan]);

  const features = useMemo(() => featuresFromUserPlan(plan), [plan]);

  const can = useCallback((key: string) => canUseFeature(features, key), [features]);

  const openUpgrade = useCallback((request: PlanUpgradeRequest = {}) => {
    setUpgrade({
      ...request,
      suggestedPlanId:
        request.suggestedPlanId ??
        suggestedCheckoutPlanId(request.requiredPlans, request.feature),
    });
  }, []);

  const closeUpgrade = useCallback(() => setUpgrade(null), []);

  const handlePlanError = useCallback(
    (err: unknown) => {
      const featureRequired = parsePlanFeatureRequired(err);
      if (featureRequired) {
        openUpgrade({
          feature: featureRequired.feature,
          message: featureRequired.message,
          requiredPlans: featureRequired.requiredPlans,
          suggestedPlanId: featureRequired.suggestedPlanId,
          trialExpired: featureRequired.trialExpired,
        });
        return true;
      }
      const galleryLimit = parseGalleryLimitReached(err);
      if (galleryLimit) {
        openUpgrade({
          feature: "clientGalleries",
          message: galleryLimit.message,
          suggestedPlanId: nextCheckoutPlanId(plan?.planId),
        });
        return true;
      }
      const videoLimit = parseVideoLimitReached(err);
      if (videoLimit) {
        rememberVideoUsage({
          usedBytes: videoLimit.videoUsedBytes,
          limitBytes:
            videoLimit.videoUploadLimitBytes ?? plan?.videoUploadLimitBytes ?? null,
        });
        openUpgrade({
          feature: videoLimit.feature || "videoUploads",
          message: videoLimit.message,
          suggestedPlanId: nextCheckoutPlanId(plan?.planId),
        });
        return true;
      }
      const storageLimit = parseStorageLimitReached(err);
      if (storageLimit) {
        openUpgrade({
          feature: "storage",
          message: storageLimit.message,
          suggestedPlanId: nextCheckoutPlanId(plan?.planId),
        });
        return true;
      }
      if (parseSubscriptionViewOnly(err)) return true;
      return false;
    },
    [openUpgrade, plan],
  );

  useEffect(() => {
    return subscribePlanApiError((event) => {
      if (event.code === "SUBSCRIPTION_VIEW_ONLY") return;
      if (event.code === "PLAN_FEATURE_REQUIRED") {
        const suggested = event.suggestedPlanId;
        openUpgrade({
          feature: event.feature,
          message: event.message,
          requiredPlans: event.requiredPlans,
          suggestedPlanId: isCheckoutPlanId(suggested ?? "")
            ? (suggested as CheckoutPlanId)
            : suggestedCheckoutPlanId(event.requiredPlans, event.feature),
          trialExpired: event.trialExpired,
        });
        return;
      }
      if (event.code === "GALLERY_LIMIT_REACHED") {
        openUpgrade({
          feature: "clientGalleries",
          message: event.message,
          suggestedPlanId: nextCheckoutPlanId(plan?.planId),
        });
        return;
      }
      if (event.code === "VIDEO_LIMIT_REACHED") {
        openUpgrade({
          feature: event.feature || "videoUploads",
          message: event.message,
          suggestedPlanId: nextCheckoutPlanId(plan?.planId),
        });
      }
    });
  }, [openUpgrade, plan?.planId]);

  const trialExpired = plan?.trialExpired === true;
  const trialActive = plan?.trialActive === true;
  const viewOnly = plan?.viewOnly === true;
  const inGracePeriod = plan?.inGracePeriod === true;

  const value = useMemo<PlanEntitlementsContextValue>(
    () => ({
      plan,
      features,
      can,
      trialExpired,
      trialActive,
      viewOnly,
      inGracePeriod,
      refreshPlan,
      applyPlan,
      upgrade,
      openUpgrade,
      closeUpgrade,
      handlePlanError,
    }),
    [
      plan,
      features,
      can,
      trialExpired,
      trialActive,
      viewOnly,
      inGracePeriod,
      refreshPlan,
      applyPlan,
      upgrade,
      openUpgrade,
      closeUpgrade,
      handlePlanError,
    ],
  );

  return (
    <PlanEntitlementsContext.Provider value={value}>{children}</PlanEntitlementsContext.Provider>
  );
}

function readPlanFromSession(): UserPlan | null {
  return getAuth()?.user?.plan ?? null;
}

/** Works inside the dashboard provider; falls back to the persisted auth session. */
export function usePlanEntitlements(): PlanEntitlementsContextValue {
  const ctx = useContext(PlanEntitlementsContext);
  const sessionPlan = readPlanFromSession();
  // Context is the live source after checkout; session can lag until /me catches up.
  const plan = ctx?.plan ?? sessionPlan ?? null;
  const features = featuresFromUserPlan(plan);

  if (ctx) {
    return {
      ...ctx,
      plan,
      features,
      can: (key: string) => canUseFeature(features, key),
      trialExpired: plan?.trialExpired === true,
      trialActive: plan?.trialActive === true,
      viewOnly: plan?.viewOnly === true,
      inGracePeriod: plan?.inGracePeriod === true,
    };
  }

  return {
    plan,
    features,
    can: (key: string) => canUseFeature(features, key),
    trialExpired: plan?.trialExpired === true,
    trialActive: plan?.trialActive === true,
    viewOnly: plan?.viewOnly === true,
    inGracePeriod: plan?.inGracePeriod === true,
    refreshPlan: async () => readPlanFromSession(),
    applyPlan: (next) => {
      applyAuthUserPlan(next);
    },
    upgrade: null,
    openUpgrade: () => undefined,
    closeUpgrade: () => undefined,
    handlePlanError: (err: unknown): boolean =>
      parsePlanFeatureRequired(err) != null ||
      parseGalleryLimitReached(err) != null ||
      parseVideoLimitReached(err) != null ||
      parseStorageLimitReached(err) != null ||
      parseSubscriptionViewOnly(err) != null,
  };
}

export function isPlanFeatureRequiredError(err: unknown): err is PlanFeatureRequiredError {
  return parsePlanFeatureRequired(err) != null;
}
