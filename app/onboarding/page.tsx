"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/components/toast-provider";
import { SmsSenderIdField } from "@/components/sms/sms-sender-id-field";
import { StudioUrlField } from "@/components/studio/studio-url-field";
import {
  navigateAfterAuth,
  userNeedsEmailVerification,
  verifyEmailPath,
} from "@/lib/auth-api";
import { clearAuth, getAuth, getAuthToken, logout } from "@/lib/auth-demo";
import {
  completeOnboarding as completeOnboardingApi,
  DEFAULT_PRIMARY_DELIVERABLE,
  fetchOnboarding,
  onboardingErrorMessage,
  OnboardingApiError,
  parsePrimaryDeliverable,
  persistOnboardingResponse,
  PRIMARY_DELIVERABLE_OPTIONS,
  type PrimaryDeliverableValue,
} from "@/lib/onboarding-api";
import { FormInput, ContactNumberInput } from "@/components/ui/form-input";
import {
  onboardingAntInputClassName,
  onboardingLabelClass,
  onboardingNativeControlClassName,
  onboardingPrimaryButtonClassName,
  onboardingRequiredMarkClass,
  onboardingSelectChevronClassName,
} from "@/lib/onboarding-field-styles";
import {
  defaultStudioUrlSuffix,
  photographerSignOutUrl,
  redirectToApexAuthIfNeeded,
  slugifyCompanyName,
  studioSlugValidationMessage,
} from "@/lib/studio-url";
import { COUNTRY_OPTIONS, parseCountryValue } from "@/lib/countries";
import { APP_NAME } from "@/lib/branding";
import { cn } from "@/lib/utils";
import {
  deriveSmsSenderIdFromCompanyName,
  smsSenderIdValidationMessage,
} from "@/lib/sms-sender";
import { ImagePlus, Loader2 } from "lucide-react";

const MAX_LOGO_BYTES = 5_000_000;

const ONBOARDING_BG_IMAGE = "/images/backgroun.jpg";

function OnboardingRequiredMark() {
  return (
    <span className={onboardingRequiredMarkClass} aria-hidden>
      {" "}
      *
    </span>
  );
}

function applyOnboardingDraft(
  res: Awaited<ReturnType<typeof fetchOnboarding>>,
  setters: {
    setCompanyName: (v: string) => void;
    setPhone: (v: string) => void;
    setCountry: (v: string) => void;
    setCompanySlug: (v: string) => void;
    setStudioUrlSuffix: (v: string) => void;
    setStudioUrl: (v: string | undefined) => void;
    setSuggestedCompanySlug: (v: string | undefined) => void;
    setLogoDataUrl: (v: string | undefined) => void;
    setSlugManuallyEdited: (v: boolean) => void;
    setPrimaryDeliverable: (v: PrimaryDeliverableValue) => void;
    setReferralCode: (v: string) => void;
    setSmsSenderId: (v: string) => void;
    setSmsSenderManuallyEdited: (v: boolean) => void;
  },
) {
  const draft = res.user.studio;
  if (draft?.companyName) setters.setCompanyName(draft.companyName);
  if (draft?.phone) setters.setPhone(draft.phone);
  if (draft?.country) setters.setCountry(parseCountryValue(draft.country));
  const deliver = draft?.primaryDeliverable ?? draft?.primaryDeliver;
  if (deliver) setters.setPrimaryDeliverable(parsePrimaryDeliverable(deliver));
  if (draft?.referralCode) setters.setReferralCode(draft.referralCode);
  if (draft?.logoSrc || draft?.logoUrl || draft?.logoDataUrl) {
    setters.setLogoDataUrl(draft.logoSrc ?? draft.logoUrl ?? draft.logoDataUrl);
  }

  const suffix =
    res.studioUrlSuffix?.trim() ||
    draft?.studioUrlSuffix?.trim() ||
    defaultStudioUrlSuffix();
  setters.setStudioUrlSuffix(suffix);

  const slug =
    draft?.companySlug?.trim() ||
    res.suggestedCompanySlug?.trim() ||
    slugifyCompanyName(draft?.companyName ?? "");
  if (slug) {
    setters.setCompanySlug(slug);
    setters.setSlugManuallyEdited(false);
  }

  const url = res.studioUrl?.trim() || draft?.studioUrl?.trim();
  if (url) setters.setStudioUrl(url);

  if (res.suggestedCompanySlug?.trim()) {
    setters.setSuggestedCompanySlug(res.suggestedCompanySlug.trim());
  }

  const smsSuggestion =
    draft?.suggestedSmsSenderId?.trim() ||
    res.user.studio?.suggestedSmsSenderId?.trim() ||
    deriveSmsSenderIdFromCompanyName(draft?.companyName ?? "");
  if (draft?.smsSenderId?.trim()) {
    setters.setSmsSenderId(draft.smsSenderId.trim().toUpperCase());
    setters.setSmsSenderManuallyEdited(true);
  } else if (smsSuggestion) {
    setters.setSmsSenderId(smsSuggestion.toUpperCase());
    setters.setSmsSenderManuallyEdited(false);
  }
}

