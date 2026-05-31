"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SettingsToggle({
  checked,
  onChange,
  disabled,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
  hint: string;
}) {
  return (
    <label
      className={cn(
        "flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3.5 dark:border-zinc-800 dark:bg-zinc-900/40",
        disabled && "opacity-60",
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{hint}</p>
      </div>
      <button
        type="button"
        aria-pressed={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition",
          checked ? "bg-brand" : "bg-zinc-300 dark:bg-zinc-700",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition",
            checked ? "left-[25px]" : "left-0.5",
          )}
        />
      </button>
    </label>
  );
}

export function SettingsFaq({
  summary,
  children,
}: {
  summary: string;
  children: ReactNode;
}) {
  return (
    <details className="group rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/30">
      <summary className="cursor-pointer list-none text-sm font-medium text-zinc-900 marker:hidden dark:text-zinc-100">
        <span className="flex items-center justify-between gap-2">
          {summary}
          <span
            className="text-zinc-400 transition group-open:rotate-180 dark:text-zinc-500"
            aria-hidden
          >
            ▼
          </span>
        </span>
      </summary>
      <div className="mt-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">{children}</div>
    </details>
  );
}

export function SettingsInfoCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 text-xs leading-relaxed text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
      {children}
    </div>
  );
}
