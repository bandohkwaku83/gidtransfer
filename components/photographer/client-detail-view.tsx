"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Camera,
  CheckCircle2,
  Heart,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import {
  dashboardPageHeaderCtaClassName,
  dashboardPageHeaderCtaSecondaryClassName,
} from "@/components/dashboard/dashboard-page-header";
import { cn } from "@/lib/utils";

/** Frontend-only demo payload — swap for API later. */
const DEMO = {
  name: "Amara Okonkwo",
  email: "amara@atelierokonkwo.com",
  phone: "+234 803 441 2290",
  location: "Lagos · Ikoyi",
  since: "Mar 2024",
  stats: [
    { label: "Galleries", value: "4" },
    { label: "Bookings", value: "6" },
  ],
  nextShoot: {
    title: "Engagement — Lekki Conservation",
    weekday: "Sat",
    day: "26",
    month: "Jul",
    time: "4:30 PM",
    place: "Lekki Conservation Centre",
  },
  galleries: [
    {
      id: "g1",
      title: "Traditional ceremony",
      status: "Selecting",
      photos: 186,
      hearts: 42,
      tone: "from-[#3d1524] via-[#6b2a3a] to-[#c4a484]",
    },
    {
      id: "g2",
      title: "White wedding",
      status: "Delivered",
      photos: 240,
      hearts: 0,
      tone: "from-[#1c2430] via-[#4a5568] to-[#d6d3d1]",
    },
    {
      id: "g3",
      title: "Pre-wedding portraits",
      status: "Finals ready",
      photos: 64,
      hearts: 12,
      tone: "from-[#2a1f18] via-[#8b5e3c] to-[#e8d5b7]",
    },
    {
      id: "g4",
      title: "Family brunch",
      status: "Uploading",
      photos: 28,
      hearts: 0,
      tone: "from-[#1a2e28] via-[#3d5c54] to-[#b8c9c0]",
    },
  ],
  activity: [
    {
      id: "a1",
      title: "Submitted 42 selections",
      detail: "Traditional ceremony · Originals",
      when: "2 days ago",
      kind: "selection" as const,
    },
    {
      id: "a2",
      title: "Deposit received",
      detail: "₦450,000 · Engagement shoot",
      when: "5 days ago",
      kind: "paid" as const,
    },
    {
      id: "a3",
      title: "Gallery opened",
      detail: "White wedding · 14 views",
      when: "1 week ago",
      kind: "view" as const,
    },
    {
      id: "a4",
      title: "Booking confirmed",
      detail: "Engagement — Lekki Conservation",
      when: "2 weeks ago",
      kind: "booked" as const,
    },
  ],
  payments: [
    { label: "White wedding package", amount: "₦1,200,000", status: "Paid" as const },
    { label: "Engagement deposit", amount: "₦450,000", status: "Paid" as const },
    { label: "Album add-on", amount: "₦280,000", status: "Pending" as const },
  ],
  paymentSummary: {
    collected: "₦1,650,000",
  },
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function statusTone(status: string) {
  const s = status.toLowerCase();
  if (s.includes("deliver") || s.includes("paid") || s.includes("confirm") || s.includes("ready")) {
    return "bg-emerald-50 text-emerald-800 ring-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800/60";
  }
  if (s.includes("select") || s.includes("pending")) {
    return "bg-amber-50 text-amber-900 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-100 dark:ring-amber-800/60";
  }
  if (s.includes("upload")) {
    return "bg-sky-50 text-sky-900 ring-sky-200/80 dark:bg-sky-950/40 dark:text-sky-100 dark:ring-sky-800/60";
  }
  return "bg-zinc-100 text-zinc-700 ring-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700";
}

function activityIcon(kind: (typeof DEMO.activity)[number]["kind"]) {
  switch (kind) {
    case "selection":
      return Heart;
    case "paid":
      return CheckCircle2;
    case "view":
      return Camera;
    case "booked":
      return Calendar;
  }
}

export function ClientDetailView({ clientId }: { clientId: string }) {
  void clientId;
  const client = DEMO;
  const mono = initials(client.name);

  return (
    <div className="dashboard-page space-y-6">
      {/* Identity header */}
      <section className="dashboard-page-header overflow-hidden">
        <div className="dashboard-page-header-glow" aria-hidden />
        <div
          className="pointer-events-none absolute -left-16 bottom-0 font-display text-[11rem] leading-none tracking-tighter text-brand/[0.06] select-none sm:text-[14rem] dark:text-white/[0.04]"
          aria-hidden
        >
          {mono}
        </div>

        <div className="dashboard-page-header-inner relative space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/dashboard/clients"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 transition hover:text-brand dark:text-zinc-400 dark:hover:text-brand-on-dark"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              Clients
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className={dashboardPageHeaderCtaSecondaryClassName()}>
                Message
              </button>
              <button type="button" className={dashboardPageHeaderCtaClassName()}>
                Book shoot
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
            <div className="flex min-w-0 items-start gap-4 sm:gap-5">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-zinc-200 shadow-sm sm:h-[4.5rem] sm:w-[4.5rem] dark:bg-zinc-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/user-profile.png"
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand dark:text-brand-on-dark">
                  Client · since {client.since}
                </p>
                <h1 className="mt-1.5 font-display text-[2rem] font-semibold leading-[1.05] tracking-tight text-zinc-900 sm:text-[2.5rem] dark:text-zinc-50">
                  {client.name}
                </h1>
                <dl className="mt-3 flex flex-col gap-1.5 text-sm text-zinc-600 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1 dark:text-zinc-400">
                  <div className="inline-flex min-w-0 items-center gap-2">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-brand/55 dark:text-brand-on-dark/70" aria-hidden />
                    <dt className="sr-only">Email</dt>
                    <dd className="truncate">{client.email}</dd>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-brand/55 dark:text-brand-on-dark/70" aria-hidden />
                    <dt className="sr-only">Phone</dt>
                    <dd>{client.phone}</dd>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-brand/55 dark:text-brand-on-dark/70" aria-hidden />
                    <dt className="sr-only">Location</dt>
                    <dd>{client.location}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="flex shrink-0 gap-8 border-t border-zinc-200/80 pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-8 dark:border-zinc-700/80">
              {client.stats.map((stat) => (
                <div key={stat.label} className="min-w-[4.5rem]">
                  <p className="font-display text-[1.85rem] leading-none tabular-nums tracking-tight text-brand-ink dark:text-zinc-50">
                    {stat.value}
                  </p>
                  <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Next shoot + payments */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950">
        <div className="grid lg:grid-cols-2">
          <section className="relative flex items-center gap-4 border-b border-zinc-100 p-4 sm:gap-5 sm:p-5 lg:border-b-0 lg:border-r dark:border-zinc-800">
            <div className="flex shrink-0 items-end gap-2">
              <p className="font-display text-[2.75rem] leading-none tracking-tight text-brand-ink dark:text-white">
                {client.nextShoot.day}
              </p>
              <div className="mb-0.5 space-y-0.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-800 dark:text-zinc-200">
                  {client.nextShoot.month}
                </p>
                <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-400">
                  {client.nextShoot.weekday}
                </p>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand dark:text-brand-on-dark">
                Up next
              </p>
              <h2 className="mt-1 truncate font-display text-lg leading-snug tracking-tight text-zinc-900 dark:text-zinc-50">
                {client.nextShoot.title}
              </h2>
              <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
                {client.nextShoot.time}
                <span className="mx-1.5 text-zinc-300 dark:text-zinc-600" aria-hidden>
                  ·
                </span>
                {client.nextShoot.place}
              </p>
            </div>

            <Link
              href="/dashboard/schedules"
              className={dashboardPageHeaderCtaClassName("!rounded-lg !px-3 !py-2 text-xs shrink-0")}
              aria-label="Open schedule"
            >
              Schedule
            </Link>
          </section>

          <section className="flex flex-col justify-center p-4 sm:p-5">
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex min-w-0 items-baseline gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand dark:text-brand-on-dark">
                  Payments
                </p>
                <p className="font-display text-lg tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
                  {client.paymentSummary.collected}
                </p>
              </div>
              <Link
                href="/dashboard/income"
                className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-zinc-500 transition hover:text-brand dark:text-zinc-400 dark:hover:text-brand-on-dark"
              >
                Ledger
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>

            <ul className="mt-3 space-y-0 border-t border-zinc-100 dark:border-zinc-800">
              {client.payments.map((row) => {
                const pending = row.status === "Pending";
                return (
                  <li
                    key={row.label}
                    className="flex items-center justify-between gap-3 border-b border-zinc-100 py-2 last:border-b-0 dark:border-zinc-800"
                  >
                    <p className="min-w-0 truncate text-sm text-zinc-700 dark:text-zinc-300">
                      {row.label}
                      <span
                        className={cn(
                          "ml-2 text-[11px] font-medium",
                          pending
                            ? "text-amber-700 dark:text-amber-300"
                            : "text-emerald-700 dark:text-emerald-300",
                        )}
                      >
                        {row.status}
                      </span>
                    </p>
                    <p className="shrink-0 text-sm font-medium tabular-nums text-zinc-900 dark:text-zinc-50">
                      {row.amount}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>

      {/* Galleries film strip */}
      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-[1.5rem] font-semibold tracking-tight text-zinc-900 sm:text-[1.75rem] dark:text-zinc-50">
              Galleries
            </h2>
            <p className="mt-1 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
              Shared work for this client — status, heart counts, and delivery.
            </p>
          </div>
          <Link href="/dashboard/galleries" className={dashboardPageHeaderCtaSecondaryClassName()}>
            View all galleries
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {client.galleries.map((g) => (
            <article
              key={g.id}
              className="group overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div
                className={cn(
                  "relative aspect-[5/3] bg-gradient-to-br",
                  g.tone,
                )}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_45%)]" />
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset backdrop-blur-sm",
                      statusTone(g.status),
                    )}
                  >
                    {g.status}
                  </span>
                  <span className="rounded-md bg-black/35 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                    {g.photos} photos
                  </span>
                </div>
              </div>
              <div className="border-t border-zinc-100 p-3.5 dark:border-zinc-800/80">
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {g.title}
                </p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  <Heart className="h-3 w-3 text-brand/70" aria-hidden />
                  {g.hearts > 0 ? `${g.hearts} hearts` : "No selections yet"}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Activity */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
        <h2 className="font-display text-xl tracking-tight text-zinc-900 dark:text-zinc-50">
          Recent activity
        </h2>
        <ol className="mt-5 space-y-0">
          {client.activity.map((item, i) => {
            const Icon = activityIcon(item.kind);
            const isLast = i === client.activity.length - 1;
            return (
              <li key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
                {!isLast ? (
                  <span
                    className="absolute left-[15px] top-8 bottom-0 w-px bg-zinc-200 dark:bg-zinc-800"
                    aria-hidden
                  />
                ) : null}
                <span className="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand/15 bg-brand-soft text-brand dark:border-brand/30 dark:bg-brand/15 dark:text-brand-on-dark">
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.title}
                    </p>
                    <time className="text-[11px] font-medium tabular-nums text-zinc-400">
                      {item.when}
                    </time>
                  </div>
                  <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{item.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
