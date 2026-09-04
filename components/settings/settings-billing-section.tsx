"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  CircleCheck,
  Info,
} from "lucide-react";
import {
  FormModal,
} from "@/components/ui/form-modal";
import { DashboardSpin, SettingsWorkflowSkeleton } from "@/components/ui/skeletons";
import {
  cancelBillingSubscription,
  clearBillingCheckoutReference,
  fetchBillingPageData,
  formatBillingDate,
  formatPlanPriceGhs,
  isBillingNotConfigured,
  isBillingPaymentConfirmed,
  isCheckoutPlanId,
  readBillingCheckoutReference,
  readBillingErrorMessage,
  reconcilePendingBillingPayment,
  rememberBillingCheckoutReference,
  resumeBillingSubscription,
  paystackReferenceFromSearchParams,
  preferConfirmedSubscription,
  startBillingCheckout,
  type BillingInterval,
  type BillingPlan,
  type BillingSubscription,
  type CheckoutPlanId,
} from "@/lib/billing-api";
import { planIntervalAvailable, planPrice } from "@/lib/plan";
import { planCtaLabel } from "@/lib/plan-entitlements";
import { galleriesOverviewDisplay, type ApiSettingsOverview } from "@/lib/settings-api";
import { formatStorageBytes } from "@/lib/storage-api";
import { usePlanEntitlements } from "@/lib/use-plan-entitlements";
import { readVideoUsage } from "@/lib/video-usage";
import { cn } from "@/lib/utils";

type SettingsBillingSectionProps = {
  overview: ApiSettingsOverview | null;
  loading?: boolean;
  paymentSuccess?: boolean;
  paymentFailed?: boolean;
  onPaymentSuccessAcknowledged?: () => void;
  onPaymentFailedAcknowledged?: () => void;
  onBillingUpdated?: () => void | Promise<void>;
};

function isPendingCheckoutPlan(
  plan: BillingPlan,
  subscription: BillingSubscription | null,
): boolean {
  return (
    subscription?.status === "pending" &&
    subscription.pendingPlanId === plan.id
  );
}

function planActionLabel(
  plan: BillingPlan,
  subscription: BillingSubscription | null,
  interval: BillingInterval,
): string {
  if (isPendingCheckoutPlan(plan, subscription)) return "Continue on Paystack";
  return planCtaLabel({
    planId: plan.id,
    current: plan.current,
    available: planIntervalAvailable(plan, interval),
    currentPlanId: subscription?.planId,
    currentInterval: subscription?.interval,
    selectedInterval: interval,
    trialActive: subscription?.trialActive === true,
    viewOnly: subscription?.viewOnly === true,
  });
}

function planPerkList(plan: BillingPlan, limit = 6): string[] {
  const raw = plan.perks?.length
    ? plan.perks
    : plan.storageLabel
      ? [`${plan.storageLabel} storage`]
      : [];
  return raw.filter((perk) => !perk.endsWith(":")).slice(0, limit);
}

function withCurrentPlan(
  plans: BillingPlan[],
  subscription: BillingSubscription | null,
): BillingPlan[] {
  if (!subscription) return plans;
  return plans.map((item) => ({
    ...item,
    current: item.id === subscription.planId,
  }));
}

function formatPriceAmount(priceGhs: number): string {
  if (priceGhs <= 0) return "Free";
  return `GH₵ ${priceGhs}`;
}

function PerkCheck() {
  return (
    <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand text-white dark:bg-brand-on-dark dark:text-brand-ink">
      <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden />
    </span>
  );
}

