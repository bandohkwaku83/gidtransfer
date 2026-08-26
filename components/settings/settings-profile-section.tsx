"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Camera,
  Globe,
  LogOut,
  Mail,
  Phone,
  Save,
} from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { formModalLabelClass } from "@/components/ui/form-modal";
import { FormInput, ContactNumberInput } from "@/components/ui/form-input";
import {
  logout,
  type DemoAuthUser,
} from "@/lib/auth-demo";
import { verifyEmailPath } from "@/lib/auth-api";
import { studioLogoSrc } from "@/lib/branding";
import {
  galleriesOverviewDisplay,
  planNameToPlanId,
  settingsErrorMessage,
  studioLogoUrlFromSettings,
  studioSlugFromSettings,
  updateProfileSettings,
  type SettingsPageData,
} from "@/lib/settings-api";
import { cn } from "@/lib/utils";
import { PLANS, type PlanId } from "@/lib/subscription-plan";
import { StudioUrlField } from "@/components/studio/studio-url-field";
import { SettingsSmsSection } from "@/components/settings/settings-sms-section";
import {
  photographerAuthUrl,
  photographerSignOutUrl,
  studioSlugValidationMessage,
} from "@/lib/studio-url";

const EMPTY_STUDIO = {
  businessName: "",
  companyName: "",
  phone: null,
  website: null,
  photographerEmail: null,
  email: null,
  logoSrc: null,
  logoUrl: null,
  brandLogo: null,
  companyLogo: null,
  studioUrl: null,
  studioUrlHost: null,
  studioUrlSuffix: null,
  appHost: null,
} as const;

const MAX_LOGO_BYTES = 1_200_000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const labelClass = formModalLabelClass;

function formatPlanStorage(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  if (Math.abs(gb - Math.round(gb)) < 1e-6) return `${Math.round(gb)} GB`;
  return `${gb.toFixed(0)} GB`;
}

function formatMemberSince(iso?: string): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

type SettingsProfileSectionProps = {
  auth: DemoAuthUser | null;
  pageData: SettingsPageData | null;
  loading?: boolean;
  onProfileUpdated?: (data: SettingsPageData) => void;
};

