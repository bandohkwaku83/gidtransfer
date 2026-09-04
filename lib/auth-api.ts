import { apiUrl, sameOriginUploadsUrl } from "@/lib/api";
import type {
  AuthAccountType,
  AuthProvider,
  AuthUser,
  StudioMembership,
} from "@/lib/auth-demo";
import {
  authHandoffPayload,
  cacheOnboardingProfile,
  clearAuth,
  clearOnboardingProfileCache,
  getAuth,
  getAuthToken,
  hydrateAuthUser,
  setAuthSession,
} from "@/lib/auth-demo";
import { authedJson, extractMessage, HttpError, parseJson } from "@/lib/http";
import {
  studioSmsFieldsFromApi,
  type StudioSmsFields,
} from "@/lib/sms-sender";
import {
  clearBillingReturnPath,
  readBillingReturnPath,
} from "@/lib/billing-api";
import {
  photographerAuthUrl,
  redirectToTenantHostIfNeeded,
} from "@/lib/studio-url";
import { parseUserPlan, PLAN_RANK, type UserPlan } from "@/lib/plan-entitlements";
import {
  canAccessPath,
  firstAllowedHref,
  isStudioMember,
  type StudioMenuKey,
} from "@/lib/studio-access";

export {
  canManageTeam,
  canOpen,
  isOwner,
  isStudioMember,
  menusFor,
} from "@/lib/studio-access";

export class AuthApiError extends HttpError {}

export { EmailNotVerifiedError } from "@/lib/http";

