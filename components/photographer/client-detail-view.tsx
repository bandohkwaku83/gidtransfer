"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Camera,
  CheckCircle2,
  Clock3,
  Heart,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Sparkles,
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
  tags: ["Wedding", "VIP", "Prefers WhatsApp"],
  note: "Loves soft natural light and film-leaning grades. Finals go to her planner first, then the couple.",
  stats: [
    { label: "Galleries", value: "4" },
    { label: "Bookings", value: "6" },
    { label: "Lifetime", value: "₦2.4M" },
    { label: "Hearts left", value: "18" },
  ],
  nextShoot: {
    title: "Engagement — Lekki Conservation",
    when: "Sat · 26 Jul · 4:30 PM",
    status: "Confirmed",
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
    { label: "White wedding package", amount: "₦1,200,000", status: "Paid" },
    { label: "Engagement deposit", amount: "₦450,000", status: "Paid" },
    { label: "Album add-on", amount: "₦280,000", status: "Pending" },
  ],
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
  const client = DEMO;
  const mono = initials(client.name);

  return (
    <div className="dashboard-page space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard/clients"
          className={cn(
            dashboardPageHeaderCtaSecondaryClassName(),
            "gap-2 !px-3 !py-2 text-xs",
          )}
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          All clients
        </Link>
        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
          Demo profile · {clientId.slice(0, 8)}
        </span>
      </div>

      {/* Identity composition */}
      <section className="relative overflow-hidden rounded-[1.75rem] border border-brand/10 bg-[#2a0010] text-white shadow-[0_20px_50px_-28px_rgba(85,0,31,0.55)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(ellipse 80% 70% at 12% 20%, rgba(232,153,176,0.28), transparent 55%), radial-gradient(ellipse 60% 50% at 88% 10%, rgba(196,164,132,0.22), transparent 50%), linear-gradient(160deg, #2a0010 0%, #55001f 48%, #1a0a10 100%)",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
          aria-hidden
        />

        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[auto_1fr_auto] lg:items-end lg:gap-10 lg:p-10">
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-[1.35rem] border border-white/20 bg-white/10 font-display text-4xl tracking-tight text-white shadow-inner backdrop-blur-sm sm:h-32 sm:w-32 sm:text-5xl">
            {mono}
          </div>

          <div className="min-w-0 space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-on-dark/90">
                Client · since {client.since}
              </p>
              <h1 className="mt-2 font-display text-[2.35rem] font-normal leading-[1.05] tracking-tight sm:text-[2.85rem]">
                {client.name}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">
                {client.note}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {client.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm"
                >
                  {tag}
                </span>
              ))}
            </div>

            <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/75">
              <div className="inline-flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                <dt className="sr-only">Email</dt>
                <dd>{client.email}</dd>
              </div>
              <div className="inline-flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                <dt className="sr-only">Phone</dt>
                <dd>{client.phone}</dd>
              </div>
              <div className="inline-flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                <dt className="sr-only">Location</dt>
                <dd>{client.location}</dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
            <button type="button" className={dashboardPageHeaderCtaClassName("!bg-white !text-brand hover:!bg-brand-soft")}>
              <MessageSquare className="h-4 w-4" aria-hidden />
              Message
            </button>
            <button type="button" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
              <Calendar className="h-4 w-4" aria-hidden />
              Book shoot
            </button>
          </div>
        </div>

        <div className="relative grid grid-cols-2 border-t border-white/10 sm:grid-cols-4">
          {client.stats.map((stat) => (
            <div
              key={stat.label}
              className="border-white/10 px-5 py-4 odd:border-r sm:border-r sm:last:border-r-0 sm:px-6"
            >
              <p className="font-display text-2xl tabular-nums tracking-tight text-white sm:text-[1.65rem]">
                {stat.value}
              </p>
              <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/50">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Next shoot + payments */}
      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <section className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand dark:text-brand-on-dark">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Up next
              </p>
              <h2 className="mt-2 font-display text-2xl tracking-tight text-zinc-900 dark:text-zinc-50">
                {client.nextShoot.title}
              </h2>
              <p className="mt-1.5 inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <Clock3 className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                {client.nextShoot.when}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset",
                statusTone(client.nextShoot.status),
              )}
            >
              {client.nextShoot.status}
            </span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" className={dashboardPageHeaderCtaClassName("!rounded-xl")}>
              Open schedule
            </button>
            <button type="button" className={dashboardPageHeaderCtaSecondaryClassName("!rounded-xl")}>
              Send reminder
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-xl tracking-tight text-zinc-900 dark:text-zinc-50">
              Payments
            </h2>
            <Link
              href="/dashboard/income"
              className="text-xs font-semibold text-brand underline-offset-2 hover:underline dark:text-brand-on-dark"
            >
              Income ledger
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {client.payments.map((row) => (
              <li
                key={row.label}
                className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-3 last:border-0 last:pb-0 dark:border-zinc-800"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {row.label}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{row.status}</p>
                </div>
                <p className="shrink-0 font-display text-lg tabular-nums text-zinc-900 dark:text-zinc-50">
                  {row.amount}
                </p>
              </li>
            ))}
          </ul>
        </section>
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
