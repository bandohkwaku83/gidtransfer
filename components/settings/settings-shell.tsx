"use client";

import type { ReactNode } from "react";

type SettingsShellProps = {
  children: ReactNode;
  /** Extra content above panel body (e.g. account meta on Profile). */
  headerExtra?: ReactNode;
};

export function SettingsShell({ children, headerExtra }: SettingsShellProps) {
  return (
    <div className="min-w-0">
      <div className="dashboard-panel !p-0 overflow-hidden">
        <div className="px-5 py-5 sm:px-6 sm:py-6">
          {headerExtra ? <div className="mb-5">{headerExtra}</div> : null}
          {children}
        </div>
      </div>
    </div>
  );
}
