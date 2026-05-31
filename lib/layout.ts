import { cn, type ClassValue } from "@/lib/utils";

/** Centered dashboard content — scales up on xl / 2xl viewports. */
export const DASHBOARD_PAGE =
  "mx-auto w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[90rem]";

/** Landing / marketing sections with horizontal padding. */
export const MARKETING_CONTAINER =
  "mx-auto w-full max-w-6xl px-4 sm:px-6 xl:max-w-7xl 2xl:max-w-[90rem]";

/** Card grids for galleries and similar tiles. */
export const GALLERY_CARD_GRID =
  "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4";

export const GALLERY_CARD_GRID_LOOSE =
  "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4";

export function dashboardPage(...extra: ClassValue[]) {
  return cn(DASHBOARD_PAGE, extra);
}

export function marketingContainer(...extra: ClassValue[]) {
  return cn(MARKETING_CONTAINER, extra);
}
