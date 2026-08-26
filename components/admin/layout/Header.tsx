"use client";

import { usePathname } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
import { useAdminAuth } from "@/lib/admin/use-admin-auth";

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/photographers": "Photographers",
  "/admin/galleries": "Galleries",
  "/admin/moderation": "Moderation",
  "/admin/trash": "Trash",
  "/admin/crm": "CRM",
  "/admin/crm/bookings": "Bookings",
  "/admin/billing": "Billing",
  "/admin/billing/events": "Billing events",
  "/admin/support": "Support",
  "/admin/communications": "Communications",
};

function getPageTitle(pathname: string): string {
  if (pathname.startsWith("/admin/photographers/")) return "Photographer details";
  if (pathname.startsWith("/admin/galleries/")) return "Gallery details";
  if (pathname.startsWith("/admin/crm/studios/")) return "Studio CRM";
  return PAGE_TITLES[pathname] ?? "Admin";
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
            <div className="h-8 w-8 shrink-0 overflow-hidden rounded-md bg-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/user-profile.png"
                alt=""
                className="h-full w-full object-cover"
              />
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
