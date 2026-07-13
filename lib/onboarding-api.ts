import { mapApiUserToAuthUser, mergeApiAuthUser, type ApiAuthUser } from "@/lib/auth-api";
import {
  cacheOnboardingProfile,
  getAuth,
  getAuthToken,
  setAuthSession,
  type AuthUser,
} from "@/lib/auth-demo";
import { authedFetch, extractMessage, HttpError, parseJson } from "@/lib/http";

export type OnboardingResponse = {
  message?: string;
  user: ApiAuthUser;
  suggestedCompanySlug?: string | null;
  studioUrlSuffix?: string | null;
  studioUrl?: string | null;
};

export function persistOnboardingResponse(res: OnboardingResponse): AuthUser {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not signed in. Please log in again.");
  }
  const prior = getAuth()?.user;
  const user = mapApiUserToAuthUser(mergeApiAuthUser(res.user, prior), {
    studioUrlSuffix: res.studioUrlSuffix,
    studioUrl: res.studioUrl,
  });
  setAuthSession({
    email: user.email,
    token,
    user,
  });
  if (user.onboardingComplete && user.studio) {
    cacheOnboardingProfile(user, user.studio);
  }
  return user;
}

export class OnboardingApiError extends HttpError {}

export function onboardingErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof OnboardingApiError) {
    if (err.status === 409) {
      const msg = err.message?.trim();
      if (msg && /sms display name/i.test(msg)) return msg;
      return "This studio URL is already taken";
    }
    return err.message || fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function logOnboarding(message: string, data?: unknown) {
  if (process.env.NODE_ENV !== "development") return;
  if (data !== undefined) {
    console.log(`[onboarding] ${message}`, data);
  } else {
    console.log(`[onboarding] ${message}`);
  }
}

function formDataPayloadForLog(form: FormData): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const [key, value] of form.entries()) {
    if (value instanceof File) {
      payload[key] = {
        type: "file",
        name: value.name,
        size: value.size,
        mimeType: value.type,
      };
    } else if (typeof value === "string" && key === "logoDataUrl" && value.length > 120) {
      payload[key] = `${value.slice(0, 80)}… (${value.length} chars)`;
    } else {
      payload[key] = value;
    }
  }
  return payload;
}

async function onboardingJson<T>(
  init: RequestInit,
  fallbackError: string,
): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  if (init.body instanceof FormData) {
    logOnboarding("request payload", { method, payload: formDataPayloadForLog(init.body) });
  } else {
    logOnboarding("request", { method });
  }

  const res = await authedFetch("/api/onboarding", init);
  const body = await parseJson(res);

  if (!res.ok) {
    logOnboarding("response error", { method, status: res.status, body });
    throw new OnboardingApiError(
      extractMessage(body, `${fallbackError} (${res.status})`),
      res.status,
      body,
    );
  }

  logOnboarding("response", { method, status: res.status, body });
  return body as T;
}

/** Values accepted by POST /api/onboarding (`primaryDeliverable`). */
export type PrimaryDeliverableValue = "photos" | "videos" | "photos_videos";

export const PRIMARY_DELIVERABLE_OPTIONS: {
  value: PrimaryDeliverableValue;
  label: string;
}[] = [
  { value: "photos", label: "Photos" },
  { value: "videos", label: "Videos" },
  { value: "photos_videos", label: "Photos + Videos" },
];

export const DEFAULT_PRIMARY_DELIVERABLE: PrimaryDeliverableValue = "photos_videos";

/** @deprecated Use {@link PrimaryDeliverableValue}. */
export type PrimaryDeliverValue = PrimaryDeliverableValue;

/** @deprecated Use {@link PRIMARY_DELIVERABLE_OPTIONS}. */
export const PRIMARY_DELIVER_OPTIONS = PRIMARY_DELIVERABLE_OPTIONS;

/** @deprecated Use {@link DEFAULT_PRIMARY_DELIVERABLE}. */
export const DEFAULT_PRIMARY_DELIVER = DEFAULT_PRIMARY_DELIVERABLE;

export function parsePrimaryDeliverable(raw?: string | null): PrimaryDeliverableValue {
  const v = raw?.trim();
  if (v === "photos" || v === "videos" || v === "photos_videos") return v;
  if (v === "photos_and_videos") return "photos_videos";
  return DEFAULT_PRIMARY_DELIVERABLE;
}

/** @deprecated Use {@link parsePrimaryDeliverable}. */
export const parsePrimaryDeliver = parsePrimaryDeliverable;

function appendOnboardingFormFields(
  form: FormData,
  input: {
    companyName: string;
    phone: string;
    country?: string;
    companySlug: string;
    smsSenderId: string;
    primaryDeliverable?: PrimaryDeliverableValue;
    referralCode?: string;
    logoFile?: File | null;
    logoDataUrl?: string;
  },
) {
  form.append("companyName", input.companyName.trim());
  form.append("phone", input.phone.trim());
  form.append("smsSenderId", input.smsSenderId.trim().toUpperCase());
  const country = input.country?.trim();
  if (country) {
    form.append("country", country);
  }
  form.append("companySlug", input.companySlug.trim());
  if (input.primaryDeliverable) {
    form.append("primaryDeliverable", input.primaryDeliverable);
  }
  const referral = input.referralCode?.trim();
  if (referral) {
    form.append("referralCode", referral);
  }
  if (input.logoFile) {
    form.append("logo", input.logoFile);
  } else if (input.logoDataUrl?.trim()) {
    form.append("logoDataUrl", input.logoDataUrl.trim());
  }
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
  country: string;
  companySlug: string;
  smsSenderId: string;
  primaryDeliverable: PrimaryDeliverableValue;
  referralCode?: string;
  logoFile?: File | null;
  logoDataUrl?: string;
}): Promise<OnboardingResponse> {
  const form = new FormData();
  appendOnboardingFormFields(form, input);

  const res = await onboardingJson<OnboardingResponse>(
    { method: "POST", body: form },
    "Could not save studio profile",
  );

  // API may omit `onboardingComplete` on first save; treat a successful POST as complete
  // so navigation does not send the user back to `/onboarding`.
  return {
    ...res,
    user: {
      ...res.user,
      onboardingComplete: true,
      studio: {
        ...res.user.studio,
        companyName: res.user.studio?.companyName?.trim() || input.companyName,
        companySlug: res.user.studio?.companySlug?.trim() || input.companySlug,
        phone: res.user.studio?.phone?.trim() || input.phone,
        country: res.user.studio?.country?.trim() || input.country,
        primaryDeliverable:
          res.user.studio?.primaryDeliverable?.trim() || input.primaryDeliverable,
        smsSenderId:
          res.user.studio?.smsSenderId?.trim().toUpperCase() ||
          input.smsSenderId.trim().toUpperCase(),
      },
    },
  };
}

/** PUT /api/onboarding — update studio profile from settings. */
export async function updateOnboarding(input: {
  companyName: string;
  phone: string;
  country?: string;
  companySlug: string;
  smsSenderId: string;
  primaryDeliverable?: PrimaryDeliverableValue;
  referralCode?: string;
  logoFile?: File | null;
  logoDataUrl?: string;
}): Promise<OnboardingResponse> {
  const form = new FormData();
  appendOnboardingFormFields(form, input);

  return onboardingJson<OnboardingResponse>(
    { method: "PUT", body: form },
    "Could not update studio profile",
  );
}
