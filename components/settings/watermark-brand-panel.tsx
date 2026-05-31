"use client";

import { useCallback, useEffect, useState } from "react";
import { ImagePlus, Save } from "lucide-react";
import { LogoCropEditor } from "@/components/settings/logo-crop-editor";
import { SettingsToggle } from "@/components/settings/settings-shared";
import { useToast } from "@/components/toast-provider";
import { renderWatermarkPreviewDataUrl } from "@/lib/apply-brand-watermark";
import {
  defaultBrandWatermarkSettings,
  normalizeBrandWatermarkSettings,
  WATERMARK_POSITIONS,
  type BrandWatermarkSettings,
  type WatermarkPosition,
  type WatermarkTemplateSettings,
} from "@/lib/watermark-brand";
import { updateSettings, type ApiSettings } from "@/lib/settings-api";
import { cn } from "@/lib/utils";

const PORTRAIT_SAMPLE =
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=1200&fit=crop";
const LANDSCAPE_SAMPLE =
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200&h=800&fit=crop";

type TemplateTab = "portrait" | "landscape";

function PositionPicker({
  value,
  onChange,
  disabled,
}: {
  value: WatermarkPosition;
  onChange: (p: WatermarkPosition) => void;
  disabled?: boolean;
}) {
  const grid: (WatermarkPosition | null)[][] = [
    ["top-left", null, "top-right"],
    [null, "center", null],
    ["bottom-left", null, "bottom-right"],
  ];

  return (
    <div className="inline-grid grid-cols-3 gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-900/50">
      {grid.flat().map((pos, i) => {
        if (!pos) {
          return <div key={`spacer-${i}`} className="h-10 w-10" aria-hidden />;
        }
        const active = value === pos;
        const label = WATERMARK_POSITIONS.find((p) => p.id === pos)?.label ?? pos;
        return (
          <button
            key={pos}
            type="button"
            disabled={disabled}
            title={label}
            aria-label={label}
            aria-pressed={active}
            onClick={() => onChange(pos)}
            className={cn(
              "h-10 w-10 rounded-lg border-2 text-[10px] font-semibold transition",
              active
                ? "border-brand bg-brand text-white"
                : "border-transparent bg-white text-zinc-400 hover:border-zinc-300 hover:text-zinc-600 dark:bg-zinc-800 dark:hover:border-zinc-600",
            )}
          >
            {pos === "top-left" && "↖"}
            {pos === "top-right" && "↗"}
            {pos === "center" && "◎"}
            {pos === "bottom-left" && "↙"}
            {pos === "bottom-right" && "↘"}
          </button>
        );
      })}
    </div>
  );
}

function SliderRow({
  label,
  hint,
  value,
  min,
  max,
  step,
  format,
  onChange,
  disabled,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{label}</p>
        <span className="text-xs font-semibold tabular-nums text-brand dark:text-brand-on-dark">
          {format(value)}
        </span>
      </div>
      <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-brand"
      />
    </div>
  );
}

type WatermarkBrandPanelProps = {
  initial: BrandWatermarkSettings | undefined;
  onSaved: (settings: ApiSettings) => void;
  disabled?: boolean;
};

