import { AUTH_HANDOFF_PARAM } from "@/lib/studio-url";

const AUTH_KEY = "gidostorage_auth_v1";
const ONBOARDING_BY_EMAIL_KEY = "gidostorage_onboarding_by_email_v1";

import type { StudioSmsFields } from "@/lib/sms-sender";

/** Saved at onboarding; persisted locally by email so returning sessions skip the form. */
export type PhotographerStudioProfile = {
  companyName: string;
  companySlug?: string;
  studioUrl?: string;
  studioUrlSuffix?: string;
  logoDataUrl?: string;
  website?: string;
  phone?: string;
  country?: string;
  primaryDeliver?: string;
  primaryDeliverable?: string;
  referralCode?: string;
} & Partial<StudioSmsFields>;

export type AuthProvider = "email" | "google" | "apple";

export type AuthUser = {
  _id: string;
  email: string;
  name: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
  onboardingComplete?: boolean;
  emailVerified?: boolean;
  emailVerifiedAt?: string | null;
  authProvider?: AuthProvider;
  studio?: PhotographerStudioProfile;
};

export type DemoAuthUser = {
  email: string;
  token?: string;
  user?: AuthUser;
};

type PersistedOnboarding = {
  complete: boolean;
  studio?: PhotographerStudioProfile;
};

function normEmail(email: string) {
  return email.trim().toLowerCase();
}

function readOnboardingMap(): Record<string, PersistedOnboarding> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ONBOARDING_BY_EMAIL_KEY);
    if (!raw) return {};
    const v = JSON.parse(raw) as unknown;
    return v && typeof v === "object" ? (v as Record<string, PersistedOnboarding>) : {};
  } catch {
    return {};
  }
}

function writeOnboardingMap(map: Record<string, PersistedOnboarding>) {
  window.localStorage.setItem(ONBOARDING_BY_EMAIL_KEY, JSON.stringify(map));
}

function onboardingCacheKey(user: { _id: string; email: string }): string {
  const id = user._id?.trim();
  if (id) return `id:${id}`;
  return `email:${normEmail(user.email)}`;
}

function readPersistedOnboarding(user: { _id: string; email: string }): PersistedOnboarding | null {
  const map = readOnboardingMap();
  return map[onboardingCacheKey(user)] ?? null;
}

/** Drop local onboarding cache (e.g. API says incomplete for a new account with a reused email). */
export function clearOnboardingProfileCache(user: { _id: string; email: string }): void {
  const map = readOnboardingMap();
  delete map[onboardingCacheKey(user)];
  delete map[normEmail(user.email)];
  writeOnboardingMap(map);
}

/** Merge API user with optional local onboarding cache (fallback when API omits studio). */
export function hydrateAuthUser(user: AuthUser): AuthUser {
  const persisted = readPersistedOnboarding(user);
  const complete = user.onboardingComplete || persisted?.complete === true;
  if (complete) {
    const studio = user.studio ?? persisted?.studio;
    return {
      ...user,
      onboardingComplete: true,
      ...(studio ? { studio } : {}),
      name:
        studio?.companyName?.trim() ||
        user.studio?.companyName?.trim() ||
        user.name,
    };
  }
  return {
    ...user,
    onboardingComplete: false,
    studio: user.studio,
  };
}

/** Cache completed onboarding locally (mirrors API after POST /api/onboarding). */
export function cacheOnboardingProfile(
  user: { _id: string; email: string },
  studio: PhotographerStudioProfile,
): void {
  const map = readOnboardingMap();
  map[onboardingCacheKey(user)] = { complete: true, studio };
  delete map[normEmail(user.email)];
  writeOnboardingMap(map);
}

export function isAuthRemembered(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(AUTH_KEY) !== null;
}

/** If localStorage has a finished onboarding for this email, sync it into the active session. */
export function refreshAuthFromPersisted(): void {
  const auth = getAuth();
  if (!auth?.user) return;
  const nextUser = hydrateAuthUser(auth.user);
  const a = auth.user;
  if (
    nextUser.onboardingComplete === a.onboardingComplete &&
    nextUser.studio?.companyName === a.studio?.companyName &&
    nextUser.studio?.companySlug === a.studio?.companySlug &&
    nextUser.studio?.studioUrl === a.studio?.studioUrl &&
    nextUser.studio?.logoDataUrl === a.studio?.logoDataUrl &&
    nextUser.studio?.website === a.studio?.website &&
    nextUser.studio?.phone === a.studio?.phone
  ) {
    return;
  }
  const token = auth.token?.trim() || getAuthToken();
  setAuthSession(
    {
      ...auth,
      token: token ?? undefined,
      user: nextUser,
    },
    true,
  );
}

/** Update studio profile from settings (same persistence as onboarding). */
export function updatePhotographerStudioProfile(studio: PhotographerStudioProfile): void {
  completePhotographerOnboarding(studio);
}

export function completePhotographerOnboarding(studio: PhotographerStudioProfile): void {
  const auth = getAuth();
  if (!auth?.user) {
    throw new Error("Not signed in.");
  }
  const map = readOnboardingMap();
  map[onboardingCacheKey(auth.user)] = { complete: true, studio };
  delete map[normEmail(auth.user.email)];
  writeOnboardingMap(map);
  const company = studio.companyName.trim();
  const nextUser: AuthUser = {
    ...auth.user,
    onboardingComplete: true,
    studio,
    name: company || auth.user.name,
    updatedAt: new Date().toISOString(),
  };
  const token = auth.token?.trim() || getAuthToken();
  setAuthSession(
    {
      ...auth,
      token: token ?? undefined,
      user: nextUser,
    },
    true,
  );
}

