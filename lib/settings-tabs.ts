import {
  CreditCard,
  ImageIcon,
  LifeBuoy,
  SlidersHorizontal,
  UserRound,
  Users,
} from "lucide-react";
import type { AuthUser } from "@/lib/auth-demo";
import { canManageTeam, canOpen, isOwner } from "@/lib/studio-access";

export const SETTINGS_TABS = [
  {
    id: "profile",
    label: "Profile",
    description: "Studio identity, contact details, and account",
    icon: UserRound,
  },
  {
    id: "team",
    label: "Team",
    description: "Studio assistants and menu access",
    icon: Users,
  },
  {
    id: "billing",
    label: "Billing",
    description: "Plan, storage, and gallery limits",
    icon: CreditCard,
  },
  {
    id: "watermark",
    label: "Watermark",
    description: "Add your logo to photos clients download",
    icon: ImageIcon,
  },
  {
    id: "gallery",
    label: "Gallery defaults",
    description: "Covers and client preview behavior",
    icon: SlidersHorizontal,
  },
  {
    id: "support",
    label: "Help & support",
    description: "Contact us or report an issue",
    icon: LifeBuoy,
  },
] as const;

export type SettingsTabId = (typeof SETTINGS_TABS)[number]["id"];

export function isSettingsTabId(value: string | null | undefined): value is SettingsTabId {
  return SETTINGS_TABS.some((t) => t.id === value);
}

export function settingsTabMeta(id: SettingsTabId) {
  return SETTINGS_TABS.find((t) => t.id === id)!;
}

export function settingsTabHref(tab: SettingsTabId): string {
  return `/dashboard/settings?tab=${tab}`;
}

export function activeSettingsTabFromSearch(
  tabParam: string | null | undefined,
): SettingsTabId {
  return isSettingsTabId(tabParam) ? tabParam : "profile";
}

/** Settings tabs visible for the signed-in user (staff never see Billing/Team). */
export function visibleSettingsTabs(user: AuthUser | null | undefined) {
  return SETTINGS_TABS.filter((tab) => {
    if (tab.id === "billing") {
      return isOwner(user) && canOpen(user, "billing");
    }
    if (tab.id === "team") {
      return canManageTeam(user);
    }
    if (!isOwner(user) && !canOpen(user, "settings")) {
      return false;
    }
    return true;
  });
}
