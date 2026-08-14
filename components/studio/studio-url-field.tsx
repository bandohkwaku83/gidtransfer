"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Info, Link2 } from "lucide-react";
import { FormInput } from "@/components/ui/form-input";
import {
  buildStudioUrlPreview,
  normalizeStudioSlugInput,
  slugifyCompanyName,
  studioSlugValidationMessage,
} from "@/lib/studio-url";
import {
  onboardingAntInputClassName,
  onboardingCompositeFieldClassName,
  onboardingRequiredMarkClass,
} from "@/lib/onboarding-field-styles";
import { cn } from "@/lib/utils";

export type StudioUrlFieldProps = {
  companyName: string;
  onCompanyNameChange?: (value: string) => void;
  companySlug: string;
  onCompanySlugChange: (value: string) => void;
  slugManuallyEdited: boolean;
  onSlugManuallyEdited: (value: boolean) => void;
  studioUrlSuffix: string;
  studioUrl?: string | null;
  suggestedCompanySlug?: string | null;
  disabled?: boolean;
  /** @deprecated Style is unified; kept for call-site compatibility. */
  variant?: "auth" | "settings";
  /** Caps labels and inline https:// + suffix URL field (onboarding). */
  appearance?: "default" | "minimal";
  /** Tighter fields for single-screen onboarding. */
  dense?: boolean;
  slugError?: string | null;
  className?: string;
};

