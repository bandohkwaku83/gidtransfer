"use client";

import Image from "next/image";
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
import { getAuth, logout } from "@/lib/auth-demo";
import { STUDIO_NAME } from "@/lib/branding";
import { FormSearchInput, dashboardSearchFieldClassName } from "@/components/ui/form-input";
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
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Sun,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";

type ShellNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
};

const SIDEBAR_COLLAPSED_KEY = "gidostorage_sidebar_collapsed_v1";

const SidebarCollapseContext = createContext<boolean>(false);

function SidebarBrandMark({
  logoDataUrl,
  companyName,
  compact,
}: {
  logoDataUrl?: string;
  companyName: string;
  compact?: boolean;
}) {
  const imgClass = cn(
    "object-contain object-left",
    compact ? "h-7 w-auto max-w-[120px]" : "h-8 w-auto max-w-[140px]",
  );
  if (logoDataUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoDataUrl} alt={companyName || "Studio"} className={imgClass} />
    );
  }
  return (
    <Image
      src="/images/gido_logo.png"
      alt="Gido logo"
      width={168}
      height={168}
      className={imgClass}
      priority
    />
  );
}

function SidebarBrandMonogram({ companyName }: { companyName: string }) {
  const initial = (companyName?.trim()?.[0] ?? "G").toUpperCase();
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-sm font-bold tracking-tight text-white shadow-sm ring-1 ring-zinc-900/5 dark:bg-white dark:text-zinc-900 dark:ring-white/10">
      {initial}
    </div>
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

const ACCOUNT_NAV: ShellNavItem[] = [
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
    isActive: (p) => p.startsWith("/dashboard/settings"),
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
      className={cn(
        "group relative flex items-center rounded-xl text-[13px] transition-all duration-200",
        collapsed ? "h-10 w-10 justify-center" : "h-10 w-full gap-3 px-3",
        active
          ? "bg-brand-soft text-brand shadow-sm ring-1 ring-brand/15 dark:bg-brand/15 dark:text-brand-on-dark dark:ring-brand/25"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-100",
      )}
    >
      <span
        className={cn(
          "flex shrink-0 [&>svg]:h-[18px] [&>svg]:w-[18px] [&>svg]:stroke-[1.6]",
          active
            ? "text-brand dark:text-brand-on-dark"
            : "text-zinc-500 group-hover:text-zinc-800 dark:text-zinc-500 dark:group-hover:text-zinc-300",
        )}
      >
        {icon}
      </span>
      {collapsed ? null : (
        <span className={cn("min-w-0 leading-snug", active ? "font-semibold" : "font-medium")}>
          {label}
        </span>
      )}
      {!collapsed && active ? (
        <span
          className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-brand dark:bg-brand-on-dark"
          aria-hidden
        />
      ) : null}
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
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-500/80">
        {title}
      </p>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function SidebarSectionDivider() {
  return <div className="my-2 h-px w-8 self-center bg-zinc-200 dark:bg-white/[0.06]" aria-hidden />;
}

export function PhotographerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { darkUi, toggleDarkUi } = useDashboardUiTheme();
  const [query, setQuery] = useState("");
  const searchValue = useMemo(() => ({ query, setQuery }), [query]);

  const studio = useMemo(() => getAuth()?.user?.studio, []);
  const brandTitle = studio?.companyName?.trim() || STUDIO_NAME;

  const email = getAuth()?.email ?? "doe@gmail.com";
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const profileWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (raw === "1") setCollapsed(true);
    } catch {
      // ignore
    }
  }, []);

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

  const sidebarSections = (onNavigate?: () => void) => (
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
        {ACCOUNT_NAV.map((item) => (
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
    </>
  );

  return (
    <SearchContext.Provider value={searchValue}>
      <div className={cn(darkUi && "dark")}>
        <div className="relative flex min-h-screen bg-[#F5F5F5] text-zinc-900 dark:bg-black dark:text-zinc-50">
          <SidebarCollapseContext.Provider value={collapsed}>
            <aside
              className={cn(
                "relative hidden min-h-screen shrink-0 flex-col border-r border-zinc-200 bg-white transition-[width] duration-300 ease-out lg:flex lg:flex-col dark:border-zinc-800 dark:bg-zinc-950",
                collapsed ? "w-[76px]" : "w-[272px]",
              )}
            >
              <div
                className={cn(
                  "flex flex-1 flex-col pb-6 pt-6",
                  collapsed ? "px-3" : "px-4",
                )}
              >
                <div
                  className={cn(
                    "flex items-center",
                    collapsed ? "justify-center" : "gap-3 px-2",
                  )}
                >
                  {collapsed ? (
                    <SidebarBrandMonogram companyName={brandTitle} />
                  ) : (
                    <>
                      <SidebarBrandMonogram companyName={brandTitle} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          {brandTitle}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {!collapsed && studio?.logoDataUrl ? (
                  <div className="mt-4 flex items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 dark:border-zinc-800 dark:bg-zinc-900/40">
                    <SidebarBrandMark
                      companyName={brandTitle}
                      logoDataUrl={studio.logoDataUrl}
                    />
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={toggleCollapsed}
                  className={cn(
                    "mt-5 inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
                    collapsed ? "mx-auto h-9 w-9" : "h-9 w-full gap-2 px-3 text-[12px] font-medium",
                  )}
                  aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                  aria-expanded={!collapsed}
                  title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {collapsed ? (
                    <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <>
                      <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
                      <span>Collapse</span>
                    </>
                  )}
                </button>

                <nav
                  className={cn(
                    "mt-6 flex flex-1 flex-col overflow-y-auto pr-0.5",
                    collapsed ? "items-center gap-2" : "gap-6",
                  )}
                >
                  {sidebarSections()}
                </nav>

                <div
                  className={cn(
                    "mt-6 border-t border-zinc-200 dark:border-zinc-800",
                    collapsed ? "pt-4" : "pt-4",
                  )}
                >
                  {collapsed ? (
                    <div className="flex justify-center">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-white ring-1 ring-zinc-900/10 dark:bg-zinc-100 dark:text-zinc-900 dark:ring-white/10"
                        title={email}
                        aria-label={`Signed in as ${email}`}
                      >
                        <UserRound className="h-4 w-4" aria-hidden="true" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-xl px-2 py-1.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                        <UserRound className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          Signed in
                        </p>
                        <p
                          className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-100"
                          title={email}
                        >
                          {email}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </aside>
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
              "fixed inset-y-0 left-0 z-50 flex w-[min(280px,calc(100vw-3rem))] -translate-x-full flex-col border-r border-zinc-200 bg-white transition-transform duration-200 ease-out lg:hidden dark:border-zinc-800 dark:bg-zinc-950",
              mobileNavOpen && "translate-x-0 shadow-2xl shadow-black/40",
            )}
          >
            <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <SidebarBrandMonogram companyName={brandTitle} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {brandTitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
                aria-label="Close menu"
                onClick={() => setMobileNavOpen(false)}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-6">
              <SidebarCollapseContext.Provider value={false}>
                {sidebarSections(() => setMobileNavOpen(false))}
              </SidebarCollapseContext.Provider>
            </nav>
            <div className="border-t border-zinc-200 px-4 py-4 dark:border-zinc-800">
              <div className="flex items-center gap-3 rounded-xl px-2 py-1.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Signed in
                  </p>
                  <p
                    className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-100"
                    title={email}
                  >
                    {email}
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-zinc-200/80 bg-white/95 px-4 backdrop-blur-xl dark:border-zinc-800 dark:bg-black/85 dark:backdrop-blur-xl lg:px-8 2xl:px-10">
            <div className="flex flex-1 items-center gap-3">
              <button
                type="button"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50 lg:hidden dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                aria-label="Open menu"
                aria-expanded={mobileNavOpen}
                aria-controls="dashboard-mobile-nav"
                onClick={() => setMobileNavOpen(true)}
              >
                <Menu className="h-5 w-5" aria-hidden />
              </button>
              <span className="min-w-0 truncate text-sm font-semibold lg:hidden">{brandTitle}</span>
              <FormSearchInput
                placeholder="Search clients, bookings, galleries, SMS…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                prefix={<Search className="h-4 w-4 text-zinc-400" aria-hidden />}
                className={cn(
                  "max-w-md flex-1 xl:max-w-xl 2xl:max-w-2xl",
                  dashboardSearchFieldClassName,
                  "[&_.ant-input-affix-wrapper]:!py-2 focus-within:[&_.ant-input-affix-wrapper]:!ring-2 focus-within:[&_.ant-input-affix-wrapper]:!ring-brand/35 dark:focus-within:[&_.ant-input-affix-wrapper]:!ring-brand/40",
                )}
              />
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={toggleDarkUi}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
                aria-label={darkUi ? "Use light workspace" : "Use dark workspace"}
                title={darkUi ? "Light workspace" : "Dark workspace"}
              >
                {darkUi ? (
                  <Sun className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Moon className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
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
                  <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-950">
                    <div className="px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Signed in
                      </p>
                      <p className="mt-1 truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
                        {email}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:text-red-200 dark:hover:bg-red-950/40"
                      onClick={async () => {
                        setProfileOpen(false);
                        await logout();
                        window.location.href = "/login";
                      }}
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto bg-transparent p-4 lg:p-8 2xl:px-10 2xl:py-10">{children}</main>
        </div>
      </div>
      </div>
    </SearchContext.Provider>
  );
}