export function SettingsProfileSection({
  auth,
  pageData,
  loading = false,
  onProfileUpdated,
}: SettingsProfileSectionProps) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const studio = auth?.user?.studio;
  const apiStudio = pageData?.bundle?.studio;
  const apiProfile = pageData?.bundle?.profile;
  const apiOverview = pageData?.bundle?.overview;
  const savedEmail =
    pageData?.bundle?.account?.photographerEmail?.trim() ||
    pageData?.bundle?.account?.email?.trim() ||
    apiStudio?.photographerEmail?.trim() ||
    apiStudio?.email?.trim() ||
    apiProfile?.email?.trim() ||
    auth?.user?.email?.trim() ||
    auth?.email?.trim() ||
    "";
  const memberSince =
    apiOverview?.memberSince.label ??
    pageData?.user?.memberSince?.label ??
    formatMemberSince(auth?.user?.createdAt);
  const planStorageLabel =
    apiOverview?.planStorage.label ?? auth?.user?.plan?.storageLabel;
  const planId: PlanId =
    auth?.user?.plan?.planId ??
    (apiProfile?.planId ? planNameToPlanId(apiProfile.planId) : undefined) ??
    (apiProfile?.planName ? planNameToPlanId(apiProfile.planName) : "free");
  const plan = PLANS[planId];
  const planLabel =
    auth?.user?.plan?.planName ??
    apiProfile?.planName?.replace(/\s+plan$/i, "") ??
    plan.label;
  const galleriesLabel = galleriesOverviewDisplay(apiOverview?.galleries, {
    used: 0,
    limit: apiOverview ? null : plan.maxGalleries,
  });

  const [companyName, setCompanyName] = useState("");
  const [companySlug, setCompanySlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [studioUrlSuffix, setStudioUrlSuffix] = useState("");
  const [studioUrl, setStudioUrl] = useState<string | undefined>();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [clearBrandLogo, setClearBrandLogo] = useState(false);

  const syncFromAuth = useCallback(() => {
    const company =
      apiStudio?.companyName?.trim() ||
      apiStudio?.businessName?.trim() ||
      studio?.companyName?.trim() ||
      auth?.user?.name?.trim() ||
      "";
    setCompanyName(company);
    setCompanySlug(
      studioSlugFromSettings(apiStudio ?? EMPTY_STUDIO, studio?.companySlug),
    );
    setSlugManuallyEdited(false);
    setStudioUrlSuffix(
      apiStudio?.studioUrlSuffix?.trim() ?? studio?.studioUrlSuffix?.trim() ?? "",
    );
    setStudioUrl(apiStudio?.studioUrl?.trim() ?? studio?.studioUrl?.trim() ?? undefined);
    setEmail(savedEmail);
    setPhone(apiStudio?.phone?.trim() ?? studio?.phone?.trim() ?? "");
    setWebsite(apiStudio?.website?.trim() ?? studio?.website?.trim() ?? "");
    setLogoDataUrl(
      (apiStudio ? studioLogoUrlFromSettings(apiStudio) : undefined) ??
        (studio?.logoDataUrl ? studioLogoSrc(studio.logoDataUrl) : undefined),
    );
    setLogoFile(null);
    setClearBrandLogo(false);
  }, [apiStudio, auth?.user?.name, savedEmail, studio]);

  useEffect(() => {
    syncFromAuth();
  }, [syncFromAuth]);

  async function onLogoFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Use a PNG or JPG file.", "error");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      showToast("Logo must be under 1.2 MB.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r === "string") setLogoDataUrl(r);
    };
    reader.readAsDataURL(file);
    setLogoFile(file);
    setClearBrandLogo(false);
  }

  async function handleSave() {
    if (busy || !auth?.user) return;
    const name = companyName.trim();
    if (!name) {
      showToast("Enter your studio or company name.", "error");
      return;
    }
    const emailTrimmed = email.trim().toLowerCase();
    if (!emailTrimmed) {
      showToast("Enter your photographer email.", "error");
      return;
    }
    if (!EMAIL_REGEX.test(emailTrimmed)) {
      showToast("Enter a valid photographer email.", "error");
      return;
    }
    const phoneTrimmed = phone.trim();
    if (!phoneTrimmed) {
      showToast("Enter your business phone.", "error");
      return;
    }
    const slug = companySlug.trim();
    if (!slug) {
      showToast("Enter your studio URL.", "error");
      return;
    }
    const slugValidation = studioSlugValidationMessage(slug);
    if (slugValidation) {
      showToast(slugValidation, "error");
      return;
    }

    const siteRaw = website.trim();
    const site =
      siteRaw && !/^https?:\/\//i.test(siteRaw) ? `https://${siteRaw}` : siteRaw;

    setBusy(true);
    try {
      const saved = await updateProfileSettings({
        businessName: name,
        companySlug: slug,
        phone: phoneTrimmed,
        email: emailTrimmed,
        ...(site ? { website: site } : {}),
        ...(logoFile ? { brandLogoFile: logoFile } : {}),
        ...(clearBrandLogo && !logoFile ? { clearBrandLogo: true } : {}),
      });

      onProfileUpdated?.(saved);
      if (saved.requiresEmailVerification) {
        showToast(
          saved.message ??
            "Profile saved. Check your inbox to verify the new email.",
          "success",
        );
        window.location.assign(photographerAuthUrl(verifyEmailPath()));
        return;
      }
      showToast(saved.message ?? "Profile saved.", "success");
    } catch (e) {
      showToast(settingsErrorMessage(e, "Could not save your profile."), "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    const loginUrl = photographerSignOutUrl();
    await logout();
    window.location.replace(loginUrl);
  }

  const displayName =
    companyName.trim() ||
    apiProfile?.displayName?.trim() ||
    apiStudio?.companyName?.trim() ||
    apiStudio?.businessName?.trim() ||
    "Your studio";
  const profileComplete =
    apiProfile?.profileComplete ??
    Boolean(auth?.user?.onboardingComplete && studio?.companyName?.trim());
  const profileStatusLabel = apiProfile?.profileStatusLabel;
  const savedLogoSrc =
    (apiStudio ? studioLogoUrlFromSettings(apiStudio) : undefined) ??
    studio?.logoDataUrl;
  const logoPreview =
    logoDataUrl ?? (!clearBrandLogo ? savedLogoSrc : undefined) ?? "/images/user-profile.png";
  const hasCustomLogo = Boolean(logoDataUrl || (!clearBrandLogo && savedLogoSrc));

  if (loading && !pageData) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-5">
          <div className="h-24 w-24 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-900" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-6 w-48 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-900" />
            <div className="h-4 w-64 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-900" />
            <div className="h-3 w-40 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-900" />
          </div>
        </div>
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Identity — Linear / Notion style */}
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        <div className="shrink-0">
          <label
            className={cn(
              "group relative block h-24 w-24 cursor-pointer overflow-hidden rounded-full border border-zinc-200 bg-zinc-50 shadow-sm transition hover:border-brand/40 dark:border-zinc-700 dark:bg-zinc-900",
              busy && "pointer-events-none opacity-60",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoPreview}
              alt=""
              className={
                hasCustomLogo
                  ? "h-full w-full object-contain p-2"
                  : "h-full w-full object-cover"
              }
            />
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-zinc-950/55 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
              <Camera className="h-5 w-5 text-white" aria-hidden />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-white">
                {hasCustomLogo ? "Change" : "Upload"}
              </span>
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              className="sr-only"
              disabled={busy}
              aria-label="Upload brand logo"
              onChange={(e) => {
                void onLogoFile(e.target.files?.[0] ?? null);
                e.currentTarget.value = "";
              }}
            />
          </label>
          {hasCustomLogo ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setLogoDataUrl(undefined);
                setLogoFile(null);
                setClearBrandLogo(true);
              }}
              className="mt-2 w-full text-center text-[11px] font-medium text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              Remove brand logo
            </button>
          ) : (
            <p className="mt-2 max-w-[6rem] text-center text-[10px] leading-snug text-zinc-400">
              Brand logo · PNG/JPG · max 1.2 MB
            </p>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <h3 className="truncate text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {displayName}
            </h3>
            <p className="mt-1 truncate text-sm text-zinc-500">{email || savedEmail || "N/A"}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-zinc-500">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {planLabel} plan
              </span>
              <span className="hidden text-zinc-300 sm:inline dark:text-zinc-700" aria-hidden>
                ·
              </span>
              <span
                className={cn(
                  "font-medium",
                  profileComplete
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-amber-700 dark:text-amber-300",
                )}
              >
                {profileComplete
                  ? (profileStatusLabel ?? "Profile complete")
                  : (profileStatusLabel ?? "Finish studio details below")}
              </span>
            </div>
          </div>

          <dl className="grid gap-3 border-t border-zinc-100 pt-4 sm:grid-cols-3 dark:border-zinc-800">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Galleries
              </dt>
              <dd className="mt-1 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {galleriesLabel}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Plan storage
              </dt>
              <dd className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {planStorageLabel ?? formatPlanStorage(plan.storageBytes)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Member since
              </dt>
              <dd className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {memberSince ?? "N/A"}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      {/* Studio form */}
      <section className="space-y-5">
        <div className="border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Studio details</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Shown in your sidebar and across client-facing parts of {displayName}.
          </p>
        </div>

        <StudioUrlField
          companyName={companyName}
          onCompanyNameChange={(v) => setCompanyName(v)}
          companySlug={companySlug}
          onCompanySlugChange={setCompanySlug}
          slugManuallyEdited={slugManuallyEdited}
          onSlugManuallyEdited={setSlugManuallyEdited}
          studioUrlSuffix={studioUrlSuffix}
          studioUrl={studioUrl}
          suggestedCompanySlug={apiStudio?.suggestedCompanySlug}
          disabled={busy}
          variant="settings"
        />

        <label className="block">
          <span className={cn(labelClass, "inline-flex items-center gap-1.5 normal-case")}>
            <Mail className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
            Photographer email
          </span>
          <FormInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@studio.com"
            disabled={busy}
            className="mt-2"
            autoComplete="email"
          />
          <p className="mt-1.5 text-[11px] text-zinc-500">
            Used to sign in. Changing it sends a new verification code.
          </p>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={cn(labelClass, "inline-flex items-center gap-1.5 normal-case")}>
              <Phone className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
              Business phone
            </span>
            <ContactNumberInput
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +1 555 0100"
              disabled={busy}
              className="mt-2"
            />
          </label>
          <label className="block">
            <span className={cn(labelClass, "inline-flex items-center gap-1.5 normal-case")}>
              <Globe className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
              Website
            </span>
            <FormInput
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourstudio.com"
              disabled={busy}
              className="mt-2"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <button
            type="button"
            disabled={busy}
            onClick={syncFromAuth}
            className="text-sm font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
          >
            Discard changes
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleSave()}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover disabled:opacity-50"
          >
            <Save className="h-4 w-4" aria-hidden />
            {busy ? "Saving…" : "Save profile"}
          </button>
        </div>
      </section>

      <SettingsSmsSection
        auth={auth}
        pageData={pageData}
        onProfileUpdated={onProfileUpdated}
      />

      {/* Session */}
      <div className="flex flex-col gap-3 border-t border-zinc-100 pt-6 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Sign out</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            End this session on shared computers when you are done.
          </p>
        </div>
        <button
          type="button"
          disabled={signingOut}
          onClick={() => void handleSignOut()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-800 shadow-sm transition hover:bg-red-100 disabled:opacity-50 dark:border-red-900/55 dark:bg-red-950/45 dark:text-red-100 dark:hover:bg-red-950/70"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );
}
