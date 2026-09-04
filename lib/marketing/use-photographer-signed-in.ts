"use client";

import { useEffect, useState } from "react";
import {
  hasIncompleteOnboardingSession,
  isPhotographerSignedIn,
  marketingSignInHref,
  marketingSignUpHref,
} from "@/lib/marketing/auth-links";

export type MarketingAuthCta = {
  /** Fully verified + onboarded studio session. */
  signedIn: boolean;
  /** Verified account that still needs the onboarding form. */
  incompleteOnboarding: boolean;
  signInHref: string;
  signUpHref: string;
  /** Primary marketing CTA label (Start free / Continue setup / Open studio). */
  primaryCtaLabel: string;
};

const DEFAULT_CTA: MarketingAuthCta = {
  signedIn: false,
  incompleteOnboarding: false,
  signInHref: "/login",
  signUpHref: "/login?screen=signup",
  primaryCtaLabel: "Start free",
};

function readMarketingAuthCta(): MarketingAuthCta {
  const signedIn = isPhotographerSignedIn();
  const incompleteOnboarding = hasIncompleteOnboardingSession();
  return {
    signedIn,
    incompleteOnboarding,
    signInHref: marketingSignInHref(),
    signUpHref: marketingSignUpHref(),
    primaryCtaLabel: signedIn
      ? "Open studio"
      : incompleteOnboarding
        ? "Continue setup"
        : "Start free",
  };
}

/** Session-aware marketing CTA hrefs/labels (client-only after mount). */
export function useMarketingAuthCta(): MarketingAuthCta {
  const [cta, setCta] = useState<MarketingAuthCta>(DEFAULT_CTA);

  useEffect(() => {
    setCta(readMarketingAuthCta());
  }, []);

  return cta;
}

/** @deprecated Prefer {@link useMarketingAuthCta} when you need hrefs/labels too. */
export function usePhotographerSignedIn(): boolean {
  return useMarketingAuthCta().signedIn;
}