export function StudioUrlField({
  companyName,
  onCompanyNameChange,
  companySlug,
  onCompanySlugChange,
  slugManuallyEdited,
  onSlugManuallyEdited,
  studioUrlSuffix,
  studioUrl,
  suggestedCompanySlug,
  disabled,
  variant = "auth",
  appearance = "default",
  dense = false,
  slugError,
  className,
}: StudioUrlFieldProps) {
  const slugInputId = useId();
  const suffix = studioUrlSuffix.trim() || ".localhost:3000";
  const [slugTouched, setSlugTouched] = useState(false);
  const validationError = studioSlugValidationMessage(companySlug);
  // Don't paint the empty-slug error on first paint — only after edit/blur or parent submit error.
  const showValidation =
    Boolean(slugError) || slugTouched || slugManuallyEdited || companySlug.trim().length > 0;
  const displayError = slugError || (showValidation ? validationError : null);
  const didInitRef = useRef(false);

  useEffect(() => {
    if (!didInitRef.current) {
      didInitRef.current = true;
      return;
    }
    if (slugManuallyEdited || !onCompanyNameChange) return;
    const next =
      suggestedCompanySlug?.trim() || slugifyCompanyName(companyName);
    if (next && next !== companySlug) {
      onCompanySlugChange(next);
    }
  }, [
    companyName,
    companySlug,
    onCompanyNameChange,
    onCompanySlugChange,
    slugManuallyEdited,
    suggestedCompanySlug,
  ]);

  const previewUrl = useMemo(() => {
    if (studioUrl?.trim()) return studioUrl.trim();
    return buildStudioUrlPreview(companySlug, suffix);
  }, [companySlug, studioUrl, suffix]);

  const minimal = appearance === "minimal";
  const tight = minimal && dense;
  const labelClass = minimal
    ? "block text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400"
    : "flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-zinc-300";
  const inputClass = minimal ? (tight ? "" : "mt-0.5") : "mt-2";
  const minimalInputOverrides = minimal
    ? tight
      ? onboardingAntInputClassName
      : "[&_.ant-input]:!h-10 [&_.ant-input]:!rounded-lg [&_.ant-input]:!border-neutral-300 [&_.ant-input]:!px-3 [&_.ant-input:hover]:!border-neutral-400 [&_.ant-input:focus]:!border-neutral-500"
    : "";
  const suffixDisplay = suffix.startsWith(".") ? suffix : `.${suffix}`;

  const stackClass = minimal || tight ? "space-y-5" : "space-y-4";

  return (
    <div className={cn(stackClass, className)}>
      {onCompanyNameChange ? (
        <label className="block">
          <span className={labelClass}>
            Business name
            <span className={onboardingRequiredMarkClass} aria-hidden>
              {" "}
              *
            </span>
          </span>
          <FormInput
            autoComplete="organization"
            className={cn(tight ? minimalInputOverrides : cn(inputClass, minimalInputOverrides))}
            value={companyName}
            onChange={(e) => onCompanyNameChange(e.target.value)}
            placeholder={minimal ? "" : "e.g. Bizzles Photography"}
            disabled={disabled}
            aria-required
          />
        </label>
      ) : null}

      <div className="block">
        <label htmlFor={slugInputId} className={labelClass}>
          {!minimal ? (
            <Link2 className="h-4 w-4 text-teal-700/80 dark:text-brand-on-dark" aria-hidden />
          ) : null}
          Studio URL
          <span className={onboardingRequiredMarkClass} aria-hidden>
            {" "}
            *
          </span>
        </label>
        {minimal ? (
          <div
            className={cn(
              tight ? onboardingCompositeFieldClassName : "mt-0.5 flex h-10 items-stretch overflow-hidden rounded-lg border bg-white transition-colors focus-within:border-neutral-400",
              !tight && (displayError ? "border-red-400" : "border-neutral-300"),
              tight && (displayError ? "!border-red-400" : ""),
            )}
          >
            <span
              className={cn(
                "flex h-full shrink-0 items-center border-r border-neutral-200/80 bg-[#F5F5F5] text-neutral-500",
                tight ? "px-2.5 text-sm" : "px-3 text-sm",
              )}
            >
              https://
            </span>
            <input
              id={slugInputId}
              type="text"
              value={companySlug}
              onChange={(e) => {
                onSlugManuallyEdited(true);
                setSlugTouched(true);
                onCompanySlugChange(normalizeStudioSlugInput(e.target.value));
              }}
              onBlur={() => setSlugTouched(true)}
              placeholder="your-studio"
              disabled={disabled}
              autoComplete="off"
              spellCheck={false}
              aria-required
              aria-invalid={Boolean(displayError)}
              aria-describedby={`${slugInputId}-help`}
              className={cn(
                "h-full min-w-0 flex-1 border-0 bg-[#F5F5F5] px-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-60",
              )}
            />
            <span
              id={`${slugInputId}-suffix`}
              className={cn(
                "flex h-full shrink-0 items-center border-l border-neutral-200/80 bg-[#F5F5F5] text-neutral-500",
                tight ? "px-2.5 text-sm" : "px-3 text-sm",
              )}
            >
              {suffixDisplay}
            </span>
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap items-stretch overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950">
            <FormInput
              id={slugInputId}
              value={companySlug}
              onChange={(e) => {
                onSlugManuallyEdited(true);
                setSlugTouched(true);
                onCompanySlugChange(normalizeStudioSlugInput(e.target.value));
              }}
              onBlur={() => setSlugTouched(true)}
              placeholder="bizzles"
              disabled={disabled}
              autoComplete="off"
              spellCheck={false}
              className="min-w-[6rem] flex-1 [&_.ant-input]:!rounded-none [&_.ant-input]:!border-0 [&_.ant-input]:!shadow-none"
              aria-invalid={Boolean(displayError)}
              aria-describedby={`${slugInputId}-suffix ${slugInputId}-preview`}
            />
            <span
              id={`${slugInputId}-suffix`}
              className="flex shrink-0 items-center border-l border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
            >
              {suffixDisplay}
            </span>
          </div>
        )}
        {displayError ? (
          <p
            className={cn(
              "mt-1.5 text-xs font-medium text-red-600 dark:text-red-400",
              minimal && "font-normal tracking-normal normal-case",
            )}
          >
            {displayError}
          </p>
        ) : minimal && !tight ? (
          <p
            id={`${slugInputId}-help`}
            className="mt-1.5 flex items-start gap-1.5 text-xs leading-snug text-neutral-500"
          >
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
            <span>This is your public booking page address.</span>
          </p>
        ) : tight && !displayError ? (
          <span id={`${slugInputId}-help`} className="sr-only">
            This is your public booking page address.
          </span>
        ) : null}
        {!minimal && previewUrl ? (
          <p
            id={`${slugInputId}-preview`}
            className="mt-1.5 truncate font-mono text-xs text-slate-500 dark:text-zinc-400"
          >
            {previewUrl}
          </p>
        ) : null}
      </div>
    </div>
  );
}
