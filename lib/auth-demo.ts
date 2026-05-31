const AUTH_KEY = "gidostorage_auth_v1";
const ONBOARDING_BY_EMAIL_KEY = "gidostorage_onboarding_by_email_v1";

/** Saved at onboarding; persisted locally by email so returning sessions skip the form. */
export type PhotographerStudioProfile = {
  companyName: string;
  logoDataUrl?: string;
  website?: string;
  phone?: string;
};

export type AuthUser = {
  _id: string;
  email: string;
  name: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
  onboardingComplete?: boolean;
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

function readPersistedOnboarding(email: string): PersistedOnboarding | null {
  return readOnboardingMap()[normEmail(email)] ?? null;
}

/** Merge API user with optional local onboarding cache (fallback when API omits studio). */
export function hydrateAuthUser(user: AuthUser): AuthUser {
  if (user.onboardingComplete) {
    return {
      ...user,
      name: user.studio?.companyName?.trim() || user.name,
    };
  }
  const p = readPersistedOnboarding(user.email);
  if (p?.complete && p.studio) {
    return {
      ...user,
      onboardingComplete: true,
      studio: p.studio,
      name: p.studio.companyName.trim() || user.name,
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
  email: string,
  studio: PhotographerStudioProfile,
): void {
  const map = readOnboardingMap();
  map[normEmail(email)] = { complete: true, studio };
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
  const email = auth.user.email;
  const map = readOnboardingMap();
  map[normEmail(email)] = { complete: true, studio };
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

/** Prefer the stored session that includes a JWT (avoids stale demo sessions in the other store). */
export function getAuth(): DemoAuthUser | null {
  if (typeof window === "undefined") return null;
  const fromSession = readAuthFromStorage(window.sessionStorage);
  const fromLocal = readAuthFromStorage(window.localStorage);
  const withToken = [fromLocal, fromSession].find((s) => s?.token?.trim());
  return withToken ?? fromLocal ?? fromSession ?? null;
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
}

export function clearAuth() {
  window.sessionStorage.removeItem(AUTH_KEY);
  window.localStorage.removeItem(AUTH_KEY);
}

export async function logout(): Promise<void> {
  clearAuth();
}
