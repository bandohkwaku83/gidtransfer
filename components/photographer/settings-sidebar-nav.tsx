"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Settings } from "lucide-react";
import { SidebarCollapseContext } from "@/components/photographer/sidebar-collapse-context";
import {
  activeSettingsTabFromSearch,
  settingsTabHref,
  visibleSettingsTabs,
} from "@/lib/settings-tabs";
import { getAuth } from "@/lib/auth-demo";
import { cn } from "@/lib/utils";

const sidebarAccentClass = {
  text: "text-[#55001F] dark:text-[#e899b0]",
  border: "border-[#55001F] dark:border-[#e899b0]",
  bgSoft: "bg-[#55001F]/10 dark:bg-[#55001F]/15",
  bgSoftMedium: "bg-[#55001F]/15 dark:bg-[#55001F]/25",
  bgSolid: "bg-[#55001F]",
  shadowMd: "shadow-md shadow-[#55001F]/25",
} as const;

const FLYOUT_WIDTH_PX = 208;
const FLYOUT_GAP_PX = 8;
const FLYOUT_VIEWPORT_PADDING_PX = 12;

function SettingsSubNavLink({
  href,
  label,
  icon,
  active,
  onNavigate,
  indent,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  active: boolean;
  onNavigate?: () => void;
  indent?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={() => onNavigate?.()}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center rounded-lg text-[12px] transition-all duration-200",
        indent ? "h-9 gap-2 pl-9 pr-2.5" : "h-9 gap-2 px-2.5",
        active
          ? cn(sidebarAccentClass.bgSoft, sidebarAccentClass.text, "font-semibold")
          : "font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-100",
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors",
          active
            ? cn(sidebarAccentClass.bgSoftMedium, sidebarAccentClass.text, "[&>svg]:stroke-[2]")
            : "text-zinc-500 group-hover:text-zinc-700 dark:text-zinc-400 dark:group-hover:text-zinc-200",
          "[&>svg]:h-[15px] [&>svg]:w-[15px] [&>svg]:stroke-[1.75]",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 truncate leading-snug">{label}</span>
    </Link>
  );
}

type SettingsSidebarNavProps = {
  onNavigate?: () => void;
  inDrawer?: boolean;
};

