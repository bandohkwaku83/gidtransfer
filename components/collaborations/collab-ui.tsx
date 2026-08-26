"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function collabInitials(nameOrEmail: string): string {
  const raw = nameOrEmail.trim();
  if (!raw) return "?";
  if (raw.includes("@")) {
    return raw.slice(0, 2).toUpperCase();
  }
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

const AVATAR_TONES = [
  "bg-brand/12 text-brand-ink dark:bg-brand/25 dark:text-brand-on-dark",
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
  "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200",
  "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100",
  "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200",
] as const;

export function collabAvatarTone(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % 997;
  }
  return AVATAR_TONES[hash % AVATAR_TONES.length]!;
}

/** Page wrapper — no extra padding; PhotographerShell already pads main. */
export function CollabPageShell({
  children,
  className,
  narrow,
}: {
  children: React.ReactNode;
  className?: string;
  /** Tighter max width for forms / invites */
  narrow?: boolean;
}) {
  return (
    <div
      className={cn(
        "dashboard-page space-y-6",
        narrow && "max-w-2xl xl:max-w-2xl 2xl:max-w-2xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

type CollabSurfaceProps = {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "aside" | "ul" | "li" | "form";
} & Omit<React.HTMLAttributes<HTMLElement>, "className" | "children">;

export function CollabSurface({
  children,
  className,
  as: Tag = "div",
  ...rest
}: CollabSurfaceProps) {
  return (
    <Tag
      className={cn(
        "rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-950",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function CollabAvatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClass =
    size === "sm"
      ? "h-7 w-7 text-[10px]"
      : size === "lg"
        ? "h-10 w-10 text-xs"
        : "h-8 w-8 text-[11px]";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-wide ring-2 ring-white dark:ring-zinc-950",
        sizeClass,
        collabAvatarTone(name),
        className,
      )}
      title={name}
    >
      {collabInitials(name)}
    </span>
  );
}

export function CollabAvatarStack({
  names,
  max = 4,
  size = "sm",
}: {
  names: string[];
  max?: number;
  size?: "sm" | "md";
}) {
  const visible = names.slice(0, max);
  const overflow = Math.max(0, names.length - visible.length);
  return (
    <div className="flex items-center -space-x-1.5">
      {visible.map((name, i) => (
        <CollabAvatar key={`${name}-${i}`} name={name} size={size} />
      ))}
      {overflow > 0 ? (
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-full bg-zinc-100 font-semibold text-zinc-600 ring-2 ring-white dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-950",
            size === "sm" ? "h-7 w-7 text-[10px]" : "h-8 w-8 text-[11px]",
          )}
        >
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}

export function CollabStatusDot({
  status,
  className,
}: {
  status: "active" | "archived" | "pending" | "expired";
  className?: string;
}) {
  const tone =
    status === "active"
      ? "bg-emerald-500"
      : status === "pending"
        ? "bg-amber-400"
        : "bg-zinc-400";
  return (
    <span
      className={cn("inline-block h-1.5 w-1.5 shrink-0 rounded-full", tone, className)}
      aria-hidden
    />
  );
}

export function CollabBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "brand" | "success" | "warn" | "muted";
  className?: string;
}) {
  const tones = {
    neutral:
      "border-zinc-200/80 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
    brand:
      "border-brand/15 bg-brand-soft text-brand-ink dark:border-brand/25 dark:bg-brand/15 dark:text-brand-on-dark",
    success:
      "border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200",
    warn: "border-amber-200/80 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100",
    muted:
      "border-transparent bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[11px] font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function CollabMetricStrip({
  items,
}: {
  items: {
    label: string;
    value: React.ReactNode;
    hint?: string;
    highlight?: boolean;
  }[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <ul className="grid grid-cols-2 lg:grid-cols-4">
        {items.map((item, i) => (
          <li
            key={item.label}
            className={cn(
              "relative px-4 py-3.5 sm:px-5 sm:py-4",
              i % 2 === 1 && "border-l border-zinc-100 dark:border-zinc-800",
              i >= 2 && "border-t border-zinc-100 dark:border-zinc-800 lg:border-t-0",
              i >= 1 && "lg:border-l lg:border-zinc-100 dark:lg:border-zinc-800",
            )}
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                {item.label}
              </p>
              {item.highlight ? (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
              ) : null}
            </div>
            <p
              className={cn(
                "mt-1.5 font-display text-[1.75rem] font-semibold leading-none tracking-tight tabular-nums",
                item.highlight
                  ? "text-brand dark:text-brand-on-dark"
                  : "text-zinc-900 dark:text-zinc-50",
              )}
            >
              {item.value}
            </p>
            {item.hint ? (
              <p className="mt-1.5 text-xs leading-snug text-zinc-400 dark:text-zinc-500">
                {item.hint}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CollabSectionLabel({
  children,
  className,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn("mb-2.5 flex items-center justify-between gap-3", className)}>
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
        {children}
      </h2>
      {action}
    </div>
  );
}

export function CollabLoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-20 text-sm text-zinc-500 dark:text-zinc-400">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      {label}
    </div>
  );
}

export function CollabEmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300/90 bg-zinc-50/40 px-6 py-14 text-center dark:border-zinc-700 dark:bg-zinc-900/20">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-500">
        {icon}
      </div>
      <h2 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
      <p className="mt-1 max-w-sm text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function CollabBackLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 transition hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200"
    >
      {children}
    </Link>
  );
}

export function CollabFilterTab({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition",
        active
          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
      )}
    >
      {children}
      {count != null ? (
        <span
          className={cn(
            "rounded-md px-1.5 py-px text-[10px] font-semibold tabular-nums",
            active
              ? "bg-white/20 text-white dark:bg-zinc-900/15 dark:text-zinc-900"
              : "bg-zinc-200/80 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300",
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

export function formatCollabDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatCollabRelative(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatCollabDate(value);
}
