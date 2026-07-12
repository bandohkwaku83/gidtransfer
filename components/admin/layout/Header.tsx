"use client";

import { usePathname } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
import { useAdminAuth } from "@/lib/admin/use-admin-auth";

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/photographers": "Photographers",
  "/admin/support": "Support",
  "/admin/communications": "Communications",
  "/admin/sms/sender-ids": "SMS Approvals",
};

function getPageTitle(pathname: string): string {
  if (pathname.startsWith("/admin/photographers/")) return "Photographer details";
  return PAGE_TITLES[pathname] ?? "Admin";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Header() {
  const pathname = usePathname();
  const { admin, logout } = useAdminAuth();
  const title = getPageTitle(pathname);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/70 bg-white px-6 lg:px-8">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
        </button>

        {admin && (
          <div className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50/80 py-1.5 pr-3 pl-1.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-white">
              {getInitials(admin.name)}
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-medium text-slate-900">
                {admin.name}
              </p>
              <p className="truncate text-[11px] text-slate-400">
                {admin.email}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
          aria-label="Logout"
          title="Logout"
        >
          <LogOut className="h-[18px] w-[18px]" />
        </button>
      </div>
    </header>
  );
}
