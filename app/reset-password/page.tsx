"use client";

import Image from "next/image";
import Link from "next/link";
import { AuthFormPasswordInput } from "@/components/ui/form-input";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  AuthApiError,
  authRedirectPath,
  persistAuthResponse,
  resetPassword,
} from "@/lib/auth-api";
import { cn } from "@/lib/utils";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function authErrorMessage(err: unknown, fallback: string) {
    if (err instanceof AuthApiError) return err.message;
    if (err instanceof Error && err.message) return err.message;
    return fallback;
  }

  async function submit() {
    if (submitting) return;
    setError(null);

    if (!token) {
      setError("This reset link is missing a token. Request a new link from the login page.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await resetPassword(token, password);
      const user = persistAuthResponse(res);
      router.replace(authRedirectPath(user));
    } catch (err) {
      setError(authErrorMessage(err, "Could not reset your password. Try again."));
    } finally {
      setSubmitting(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") submit();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#fbf7ef] px-4 py-6 sm:px-10 sm:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,247,239,0.9),transparent_45%)] blur-2xl" />
      <div className="relative z-[1] mx-auto flex w-full max-w-lg flex-1 flex-col justify-center">
        <div className="rounded-2xl border border-slate-200/70 bg-white px-5 py-8 shadow-2xl shadow-slate-900/15 sm:px-8 sm:py-10">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-500 transition hover:text-slate-800"
          >
            ← Back to log in
          </Link>

          <div className="mt-4 flex justify-center">
            <Image
              src="/images/gido_logo.png"
              alt="Gido logo"
              width={120}
              height={120}
            />
          </div>

          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-slate-900">
            Set a new password
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Choose a new password for your studio account. You will be signed in automatically.
          </p>

          {!token ? (
            <div
              role="alert"
              className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            >
              This link is invalid. Use{" "}
              <Link href="/login" className="font-semibold text-teal-700 underline-offset-2 hover:underline">
                Forgot password?
              </Link>{" "}
              on the login page to get a new link.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                New password
                <AuthFormPasswordInput
                  autoComplete="new-password"
                  className="mt-1.5"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={onKeyDown}
                  disabled={submitting}
                  placeholder="At least 6 characters"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Confirm password
                <AuthFormPasswordInput
                  autoComplete="new-password"
                  className="mt-1.5"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onKeyDown={onKeyDown}
                  disabled={submitting}
                  placeholder="Repeat your password"
                />
              </label>

              {error ? (
                <div
                  role="alert"
                  className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              ) : null}

              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                aria-busy={submitting}
                className={cn(
                  "flex w-full items-center justify-center rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70",
                )}
              >
                {submitting ? "Updating…" : "Update password & sign in"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#fbf7ef] text-sm text-slate-600">
          Loading…
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
