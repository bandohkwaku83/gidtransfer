"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  Calendar,
  CreditCard,
  ExternalLink,
  FolderOpen,
  Globe,
  HardDrive,
  ImageIcon,
  ImagePlus,
  LifeBuoy,
  LogOut,
  Mail,
  Phone,
  Save,
  Shield,
  SlidersHorizontal,
} from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { formModalLabelClass } from "@/components/ui/form-modal";
import { FormInput } from "@/components/ui/form-input";
import {
  logout,
  updatePhotographerStudioProfile,
  type DemoAuthUser,
  type PhotographerStudioProfile,
} from "@/lib/auth-demo";
import {
  PLANS,
  countGalleriesTowardQuota,
  type PlanId,
} from "@/lib/subscription-plan";
import type { SettingsTabId } from "@/lib/settings-tabs";
import { cn } from "@/lib/utils";

const MAX_LOGO_BYTES = 1_200_000;

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

function formatRole(role?: string): string {
  if (!role) return "Photographer";
  return role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, " ");
}

type SettingsProfileSectionProps = {
  auth: DemoAuthUser | null;
  planId: PlanId;
  onTabChange: (tab: SettingsTabId) => void;
  onProfileUpdated?: () => void;
};

export function SettingsProfileSection({
  auth,
  planId,
  onTabChange,
  onProfileUpdated,
}: SettingsProfileSectionProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const studio = auth?.user?.studio;
  const accountEmail = auth?.user?.email ?? auth?.email ?? "";
  const memberSince = formatMemberSince(auth?.user?.createdAt);
  const galleriesUsed = countGalleriesTowardQuota();
  const plan = PLANS[planId];

  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>();

  const syncFromAuth = useCallback(() => {
    setCompanyName(studio?.companyName?.trim() ?? auth?.user?.name?.trim() ?? "");
    setPhone(studio?.phone?.trim() ?? "");
    setWebsite(studio?.website?.trim() ?? "");
    setLogoDataUrl(studio?.logoDataUrl);
  }, [auth?.user?.name, studio]);

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
  }

  async function handleSave() {
    if (busy || !auth?.user) return;
    const name = companyName.trim();
    if (!name) {
      showToast("Enter your studio or company name.", "error");
      return;
    }
    const siteRaw = website.trim();
    const site =
      siteRaw && !/^https?:\/\//i.test(siteRaw) ? `https://${siteRaw}` : siteRaw;

    setBusy(true);
    try {
      const profile: PhotographerStudioProfile = {
        companyName: name,
        ...(logoDataUrl ? { logoDataUrl } : {}),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        ...(site ? { website: site } : {}),
      };
      updatePhotographerStudioProfile(profile);
      onProfileUpdated?.();
      showToast("Profile saved.", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not save profile.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logout();
      showToast("Signed out.", "success");
      router.replace("/login");
    } finally {
      setSigningOut(false);
    }
  }

  const displayName = companyName.trim() || "Your studio";
  const profileComplete = Boolean(auth?.user?.onboardingComplete && studio?.companyName?.trim());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 via-white to-brand/5 p-5 dark:border-zinc-800 dark:from-zinc-900/80 dark:via-zinc-950 dark:to-brand/10 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          {logoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoDataUrl} alt="" className="h-full w-full object-contain p-2" />
          ) : (
            <span className="font-display text-3xl font-semibold text-brand">
              {(displayName[0] ?? "S").toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {displayName}
          </h3>
          <p className="mt-0.5 truncate text-sm text-zinc-500">{accountEmail || "N/A"}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand dark:text-brand-on-dark">
              <CreditCard className="h-3 w-3" aria-hidden />
              {plan.label} plan
            </span>
            {profileComplete ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Profile complete
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300">
                Finish your studio details below
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Workspace snapshot */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/50">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <FolderOpen className="h-3.5 w-3.5" aria-hidden />
            Galleries
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {galleriesUsed}
            {plan.maxGalleries != null ? (
              <span className="text-sm font-normal text-zinc-500"> / {plan.maxGalleries}</span>
            ) : (
              <span className="text-sm font-normal text-zinc-500"> active</span>
            )}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/50">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <HardDrive className="h-3.5 w-3.5" aria-hidden />
            Plan storage
          </p>
          <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {formatPlanStorage(plan.storageBytes)}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/50">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <Calendar className="h-3.5 w-3.5" aria-hidden />
            Member since
          </p>
          <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {memberSince ?? "N/A"}
          </p>
        </div>
      </div>

      {/* Studio form */}
      <section className="space-y-4 rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Studio details</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Shown in your sidebar and used across client-facing parts of {displayName}.
          </p>
        </div>

        <label className="block">
          <span className={cn(labelClass, "inline-flex items-center gap-1.5 normal-case")}>
            <Building2 className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
            Studio / company name
          </span>
          <FormInput
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. North & Co. Photography"
            disabled={busy}
            autoComplete="organization"
            className="mt-2"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={cn(labelClass, "inline-flex items-center gap-1.5 normal-case")}>
              <Phone className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
              Business phone
            </span>
            <FormInput
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Optional"
              disabled={busy}
              autoComplete="tel"
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

        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-900/40">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Studio logo</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Appears in the app sidebar. PNG with transparency works best (max 1.2 MB).
          </p>
          {logoDataUrl ? (
            <div className="mt-3 flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoDataUrl} alt="" className="max-h-full max-w-full object-contain p-1" />
              </div>
              <div className="flex flex-wrap gap-2">
                <label
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900",
                    busy && "pointer-events-none opacity-60",
                  )}
                >
                  <ImagePlus className="h-3.5 w-3.5" aria-hidden />
                  Change
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
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setLogoDataUrl(undefined)}
                  className="rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <label
              className={cn(
                "mt-3 flex cursor-pointer flex-col items-center rounded-xl border border-zinc-200 bg-white py-6 text-center transition hover:border-brand dark:border-zinc-700 dark:bg-zinc-950",
                busy && "pointer-events-none opacity-60",
              )}
            >
              <ImagePlus className="h-6 w-6 text-zinc-400" aria-hidden />
              <span className="mt-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Upload logo
              </span>
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
          )}
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

      {/* Account (read-only) */}
      <section className="space-y-3 rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Account</p>
        <dl className="divide-y divide-zinc-100 text-sm dark:divide-zinc-800">
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <Mail className="h-3.5 w-3.5" aria-hidden />
              Email
            </dt>
            <dd className="text-zinc-900 dark:text-zinc-100">{accountEmail || "N/A"}</dd>
          </div>
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <Shield className="h-3.5 w-3.5" aria-hidden />
              Role
            </dt>
            <dd className="text-zinc-900 dark:text-zinc-100">{formatRole(auth?.user?.role)}</dd>
          </div>
          {auth?.user?._id ? (
            <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between">
              <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Account ID
              </dt>
              <dd className="max-w-full break-all font-mono text-xs text-zinc-600 dark:text-zinc-400">
                {auth.user._id}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      {/* Shortcuts */}
      <section className="space-y-3">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Quick links</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              {
                label: "Billing & plan",
                hint: `${plan.label}, ${formatPlanStorage(plan.storageBytes)}`,
                icon: CreditCard,
                onClick: () => onTabChange("billing"),
              },
              {
                label: "Watermark",
                hint: "Logo on client downloads",
                icon: ImageIcon,
                onClick: () => onTabChange("watermark"),
              },
              {
                label: "Gallery defaults",
                hint: "Covers & preview watermarks",
                icon: SlidersHorizontal,
                onClick: () => onTabChange("gallery"),
              },
              {
                label: "Help & support",
                hint: "Report issues or get in touch",
                icon: LifeBuoy,
                onClick: () => onTabChange("support"),
              },
            ] as const
          ).map(({ label, hint, icon: Icon, onClick }) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left transition hover:border-brand/40 hover:bg-brand/5 dark:border-zinc-800 dark:bg-zinc-950/50 dark:hover:bg-brand/10"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {label}
                </span>
                <span className="block text-xs text-zinc-500">{hint}</span>
              </span>
            </button>
          ))}
          <Link
            href="/dashboard/storage"
            className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 transition hover:border-brand/40 hover:bg-brand/5 dark:border-zinc-800 dark:bg-zinc-950/50 dark:hover:bg-brand/10"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              <HardDrive className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Storage
                <ExternalLink className="h-3 w-3 text-zinc-400" aria-hidden />
              </span>
              <span className="block text-xs text-zinc-500">Usage and uploads</span>
            </span>
          </Link>
          <Link
            href="/dashboard/galleries"
            className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 transition hover:border-brand/40 hover:bg-brand/5 dark:border-zinc-800 dark:bg-zinc-950/50 dark:hover:bg-brand/10"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              <FolderOpen className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Galleries
                <ExternalLink className="h-3 w-3 text-zinc-400" aria-hidden />
              </span>
              <span className="block text-xs text-zinc-500">Manage client deliveries</span>
            </span>
          </Link>
        </div>
      </section>

      {/* Session */}
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900/40">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Session</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Sign out on shared computers when you are done working.
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
