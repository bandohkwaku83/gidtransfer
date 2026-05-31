import type { LucideIcon } from "lucide-react";
import {
  CreditCard,
  Gift,
  ImageIcon,
  LifeBuoy,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";

export const SETTINGS_TABS = [
  {
    id: "profile",
    label: "Profile",
    description: "Studio profile, workspace overview, and account",
    icon: UserRound,
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
    id: "refer",
    label: "Refer a friend",
    description: "Invite link and rewards",
    icon: Gift,
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
