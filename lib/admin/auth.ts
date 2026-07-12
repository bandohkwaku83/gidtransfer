import adminApi from "./admin-client";
import type { AdminUser, LoginResponse } from "@/lib/admin/types";

interface RawAdmin {
  _id?: string;
  id?: string;
  email: string;
  name: string;
  role?: string;
  isActive?: boolean;
}

function normalizeAdmin(raw: RawAdmin): AdminUser {
  return {
    id: raw.id ?? raw._id ?? "",
    email: raw.email,
    name: raw.name,
    role: raw.role,
    isActive: raw.isActive,
  };
}

export const ADMIN_USER_KEY = "adminUser";

export function getStoredAdmin(): AdminUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(ADMIN_USER_KEY);
  if (!raw) return null;
  try {
    return normalizeAdmin(JSON.parse(raw) as RawAdmin);
  } catch {
    return null;
  }
}

export function storeAdmin(admin: AdminUser): void {
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(admin));
}

export function clearStoredAdmin(): void {
  localStorage.removeItem(ADMIN_USER_KEY);
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const { data } = await adminApi.post<{
    message?: string;
    token: string;
    admin: RawAdmin;
  }>("/api/admin/auth/login", { email, password });

  const admin = normalizeAdmin(data.admin);
  return { message: data.message, token: data.token, admin };
}
