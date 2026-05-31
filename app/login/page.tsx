"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/toast-provider";
import {
  AuthApiError,
  authRedirectPath,
  forgotPassword,
  loginWithEmail,
  loginWithGoogle,
  persistAuthResponse,
  registerWithEmail,
} from "@/lib/auth-api";
import { getGoogleClientId, requestGoogleIdToken } from "@/lib/google-identity";
import { AuthFormInput, AuthFormPasswordInput } from "@/components/ui/form-input";
import { cn } from "@/lib/utils";

type Provider = "google" | "apple";
type AuthScreen = "signin" | "signup" | "forgot";

// Carousel slides — each one previews a different part of the studio so visitors
// understand the breadth of what they're signing up to. Photos act as backdrops
// for the eyebrow/title/body overlay.
const slides = [
  {
    image:
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=80",
    alt: "Wedding ceremony aisle in soft light",
    eyebrow: "Client Galleries",
    title: "Magazine-grade delivery",
    body: "Brandable galleries with lightbox, favourites, and selection. Your work, presented the way you want.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1400&q=80",
    alt: "Couple reviewing photos together",
    eyebrow: "Selection & Proofing",
    title: "Approvals in one sitting",
    body: "Heart-rating, per-image comments, and a guided wizard so clients pick favourites before the next coffee.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1502635385003-ee1e6a1a742d?auto=format&fit=crop&w=1400&q=80",
    alt: "Studio portrait under warm light",
    eyebrow: "Brand & Portfolio",
    title: "Unmistakably your studio",
    body: "Custom domain, brand kit, and fonts on every page. No generic upload link, no “Powered by” footer.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=80",
    alt: "Bridal celebration at golden hour",
    eyebrow: "Smart Delivery",
    title: "Finals on your terms",
    body: "Share-link galleries with watermarked previews and pay-to-unlock finals. You control what clients can download.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=1400&q=80",
    alt: "Photographer working a wedding ceremony",
    eyebrow: "Studio CRM",
    title: "Bookings to finals on autopilot",
    body: "Quotes, contracts, invoices, and reminders in one dashboard. Keep admin work in one place while you shoot.",
  },
] as const;

const SLIDE_INTERVAL_MS = 5500;

