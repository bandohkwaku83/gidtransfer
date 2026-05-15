import { authedFetch, extractMessage, HttpError, parseJson } from "@/lib/http";

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

export async function listClients(search = ""): Promise<ListClientsResponse> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  const res = await authedFetch(`/api/clients${qs}`, { method: "GET" });
  const body = await parseJson(res);
  if (!res.ok) {
    throw new ApiError(
      extractMessage(body, `Failed to load clients (${res.status})`),
      res.status,
      body,
    );
  }
  const data = body as ListClientsResponse;
  return {
    count: data?.count ?? data?.clients?.length ?? 0,
    clients: Array.isArray(data?.clients) ? data.clients : [],
  };
}

export async function getClient(id: string): Promise<ApiClient> {
  const res = await authedFetch(`/api/clients/${encodeURIComponent(id)}`, { method: "GET" });
  const body = await parseJson(res);
  if (!res.ok) {
    throw new ApiError(
      extractMessage(body, `Failed to load client (${res.status})`),
      res.status,
      body,
    );
  }
  if (body && typeof body === "object" && "client" in body) {
    return (body as { client: ApiClient }).client;
  }
  return body as ApiClient;
}

export async function createClient(input: ClientInput): Promise<ApiClient> {
  const res = await authedFetch("/api/clients", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const body = await parseJson(res);
  if (!res.ok) {
    throw new ApiError(
      extractMessage(body, `Failed to create client (${res.status})`),
      res.status,
      body,
    );
  }
  if (body && typeof body === "object" && "client" in body) {
    return (body as { client: ApiClient }).client;
  }
  return body as ApiClient;
}

export async function updateClient(
  id: string,
  input: Partial<ClientInput>,
): Promise<ApiClient> {
  const res = await authedFetch(`/api/clients/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  const body = await parseJson(res);
  if (!res.ok) {
    throw new ApiError(
      extractMessage(body, `Failed to update client (${res.status})`),
      res.status,
      body,
    );
  }
  return (body as { client: ApiClient }).client;
}

export async function deleteClient(id: string): Promise<ApiClient> {
  const res = await authedFetch(`/api/clients/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  const body = await parseJson(res);
  if (!res.ok) {
    throw new ApiError(
      extractMessage(body, `Failed to delete client (${res.status})`),
      res.status,
      body,
    );
  }
  return (body as { client: ApiClient }).client;
}
