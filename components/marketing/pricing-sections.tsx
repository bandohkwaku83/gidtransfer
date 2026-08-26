"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Loader2,
  Minus,
} from "lucide-react";
import { MarketingFaqSection } from "@/components/marketing/faq-section";
import { SectionHeading } from "@/components/marketing/egg/SectionHeading";
import {
  MarketingCornerButton,
  MarketingCornerCta,
} from "@/components/marketing/marketing-corner-cta";
import {
  isCheckoutPlanId,
  MARKETING_BILLING_PLANS_FALLBACK,
  readBillingErrorMessage,
  startBillingCheckout,
  type BillingPlan,
} from "@/lib/billing-api";
import { getAuth } from "@/lib/auth-demo";
import { type BillingPlanId } from "@/lib/plan-entitlements";
import { usePhotographerSignedIn } from "@/lib/marketing/use-photographer-signed-in";
import { cn } from "@/lib/utils";

function marketingPlanCtaLabel(plan: BillingPlan, current: boolean): string {
  if (current || plan.current) return "Current Plan";
  if (!plan.available) return "Coming soon";
  if (plan.id === "free") return "Get started";
  return `Upgrade to ${plan.name}`;
}

export const pricingHeroImage = {
  src: "/images/gallery-covers/website_3-min.jpg",
  alt: "Editorial portrait gallery",
} as const;

export const PRICING_HERO_BACKDROP_ID = "pricing-hero-backdrop";

/** Full-bleed hero image from the top of the page — sits behind the marketing header. */
export function PricingHeroBackdrop() {
  return (
    <div
      id={PRICING_HERO_BACKDROP_ID}
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[max(32rem,calc(5.5rem+min(46vh,420px)))] sm:h-[max(36rem,calc(5.5rem+min(50vh,460px)))]"
    >
      <Image
        src={pricingHeroImage.src}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_30%]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/75" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.35)_100%)]" />
    </div>
  );
}

function PricingCard({
  plan,
  priceGhs,
  billingPeriod,
  ctaLabel,
  ctaHref,
  ctaDisabled,
  ctaBusy,
  onCtaClick,
}: {
  plan: BillingPlan;
  priceGhs: number;
  billingPeriod: "monthly" | "yearly";
  ctaLabel: string;
  ctaHref?: string;
  ctaDisabled?: boolean;
  ctaBusy?: boolean;
  onCtaClick?: () => void;
}) {
  const isFeatured = plan.highlighted === true;
  const perks = plan.perks?.length
    ? plan.perks
    : [plan.storageLabel ? `${plan.storageLabel} Cloud Storage` : null].filter(
        (item): item is string => Boolean(item),
      );

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl bg-white transition duration-300",
        isFeatured
          ? "z-10 p-8 shadow-[0_20px_50px_-20px_rgba(85,0,31,0.28)] ring-1 ring-[#55001F]/15 lg:-translate-y-2 lg:p-9"
          : "border border-slate-200/90 p-7 shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:border-slate-300 hover:shadow-[0_12px_40px_-16px_rgba(15,23,42,0.12)] sm:p-8",
      )}
    >
      {isFeatured ? (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D5AE65]/80 to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute right-0 top-0 z-10 h-24 w-24 overflow-hidden"
          >
            <span className="absolute right-[-34px] top-[22px] block w-[140px] rotate-45 bg-[#55001F] py-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-[#D5AE65] shadow-[0_4px_12px_-2px_rgba(85,0,31,0.4)]">
              Most popular
            </span>
          </div>
        </>
      ) : null}

      <header>
        <h2 className="font-display text-[1.35rem] font-semibold tracking-tight text-slate-900">
          {plan.name}
        </h2>
        {plan.description ? (
          <p className="mt-1.5 text-sm leading-snug text-slate-500">{plan.description}</p>
        ) : null}
      </header>

      <div className="mt-6">
        <div className="flex items-baseline">
          <span className="font-display text-[3.25rem] font-semibold leading-none tracking-tight text-slate-900">
            GH₵ {priceGhs}
          </span>
          <span className="ml-1.5 text-sm text-slate-500">/mo</span>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {billingPeriod === "yearly" ? "Billed yearly" : "Billed monthly"}
          {plan.storageLabel ? ` · ${plan.storageLabel} storage` : ""}
        </p>
      </div>

      <div className="my-6 h-px bg-slate-100" aria-hidden />

      <ul className="flex flex-1 flex-col gap-3">
        {perks.map((feature) => {
          const isGroupHeader = feature.endsWith(":");

          return (
            <li
              key={feature}
              className={cn(
                "flex items-start gap-2.5 text-sm leading-snug",
                isGroupHeader ? "font-medium text-slate-800" : "text-slate-600",
              )}
            >
              {!isGroupHeader ? (
                <Check
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    isFeatured ? "text-[#55001F]" : "text-teal-600",
                  )}
                  aria-hidden
                  strokeWidth={2.5}
                />
              ) : (
                <span className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              )}
              <span>{feature}</span>
            </li>
          );
        })}
      </ul>

      {onCtaClick ? (
        <MarketingCornerButton
          className={cn(
            "mt-8 w-full justify-center",
            (ctaDisabled || ctaBusy) && "pointer-events-none opacity-60",
          )}
          onClick={onCtaClick}
        >
          {ctaBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {ctaBusy ? "Redirecting…" : ctaLabel}
        </MarketingCornerButton>
      ) : ctaHref ? (
        <MarketingCornerCta href={ctaHref} className="mt-8 w-full justify-center">
          {ctaLabel}
        </MarketingCornerCta>
      ) : (
        <span className="mt-8 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500">
          {ctaLabel}
        </span>
      )}
    </article>
  );
}

