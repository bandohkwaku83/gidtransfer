const STORAGE_PREFIX = "gidostorage_dashboard_tour_v1:";

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId || "anon"}`;
}

export function hasSeenDashboardTour(userId: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(storageKey(userId)) === "1";
  } catch {
    return true;
  }
}

export function markDashboardTourSeen(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(userId), "1");
  } catch {
    // storage may be unavailable (private mode, quota); tour just re-shows
  }
}

export function clearDashboardTourSeen(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey(userId));
  } catch {
    // ignore
  }
}
