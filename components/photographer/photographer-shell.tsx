"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
  useRef,
  useState,
} from "react";
import { PlanQuotaMeters } from "@/components/billing/plan-storage-meter";
import { readVideoUsage, rememberVideoUsage } from "@/lib/video-usage";
import { TrialActiveBanner, TrialExpiredWall } from "@/components/billing/trial-gate";
import { getAuth, logout } from "@/lib/auth-demo";
import { APP_NAME, STUDIO_NAME, studioLogoSrc } from "@/lib/branding";
import { fetchStorage, storageUsagePercent, type StorageSummary } from "@/lib/storage-api";
import { photographerSignOutUrl } from "@/lib/studio-url";
import { usePlanEntitlements } from "@/lib/use-plan-entitlements";
import { FormSearchInput, dashboardHeaderSearchFieldClassName } from "@/components/ui/form-input";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { useDashboardUiTheme } from "@/components/dashboard-ui-theme";
import { NotificationsBell } from "@/components/photographer/notifications-bell";
import {
  CalendarDays,
  GalleryHorizontal,
  HardDrive,
  LayoutGrid,
  LogOut,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Trash2,
  UserRound,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { SettingsSidebarNav } from "@/components/photographer/settings-sidebar-nav";
import { SidebarCollapseContext } from "@/components/photographer/sidebar-collapse-context";

type ShellNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
};

const SIDEBAR_COLLAPSED_KEY = "gidostorage_sidebar_collapsed_v1";

function isGalleryDetailPath(pathname: string): boolean {
  return /^\/dashboard\/folder\/[^/]+$/.test(pathname);
}

/** Sidebar accent — burgundy (#55001F), scoped to nav shell. */
const sidebarAccentClass = {
  gradient: "bg-gradient-to-br from-[#55001F] to-[#420018]",
  gradientShadow: "shadow-sm shadow-[#55001F]/20",
  text: "text-[#55001F] dark:text-[#e899b0]",
  border: "border-[#55001F] dark:border-[#e899b0]",
  bgSoft: "bg-[#55001F]/10 dark:bg-[#55001F]/15",
  bgSoftMedium: "bg-[#55001F]/15 dark:bg-[#55001F]/25",
  bgSolid: "bg-[#55001F]",
  shadowMd: "shadow-md shadow-[#55001F]/25",
} as const;

function SidebarBrandIcon({
  companyName,
  logoDataUrl,
  compact,
}: {
  companyName: string;
  logoDataUrl?: string;
  compact?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={studioLogoSrc(logoDataUrl)}
      alt={logoDataUrl ? companyName || "Studio" : `${APP_NAME} logo`}
      className={cn(
        "shrink-0 object-contain",
        compact ? "h-8 w-auto max-w-[32px]" : "h-9 w-auto max-w-[36px]",
      )}
    />
  );
}

const NAV_OVERVIEW: ShellNavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutGrid,
    isActive: (p) => p === "/dashboard",
  },
];

const NAV_CLIENT_WORK: ShellNavItem[] = [
  {
    href: "/dashboard/clients",
    label: "Clients",
    icon: Users,
    isActive: (p) => p.startsWith("/dashboard/clients"),
  },
  {
    href: "/dashboard/schedules",
    label: "Bookings",
    icon: CalendarDays,
    isActive: (p) => p.startsWith("/dashboard/schedules"),
  },
  {
    href: "/dashboard/income",
    label: "Income",
    icon: Wallet,
    isActive: (p) => p.startsWith("/dashboard/income"),
  },
];

const NAV_GALLERIES: ShellNavItem[] = [
  {
    href: "/dashboard/galleries",
    label: "Galleries",
    icon: GalleryHorizontal,
    isActive: (p) =>
      (p.startsWith("/dashboard/galleries") && !p.startsWith("/dashboard/galleries/trash")) ||
      p.startsWith("/dashboard/folder"),
  },
  {
    href: "/dashboard/galleries/trash",
    label: "Trash",
    icon: Trash2,
    isActive: (p) => p.startsWith("/dashboard/galleries/trash"),
  },
];

const NAV_STUDIO: ShellNavItem[] = [
  {
    href: "/dashboard/storage",
    label: "Storage",
    icon: HardDrive,
    isActive: (p) => p.startsWith("/dashboard/storage"),
  },
  {
    href: "/dashboard/sms",
    label: "SMS",
    icon: MessageSquare,
    isActive: (p) => p.startsWith("/dashboard/sms"),
  },
];

