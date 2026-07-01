/** Photographer dashboard ↔ client link bridge for email gate until fully API-driven. */

const GATE_CONFIG_PREFIX = "gidostorage-gallery-email-gate:";
const SESSION_PREFIX = "gidostorage-gallery-email-session:";
const LOG_PREFIX = "gidostorage-gallery-email-log:";

export type GalleryEmailGateConfig = {
  enabled: boolean;
};

export type GalleryAccessEmailEntry = {
  email: string;
  accessedAt: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidGalleryAccessEmail(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && EMAIL_PATTERN.test(trimmed);
}

export function normalizeGalleryAccessEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function galleryEmailGateConfigKey(sessionId: string): string {
  return `${GATE_CONFIG_PREFIX}${sessionId}`;
}

export function galleryEmailSessionKey(sessionId: string): string {
  return `${SESSION_PREFIX}${sessionId}`;
}

export function galleryEmailLogKey(folderId: string): string {
  return `${LOG_PREFIX}${folderId}`;
}

export function readGalleryEmailGateConfig(
  sessionId: string,
): GalleryEmailGateConfig | null {
  if (typeof window === "undefined" || !sessionId) return null;
  try {
    const raw = window.localStorage.getItem(galleryEmailGateConfigKey(sessionId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GalleryEmailGateConfig;
    if (typeof parsed.enabled !== "boolean") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeGalleryEmailGateConfig(
  sessionId: string,
  config: GalleryEmailGateConfig,
): void {
  if (typeof window === "undefined" || !sessionId) return;
  try {
    window.localStorage.setItem(
      galleryEmailGateConfigKey(sessionId),
      JSON.stringify(config),
    );
  } catch {
    /* ignore quota */
  }
}

export function readGalleryEmailSession(sessionId: string): string | null {
  if (typeof window === "undefined" || !sessionId) return null;
  try {
    const email = window.sessionStorage
      .getItem(galleryEmailSessionKey(sessionId))
      ?.trim()
      .toLowerCase();
    return email || null;
  } catch {
    return null;
  }
}

export function writeGalleryEmailSession(sessionId: string, email: string): void {
  if (typeof window === "undefined" || !sessionId) return;
  const normalized = normalizeGalleryAccessEmail(email);
  if (!normalized) return;
  try {
    window.sessionStorage.setItem(galleryEmailSessionKey(sessionId), normalized);
  } catch {
    /* ignore quota */
  }
}

export function clearGalleryEmailSession(sessionId: string): void {
  if (typeof window === "undefined" || !sessionId) return;
  try {
    window.sessionStorage.removeItem(galleryEmailSessionKey(sessionId));
  } catch {
    /* ignore */
  }
}

export function hasGalleryEmailAccess(sessionId: string): boolean {
  return Boolean(readGalleryEmailSession(sessionId));
}

export function readGalleryAccessEmails(folderId: string): GalleryAccessEmailEntry[] {
  if (typeof window === "undefined" || !folderId) return [];
  try {
    const raw = window.localStorage.getItem(galleryEmailLogKey(folderId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const email = normalizeGalleryAccessEmail(
          String((row as GalleryAccessEmailEntry).email ?? ""),
        );
        const accessedAt = String((row as GalleryAccessEmailEntry).accessedAt ?? "").trim();
        if (!email || !accessedAt) return null;
        return { email, accessedAt };
      })
      .filter((row): row is GalleryAccessEmailEntry => Boolean(row))
      .sort((a, b) => b.accessedAt.localeCompare(a.accessedAt));
  } catch {
    return [];
  }
}

export function recordGalleryAccessEmail(folderId: string, email: string): GalleryAccessEmailEntry {
  const normalized = normalizeGalleryAccessEmail(email);
  const entry: GalleryAccessEmailEntry = {
    email: normalized,
    accessedAt: new Date().toISOString(),
  };
  if (typeof window === "undefined" || !folderId || !normalized) return entry;

  const existing = readGalleryAccessEmails(folderId);
  const withoutDup = existing.filter((row) => row.email !== normalized);
  const next = [entry, ...withoutDup].slice(0, 500);
  try {
    window.localStorage.setItem(galleryEmailLogKey(folderId), JSON.stringify(next));
    window.dispatchEvent(
      new CustomEvent("gidostorage-gallery-email-log", { detail: { folderId } }),
    );
  } catch {
    /* ignore quota */
  }
  return entry;
}
