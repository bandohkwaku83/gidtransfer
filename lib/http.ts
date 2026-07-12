import { apiUrl } from "@/lib/api";
import { recordApiMetric } from "@/lib/api-metrics";
import { clearAuth, getAuthToken } from "@/lib/auth-demo";
import { photographerAuthUrl, photographerSignOutUrl } from "@/lib/studio-url";

/**
 * Base class for failures returned by an authenticated API call.
 *
 * Specific modules (clients, folders, share gallery, etc.) extend this so consumer code
 * can still narrow with `err instanceof FoldersApiError` if it wants module-specific
 * handling. New consumers should prefer `instanceof HttpError` when only the status /
 * message matters.
 */
export class HttpError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = new.target.name;
    this.status = status;
    this.body = body;
  }
}

/** Thrown when a protected API responds with 403 EMAIL_NOT_VERIFIED. */
export class EmailNotVerifiedError extends HttpError {}

const RETRYABLE_STATUSES = new Set([0, 408, 429, 502, 503, 504]);
const MAX_RETRIES = 2;
const RETRY_BASE_MS = 300;

const inFlightGet = new Map<string, Promise<Response>>();

/** Safe JSON parse — returns null on non-JSON / empty bodies. */
export async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Extract a human-readable error string from a JSON error body, falling back when no
 * recognisable field is present. Looks at `message`, `error`, `detail` (in order) so the
 * function works with both this app's API and other common backend conventions.
 */
export function extractMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object") {
    const o = body as Record<string, unknown>;
    for (const k of ["message", "error", "detail"] as const) {
      const v = o[k];
      if (typeof v === "string" && v.trim()) return v;
    }
  }
  return fallback;
}

/** True when a 403 body indicates the account email is not verified yet. */
function isEmailNotVerified403(body: unknown): boolean {
  return (
    body !== null &&
    typeof body === "object" &&
    (body as { code?: string }).code === "EMAIL_NOT_VERIFIED"
  );
}

function throwIfEmailNotVerified(status: number, body: unknown): void {
  if (status !== 403 || !isEmailNotVerified403(body)) return;
  if (
    typeof window !== "undefined" &&
    !window.location.pathname.startsWith("/verify-email")
  ) {
    window.location.href = photographerAuthUrl("/verify-email");
  }
  throw new EmailNotVerifiedError(
    extractMessage(body, "Email verification required"),
    403,
    body,
  );
}

/** True when a 401 body indicates JWT/session failure (not upstream provider errors). */
function isAuthSession401(body: unknown): boolean {
  const msg = extractMessage(body, "").toLowerCase();
  if (!msg) return true;
  if (/openai|api key rejected|provider/i.test(msg)) return false;
  return /not authorized|token|session expired|session ended|log in again|account no longer/i.test(msg);
}

export type AuthedFetchOptions = {
  /** When false, a 401 clears auth but does not hard-navigate to `/login`. Default true. */
  redirectOn401?: boolean;
  /** Override retry count for transient failures. Default 2. */
  retries?: number;
};

