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
import { safeAuthReturnPath, userNeedsEmailVerification, verifyEmailPath } from "@/lib/auth-api";
import { isStudioMember } from "@/lib/studio-access";
import {
  endHostAuthHandoff,
  isHostAuthHandoffInFlight,
  photographerAuthUrl,
  photographerLoginUrl,
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
    const returnTo =
      safeAuthReturnPath(`${window.location.pathname}${window.location.search}`) ??
      undefined;

    if (!auth?.user || !token) {
      // Apex cleared localStorage right before navigating to `{slug}.localhost?_auth=…`.
      // A Strict Mode remount must not overwrite that navigation with bare /login.
      if (isHostAuthHandoffInFlight()) {
        // If the handoff never arrives (blocked navigation / failed consume),
        // don't leave the user on an endless Loading screen.
        const t = window.setTimeout(() => {
          if (isHostAuthHandoffInFlight() && !getAuthToken()) {
            endHostAuthHandoff();
            window.location.replace(photographerLoginUrl({ returnTo }));
          }
        }, 4000);
        return () => window.clearTimeout(t);
      }
      window.location.replace(photographerLoginUrl({ returnTo }));
      return;
    }
    refreshAuthFromPersisted();
    const next = getAuth()?.user;
    if (!next) {
      if (isHostAuthHandoffInFlight()) {
        const t = window.setTimeout(() => {
          if (isHostAuthHandoffInFlight() && !getAuthToken()) {
            endHostAuthHandoff();
            window.location.replace(photographerLoginUrl({ returnTo }));
          }
        }, 4000);
        return () => window.clearTimeout(t);
      }
      window.location.replace(photographerLoginUrl({ returnTo }));
      return;
    }
    if (userNeedsEmailVerification(next)) {
      window.location.replace(photographerAuthUrl(verifyEmailPath()));
      return;
    }
    if (!next.onboardingComplete && !isStudioMember(next)) {
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
