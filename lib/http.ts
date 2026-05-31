import { apiUrl } from "@/lib/api";
import { clearAuth, getAuthToken } from "@/lib/auth-demo";

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

/** True when a 401 body indicates JWT/session failure (not upstream provider errors). */
function isAuthSession401(body: unknown): boolean {
  const msg = extractMessage(body, "").toLowerCase();
  if (!msg) return true;
  if (/openai|api key rejected|provider/i.test(msg)) return false;
  return /not authorized|token|session expired|log in again|account no longer/i.test(msg);
}

export type AuthedFetchOptions = {
  /** When false, a 401 clears auth but does not hard-navigate to `/login`. Default true. */
  redirectOn401?: boolean;
};

/**
 * Authenticated fetch — attaches `Authorization: Bearer <token>`, sets a default
 * `Content-Type: application/json` when there is a body, and centralises 401 handling
 * (`clearAuth()` + browser navigation to `/login`) for session failures only.
 *
 * Caller is responsible for parsing the response and throwing typed errors.
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

  const res = await fetch(apiUrl(path), { ...init, headers });

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
        window.location.href = "/login";
      }
    }
    throw new HttpError(message, 401, errBody);
  }

  return res;
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
  const body = await parseJson(res);
  if (!res.ok) {
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
      window.location.href = "/login";
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
