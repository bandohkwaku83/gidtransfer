"use client";

import { useState } from "react";
import { Check, Loader2, Lock, X } from "lucide-react";
import { FormModal } from "@/components/ui/form-modal";
import {
  fetchBillingConfig,
  isCheckoutPlanId,
  readBillingErrorMessage,
  startBillingCheckout,
  type CheckoutPlanId,
} from "@/lib/billing-api";
import { usePlanEntitlements } from "@/lib/use-plan-entitlements";

const FEATURE_LABELS: Record<string, string> = {
  smsNotifications: "SMS notifications",
  videoDash: "Adaptive video",
  customSmsSender: "Custom SMS sender ID",
  customBranding: "Logo watermark on downloads",
  advancedAnalytics: "Advanced analytics",
  restoreTrashItems: "Restore from trash",
  galleryAi: "Gallery AI",
  galleryComments: "Comment & flag images",
  gallerySets: "Gallery sets",
  videoUploads: "Video uploads",
  textWatermark: "Text watermarks",
  analyticsDashboard: "Analytics dashboard",
  clientGalleries: "More galleries",
  storage: "More storage",
};

const PLAN_LABELS: Record<CheckoutPlanId, string> = {
  basic: "Basic",
  pro: "Pro",
  premium: "Premium",
};

const FEATURE_HIGHLIGHTS: Record<string, string[]> = {
  smsNotifications: [
    "Text clients when galleries are ready",
    "Booking reminders straight to their phone",
  ],
  videoDash: [
    "Adaptive streaming for faster client previews",
    "Smoother playback on slow connections",
  ],
  customSmsSender: [
    "Your studio name on every client text",
    "More professional delivery touchpoints",
  ],
  customBranding: [
    "Your logo on downloaded photos",
    "Stronger brand presence on every export",
  ],
  advancedAnalytics: [
    "See who viewed and engaged with galleries",
    "Track proofing progress over time",
  ],
  restoreTrashItems: [
    "Bring back deleted galleries and files",
    "Recover work without starting over",
  ],
  galleryAi: [
    "AI-assisted client photo picks",
    "Faster proofing for large shoots",
  ],
  galleryComments: [
    "Clients comment on photos and flag finals",
    "See revision notes in your dashboard",
  ],
  gallerySets: [
    "Group photos into named sets",
    "Keep large shoots organized for clients",
  ],
  videoUploads: [
    "Upload videos into client galleries",
    "More video storage on higher plans",
  ],
  clientGalleries: [
    "Create more active client galleries",
    "Keep every shoot organized in one place",
  ],
  storage: [
    "More cloud space for photos and videos",
    "Keep delivering without hitting the cap",
  ],
};

const TRIAL_HIGHLIGHTS = [
  "Keep creating galleries and uploading",
  "SMS, branding, analytics, and more",
  "Cancel anytime in Settings → Billing",
];

export function PlanUpgradeModal() {
  const { upgrade, closeUpgrade } = usePlanEntitlements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggested = upgrade?.suggestedPlanId;
  const featureLabel = upgrade?.feature
    ? (FEATURE_LABELS[upgrade.feature] ?? upgrade.feature)
    : null;
  const planLabel = suggested && isCheckoutPlanId(suggested) ? PLAN_LABELS[suggested] : null;
  const highlights = upgrade?.trialExpired
    ? TRIAL_HIGHLIGHTS
    : upgrade?.feature
      ? (FEATURE_HIGHLIGHTS[upgrade.feature] ?? [
          "Unlock this capability on a paid plan",
          "Upgrade anytime from Settings → Billing",
        ])
      : [
          "More storage and gallery capacity",
          "Premium delivery and studio tools",
        ];

  const title = upgrade?.trialExpired
    ? "Your free trial has ended"
    : featureLabel
      ? `Unlock ${featureLabel.toLowerCase()}`
      : "Upgrade your plan";

  const subtitle =
    upgrade?.message?.trim() ||
    (upgrade?.trialExpired
      ? "Choose a plan to keep your studio workspace active."
      : planLabel
        ? `Included on ${planLabel} and above.`
        : "Pick a plan that fits how you deliver to clients.");

  async function handleUpgrade() {
    if (!suggested || !isCheckoutPlanId(suggested)) {
      window.location.href = "/dashboard/settings?tab=billing";
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const config = await fetchBillingConfig();
      if (config && config.configured === false) {
        setError("Billing is unavailable right now. Try again later.");
        return;
      }
      await startBillingCheckout(suggested);
    } catch (err) {
      setError(await readBillingErrorMessage(err, "Could not start checkout."));
      setBusy(false);
    }
  }

  function handleClose() {
    if (busy) return;
    setError(null);
    closeUpgrade();
  }

  return (
    <FormModal
      open={Boolean(upgrade)}
      onClose={handleClose}
      busy={busy}
      elevated
      maxWidth="md"
      titleId="plan-upgrade-title"
    >
      <div className="relative shrink-0 px-6 pb-1 pt-6">
        <button
          type="button"
          onClick={handleClose}
          disabled={busy}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          aria-label="Close"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        <div className="flex items-start gap-3 pr-8">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            <Lock className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            {planLabel && !upgrade?.trialExpired ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
                {planLabel} plan
              </p>
            ) : upgrade?.trialExpired ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
                Trial ended
              </p>
            ) : null}
            <h2
              id="plan-upgrade-title"
              className="mt-1 font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
            >
              {title}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 px-6 py-5">
        <ul className="space-y-2.5">
          {highlights.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-on-dark">
                <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {error ? (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleUpgrade()}
          className="flex w-full items-center justify-center rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-brand/20 transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70"
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Opening checkout…
            </>
          ) : suggested && planLabel ? (
            `Upgrade to ${planLabel}`
          ) : (
            "View plans"
          )}
        </button>
        <button
          type="button"
          onClick={handleClose}
          disabled={busy}
          className="mt-2 w-full py-1.5 text-sm font-medium text-zinc-500 transition hover:text-zinc-800 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          Not now
        </button>
        <p className="mt-3 text-center text-[11px] leading-snug text-zinc-400">
          Secure checkout via Paystack · Manage anytime in Settings → Billing
        </p>
      </div>
    </FormModal>
  );
}

export function FeatureUpgradeButton({
  feature,
  label,
  className,
  suggestedPlanId,
}: {
  feature: string;
  label?: string;
  className?: string;
  suggestedPlanId?: CheckoutPlanId;
}) {
  const { openUpgrade } = usePlanEntitlements();
  return (
    <button
      type="button"
      onClick={() => openUpgrade({ feature, suggestedPlanId })}
      className={
        className ??
        "inline-flex items-center rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover"
      }
    >
      {label ?? "Upgrade"}
    </button>
  );
}