function requestDedupeKey(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries: number,
): Promise<{ res: Response; attempts: number }> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    try {
      const res = await fetch(url, init);
      recordApiMetric({
        path: url.replace(/^https?:\/\/[^/]+/, ""),
        method: (init.method ?? "GET").toUpperCase(),
        durationMs: (typeof performance !== "undefined" ? performance.now() : Date.now()) - started,
        status: res.status,
        cached: false,
        retries: attempt,
      });
      if (RETRYABLE_STATUSES.has(res.status) && attempt < retries) {
        await sleep(RETRY_BASE_MS * 2 ** attempt);
        continue;
      }
      return { res, attempts: attempt };
    } catch (err) {
      lastError = err;
      recordApiMetric({
        path: url.replace(/^https?:\/\/[^/]+/, ""),
        method: (init.method ?? "GET").toUpperCase(),
        durationMs: (typeof performance !== "undefined" ? performance.now() : Date.now()) - started,
        status: 0,
        cached: false,
        retries: attempt,
      });
      if (attempt < retries) {
        await sleep(RETRY_BASE_MS * 2 ** attempt);
        continue;
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Network request failed.");
}

/**
 * Authenticated fetch — attaches `Authorization: Bearer <token>`, sets a default
 * `Content-Type: application/json` when there is a body, and centralises 401 handling
 * (`clearAuth()` + browser navigation to `/login`) for session failures only.
 *
 * GET requests are deduplicated while in-flight. Transient upstream failures retry with backoff.
 */
export async function authedFetch(
  path: string,
  init: RequestInit = {},
  options: AuthedFetchOptions = {},
): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(init.headers ?? {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (
    init.body &&
    !(init.body instanceof FormData) &&
    !(init.body instanceof Blob) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const method = (init.method ?? "GET").toUpperCase();
  const retries = options.retries ?? MAX_RETRIES;
  const dedupeKey = requestDedupeKey(method, path);

  const execute = async (): Promise<Response> => {
    const fetchInit: RequestInit = {
      ...init,
      headers,
      method,
      ...(method === "GET" && init.cache === undefined ? { cache: "no-store" } : {}),
    };
    const { res } = await fetchWithRetry(apiUrl(path), fetchInit, retries);

    if (res.status === 401) {
      const errBody = await parseJson(res.clone());
      const message = extractMessage(
        errBody,
        token
          ? "Your session has expired. Please log in again."
          : "Not signed in. Please log in again.",
      );
      const sessionFailure = isAuthSession401(errBody);
      if (token && sessionFailure && options.redirectOn401 !== false) {
        clearAuth();
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/login")
        ) {
          window.location.href = photographerSignOutUrl();
        }
      }
      throw new HttpError(message, 401, errBody);
    }

    if (res.status === 403) {
      const errBody = await parseJson(res.clone());
      throwIfEmailNotVerified(403, errBody);
    }

    return res;
  };

  if (method === "GET") {
    const pending = inFlightGet.get(dedupeKey);
    if (pending) return pending;
    const promise = execute().finally(() => inFlightGet.delete(dedupeKey));
    inFlightGet.set(dedupeKey, promise);
    return promise;
  }

  return execute();
}

type HttpErrorCtor<E extends HttpError> = new (message: string, status: number, body: unknown) => E;

/**
 * Convenience: do an authenticated request, parse JSON, throw a typed error on non-2xx.
 *
 * @example
 * const { clients } = await authedJson<{ clients: ApiClient[] }>("/api/clients", { method: "GET" }, "Failed to load clients");
 */
export async function authedJson<T>(
  path: string,
  init: RequestInit = {},
  fallbackError = "Request failed",
  ErrorCtor: HttpErrorCtor<HttpError> = HttpError,
  options: AuthedFetchOptions = {},
): Promise<T> {
  const res = await authedFetch(path, init, options);
  let body = await parseJson(res);

  // Backend may respond 304 (ETag) with an empty body — refetch without cache.
  if (res.status === 304) {
    const retry = await authedFetch(
      path,
      { ...init, cache: "no-store" },
      { ...options, retries: 0 },
    );
    if (!retry.ok) {
      const errBody = body;
      throwIfEmailNotVerified(retry.status, errBody);
      throw new ErrorCtor(
        extractMessage(errBody, `${fallbackError} (${retry.status})`),
        retry.status,
        errBody,
      );
    }
    body = await parseJson(retry);
  }

  if (!res.ok && res.status !== 304) {
    throwIfEmailNotVerified(res.status, body);
    throw new ErrorCtor(
      extractMessage(body, `${fallbackError} (${res.status})`),
      res.status,
      body,
    );
  }
  return body as T;
}

export type UploadProgressHandler = (
  loaded: number,
  total: number,
  lengthComputable: boolean,
) => void;

function parseJsonText(text: string): unknown {
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function handleAuth401(
  status: number,
  body: unknown,
  token: string | null,
  redirectOn401: boolean,
): void {
  if (status !== 401) return;
  const message = extractMessage(
    body,
    token
      ? "Your session has expired. Please log in again."
      : "Not signed in. Please log in again.",
  );
  const sessionFailure = isAuthSession401(body);
  if (token && sessionFailure && redirectOn401) {
    clearAuth();
    if (
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login")
    ) {
      window.location.href = photographerSignOutUrl();
    }
  }
  throw new HttpError(message, 401, body);
}

/**
 * Authenticated multipart upload with optional upload progress (XHR).
 * Use for large gallery photo / final batches where fetch lacks progress events.
 */
export async function authedFormUpload<T>(
  path: string,
  form: FormData,
  options: {
    method?: "POST" | "PUT" | "PATCH";
    fallbackError?: string;
    ErrorCtor?: HttpErrorCtor<HttpError>;
    redirectOn401?: boolean;
    onUploadProgress?: UploadProgressHandler;
  } = {},
): Promise<T> {
  const {
    method = "POST",
    fallbackError = "Upload failed",
    ErrorCtor = HttpError,
    redirectOn401 = true,
    onUploadProgress,
  } = options;

  const token = getAuthToken();
  const url = apiUrl(path);

  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    if (onUploadProgress) {
      xhr.upload.onprogress = (ev) => {
        onUploadProgress(ev.loaded, ev.total, ev.lengthComputable);
      };
    }

    xhr.onload = () => {
      const body = parseJsonText(xhr.responseText);
      if (xhr.status === 401) {
        try {
          handleAuth401(xhr.status, body, token, redirectOn401);
        } catch (e) {
          reject(e);
        }
        return;
      }
      try {
        throwIfEmailNotVerified(xhr.status, body);
      } catch (e) {
        reject(e);
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(
          new ErrorCtor(
            extractMessage(body, `${fallbackError} (${xhr.status})`),
            xhr.status,
            body,
          ),
        );
        return;
      }
      resolve(body as T);
    };

    xhr.onerror = () => {
      reject(new ErrorCtor("Network error during upload.", 0, null));
    };

    xhr.send(form);
  });
}

/** Run independent API calls in parallel with shared error isolation. */
export async function batchApiCalls<T extends readonly unknown[] | []>(
  calls: { [K in keyof T]: () => Promise<T[K]> },
): Promise<T> {
  return Promise.all(calls.map((call) => call())) as Promise<T>;
}
