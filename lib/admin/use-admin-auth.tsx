"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  clearStoredAdmin,
  getStoredAdmin,
  storeAdmin,
} from "@/lib/admin/auth";
import type { AdminUser } from "@/lib/admin/types";

interface AuthContextValue {
  admin: AdminUser | null;
  loading: boolean;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refresh = useCallback(async () => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("adminToken")
        : null;
    if (!token) {
      setAdmin(null);
      setLoading(false);
      return;
    }

    const storedAdmin = getStoredAdmin();
    setAdmin(storedAdmin);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!loading && !admin && !pathname.startsWith("/admin/login")) {
      router.replace("/admin/login");
    }
  }, [loading, admin, pathname, router]);

  const logout = useCallback(() => {
    localStorage.removeItem("adminToken");
    clearStoredAdmin();
    setAdmin(null);
    router.replace("/admin/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ admin, loading, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AuthProvider");
  return ctx;
}

export { storeAdmin };
