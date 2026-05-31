"use client";

import type { ReactNode } from "react";
import { SETTINGS_TABS, type SettingsTabId } from "@/lib/settings-tabs";
import { cn } from "@/lib/utils";

type SettingsShellProps = {
  activeTab: SettingsTabId;
  onTabChange: (tab: SettingsTabId) => void;
  children: ReactNode;
};

export function SettingsShell({ activeTab, onTabChange, children }: SettingsShellProps) {
  const meta = SETTINGS_TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8 2xl:gap-10">
      <aside className="lg:w-[220px] lg:shrink-0 2xl:w-[260px]">
        <nav
          aria-label="Settings sections"
          className="flex gap-1 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] lg:flex-col lg:overflow-visible lg:pb-0"
        >
          {SETTINGS_TABS.map(({ id, label, icon: Icon }) => {
            const active = id === activeTab;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange(id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-w-[max-content] shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition lg:w-full",
                  active
                    ? "bg-brand text-white shadow-md shadow-brand/25"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
                )}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                <span className="whitespace-nowrap">{label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="border-b border-zinc-100 bg-gradient-to-br from-zinc-50 to-white px-5 py-4 dark:border-zinc-800 dark:from-zinc-900/60 dark:to-zinc-950 sm:px-6 sm:py-5">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {meta.label}
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{meta.description}</p>
          </div>
          <div className="px-5 py-5 sm:px-6 sm:py-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
