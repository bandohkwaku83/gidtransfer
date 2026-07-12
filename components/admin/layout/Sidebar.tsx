"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Camera,
  LifeBuoy,
  MessageSquare,
  Smartphone,
} from "lucide-react";
import { useAdminAuth } from "@/lib/admin/use-admin-auth";
import { Logo } from "@/components/admin/ui/Logo";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, badgeKey: null },
  {
    label: "Photographers",
    href: "/admin/photographers",
    icon: Camera,
    badgeKey: null,
  },
  {
    label: "Support",
    href: "/admin/support",
    icon: LifeBuoy,
    badgeKey: "support" as const,
  },
  {
    label: "Communications",
    href: "/admin/communications",
    icon: MessageSquare,
    badgeKey: null,
  },
  {
    label: "SMS approvals",
    href: "/admin/sms/sender-ids",
    icon: Smartphone,
    badgeKey: "sms" as const,
  },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Sidebar({
  badges,
}: {
  badges?: { support?: number; sms?: number };
}) {
  const pathname = usePathname();
  const { admin } = useAdminAuth();

  return (
    <aside className="flex w-[248px] shrink-0 flex-col border-r border-slate-200/70 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
        <Logo height={32} />
        <div>
          <p className="text-sm font-semibold leading-tight text-slate-900">
            GidTransfer
          </p>
          <p className="text-[11px] font-medium text-slate-400">Admin</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-5">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          const badge =
            item.badgeKey === "support"
              ? badges?.support
              : item.badgeKey === "sms"
                ? badges?.sms
                : undefined;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors ${
                active ? "bg-primary-light/50" : "hover:bg-slate-50"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  active
                    ? "bg-primary text-white"
                    : "text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600"
                }`}
              >
                <item.icon className="h-[18px] w-[18px]" />
              </span>
              <span
                className={`flex-1 text-sm ${
                  active
                    ? "font-semibold text-slate-900"
                    : "font-medium text-slate-600 group-hover:text-slate-900"
                }`}
              >
                {item.label}
              </span>
              {badge != null && badge > 0 && (
                <span className="min-w-[1.25rem] rounded-md bg-primary-muted px-1.5 py-0.5 text-center text-[11px] font-bold text-primary">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      {admin && (
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">
              {getInitials(admin.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">
                {admin.name}
              </p>
              <p className="truncate text-xs text-slate-400">{admin.email}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
