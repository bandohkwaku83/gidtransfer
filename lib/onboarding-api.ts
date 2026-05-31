import { mapApiUserToAuthUser, type ApiAuthUser } from "@/lib/auth-api";
import {
  cacheOnboardingProfile,
  getAuthToken,
  setAuthSession,
  type AuthUser,
} from "@/lib/auth-demo";
import { authedFetch, extractMessage, HttpError, parseJson } from "@/lib/http";

export type OnboardingResponse = {
  message?: string;
  user: ApiAuthUser;
};

export function persistOnboardingResponse(res: OnboardingResponse): AuthUser {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not signed in. Please log in again.");
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

export class OnboardingApiError extends HttpError {}

async function onboardingJson<T>(
  init: RequestInit,
  fallbackError: string,
): Promise<T> {
  const res = await authedFetch("/api/onboarding", init);
  const body = await parseJson(res);
  if (!res.ok) {
    throw new OnboardingApiError(
      extractMessage(body, `${fallbackError} (${res.status})`),
      res.status,
      body,
    );
  }
  return body as T;
}

/** GET /api/onboarding — current studio profile and onboarding status. */
export async function fetchOnboarding(): Promise<OnboardingResponse> {
  return onboardingJson<OnboardingResponse>(
    { method: "GET" },
    "Could not load studio profile",
  );
}

export async function completeOnboarding(input: {
  companyName: string;
  phone: string;
  logoFile?: File | null;
  logoDataUrl?: string;
}): Promise<OnboardingResponse> {
  const form = new FormData();
  form.append("companyName", input.companyName.trim());
  form.append("phone", input.phone.trim());
  if (input.logoFile) {
    form.append("logo", input.logoFile);
  } else if (input.logoDataUrl?.trim()) {
    form.append("logoDataUrl", input.logoDataUrl.trim());
  }

  return onboardingJson<OnboardingResponse>(
    { method: "POST", body: form },
    "Could not save studio profile",
  );
}