// Inline brand marks — we render them with their native colours/silhouettes so the
// "Sign up with …" buttons look familiar instead of using a generic icon set.
function GoogleMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10 10 0 0012 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09a6 6 0 010-3.84V7.41H2.18a10 10 0 000 9.18l3.66-2.5z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.74c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.41 14.97 0 12 0A10 10 0 002.18 7.41l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M17.05 12.04c-.03-3.13 2.55-4.62 2.67-4.7-1.45-2.13-3.71-2.42-4.51-2.45-1.92-.2-3.74 1.13-4.71 1.13-.97 0-2.46-1.1-4.05-1.07-2.08.03-4.02 1.21-5.09 3.07-2.17 3.76-.55 9.32 1.56 12.37 1.04 1.5 2.27 3.18 3.88 3.12 1.56-.06 2.15-1.01 4.04-1.01 1.89 0 2.42 1.01 4.06.98 1.68-.03 2.74-1.51 3.77-3.02 1.19-1.74 1.68-3.42 1.7-3.51-.04-.02-3.27-1.25-3.32-4.97zM13.96 2.92C14.81 1.89 15.39.46 15.23-.97c-1.23.05-2.72.82-3.61 1.85-.79.92-1.49 2.4-1.3 3.79 1.37.11 2.78-.69 3.64-1.75z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function SignUpPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [screen, setScreen] = useState<AuthScreen>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [providerLoading, setProviderLoading] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  // Carousel state — auto-advances, but pauses if the user hovers the panel or
  // jumps to a specific slide via the dots, then resumes after a short idle.
  const [slideIndex, setSlideIndex] = useState(0);
  const carouselPausedRef = useRef(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (carouselPausedRef.current) return;
      setSlideIndex((i) => (i + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  function finishAuth(res: { token: string; user: { _id: string; email: string } }) {
    const user = persistAuthResponse(res);
    router.replace(authRedirectPath(user));
  }

  function authErrorMessage(err: unknown, fallback: string) {
    if (err instanceof AuthApiError) return err.message;
    if (err instanceof Error && err.message) return err.message;
    return fallback;
  }

  async function submit() {
    if (submitting || providerLoading) return;
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Please enter your email and a password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (screen === "signup" && !agreed) {
      setError("Please accept the Terms and Privacy Policy to continue.");
      return;
    }

    setSubmitting(true);
    try {
      const res =
        screen === "signup"
          ? await registerWithEmail(trimmedEmail, password, agreed)
          : await loginWithEmail(trimmedEmail, password);
      finishAuth(res);
    } catch (err) {
      setError(authErrorMessage(err, "Something went wrong. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitForgot() {
    if (submitting || providerLoading) return;
    setError(null);
    setForgotSuccess(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await forgotPassword(trimmedEmail);
      setForgotSuccess(res.message);
    } catch (err) {
      setError(authErrorMessage(err, "Could not send reset instructions."));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitGoogle() {
    if (submitting || providerLoading) return;

    const clientId = getGoogleClientId();
    if (!clientId) {
      setError(
        "Google sign-in is not configured. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your environment.",
      );
      return;
    }

    setError(null);
    setProviderLoading("google");
    try {
      const idToken = await requestGoogleIdToken(clientId);
      const res = await loginWithGoogle(idToken);
      finishAuth(res);
    } catch (err) {
      setError(authErrorMessage(err, "Couldn't continue with Google."));
    } finally {
      setProviderLoading(null);
    }
  }

  async function submitProvider(provider: Provider) {
    if (provider === "google") {
      await submitGoogle();
      return;
    }
    if (submitting || providerLoading) return;
    setError(null);
    setProviderLoading(provider);
    try {
      showToast("Sign in with Apple is not available yet.", "info");
    } finally {
      setProviderLoading(null);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      if (screen === "forgot") submitForgot();
      else submit();
    }
  }

  function openForgot() {
    setScreen("forgot");
    setError(null);
    setForgotSuccess(null);
  }

  function backToSignIn() {
    setScreen("signin");
    setError(null);
    setForgotSuccess(null);
  }

  const isSignUp = screen === "signup";
  const isForgot = screen === "forgot";
  const formBusy = submitting || providerLoading !== null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#fbf7ef] px-4 py-6 sm:px-10 sm:py-12 lg:px-50 lg:py-30">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,247,239,0.9),transparent_45%),radial-gradient(circle_at_85%_20%,_rgba(251,247,239,0.6),transparent_40%),radial-gradient(circle_at_10%_80%,_rgba(251,247,239,0.5),transparent_35%)] blur-2xl" />
      <div className="relative z-[1] mx-auto flex min-h-0 w-full max-w-screen-2xl flex-1 flex-col">
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-2xl shadow-slate-900/15 lg:grid-cols-2">
        <section
          className="relative hidden h-full min-h-0 overflow-hidden border-r border-slate-200 bg-slate-950 lg:block"
          onMouseEnter={() => {
            carouselPausedRef.current = true;
          }}
          onMouseLeave={() => {
            carouselPausedRef.current = false;
          }}
          aria-roledescription="carousel"
          aria-label="What Gido Studio gives you"
        >
          {/* Cross-fading photo stack — only the active slide is fully opaque. */}
          {slides.map((slide, i) => (
            <div
              key={slide.image}
              aria-hidden={i !== slideIndex}
              className={cn(
                "absolute inset-0 transition-opacity duration-[1100ms] ease-out",
                i === slideIndex ? "opacity-100" : "opacity-0",
              )}
            >
              <Image
                src={slide.image}
                alt=""
                fill
                priority={i === 0}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className={cn(
                  "object-cover transition-transform duration-[6000ms] ease-out",
                  i === slideIndex ? "scale-105" : "scale-100",
                )}
              />
            </div>
          ))}

          {/* Dark wash so the overlay text always reads, regardless of slide. */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-slate-950/20" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/40 via-transparent to-transparent" />

          {/* Brand eyebrow — top-left, persistent. */}
          <div className="absolute inset-x-6 top-6 z-10 sm:inset-x-8 sm:top-8">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
              <span className="h-px w-6 bg-amber-300/60" />
              Welcome to Gido Studio
            </p>
          </div>

          {/* Slide content + pagination — bottom-left. */}
          <div className="absolute inset-x-6 bottom-6 z-10 text-white sm:inset-x-8 sm:bottom-8">
            <div className="relative">
              {slides.map((slide, i) => (
                <div
                  key={slide.title}
                  aria-hidden={i !== slideIndex}
                  className={cn(
                    "transition-opacity duration-700 ease-out",
                    i === slideIndex
                      ? "relative opacity-100"
                      : "pointer-events-none absolute inset-0 opacity-0",
                  )}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
                    {slide.eyebrow}
                  </p>
                  <h2 className="mt-3 font-display text-4xl font-semibold leading-[1.05]">
                    {slide.title}
                  </h2>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-200">
                    {slide.body}
                  </p>
                </div>
              ))}
            </div>

            {/* Pagination — animated pill for active, dots for the rest. */}
            <div className="mt-7 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {slides.map((slide, i) => (
                  <button
                    key={slide.title}
                    type="button"
                    onClick={() => {
                      setSlideIndex(i);
                      // Hold the carousel for a bit after manual interaction so
                      // it doesn't immediately advance away from the user's pick.
                      carouselPausedRef.current = true;
                      window.setTimeout(() => {
                        carouselPausedRef.current = false;
                      }, SLIDE_INTERVAL_MS * 1.5);
                    }}
                    aria-label={`Show slide ${i + 1}: ${slide.title}`}
                    aria-current={i === slideIndex ? "true" : undefined}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      i === slideIndex
                        ? "w-9 bg-amber-300"
                        : "w-1.5 bg-white/40 hover:bg-white/70",
                    )}
                  />
                ))}
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                {String(slideIndex + 1).padStart(2, "0")}
                <span className="mx-1 text-slate-500">/</span>
                {String(slides.length).padStart(2, "0")}
              </span>
            </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain bg-white lg:min-h-0">
          <div className="mx-auto flex min-h-full w-full max-w-lg flex-col justify-center px-5 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-8 xl:px-10 xl:py-10">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="text-sm font-medium text-slate-500 transition hover:text-slate-800 lg:hidden"
              >
                ← Home
              </Link>
              <p className="flex items-center text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                <Image
                  src="/images/gido_logo.png"
                  alt="Gido logo"
                  width={154}
                  height={154}
                />
              </p>
            </div>

            <h2 className="mt-6 font-display text-3xl font-semibold tracking-tight text-slate-900">
              {isForgot
                ? "Reset your password"
                : isSignUp
                  ? "Create your account"
                  : "Welcome back"}
            </h2>

            {isForgot ? (
              <p className="mt-2 text-sm text-slate-600">
                Enter your studio email. If an account exists, we will send reset instructions.
              </p>
            ) : null}

            {!isForgot ? (
            <div className="mt-7 space-y-3">
              <button
                type="button"
                onClick={() => submitProvider("google")}
                disabled={formBusy}
                aria-busy={providerLoading === "google"}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <GoogleMark className="h-4 w-4" />
                {providerLoading === "google"
                  ? "Connecting…"
                  : isSignUp
                    ? "Sign up with Google"
                    : "Continue with Google"}
              </button>
              <button
                type="button"
                onClick={() => submitProvider("apple")}
                disabled={formBusy}
                aria-busy={providerLoading === "apple"}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <AppleMark className="h-4 w-4" />
                {providerLoading === "apple"
                  ? "Connecting…"
                  : isSignUp
                    ? "Sign up with Apple"
                    : "Continue with Apple"}
              </button>
            </div>
            ) : null}

            {!isForgot ? (
            <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              or with email
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            ) : null}

            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Email
                <AuthFormInput
                  type="email"
                  autoComplete="email"
                  className="mt-1.5"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={onKeyDown}
                  disabled={formBusy}
                  placeholder="you@studio.com"
                />
              </label>

              {!isForgot ? (
              <label className="block text-sm font-medium text-slate-700">
                Password
                <AuthFormPasswordInput
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  className="mt-1.5"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={onKeyDown}
                  disabled={formBusy}
                  placeholder="At least 6 characters"
                />
              </label>
              ) : null}

              {screen === "signin" && !isForgot ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={openForgot}
                    disabled={formBusy}
                    className="text-xs font-semibold text-teal-700 underline-offset-2 hover:underline disabled:pointer-events-none disabled:opacity-50"
                  >
                    Forgot password?
                  </button>
                </div>
              ) : null}

              {isSignUp ? (
                <label className="flex cursor-pointer items-start gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-700"
                  />
                  <span>
                    I agree to the{" "}
                    <a href="#" className="font-medium text-teal-700 underline-offset-2 hover:underline">
                      Terms
                    </a>{" "}
                    and{" "}
                    <a href="#" className="font-medium text-teal-700 underline-offset-2 hover:underline">
                      Privacy Policy
                    </a>
                    .
                  </span>
                </label>
              ) : null}

              {forgotSuccess ? (
                <div
                  role="status"
                  className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900"
                >
                  <p>{forgotSuccess}</p>
                  {process.env.NODE_ENV === "development" ? (
                    <p className="mt-2 text-xs text-teal-800/90">
                      Development: open your API terminal and look for{" "}
                      <code className="rounded bg-teal-100/80 px-1 py-0.5 font-mono text-[11px]">
                        [password-reset]
                      </code>{" "}
                      to copy the reset link.
                    </p>
                  ) : null}
                </div>
              ) : null}

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
                onClick={isForgot ? submitForgot : submit}
                disabled={formBusy}
                aria-busy={submitting}
                className="mt-2 flex w-full items-center justify-center rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting
                  ? isForgot
                    ? "Sending…"
                    : isSignUp
                      ? "Creating account…"
                      : "Signing in…"
                  : isForgot
                    ? "Send reset instructions"
                    : isSignUp
                      ? "Create account"
                      : "Log in"}
              </button>

              <p className="text-center text-xs text-slate-500">
                {isForgot ? (
                  <>
                    Remember your password?{" "}
                    <button
                      type="button"
                      onClick={backToSignIn}
                      className="font-semibold text-teal-700 underline-offset-2 hover:underline"
                    >
                      Back to log in
                    </button>
                  </>
                ) : isSignUp ? (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setScreen("signin");
                        setError(null);
                        setForgotSuccess(null);
                      }}
                      className="font-semibold text-teal-700 underline-offset-2 hover:underline"
                    >
                      Log in
                    </button>
                  </>
                ) : (
                  <>
                    Need an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setScreen("signup");
                        setError(null);
                        setForgotSuccess(null);
                      }}
                      className="font-semibold text-teal-700 underline-offset-2 hover:underline"
                    >
                      Create account
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        </section>
        </div>
      </div>
    </div>
  );
}