export type ApiStudioMembership = {
  id?: string;
  _id?: string;
  studioOwnerId?: string;
  userId?: string;
  email?: string;
  displayName?: string;
  role?: string;
  menuKeys?: string[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiAuthUser = {
  _id: string;
  email: string;
  photographerEmail?: string;
  emailVerified?: boolean;
  emailVerifiedAt?: string | null;
  authProvider?: AuthProvider;
  createdAt?: string;
  updatedAt?: string;
  onboardingComplete?: boolean;
  accountType?: AuthAccountType | string;
  studioOwnerId?: string;
  membership?: ApiStudioMembership | null;
  studio?: {
    companyName?: string;
    companySlug?: string;
    phone?: string;
    country?: string;
    logoDataUrl?: string;
    logoUrl?: string;
    logoSrc?: string;
    brandLogo?: string;
    companyLogo?: string;
    studioUrl?: string;
    studioUrlSuffix?: string;
    primaryDeliverable?: string;
    primaryDeliver?: string;
    referralCode?: string;
  } & Partial<StudioSmsFields>;
  plan?: UserPlan | Record<string, unknown>;
};

export type AuthResponse = {
  message?: string;
  token: string;
  user: ApiAuthUser;
  isNewUser?: boolean;
  requiresEmailVerification?: boolean;
};

export type MessageResponse = {
  message: string;
};

export type ResendVerificationResponse = MessageResponse & {
  resendAfterSeconds: number;
};

/** True when an email/password account still needs OTP verification. */
export function userNeedsEmailVerification(user: {
  emailVerified?: boolean;
  authProvider?: string;
}): boolean {
  if (user.authProvider && user.authProvider !== "email") return false;
  return user.emailVerified === false;
}

export function verifyEmailPath(): string {
  return "/login?screen=verify";
}

function nameFromEmail(email: string) {
  const localPart = email.split("@")[0]?.trim() || "User";
  return localPart.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function mergeStudioProfile(
  api?: ApiAuthUser["studio"],
  prior?: AuthUser["studio"],
): ApiAuthUser["studio"] | undefined {
  if (!api && !prior) return undefined;
  return { ...(prior ?? {}), ...(api ?? {}) } as ApiAuthUser["studio"];
}

/** Merge API user fields without downgrading client-known onboarding completion. */
export function mergeApiAuthUser(
  apiUser: ApiAuthUser,
  prior?: AuthUser | null,
): ApiAuthUser {
  const onboardingComplete =
    apiUser.onboardingComplete === true || prior?.onboardingComplete === true;

  // Once verified in this browser session, never let a stale /me payload flip it back.
  const emailVerified =
    apiUser.emailVerified === true || prior?.emailVerified === true
      ? true
      : apiUser.emailVerified !== undefined
        ? apiUser.emailVerified
        : prior?.emailVerified;

  return {
    ...apiUser,
    _id: apiUser._id?.trim() || prior?._id || "",
    email: apiUser.email?.trim() || prior?.email || "",
    onboardingComplete,
    createdAt: apiUser.createdAt ?? prior?.createdAt,
    updatedAt: apiUser.updatedAt ?? prior?.updatedAt,
    emailVerified,
    emailVerifiedAt:
      apiUser.emailVerifiedAt !== undefined
        ? apiUser.emailVerifiedAt
        : emailVerified === true && prior?.emailVerifiedAt
          ? prior.emailVerifiedAt
          : (prior?.emailVerifiedAt ?? null),
    authProvider: apiUser.authProvider ?? prior?.authProvider,
    studio: mergeStudioProfile(apiUser.studio, prior?.studio),
    plan: preferFresherUserPlan(parseUserPlan(apiUser.plan), prior?.plan),
  };
}

/**
 * Prefer the richer/higher plan when /me briefly lags behind a just-verified upgrade.
 */
export function preferFresherUserPlan(
  incoming: UserPlan | null | undefined,
  prior: UserPlan | null | undefined,
): UserPlan | undefined {
  if (!incoming) return prior ?? undefined;
  if (!prior) return incoming;
  // Expiry / grace flags from /me must win — do not keep a stale paid plan.
  if (incoming.viewOnly || incoming.inGracePeriod) return incoming;
  const incomingRank = PLAN_RANK[incoming.planId] ?? 0;
  const priorRank = PLAN_RANK[prior.planId] ?? 0;
  if (incomingRank >= priorRank) return incoming;
  // Keep the post-checkout plan until /me catches up (avoid silent downgrade).
  if (
    prior.subscription.status === "active" ||
    prior.subscription.status === "non_renewing" ||
    prior.subscription.status === "past_due"
  ) {
    return prior;
  }
  return incoming;
}

/** Write an upgraded plan into the persisted session so entitlements update without a hard refresh. */
export function applyAuthUserPlan(plan: UserPlan): AuthUser | null {
  const token = getAuthToken()?.trim();
  const auth = getAuth();
  if (!token || !auth?.user) return null;
  const user = {
    ...auth.user,
    plan: preferFresherUserPlan(plan, auth.user.plan) ?? plan,
  };
  setAuthSession({ ...auth, token, user });
  return user;
}

/** Refresh the stored session from GET /api/auth/me without losing onboarding progress. */
export function refreshAuthSessionFromApi(apiUser: ApiAuthUser): AuthUser | null {
  const token = getAuthToken()?.trim();
  if (!token) return null;
  const auth = getAuth();
  if (!auth) return null;

  const user = mapApiUserToAuthUser(mergeApiAuthUser(apiUser, auth.user));
  setAuthSession({ ...auth, token, user });
  if (user.onboardingComplete && user.studio) {
    cacheOnboardingProfile(user, user.studio);
  }
  return user;
}

/** Save JWT + user from register, login, Google, verify-email, or reset-password. */
export function persistAuthResponse(
  res: AuthResponse,
  options?: { emailJustVerified?: boolean },
): AuthUser {
  const token = res.token?.trim();
  if (!token) {
    throw new Error("Login succeeded but no token was returned. Check the API URL.");
  }
  const prior = getAuth()?.user;
  const merged = mergeApiAuthUser(
    {
      ...res.user,
      ...(options?.emailJustVerified ? { emailVerified: true } : {}),
    },
    prior,
  );
  const user = mapApiUserToAuthUser(merged);
  const nextUser =
    options?.emailJustVerified || user.emailVerified === true
      ? { ...user, emailVerified: true as const }
      : user;
  setAuthSession({
    email: nextUser.email,
    token,
    user: nextUser,
  });
  if (nextUser.onboardingComplete && nextUser.studio) {
    cacheOnboardingProfile(nextUser, nextUser.studio);
  } else {
    clearOnboardingProfileCache(nextUser);
  }
  return nextUser;
}

export function authRedirectPath(user: AuthUser): string {
  if (userNeedsEmailVerification(user)) return verifyEmailPath();
  return user.onboardingComplete ? "/dashboard" : "/onboarding";
}

function studioHostOptionsFromUser(user: AuthUser) {
  return {
    studioUrl: user.studio?.studioUrl,
    studioUrlSuffix: user.studio?.studioUrlSuffix,
  };
}

/**
 * After sign-in or onboarding:
 * - Setup → apex `/onboarding` (studio slug unknown to the URL until they finish)
 * - Done → `{slug}.localhost` `/dashboard` only
 */
/** Relative in-app path after login (blocks open redirects). */
export function safeAuthReturnPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.includes("://")) return null;
  // Billing verify resume + normal app destinations only.
  if (
    value.startsWith("/billing") ||
    value.startsWith("/dashboard") ||
    value.startsWith("/collaborations") ||
    value.startsWith("/settings") ||
    value.startsWith("/onboarding")
  ) {
    return value;
  }
  return null;
}

/** @returns Whether navigation away from the current auth/onboarding screen was started. */
export function navigateAfterAuth(
  user: AuthUser,
  router: { replace: (path: string) => void },
): boolean {
  if (userNeedsEmailVerification(user)) {
    const verifyUrl = photographerAuthUrl(verifyEmailPath());
    if (
      typeof window !== "undefined" &&
      window.location.origin !== new URL(verifyUrl).origin
    ) {
      window.location.replace(verifyUrl);
      return true;
    }
    router.replace(verifyEmailPath());
    return false;
  }

  // Staff join an existing studio — never send them through owner onboarding.
  if (!user.onboardingComplete && !isStudioMember(user)) {
    // Hard navigate so the login/verify screen fully unmounts and cannot
    // overwrite the fresh verified session with a stale /me response.
    if (typeof window !== "undefined") {
      window.location.replace(photographerAuthUrl("/onboarding"));
      return true;
    }
    router.replace("/onboarding");
    return false;
  }

  const returnToRaw =
    typeof window !== "undefined"
      ? safeAuthReturnPath(new URLSearchParams(window.location.search).get("returnTo")) ||
        (isStudioMember(user) ? null : safeAuthReturnPath(readBillingReturnPath()))
      : null;

  const returnTo =
    returnToRaw &&
    canAccessPath(
      user,
      returnToRaw.split("?")[0] || returnToRaw,
      returnToRaw.includes("?") ? `?${returnToRaw.split("?")[1]}` : "",
    )
      ? returnToRaw
      : null;

  // Finish Paystack verify (or other deep links) on the apex host before tenant redirect.
  if (returnTo) {
    clearBillingReturnPath();
    if (typeof window !== "undefined") {
      window.location.replace(photographerAuthUrl(returnTo));
      return true;
    }
    router.replace(returnTo);
    return true;
  }

  const home = firstAllowedHref(user);

  const slug = user.studio?.companySlug?.trim();
  if (
    slug &&
    redirectToTenantHostIfNeeded(
      slug,
      home,
      studioHostOptionsFromUser(user),
      authHandoffPayload(),
      clearAuth,
    )
  ) {
    return true;
  }

  if (typeof window !== "undefined") {
    window.location.replace(photographerAuthUrl(home));
    return true;
  }
  router.replace(home);
  return true;
}

function mapApiMembership(raw: ApiStudioMembership | null | undefined): StudioMembership | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const id = (raw.id ?? raw._id ?? "").trim();
  const email = (raw.email ?? "").trim();
  if (!id && !email) return undefined;
  const menuKeys = Array.isArray(raw.menuKeys)
    ? raw.menuKeys.filter((k): k is string => typeof k === "string" && k.trim().length > 0)
    : [];
  return {
    id: id || email,
    studioOwnerId: (raw.studioOwnerId ?? "").trim(),
    userId: (raw.userId ?? "").trim(),
    email,
    displayName: (raw.displayName ?? "").trim() || email,
    role: (raw.role ?? "viewer").trim() || "viewer",
    menuKeys: menuKeys as StudioMenuKey[],
    status: (raw.status ?? "active").trim() || "active",
    ...(raw.createdAt ? { createdAt: raw.createdAt } : {}),
    ...(raw.updatedAt ? { updatedAt: raw.updatedAt } : {}),
  };
}

