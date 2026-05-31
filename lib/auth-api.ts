import { apiUrl } from "@/lib/api";
import type { AuthUser } from "@/lib/auth-demo";
import {
  cacheOnboardingProfile,
  hydrateAuthUser,
  setAuthSession,
} from "@/lib/auth-demo";
import { extractMessage, HttpError, parseJson } from "@/lib/http";

export class AuthApiError extends HttpError {}

export type ApiAuthUser = {
  _id: string;
  email: string;
  authProvider?: string;
  createdAt?: string;
  updatedAt?: string;
  onboardingComplete?: boolean;
  studio?: {
    companyName?: string;
    phone?: string;
    logoDataUrl?: string;
    logoUrl?: string;
    logoSrc?: string;
  };
};

export type AuthResponse = {
  message?: string;
  token: string;
  user: ApiAuthUser;
  isNewUser?: boolean;
};

export type MessageResponse = {
  message: string;
};

function nameFromEmail(email: string) {
  const localPart = email.split("@")[0]?.trim() || "User";
  return localPart.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Save JWT + user from register, login, Google, or reset-password. */
export function persistAuthResponse(res: AuthResponse): AuthUser {
  const token = res.token?.trim();
  if (!token) {
    throw new Error("Login succeeded but no token was returned. Check the API URL.");
  }
  const user = mapApiUserToAuthUser(res.user);
  setAuthSession({
    email: user.email,
    token,
    user,
  });
  if (user.onboardingComplete && user.studio) {
    cacheOnboardingProfile(user.email, user.studio);
  }
  return user;
}

export function authRedirectPath(user: AuthUser): string {
  return user.onboardingComplete ? "/dashboard" : "/onboarding";
}

export function mapApiUserToAuthUser(user: ApiAuthUser): AuthUser {
  const email = user.email.trim();
  const studio = user.studio
    ? {
        companyName: user.studio.companyName ?? "",
        ...(user.studio.phone ? { phone: user.studio.phone } : {}),
        ...(user.studio.logoSrc || user.studio.logoUrl || user.studio.logoDataUrl
          ? {
              logoDataUrl:
                user.studio.logoSrc ?? user.studio.logoUrl ?? user.studio.logoDataUrl,
            }
          : {}),
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
