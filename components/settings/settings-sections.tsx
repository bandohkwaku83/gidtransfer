"use client";

import Link from "next/link";
import { SettingsProfileSection } from "@/components/settings/settings-profile-section";
import type { DemoAuthUser } from "@/lib/auth-demo";
import { APP_NAME } from "@/lib/branding";
import type { ApiSettings } from "@/lib/settings-api";
import { getSettingsDefaultCoverUrl } from "@/lib/settings-api";
import { WatermarkBrandPanel } from "@/components/settings/watermark-brand-panel";
import { SettingsInfoCard, SettingsToggle } from "@/components/settings/settings-shared";
import { SettingsWorkflowSkeleton } from "@/components/ui/skeletons";

export { SettingsProfileSection } from "@/components/settings/settings-profile-section";
export { SettingsBillingSection } from "@/components/settings/settings-billing-section";
export { SettingsSupportSection } from "@/components/settings/settings-support-section";

export function SettingsWatermarkSection({
  settings,
  loading,
  onSaved,
}: {
  settings: ApiSettings | null;
  loading: boolean;
  onSaved: (s: ApiSettings) => void;
}) {
  if (loading || !settings) return <SettingsWorkflowSkeleton />;
  return (
    <WatermarkBrandPanel
      initial={settings.brandWatermark}
      onSaved={onSaved}
      disabled={loading}
    />
  );
}

export function SettingsGallerySection({
  settings,
  loading,
  savingWatermark,
  uploadingCover,
  onWatermarkChange,
  onCoverUpload,
}: {
  settings: ApiSettings | null;
  loading: boolean;
  savingWatermark: boolean;
  uploadingCover: boolean;
  onWatermarkChange: (next: boolean) => void;
  onCoverUpload: (file: File | null) => void;
}) {
  if (loading || !settings) return <SettingsWorkflowSkeleton />;

  const coverUrl = getSettingsDefaultCoverUrl(settings);

  return (
    <div className="space-y-4">
      <SettingsToggle
        checked={settings.watermarkPreviewImages}
        onChange={onWatermarkChange}
        disabled={savingWatermark}
        label="Watermark preview images"
        hint="Adds a text watermark on client selection thumbnails. Brand logo on finals is under Watermark."
      />

      <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Default cover image</p>
        <p className="mt-1 text-xs text-zinc-500">
          Used when a new gallery has no custom cover. Wide JPG or PNG (1600×900+) works best.
        </p>
        {coverUrl ? (
          <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverUrl} alt="" className="h-36 w-full object-cover" />
          </div>
        ) : (
          <div className="mt-3 flex h-24 items-center justify-center rounded-xl border border-dashed border-zinc-300 text-xs text-zinc-500">
            No default cover uploaded
          </div>
        )}
        <label className="mt-3 inline-flex cursor-pointer items-center rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-hover">
          {uploadingCover ? "Uploading…" : "Upload cover"}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={uploadingCover}
            onChange={(e) => {
              onCoverUpload(e.target.files?.[0] ?? null);
              e.currentTarget.value = "";
            }}
          />
        </label>
      </div>
    </div>
  );
}

export function SettingsReferSection({
  authEmail,
  siteOrigin,
  onCopyLink,
}: {
  authEmail: string;
  siteOrigin: string;
  onCopyLink: () => void;
}) {
  const link =
    authEmail && siteOrigin
      ? `${siteOrigin}/login?ref=${encodeURIComponent(authEmail)}`
      : authEmail
        ? "Loading…"
        : "Sign in to generate your link.";

  return (
    <div className="space-y-4">
      <SettingsInfoCard>
        Share {APP_NAME} with other photographers. Referral rewards apply when enabled in your
        region.
      </SettingsInfoCard>
      <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <p className="text-xs font-medium text-zinc-800 dark:text-zinc-100">Your invite link</p>
        <p className="mt-2 break-all rounded-lg bg-white px-3 py-2 font-mono text-xs text-zinc-600 dark:bg-zinc-950">
          {link}
        </p>
        <button
          type="button"
          onClick={onCopyLink}
          disabled={!authEmail}
          className="mt-3 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
        >
          Copy referral link
        </button>
      </div>
      <p className="text-xs text-zinc-500">
        Referral tracking is not active in this preview; the link still attaches your email as a
        reference.
      </p>
    </div>
  );
}