export function mapApiUserToAuthUser(
  user: ApiAuthUser,
  extras?: { studioUrl?: string | null; studioUrlSuffix?: string | null },
): AuthUser {
  const email = (user.photographerEmail ?? user.email).trim();
  const studio = user.studio
    ? {
        companyName: user.studio.companyName ?? "",
        ...(user.studio.companySlug?.trim()
          ? { companySlug: user.studio.companySlug.trim() }
          : {}),
        ...(user.studio.phone ? { phone: user.studio.phone } : {}),
        ...(user.studio.studioUrl?.trim() || extras?.studioUrl?.trim()
          ? {
              studioUrl: user.studio.studioUrl?.trim() || extras?.studioUrl?.trim(),
            }
          : {}),
        ...(user.studio.studioUrlSuffix?.trim() || extras?.studioUrlSuffix?.trim()
          ? {
              studioUrlSuffix:
                user.studio.studioUrlSuffix?.trim() || extras?.studioUrlSuffix?.trim(),
            }
          : {}),
        ...(() => {
          const rawLogo =
            user.studio.brandLogo ??
            user.studio.companyLogo ??
            user.studio.logoSrc ??
            user.studio.logoUrl ??
            user.studio.logoDataUrl;
          const trimmed = typeof rawLogo === "string" ? rawLogo.trim() : "";
          if (!trimmed) return {};
          return {
            logoDataUrl: trimmed.startsWith("data:")
              ? trimmed
              : sameOriginUploadsUrl(trimmed),
          };
        })(),
        ...(user.studio.country?.trim() ? { country: user.studio.country.trim() } : {}),
        ...(() => {
          const deliver =
            user.studio.primaryDeliverable?.trim() || user.studio.primaryDeliver?.trim();
          return deliver ? { primaryDeliver: deliver } : {};
        })(),
        ...(user.studio.referralCode?.trim()
          ? { referralCode: user.studio.referralCode.trim() }
          : {}),
        ...studioSmsFieldsFromApi(user.studio),
      }
    : undefined;
  const accountType: AuthAccountType =
    user.accountType === "member" ? "member" : "owner";
  const membership = mapApiMembership(user.membership ?? undefined);
  const displayName =
    membership?.displayName?.trim() ||
    studio?.companyName?.trim() ||
    nameFromEmail(email);

  // Staff inherit the owner's studio — they never run owner onboarding.
  const onboardingComplete =
    accountType === "member" ? true : Boolean(user.onboardingComplete);

  return hydrateAuthUser({
    _id: user._id,
    email,
    name: displayName,
    role:
      accountType === "member"
        ? membership?.role || "member"
        : "photographer",
    accountType,
    ...(user.studioOwnerId?.trim()
      ? { studioOwnerId: user.studioOwnerId.trim() }
      : membership?.studioOwnerId
        ? { studioOwnerId: membership.studioOwnerId }
        : {}),
    ...(membership ? { membership } : {}),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    onboardingComplete,
    ...(user.emailVerified !== undefined ? { emailVerified: user.emailVerified } : {}),
    ...(user.emailVerifiedAt !== undefined ? { emailVerifiedAt: user.emailVerifiedAt } : {}),
    ...(user.authProvider ? { authProvider: user.authProvider } : {}),
    studio,
    ...((): { plan?: UserPlan } => {
      const plan = parseUserPlan(user.plan);
      return plan ? { plan } : {};
    })(),
  });
}

