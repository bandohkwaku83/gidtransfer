"use client";

import { Input, Tooltip } from "antd";
import type { InputRef, InputProps, TextAreaProps } from "antd/es/input";
import type { TextAreaRef } from "antd/es/input/TextArea";
import { forwardRef, type ChangeEvent, type ReactNode } from "react";
import { sanitizeContactNumberInput } from "@/lib/contact-number-input";
import { cn } from "@/lib/utils";

/**
 * Shared text-field surface (login, dashboard, modals, onboarding).
 * Rounded rectangle, light border, white fill, medium-gray placeholder — no drop shadow.
 */
export const formFieldClassName = [
  "[&.ant-input]:!h-11",
  "[&.ant-input]:!rounded-xl",
  "[&.ant-input]:!border-zinc-200",
  "[&.ant-input]:!bg-white",
  "[&.ant-input]:!px-4",
  "[&.ant-input]:!text-sm",
  "[&.ant-input]:!leading-normal",
  "[&.ant-input]:!text-zinc-900",
  "[&.ant-input]:!shadow-none",
  "[&.ant-input]:placeholder:!text-zinc-400",
  "[&.ant-input:hover]:!border-zinc-300",
  "[&.ant-input:focus]:!border-zinc-400",
  "[&.ant-input:focus]:!shadow-none",
  "[&.ant-input-affix-wrapper]:!min-h-11",
  "[&.ant-input-affix-wrapper]:!rounded-xl",
  "[&.ant-input-affix-wrapper]:!border-zinc-200",
  "[&.ant-input-affix-wrapper]:!bg-white",
  "[&.ant-input-affix-wrapper]:!px-4",
  "[&.ant-input-affix-wrapper]:!py-0",
  "[&.ant-input-affix-wrapper]:!shadow-none",
  "[&_.ant-input]:!h-10",
  "[&_.ant-input]:!rounded-none",
  "[&_.ant-input]:!border-0",
  "[&_.ant-input]:!bg-transparent",
  "[&_.ant-input]:!px-0",
  "[&_.ant-input]:!shadow-none",
  "[&_.ant-input]:placeholder:!text-zinc-400",
  "[&.ant-input-affix-wrapper:hover]:!border-zinc-300",
  "focus-within:[&.ant-input-affix-wrapper]:!border-zinc-400",
  "focus-within:[&.ant-input-affix-wrapper]:!shadow-none",
  "[&_.ant-input-suffix]:!ms-1",
  "[&_.ant-input-suffix]:!flex",
  "[&_.ant-input-suffix]:!items-center",
  "dark:[&.ant-input]:!border-zinc-700",
  "dark:[&.ant-input]:!bg-zinc-950",
  "dark:[&.ant-input]:!text-zinc-100",
  "dark:[&.ant-input]:placeholder:!text-zinc-500",
  "dark:[&.ant-input-affix-wrapper]:!border-zinc-700",
  "dark:[&.ant-input-affix-wrapper]:!bg-zinc-950",
  "dark:[&.ant-input-affix-wrapper:hover]:!border-zinc-600",
  "dark:focus-within:[&.ant-input-affix-wrapper]:!border-zinc-500",
].join(" ");

const textareaClassName = [
  "[&.ant-input]:!h-auto",
  "[&.ant-input]:!min-h-[6rem]",
  "[&.ant-input]:!max-h-none",
  "[&.ant-input]:!resize-y",
  "[&.ant-input]:!rounded-xl",
  "[&.ant-input]:!border-zinc-200",
  "[&.ant-input]:!bg-white",
  "[&.ant-input]:!px-4",
  "[&.ant-input]:!py-3",
  "[&.ant-input]:!text-sm",
  "[&.ant-input]:!leading-relaxed",
  "[&.ant-input]:!text-zinc-900",
  "[&.ant-input]:!shadow-none",
  "[&.ant-input]:placeholder:!text-zinc-400",
  "[&.ant-input:hover]:!border-zinc-300",
  "[&.ant-input:focus]:!border-zinc-400",
  "[&.ant-input:focus]:!shadow-none",
  "dark:[&.ant-input]:!border-zinc-700",
  "dark:[&.ant-input]:!bg-zinc-950",
  "dark:[&.ant-input]:!text-zinc-100",
  "dark:[&.ant-input]:placeholder:!text-zinc-500",
  "dark:[&.ant-input:hover]:!border-zinc-600",
  "dark:[&.ant-input:focus]:!border-zinc-500",
].join(" ");

/** Native `<input>` / `<textarea>` — same look when not using Ant Design. */
export const nativeInputClassName =
  "w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 shadow-none outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-400 focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:hover:border-zinc-600 dark:focus:border-zinc-500";

/** @deprecated Use {@link FormInput} or {@link nativeInputClassName}. */
export const formModalInputClass = nativeInputClassName;

/** @deprecated Use {@link FormInput} — kept for gradual migration. */
export const authFieldClassName = formFieldClassName;

export type FormInputProps = InputProps & {
  /**
   * “?” in a circle on the right (reference design).
   * Pass tooltip text, or `true` for the icon only.
   */
  help?: ReactNode | boolean;
};

