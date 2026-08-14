import {
  authRedirectPath,
  userNeedsEmailVerification,
} from "@/lib/auth-api";
import { getAuth } from "@/lib/auth-demo";
import type { AuthUser } from "@/lib/auth-demo";

function sessionUser(): AuthUser | null {
  const auth = getAuth();
  if (!auth?.user?.email?.trim() || !auth?.token?.trim()) return null;
  return auth.user;
}

/** True when the browser has any persisted photographer JWT (including incomplete signup). */
export function hasPhotographerSession(): boolean {
  return sessionUser() != null;
}

/**
 * Fully usable studio session — email verified and onboarding finished.
 * Incomplete signups must not look “signed in” on marketing CTAs.
 */
export function isPhotographerSignedIn(): boolean {
  const user = sessionUser();
  if (!user) return false;
  if (userNeedsEmailVerification(user)) return false;
  return user.onboardingComplete === true;
}

/** Verified account that still needs the onboarding form. */
export function hasIncompleteOnboardingSession(): boolean {
  const user = sessionUser();
  if (!user) return false;
  if (userNeedsEmailVerification(user)) return false;
  return user.onboardingComplete !== true;
}

/**
 * Sign-in CTAs always open the login form unless the studio is fully ready
 * (then go to the dashboard). Never jump straight to onboarding from “Sign in”.
 */
export function marketingSignInHref(): string {
  const user = sessionUser();
  if (user && isPhotographerSignedIn()) {
    return authRedirectPath(user);
  }
  return "/login";
}

/**
 * Start-free / get-started CTAs — resume onboarding when a verified incomplete
 * session exists; otherwise signup (or dashboard when fully signed in).
 */
export function marketingSignUpHref(): string {
  const user = sessionUser();
  if (!user) return "/login?screen=signup";
  if (userNeedsEmailVerification(user)) return "/login?screen=verify";
  if (user.onboardingComplete) return authRedirectPath(user);
  return "/onboarding";
}
