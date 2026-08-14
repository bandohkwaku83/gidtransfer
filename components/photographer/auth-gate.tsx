"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  authHandoffPayload,
  clearAuth,
  consumeAuthHandoffFromUrl,
  getAuth,
  getAuthToken,
  refreshAuthFromPersisted,
} from "@/lib/auth-demo";
import { userNeedsEmailVerification, verifyEmailPath } from "@/lib/auth-api";
import {
  endHostAuthHandoff,
  isHostAuthHandoffInFlight,
  photographerAuthUrl,
  redirectToTenantHostIfNeeded,
} from "@/lib/studio-url";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const consumedHandoff = consumeAuthHandoffFromUrl();
    if (consumedHandoff) {
      endHostAuthHandoff();
    }

    const auth = getAuth();
    const token = getAuthToken();
    if (!auth?.user || !token) {
      // Apex cleared localStorage right before navigating to `{slug}.localhost?_auth=…`.
      // A Strict Mode remount must not overwrite that navigation with bare /login.
      if (isHostAuthHandoffInFlight()) {
        return;
      }
      window.location.replace(photographerAuthUrl("/login"));
      return;
    }
    refreshAuthFromPersisted();
    const next = getAuth()?.user;
    if (!next) {
      if (isHostAuthHandoffInFlight()) {
        return;
      }
      window.location.replace(photographerAuthUrl("/login"));
      return;
    }
    if (userNeedsEmailVerification(next)) {
      window.location.replace(photographerAuthUrl(verifyEmailPath()));
      return;
    }
    if (!next.onboardingComplete) {
      window.location.replace(photographerAuthUrl("/onboarding"));
      return;
    }
    const slug = next.studio?.companySlug?.trim();
    // Keep deep links (e.g. billing success) when moving apex → studio host.
    const dest = `${window.location.pathname}${window.location.search}` || "/dashboard";
    if (
      slug &&
      redirectToTenantHostIfNeeded(
        slug,
        dest,
        {
          studioUrl: next.studio?.studioUrl,
          studioUrlSuffix: next.studio?.studioUrlSuffix,
        },
        authHandoffPayload(),
        clearAuth,
      )
    ) {
      return;
    }
    endHostAuthHandoff();
    queueMicrotask(() => setReady(true));
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-500 dark:bg-black">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