function SettingsSidebarNavInner({ onNavigate, inDrawer = false }: SettingsSidebarNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const collapsed = useContext(SidebarCollapseContext);
  const isSettingsPath = pathname.startsWith("/dashboard/settings");
  const activeTab = activeSettingsTabFromSearch(searchParams.get("tab"));
  const [open, setOpen] = useState(isSettingsPath);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [flyoutStyle, setFlyoutStyle] = useState<CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const flyoutRef = useRef<HTMLDivElement | null>(null);
  const submenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setOpen(isSettingsPath);
    if (!isSettingsPath) setFlyoutOpen(false);
  }, [isSettingsPath]);

  const updateFlyoutPosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const maxHeight = Math.max(
      160,
      window.innerHeight - FLYOUT_VIEWPORT_PADDING_PX * 2,
    );
    const spaceBelow = window.innerHeight - rect.top - FLYOUT_VIEWPORT_PADDING_PX;
    const spaceAbove = rect.bottom - FLYOUT_VIEWPORT_PADDING_PX;
    const openUp = spaceBelow < 240 && spaceAbove > spaceBelow;

    let left = rect.right + FLYOUT_GAP_PX;
    if (left + FLYOUT_WIDTH_PX > window.innerWidth - FLYOUT_VIEWPORT_PADDING_PX) {
      left = Math.max(
        FLYOUT_VIEWPORT_PADDING_PX,
        rect.left - FLYOUT_WIDTH_PX - FLYOUT_GAP_PX,
      );
    }

    setFlyoutStyle({
      position: "fixed",
      left,
      top: openUp ? undefined : Math.max(FLYOUT_VIEWPORT_PADDING_PX, rect.top),
      bottom: openUp
        ? Math.max(FLYOUT_VIEWPORT_PADDING_PX, window.innerHeight - rect.bottom)
        : undefined,
      width: FLYOUT_WIDTH_PX,
      maxHeight,
      zIndex: 60,
    });
  }, []);

  useLayoutEffect(() => {
    if (!flyoutOpen || !collapsed) return;
    updateFlyoutPosition();
  }, [collapsed, flyoutOpen, updateFlyoutPosition]);

  useEffect(() => {
    if (!flyoutOpen || !collapsed) return;

    function onViewportChange() {
      updateFlyoutPosition();
    }

    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    return () => {
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [collapsed, flyoutOpen, updateFlyoutPosition]);

  useEffect(() => {
    if (!flyoutOpen) return;
    function onDocMouseDown(e: MouseEvent) {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (buttonRef.current?.contains(target)) return;
      if (flyoutRef.current?.contains(target)) return;
      setFlyoutOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [flyoutOpen]);

  useEffect(() => {
    if (!open || inDrawer || collapsed || !isSettingsPath) return;
    requestAnimationFrame(() => {
      submenuRef.current
        ?.querySelector<HTMLElement>('[aria-current="page"]')
        ?.scrollIntoView({ block: "nearest" });
    });
  }, [activeTab, collapsed, inDrawer, isSettingsPath, open]);

  const parentActive = isSettingsPath;
  const tabs = visibleSettingsTabs(getAuth()?.user);

  function handleParentClick() {
    if (collapsed) {
      setFlyoutOpen((v) => !v);
      return;
    }
    setOpen((v) => !v);
  }

  if (tabs.length === 0) return null;

  const subItems = tabs.map(({ id, label, icon: Icon }) => (
    <SettingsSubNavLink
      key={id}
      href={settingsTabHref(id)}
      label={label}
      icon={<Icon aria-hidden="true" />}
      active={isSettingsPath && id === activeTab}
      onNavigate={() => {
        setFlyoutOpen(false);
        onNavigate?.();
      }}
      indent={!collapsed}
    />
  ));

  const submenuScrollClassName = inDrawer
    ? undefined
    : "max-h-[min(12rem,calc(100dvh-14rem))] overflow-y-auto overscroll-y-contain pr-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]";

  const flyoutPanel = flyoutOpen ? (
    <div
      ref={flyoutRef}
      style={flyoutStyle}
      className="flex flex-col overflow-hidden rounded-xl border border-zinc-200/90 bg-white p-1.5 shadow-lg dark:border-zinc-700 dark:bg-zinc-950"
    >
      <p className="shrink-0 px-2.5 py-1.5 text-[11px] font-semibold tracking-wide text-zinc-400 dark:text-zinc-500">
        Settings
      </p>
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]",
        )}
      >
        {subItems}
      </div>
    </div>
  ) : null;

  if (collapsed) {
    return (
      <>
        <button
          ref={buttonRef}
          type="button"
          onClick={handleParentClick}
          title="Settings"
          aria-label="Settings"
          aria-expanded={flyoutOpen}
          className={cn(
            "group relative flex h-10 w-10 items-center justify-center rounded-xl text-[13px] transition-all duration-200",
            parentActive
              ? cn(sidebarAccentClass.bgSolid, "text-white", sidebarAccentClass.shadowMd)
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-100",
          )}
        >
          <Settings
            className={cn(
              "h-[17px] w-[17px] stroke-[1.75]",
              parentActive ? "stroke-[2]" : undefined,
            )}
            aria-hidden="true"
          />
        </button>
        {typeof document !== "undefined" && flyoutPanel
          ? createPortal(flyoutPanel, document.body)
          : null}
      </>
    );
  }

  return (
    <div className="flex min-h-0 flex-col gap-0.5">
      <button
        type="button"
        onClick={handleParentClick}
        aria-expanded={open}
        className={cn(
          "group relative flex h-10 w-full items-center gap-2.5 rounded-xl px-2.5 text-left text-[13px] transition-all duration-200",
          parentActive
            ? cn(
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
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
            parentActive
              ? cn(sidebarAccentClass.bgSoftMedium, sidebarAccentClass.text, "[&>svg]:stroke-[2]")
              : "text-zinc-500 group-hover:text-zinc-700 dark:text-zinc-400 dark:group-hover:text-zinc-200",
            "[&>svg]:h-[17px] [&>svg]:w-[17px] [&>svg]:stroke-[1.75]",
          )}
        >
          <Settings aria-hidden="true" />
        </span>
        <span className={cn("min-w-0 flex-1 leading-snug", parentActive ? "font-semibold" : "font-medium")}>
          Settings
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>
      {open ? (
        <div
          ref={submenuRef}
          className={cn("flex flex-col gap-0.5", submenuScrollClassName)}
        >
          {subItems}
        </div>
      ) : null}
    </div>
  );
}

function SettingsSidebarNavFallback({ inDrawer = false }: { inDrawer?: boolean }) {
  const collapsed = useContext(SidebarCollapseContext);
  return (
    <div
      className={cn(
        "flex items-center rounded-xl text-zinc-400",
        collapsed ? "h-10 w-10 justify-center" : "h-10 w-full gap-2.5 px-2.5",
        inDrawer && "w-full",
      )}
      aria-hidden
    >
      <Settings className="h-[17px] w-[17px]" />
      {collapsed ? null : <span className="text-[13px] font-medium">Settings</span>}
    </div>
  );
}

export function SettingsSidebarNav({ onNavigate, inDrawer = false }: SettingsSidebarNavProps) {
  return (
    <Suspense fallback={<SettingsSidebarNavFallback inDrawer={inDrawer} />}>
      <SettingsSidebarNavInner onNavigate={onNavigate} inDrawer={inDrawer} />
    </Suspense>
  );
}
