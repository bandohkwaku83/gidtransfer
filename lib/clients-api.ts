import { getAuthToken } from "@/lib/auth-demo";
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
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  contact?: string;
  location: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

function mapClient(raw: RawClient): ApiClient {
  return {
    _id: String(raw._id),
    name: raw.name,
    email: raw.email?.trim() ?? "",
    contact: (raw.phone ?? raw.contact ?? "").trim(),
    location: raw.location,
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
  const res = await authedJson<{ count: number; clients: RawClient[] }>(
    path,
    { method: "GET" },
    "Failed to load clients",
    ApiError,
  );
  const clients = (res.clients ?? []).map(mapClient);
  return { count: res.count ?? clients.length, clients };
}

export async function getClient(id: string): Promise<ApiClient> {
  const res = await authedJson<{ client: RawClient }>(
    `/api/clients/${encodeURIComponent(id)}`,
    { method: "GET" },
    "Failed to load client",
    ApiError,
  );
  return mapClient(res.client);
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
  return mapClient(res.client);
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
  return mapClient(res.client);
}

export async function deleteClient(id: string): Promise<ApiClient> {
  const res = await authedJson<{ client: RawClient }>(
    `/api/clients/${encodeURIComponent(id)}`,
    { method: "DELETE" },
    "Failed to delete client",
    ApiError,
  );
  return mapClient(res.client);
}
