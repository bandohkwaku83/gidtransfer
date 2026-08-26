import type { AuthUser } from "@/lib/auth-demo";

/** Studio sidebar / settings menu keys from GET /api/auth/me and /api/studio/meta. */
export type StudioMenuKey =
  | "dashboard"
  | "clients"
  | "galleries"
  | "bookings"
  | "income"
  | "collaborations"
  | "storage"
  | "trash"
  | "settings"
  | "billing"
  | "team";

export const OWNER_MENUS: StudioMenuKey[] = [
  "dashboard",
  "clients",
  "galleries",
  "bookings",
  "income",
  "collaborations",
  "storage",
  "trash",
  "settings",
  "billing",
  "team",
];

const MENU_HREFS: Record<StudioMenuKey, string> = {
  dashboard: "/dashboard",
  clients: "/dashboard/clients",
  galleries: "/dashboard/galleries",
  bookings: "/dashboard/schedules",
  income: "/dashboard/income",
  collaborations: "/collaborations",
  storage: "/dashboard/storage",
  trash: "/dashboard/galleries/trash",
  settings: "/dashboard/settings",
  billing: "/dashboard/settings?tab=billing",
  team: "/dashboard/settings?tab=team",
};

export function isOwner(
  user: { accountType?: string | null } | null | undefined,
): boolean {
  if (!user) return false;
  // Legacy sessions without accountType are studio owners.
  return user.accountType == null || user.accountType === "owner";
}

export function isStudioMember(
  user: { accountType?: string | null } | null | undefined,
): boolean {
  return user?.accountType === "member";
}

/** Owner on Premium with studioTeam — Settings → Team. */
export function canManageTeam(
  user:
    | {
        accountType?: string | null;
        plan?: { features?: Record<string, boolean | undefined> | null } | null;
      }
    | null
    | undefined,
): boolean {
  return isOwner(user) && user?.plan?.features?.studioTeam === true;
}

export function menusFor(
  user:
    | {
        accountType?: string | null;
        membership?: { menuKeys?: string[] | null } | null;
      }
    | null
    | undefined,
): StudioMenuKey[] {
  if (!user) return [];
  if (isOwner(user)) return OWNER_MENUS;
  const keys = user.membership?.menuKeys;
  if (!Array.isArray(keys)) return [];
  return keys.filter((k): k is StudioMenuKey =>
    (OWNER_MENUS as string[]).includes(k),
  );
}

export function canOpen(
  user:
    | {
        accountType?: string | null;
        membership?: { menuKeys?: string[] | null } | null;
      }
    | null
    | undefined,
  menuKey: StudioMenuKey | string,
): boolean {
  if (!user) return false;
  if (isOwner(user)) return true;
  return user.membership?.menuKeys?.includes(menuKey) === true;
}

export function hrefForMenuKey(menuKey: StudioMenuKey): string {
  return MENU_HREFS[menuKey];
}

/** First allowed app destination after staff login (prefer dashboard when granted). */
export function firstAllowedHref(
  user:
    | {
        accountType?: string | null;
        membership?: { menuKeys?: string[] | null } | null;
      }
    | null
    | undefined,
): string {
  const keys = menusFor(user);
  if (keys.includes("dashboard")) return hrefForMenuKey("dashboard");
  const first = keys[0];
  if (first) return hrefForMenuKey(first);
  return "/dashboard";
}

/**
 * Resolve which studio menu key (if any) a pathname+search maps to.
 * Returns null for paths that are not menu-gated (e.g. onboarding, billing callback).
 */
export function menuKeyForPath(
  pathname: string,
  search = "",
): StudioMenuKey | null {
  const path = pathname.replace(/\/$/, "") || "/";
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const tab = params.get("tab");

  if (path.startsWith("/collaborations")) return "collaborations";

  if (path.startsWith("/dashboard/settings")) {
    if (tab === "billing") return "billing";
    if (tab === "team") return "team";
    return "settings";
  }

  if (path === "/dashboard" || path === "/dashboard/") return "dashboard";
  if (path.startsWith("/dashboard/clients")) return "clients";
  if (path.startsWith("/dashboard/schedules")) return "bookings";
  if (path.startsWith("/dashboard/income")) return "income";
  if (path.startsWith("/dashboard/galleries/trash") || path === "/trash") {
    return "trash";
  }
  if (
    path.startsWith("/dashboard/galleries") ||
    path.startsWith("/dashboard/folder")
  ) {
    return "galleries";
  }
  if (path.startsWith("/dashboard/storage")) return "storage";

  // SMS is an owner-only chrome item (not in assignable menuKeys).
  if (path.startsWith("/dashboard/sms")) return null;

  if (path.startsWith("/billing")) return "billing";

  return null;
}

export function canAccessPath(
  user: AuthUser | null | undefined,
  pathname: string,
  search = "",
): boolean {
  if (!user) return false;
  if (isOwner(user)) {
    if (pathname.startsWith("/dashboard/settings") && search.includes("tab=team")) {
      return canManageTeam(user);
    }
    return true;
  }

  // Staff never see Billing or Team.
  if (pathname.startsWith("/dashboard/settings")) {
    const params = new URLSearchParams(
      search.startsWith("?") ? search.slice(1) : search,
    );
    const tab = params.get("tab");
    if (tab === "billing" || tab === "team") return false;
  }
  if (pathname.startsWith("/billing")) return false;
  if (pathname.startsWith("/dashboard/sms")) return false;

  const key = menuKeyForPath(pathname, search);
  if (!key) return true;
  return canOpen(user, key);
}