/** Circular ? affordance — matches login / email reference fields. */
export function FieldHelpIcon({ title }: { title?: ReactNode }) {
  const label =
    typeof title === "string" && title.trim()
      ? title.trim()
      : "More information";

  const icon = (
    <span
      className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-white text-[11px] font-medium leading-none text-zinc-400"
      aria-hidden
    >
      ?
    </span>
  );

  const button = (
    <button
      type="button"
      tabIndex={-1}
      className="inline-flex shrink-0 items-center justify-center rounded-full hover:[&_span]:border-zinc-400 hover:[&_span]:text-zinc-600 dark:hover:[&_span]:border-zinc-500 dark:hover:[&_span]:text-zinc-300"
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
    >
      {icon}
    </button>
  );

  const showTooltip =
    title !== undefined &&
    title !== null &&
    title !== false &&
    title !== true &&
    (typeof title !== "string" || title.trim().length > 0);

  if (!showTooltip) {
    return button;
  }

  return (
    <Tooltip title={title} placement="top">
      {button}
    </Tooltip>
  );
}

function mergeSuffix(suffix: InputProps["suffix"], help?: ReactNode | boolean) {
  if (help === undefined || help === null || help === false) return suffix;
  const tooltip = help === true ? undefined : help;
  return (
    <span className="flex items-center gap-1.5">
      {suffix}
      <FieldHelpIcon title={tooltip} />
    </span>
  );
}

export const FormInput = forwardRef<InputRef, FormInputProps>(function FormInput(
  { className, help, suffix, ...props },
  ref,
) {
  return (
    <Input
      ref={ref}
      className={cn("w-full", formFieldClassName, className)}
      suffix={mergeSuffix(suffix, help)}
      {...props}
    />
  );
});

export type ContactNumberInputProps = Omit<FormInputProps, "type" | "inputMode">;

/** Phone/contact fields — digits and symbols only; letters are stripped on input. */
export const ContactNumberInput = forwardRef<InputRef, ContactNumberInputProps>(
  function ContactNumberInput({ onChange, autoComplete = "tel", ...props }, ref) {
    function handleChange(e: ChangeEvent<HTMLInputElement>) {
      const sanitized = sanitizeContactNumberInput(e.target.value);
      if (sanitized !== e.target.value) {
        e.target.value = sanitized;
      }
      onChange?.(e);
    }

    return (
      <FormInput
        ref={ref}
        type="tel"
        inputMode="tel"
        autoComplete={autoComplete}
        onChange={handleChange}
        {...props}
      />
    );
  },
);

export type FormPasswordInputProps = InputProps & { help?: ReactNode | boolean };

export function FormPasswordInput({ className, help, suffix, ...props }: FormPasswordInputProps) {
  return (
    <Input.Password
      className={cn("w-full", formFieldClassName, className)}
      suffix={mergeSuffix(suffix, help)}
      {...props}
    />
  );
}

export const FormTextArea = forwardRef<TextAreaRef, TextAreaProps>(function FormTextArea(
  { className, ...props },
  ref,
) {
  return (
    <Input.TextArea
      ref={ref}
      className={cn("w-full", textareaClassName, className)}
      {...props}
    />
  );
});

/** @deprecated Alias of {@link FormInput} — auth and app fields share one style. */
export function AuthFormInput(props: FormInputProps) {
  return <FormInput {...props} />;
}

/** @deprecated Alias of {@link FormPasswordInput}. */
export function AuthFormPasswordInput(props: FormPasswordInputProps) {
  return <FormPasswordInput {...props} />;
}

/** Search fields — same border/radius; room for a leading icon in the affix wrapper. */
export const dashboardSearchFieldClassName = [
  formFieldClassName,
  "[&_.ant-input-affix-wrapper]:!pl-3",
  "[&_.ant-input]:!pl-1",
].join(" ");

/** Header search — nested input inside the pill shell (reference: rounded-lg, light border). */
export const dashboardHeaderSearchFieldClassName = [
  "[&.ant-input-affix-wrapper]:!min-h-10",
  "[&.ant-input-affix-wrapper]:!rounded-lg",
  "[&.ant-input-affix-wrapper]:!border-zinc-200/90",
  "[&.ant-input-affix-wrapper]:!bg-white",
  "[&.ant-input-affix-wrapper]:!px-3.5",
  "[&.ant-input-affix-wrapper]:!py-1.5",
  "[&.ant-input-affix-wrapper]:!shadow-none",
  "[&_.ant-input]:!h-8",
  "[&_.ant-input]:!rounded-none",
  "[&_.ant-input]:!border-0",
  "[&_.ant-input]:!bg-transparent",
  "[&_.ant-input]:!px-0",
  "[&_.ant-input]:!text-sm",
  "[&_.ant-input]:!shadow-none",
  "[&_.ant-input]:placeholder:!text-zinc-400",
  "[&.ant-input-affix-wrapper:hover]:!border-zinc-300",
  "focus-within:[&.ant-input-affix-wrapper]:!border-zinc-400",
  "focus-within:[&.ant-input-affix-wrapper]:!shadow-none",
  "[&_.ant-input-prefix]:!me-2.5",
  "[&_.ant-input-prefix]:!text-zinc-400",
  "dark:[&.ant-input-affix-wrapper]:!border-zinc-700",
  "dark:[&.ant-input-affix-wrapper]:!bg-zinc-900/60",
  "dark:[&.ant-input-affix-wrapper:hover]:!border-zinc-600",
  "dark:focus-within:[&.ant-input-affix-wrapper]:!border-zinc-500",
  "dark:[&_.ant-input]:placeholder:!text-zinc-500",
].join(" ");

export type FormSearchInputProps = InputProps & {
  search?: boolean;
  help?: ReactNode | boolean;
};

export const FormSearchInput = forwardRef<InputRef, FormSearchInputProps>(
  function FormSearchInput({ className, search = true, type, help, suffix, ...props }, ref) {
    return (
      <Input
        ref={ref}
        type={search ? "search" : type}
        className={cn("w-full", dashboardSearchFieldClassName, className)}
        suffix={mergeSuffix(suffix, help)}
        {...props}
      />
    );
  },
);
