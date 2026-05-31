"use client";

import { Input } from "antd";
import type { InputRef, InputProps, TextAreaProps } from "antd/es/input";
import type { TextAreaRef } from "antd/es/input/TextArea";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/** Shared Ant Design input surface for dashboard forms, modals, and pages. */
export const formFieldClassName =
  "[&.ant-input]:!rounded-lg [&.ant-input]:!border-zinc-200 [&.ant-input]:!bg-white [&.ant-input]:!text-sm [&.ant-input]:!text-zinc-900 [&.ant-input]:!shadow-sm [&.ant-input]:placeholder:!text-zinc-400 [&.ant-input-affix-wrapper]:!rounded-lg [&.ant-input-affix-wrapper]:!border-zinc-200 [&.ant-input-affix-wrapper]:!bg-white [&.ant-input-affix-wrapper]:!py-2 [&.ant-input-affix-wrapper]:!shadow-sm dark:[&.ant-input]:!border-zinc-700 dark:[&.ant-input]:!bg-zinc-950 dark:[&.ant-input]:!text-zinc-100 dark:[&.ant-input]:placeholder:!text-zinc-500 dark:[&.ant-input-affix-wrapper]:!border-zinc-700 dark:[&.ant-input-affix-wrapper]:!bg-zinc-950";

const textareaClassName =
  "[&.ant-input]:!min-h-[5rem] [&.ant-input]:!resize-y dark:[&.ant-input]:!border-zinc-700 dark:[&.ant-input]:!bg-zinc-950";

/** @deprecated Use {@link FormInput} — kept for gradual migration. */
export const formModalInputClass = formFieldClassName;

export const FormInput = forwardRef<InputRef, InputProps>(function FormInput(
  { className, ...props },
  ref,
) {
  return (
    <Input ref={ref} className={cn("w-full", formFieldClassName, className)} {...props} />
  );
});

export function FormPasswordInput({ className, ...props }: InputProps) {
  return (
    <Input.Password
      className={cn("w-full", formFieldClassName, className)}
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
      className={cn("w-full", formFieldClassName, textareaClassName, className)}
      {...props}
    />
  );
});

export type FormSearchInputProps = InputProps & {
  /** Render as `type="search"` (default true). */
  search?: boolean;
};

/** Rounded fields for login, onboarding, and reset-password pages. */
export const authFieldClassName =
  "[&.ant-input]:!rounded-2xl [&_.ant-input]:!border-slate-200 [&_.ant-input]:!bg-white [&_.ant-input]:!px-4 [&_.ant-input]:!py-3 [&_.ant-input]:!text-sm [&_.ant-input]:placeholder:!text-slate-400 [&_.ant-input-affix-wrapper]:!rounded-2xl [&_.ant-input-affix-wrapper]:!border-slate-200 [&_.ant-input-affix-wrapper]:!bg-white [&_.ant-input-affix-wrapper]:!px-4 [&_.ant-input-affix-wrapper]:!py-1 focus-within:[&_.ant-input-affix-wrapper]:!border-teal-700 focus-within:[&_.ant-input-affix-wrapper]:!shadow-[0_0_0_2px_rgba(15,118,110,0.2)]";

export function AuthFormInput({ className, ...props }: InputProps) {
  return <FormInput className={cn(authFieldClassName, className)} {...props} />;
}

export function AuthFormPasswordInput({ className, ...props }: InputProps) {
  return <FormPasswordInput className={cn(authFieldClassName, className)} {...props} />;
}

/** Pill-shaped search fields in dashboard chrome and list pages. */
export const dashboardSearchFieldClassName =
  "[&_.ant-input-affix-wrapper]:!rounded-full [&_.ant-input-affix-wrapper]:!border-zinc-200/90 [&_.ant-input-affix-wrapper]:!bg-zinc-50 [&_.ant-input-affix-wrapper]:!py-2.5 [&_.ant-input-affix-wrapper]:!pl-3 [&_.ant-input-affix-wrapper]:!pr-4 dark:[&_.ant-input-affix-wrapper]:!border-zinc-700 dark:[&_.ant-input-affix-wrapper]:!bg-zinc-900/75 focus-within:[&_.ant-input-affix-wrapper]:!border-brand focus-within:[&_.ant-input-affix-wrapper]:!bg-white focus-within:[&_.ant-input-affix-wrapper]:!shadow-[0_0_0_2px] focus-within:[&_.ant-input-affix-wrapper]:!shadow-brand/20 dark:focus-within:[&_.ant-input-affix-wrapper]:!border-brand-on-dark dark:focus-within:[&_.ant-input-affix-wrapper]:!bg-zinc-950";

export const FormSearchInput = forwardRef<InputRef, FormSearchInputProps>(
  function FormSearchInput({ className, search = true, type, ...props }, ref) {
    return (
      <Input
        ref={ref}
        type={search ? "search" : type}
        className={cn("w-full", formFieldClassName, className)}
        {...props}
      />
    );
  },
);
