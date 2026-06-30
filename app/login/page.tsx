"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import {
  AuthApiError,
  navigateAfterAuth,
  forgotPassword,
  loginWithEmail,
  loginWithGoogle,
  persistAuthResponse,
  registerWithEmail,
  userNeedsEmailVerification,
  verifyEmailPath,
} from "@/lib/auth-api";
import { getAuth, getAuthToken, clearAuth } from "@/lib/auth-demo";
import { getGoogleClientId, requestGoogleIdToken } from "@/lib/google-identity";
import { AuthFormInput, AuthFormPasswordInput } from "@/components/ui/form-input";
import { redirectToApexAuthIfNeeded } from "@/lib/studio-url";
import { APP_NAME, PRODUCT_TAGLINE } from "@/lib/branding";
import { cn } from "@/lib/utils";

type AuthScreen = "signin" | "signup" | "forgot";

const slides = [
  {
    image: "/images/login_image.png",
    alt: "Laptop mockup showing galleries, bookings, and calendar in the photographer dashboard",
    eyebrow: "Studio Dashboard",
    title: "Everything in one place",
    body: "Galleries, bookings, and your calendar — manage client work from a single workspace built for photographers.",
    imageClassName: "object-contain object-center bg-zinc-900",
  },
  {
    image: "/images/gallery-covers/IMG_5261.JPG",
    alt: "Couple reviewing photos together",
    eyebrow: "Selection & Proofing",
    title: "Approvals in one sitting",
    body: "Heart-rating, per-image comments, and a guided wizard so clients pick favourites before the next coffee.",
  },
  {
    image: "/images/gallery-covers/website_3-min.jpg",
    alt: "Studio portrait under warm light",
    eyebrow: "Brand & Portfolio",
    title: "Unmistakably your studio",
    body: "Custom domain, brand kit, and fonts on every page. No generic upload link, no “Powered by” footer.",
  },
  {
    image: "/images/gallery-covers/IMG_5566.JPG",
    alt: "Bridal celebration at golden hour",
    eyebrow: "Smart Delivery",
    title: "Finals on your terms",
    body: "Share-link galleries with watermarked previews and pay-to-unlock finals. You control what clients can download.",
  },
  {
    image: "/images/gallery-covers/WOED0075.JPG",
    alt: "Photographer working a wedding ceremony",
    eyebrow: "Studio CRM",
    title: "Bookings to finals on autopilot",
    body: "Quotes, contracts, invoices, and reminders in one dashboard. Keep admin work in one place while you shoot.",
  },
] satisfies ReadonlyArray<{
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  body: string;
  imageClassName?: string;
}>;

const SLIDE_INTERVAL_MS = 5500;

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

function screenFromSearchParams(searchParams: URLSearchParams): AuthScreen {
  return searchParams.get("screen") === "signup" ? "signup" : "signin";
}

function AuthTab({
  active,
  children,
  onClick,
  disabled,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex-1 rounded-full px-2.5 py-2.5 text-xs font-semibold transition sm:px-4 sm:py-2 sm:text-sm",
        active
          ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200/80"
          : "text-zinc-500 hover:text-zinc-800",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      {children}
    </button>
  );
}

function LoginPageForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [screen, setScreen] = useState<AuthScreen>(() =>
    screenFromSearchParams(searchParams),
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  const [slideIndex, setSlideIndex] = useState(0);
  const carouselPausedRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("signedOut") === "1") {
      clearAuth();
      params.delete("signedOut");
      const qs = params.toString();
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`,
      );
      return;
    }

    redirectToApexAuthIfNeeded("/login");

    const auth = getAuth();
    const token = getAuthToken();
    if (auth?.user?.email?.trim() && token) {
      if (userNeedsEmailVerification(auth.user)) {
        router.replace(verifyEmailPath());
        return;
      }
      navigateAfterAuth(auth.user, router);
    }
  }, [router]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (carouselPausedRef.current) return;
      setSlideIndex((i) => (i + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  function finishAuth(res: { token: string; user: { _id: string; email: string } }) {
    const user = persistAuthResponse(res);
    navigateAfterAuth(user, router);
  }

  function authErrorMessage(err: unknown, fallback: string) {
    if (err instanceof AuthApiError) return err.message;
    if (err instanceof Error && err.message) return err.message;
    return fallback;
  }

  async function submit() {
    if (submitting || googleLoading) return;
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
      if (screen === "signup") {
        const res = await registerWithEmail(trimmedEmail, password, agreed);
        const user = persistAuthResponse(res);
        if (userNeedsEmailVerification(user) || res.requiresEmailVerification) {
          router.push(verifyEmailPath());
          return;
        }
        navigateAfterAuth(user, router);
        return;
      }

      const res = await loginWithEmail(trimmedEmail, password);
      const user = persistAuthResponse(res);
      if (userNeedsEmailVerification(user) || res.requiresEmailVerification) {
        router.push(verifyEmailPath());
        return;
      }
      navigateAfterAuth(user, router);
    } catch (err) {
      setError(authErrorMessage(err, "Something went wrong. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitForgot() {
    if (submitting || googleLoading) return;
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
    if (submitting || googleLoading) return;

    const clientId = getGoogleClientId();
    if (!clientId) {
      setError(
        "Google sign-in is not configured. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your environment.",
      );
      return;
    }

    setError(null);
    setGoogleLoading(true);
    try {
      const idToken = await requestGoogleIdToken(clientId);
      const res = await loginWithGoogle(idToken);
      finishAuth(res);
    } catch (err) {
      setError(authErrorMessage(err, "Couldn't continue with Google."));
    } finally {
      setGoogleLoading(false);
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

  function switchScreen(next: "signin" | "signup") {
    setScreen(next);
    setError(null);
    setForgotSuccess(null);
  }

  const isSignUp = screen === "signup";
  const isForgot = screen === "forgot";
  const formBusy = submitting || googleLoading;

  return (
    <div className="fixed inset-0 z-50 flex h-dvh max-h-dvh flex-col overflow-hidden bg-brand-soft/40 supports-[height:100dvh]:h-[100dvh]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,_rgba(85,0,31,0.06),transparent_42%),radial-gradient(circle_at_90%_85%,_rgba(213,174,101,0.12),transparent_38%)]" />

      <div className="relative z-[1] mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:pb-6 sm:pt-6 lg:px-12 lg:py-10">
        <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_24px_80px_-24px_rgba(15,23,42,0.18)] lg:grid-cols-[1.05fr_1fr] lg:rounded-3xl">
          {/* Visual panel — desktop only */}
          <section
            className="relative hidden min-h-0 overflow-hidden bg-zinc-950 lg:block"
            onMouseEnter={() => {
              carouselPausedRef.current = true;
            }}
            onMouseLeave={() => {
              carouselPausedRef.current = false;
            }}
            aria-roledescription="carousel"
            aria-label={`What ${APP_NAME} gives you`}
          >
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
                  unoptimized
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  className={cn(
                    slide.imageClassName ?? "object-cover",
                    "transition-transform duration-[6000ms] ease-out",
                    !slide.imageClassName && (i === slideIndex ? "scale-105" : "scale-100"),
                  )}
                />
              </div>
            ))}

            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/25" />
            <div className="absolute inset-0 bg-gradient-to-br from-brand/30 via-transparent to-transparent" />

            <div className="absolute inset-x-5 top-6 z-10 lg:inset-x-8 lg:top-8">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-white/70 transition hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Back to home
              </Link>
            </div>

            <div className="absolute inset-x-5 bottom-6 z-10 text-white lg:inset-x-8 lg:bottom-8">
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
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D5AE65]">
                      {slide.eyebrow}
                    </p>
                    <h2 className="mt-3 font-display text-2xl font-semibold leading-[1.08] lg:text-[2rem] xl:text-4xl">
                      {slide.title}
                    </h2>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-200">
                      {slide.body}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center gap-2">
                {slides.map((slide, i) => (
                  <button
                    key={slide.title}
                    type="button"
                    onClick={() => {
                      setSlideIndex(i);
                      carouselPausedRef.current = true;
                      window.setTimeout(() => {
                        carouselPausedRef.current = false;
                      }, SLIDE_INTERVAL_MS * 1.5);
                    }}
                    aria-label={`Show slide ${i + 1}: ${slide.title}`}
                    aria-current={i === slideIndex ? "true" : undefined}
                    className={cn(
                      "h-1 rounded-full transition-all duration-300",
                      i === slideIndex
                        ? "w-8 bg-[#D5AE65]"
                        : "w-1.5 bg-white/35 hover:bg-white/60",
                    )}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Form panel */}
          <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
            <div className="mx-auto flex w-full min-w-0 max-w-md flex-col justify-start px-4 py-5 sm:justify-center sm:px-8 sm:py-8 lg:min-h-full lg:justify-center lg:px-10 lg:py-12 max-lg:landscape:justify-start max-lg:landscape:py-4">
              <div className="flex min-w-0 items-center justify-between gap-2 lg:justify-center">
                <Link
                  href="/"
                  className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-zinc-500 transition hover:text-zinc-800 lg:hidden"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  Home
                </Link>
                <Image
                  src="/svgs/color_logo.svg"
                  alt={`${APP_NAME} logo`}
                  width={3965}
                  height={1231}
                  priority
                  className="h-7 w-auto max-w-[min(100%,10.5rem)] shrink sm:h-9 lg:h-10"
                />
                <span className="w-12 shrink-0 lg:hidden" aria-hidden />
              </div>

              {isForgot ? (
                <>
                  <h1 className="mt-6 font-display text-xl font-semibold tracking-tight text-zinc-900 sm:mt-8 sm:text-2xl lg:text-3xl">
                    Reset your password
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    Enter your studio email. If an account exists, we will send reset instructions.
                  </p>
                </>
              ) : (
                <>
                  <div
                    role="tablist"
                    aria-label="Account type"
                    className="mt-6 flex rounded-full bg-zinc-100 p-1 sm:mt-8"
                  >
                    <AuthTab
                      active={screen === "signin"}
                      onClick={() => switchScreen("signin")}
                      disabled={formBusy}
                    >
                      Log in
                    </AuthTab>
                    <AuthTab
                      active={screen === "signup"}
                      onClick={() => switchScreen("signup")}
                      disabled={formBusy}
                    >
                      Create account
                    </AuthTab>
                  </div>

                  <h1 className="mt-5 font-display text-xl font-semibold tracking-tight text-zinc-900 sm:mt-6 sm:text-2xl lg:text-3xl">
                    {isSignUp ? "Start your studio workspace" : "Welcome back"}
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    {isSignUp
                      ? `Set up ${APP_NAME} ${PRODUCT_TAGLINE.toLowerCase()}.`
                      : "Sign in to manage galleries, bookings, and client delivery."}
                  </p>
                </>
              )}

              <div className="mt-6 space-y-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:mt-7">
                <>
                <label className="block text-sm font-medium text-zinc-800">
                  Email
                  <AuthFormInput
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    className="mt-1.5"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={onKeyDown}
                    disabled={formBusy}
                    placeholder="you@studiomail.com"
                  />
                </label>

                {!isForgot ? (
                  <label className="block text-sm font-medium text-zinc-800">
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
                      className="text-xs font-semibold text-brand underline-offset-2 hover:underline disabled:pointer-events-none disabled:opacity-50"
                    >
                      Forgot password?
                    </button>
                  </div>
                ) : null}

                {isSignUp ? (
                  <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-zinc-600 sm:text-[13px]">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 text-brand focus:ring-brand"
                    />
                    <span className="min-w-0">
                      I agree to the{" "}
                      <a
                        href="/terms"
                        className="font-medium text-brand underline-offset-2 hover:underline"
                      >
                        Terms
                      </a>{" "}
                      and{" "}
                      <a
                        href="/privacy"
                        className="font-medium text-brand underline-offset-2 hover:underline"
                      >
                        Privacy Policy
                      </a>
                      .
                    </span>
                  </label>
                ) : null}
                </>

                {forgotSuccess ? (
                  <div
                    role="status"
                    className="rounded-xl border border-brand-muted bg-brand-soft px-4 py-3 text-sm text-brand-ink"
                  >
                    <p>{forgotSuccess}</p>
                    {process.env.NODE_ENV === "development" ? (
                      <p className="mt-2 text-xs text-brand-ink/80">
                        Development: open your API terminal and look for{" "}
                        <code className="rounded bg-white/70 px-1 py-0.5 font-mono text-[11px]">
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
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    {error}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={isForgot ? submitForgot : submit}
                  disabled={formBusy}
                  aria-busy={submitting}
                  className="flex w-full items-center justify-center rounded-xl bg-brand px-4 py-3.5 text-sm font-semibold text-white shadow-sm shadow-brand/20 transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70 sm:py-3"
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

                {!isForgot ? (
                  <>
                    <div className="flex items-center gap-3 py-1">
                      <span className="h-px flex-1 bg-zinc-200" />
                      <span className="text-xs font-medium text-zinc-400">or</span>
                      <span className="h-px flex-1 bg-zinc-200" />
                    </div>

                    <button
                      type="button"
                      onClick={submitGoogle}
                      disabled={formBusy}
                      aria-busy={googleLoading}
                      className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-4 py-3.5 text-sm font-semibold text-zinc-800 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 sm:py-3"
                    >
                      <GoogleMark className="h-4 w-4" />
                      {googleLoading
                        ? "Connecting…"
                        : isSignUp
                          ? "Sign up with Google"
                          : "Continue with Google"}
                    </button>
                  </>
                ) : null}

                {isForgot ? (
                  <p className="text-center text-xs text-zinc-500">
                    Remember your password?{" "}
                    <button
                      type="button"
                      onClick={backToSignIn}
                      className="font-semibold text-brand underline-offset-2 hover:underline"
                    >
                      Back to log in
                    </button>
                  </p>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-50 flex h-dvh max-h-dvh items-center justify-center bg-brand-soft px-4 text-sm text-zinc-600 supports-[height:100dvh]:h-[100dvh]">
          Loading…
        </div>
      }
    >
      <LoginPageForm />
    </Suspense>
  );
}
