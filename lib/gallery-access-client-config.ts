/** UI bridge: photographer dashboard ↔ client link until the API persists access codes. */
const CONFIG_PREFIX = "gidostorage-gallery-access:";
const UNLOCK_PREFIX = "gidostorage-gallery-unlocked:";

export type GalleryAccessClientConfig = {
  enabled: boolean;
  pin: string;
};

export function galleryAccessConfigStorageKey(sessionId: string): string {
  return `${CONFIG_PREFIX}${sessionId}`;
}

export function galleryAccessUnlockStorageKey(sessionId: string): string {
  return `${UNLOCK_PREFIX}${sessionId}`;
}

export function readGalleryAccessClientConfig(
  sessionId: string,
): GalleryAccessClientConfig | null {
  if (typeof window === "undefined" || !sessionId) return null;
  try {
    const raw = window.localStorage.getItem(galleryAccessConfigStorageKey(sessionId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GalleryAccessClientConfig;
    if (typeof parsed.enabled !== "boolean" || typeof parsed.pin !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeGalleryAccessClientConfig(
  sessionId: string,
  config: GalleryAccessClientConfig,
): void {
  if (typeof window === "undefined" || !sessionId) return;
  try {
    window.localStorage.setItem(
      galleryAccessConfigStorageKey(sessionId),
      JSON.stringify(config),
    );
  } catch {
    /* ignore quota */
  }
}

export function isGalleryAccessUnlocked(sessionId: string): boolean {
  if (typeof window === "undefined" || !sessionId) return false;
  try {
    return window.sessionStorage.getItem(galleryAccessUnlockStorageKey(sessionId)) === "1";
  } catch {
    return false;
  }
}

export function markGalleryAccessUnlocked(sessionId: string): void {
  if (typeof window === "undefined" || !sessionId) return;
  try {
    window.sessionStorage.setItem(galleryAccessUnlockStorageKey(sessionId), "1");
  } catch {
    /* ignore */
  }
}

export function clearGalleryAccessUnlock(sessionId: string): void {
  if (typeof window === "undefined" || !sessionId) return;
  try {
    window.sessionStorage.removeItem(galleryAccessUnlockStorageKey(sessionId));
  } catch {
    /* ignore */
  }
}
