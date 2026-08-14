"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  billingCallbackReturnPath,
  billingSettingsPath,
  clearBillingCheckoutReference,
  clearBillingReturnPath,
  isBillingPaymentConfirmed,
  paystackReferenceFromSearchParams,
  readBillingCheckoutReference,
  redirectToStudioBillingCallbackIfNeeded,
  rememberBillingCheckoutReference,
  rememberBillingReturnPath,
  verifyBillingPayment,
} from "@/lib/billing-api";
import { fetchAuthMe, applyAuthUserPlan, refreshAuthSessionFromApi } from "@/lib/auth-api";
import { clearAuth, getAuthToken } from "@/lib/auth-demo";
import { HttpError } from "@/lib/http";
import { photographerLoginUrl } from "@/lib/studio-url";

type CallbackState =
  | { kind: "boot" }
  | { kind: "confirming" }
  | { kind: "error"; message: string };

function loginUrlForBillingCallback(reference: string): string {
  return photographerLoginUrl({
    returnTo: billingCallbackReturnPath(reference),
  });
}

function redirectToLoginToFinishBilling(reference: string, clearStaleSession: boolean): void {
  rememberBillingCheckoutReference(reference);
  rememberBillingReturnPath(billingCallbackReturnPath(reference));
  // Only clear when we know the JWT is bad. Clearing on "missing token" also
  // wipes the shared cookie and can destroy the studio-host session.
  if (clearStaleSession) {
    clearAuth();
  }
  window.location.replace(loginUrlForBillingCallback(reference));
}

function BillingCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const started = useRef(false);
  const [state, setState] = useState<CallbackState>({ kind: "boot" });

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const reference =
      paystackReferenceFromSearchParams(searchParams) || readBillingCheckoutReference();
    if (!reference) {
      setState({
        kind: "error",
        message: "Payment reference missing. Return to billing and try again.",
      });
      return;
    }

    rememberBillingCheckoutReference(reference);
    rememberBillingReturnPath(billingCallbackReturnPath(reference));

    // Apex Paystack return has no studio localStorage — bounce to the studio host first.
    if (!getAuthToken()) {
      if (redirectToStudioBillingCallbackIfNeeded(reference)) {
        return;
      }
      redirectToLoginToFinishBilling(reference, false);
      return;
    }

    setState({ kind: "confirming" });

    void (async () => {
      try {
        const result = await verifyBillingPayment(reference, { redirectOn401: false });

        // Apply verify plan first so tenant handoff / entitlements do not wait on /me lag.
        if (result.plan && isBillingPaymentConfirmed(result)) {
          applyAuthUserPlan(result.plan);
        }

        try {
          const { user } = await fetchAuthMe({ redirectOn401: false });
          refreshAuthSessionFromApi(user);
        } catch {
          /* best-effort; billing page will reload */
        }

        clearBillingReturnPath();

        const confirmed = isBillingPaymentConfirmed(result);
        // Keep the Paystack reference on success so billing can apply the verify
        // result immediately. Clearing here forced a "pending" wait with no re-verify.
        if (!confirmed) {
          clearBillingCheckoutReference();
        }

        const nextPath = confirmed
          ? billingSettingsPath({ success: true })
          : billingSettingsPath({ paymentFailed: true });

        if (!getAuthToken()) {
          rememberBillingReturnPath(nextPath);
          window.location.replace(photographerLoginUrl({ returnTo: nextPath }));
          return;
        }

        router.replace(nextPath);
      } catch (err) {
        if (err instanceof HttpError && err.status === 401) {
          if (redirectToStudioBillingCallbackIfNeeded(reference)) {
            return;
          }
          redirectToLoginToFinishBilling(reference, true);
          return;
        }
        if (err instanceof HttpError && err.status === 403) {
          clearBillingCheckoutReference();
          clearBillingReturnPath();
          setState({
            kind: "error",
            message:
              err.message ||
              "This payment belongs to a different account. Sign in with the account that started checkout.",
          });
          return;
        }
        setState({
          kind: "error",
          message: err instanceof Error ? err.message : "Payment verification failed.",
        });
      }
    })();
  }, [router, searchParams]);

  if (state.kind === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-black">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/30">
          <h1 className="text-lg font-semibold text-red-900 dark:text-red-100">
            Could not confirm payment
          </h1>
          <p className="mt-2 text-sm text-red-800 dark:text-red-200">{state.message}</p>
          <Link
            href={billingSettingsPath()}
            className="mt-5 inline-flex font-semibold text-brand underline underline-offset-2 dark:text-brand-on-dark"
          >
            Back to billing
          </Link>
        </div>
      </div>
    );
  }

  if (state.kind === "boot") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-50 px-4 text-center dark:bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-brand" aria-hidden />
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Returning to your studio…
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-50 px-4 text-center dark:bg-black">
      <Loader2 className="h-8 w-8 animate-spin text-brand" aria-hidden />
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Confirming your payment…
      </p>
      <p className="max-w-sm text-xs text-zinc-500">
        This usually takes a few seconds. Please keep this tab open.
      </p>
    </div>
  );
}

export default function BillingCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-500 dark:bg-black">
          Loading…
        </div>
      }
    >
      <BillingCallbackContent />
    </Suspense>
  );
}