async function publicJson<T>(
  path: string,
  init: RequestInit,
  fallbackError: string,
): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(apiUrl(path), { ...init, headers });
  const body = await parseJson(res);
  if (!res.ok) {
    let message = extractMessage(body, `${fallbackError} (${res.status})`);
    const apiHasMessage =
      body &&
      typeof body === "object" &&
      typeof (body as { message?: unknown }).message === "string" &&
      (body as { message: string }).message.trim().length > 0;

    if (res.status === 404 && !apiHasMessage) {
      message =
        "Auth API not found. Set BACKEND_API_URL=http://127.0.0.1:7100 in .env, restart `npm run dev`, and run photo_global_backend on port 7100.";
    } else if (res.status === 502) {
      message = extractMessage(body, "Could not reach the API server. Is the backend running on port 7100?");
    }
    throw new AuthApiError(message, res.status, body);
  }
  return body as T;
}

export async function registerWithEmail(
  email: string,
  password: string,
  acceptedTerms: boolean,
): Promise<AuthResponse> {
  return publicJson<AuthResponse>(
    "/api/auth/register",
    {
      method: "POST",
      body: JSON.stringify({ email, password, acceptedTerms }),
    },
    "Could not create account",
  );
}

/** Refresh persisted session from GET /api/auth/me. */
export async function refreshMe(): Promise<AuthUser | null> {
  try {
    const { user } = await fetchAuthMe({ redirectOn401: false });
    return refreshAuthSessionFromApi(user);
  } catch {
    return getAuth()?.user ?? null;
  }
}

