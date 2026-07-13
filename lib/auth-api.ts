import { apiUrl } from "@/lib/api";
import type { AuthProvider, AuthUser } from "@/lib/auth-demo";
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
  photographerAuthUrl,
  redirectToTenantHostIfNeeded,
} from "@/lib/studio-url";

export class AuthApiError extends HttpError {}

export { EmailNotVerifiedError } from "@/lib/http";

export type ApiAuthUser = {
  _id: string;
  email: string;
  emailVerified?: boolean;
  emailVerifiedAt?: string | null;
  authProvider?: AuthProvider;
  createdAt?: string;
  updatedAt?: string;
  onboardingComplete?: boolean;
  studio?: {
    companyName?: string;
    companySlug?: string;
    phone?: string;
    country?: string;
    logoDataUrl?: string;
    logoUrl?: string;
    logoSrc?: string;
    studioUrl?: string;
    studioUrlSuffix?: string;
    primaryDeliverable?: string;
    primaryDeliver?: string;
    referralCode?: string;
  } & Partial<StudioSmsFields>;
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
  return "/verify-email";
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

  return {
    ...apiUser,
    _id: apiUser._id?.trim() || prior?._id || "",
    email: apiUser.email?.trim() || prior?.email || "",
    onboardingComplete,
    createdAt: apiUser.createdAt ?? prior?.createdAt,
    updatedAt: apiUser.updatedAt ?? prior?.updatedAt,
    emailVerified:
      apiUser.emailVerified !== undefined ? apiUser.emailVerified : prior?.emailVerified,
    emailVerifiedAt:
      apiUser.emailVerifiedAt !== undefined ? apiUser.emailVerifiedAt : prior?.emailVerifiedAt,
    authProvider: apiUser.authProvider ?? prior?.authProvider,
    studio: mergeStudioProfile(apiUser.studio, prior?.studio),
  };
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
export function persistAuthResponse(res: AuthResponse): AuthUser {
  const token = res.token?.trim();
  if (!token) {
    throw new Error("Login succeeded but no token was returned. Check the API URL.");
  }
  const prior = getAuth()?.user;
  const user = mapApiUserToAuthUser(mergeApiAuthUser(res.user, prior));
  setAuthSession({
    email: user.email,
    token,
    user,
  });
  if (user.onboardingComplete && user.studio) {
    cacheOnboardingProfile(user, user.studio);
  } else {
    clearOnboardingProfileCache(user);
  }
  return user;
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

  if (!user.onboardingComplete) {
    const apexOnboarding = photographerAuthUrl("/onboarding");
    if (
      typeof window !== "undefined" &&
      window.location.origin !== new URL(apexOnboarding).origin
    ) {
      window.location.replace(apexOnboarding);
      return true;
    }
    router.replace("/onboarding");
    return false;
  }

  const slug = user.studio?.companySlug?.trim();
  if (
    slug &&
    redirectToTenantHostIfNeeded(
      slug,
      "/dashboard",
      studioHostOptionsFromUser(user),
      authHandoffPayload(),
      clearAuth,
    )
  ) {
    return true;
  }

  if (typeof window !== "undefined") {
    window.location.replace(photographerAuthUrl("/dashboard"));
    return true;
  }
  router.replace("/dashboard");
  return true;
}

export function mapApiUserToAuthUser(
  user: ApiAuthUser,
  extras?: { studioUrl?: string | null; studioUrlSuffix?: string | null },
): AuthUser {
  const email = user.email.trim();
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
        ...(user.studio.logoSrc || user.studio.logoUrl || user.studio.logoDataUrl
          ? {
              logoDataUrl:
                user.studio.logoSrc ?? user.studio.logoUrl ?? user.studio.logoDataUrl,
            }
          : {}),
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
  return hydrateAuthUser({
    _id: user._id,
    email,
    name: studio?.companyName?.trim() || nameFromEmail(email),
    role: "photographer",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    onboardingComplete: Boolean(user.onboardingComplete),
    ...(user.emailVerified !== undefined ? { emailVerified: user.emailVerified } : {}),
    ...(user.emailVerifiedAt !== undefined ? { emailVerifiedAt: user.emailVerifiedAt } : {}),
    ...(user.authProvider ? { authProvider: user.authProvider } : {}),
    studio,
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

/** GET /api/auth/me — refresh session user from the server. */
export async function fetchAuthMe(): Promise<{ user: ApiAuthUser }> {
  return authedJson<{ user: ApiAuthUser }>(
    "/api/auth/me",
    { method: "GET" },
    "Could not load account",
    AuthApiError,
    { redirectOn401: true },
  );
}

/** POST /api/auth/verify-email — completes signup after the user enters the emailed OTP. */
export async function verifyEmail(code: string): Promise<AuthResponse> {
  const digits = code.replace(/\D/g, "").slice(0, 6);
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
