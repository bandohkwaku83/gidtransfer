"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import { PlanStatusBanners } from "@/components/billing/trial-gate";
import { getAuth, logout, type AuthUser } from "@/lib/auth-demo";
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
  FolderKanban,
  GalleryHorizontal,
  HardDrive,
  LayoutGrid,
  LogOut,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Map,
  Trash2,
  UserRound,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useDashboardTour } from "@/components/tour/dashboard-tour";
import { SettingsSidebarNav } from "@/components/photographer/settings-sidebar-nav";
import { SidebarCollapseContext } from "@/components/photographer/sidebar-collapse-context";
import {
  canAccessPath,
  canOpen,
  firstAllowedHref,
  isOwner,
  type StudioMenuKey,
} from "@/lib/studio-access";

type ShellNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  menuKey: StudioMenuKey | null;
  isActive: (pathname: string) => boolean;
  /** Optional data-tour id for the dashboard walkthrough. */
  tourId?: string;
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
  bgSolid: "bg-[#55001F]",
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
    menuKey: "dashboard",
    isActive: (p) => p === "/dashboard",
  },
];

const NAV_CLIENT_WORK: ShellNavItem[] = [
  {
    href: "/dashboard/clients",
    label: "Clients",
    icon: Users,
    menuKey: "clients",
    isActive: (p) => p.startsWith("/dashboard/clients"),
  },
  {
    href: "/dashboard/schedules",
    label: "Bookings",
    icon: CalendarDays,
    menuKey: "bookings",
    isActive: (p) => p.startsWith("/dashboard/schedules"),
  },
  {
    href: "/dashboard/income",
    label: "Income",
    icon: Wallet,
    menuKey: "income",
    isActive: (p) => p.startsWith("/dashboard/income"),
  },
];

const NAV_GALLERIES: ShellNavItem[] = [
  {
    href: "/dashboard/galleries",
    label: "Galleries",
    icon: GalleryHorizontal,
    menuKey: "galleries",
    isActive: (p) =>
      (p.startsWith("/dashboard/galleries") && !p.startsWith("/dashboard/galleries/trash")) ||
      p.startsWith("/dashboard/folder"),
    tourId: "sidebar-galleries",
  },
  {
    href: "/dashboard/galleries/trash",
    label: "Trash",
    icon: Trash2,
    menuKey: "trash",
    isActive: (p) => p.startsWith("/dashboard/galleries/trash"),
  },
];

const NAV_STUDIO: ShellNavItem[] = [
  {
    href: "/collaborations",
    label: "Collaborations",
    icon: FolderKanban,
    menuKey: "collaborations",
    isActive: (p) => p.startsWith("/collaborations"),
  },
  {
    href: "/dashboard/storage",
    label: "Storage",
    icon: HardDrive,
    menuKey: "storage",
    isActive: (p) => p.startsWith("/dashboard/storage"),
  },
  {
    href: "/dashboard/sms",
    label: "SMS",
    icon: MessageSquare,
    menuKey: null,
    isActive: (p) => p.startsWith("/dashboard/sms"),
  },
];

