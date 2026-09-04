"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  FolderOpen,
  MessageSquare,
  Plus,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Skeleton } from "antd";
import { PRODUCT_TAGLINE } from "@/lib/branding";
import type { DashboardStatItem } from "@/components/dashboard/dashboard-stat-strip";
import { cn } from "@/lib/utils";

type QuickNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const QUICK_NAV: QuickNavItem[] = [
  { href: "/dashboard/galleries", label: "Galleries", icon: FolderOpen },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/schedules", label: "Bookings", icon: CalendarDays },
  { href: "/dashboard/income", label: "Income", icon: Wallet },
  { href: "/dashboard/sms", label: "SMS", icon: MessageSquare },
];

type DashboardWelcomePanelProps = {
  greeting: string;
  todayLabel: string;
  onNewGallery: () => void;
  onAddClient: () => void;
  statItems: DashboardStatItem[];
  statsLoading?: boolean;
};

function formatHeroDate(todayLabel: string): string {
  const match = todayLabel.match(/^(\w+),\s+(\w+)\s+(\d+)/);
  if (match) {
    const [, weekday, month, day] = match;
    return `${weekday.toUpperCase()} ${day} ${month.toUpperCase()}`;
  }
  return todayLabel.replace(/,/g, "").toUpperCase();
}

function isQuickNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard/galleries") {
    return (
      (pathname.startsWith("/dashboard/galleries") && !pathname.startsWith("/dashboard/galleries/trash")) ||
      pathname.startsWith("/dashboard/folder")
    );
  }
  return pathname.startsWith(href);
}

export function DashboardWelcomePanel({
  greeting,
  todayLabel,
  onNewGallery,
  onAddClient,
  statItems,
  statsLoading,
}: DashboardWelcomePanelProps) {
  const pathname = usePathname();

  return (
    <section className="dashboard-hero">
      <DashboardHeroRings aria-hidden />

      <div className="dashboard-hero-inner">
        <p className="dashboard-hero-date">
          <span className="dashboard-hero-date-line" aria-hidden />
          {formatHeroDate(todayLabel)}
        </p>

        <h1 className="dashboard-hero-title">
          Hi, <em className="dashboard-hero-name">{greeting}</em>
        </h1>

        <p className="dashboard-hero-tagline">
          {PRODUCT_TAGLINE} — bookings, selections, and delivery in one place.
        </p>

        <div className="dashboard-hero-actions">
          <button type="button" onClick={onNewGallery} className="dashboard-hero-action">
            <Plus className="h-3.5 w-3.5" aria-hidden />
            New gallery
          </button>
          <button type="button" onClick={onAddClient} className="dashboard-hero-action">
            <UserPlus className="h-3.5 w-3.5" aria-hidden />
            Add client
          </button>
        </div>

        <div className="dashboard-hero-stats" aria-label="Workspace overview">
          {statItems.map((item, index) => (
            <Fragment key={item.label}>
              {index > 0 ? <span className="dashboard-hero-stats-divider" aria-hidden /> : null}
              <Link href={item.href} className="dashboard-hero-stats-cell group">
                {statsLoading ? (
                  <span className="inline-block [&_.ant-skeleton-title]:!rounded [&_.ant-skeleton-title]:!bg-white/10" aria-hidden>
                    <Skeleton active title={{ width: 40, style: { height: 32, margin: 0 } }} paragraph={false} />
                  </span>
                ) : (
                  <span className="dashboard-hero-stats-value">{item.value}</span>
                )}
                <span className="dashboard-hero-stats-label">{item.label}</span>
                <span className="dashboard-hero-stats-hint">{item.hint}</span>
              </Link>
            </Fragment>
          ))}
        </div>

        <nav className="dashboard-hero-nav" aria-label="Quick navigation">
          {QUICK_NAV.map((item) => (
            <QuickNavItem
              key={item.href}
              item={item}
              active={isQuickNavActive(pathname, item.href)}
            />
          ))}
        </nav>
      </div>
    </section>
  );
}

function QuickNavItem({ item, active }: { item: QuickNavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn("dashboard-hero-nav-item", active && "dashboard-hero-nav-item--active")}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="h-[15px] w-[15px]" strokeWidth={1.75} aria-hidden />
      <span>{item.label}</span>
    </Link>
  );
}

function DashboardHeroRings({ className }: { className?: string }) {
  return (
    <svg
      className={cn("dashboard-hero-rings", className)}
      viewBox="0 0 280 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="200" cy="80" r="118" stroke="currentColor" strokeWidth="0.75" opacity="0.35" />
      <circle cx="200" cy="80" r="88" stroke="currentColor" strokeWidth="0.75" opacity="0.28" />
      <circle cx="200" cy="80" r="58" stroke="currentColor" strokeWidth="0.75" opacity="0.22" />
      <circle cx="200" cy="80" r="28" stroke="currentColor" strokeWidth="0.75" opacity="0.16" />
    </svg>
  );
}
