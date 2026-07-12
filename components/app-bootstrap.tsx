"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AppSplashLoader } from "@/components/app-splash-loader";
import {
  fetchAuthMe,
  mapApiUserToAuthUser,
  userNeedsEmailVerification,
  verifyEmailPath,
} from "@/lib/auth-api";
import { consumeAuthHandoffFromUrl, getAuth, getAuthToken, setAuthSession } from "@/lib/auth-demo";

/** App Router paths; must match real `app/` routes (use pathname shape Next resolves). */
const PRIORITY_ROUTES = [
  "/dashboard",
  "/dashboard/galleries",
  "/dashboard/galleries/trash",
  "/dashboard/clients",
  "/dashboard/settings",
  "/dashboard/schedules",
  "/dashboard/income",
  "/dashboard/communication",
  "/dashboard/uploads",
  "/dashboard/storage",
  "/dashboard/downloads",
  "/dashboard/sms",
  "/dashboard/notifications",
  "/login",
  "/verify-email",
  "/onboarding",
  "/reset-password",
];

const PUBLIC_GALLERY_RESERVED_SEGMENTS = new Set([
  "dashboard",
  "admin",
  "login",
  "verify-email",
  "onboarding",
  "reset-password",
  "share",
  "g",
  "api",
  "uploads",
  "studio",
  "client",
]);

function isPublicGallerySlugPath(pathname: string): boolean {
  const m = pathname.match(/^\/([^/]+)\/([^/]+)$/);
  if (!m?.[1] || !m[2]) return false;
  return !PUBLIC_GALLERY_RESERVED_SEGMENTS.has(m[1].toLowerCase());
}

function isPublicBootstrapPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/admin/login" ||
    pathname.startsWith("/admin/login/") ||
    pathname === "/verify-email" ||
    pathname === "/onboarding" ||
    pathname === "/reset-password" ||
    pathname === "/billing/callback" ||
    pathname === "/studio" ||
    pathname.startsWith("/share/") ||
    pathname.startsWith("/g/") ||
    pathname.startsWith("/client/") ||
    isPublicGallerySlugPath(pathname)
  );
}

async function runClientBootstrap(): Promise<void> {
  consumeAuthHandoffFromUrl();

  const token = getAuthToken()?.trim();
  if (!token) return;

  try {
    const { user: apiUser } = await fetchAuthMe();
    const auth = getAuth();
    if (!auth) return;
    const user = mapApiUserToAuthUser(apiUser);
    setAuthSession({ ...auth, token, user });
  } catch {
    // 401 / network — authedFetch handles session expiry
  }
}

export function AppBootstrap({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const publicPath = isPublicBootstrapPath(pathname);

  /** After first successful boot, never block the shell again (e.g. login → dashboard). */
  const everBootedRef = useRef(publicPath);
  const [bootDone, setBootDone] = useState(publicPath);

  useEffect(() => {
    let cancelled = false;

    if (publicPath || everBootedRef.current) {
      void runClientBootstrap();
      everBootedRef.current = true;
      setBootDone(true);
      return;
    }

    void (async () => {
      await runClientBootstrap();
      if (!cancelled) {
        everBootedRef.current = true;
        setBootDone(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [publicPath]);

  useEffect(() => {
    if (!bootDone) return;

    const auth = getAuth();
    const loggedIn = Boolean(getAuthToken());
    if (!loggedIn || !auth?.user) return;

    if (
      userNeedsEmailVerification(auth.user) &&
      !pathname.startsWith(verifyEmailPath()) &&
      !pathname.startsWith("/login")
    ) {
      router.replace(verifyEmailPath());
      return;
    }

    const prefetch = () => {
      for (const base of PRIORITY_ROUTES) {
        if (pathname === base || pathname.startsWith(`${base}/`)) continue;
        router.prefetch(base);
      }
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = window.requestIdleCallback(prefetch, { timeout: 4000 });
      return () => {
        window.cancelIdleCallback(id);
      };
    }
    const t = setTimeout(prefetch, 250);
    return () => clearTimeout(t);
  }, [bootDone, pathname, router]);

  const showSplash = !bootDone && !publicPath;

  if (showSplash) {
    return <AppSplashLoader />;
  }

  return <>{children}</>;
}