export default function OnboardingPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [companySlug, setCompanySlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [studioUrlSuffix, setStudioUrlSuffix] = useState(defaultStudioUrlSuffix());
  const [studioUrl, setStudioUrl] = useState<string | undefined>();
  const [suggestedCompanySlug, setSuggestedCompanySlug] = useState<string | undefined>();
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [primaryDeliverable, setPrimaryDeliverable] = useState<PrimaryDeliverableValue>(
    DEFAULT_PRIMARY_DELIVERABLE,
  );
  const [referralCode, setReferralCode] = useState("");
  const [smsSenderId, setSmsSenderId] = useState("");
  const [smsSenderManuallyEdited, setSmsSenderManuallyEdited] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);

  useEffect(() => {
    redirectToApexAuthIfNeeded("/onboarding");
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const auth = getAuth();
      const token = getAuthToken();
      if (!auth?.user || !token) {
        clearAuth();
        window.location.replace(photographerSignOutUrl());
        return;
      }

      if (userNeedsEmailVerification(auth.user)) {
        router.replace(verifyEmailPath());
        return;
      }

      try {
        const res = await fetchOnboarding();
        if (cancelled) return;
        const user = persistOnboardingResponse(res);
        if (user.onboardingComplete) {
          navigateAfterAuth(user, router);
          return;
        }
        applyOnboardingDraft(res, {
          setCompanyName,
          setPhone,
          setCountry,
          setCompanySlug,
          setStudioUrlSuffix,
          setStudioUrl,
          setSuggestedCompanySlug,
          setLogoDataUrl,
          setSlugManuallyEdited,
          setPrimaryDeliverable,
          setReferralCode,
          setSmsSenderId,
          setSmsSenderManuallyEdited,
        });
      } catch (err) {
        if (cancelled) return;
        if (err instanceof OnboardingApiError && err.status === 401) {
          return;
        }
        const u = getAuth()?.user;
        if (u?.onboardingComplete) {
          navigateAfterAuth(u, router);
          return;
        }
        const draft = u?.studio;
        if (draft) {
          setCompanyName(draft.companyName ?? "");
          setPhone(draft.phone ?? "");
          setCountry(parseCountryValue(draft.country));
          if (draft.logoDataUrl) setLogoDataUrl(draft.logoDataUrl);
          if (draft.companySlug) {
            setCompanySlug(draft.companySlug);
            setSlugManuallyEdited(true);
          }
          if (draft.studioUrlSuffix) setStudioUrlSuffix(draft.studioUrlSuffix);
          if (draft.studioUrl) setStudioUrl(draft.studioUrl);
          const deliver = draft.primaryDeliverable ?? draft.primaryDeliver;
          if (deliver) setPrimaryDeliverable(parsePrimaryDeliverable(deliver));
          if (draft.referralCode) setReferralCode(draft.referralCode);
          if (draft.smsSenderId) {
            setSmsSenderId(draft.smsSenderId.trim().toUpperCase());
            setSmsSenderManuallyEdited(true);
          } else if (draft.companyName) {
            setSmsSenderId(deriveSmsSenderIdFromCompanyName(draft.companyName));
          }
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

  useEffect(() => {
    if (smsSenderManuallyEdited) return;
    const suggestion = deriveSmsSenderIdFromCompanyName(companyName);
    if (suggestion) setSmsSenderId(suggestion);
  }, [companyName, smsSenderManuallyEdited]);

  async function onLogoFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file.", "error");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      showToast("Logo must be 5MB or smaller.", "error");
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
    const slug = companySlug.trim();
    const slugValidation = studioSlugValidationMessage(slug);

    if (!name) {
      showToast("Please enter your studio or company name.", "error");
      return;
    }
    if (!country.trim()) {
      showToast("Please select your country.", "error");
      return;
    }
    if (!phoneTrimmed) {
      showToast("Please enter your business phone.", "error");
      return;
    }
    if (slugValidation) {
      setSlugError(slugValidation);
      showToast(slugValidation, "error");
      return;
    }
    const smsValidation = smsSenderIdValidationMessage(smsSenderId);
    if (smsValidation) {
      showToast(smsValidation, "error");
      return;
    }

    setSlugError(null);
    setBusy(true);
    try {
      const res = await completeOnboardingApi({
        companyName: name,
        phone: phoneTrimmed,
        country: country.trim(),
        companySlug: slug,
        smsSenderId: smsSenderId.trim().toUpperCase(),
        primaryDeliverable,
        referralCode: referralCode.trim() || undefined,
        logoFile,
      });
      const user = persistOnboardingResponse(res);
      showToast(res.message?.trim() || "Welcome to your studio.", "success");
      const navigated = navigateAfterAuth(user, router);
      if (!navigated) {
        setBusy(false);
      }
    } catch (e) {
      setBusy(false);
      const message = onboardingErrorMessage(e, "Could not save your profile.");
      if (e instanceof OnboardingApiError && e.status === 409) {
        setSlugError(message);
      }
      showToast(message, "error");
    }
  }

  if (!ready) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <OnboardingBackground />
        <Loader2 className="relative z-10 h-7 w-7 animate-spin text-white" aria-hidden />
        <span className="sr-only">Loading…</span>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-y-contain text-neutral-800">
      <OnboardingBackground />

      <div className="relative flex min-h-dvh w-full items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-[30rem] py-4 sm:max-w-[36rem]">
        <div className="rounded-xl bg-white px-5 py-5 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)] sm:px-6 sm:py-6">
          <div className="flex justify-center">
            <Image
              src="/svgs/logo.svg"
              alt={APP_NAME}
              width={691}
              height={801}
              className="h-7 w-auto brightness-0"
              priority
            />
          </div>

          <p className="mt-3 text-center text-[10px] font-medium uppercase tracking-[0.24em] text-neutral-500">
            Let&apos;s begin with the details
          </p>

          <div className="mt-4 space-y-4">
          <StudioUrlField
            companyName={companyName}
            onCompanyNameChange={setCompanyName}
            companySlug={companySlug}
            onCompanySlugChange={setCompanySlug}
            slugManuallyEdited={slugManuallyEdited}
            onSlugManuallyEdited={setSlugManuallyEdited}
            studioUrlSuffix={studioUrlSuffix}
            studioUrl={studioUrl}
            suggestedCompanySlug={suggestedCompanySlug}
            disabled={busy}
            slugError={slugError}
            appearance="minimal"
            dense
          />

          <SmsSenderIdField
            value={smsSenderId}
            onChange={(value) => {
              setSmsSenderManuallyEdited(true);
              setSmsSenderId(value);
            }}
            disabled={busy}
            required
          />

          <label className="block">
            <span id="primary-deliver-label" className={onboardingLabelClass}>
              I primarily deliver
              <OnboardingRequiredMark />
            </span>
            <select
              id="primary-deliver"
              value={primaryDeliverable}
              onChange={(e) =>
                setPrimaryDeliverable(e.target.value as PrimaryDeliverableValue)
              }
              disabled={busy}
              aria-labelledby="primary-deliver-label"
              aria-required
              className={cn(onboardingNativeControlClassName, onboardingSelectChevronClassName)}
            >
              {PRIMARY_DELIVERABLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span id="country-label" className={onboardingLabelClass}>
              Country
              <OnboardingRequiredMark />
            </span>
            <select
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              disabled={busy}
              aria-labelledby="country-label"
              aria-required
              className={cn(onboardingNativeControlClassName, onboardingSelectChevronClassName)}
            >
              <option value="" disabled>
                Select country
              </option>
              {COUNTRY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={onboardingLabelClass}>
              Business phone
              <OnboardingRequiredMark />
            </span>
            <ContactNumberInput
              autoComplete="tel"
              className={onboardingAntInputClassName}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={busy}
              aria-required
            />
          </label>

          <div className="block">
            <span className={onboardingLabelClass}>Studio logo</span>
            <label
              className={cn(
                "group mt-0.5 block cursor-pointer rounded-lg border border-dashed border-neutral-300 bg-gradient-to-br from-neutral-50/90 to-white p-3 transition",
                "hover:border-neutral-400 hover:from-neutral-50",
                logoDataUrl && "border-solid border-neutral-200 bg-white hover:from-white",
                busy && "pointer-events-none opacity-60",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-white shadow-sm transition",
                    logoDataUrl
                      ? "border-neutral-200"
                      : "border-neutral-200/80 group-hover:border-neutral-300",
                  )}
                >
                  {logoDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoDataUrl} alt="" className="h-full w-full object-contain p-1" />
                  ) : (
                    <ImagePlus
                      className="h-5 w-5 text-neutral-400 transition group-hover:text-neutral-600"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-neutral-800">
                    {logoDataUrl ? "Logo ready" : "Add your studio mark"}
                  </p>
                  <p className="mt-0.5 text-[10px] leading-snug text-neutral-500">
                    {logoDataUrl ? "Tap to replace" : "Optional · PNG or JPG, max 5MB"}
                  </p>
                </div>
                <span className="shrink-0 rounded-md bg-neutral-800 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-white transition group-hover:bg-neutral-900">
                  {logoDataUrl ? "Change" : "Browse"}
                </span>
              </div>
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
                className="mt-1.5 text-[11px] font-medium text-neutral-500 underline-offset-2 hover:text-neutral-800 hover:underline disabled:opacity-50"
              >
                Remove logo
              </button>
            ) : null}
          </div>

          <label className="block">
            <span className={onboardingLabelClass}>Referral code</span>
            <FormInput
              autoComplete="off"
              className={onboardingAntInputClassName}
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder="Referral code"
              disabled={busy}
            />
          </label>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() => void submit()}
            className={cn("mt-4", onboardingPrimaryButtonClassName)}
          >
            {busy ? "Saving…" : "Continue"}
          </button>

          <p className="mt-2 text-center text-[10px] leading-snug text-neutral-500">
            By continuing, you agree to {APP_NAME}&apos;s{" "}
            <Link href="/terms" className="underline-offset-2 hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline-offset-2 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>

          <div className="mt-2 flex items-center justify-center gap-3 text-[11px] text-neutral-400">
            <Link href="/" className="transition hover:text-neutral-600">
              Home
            </Link>
            <span aria-hidden>·</span>
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                await logout();
                window.location.replace(photographerSignOutUrl());
              }}
              className="text-red-600 transition hover:text-red-700 disabled:opacity-50"
            >
              Sign out
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

function OnboardingBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <Image
        src={ONBOARDING_BG_IMAGE}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-bottom blur-sm"
      />
      <div className="absolute inset-0 bg-[#F5F5F5]/60" aria-hidden />
    </div>
  );
}
