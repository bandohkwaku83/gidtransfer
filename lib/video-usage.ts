/** Last-known video usage — API rarely exposes this except via VIDEO_LIMIT_REACHED. */

const VIDEO_USAGE_KEY = "gidostorage_video_usage";

export type VideoUsageSnapshot = {
  usedBytes: number;
  limitBytes: number;
  updatedAt: number;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function rememberVideoUsage(input: {
  usedBytes: number | null | undefined;
  limitBytes: number | null | undefined;
}): void {
  if (typeof window === "undefined") return;
  const usedBytes = input.usedBytes;
  const limitBytes = input.limitBytes;
  if (usedBytes == null || !Number.isFinite(usedBytes) || usedBytes < 0) return;
  if (limitBytes == null || !Number.isFinite(limitBytes) || limitBytes <= 0) return;
  const snapshot: VideoUsageSnapshot = {
    usedBytes,
    limitBytes,
    updatedAt: Date.now(),
  };
  try {
    window.localStorage.setItem(VIDEO_USAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore */
  }
}

export function readVideoUsage(): VideoUsageSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(VIDEO_USAGE_KEY);
    if (!raw) return null;
    const o = asRecord(JSON.parse(raw));
    if (!o) return null;
    const usedBytes = readNumber(o.usedBytes);
    const limitBytes = readNumber(o.limitBytes);
    if (usedBytes == null || usedBytes < 0) return null;
    if (limitBytes == null || limitBytes <= 0) return null;
    return {
      usedBytes,
      limitBytes,
      updatedAt: readNumber(o.updatedAt) ?? 0,
    };
  } catch {
    return null;
  }
}

export function clearVideoUsage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(VIDEO_USAGE_KEY);
  } catch {
    /* ignore */
  }
}
