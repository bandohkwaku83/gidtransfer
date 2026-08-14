"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SettingsProfileSection } from "@/components/settings/settings-profile-section";
import type { ApiSettings } from "@/lib/settings-api";
import { getSettingsDefaultCoverUrl } from "@/lib/settings-api";
import { WatermarkBrandPanel } from "@/components/settings/watermark-brand-panel";
import { SettingsToggle } from "@/components/settings/settings-shared";
import { SettingsWorkflowSkeleton } from "@/components/ui/skeletons";
import { getWatermarkSettings } from "@/lib/watermark-api";
import type { BrandWatermarkSettings } from "@/lib/watermark-brand";

export { SettingsProfileSection } from "@/components/settings/settings-profile-section";
export { SettingsBillingSection } from "@/components/settings/settings-billing-section";
export { SettingsSupportSection } from "@/components/settings/settings-support-section";

export function SettingsWatermarkSection({
  initialWatermark,
  loading = false,
  onSaved,
  returnTo,
}: {
  initialWatermark?: BrandWatermarkSettings;
  loading?: boolean;
  onSaved?: (settings: BrandWatermarkSettings) => void;
  returnTo?: string | null;
}) {
  const [watermark, setWatermark] = useState<BrandWatermarkSettings | null>(
    initialWatermark ?? null,
  );
  const [fetching, setFetching] = useState(!initialWatermark);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    setFetching(true);
    try {
      const data = await getWatermarkSettings();
      setWatermark(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load watermark settings.");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (initialWatermark) {
      setWatermark(initialWatermark);
      setFetching(false);
      return;
    }
    void load();
  }, [initialWatermark, load]);

  if ((loading || fetching) && !watermark) return <SettingsWorkflowSkeleton />;

  if (loadError && !watermark) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
        {loadError}
        <button type="button" className="ml-3 font-semibold underline" onClick={() => void load()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <WatermarkBrandPanel
      initial={watermark ?? undefined}
      onSaved={(saved) => {
        setWatermark(saved);
        onSaved?.(saved);
      }}
      disabled={fetching}
      showPrerequisiteHint={Boolean(returnTo)}
    />
  );
}

export function SettingsGallerySection({
  settings,
  watermarkPreviewHint,
  loading,
  savingWatermark,
  uploadingCover,
  removingCover,
  onWatermarkChange,
  onCoverUpload,
  onCoverRemove,
  returnTo,
}: {
  settings: ApiSettings | null;
  watermarkPreviewHint?: string;
  loading: boolean;
  savingWatermark: boolean;
  uploadingCover: boolean;
  removingCover: boolean;
  onWatermarkChange: (next: boolean) => void;
  onCoverUpload: (file: File | null) => void;
  onCoverRemove: () => void;
  returnTo?: string | null;
}) {
  if (loading || !settings) return <SettingsWorkflowSkeleton />;

  const coverUrl = getSettingsDefaultCoverUrl(settings);
  const watermarkHint =
    watermarkPreviewHint ??
    "Adds a text watermark on client selection thumbnails. Brand logo on finals is under Watermark.";

  return (
    <div className="space-y-4">
      {returnTo ? (
        <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200/90">
          Required before you can turn on preview watermarks in a gallery upload.
        </p>
      ) : null}
      <SettingsToggle
        id="settings-watermark-preview"
        checked={settings.watermarkPreviewImages}
        onChange={onWatermarkChange}
        disabled={savingWatermark}
        label="Watermark preview images"
        hint={watermarkHint}
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
            disabled={uploadingCover || removingCover}
            onChange={(e) => {
              onCoverUpload(e.target.files?.[0] ?? null);
              e.currentTarget.value = "";
            }}
          />
        </label>
        {coverUrl ? (
          <button
            type="button"
            onClick={onCoverRemove}
            disabled={uploadingCover || removingCover}
            className="mt-2 block text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
          >
            {removingCover ? "Removing…" : "Remove default cover"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
