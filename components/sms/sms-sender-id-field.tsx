"use client";

import { FormInput } from "@/components/ui/form-input";
import {
  onboardingAntInputClassName,
  onboardingLabelClass,
  onboardingRequiredMarkClass,
} from "@/lib/onboarding-field-styles";
import {
  SMS_SENDER_ID_MAX_LENGTH,
  smsSenderIdValidationMessage,
} from "@/lib/sms-sender";
import { cn } from "@/lib/utils";

type SmsSenderIdFieldProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string | null;
  /** onboarding = compact onboarding styles; settings = dashboard settings styles */
  variant?: "onboarding" | "settings";
  className?: string;
};

function RequiredMark() {
  return (
    <span className={onboardingRequiredMarkClass} aria-hidden>
      {" "}
      *
    </span>
  );
}

export function SmsSenderIdField({
  value,
  onChange,
  disabled = false,
  required = false,
  error,
  variant = "onboarding",
  className,
}: SmsSenderIdFieldProps) {
  const preview = value.trim().toUpperCase() || "YOURSTUDIO";
  const validationError = error ?? smsSenderIdValidationMessage(value);
  const showError = Boolean(value.trim() && validationError);

  const labelClass =
    variant === "onboarding"
      ? onboardingLabelClass
      : "text-xs font-semibold uppercase tracking-wide text-zinc-500";

  const inputClass =
    variant === "onboarding"
      ? onboardingAntInputClassName
      : "mt-2";

  return (
    <div className={className}>
      <label className="block">
        <span className={labelClass}>
          SMS display name
          {required ? <RequiredMark /> : null}
        </span>
        <p
          className={cn(
            "text-zinc-500",
            variant === "onboarding"
              ? "mt-0.5 text-[10px] leading-snug"
              : "mt-1 text-xs normal-case tracking-normal",
          )}
        >
          Up to {SMS_SENDER_ID_MAX_LENGTH} letters and numbers — shown as the sender on client texts.
        </p>
        <FormInput
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={SMS_SENDER_ID_MAX_LENGTH}
          className={cn(variant === "onboarding" ? "mt-0.5" : undefined, inputClass)}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())}
          placeholder="e.g. BIZZLESTUDI"
          disabled={disabled}
          aria-required={required || undefined}
          aria-invalid={showError || undefined}
        />
      </label>
      <p className="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
        Preview:{" "}
        <span className="font-semibold text-zinc-700 dark:text-zinc-200">
          From: {preview}
        </span>
      </p>
      {showError ? (
        <p className="mt-1 text-[11px] font-medium text-red-600 dark:text-red-400" role="alert">
          {validationError}
        </p>
      ) : null}
    </div>
  );
}
