"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/components/toast-provider";
import { authRedirectPath } from "@/lib/auth-api";
import { clearAuth, getAuth, getAuthToken, logout } from "@/lib/auth-demo";
import {
  completeOnboarding as completeOnboardingApi,
  fetchOnboarding,
  OnboardingApiError,
  persistOnboardingResponse,
} from "@/lib/onboarding-api";
import { AuthFormInput } from "@/components/ui/form-input";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Building2,
  ImagePlus,
  Phone,
  Sparkles,
} from "lucide-react";

const MAX_LOGO_BYTES = 1_200_000;

export default function OnboardingPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>();
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const auth = getAuth();
      const token = getAuthToken();
      if (!auth?.user || !token) {
        clearAuth();
        router.replace("/login");
        return;
      }

      try {
        const res = await fetchOnboarding();
        if (cancelled) return;
        const user = persistOnboardingResponse(res);
        if (user.onboardingComplete) {
          router.replace(authRedirectPath(user));
          return;
        }
        const draft = user.studio;
        if (draft) {
          setCompanyName(draft.companyName ?? "");
          setPhone(draft.phone ?? "");
          if (draft.logoDataUrl) setLogoDataUrl(draft.logoDataUrl);
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof OnboardingApiError && err.status === 401) {
          return;
        }
        const u = getAuth()?.user;
        if (u?.onboardingComplete) {
          router.replace("/dashboard");
          return;
        }
        const draft = u?.studio;
        if (draft) {
          setCompanyName(draft.companyName ?? "");
          setPhone(draft.phone ?? "");
          if (draft.logoDataUrl) setLogoDataUrl(draft.logoDataUrl);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onLogoFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file.", "error");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      showToast("Logo must be about 1.2MB or smaller.", "error");
      return;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r === "string") setLogoDataUrl(r);
    };
    reader.readAsDataURL(file);
  }

  async function submit() {
    if (busy) return;
    const name = companyName.trim();
    const phoneTrimmed = phone.trim();
    if (!name) {
      showToast("Please enter your studio or company name.", "error");
      return;
    }
    if (!phoneTrimmed) {
      showToast("Please enter your business phone.", "error");
      return;
    }

    setBusy(true);
    try {
      const res = await completeOnboardingApi({
        companyName: name,
        phone: phoneTrimmed,
        logoFile,
      });
      const user = persistOnboardingResponse(res);
      showToast(res.message?.trim() || "Welcome to your studio.", "success");
      router.replace(authRedirectPath(user));
    } catch (e) {
      showToast(
        e instanceof OnboardingApiError
          ? e.message
          : e instanceof Error && e.message
            ? e.message
            : "Could not save your profile.",
        "error",
      );
    } finally {
      setBusy(false);
    }
  }

  const previewName = companyName.trim() || "Your studio name";

  if (!ready) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F5F5F5]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-pulse rounded-full bg-slate-300" />
          <p className="text-sm font-medium text-slate-600">Getting things ready…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#F5F5F5] px-4 py-6 sm:px-8 sm:py-10">
      <div className="relative z-[1] mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col justify-center sm:max-w-2xl lg:max-w-3xl">
        <div className="flex max-h-[calc(100vh-3rem)] min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-lg shadow-slate-900/10 sm:max-h-[min(100vh-4rem,900px)]">
          <section className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain bg-white">
            <div className="mx-auto flex min-h-min w-full max-w-xl flex-col px-5 py-8 sm:max-w-2xl sm:px-10 sm:py-10 lg:max-w-3xl">
              <div className="flex items-center justify-between gap-4">
                <Link
                  href="/"
                  className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-slate-800"
                >
                  ← Home
                </Link>
                <Image src="/images/gido_logo.png" alt="Gido" width={120} height={40} className="h-7 w-auto" />
              </div>

              <div className="mt-7">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-800/90">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" aria-hidden />
                  Almost there
                </p>
                <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-[2rem] sm:leading-tight">
                  Bring your <span className="text-teal-700">studio</span> to life
                </h1>
              </div>

              {/* Live preview */}
              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50 p-4 shadow-sm">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400/70 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
                  </span>
                  Live preview
                </p>
                <div className="mt-3 flex items-center gap-3 rounded-xl bg-white/90 p-3 shadow-md shadow-slate-200/40 ring-1 ring-white backdrop-blur-sm">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200/80">
                    {logoDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoDataUrl} alt="" className="h-full w-full object-contain p-1.5" />
                    ) : (
                      <ImagePlus className="h-6 w-6 text-slate-400" aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-base font-semibold text-slate-900 transition-all duration-300">
                      {previewName}
                    </p>
                    <p className="text-xs text-slate-500">How you’ll appear in the app sidebar</p>
                  </div>
                </div>
              </div>

              <div className="mt-7 space-y-4">
                <label className="group block">
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Building2 className="h-4 w-4 text-teal-700/80" aria-hidden />
                    Studio / company name
                    <span className="text-red-500">*</span>
                  </span>
                  <AuthFormInput
                    autoComplete="organization"
                    className="mt-2 [&_.ant-input]:!py-3.5 [&_.ant-input]:!shadow-sm"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. North & Co. Photography"
                    disabled={busy}
                  />
                </label>

                <div className="rounded-2xl border border-dashed border-slate-300/90 bg-white/70 p-4 shadow-sm transition hover:border-slate-400/80 hover:bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <ImagePlus className="h-4 w-4 text-amber-600/90" aria-hidden />
                        Studio logo
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">Optional. PNG or JPG, max ~1.2MB</p>
                    </div>
                  </div>
                  {logoDataUrl ? (
                    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/80">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={logoDataUrl}
                        alt=""
                        className="mx-auto h-24 w-auto max-w-full object-contain p-3"
                      />
                    </div>
                  ) : (
                    <p className="mt-3 rounded-lg bg-slate-50/90 py-6 text-center text-xs font-medium text-slate-500">
                      Drag & drop
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <label
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-teal-800",
                        busy && "pointer-events-none opacity-60",
                      )}
                    >
                      <ImagePlus className="h-3.5 w-3.5 opacity-90" aria-hidden />
                      {logoDataUrl ? "Replace logo" : "Upload logo"}
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        disabled={busy}
                        onChange={(e) => {
                          void onLogoFile(e.target.files?.[0] ?? null);
                          e.currentTarget.value = "";
                        }}
                      />
                    </label>
                    {logoDataUrl ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setLogoDataUrl(undefined);
                          setLogoFile(null);
                        }}
                        className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 underline-offset-2 hover:underline"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>

                <label className="block">
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Phone className="h-4 w-4 text-teal-700/80" aria-hidden />
                    Business phone
                    <span className="text-red-500">*</span>
                  </span>
                  <AuthFormInput
                    type="tel"
                    autoComplete="tel"
                    className="mt-2 [&_.ant-input]:!py-3.5 [&_.ant-input]:!shadow-sm"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +233200000000"
                    disabled={busy}
                  />
                </label>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void submit()}
                  className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70 sm:flex-1"
                >
                  {busy ? (
                    "Saving…"
                  ) : (
                    <>
                      Continue to dashboard
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    await logout();
                    router.replace("/login");
                  }}
                  className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-800 transition hover:bg-red-100 disabled:opacity-60 sm:w-auto sm:shrink-0 dark:border-red-900/55 dark:bg-red-950/45 dark:text-red-100 dark:hover:bg-red-950/70"
                >
                  Sign out
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
