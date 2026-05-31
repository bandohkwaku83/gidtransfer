"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAuth, getAuthToken, refreshAuthFromPersisted } from "@/lib/auth-demo";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const token = getAuthToken();
    if (!auth?.user || !token) {
      router.replace("/login");
      return;
    }
    refreshAuthFromPersisted();
    const next = getAuth()?.user;
    if (!next?.onboardingComplete) {
      router.replace("/onboarding");
      return;
    }
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
