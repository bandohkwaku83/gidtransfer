type CacheEntry<T> = {
  data: T;
  expiresAt: number;
  staleAt: number;
  tags: string[];
};

export type ApiCacheOptions = {
  /** Fresh TTL — served without revalidation. Default 30s. */
  ttlMs?: number;
  /** Stale window — return cached data while revalidating in background. Default 2× ttlMs. */
  staleMs?: number;
  /** Resource tags for targeted invalidation. */
  tags?: string[];
  /** Bypass cache read/write (still dedupes in-flight). */
  force?: boolean;
};

const DEFAULT_TTL_MS = 30_000;

const cache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();
const listeners = new Set<(key: string) => void>();

function readEntry<T>(key: string, now: number): CacheEntry<T> | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (entry.staleAt <= now) {
    cache.delete(key);
    return null;
  }
  return entry;
}

function writeEntry<T>(
  key: string,
  data: T,
  ttlMs: number,
  staleMs: number,
  tags: string[],
): void {
  const now = Date.now();
  cache.set(key, {
    data,
    expiresAt: now + ttlMs,
    staleAt: now + staleMs,
    tags,
  });
  for (const listener of listeners) listener(key);
}

function notify(key: string): void {
  for (const listener of listeners) listener(key);
}

/**
 * In-memory GET cache with request deduplication and stale-while-revalidate.
 * Keys should include method + path (and auth scope if responses vary by user).
 */
export async function cachedApiCall<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: ApiCacheOptions = {},
): Promise<T> {
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
  const staleMs = options.staleMs ?? ttlMs * 2;
  const tags = options.tags ?? [];
  const force = options.force === true;
  const now = Date.now();

  if (!force) {
    const entry = readEntry<T>(key, now);
    if (entry && entry.expiresAt > now) {
      return entry.data;
    }
    if (entry) {
      void revalidate(key, fetcher, ttlMs, staleMs, tags);
      return entry.data;
    }
  }

  const pending = inFlight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const promise = fetcher()
    .then((data) => {
      writeEntry(key, data, ttlMs, staleMs, tags);
      inFlight.delete(key);
      return data;
    })
    .catch((err) => {
      inFlight.delete(key);
      throw err;
    });

  inFlight.set(key, promise);
  return promise;
}

async function revalidate<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number,
  staleMs: number,
  tags: string[],
): Promise<void> {
  if (inFlight.has(key)) return;
  const promise = fetcher()
    .then((data) => {
      writeEntry(key, data, ttlMs, staleMs, tags);
      inFlight.delete(key);
    })
    .catch(() => {
      inFlight.delete(key);
    });
  inFlight.set(key, promise);
}

/** Merge a patch into a cached entry (incremental sync after mutations). */
export function patchApiCache<T>(key: string, patch: (current: T | undefined) => T): void {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  const next = patch(entry?.data);
  const now = Date.now();
  const ttlMs = DEFAULT_TTL_MS;
  cache.set(key, {
    data: next,
    expiresAt: now + ttlMs,
    staleAt: now + ttlMs * 2,
    tags: entry?.tags ?? [],
  });
  notify(key);
}

export function subscribeApiCache(listener: (key: string) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Drop cached entries matching a path substring. */
export function invalidateApiCache(prefix?: string): void {
  if (!prefix) {
    cache.clear();
    inFlight.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.includes(prefix)) cache.delete(key);
  }
}

/** Drop cached entries that carry any of the given tags. */
export function invalidateApiCacheByTags(tags: string[]): void {
  const wanted = new Set(tags.filter(Boolean));
  if (wanted.size === 0) return;
  for (const [key, entry] of cache.entries()) {
    if (entry.tags.some((tag) => wanted.has(tag))) {
      cache.delete(key);
    }
  }
}

export function apiCacheKey(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}

export function readApiCache<T>(key: string): T | undefined {
  const entry = readEntry<T>(key, Date.now());
  return entry?.data;
}