/** Persist login/register payload, then refetch /me so plan flags are current. */
export async function persistAuthResponseAndRefreshMe(
  res: AuthResponse,
  options?: { emailJustVerified?: boolean },
): Promise<AuthUser> {
  persistAuthResponse(res, options);
  return (await refreshMe()) ?? getAuth()!.user!;
}

/** GET /api/auth/me — refresh session user from the server. */
export async function fetchAuthMe(
  options: { redirectOn401?: boolean } = {},
): Promise<{ user: ApiAuthUser }> {
  return authedJson<{ user: ApiAuthUser }>(
    "/api/auth/me",
    { method: "GET" },
    "Could not load account",
    AuthApiError,
    { redirectOn401: options.redirectOn401 ?? true },
  );
}

/** POST /api/auth/verify-email — completes signup after the user enters the emailed OTP. */
export async function verifyEmail(code: string): Promise<AuthResponse> {
  const digits = code.replace(/\D/g, "").slice(0, 4);
  return authedJson<AuthResponse>(
    "/api/auth/verify-email",
    {
      method: "POST",
      body: JSON.stringify({ code: digits }),
    },
    "Could not verify email",
    AuthApiError,
    { redirectOn401: true },
  );
}

/** POST /api/auth/resend-verification — sends a fresh signup OTP. */
export async function resendVerification(): Promise<ResendVerificationResponse> {
  return authedJson<ResendVerificationResponse>(
    "/api/auth/resend-verification",
    { method: "POST" },
    "Could not resend verification code",
    AuthApiError,
    { redirectOn401: true },
  );
}

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return publicJson<AuthResponse>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
    "Could not sign in",
  );
}

export async function loginWithGoogle(idToken: string): Promise<AuthResponse> {
  return publicJson<AuthResponse>(
    "/api/auth/google",
    {
      method: "POST",
      body: JSON.stringify({ idToken }),
    },
    "Could not continue with Google",
  );
}

export async function forgotPassword(email: string): Promise<MessageResponse> {
  return publicJson<MessageResponse>(
    "/api/auth/forgot-password",
    {
      method: "POST",
      body: JSON.stringify({ email: email.trim() }),
    },
    "Could not send reset instructions",
  );
}

export async function resetPassword(
  token: string,
  password: string,
): Promise<AuthResponse> {
  return publicJson<AuthResponse>(
    "/api/auth/reset-password",
    {
      method: "POST",
      body: JSON.stringify({ token: token.trim(), password }),
    },
    "Could not reset password",
  );
}

/**
 * Invalidate the current JWT on the server (bumps tokenVersion).
 * Uses raw fetch so a 401 does not trigger authedFetch's redirect loop.
 * Network errors are ignored — callers should clear local auth regardless.
 */
export async function logoutSession(): Promise<void> {
  const token = getAuthToken()?.trim();
  if (!token) return;

  try {
    await fetch(apiUrl("/api/auth/signout"), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // offline / unreachable — local sign-out still proceeds
  }
}