function filterNavItems(items: ShellNavItem[], user: AuthUser | null | undefined): ShellNavItem[] {
  return items.filter((item) => {
    if (item.menuKey == null) {
      // Owner-only chrome (e.g. SMS) — staff never see it.
      return isOwner(user);
    }
    return canOpen(user, item.menuKey);
  });
}
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
  tourId,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  active: boolean;
  onNavigate?: () => void;
  tourId?: string;
}) {
  const collapsed = useContext(SidebarCollapseContext);
  return (
    <Link
      href={href}
      onClick={() => onNavigate?.()}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      aria-current={active ? "page" : undefined}
      data-tour={tourId}
      className={cn(
        "group relative flex items-center rounded-xl text-[13px] transition-colors duration-150",
        collapsed ? "h-10 w-10 justify-center" : "h-10 w-full gap-2.5 px-2.5",
        active
          ? collapsed
            ? cn(sidebarAccentClass.bgSolid, "text-white")
            : cn(sidebarAccentClass.bgSoft, sidebarAccentClass.text)
          : "text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100",
      )}
    >
      {active && !collapsed ? (
        <span
          className={cn(
            "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full",
            sidebarAccentClass.bgSolid,
          )}
          aria-hidden
        />
      ) : null}
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg transition-colors",
          "h-8 w-8",
          active
            ? collapsed
              ? "text-white [&>svg]:stroke-[2]"
              : cn(sidebarAccentClass.text, "[&>svg]:stroke-[2]")
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
  const router = useRouter();
  const { darkUi } = useDashboardUiTheme();
  const [query, setQuery] = useState("");
  const searchValue = useMemo(() => ({ query, setQuery }), [query]);

  const authUser = getAuth()?.user ?? null;
  const authUserId = authUser?._id ?? "";
  const accountType = authUser?.accountType ?? "owner";
  const menuKeysKey = (authUser?.membership?.menuKeys ?? []).join(",");
  const studio = authUser?.studio;
  const brandTitle = studio?.companyName?.trim() || STUDIO_NAME;
  const { plan, can } = usePlanEntitlements();
  const { restartTour } = useDashboardTour();
  const [storageSummary, setStorageSummary] = useState<StorageSummary | null>(null);
  const [menuDenied, setMenuDenied] = useState(false);

  const navOverview = filterNavItems(NAV_OVERVIEW, authUser);
  const navClientWork = filterNavItems(NAV_CLIENT_WORK, authUser);
  const navGalleries = filterNavItems(NAV_GALLERIES, authUser);
  const navStudio = filterNavItems(NAV_STUDIO, authUser);
  const showSettingsNav = isOwner(authUser) || canOpen(authUser, "settings");
  const canFetchStorage = canOpen(authUser, "storage");

  useEffect(() => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    if (!canAccessPath(authUser, pathname, search)) {
      setMenuDenied(true);
      const home = firstAllowedHref(authUser);
      if (`${pathname}${search}` !== home) {
        router.replace(home);
      }
      return;
    }
    setMenuDenied(false);
  }, [accountType, authUser, authUserId, menuKeysKey, pathname, router]);

  useEffect(() => {
    if (!canFetchStorage) {
      setStorageSummary(null);
      return;
    }
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
  }, [canFetchStorage, plan?.planId]);

  const email = getAuth()?.email?.trim() || getAuth()?.user?.email?.trim() || "";
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

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setProfileOpen(false);
    }

    document.addEventListener("mousedown", onDocMouseDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      window.removeEventListener("keydown", onKey);
    };
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
      {navOverview.length > 0 ? (
        <NavSection title="Overview">
          {navOverview.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={<item.icon aria-hidden="true" />}
              active={item.isActive(pathname)}
              onNavigate={onNavigate}
              tourId={item.tourId}
            />
          ))}
        </NavSection>
      ) : null}

      {collapsed && navOverview.length > 0 && navClientWork.length > 0 ? (
        <SidebarSectionDivider />
      ) : null}

      {navClientWork.length > 0 ? (
        <NavSection title="Clients & bookings">
          {navClientWork.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={<item.icon aria-hidden="true" />}
              active={item.isActive(pathname)}
              onNavigate={onNavigate}
              tourId={item.tourId}
            />
          ))}
        </NavSection>
      ) : null}

      {collapsed && navClientWork.length > 0 && navGalleries.length > 0 ? (
        <SidebarSectionDivider />
      ) : null}

      {navGalleries.length > 0 ? (
        <NavSection title="Client galleries">
          {navGalleries.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={<item.icon aria-hidden="true" />}
              active={item.isActive(pathname)}
              onNavigate={onNavigate}
              tourId={item.tourId}
            />
          ))}
        </NavSection>
      ) : null}

      {collapsed && navGalleries.length > 0 && navStudio.length > 0 ? (
        <SidebarSectionDivider />
      ) : null}

      {navStudio.length > 0 ? (
        <NavSection title="Studio">
          {navStudio.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={<item.icon aria-hidden="true" />}
              active={item.isActive(pathname)}
              onNavigate={onNavigate}
              tourId={item.tourId}
            />
          ))}
        </NavSection>
      ) : null}

      {collapsed && (navStudio.length > 0 || navGalleries.length > 0) && showSettingsNav ? (
        <SidebarSectionDivider />
      ) : null}

      {showSettingsNav ? (
        <NavSection title="Account">
          <SettingsSidebarNav onNavigate={onNavigate} inDrawer={inDrawer} />
        </NavSection>
      ) : null}
    </>
  );

  return (
    <SearchContext.Provider value={searchValue}>
      <div className={cn("dashboard-theme", darkUi && "dark")}>
        <div className="relative flex h-dvh overflow-hidden bg-[#f6f6f7] text-zinc-900 dark:bg-[#0a0a0a] dark:text-zinc-50">
          <SidebarCollapseContext.Provider value={collapsed}>
            <div className="hidden h-full shrink-0 p-3 lg:block lg:p-4">
              <aside
                className={cn(
                  "flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white text-zinc-900 transition-[width] duration-300 ease-out dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50",
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

        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
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
              "fixed bottom-3 left-3 top-3 z-50 flex w-[min(280px,calc(100vw-2.5rem))] -translate-x-[calc(100%+1.5rem)] flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white text-zinc-900 shadow-none transition-transform duration-200 ease-out dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 lg:hidden",
              mobileNavOpen && "translate-x-0 shadow-lg shadow-zinc-900/10 dark:shadow-black/40",
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

          <header className="sticky top-0 z-30 flex shrink-0 items-center gap-3 border-b border-zinc-200/50 bg-[#f6f6f7]/90 px-4 py-3 backdrop-blur-md lg:px-8 2xl:px-10 dark:border-zinc-800/60 dark:bg-[#0a0a0a]/90">
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200/90 bg-white text-zinc-700 transition hover:bg-zinc-50 lg:hidden dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              aria-label="Open menu"
              aria-expanded={mobileNavOpen}
              aria-controls="dashboard-mobile-nav"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
            <div className="dashboard-search-shell flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <FormSearchInput
                placeholder="Search galleries…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                prefix={<Search className="h-4 w-4 text-zinc-400" aria-hidden />}
                className={cn(
                  "min-w-0 flex-1 lg:max-w-[70%]",
                  dashboardHeaderSearchFieldClassName,
                )}
              />
              <div className="ml-auto flex shrink-0 items-center gap-2">
                <NotificationsBell />

                <div ref={profileWrapRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileOpen((v) => !v)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/90 bg-white text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    aria-label="Profile menu"
                    aria-expanded={profileOpen}
                    aria-haspopup="menu"
                    aria-controls="dashboard-profile-menu"
                  >
                    <UserRound className="h-4 w-4" aria-hidden="true" />
                  </button>

                  {profileOpen ? (
                    <div
                      id="dashboard-profile-menu"
                      role="menu"
                      className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-950"
                    >
                      <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
                        {planName ? (
                          <span className="inline-flex rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-brand dark:bg-brand/20 dark:text-brand-on-dark">
                            {planName} plan
                          </span>
                        ) : (
                          <p className="text-[11px] font-medium text-zinc-500">Signed in</p>
                        )}
                        <p className="mt-1.5 truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          {email || "Signed in"}
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
                          href="/billing"
                          onClick={() => setProfileOpen(false)}
                          className="mt-3 inline-flex text-xs font-semibold text-brand hover:underline dark:text-brand-on-dark"
                        >
                          Manage billing
                        </Link>
                      </div>
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full items-center gap-3 border-t border-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900/60"
                        onClick={() => {
                          setProfileOpen(false);
                          restartTour();
                        }}
                      >
                        <Map className="h-4 w-4 text-zinc-500 dark:text-zinc-400" aria-hidden="true" />
                        Take a tour
                      </button>
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
            <PlanStatusBanners />
            <main className="flex-1 overflow-auto bg-transparent p-4 lg:p-8 2xl:px-10 2xl:py-10">
              {menuDenied ? (
                <div className="mx-auto max-w-md py-20 text-center">
                  <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                    No access
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    You do not have permission to open this area of the studio.
                  </p>
                </div>
              ) : (
                children
              )}
            </main>
          </div>
        </div>
      </div>
      </div>
    </SearchContext.Provider>
  );
}