type SearchCtx = {
  query: string;
  setQuery: (q: string) => void;
};

const SearchContext = createContext<SearchCtx | null>(null);

export function useFolderListSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    return {
      query: "",
      setQuery: (q: string) => {
        void q;
      },
    };
  }
  return ctx;
}

function NavLink({
  href,
  label,
  icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  active: boolean;
  onNavigate?: () => void;
}) {
  const collapsed = useContext(SidebarCollapseContext);
  return (
    <Link
      href={href}
      onClick={() => onNavigate?.()}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center rounded-xl text-[13px] transition-all duration-200",
        collapsed ? "h-10 w-10 justify-center" : "h-10 w-full gap-2.5 px-2.5",
        active
          ? collapsed
            ? cn(sidebarAccentClass.bgSolid, "text-white", sidebarAccentClass.shadowMd)
            : cn(
                "border-l-[3px] pl-2",
                sidebarAccentClass.border,
                sidebarAccentClass.bgSoft,
                sidebarAccentClass.text,
              )
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-100",
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg transition-colors",
          "h-8 w-8",
          active
            ? collapsed
              ? "text-white [&>svg]:stroke-[2]"
              : cn(sidebarAccentClass.bgSoftMedium, sidebarAccentClass.text, "[&>svg]:stroke-[2]")
            : "text-zinc-500 group-hover:text-zinc-700 dark:text-zinc-400 dark:group-hover:text-zinc-200",
          "[&>svg]:h-[17px] [&>svg]:w-[17px] [&>svg]:stroke-[1.75]",
        )}
      >
        {icon}
      </span>
      {collapsed ? null : (
        <span className={cn("min-w-0 leading-snug", active ? "font-semibold" : "font-medium")}>
          {label}
        </span>
      )}
    </Link>
  );
}

function NavSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const collapsed = useContext(SidebarCollapseContext);
  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="sr-only">{title}</span>
        {children}
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <p className="mb-2 px-2.5 text-[11px] font-semibold tracking-wide text-zinc-400 dark:text-zinc-500">
        {title}
      </p>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function SidebarSectionDivider() {
  return (
    <div className="my-1 h-px w-8 self-center bg-zinc-200 dark:bg-zinc-800" aria-hidden />
  );
}

