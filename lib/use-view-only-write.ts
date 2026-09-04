"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { BILLING_HREF, isViewOnly } from "@/lib/plan";
import { usePlanEntitlements } from "@/lib/use-plan-entitlements";

/** Returns true when the write was blocked and the user was sent to billing. */
export function useGuardViewOnlyWrite(): () => boolean {
  const router = useRouter();
  const { plan } = usePlanEntitlements();

  return useCallback(() => {
    if (!isViewOnly({ plan })) return false;
    router.push(BILLING_HREF);
    return true;
  }, [plan, router]);
}
