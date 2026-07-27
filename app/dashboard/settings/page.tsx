"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { SettingsShell } from "@/components/settings/settings-shell";
import {
  SettingsBillingSection,
  SettingsGallerySection,
  SettingsProfileSection,
  SettingsReferSection,
  SettingsSupportSection,
  SettingsWatermarkSection,
} from "@/components/settings/settings-sections";
import { useToast } from "@/components/toast-provider";
import { getAuth } from "@/lib/auth-demo";
import {
  fetchSettingsPageData,
  fetchSettingsTabData,
  updateSettings,
  type ApiSettings,
  type SettingsPageData,
} from "@/lib/settings-api";
import {
  SETTINGS_PREREQUISITE_FOCUS,
  isSafeDashboardReturnTo,
} from "@/lib/settings-prerequisite";
import {
  isSettingsTabId,
  settingsTabHref,
  settingsTabMeta,
  type SettingsTabId,
} from "@/lib/settings-tabs";

function formatAccountRole(role?: string): string {
  if (!role) return "Photographer";
  return role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, " ");
}

function SettingsPageContent() {
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authVersion, setAuthVersion] = useState(0);
  const auth = useMemo(() => {
    void authVersion;
    return getAuth();
  }, [authVersion]);

  const tabParam = searchParams.get("tab");
  const returnToParam = searchParams.get("returnTo");
  const focusParam = searchParams.get("focus");
  const returnTo =
    returnToParam && isSafeDashboardReturnTo(returnToParam) ? returnToParam : null;
  const activeTab: SettingsTabId = isSettingsTabId(tabParam) ? tabParam : "profile";

  const [settings, setSettings] = useState<ApiSettings | null>(null);
  const [pageData, setPageData] = useState<SettingsPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingWatermark, setSavingWatermark] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [removingCover, setRemovingCover] = useState(false);
  const authEmail = (auth?.user?.email ?? auth?.email ?? "").trim();
  const [siteOrigin, setSiteOrigin] = useState("");
  const [billingSuccess, setBillingSuccess] = useState(false);
  const pageDataRef = useRef<SettingsPageData | null>(null);

  useEffect(() => {
    pageDataRef.current = pageData;
  }, [pageData]);

  useEffect(() => {
    setSiteOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (searchParams.get("success") === "1" && activeTab === "billing") {
      setBillingSuccess(true);
    }
  }, [searchParams, activeTab]);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await fetchSettingsPageData();
      setPageData(data);
      setSettings(data.flat);
      setAuthVersion((v) => v + 1);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (loading || activeTab === "profile" || activeTab === "refer" || activeTab === "support") {
      return;
    }

    const tabKey =
      activeTab === "billing"
        ? "billing"
        : activeTab === "gallery"
          ? "gallery"
          : "watermark";

    void (async () => {
      try {
        const data = await fetchSettingsTabData(tabKey, pageDataRef.current);
        setPageData(data);
        setSettings(data.flat);
        if (tabKey === "gallery" || tabKey === "watermark") {
          setAuthVersion((v) => v + 1);
        }
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Could not load settings.", "error");
      }
    })();
  }, [activeTab, loading, showToast]);

  function applyPageData(data: SettingsPageData) {
    setPageData(data);
    setSettings(data.flat);
    setAuthVersion((v) => v + 1);
  }

  useEffect(() => {
    if (loading) return;
    const focusId =
      focusParam === SETTINGS_PREREQUISITE_FOCUS.watermarkPreview
        ? "settings-watermark-preview"
        : focusParam === SETTINGS_PREREQUISITE_FOCUS.brandWatermark
          ? "settings-brand-watermark"
          : null;
    if (!focusId) return;
    requestAnimationFrame(() => {
      document.getElementById(focusId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [focusParam, loading]);

  const returnAfterPrerequisite = useCallback(() => {
    if (!returnTo) return;
    router.push(returnTo);
  }, [returnTo, router]);

  const accountEmail =
    pageData?.bundle.account?.email ??
    pageData?.bundle.profile?.email ??
    auth?.user?.email ??
    auth?.email ??
    "";
  const accountRole = formatAccountRole(
    pageData?.bundle.account?.role ?? auth?.user?.role,
  );
  const accountId = pageData?.bundle.account?.accountId ?? auth?.user?._id;

  const profileHeaderExtra =
    activeTab === "profile" ? (
      <dl className="grid gap-3 rounded-xl border border-zinc-200/80 bg-white/70 px-4 py-3 sm:grid-cols-3 dark:border-zinc-800 dark:bg-zinc-950/50">
        <div className="min-w-0">
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Email
          </dt>
          <dd className="mt-1 truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {accountEmail || "N/A"}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Role
          </dt>
          <dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {accountRole}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Account ID
          </dt>
          <dd className="mt-1 truncate font-mono text-xs text-zinc-500 dark:text-zinc-400">
            {accountId || "N/A"}
          </dd>
        </div>
      </dl>
    ) : null;

  async function onWatermarkChange(next: boolean) {
    if (!settings || savingWatermark) return;
    setSavingWatermark(true);
    try {
      const data = await updateSettings({ watermarkPreviewImages: next });
      setSettings(data);
      const refreshed = await fetchSettingsTabData("gallery", pageDataRef.current);
      applyPageData(refreshed);
      showToast("Settings saved.", "success");
      if (next && returnTo && focusParam === SETTINGS_PREREQUISITE_FOCUS.watermarkPreview) {
        returnAfterPrerequisite();
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save.", "error");
    } finally {
      setSavingWatermark(false);
    }
  }

  async function onCoverImageUpload(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file.", "error");
      return;
    }
    setUploadingCover(true);
    try {
      const data = await updateSettings({ defaultCoverImage: file });
      setSettings(data);
      const refreshed = await fetchSettingsTabData("gallery", pageDataRef.current);
      applyPageData(refreshed);
      showToast("Default cover updated.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to upload cover.", "error");
    } finally {
      setUploadingCover(false);
    }
  }

  async function onCoverRemove() {
    if (!settings || removingCover || uploadingCover) return;
    setRemovingCover(true);
    try {
      const data = await updateSettings({ defaultCoverImage: null });
      setSettings(data);
      const refreshed = await fetchSettingsTabData("gallery", pageDataRef.current);
      applyPageData(refreshed);
      showToast("Default cover removed.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to remove cover.", "error");
    } finally {
      setRemovingCover(false);
    }
  }

  const refreshBillingContext = useCallback(async () => {
    try {
      const data = await fetchSettingsTabData("billing", pageDataRef.current);
      applyPageData(data);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not refresh billing.", "error");
    }
  }, [showToast]);

  function copyReferralLink() {
    if (!authEmail) {
      showToast("Sign in first.", "error");
      return;
    }
    const url = `${window.location.origin}/login?ref=${encodeURIComponent(authEmail)}`;
    void navigator.clipboard.writeText(url).then(
      () => showToast("Link copied.", "success"),
      () => showToast("Could not copy.", "error"),
    );
  }

  function renderPanel() {
    switch (activeTab) {
      case "profile":
        return (
          <SettingsProfileSection
            auth={auth}
            pageData={pageData}
            loading={loading}
            onProfileUpdated={applyPageData}
          />
        );
      case "billing":
        return (
          <SettingsBillingSection
            overview={pageData?.bundle.overview ?? null}
            loading={loading}
            paymentSuccess={billingSuccess}
            onPaymentSuccessAcknowledged={() => {
              setBillingSuccess(false);
              router.replace("/dashboard/settings?tab=billing", { scroll: false });
            }}
            onBillingUpdated={refreshBillingContext}
          />
        );
      case "watermark":
        return (
          <SettingsWatermarkSection
            initialWatermark={settings?.brandWatermark}
            loading={loading}
            onSaved={(brandWatermark) => {
              setSettings((cur) => (cur ? { ...cur, brandWatermark } : cur));
              if (
                brandWatermark.enabled &&
                returnTo &&
                focusParam === SETTINGS_PREREQUISITE_FOCUS.brandWatermark
              ) {
                returnAfterPrerequisite();
              }
            }}
            returnTo={returnTo}
          />
        );
      case "gallery":
        return (
          <SettingsGallerySection
            settings={settings}
            watermarkPreviewHint={
              pageData?.bundle.galleryDefaults.watermarkPreview?.description
            }
            loading={loading}
            savingWatermark={savingWatermark}
            uploadingCover={uploadingCover}
            removingCover={removingCover}
            onWatermarkChange={(n) => void onWatermarkChange(n)}
            onCoverUpload={(f) => void onCoverImageUpload(f)}
            onCoverRemove={() => void onCoverRemove()}
            returnTo={returnTo}
          />
        );
      case "refer":
        return (
          <SettingsReferSection
            authEmail={authEmail}
            siteOrigin={siteOrigin}
            onCopyLink={copyReferralLink}
          />
        );
      case "support":
        return <SettingsSupportSection auth={auth} />;
      default:
        return null;
    }
  }

  const activeTabMeta = settingsTabMeta(activeTab);

  return (
    <div className="dashboard-page space-y-6">
      <header>
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm">
            <li>
              <Link
                href="/dashboard"
                className="font-medium text-zinc-400 transition hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
              >
                Dashboard
              </Link>
            </li>
            <li className="text-zinc-300 dark:text-zinc-600" aria-hidden>
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
            </li>
            <li>
              <Link
                href={settingsTabHref("profile")}
                className="font-semibold text-zinc-600 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Settings
              </Link>
            </li>
            <li className="text-zinc-300 dark:text-zinc-600" aria-hidden>
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
            </li>
            <li className="font-semibold text-zinc-900 dark:text-zinc-50">{activeTabMeta.label}</li>
          </ol>
        </nav>
      </header>

      {loadError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {loadError}
          <button
            type="button"
            className="ml-3 font-semibold underline"
            onClick={() => {
              setLoading(true);
              void load();
            }}
          >
            Retry
          </button>
        </div>
      ) : null}

      {returnTo ? (
        <div className="rounded-2xl border border-amber-200/90 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          <p>
            {focusParam === SETTINGS_PREREQUISITE_FOCUS.brandWatermark
              ? "Turn on your brand watermark below and save — you'll return to your gallery automatically. You can also "
              : "Turn on the setting below — you'll return to your gallery automatically. You can also "}
            <button
              type="button"
              onClick={returnAfterPrerequisite}
              className="font-semibold text-brand underline underline-offset-2 hover:text-brand-hover dark:text-brand-on-dark"
            >
              go back now
            </button>
            .
          </p>
        </div>
      ) : null}

      <SettingsShell headerExtra={profileHeaderExtra}>
        {renderPanel()}
      </SettingsShell>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="dashboard-page px-4 py-16 text-center text-sm text-zinc-500">
          Loading settings…
        </div>
      }
    >
      <SettingsPageContent />
    </Suspense>
  );
}