export function SettingsBillingSection({
  overview,
  loading: pageLoading = false,
  paymentSuccess = false,
  paymentFailed = false,
  onPaymentSuccessAcknowledged,
  onPaymentFailedAcknowledged,
  onBillingUpdated,
}: SettingsBillingSectionProps) {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [subscription, setSubscription] = useState<BillingSubscription | null>(null);
  const [billingLoading, setBillingLoading] = useState(true);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [billingUnavailable, setBillingUnavailable] = useState(false);
  const [checkoutPlanId, setCheckoutPlanId] = useState<CheckoutPlanId | null>(null);
  const [planErrors, setPlanErrors] = useState<Partial<Record<CheckoutPlanId, string>>>({});
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [resuming, setResuming] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [reconcilingPayment, setReconcilingPayment] = useState(false);
  const [storedCheckoutRef, setStoredCheckoutRef] = useState(false);
  const { refreshPlan, applyPlan, plan } = usePlanEntitlements();
  const verifiedSubscriptionRef = useRef<BillingSubscription | null>(null);

  const refreshStoredCheckoutRef = useCallback(() => {
    setStoredCheckoutRef(Boolean(readBillingCheckoutReference()));
  }, []);

  const onBillingUpdatedRef = useRef(onBillingUpdated);
  const onPaymentSuccessAcknowledgedRef = useRef(onPaymentSuccessAcknowledged);
  useEffect(() => {
    onBillingUpdatedRef.current = onBillingUpdated;
  }, [onBillingUpdated]);
  useEffect(() => {
    onPaymentSuccessAcknowledgedRef.current = onPaymentSuccessAcknowledged;
  }, [onPaymentSuccessAcknowledged]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reference = paystackReferenceFromSearchParams(
      new URLSearchParams(window.location.search),
    );
    if (reference) {
      rememberBillingCheckoutReference(reference);
      refreshStoredCheckoutRef();
    } else {
      refreshStoredCheckoutRef();
    }
  }, [refreshStoredCheckoutRef]);

  const loadBilling = useCallback(async () => {
    setBillingError(null);
    setBillingUnavailable(false);
    try {
      const data = await fetchBillingPageData();
      setSubscription(data.subscription);
      setPlans(withCurrentPlan(data.plans, data.subscription));
      if (data.config && data.config.configured === false) {
        setBillingUnavailable(true);
      }
    } catch (err) {
      if (isBillingNotConfigured(err)) {
        setBillingUnavailable(true);
        setPlans([]);
        setSubscription(null);
      } else {
        setBillingError(await readBillingErrorMessage(err, "Could not load billing."));
      }
    } finally {
      setBillingLoading(false);
    }
  }, []);

  const tryReconcilePendingPayment = useCallback(async () => {
    const reference = readBillingCheckoutReference();
    if (!reference) return false;

    setReconcilingPayment(true);
    try {
      const result = await reconcilePendingBillingPayment({ redirectOn401: false });
      if (!result) return false;

      // Prefer verify payload — GET /subscription can still say "pending" briefly.
      if (result.subscription) {
        verifiedSubscriptionRef.current = result.subscription;
        setSubscription(result.subscription);
      }
      if (result.plan && isBillingPaymentConfirmed(result)) {
        applyPlan(result.plan);
      }

      if (isBillingPaymentConfirmed(result)) {
        if (result.subscription?.status !== "pending") {
          clearBillingCheckoutReference();
          refreshStoredCheckoutRef();
          try {
            const data = await fetchBillingPageData();
            const next = preferConfirmedSubscription(
              data.subscription,
              result.subscription,
            );
            if (next) setSubscription(next);
            setPlans(withCurrentPlan(data.plans, next ?? result.subscription ?? data.subscription));
            if (data.config && data.config.configured === false) {
              setBillingUnavailable(true);
            }
          } catch {
            /* keep verify subscription */
          }
          await refreshPlan();
          if (result.plan) applyPlan(result.plan);
          await onBillingUpdatedRef.current?.();
          setBillingLoading(false);
          return true;
        }
        await loadBilling();
        await refreshPlan();
        await onBillingUpdatedRef.current?.();
        return true;
      }

      clearBillingCheckoutReference();
      refreshStoredCheckoutRef();
      await loadBilling();
      await refreshPlan();
      return false;
    } catch {
      /* verification may fail if webhook already processed or session expired */
    } finally {
      setReconcilingPayment(false);
    }
    return false;
  }, [applyPlan, loadBilling, refreshPlan, refreshStoredCheckoutRef]);

  useEffect(() => {
    void loadBilling();
  }, [loadBilling]);

  useEffect(() => {
    if (subscription?.interval === "yearly" || subscription?.interval === "monthly") {
      setBillingInterval(subscription.interval);
    }
  }, [subscription?.interval]);

  useEffect(() => {
    if (billingLoading || paymentSuccess) return;
    // Reconcile whenever Paystack left us a reference — not only when status is
    // already "pending" (covers re-login after session expiry on the callback).
    if (subscription?.status === "pending" || storedCheckoutRef) {
      void tryReconcilePendingPayment();
    }
  }, [
    billingLoading,
    paymentSuccess,
    subscription?.status,
    storedCheckoutRef,
    tryReconcilePendingPayment,
  ]);

  useEffect(() => {
    if (!paymentSuccess) return;

    let cancelled = false;
    let intervalId = 0;
    let attempts = 0;

    const finishSuccess = () => {
      onPaymentSuccessAcknowledgedRef.current?.();
    };

    const refreshOnce = async (): Promise<boolean> => {
      const confirmed = await tryReconcilePendingPayment();
      if (cancelled) return true;
      const data = await fetchBillingPageData().catch(() => null);
      if (cancelled) return true;
      if (!data) {
        // Verify already activated even if the list endpoints failed.
        if (confirmed) {
          setBillingLoading(false);
          finishSuccess();
          return true;
        }
        return false;
      }
      const nextSub = preferConfirmedSubscription(
        data.subscription,
        verifiedSubscriptionRef.current,
      );
      setSubscription(nextSub);
      setPlans(withCurrentPlan(data.plans, nextSub));
      setBillingLoading(false);
      const activated =
        confirmed ||
        (data.subscription != null &&
          data.subscription.planId !== "free" &&
          data.subscription.status !== "pending");
      if (activated) {
        await onBillingUpdatedRef.current?.();
        finishSuccess();
        return true;
      }
      return false;
    };

    void (async () => {
      setBillingLoading(true);
      const done = await refreshOnce();
      if (cancelled || done) return;

      intervalId = window.setInterval(() => {
        attempts += 1;
        if (attempts > 15) {
          window.clearInterval(intervalId);
          finishSuccess();
          return;
        }
        void refreshOnce().then((doneNow) => {
          if (doneNow) window.clearInterval(intervalId);
        });
      }, 2000);
    })();

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [paymentSuccess, tryReconcilePendingPayment]);

  const activePlan =
    plans.find((p) => p.current) ??
    (subscription
      ? plans.find((p) => p.id === subscription.planId)
      : undefined);

  const displayPlanName =
    subscription?.planName?.replace(/\s+plan$/i, "") ??
    activePlan?.name ??
    "Free";
  const displayIntervalLabel =
    subscription?.interval === "yearly"
      ? "Yearly"
      : subscription?.interval === "monthly"
        ? "Monthly"
        : null;
  const displayPrice = subscription
    ? formatPlanPriceGhs(subscription.priceGhs, subscription.interval)
    : activePlan
      ? formatPlanPriceGhs(planPrice(activePlan, billingInterval), billingInterval)
      : "Free";
  const renewLabel = formatBillingDate(
    subscription?.renewalDate ?? subscription?.currentPeriodEnd,
  );
  const accessUntilLabel = formatBillingDate(
    subscription?.accessUntil ?? plan?.accessUntil,
  );
  const upgradedLabel = formatBillingDate(subscription?.upgradedAt);
  const trialEndsLabel = formatBillingDate(
    subscription?.trialEndsAt ?? plan?.trialEndsAt,
  );
  const trialActive = subscription?.trialActive === true || plan?.trialActive === true;
  const trialExpired = subscription?.trialExpired === true || plan?.trialExpired === true;
  const videoLimitLabel =
    subscription?.videoUploadLimitLabel &&
    subscription.videoUploadLimitBytes != null &&
    subscription.videoUploadLimitBytes > 0
      ? subscription.videoUploadLimitLabel
      : plan?.videoUploadLimitBytes && plan.videoUploadLimitBytes > 0
        ? plan.videoUploadLimitLabel
        : null;
  const storedVideo = typeof window !== "undefined" ? readVideoUsage() : null;
  const videoLimitBytes =
    storedVideo?.limitBytes ??
    (subscription?.videoUploadLimitBytes && subscription.videoUploadLimitBytes > 0
      ? subscription.videoUploadLimitBytes
      : plan?.videoUploadLimitBytes && plan.videoUploadLimitBytes > 0
        ? plan.videoUploadLimitBytes
        : null);
  const videoUsedBytes = storedVideo?.usedBytes ?? null;
  const videoPct =
    videoLimitBytes != null && videoUsedBytes != null
      ? Math.min(100, Math.round((videoUsedBytes / videoLimitBytes) * 100))
      : null;
  const videoUsedLabel =
    videoUsedBytes != null && videoLimitBytes != null
      ? `${formatStorageBytes(videoUsedBytes)} / ${formatStorageBytes(videoLimitBytes)}`
      : null;
  const pendingPlanName =
    plans.find((p) => p.id === subscription?.pendingPlanId)?.name ??
    subscription?.planName ??
    "a paid plan";
  const showPendingActivation =
    subscription?.status === "pending" &&
    (paymentSuccess || reconcilingPayment || storedCheckoutRef);

  const galleriesUsed = overview?.galleries.used;
  const galleryMax = overview?.galleries.limit;
  const galleriesLabel = galleriesOverviewDisplay(overview?.galleries);
  const galleryPct =
    galleryMax != null && galleryMax > 0 && galleriesUsed != null
      ? Math.min(100, Math.round((galleriesUsed / galleryMax) * 100))
      : null;
  const storageLabel =
    overview?.planStorage.label ??
    subscription?.storageLabel ??
    activePlan?.storageLabel ??
    "—";
  const storagePct =
    overview?.planStorage.percentOfPlan != null
      ? Math.min(100, Math.round(overview.planStorage.percentOfPlan))
      : null;

  async function handleCheckout(plan: BillingPlan) {
    if (!isCheckoutPlanId(plan.id)) return;
    const available = planIntervalAvailable(plan, billingInterval);
    if (!available) return;
    const pendingCheckout = isPendingCheckoutPlan(plan, subscription);
    const switchInterval =
      plan.current &&
      subscription?.interval != null &&
      subscription.interval !== billingInterval;
    if (plan.current && !pendingCheckout && !switchInterval && !subscription?.viewOnly) {
      return;
    }

    setCheckoutPlanId(plan.id);
    setPlanErrors((prev) => {
      if (!isCheckoutPlanId(plan.id)) return prev;
      const next = { ...prev };
      delete next[plan.id];
      return next;
    });

    try {
      await startBillingCheckout(plan.id, billingInterval);
    } catch (err) {
      const message = await readBillingErrorMessage(err, "Checkout failed.");
      if (isCheckoutPlanId(plan.id)) {
        setPlanErrors((prev) => ({ ...prev, [plan.id]: message }));
      }
      setCheckoutPlanId(null);
    }
  }

  async function handleCancelConfirm() {
    setCancelling(true);
    setCancelError(null);
    try {
      const result = await cancelBillingSubscription();
      setSubscription(result.subscription);
      setCancelOpen(false);
      clearBillingCheckoutReference();
      setBillingLoading(true);
      await loadBilling();
      await refreshPlan();
      await onBillingUpdated?.();
    } catch (err) {
      setCancelError(await readBillingErrorMessage(err, "Could not cancel subscription."));
    } finally {
      setCancelling(false);
    }
  }

  async function handleResume() {
    setResuming(true);
    setResumeError(null);
    try {
      const result = await resumeBillingSubscription();
      setSubscription(result.subscription);
      await loadBilling();
      await refreshPlan();
      await onBillingUpdated?.();
    } catch (err) {
      setResumeError(await readBillingErrorMessage(err, "Could not resume subscription."));
    } finally {
      setResuming(false);
    }
  }

  if ((pageLoading || billingLoading) && !overview && plans.length === 0) {
    return <SettingsWorkflowSkeleton />;
  }

  const storageRemainingPct =
    storagePct != null ? Math.max(0, 100 - storagePct) : null;
  const storageCapped = Boolean(
    overview?.planStorage &&
      overview.planStorage.limitBytes > 0 &&
      overview.planStorage.usedBytes >= overview.planStorage.limitBytes,
  );
  const viewOnly = subscription?.viewOnly === true || plan?.viewOnly === true;
  const canCancelSubscription =
    !viewOnly &&
    (subscription?.canCancel === true ||
      (subscription?.canManage === true &&
        subscription.planId !== "free" &&
        subscription.status !== "cancelled" &&
        subscription.status !== "free"));
  const cancelScheduled =
    subscription?.cancelAtPeriodEnd === true || subscription?.status === "non_renewing";
  const showCancelAction = canCancelSubscription && !cancelScheduled;
  const showResumeAction =
    !viewOnly && (subscription?.canResume === true || cancelScheduled);

  return (
    <div className="space-y-5">
      {paymentSuccess ? (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100">
          <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            {subscription?.status === "pending"
              ? "Payment confirmed. Finishing activation…"
              : `Payment confirmed. You're on the ${displayPlanName} plan.`}
          </p>
        </div>
      ) : null}

      {paymentFailed ? (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          <div className="flex min-w-0 items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div>
              <p className="font-semibold">Payment not completed</p>
              <p className="mt-0.5 text-xs leading-relaxed opacity-90">
                Paystack did not confirm this charge. Your plan was not upgraded — you can try
                checkout again when you&apos;re ready.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onPaymentFailedAcknowledged?.()}
            className="shrink-0 text-xs font-semibold underline underline-offset-2"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {billingUnavailable ? (
        <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>Checkout is off until Paystack is configured. Your current plan limits still apply.</p>
        </div>
      ) : null}

      {storageCapped || (storagePct != null && storagePct >= 90) ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            {storageCapped
              ? "You've used your included plan storage. Choose a higher plan below for more space. Uploads may still work until the backend enforces the limit."
              : `You've used ${storagePct}% of included storage. Upgrade before you run out.`}
          </p>
        </div>
      ) : null}

      {billingError ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            {billingError}{" "}
            <button
              type="button"
              className="font-semibold underline underline-offset-2"
              onClick={() => {
                setBillingLoading(true);
                void loadBilling();
              }}
            >
              Reload
            </button>
          </p>
        </div>
      ) : null}

      {/* Avoid a second "activating" banner when success=1 already shows confirmation. */}
      {subscription?.status === "pending" && !paymentSuccess ? (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            {reconcilingPayment ? (
              <DashboardSpin size="small" className="mt-0.5 shrink-0" />
            ) : (
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            )}
            <div>
              <p className="font-semibold">
                {showPendingActivation ? "Activating your plan" : "Checkout not finished"}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed opacity-90">
                {showPendingActivation
                  ? `Paystack confirmed ${pendingPlanName}. Refresh if your plan has not updated yet.`
                  : `You started upgrading to ${pendingPlanName}. Continue on Paystack to finish payment.`}
              </p>
            </div>
          </div>
          {showPendingActivation ? (
            reconcilingPayment ? (
              <span className="text-xs font-semibold">Confirming…</span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setBillingLoading(true);
                  void (async () => {
                    await tryReconcilePendingPayment();
                    await loadBilling();
                  })();
                }}
                className="inline-flex shrink-0 items-center rounded-xl bg-brand px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover"
              >
                Refresh status
              </button>
            )
          ) : subscription.pendingPlanId && isCheckoutPlanId(subscription.pendingPlanId) ? (
            <button
              type="button"
              disabled={checkoutPlanId === subscription.pendingPlanId}
              onClick={() => {
                const pendingPlan = plans.find((p) => p.id === subscription.pendingPlanId);
                if (pendingPlan) void handleCheckout(pendingPlan);
              }}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover disabled:opacity-60"
            >
              {checkoutPlanId === subscription.pendingPlanId ? (
                <>
                  <DashboardSpin size="small" />
                  Opening…
                </>
              ) : (
                "Continue on Paystack"
              )}
            </button>
          ) : null}
        </div>
      ) : null}

      {subscription?.status === "past_due" ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">Update payment method</p>
            <p className="mt-0.5 text-xs opacity-90">
              Your last renewal failed. Choose your plan again to update billing on Paystack.
            </p>
          </div>
        </div>
      ) : null}

      {/* Plan Summary — layout inspired by modern billing portals */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-xl">
            Plan Summary
          </h2>
          <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
            {displayIntervalLabel ? `${displayPlanName} · ${displayIntervalLabel}` : displayPlanName}
          </span>
          {trialActive ? (
            <span className="rounded-md bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand dark:text-brand-on-dark">
              Trial
            </span>
          ) : null}
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">Plan storage</span>
              <span className="tabular-nums text-zinc-600 dark:text-zinc-300">
                {overview?.planStorage
                  ? `${formatStorageBytes(overview.planStorage.usedBytes)} / ${
                      overview.planStorage.limitBytes > 0
                        ? formatStorageBytes(overview.planStorage.limitBytes)
                        : overview.planStorage.label
                    }`
                  : storageLabel}
              </span>
            </div>
            <div
              className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
              role="progressbar"
              aria-valuenow={storagePct ?? 0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Plan storage used"
            >
              <div
                className={cn(
                  "h-full rounded-full transition-[width]",
                  storagePct != null && storagePct >= 90 ? "bg-amber-500" : "bg-brand",
                )}
                style={{
                  width: `${storagePct != null ? Math.min(100, Math.max(storagePct, storagePct > 0 ? 2 : 0)) : 0}%`,
                }}
              />
            </div>
            {storagePct != null ? (
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                {storageRemainingPct}% remaining
              </p>
            ) : null}
          </div>

          {videoLimitLabel || (plan?.videoUploadLimitBytes && plan.videoUploadLimitBytes > 0) ? (
            <div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Video storage</span>
                <span className="tabular-nums text-zinc-600 dark:text-zinc-300">
                  {videoUsedLabel ?? `Cap ${videoLimitLabel ?? plan?.videoUploadLimitLabel}`}
                </span>
              </div>
              <div
                className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
                role="progressbar"
                aria-valuenow={videoPct ?? 0}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Video storage"
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-[width]",
                    videoPct != null && videoPct >= 90 ? "bg-amber-500" : "bg-brand",
                  )}
                  style={{
                    width:
                      videoPct != null
                        ? `${Math.min(100, Math.max(videoPct, videoPct > 0 ? 2 : 0))}%`
                        : "0%",
                  }}
                />
              </div>
              {videoPct == null ? (
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Separate from plan storage · usage shown when the API reports it
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-zinc-100 pt-5 sm:grid-cols-4 dark:border-zinc-800">
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Current charge</p>
            <p className="mt-1 text-base font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {displayPrice || "Free"}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Included storage</p>
            <p className="mt-1 text-base font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {activePlan?.storageLabel ?? storageLabel}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {trialActive
                ? "Trial ends"
                : subscription?.willRenew
                  ? "Renews on"
                  : "Period ends"}
            </p>
            <p className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {(trialActive ? trialEndsLabel : renewLabel) ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Upgraded</p>
            <p className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {upgradedLabel ?? "—"}
            </p>
          </div>
        </div>

        {galleryPct != null || galleriesLabel !== "—" ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span>Galleries {galleriesLabel}</span>
            <Link
              href="/dashboard/storage"
              className="font-semibold text-brand hover:underline dark:text-brand-on-dark"
            >
              View storage
            </Link>
          </div>
        ) : null}

        {subscription?.inGracePeriod || plan?.inGracePeriod ? (
          <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
            Your plan ended. Renew
            {accessUntilLabel ? ` before ${accessUntilLabel}` : ""} to keep editing.
          </p>
        ) : null}

        {subscription?.viewOnly || plan?.viewOnly ? (
          <p className="mt-3 text-sm text-red-700 dark:text-red-300">
            You can view existing work only. Subscribe to continue creating and editing.
          </p>
        ) : trialExpired ? (
          <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
            Your free trial has ended. Subscribe to keep creating galleries.
          </p>
        ) : accessUntilLabel && !subscription?.willRenew ? (
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            Full access until {accessUntilLabel}.
          </p>
        ) : null}

        {cancelScheduled ? (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
            <p className="font-semibold">Cancellation scheduled</p>
            <p className="mt-0.5 text-xs opacity-90">
              Your plan stays active
              {renewLabel ? ` until ${renewLabel}` : " until the end of the billing period"}. It
              won’t renew after that.
              {accessUntilLabel ? ` You can still edit until ${accessUntilLabel}.` : ""}
            </p>
            {showResumeAction ? (
              <button
                type="button"
                disabled={resuming}
                onClick={() => void handleResume()}
                className="mt-3 inline-flex items-center rounded-xl bg-brand px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover disabled:opacity-60"
              >
                {resuming ? "Keeping plan…" : "Keep plan"}
              </button>
            ) : null}
            {resumeError ? (
              <p className="mt-2 text-xs font-medium text-red-700">{resumeError}</p>
            ) : null}
          </div>
        ) : showCancelAction ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-5 dark:border-zinc-800">
            <div>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                Cancel subscription
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Stops renewal at the end of the current period.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCancelError(null);
                setCancelOpen(true);
              }}
              className="inline-flex shrink-0 items-center rounded-xl border border-red-200 bg-white px-3.5 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/70"
            >
              Cancel subscription
            </button>
          </div>
        ) : null}
      </section>

      {plans.length > 0 ? (
        <section id="billing-plans" className="scroll-mt-6">
          <div className="mb-4 flex justify-center sm:justify-start">
            <div
              className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-900"
              role="group"
              aria-label="Billing interval"
            >
              {(["monthly", "yearly"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setBillingInterval(value)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-sm font-semibold capitalize transition",
                    billingInterval === value
                      ? "bg-brand text-white"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50",
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          <ul className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2">
            {plans.map((planItem) => {
              const featured = planItem.highlighted === true;
              const pendingCheckout = isPendingCheckoutPlan(planItem, subscription);
              const checkoutBusy = checkoutPlanId === planItem.id;
              const planError = isCheckoutPlanId(planItem.id) ? planErrors[planItem.id] : undefined;
              const intervalAvailable = planIntervalAvailable(planItem, billingInterval);
              const switchInterval =
                planItem.current &&
                subscription?.interval != null &&
                subscription.interval !== billingInterval;
              const showCheckout =
                !billingUnavailable &&
                planItem.id !== "free" &&
                intervalAvailable &&
                (viewOnly || !planItem.current || pendingCheckout || switchInterval);
              const disabled =
                billingUnavailable ||
                !intervalAvailable ||
                checkoutBusy ||
                (planItem.current && !pendingCheckout && !switchInterval && !viewOnly);
              const perks = planPerkList(planItem);

              return (
                <li key={planItem.id} className="w-[min(100%,19.5rem)] shrink-0 snap-start">
                  <article
                    className={cn(
                      "relative flex h-full flex-col overflow-hidden rounded-2xl border p-5 sm:p-6",
                      featured || planItem.current
                        ? "border-brand/25 bg-white shadow-[0_0_0_1px_rgba(85,0,31,0.08),0_18px_40px_-24px_rgba(85,0,31,0.35)] dark:border-brand/40 dark:bg-zinc-950 dark:shadow-[0_0_24px_-8px_rgba(232,153,176,0.25)]"
                        : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950",
                    )}
                  >
                    {(featured || planItem.current) ? (
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand via-[#D5AE65] to-brand"
                      />
                    ) : null}

                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                        {planItem.name}
                      </h3>
                      <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                        {pendingCheckout
                          ? "Pending"
                          : planItem.current
                            ? "Current"
                            : featured
                              ? "Popular"
                              : planItem.name}
                      </span>
                    </div>

                    <div className="mt-5 flex items-baseline gap-1.5">
                      <span className="font-display text-[2.5rem] font-semibold leading-none tracking-tight text-brand dark:text-brand-on-dark">
                        {formatPriceAmount(planPrice(planItem, billingInterval))}
                      </span>
                      {planPrice(planItem, billingInterval) > 0 ? (
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">
                          {billingInterval === "yearly" ? "/ year" : "/ month"}
                        </span>
                      ) : null}
                    </div>

                    {planItem.description ? (
                      <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                        {planItem.description}
                      </p>
                    ) : null}

                    {showCheckout ? (
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => void handleCheckout(planItem)}
                        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover disabled:cursor-default disabled:opacity-60"
                      >
                        {checkoutBusy ? (
                          <>
                            <DashboardSpin size="small" />
                            Redirecting…
                          </>
                        ) : (
                          planActionLabel(planItem, subscription, billingInterval)
                        )}
                      </button>
                    ) : (
                      <span
                        className={cn(
                          "mt-5 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold",
                          planItem.current
                            ? "bg-brand/10 text-brand dark:text-brand-on-dark"
                            : "border border-zinc-200 text-zinc-400 dark:border-zinc-700",
                        )}
                      >
                        {planActionLabel(planItem, subscription, billingInterval)}
                      </span>
                    )}

                    {planError ? (
                      <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                        {planError}
                      </p>
                    ) : null}

                    {perks.length > 0 ? (
                      <ul className="mt-5 flex flex-1 flex-col gap-2.5 border-t border-zinc-100 pt-5 dark:border-zinc-800">
                        {perks.map((perk) => (
                          <li
                            key={perk}
                            className="flex items-start gap-2.5 text-sm leading-snug text-zinc-600 dark:text-zinc-300"
                          >
                            <PerkCheck />
                            {perk}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {showCancelAction ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Need to stop?{" "}
          <button
            type="button"
            onClick={() => {
              setCancelError(null);
              setCancelOpen(true);
            }}
            className="font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            Cancel subscription
          </button>
        </p>
      ) : null}

      <FormModal
        open={cancelOpen}
        onClose={() => {
          if (cancelling) return;
          setCancelOpen(false);
          setCancelError(null);
        }}
        busy={cancelling}
        maxWidth="md"
        titleId="cancel-subscription-title"
      >
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-700 ring-1 ring-red-100 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-900/60">
              <AlertTriangle className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h2
                id="cancel-subscription-title"
                className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
              >
                Cancel renewal?
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {displayPlanName} stays active
                {renewLabel ? (
                  <>
                    {" "}
                    until{" "}
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {renewLabel}
                    </span>
                  </>
                ) : (
                  " through the end of this billing period"
                )}
                . After that you’ll move to Free.
              </p>
            </div>
          </div>

          <ul className="mt-5 space-y-2.5 rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-3.5 text-sm dark:border-zinc-800 dark:bg-zinc-900/50">
            <li className="flex gap-2.5 text-zinc-700 dark:text-zinc-300">
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
                aria-hidden
              />
              <span>
                Keep {displayPlanName} features and storage until the period ends
              </span>
            </li>
            <li className="flex gap-2.5 text-zinc-700 dark:text-zinc-300">
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
                aria-hidden
              />
              <span>No further Paystack charges after this period</span>
            </li>
            <li className="flex gap-2.5 text-zinc-700 dark:text-zinc-300">
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400"
                aria-hidden
              />
              <span>
                On Free, gallery and storage limits apply again — upgrade anytime to
                resume
              </span>
            </li>
          </ul>

          {cancelError ? (
            <p className="mt-4 text-sm font-medium text-red-600 dark:text-red-400">
              {cancelError}
            </p>
          ) : null}
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 border-t border-zinc-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-end sm:gap-3 dark:border-zinc-800">
          <button
            type="button"
            disabled={cancelling}
            onClick={() => {
              setCancelOpen(false);
              setCancelError(null);
            }}
            className="inline-flex min-h-[2.5rem] items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Keep plan
          </button>
          <button
            type="button"
            disabled={cancelling}
            aria-busy={cancelling}
            onClick={() => void handleCancelConfirm()}
            className="inline-flex min-h-[2.5rem] items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800 disabled:opacity-60 dark:bg-red-600 dark:hover:bg-red-500"
          >
            {cancelling ? (
              <>
                            <DashboardSpin size="small" />
                Cancelling…
              </>
            ) : (
              "Cancel renewal"
            )}
          </button>
        </div>
      </FormModal>
    </div>
  );
}