function storageForRemember(remember: boolean) {
  return remember ? window.localStorage : window.sessionStorage;
}

function readAuthFromStorage(storage: Storage): DemoAuthUser | null {
  const raw = storage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DemoAuthUser;
  } catch {
    return null;
  }
}

/** Share session across `localhost` and `{studio}.localhost` (localStorage is per-host). */
function sharedAuthCookieDomain(): string | null {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) {
    return ".localhost";
  }
  const base = process.env.NEXT_PUBLIC_STUDIO_BASE_DOMAIN?.trim().toLowerCase();
  if (!base) return null;
  const bare = base.replace(/^\./, "");
  if (host === bare || host.endsWith(`.${bare}`)) {
    return `.${bare}`;
  }
  return null;
}

function readAuthFromCookie(): DemoAuthUser | null {
  if (typeof document === "undefined" || !sharedAuthCookieDomain()) return null;
  const prefix = `${AUTH_KEY}=`;
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    if (!trimmed.startsWith(prefix)) continue;
    try {
      return JSON.parse(decodeURIComponent(trimmed.slice(prefix.length))) as DemoAuthUser;
    } catch {
      return null;
    }
  }
  return null;
}

function writeAuthCookie(session: DemoAuthUser): void {
  const domain = sharedAuthCookieDomain();
  if (!domain) return;
  try {
    const value = encodeURIComponent(JSON.stringify(session));
    const maxAge = 60 * 60 * 24 * 30;
    let cookie = `${AUTH_KEY}=${value}; path=/; max-age=${maxAge}; SameSite=Lax; domain=${domain}`;
    if (window.location.protocol === "https:") {
      cookie += "; Secure";
    }
    document.cookie = cookie;
  } catch {
    /* quota / encoding — localStorage on this host still works */
  }
}

function clearAuthCookie(): void {
  const domain = sharedAuthCookieDomain();
  const base = `${AUTH_KEY}=; path=/; max-age=0; SameSite=Lax`;
  document.cookie = domain ? `${base}; domain=${domain}` : base;
}

/** Prefer the stored session that includes a JWT (avoids stale demo sessions in the other store). */
export function getAuth(): DemoAuthUser | null {
  if (typeof window === "undefined") return null;
  const fromSession = readAuthFromStorage(window.sessionStorage);
  const fromLocal = readAuthFromStorage(window.localStorage);
  const fromCookie = readAuthFromCookie();
  const withToken = [fromLocal, fromSession, fromCookie].find((s) => s?.token?.trim());
  const auth = withToken ?? fromLocal ?? fromSession ?? fromCookie ?? null;
  if (auth?.token?.trim()) {
    if (!fromLocal?.token?.trim() && !fromSession?.token?.trim()) {
      try {
        window.localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
      } catch {
        /* ignore */
      }
    }
    if (!fromCookie?.token?.trim()) {
      writeAuthCookie(auth);
    }
  }
  return auth;
}

export function getAuthToken(): string | null {
  const token = getAuth()?.token?.trim();
  return token || null;
}

export function setAuth(email: string, remember: boolean) {
  setAuthSession({ email }, remember);
}

/** Persist auth + JWT. Default `remember: true` keeps the token in localStorage for API calls. */
export function setAuthSession(session: DemoAuthUser, remember = true) {
  window.sessionStorage.removeItem(AUTH_KEY);
  window.localStorage.removeItem(AUTH_KEY);
  storageForRemember(remember).setItem(AUTH_KEY, JSON.stringify(session));
  writeAuthCookie(session);
}

export function clearAuth() {
  window.sessionStorage.removeItem(AUTH_KEY);
  window.localStorage.removeItem(AUTH_KEY);
  clearAuthCookie();
}

export async function logout(): Promise<void> {
  clearAuth();
  const { logoutSession } = await import("@/lib/auth-api");
  // Do not block navigation on the server round-trip.
  void logoutSession();
}

function encodeAuthHandoff(session: DemoAuthUser): string {
  const json = JSON.stringify(session);
  if (typeof window !== "undefined") {
    return btoa(unescape(encodeURIComponent(json)));
  }
  return Buffer.from(json, "utf8").toString("base64");
}

function decodeAuthHandoff(encoded: string): DemoAuthUser | null {
  try {
    const json =
      typeof window !== "undefined"
        ? decodeURIComponent(escape(atob(encoded)))
        : Buffer.from(encoded, "base64").toString("utf8");
    const session = JSON.parse(json) as DemoAuthUser;
    return session?.token?.trim() ? session : null;
  } catch {
    return null;
  }
}

/** Payload for cross-host redirect (`localhost` → `{slug}.localhost`). */
export function authHandoffPayload(): string | null {
  const auth = getAuth();
  if (!auth?.token?.trim()) return null;
  try {
    return encodeAuthHandoff(auth);
  } catch {
    return null;
  }
}

/**
 * Apply session from `?_auth=…` after apex → studio subdomain redirect, then strip the param.
 * Browsers do not share cookies/localStorage between `localhost` and `*.localhost`.
 */
export function consumeAuthHandoffFromUrl(): boolean {
  if (typeof window === "undefined") return false;

  const params = new URLSearchParams(window.location.search);
  const raw = params.get(AUTH_HANDOFF_PARAM);
  if (!raw) return false;

  const session = decodeAuthHandoff(raw);
  if (!session) return false;

  setAuthSession(session);
  params.delete(AUTH_HANDOFF_PARAM);
  const qs = params.toString();
  const path = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
  window.history.replaceState({}, "", path);
  return true;
}
