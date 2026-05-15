import { apiUrl } from "@/lib/api";

const AUTH_KEY = "gidostorage_auth_v1";

export type AuthUser = {
  _id: string;
  email: string;
  name: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
};

export type DemoAuthUser = {
  email: string;
  token?: string;
  user?: AuthUser;
};

function storageForRemember(remember: boolean) {
  return remember ? window.localStorage : window.sessionStorage;
}

export function getAuth(): DemoAuthUser | null {
  if (typeof window === "undefined") return null;
  const raw =
    window.sessionStorage.getItem(AUTH_KEY) ?? window.localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DemoAuthUser;
  } catch {
    return null;
  }
}

export function getAuthToken(): string | null {
  return getAuth()?.token ?? null;
}

export function setAuth(email: string, remember: boolean) {
  setAuthSession({ email }, remember);
}

export function setAuthSession(session: DemoAuthUser, remember: boolean) {
  window.sessionStorage.removeItem(AUTH_KEY);
  window.localStorage.removeItem(AUTH_KEY);
  storageForRemember(remember).setItem(AUTH_KEY, JSON.stringify(session));
}

export function clearAuth() {
  window.sessionStorage.removeItem(AUTH_KEY);
  window.localStorage.removeItem(AUTH_KEY);
}

export async function logout(): Promise<void> {
  const token = getAuthToken();
  try {
    if (token) {
      await fetch(apiUrl("/api/auth/logout"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  } catch {
    /* network/logout failures are non-fatal — local session is cleared below */
  } finally {
    clearAuth();
  }
}