export function WatermarkBrandPanel({ initial, onSaved, disabled }: WatermarkBrandPanelProps) {
  const { showToast } = useToast();
  const [draft, setDraft] = useState<BrandWatermarkSettings>(() =>
    normalizeBrandWatermarkSettings(initial ?? defaultBrandWatermarkSettings()),
  );
  const [saving, setSaving] = useState(false);
  const [templateTab, setTemplateTab] = useState<TemplateTab>("portrait");
  const [showCrop, setShowCrop] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);

  useEffect(() => {
    setDraft(normalizeBrandWatermarkSettings(initial ?? defaultBrandWatermarkSettings()));
  }, [initial]);

  const activeTemplate =
    templateTab === "portrait" ? draft.portrait : draft.landscape;
  const sampleUrl = templateTab === "portrait" ? PORTRAIT_SAMPLE : LANDSCAPE_SAMPLE;

  const updateActiveTemplate = useCallback(
    (patch: Partial<WatermarkTemplateSettings>) => {
      setDraft((d) =>
        templateTab === "portrait"
          ? { ...d, portrait: { ...d.portrait, ...patch } }
          : { ...d, landscape: { ...d.landscape, ...patch } },
      );
    },
    [templateTab],
  );

  const refreshPreview = useCallback(async () => {
    if (!draft.logoDataUrl) {
      setPreviewUrl(null);
      return;
    }
    setPreviewBusy(true);
    try {
      const url = await renderWatermarkPreviewDataUrl(sampleUrl, draft, activeTemplate);
      setPreviewUrl(url);
    } catch {
      setPreviewUrl(null);
    } finally {
      setPreviewBusy(false);
    }
  }, [draft, sampleUrl, activeTemplate]);

  useEffect(() => {
    const t = window.setTimeout(() => void refreshPreview(), 350);
    return () => window.clearTimeout(t);
  }, [refreshPreview]);

  async function onLogoFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Use a PNG or JPG file.", "error");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showToast("Logo must be under 3 MB.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === "string" ? reader.result : null;
      if (!url) return;
      setDraft((d) => ({
        ...d,
        logoDataUrl: url,
        crop: { x: 0.08, y: 0.08, w: 0.84, h: 0.84 },
      }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (saving || disabled) return;
    if (draft.enabled && !draft.logoDataUrl) {
      showToast("Upload a logo first, or turn the watermark off.", "error");
      return;
    }
    setSaving(true);
    try {
      const data = await updateSettings({ brandWatermark: draft });
      onSaved(data);
      showToast("Saved.", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not save.", "error");
    } finally {
      setSaving(false);
    }
  }

  const busy = saving || disabled;
  const hasLogo = Boolean(draft.logoDataUrl);

  return (
    <div className="space-y-6">
      <SettingsToggle
        checked={draft.enabled}
        onChange={(enabled) => setDraft((d) => ({ ...d, enabled }))}
        disabled={busy}
        label="Put my logo on downloaded photos"
        hint="When clients save final images from a gallery, your logo is added automatically."
      />

      {draft.enabled ? (
        <>
          {/* Step 1: Logo */}
          <section className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">1. Your logo</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                A PNG with a transparent background looks best.
              </p>
            </div>

            {hasLogo ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-[repeating-conic-gradient(#e4e4e7_0%_25%,#fafafa_0%_50%)] bg-[length:10px_10px] dark:border-zinc-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={draft.logoDataUrl!}
                    alt="Your logo"
                    className="max-h-full max-w-full object-contain p-1"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900">
                    Change logo
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
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
                    onClick={() => setDraft((d) => ({ ...d, logoDataUrl: null, crop: null }))}
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <label
                className={cn(
                  "flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-zinc-200 px-4 py-10 text-center transition hover:border-brand hover:bg-brand/5 dark:border-zinc-700",
                  busy && "pointer-events-none opacity-60",
                )}
              >
                <ImagePlus className="h-7 w-7 text-zinc-400" aria-hidden />
                <span className="mt-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  Upload logo
                </span>
                <span className="mt-1 text-xs text-zinc-500">Max 3 MB</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  disabled={busy}
                  onChange={(e) => {
                    void onLogoFile(e.target.files?.[0] ?? null);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
            )}

            {hasLogo ? (
              <details
                className="rounded-xl border border-zinc-100 dark:border-zinc-800"
                open={showCrop}
                onToggle={(e) => setShowCrop(e.currentTarget.open)}
              >
                <summary className="cursor-pointer px-4 py-3 text-xs font-semibold text-zinc-600 marker:hidden dark:text-zinc-400">
                  Trim logo (optional) ▾
                </summary>
                <div className="border-t border-zinc-100 px-4 pb-4 pt-2 dark:border-zinc-800">
                  <LogoCropEditor
                    logoDataUrl={draft.logoDataUrl!}
                    crop={draft.crop}
                    onCropChange={(crop) => setDraft((d) => ({ ...d, crop }))}
                    disabled={busy}
                  />
                </div>
              </details>
            ) : null}
          </section>

          {/* Step 2: Placement */}
          {hasLogo ? (
            <section className="space-y-4 border-t border-zinc-100 pt-6 dark:border-zinc-800">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  2. Where it appears
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Tall and wide photos can use different settings. Pick a type, adjust, then save.
                </p>
              </div>

              <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-900/50">
                {(
                  [
                    ["portrait", "Tall photos"],
                    ["landscape", "Wide photos"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    disabled={busy}
                    onClick={() => setTemplateTab(id)}
                    className={cn(
                      "rounded-md px-4 py-2 text-xs font-semibold transition",
                      templateTab === id
                        ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:items-start">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Corner</p>
                    <p className="mt-0.5 text-xs text-zinc-500">Tap where the logo should sit.</p>
                    <div className="mt-2">
                      <PositionPicker
                        value={activeTemplate.position}
                        onChange={(position) => updateActiveTemplate({ position })}
                        disabled={busy}
                      />
                    </div>
                  </div>

                  <SliderRow
                    label="Logo size"
                    hint="How large the logo is on the photo."
                    value={activeTemplate.sizePercent}
                    min={5}
                    max={40}
                    step={1}
                    format={(v) => (v <= 12 ? "Small" : v >= 28 ? "Large" : "Medium")}
                    onChange={(sizePercent) => updateActiveTemplate({ sizePercent })}
                    disabled={busy}
                  />

                  <SliderRow
                    label="Visibility"
                    hint="Lower = more subtle; higher = more obvious."
                    value={activeTemplate.opacity}
                    min={10}
                    max={100}
                    step={5}
                    format={(v) => `${v}%`}
                    onChange={(opacity) => updateActiveTemplate({ opacity })}
                    disabled={busy}
                  />
                </div>

                <div className="min-w-0">
                  <p className="mb-2 text-xs font-medium text-zinc-500">Example preview</p>
                  <div
                    className={cn(
                      "overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900",
                      templateTab === "portrait" ? "max-w-[200px]" : "max-w-[280px]",
                    )}
                    style={{ aspectRatio: templateTab === "portrait" ? "3/4" : "4/3" }}
                  >
                    {previewBusy ? (
                      <div className="h-full w-full animate-pulse bg-zinc-200 dark:bg-zinc-800" />
                    ) : previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-full min-h-[120px] items-center justify-center text-xs text-zinc-400">
                        Preview loading…
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <p className="rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-400">
          Turn on the switch above to add your logo to client downloads.
        </p>
      )}

      <div className="flex justify-end border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleSave()}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover disabled:opacity-50"
        >
          <Save className="h-4 w-4" aria-hidden />
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
