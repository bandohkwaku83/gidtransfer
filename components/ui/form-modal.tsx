"use client";

import type { FormEvent, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Shared field styles for create / edit modals */
export const formModalInputClass =
  "mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500";

export const formModalLabelClass =
  "text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400";

export const formModalCancelButtonClass =
  "rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200/80 disabled:opacity-50 dark:text-zinc-200 dark:hover:bg-zinc-800";

export const formModalSecondaryButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800";

export const formModalPrimaryButtonClass =
  "rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand/25 transition hover:bg-brand-hover disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 dark:focus:ring-offset-zinc-950";

type FormModalProps = {
  open: boolean;
  onClose: () => void;
  busy?: boolean;
  /** Stack above other modals (e.g. nested “Add client”). */
  elevated?: boolean;
  maxWidth?: "md" | "lg";
  titleId?: string;
  children: ReactNode;
};

export function FormModal({
  open,
  onClose,
  busy,
  elevated,
  maxWidth = "lg",
  titleId,
  children,
}: FormModalProps) {
  if (!open) return null;

  function handleBackdrop() {
    if (busy) return;
    onClose();
  }

  return (
    <div
      className={cn(
        "fixed inset-0 flex items-center justify-center overflow-y-auto overscroll-y-contain p-4 py-6 sm:py-8",
        elevated ? "z-[70]" : "z-50",
      )}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={handleBackdrop}
      />
      <div
        role="dialog"
        aria-modal="true"
        {...(titleId ? { "aria-labelledby": titleId } : {})}
        className={cn(
          "relative z-10 flex max-h-[min(90dvh,calc(100dvh-2rem))] w-full flex-col overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-2xl shadow-zinc-900/10 ring-1 ring-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-white/5",
          maxWidth === "md" ? "max-w-md" : "max-w-lg",
        )}
      >
        {children}
      </div>
    </div>
  );
}

type FormModalHeaderProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  titleId?: string;
  onClose?: () => void;
  busy?: boolean;
};

export function FormModalHeader({
  icon: Icon,
  title,
  description,
  titleId,
  onClose,
  busy,
}: FormModalHeaderProps) {
  return (
    <div className="shrink-0 border-b border-zinc-100 bg-gradient-to-br from-brand-soft/90 to-white px-6 py-5 dark:border-zinc-800 dark:from-brand/25 dark:to-zinc-950">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-md shadow-brand/25">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2
            id={titleId}
            className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-sm leading-snug text-zinc-600 dark:text-zinc-400">
              {description}
            </p>
          ) : null}
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function FormModalBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-6 py-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

type FormModalSectionProps = {
  title?: string;
  children: ReactNode;
  variant?: "filled" | "dashed" | "plain";
};

export function FormModalSection({
  title,
  children,
  variant = "filled",
}: FormModalSectionProps) {
  return (
    <div
      className={cn(
        "space-y-4",
        variant === "filled" && "rounded-2xl bg-zinc-50/90 p-4 dark:bg-zinc-900/50",
        variant === "dashed" &&
          "rounded-2xl border border-dashed border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950/80",
        variant === "plain" && "space-y-3",
      )}
    >
      {title ? (
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {title}
        </p>
      ) : null}
      {children}
    </div>
  );
}

type FormFieldProps = {
  label: string;
  htmlFor?: string;
  required?: boolean;
  optional?: boolean;
  icon?: LucideIcon;
  hint?: ReactNode;
  children: ReactNode;
  /** Row layout for label + inline action (e.g. Add client). */
  action?: ReactNode;
};

export function FormField({
  label,
  htmlFor,
  required,
  optional,
  icon: Icon,
  hint,
  children,
  action,
}: FormFieldProps) {
  const labelEl = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        formModalLabelClass,
        action && "mb-2",
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5 text-zinc-400" aria-hidden /> : null}
      {label}
      {required ? (
        <span className="text-red-500 normal-case" aria-hidden>
          *
        </span>
      ) : null}
      {optional ? (
        <span className="font-normal normal-case text-zinc-400">(optional)</span>
      ) : null}
    </span>
  );

  return (
    <label className="block" htmlFor={htmlFor}>
      {action ? (
        <span className="flex flex-wrap items-center justify-between gap-2">
          {labelEl}
          {action}
        </span>
      ) : (
        labelEl
      )}
      {children}
      {hint ? <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">{hint}</span> : null}
    </label>
  );
}

type FormModalFooterProps = {
  onCancel: () => void;
  cancelLabel?: string;
  submitLabel: string;
  busyLabel?: string;
  busy?: boolean;
  submitDisabled?: boolean;
  /** When set, primary button is `type="submit"` for the given form id. */
  formId?: string;
  onSubmit?: () => void;
};

export function FormModalFooter({
  onCancel,
  cancelLabel = "Cancel",
  submitLabel,
  busyLabel,
  busy,
  submitDisabled,
  formId,
  onSubmit,
}: FormModalFooterProps) {
  const primaryLabel = busy && busyLabel ? busyLabel : submitLabel;

  return (
    <div className="flex shrink-0 items-center justify-end gap-3 border-t border-zinc-100 bg-zinc-50/80 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/40">
      <button
        type="button"
        onClick={onCancel}
        className={formModalCancelButtonClass}
        disabled={busy}
      >
        {cancelLabel}
      </button>
      <button
        type={formId ? "submit" : "button"}
        form={formId}
        disabled={busy || submitDisabled}
        onClick={formId ? undefined : onSubmit}
        aria-busy={busy}
        className={formModalPrimaryButtonClass}
      >
        {primaryLabel}
      </button>
    </div>
  );
}

/** Wrapper for modal body content submitted via footer */
export function FormModalForm({
  id,
  onSubmit,
  children,
  className,
}: {
  id: string;
  onSubmit: (e: FormEvent) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <form id={id} onSubmit={onSubmit} className={cn("contents", className)}>
      {children}
    </form>
  );
}
