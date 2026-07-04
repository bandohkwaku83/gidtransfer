import { getAuthToken } from "@/lib/auth-demo";
import { apiCacheKey, cachedApiCall, invalidateApiCache, invalidateApiCacheByTags } from "@/lib/api-cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { authedJson, HttpError } from "@/lib/http";

export type ApiClient = {
  _id: string;
  name: string;
  email: string;
  contact: string;
  location: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ClientInput = {
  name: string;
  email: string;
  contact: string;
  location: string;
};

export type ListClientsResponse = {
  count: number;
  clients: ApiClient[];
};

/**
 * @deprecated Prefer {@link HttpError} from `@/lib/http`. Kept as a subclass so
 * existing `err instanceof ApiError` narrowing keeps working.
 */
export class ApiError extends HttpError {}

type RawClient = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  contact?: string;
  location?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

function readClientRecordId(raw: { _id?: unknown; id?: unknown }): string {
  const fromId = raw.id != null ? String(raw.id).trim() : "";
  if (fromId && fromId !== "undefined") return fromId;
  const fromMongoId = raw._id != null ? String(raw._id).trim() : "";
  if (fromMongoId && fromMongoId !== "undefined") return fromMongoId;
  return "";
}

function mapClient(raw: RawClient): ApiClient | null {
  const _id = readClientRecordId(raw);
  const name = raw.name?.trim() ?? "";
  if (!_id || !name) return null;
  return {
    _id,
    name,
    email: raw.email?.trim() ?? "",
    contact: (raw.phone ?? raw.contact ?? "").trim(),
    location: raw.location?.trim() ?? "",
    createdBy: raw.createdBy,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function toApiBody(input: Partial<ClientInput>): Record<string, string> {
  const body: Record<string, string> = {};
  if (input.name !== undefined) body.name = input.name.trim();
  if (input.email !== undefined) body.email = input.email.trim();
  if (input.contact !== undefined) {
    body.phone = input.contact.trim();
  }
  if (input.location !== undefined) body.location = input.location.trim();
  return body;
}

function requireAuthToken(): string {
  const token = getAuthToken();
  if (!token) {
    throw new ApiError("Not signed in. Please log in again.", 401, null);
  }
  return token;
}

export async function listClients(search = ""): Promise<ListClientsResponse> {
  requireAuthToken();
  const q = search.trim();
  const path = q
    ? `/api/clients?search=${encodeURIComponent(q)}`
    : "/api/clients";
  return cachedApiCall(
    apiCacheKey("GET", path),
    async () => {
      const res = await authedJson<{ count: number; clients: RawClient[] }>(
        path,
        { method: "GET" },
        "Failed to load clients",
        ApiError,
      );
      const clients = (res.clients ?? [])
        .map((raw) => mapClient(raw))
        .filter((client): client is ApiClient => client != null);
      return { count: res.count ?? clients.length, clients };
    },
    { ttlMs: 60_000, tags: [CACHE_TAGS.clients] },
  );
}

function invalidateClientCaches(): void {
  invalidateApiCacheByTags([CACHE_TAGS.clients, CACHE_TAGS.dashboard]);
  invalidateApiCache("/api/clients");
}

export async function loadClientNameById(): Promise<Map<string, string>> {
  try {
    const { clients } = await listClients();
    const map = new Map<string, string>();
    for (const c of clients) {
      const name = c.name.trim();
      if (!name) continue;
      map.set(c._id, name);
    }
    return map;
  } catch {
    return new Map();
  }
}

function requireMappedClient(raw: RawClient, context: string): ApiClient {
  const client = mapClient(raw);
  if (!client) {
    throw new ApiError(`Invalid client record (${context}).`, 500, raw);
  }
  return client;
}

export async function getClient(id: string): Promise<ApiClient> {
  const res = await authedJson<{ client: RawClient }>(
    `/api/clients/${encodeURIComponent(id)}`,
    { method: "GET" },
    "Failed to load client",
    ApiError,
  );
  return requireMappedClient(res.client, "getClient");
}

export async function createClient(input: ClientInput): Promise<ApiClient> {
  const res = await authedJson<{ client: RawClient }>(
    "/api/clients",
    {
      method: "POST",
      body: JSON.stringify(toApiBody(input)),
    },
    "Failed to create client",
    ApiError,
  );
  invalidateClientCaches();
  return requireMappedClient(res.client, "createClient");
}

export async function updateClient(
  id: string,
  input: Partial<ClientInput>,
): Promise<ApiClient> {
  const res = await authedJson<{ client: RawClient }>(
    `/api/clients/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: JSON.stringify(toApiBody(input)),
    },
    "Failed to update client",
    ApiError,
  );
  invalidateClientCaches();
  return requireMappedClient(res.client, "updateClient");
}

export async function deleteClient(id: string): Promise<ApiClient> {
  const res = await authedJson<{ client: RawClient }>(
    `/api/clients/${encodeURIComponent(id)}`,
    { method: "DELETE" },
    "Failed to delete client",
    ApiError,
  );
  invalidateClientCaches();
  return requireMappedClient(res.client, "deleteClient");
}