function ComparisonCell({
  value,
  featured = false,
}: {
  value: string | boolean | number;
  featured?: boolean;
}) {
  if (typeof value === "boolean") {
    return value ? (
      <span
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-full",
          featured
            ? "bg-[#55001F] text-white"
            : "bg-[#55001F]/12 text-[#55001F]",
        )}
      >
        <Check className="h-4 w-4" aria-hidden strokeWidth={2.5} />
      </span>
    ) : (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-200/80 text-slate-400">
        <Minus className="h-4 w-4" aria-hidden strokeWidth={2.5} />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "text-sm font-semibold tabular-nums",
        featured ? "text-[#55001F]" : "text-slate-800",
      )}
    >
      {value}
    </span>
  );
}

type PricingSectionsProps = {
  className?: string;
};

export function PricingSections({ className }: PricingSectionsProps) {
  const signedIn = usePhotographerSignedIn();
  const signUpHref = signedIn ? "/dashboard/settings?tab=billing" : "/login?screen=signup";
  const [plans, setPlans] = useState<BillingPlan[]>(MARKETING_BILLING_PLANS_FALLBACK.plans);
  const comparison = MARKETING_BILLING_PLANS_FALLBACK.comparison;
  const [billingConfigured, setBillingConfigured] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [checkoutPlanId, setCheckoutPlanId] = useState<BillingPlanId | null>(null);
  const [planErrors, setPlanErrors] = useState<Partial<Record<string, string>>>({});

  const currentPlanId = useMemo(() => {
    return getAuth()?.user?.plan?.planId ?? plans.find((p) => p.current)?.id ?? null;
  }, [plans]);

  useEffect(() => {
    // Mark current plan from the signed-in session; catalog content stays on the marketing source.
    const sessionPlanId = getAuth()?.user?.plan?.planId ?? null;
    if (!sessionPlanId) return;
    setPlans((prev) =>
      prev.map((plan) => ({
        ...plan,
        current: plan.id === sessionPlanId,
      })),
    );
  }, [signedIn]);

  useEffect(() => {
    // Best-effort: detect whether Paystack checkout is configured (no auth required once API is public).
    let cancelled = false;
    void (async () => {
      try {
        const { fetchBillingConfig } = await import("@/lib/billing-api");
        const config = await fetchBillingConfig();
        if (!cancelled) setBillingConfigured(config?.configured !== false);
      } catch {
        /* keep default */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCheckout(plan: BillingPlan) {
    if (!isCheckoutPlanId(plan.id) || !plan.available || plan.current) return;
    setCheckoutPlanId(plan.id);
    setPlanErrors((prev) => {
      const next = { ...prev };
      delete next[plan.id];
      return next;
    });
    try {
      await startBillingCheckout(plan.id);
    } catch (err) {
      const message = await readBillingErrorMessage(err, "Checkout failed.");
      setPlanErrors((prev) => ({
        ...prev,
        [plan.id]: message,
      }));
      setCheckoutPlanId(null);
    }
  }

  const highlightedId = plans.find((p) => p.highlighted)?.id ?? "pro";

  return (
    <div className={className}>
      {/* Hero copy — image backdrop is rendered at page level behind the header */}
      <section className="relative">
        <div className="relative flex min-h-[min(46vh,420px)] flex-col items-center justify-center px-5 py-12 text-center sm:min-h-[min(50vh,460px)] sm:px-8 sm:py-16">
          <SectionHeading
            as="h1"
            tone="dark"
            label="Pricing"
            title="Simple pricing for photographers"
            body="Choose the perfect plan for your photography business. No hidden fees, ever."
          />

          <div
            className="mt-8 inline-flex items-center rounded-full border border-white/20 bg-black/25 p-1 backdrop-blur-sm"
            role="group"
            aria-label="Billing period"
          >
            {(["monthly", "yearly"] as const).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setBillingPeriod(period)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition",
                  billingPeriod === period
                    ? "bg-white text-slate-900"
                    : "text-white/70 hover:text-white",
                )}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Plan cards */}
      <section className="relative -mt-6 pb-14 pt-2 sm:-mt-8 sm:pb-16">
        <div className="marketing-container">
          {!billingConfigured ? (
            <p className="mb-5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              Billing unavailable. You can still review plans — checkout will open when payments
              are configured.
            </p>
          ) : null}
          <div className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
            {plans.map((plan) => {
              const current =
                plan.current || (currentPlanId != null && plan.id === currentPlanId);
              const label = marketingPlanCtaLabel(plan, current);
              const canCheckout =
                signedIn &&
                billingConfigured &&
                isCheckoutPlanId(plan.id) &&
                plan.available &&
                !current;
              const displayPrice =
                billingPeriod === "yearly" && plan.priceGhs > 0
                  ? plan.priceGhs
                  : plan.priceGhs;

              return (
                <div key={plan.id} className="flex flex-col">
                  <PricingCard
                    plan={{ ...plan, current, highlighted: plan.highlighted }}
                    priceGhs={displayPrice}
                    billingPeriod={billingPeriod}
                    ctaLabel={label}
                    ctaHref={
                      canCheckout
                        ? undefined
                        : current
                          ? undefined
                          : signUpHref
                    }
                    ctaDisabled={current || (!canCheckout && signedIn && plan.id !== "free")}
                    ctaBusy={checkoutPlanId === plan.id}
                    onCtaClick={canCheckout ? () => void handleCheckout(plan) : undefined}
                  />
                  {planErrors[plan.id] ? (
                    <p className="mt-2 text-center text-xs font-medium text-red-600">
                      {planErrors[plan.id]}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="relative py-16 sm:py-20">
        <div className="marketing-container">
          <SectionHeading
            align="left"
            className="mb-6 sm:mb-8"
            label="Compare plans"
            title="See what's included at a glance"
            body="Free to start, Basic to grow, Premium for pros, Studio for teams."
          />

          {comparison.length > 0 && plans.length > 0 ? (
          <div>
            <div className="overflow-hidden rounded-[1.75rem] border border-slate-300 bg-white shadow-[0_20px_50px_-28px_rgba(36,16,24,0.2)]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-300 bg-[#f3f1f0]">
                    <th
                      scope="col"
                      className="sticky left-0 z-20 border-r border-slate-200 bg-[#f3f1f0] px-6 py-5 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600"
                    >
                      Feature
                    </th>
                    {plans.map((plan) => {
                      const featured = plan.id === highlightedId || plan.highlighted;
                      return (
                      <th
                        key={plan.id}
                        scope="col"
                        className={cn(
                          "px-4 py-5 text-center",
                          featured
                            ? "relative border-x border-[#55001F]/25 bg-[#55001F] text-white"
                            : "bg-[#f3f1f0] text-slate-900",
                        )}
                      >
                        <span className="block font-sans text-base font-semibold tracking-tight sm:text-lg">
                          {plan.name}
                        </span>
                        {featured ? (
                          <span className="mt-1.5 inline-flex rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                            Popular
                          </span>
                        ) : (
                          <span className="mt-1.5 block text-[11px] font-medium text-slate-500">
                            {plan.storageLabel ?? ""}
                          </span>
                        )}
                      </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row, rowIndex) => (
                    <tr
                      key={row.key}
                      className={cn(
                        "group border-b border-slate-200 last:border-b-0",
                        rowIndex % 2 === 0 ? "bg-white" : "bg-[#faf9f8]",
                      )}
                    >
                      <td className="sticky left-0 z-10 border-r border-slate-200 bg-inherit px-6 py-4 text-sm font-semibold text-slate-800">
                        {row.label}
                      </td>
                      {plans.map((plan) => {
                        const featured = plan.id === highlightedId || plan.highlighted;
                        const value = row.values[plan.id];
                        return (
                          <td
                            key={plan.id}
                            className={cn(
                              "px-4 py-4 text-center",
                              featured &&
                                "border-x border-[#55001F]/15 bg-[#55001F]/[0.07]",
                            )}
                          >
                            <ComparisonCell
                              value={value === undefined || value === null ? "—" : value}
                              featured={featured}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
          ) : null}
        </div>
      </section>

      <MarketingFaqSection />
    </div>
  );
}
