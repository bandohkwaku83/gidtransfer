"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AppSplashLoader } from "@/components/app-splash-loader";
import {
  fetchAuthMe,
  refreshAuthSessionFromApi,
  userNeedsEmailVerification,
  verifyEmailPath,
} from "@/lib/auth-api";
import {
  allowsUnverifiedAuthSession,
  isPublicBootstrapPath,
  pathRequiresEmailVerification,
} from "@/lib/auth-public-paths";
import { consumeAuthHandoffFromUrl, getAuth, getAuthToken } from "@/lib/auth-demo";
import { isPlatformAdminPath } from "@/lib/studio-url";

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

async function runClientBootstrap(): Promise<void> {
  consumeAuthHandoffFromUrl();

  if (typeof window !== "undefined" && isPlatformAdminPath(window.location.pathname)) {
    return;
  }

  const path = typeof window !== "undefined" ? window.location.pathname : "";
  if (path === "/onboarding" || path.startsWith("/onboarding/")) {
    return;
  }

  const token = getAuthToken()?.trim();
  if (!token) return;

  // Billing callback owns session + returnTo; a bootstrap /me 401 must not
  // hard-navigate to bare /login and drop the Paystack resume path.
  if (path === "/billing/callback" || path.startsWith("/billing/callback/")) {
    return;
  }

  // Incomplete signup token must not drive API refresh (or side effects) on
  // marketing / client gallery pages — those surfaces stay public.
  const pendingUser = getAuth()?.user;
  if (
    pendingUser &&
    userNeedsEmailVerification(pendingUser) &&
    allowsUnverifiedAuthSession(path)
  ) {
    return;
  }

  try {
    const { user: apiUser } = await fetchAuthMe();
    refreshAuthSessionFromApi(apiUser);
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

    // Pending signup OTP must not trap users on marketing/public pages.
    // Only app routes (dashboard, onboarding, etc.) force verify.
    if (
      userNeedsEmailVerification(auth.user) &&
      pathRequiresEmailVerification(pathname)
    ) {
      router.replace(verifyEmailPath());
      return;
    }
  }, [bootDone, pathname, router]);

  useEffect(() => {
    if (!bootDone) return;
    if (!getAuthToken() || userNeedsEmailVerification(getAuth()?.user ?? {})) return;

    const prefetch = () => {
      for (const base of PRIORITY_ROUTES) {
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
  }, [bootDone, router]);

  const showSplash = !bootDone && !publicPath;

  if (showSplash) {
    return <AppSplashLoader />;
  }

  return <>{children}</>;
}