export function PhotographerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { darkUi } = useDashboardUiTheme();
  const [query, setQuery] = useState("");
  const searchValue = useMemo(() => ({ query, setQuery }), [query]);

  const studio = useMemo(() => getAuth()?.user?.studio, []);
  const brandTitle = studio?.companyName?.trim() || STUDIO_NAME;
  const { plan, trialExpired, trialActive, can } = usePlanEntitlements();
  const allowThroughTrialWall =
    pathname.startsWith("/dashboard/settings") || pathname.startsWith("/billing");
  const [storageSummary, setStorageSummary] = useState<StorageSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchStorage()
      .then((data) => {
        if (cancelled) return;
        setStorageSummary(data.summary);
        if (
          data.summary.videoUsedBytes != null &&
          data.summary.videoUploadLimitBytes != null
        ) {
          rememberVideoUsage({
            usedBytes: data.summary.videoUsedBytes,
            limitBytes: data.summary.videoUploadLimitBytes,
          });
        }
      })
      .catch(() => {
        /* chrome meter is optional */
      });
    return () => {
      cancelled = true;
    };
  }, [plan?.planId]);

  const email = getAuth()?.email ?? "doe@gmail.com";
  const planName = plan?.planName ?? storageSummary?.planName;
  const storagePercent = storageSummary
    ? storageUsagePercent(storageSummary)
    : null;
  const canVideoUploads = can("videoUploads");
  const storedVideo = readVideoUsage();
  const videoLimitBytes =
    storageSummary?.videoUploadLimitBytes ??
    storedVideo?.limitBytes ??
    (canVideoUploads && plan?.videoUploadLimitBytes && plan.videoUploadLimitBytes > 0
      ? plan.videoUploadLimitBytes
      : null);
  const videoUsedBytes = storageSummary?.videoUsedBytes ?? storedVideo?.usedBytes ?? null;
  const videoLimitLabel =
    canVideoUploads && plan?.videoUploadLimitBytes && plan.videoUploadLimitBytes > 0
      ? plan.videoUploadLimitLabel
      : null;
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return typeof window !== "undefined" && window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });
  const profileWrapRef = useRef<HTMLDivElement | null>(null);
  const preGalleryCollapseRef = useRef<boolean | null>(null);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((v) => {
      const next = !v;
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!profileOpen) return;

    function onDocMouseDown(e: MouseEvent) {
      const el = profileWrapRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setProfileOpen(false);
    }

    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [profileOpen]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isGalleryDetailPath(pathname)) {
      setCollapsed((current) => {
        if (preGalleryCollapseRef.current === null) {
          preGalleryCollapseRef.current = current;
        }
        return true;
      });
      return;
    }

    if (preGalleryCollapseRef.current !== null) {
      const restore = preGalleryCollapseRef.current;
      preGalleryCollapseRef.current = null;
      setCollapsed(restore);
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, restore ? "1" : "0");
      } catch {
        // ignore
      }
    }
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileNavOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileNavOpen]);

  const sidebarSections = (onNavigate?: () => void, inDrawer = false) => (
    <>
      <NavSection title="Overview">
        {NAV_OVERVIEW.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={<item.icon aria-hidden="true" />}
            active={item.isActive(pathname)}
            onNavigate={onNavigate}
          />
        ))}
      </NavSection>

      {collapsed ? <SidebarSectionDivider /> : null}

      <NavSection title="Clients & bookings">
        {NAV_CLIENT_WORK.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={<item.icon aria-hidden="true" />}
            active={item.isActive(pathname)}
            onNavigate={onNavigate}
          />
        ))}
      </NavSection>

      {collapsed ? <SidebarSectionDivider /> : null}

      <NavSection title="Client galleries">
        {NAV_GALLERIES.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={<item.icon aria-hidden="true" />}
            active={item.isActive(pathname)}
            onNavigate={onNavigate}
          />
        ))}
      </NavSection>

      {collapsed ? <SidebarSectionDivider /> : null}

      <NavSection title="Studio">
        {NAV_STUDIO.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={<item.icon aria-hidden="true" />}
            active={item.isActive(pathname)}
            onNavigate={onNavigate}
          />
        ))}
      </NavSection>

      {collapsed ? <SidebarSectionDivider /> : null}

      <NavSection title="Account">
        <SettingsSidebarNav onNavigate={onNavigate} inDrawer={inDrawer} />
      </NavSection>
    </>
  );

  return (
    <SearchContext.Provider value={searchValue}>
      <div className={cn("dashboard-theme", darkUi && "dark")}>
        <div className="relative flex min-h-screen bg-[#f4f4f5] text-zinc-900 dark:bg-[#0a0a0a] dark:text-zinc-50">
          <SidebarCollapseContext.Provider value={collapsed}>
            <div className="hidden shrink-0 p-3 lg:sticky lg:top-0 lg:block lg:self-start lg:p-4">
              <aside
                className={cn(
                  "flex h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/95 text-zinc-900 shadow-[0_8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-[width] duration-300 ease-out dark:border-zinc-800 dark:bg-zinc-950/95 dark:text-zinc-50 dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)]",
                  collapsed ? "w-[72px]" : "w-[260px]",
                )}
              >
                <div
                  className={cn(
                    "flex min-h-0 flex-1 flex-col pb-5 pt-5",
                    collapsed ? "px-2.5" : "px-3",
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center",
                      collapsed ? "flex-col gap-3" : "gap-2.5 px-1",
                    )}
                  >
                    {collapsed ? (
                      <>
                        <SidebarBrandIcon
                          companyName={brandTitle}
                          logoDataUrl={studio?.logoDataUrl}
                          compact
                        />
                        <button
                          type="button"
                          onClick={toggleCollapsed}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                          aria-label="Expand sidebar"
                          aria-expanded={false}
                          title="Expand sidebar"
                        >
                          <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </>
                    ) : (
                      <>
                        <SidebarBrandIcon companyName={brandTitle} logoDataUrl={studio?.logoDataUrl} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                            {brandTitle}
                          </p>
                          <p className="truncate text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                            {planName ? `${planName} · Workspace` : "Workspace"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={toggleCollapsed}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                          aria-label="Collapse sidebar"
                          aria-expanded
                          title="Collapse sidebar"
                        >
                          <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </>
                    )}
                  </div>

                  <nav
                    className={cn(
                      "mt-5 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain pr-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]",
                      collapsed ? "items-center gap-1.5" : "gap-5",
                    )}
                  >
                    {sidebarSections()}
                  </nav>
                </div>
              </aside>
            </div>
          </SidebarCollapseContext.Provider>

        <div className="relative flex min-w-0 flex-1 flex-col">
          {mobileNavOpen ? (
            <div
              role="presentation"
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              aria-hidden
              onClick={() => setMobileNavOpen(false)}
            />
          ) : null}
          <aside
            id="dashboard-mobile-nav"
            className={cn(
              "fixed bottom-3 left-3 top-3 z-50 flex w-[min(280px,calc(100vw-2.5rem))] -translate-x-[calc(100%+1.5rem)] flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/98 text-zinc-900 shadow-none backdrop-blur-xl transition-transform duration-200 ease-out dark:border-zinc-800 dark:bg-zinc-950/98 dark:text-zinc-50 lg:hidden",
              mobileNavOpen &&
                "translate-x-0 shadow-2xl shadow-zinc-900/10 dark:shadow-black/40",
            )}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-200/80 px-4 py-4 dark:border-zinc-800">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <SidebarBrandIcon companyName={brandTitle} logoDataUrl={studio?.logoDataUrl} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {brandTitle}
                  </p>
                  <p className="truncate text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    {planName ? `${planName} · Workspace` : "Workspace"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                aria-label="Close menu"
                onClick={() => setMobileNavOpen(false)}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <nav className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-y-contain px-3 py-5 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
              <SidebarCollapseContext.Provider value={false}>
                {sidebarSections(() => setMobileNavOpen(false), true)}
              </SidebarCollapseContext.Provider>
            </nav>
          </aside>

          <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 lg:px-8 2xl:px-10">
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50 lg:hidden dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              aria-label="Open menu"
              aria-expanded={mobileNavOpen}
              aria-controls="dashboard-mobile-nav"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
            <div className="dashboard-search-shell flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <FormSearchInput
                placeholder="Search clients, bookings, galleries, income, SMS…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                prefix={<Search className="h-4 w-4 text-zinc-400" aria-hidden />}
                className={cn(
                  "min-w-0 flex-1 lg:max-w-[70%]",
                  dashboardHeaderSearchFieldClassName,
                )}
              />
              <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
                <NotificationsBell />

                <div ref={profileWrapRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileOpen((v) => !v)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
                    aria-label="Profile menu"
                    aria-expanded={profileOpen}
                  >
                    <UserRound className="h-4 w-4" aria-hidden="true" />
                  </button>

                  {profileOpen ? (
                    <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.12)] dark:border-zinc-700 dark:bg-zinc-950">
                      <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
                        {planName ? (
                          <span className="inline-flex rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-brand dark:bg-brand/20 dark:text-brand-on-dark">
                            {planName} plan
                          </span>
                        ) : (
                          <p className="text-[11px] font-medium text-zinc-500">Signed in</p>
                        )}
                        <p className="mt-1.5 truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          {email}
                        </p>
                      </div>
                      <div className="px-4 py-3">
                        <PlanQuotaMeters
                          planUsedBytes={storageSummary?.usedBytes ?? null}
                          planLimitBytes={
                            storageSummary && storageSummary.limitBytes > 0
                              ? storageSummary.limitBytes
                              : plan?.storageLimitBytes && plan.storageLimitBytes > 0
                                ? plan.storageLimitBytes
                                : null
                          }
                          planPercent={storagePercent}
                          videoEnabled={canVideoUploads}
                          videoUsedBytes={videoUsedBytes}
                          videoLimitBytes={videoLimitBytes}
                          videoLimitLabel={videoLimitLabel}
                          compact
                        />
                        <Link
                          href="/dashboard/settings?tab=billing"
                          onClick={() => setProfileOpen(false)}
                          className="mt-3 inline-flex text-xs font-semibold text-brand hover:underline dark:text-brand-on-dark"
                        >
                          Manage billing
                        </Link>
                      </div>
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 border-t border-zinc-100 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-zinc-800 dark:text-red-200 dark:hover:bg-red-950/40"
                        onClick={() => {
                          setProfileOpen(false);
                          void logout().then(() => {
                            window.location.replace(photographerSignOutUrl());
                          });
                        }}
                      >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        Sign out
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {trialActive ? <TrialActiveBanner /> : null}
            <main className="flex-1 overflow-auto bg-transparent p-4 lg:p-8 2xl:px-10 2xl:py-10">
              {trialExpired && !allowThroughTrialWall ? <TrialExpiredWall /> : children}
            </main>
          </div>
        </div>
      </div>
      </div>
    </SearchContext.Provider>
  );
}
