"use client";

import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CalendarDays,
  FolderOpen,
  MessageSquare,
  Plus,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { PRODUCT_TAGLINE } from "@/lib/branding";
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
  { href: "/dashboard/sms", label: "SMS", icon: MessageSquare },
];

type DashboardWelcomePanelProps = {
  greeting: string;
  todayLabel: string;
  onNewGallery: () => void;
  onAddClient: () => void;
};

export function DashboardWelcomePanel({
  greeting,
  todayLabel,
  onNewGallery,
  onAddClient,
}: DashboardWelcomePanelProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-950 via-indigo-950/90 to-slate-900 shadow-lg shadow-slate-900/25">
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-brand/20 blur-3xl"
        aria-hidden
      />

      <div className="relative grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.9fr)] lg:items-center lg:gap-6 2xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] 2xl:gap-8 2xl:p-8">
        <div className="min-w-0 text-center lg:text-left">
          <div className="inline-flex items-center justify-center gap-1.5 self-center rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm lg:self-start">
            <Calendar className="h-3 w-3 shrink-0 text-white/80" aria-hidden />
            <span>{todayLabel}</span>
          </div>

          <h1 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Hi, {greeting}
          </h1>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-400 lg:mx-0">
            {PRODUCT_TAGLINE}. Manage bookings, galleries, and delivery in one place.
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-2.5 lg:justify-start">
            <button
              type="button"
              onClick={onNewGallery}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand/50 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              <Plus className="h-4 w-4" aria-hidden />
              New gallery
            </button>
            <button
              type="button"
              onClick={onAddClient}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/5 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <UserPlus className="h-4 w-4" aria-hidden />
              Add client
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-2.5 backdrop-blur-sm sm:gap-2.5 sm:p-3">
          {QUICK_NAV.map((item) => (
            <QuickNavTile key={item.href} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function QuickNavTile({ item }: { item: QuickNavItem }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 transition",
        "hover:border-white/20 hover:bg-white/10",
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/90 transition group-hover:bg-brand/30">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 text-sm font-semibold text-white">{item.label}</span>
      <ArrowRight
        className="h-3 w-3 shrink-0 text-white/25 transition group-hover:translate-x-0.5 group-hover:text-white/60"
        aria-hidden
      />
    </Link>
  );
}
