"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  getSettings,
  updateSettings,
  type ApiSettings,
} from "@/lib/settings-api";
import {
  PLANS,
  countGalleriesTowardQuota,
  getSubscriptionPlanIdForEmail,
  setSubscriptionPlanIdForEmail,
  type PlanId,
} from "@/lib/subscription-plan";
import { isSettingsTabId, type SettingsTabId } from "@/lib/settings-tabs";
import { PRODUCT_TAGLINE } from "@/lib/branding";

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
  const activeTab: SettingsTabId = isSettingsTabId(tabParam) ? tabParam : "profile";

  const [settings, setSettings] = useState<ApiSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingWatermark, setSavingWatermark] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const authEmail = (auth?.user?.email ?? auth?.email ?? "").trim();
  const [planId, setPlanId] = useState<PlanId>("free");
  const [siteOrigin, setSiteOrigin] = useState("");

  useEffect(() => {
    setSiteOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!authEmail) {
      setPlanId("free");
      return;
    }
    setPlanId(getSubscriptionPlanIdForEmail(authEmail));
  }, [authEmail]);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function setTab(tab: SettingsTabId) {
    router.replace(`/dashboard/settings?tab=${tab}`, { scroll: false });
  }

  async function onWatermarkChange(next: boolean) {
    if (!settings || savingWatermark) return;
    setSavingWatermark(true);
    try {
      const data = await updateSettings({ watermarkPreviewImages: next });
      setSettings(data);
      showToast("Settings saved.", "success");
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
      const data = await updateSettings({
        defaultCoverImage: file,
        watermarkPreviewImages: settings?.watermarkPreviewImages,
      });
      setSettings(data);
      showToast("Default cover updated.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to upload cover.", "error");
    } finally {
      setUploadingCover(false);
    }
  }

  function selectPlan(id: PlanId) {
    if (!authEmail) {
      showToast("Sign in to change plans.", "error");
      return;
    }
    setSubscriptionPlanIdForEmail(authEmail, id);
    setPlanId(id);
    showToast(
      id === "free" ? "Free plan selected (demo)." : `${PLANS[id].label} plan selected (demo).`,
      "success",
    );
  }

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
            planId={planId}
            onTabChange={setTab}
            onProfileUpdated={() => setAuthVersion((v) => v + 1)}
          />
        );
      case "billing":
        return (
          <SettingsBillingSection
            planId={planId}
            galleriesUsed={countGalleriesTowardQuota()}
            onSelectPlan={selectPlan}
          />
        );
      case "watermark":
        return (
          <SettingsWatermarkSection
            settings={settings}
            loading={loading}
            onSaved={setSettings}
          />
        );
      case "gallery":
        return (
          <SettingsGallerySection
            settings={settings}
            loading={loading}
            savingWatermark={savingWatermark}
            uploadingCover={uploadingCover}
            onWatermarkChange={(n) => void onWatermarkChange(n)}
            onCoverUpload={(f) => void onCoverImageUpload(f)}
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
        return <SettingsSupportSection auth={auth} planId={planId} />;
      default:
        return null;
    }
  }

  return (
    <div className="dashboard-page space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-950 via-indigo-950/85 to-slate-900 shadow-lg shadow-slate-900/20">
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-brand/15 blur-3xl"
          aria-hidden
        />
        <div className="relative p-5 sm:p-6">
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[1.65rem]">
            Settings
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-slate-400">{PRODUCT_TAGLINE}</p>
        </div>
      </section>

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

      <SettingsShell activeTab={activeTab} onTabChange={setTab}>
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
