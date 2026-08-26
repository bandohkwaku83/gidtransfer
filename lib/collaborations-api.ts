import { getAuth } from "@/lib/auth-demo";
import { HttpError, authedJson } from "@/lib/http";

export class CollaborationsApiError extends HttpError {}

export type CollaborationRole = "owner" | "editor" | "viewer";
export type CollaborationStatus = "active" | "archived";
export type MemberStatus = "active" | "invited" | "declined" | "removed";

export type CollaborationPerson = {
  id: string;
  email: string;
  name: string;
  companySlug?: string | null;
};

export type CollaborationWorkspace = {
  id: string;
  name: string;
  description: string | null;
  status: CollaborationStatus;
  ownerId: string;
  owner: CollaborationPerson | null;
  linkedGalleryId: string | null;
  role: CollaborationRole;
  memberCount: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CollaborationMember = {
  id: string;
  workspaceId: string;
  userId: string | null;
  user: CollaborationPerson | null;
  email: string;
  role: CollaborationRole;
  status: MemberStatus;
  invitedById: string | null;
  inviteExpiresAt: string | null;
  acceptedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CollaborationSeats = {
  used: number;
  max: number | null;
};

export type CollaborationFolder = {
  id: string;
  workspaceId: string;
  name: string;
  sortOrder: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CollaborationAsset = {
  id: string;
  workspaceId: string;
  folderId: string | null;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  isVideo: boolean;
  sortOrder: number;
  url: string;
  thumbUrl: string | null;
  previewUrl: string | null;
  uploadedById: string | null;
  uploadedBy: CollaborationPerson | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CollaborationPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

export type PendingCollaborationInvite = {
  member: CollaborationMember;
  workspace: Pick<
    CollaborationWorkspace,
    "id" | "name" | "role" | "owner" | "description" | "status"
  > &
    Partial<CollaborationWorkspace>;
  expired: boolean;
};

const ROLE_RANK: Record<CollaborationRole, number> = {
  viewer: 1,
  editor: 2,
  owner: 3,
};

export function collaborationRoleAtLeast(
  role: string | null | undefined,
  min: CollaborationRole,
): boolean {
  const key = (role ?? "").toLowerCase() as CollaborationRole;
  return (ROLE_RANK[key] ?? 0) >= ROLE_RANK[min];
}

export function collaborationRoleLabel(role: string | null | undefined): string {
  if (role === "owner") return "Owner";
  if (role === "editor") return "Editor";
  if (role === "viewer") return "Viewer";
  return role?.trim() || "Member";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function readId(raw: Record<string, unknown>): string {
  return readString(raw.id) ?? readString(raw._id) ?? "";
}

function mapPerson(raw: unknown): CollaborationPerson | null {
  const obj = asRecord(raw);
  if (!obj) return null;
  const id = readId(obj);
  const email = readString(obj.email) ?? "";
  if (!id && !email) return null;
  return {
    id: id || email,
    email,
    name: readString(obj.name) ?? (email || "Member"),
    companySlug: readString(obj.companySlug),
  };
}

function mapWorkspace(raw: unknown): CollaborationWorkspace | null {
  const obj = asRecord(raw);
  if (!obj) return null;
  const id = readId(obj);
  const name = readString(obj.name);
  if (!id || !name) return null;
  const roleRaw = (readString(obj.role) ?? "viewer").toLowerCase();
  let role: CollaborationRole =
    roleRaw === "owner" || roleRaw === "editor" || roleRaw === "viewer"
      ? roleRaw
      : "viewer";
  const statusRaw = (readString(obj.status) ?? "active").toLowerCase();
  const status: CollaborationStatus = statusRaw === "archived" ? "archived" : "active";
  const ownerId = readString(obj.ownerId) ?? "";
  // Some list payloads omit role:"owner" for the creator — trust ownerId match.
  const myId = getAuth()?.user?._id?.trim() || "";
  if (myId && ownerId && myId === ownerId) {
    role = "owner";
  }
  return {
    id,
    name,
    description: readString(obj.description),
    status,
    ownerId,
    owner: mapPerson(obj.owner),
    linkedGalleryId: readString(obj.linkedGalleryId),
    role,
    memberCount: readNumber(obj.memberCount) ?? 0,
    createdAt: readString(obj.createdAt),
    updatedAt: readString(obj.updatedAt),
  };
}

function mapMember(raw: unknown): CollaborationMember | null {
  const obj = asRecord(raw);
  if (!obj) return null;
  const id = readId(obj);
  if (!id) return null;
  const roleRaw = (readString(obj.role) ?? "viewer").toLowerCase();
  const role: CollaborationRole =
    roleRaw === "owner" || roleRaw === "editor" || roleRaw === "viewer"
      ? roleRaw
      : "viewer";
  const statusRaw = (readString(obj.status) ?? "active").toLowerCase();
  const status: MemberStatus =
    statusRaw === "invited" ||
    statusRaw === "declined" ||
    statusRaw === "removed" ||
    statusRaw === "active"
      ? statusRaw
      : "active";
  return {
    id,
    workspaceId: readString(obj.workspaceId) ?? "",
    userId: readString(obj.userId),
    user: mapPerson(obj.user),
    email: readString(obj.email) ?? mapPerson(obj.user)?.email ?? "",
    role,
    status,
    invitedById: readString(obj.invitedById),
    inviteExpiresAt: readString(obj.inviteExpiresAt),
    acceptedAt: readString(obj.acceptedAt),
    createdAt: readString(obj.createdAt),
    updatedAt: readString(obj.updatedAt),
  };
}

function mapFolder(raw: unknown): CollaborationFolder | null {
  const obj = asRecord(raw);
  if (!obj) return null;
  const id = readId(obj);
  const name = readString(obj.name);
  if (!id || !name) return null;
  return {
    id,
    workspaceId: readString(obj.workspaceId) ?? "",
    name,
    sortOrder: readNumber(obj.sortOrder) ?? 0,
    createdAt: readString(obj.createdAt),
    updatedAt: readString(obj.updatedAt),
  };
}

function mapAsset(raw: unknown): CollaborationAsset | null {
  const obj = asRecord(raw);
  if (!obj) return null;
  const id = readId(obj);
  if (!id) return null;
  const mime = readString(obj.mimeType) ?? "application/octet-stream";
  const isVideo =
    obj.isVideo === true || mime.toLowerCase().startsWith("video/");
  return {
    id,
    workspaceId: readString(obj.workspaceId) ?? "",
    folderId: readString(obj.folderId),
    originalFilename: readString(obj.originalFilename) ?? "file",
    mimeType: mime,
    sizeBytes: readNumber(obj.sizeBytes) ?? 0,
    isVideo,
    sortOrder: readNumber(obj.sortOrder) ?? 0,
    url: readString(obj.url) ?? "",
    thumbUrl: readString(obj.thumbUrl),
    previewUrl: readString(obj.previewUrl),
    uploadedById: readString(obj.uploadedById),
    uploadedBy: mapPerson(obj.uploadedBy),
    createdAt: readString(obj.createdAt),
    updatedAt: readString(obj.updatedAt),
  };
}

function mapPagination(raw: unknown): CollaborationPagination {
  const obj = asRecord(raw);
  return {
    page: readNumber(obj?.page) ?? 1,
    limit: readNumber(obj?.limit) ?? 50,
    total: readNumber(obj?.total) ?? 0,
    totalPages: readNumber(obj?.totalPages) ?? 1,
    hasMore: obj?.hasMore === true,
  };
}

function mapSeats(raw: unknown): CollaborationSeats {
  const obj = asRecord(raw);
  return {
    used: readNumber(obj?.used) ?? 0,
    max: readNumber(obj?.max),
  };
}

function path(id?: string) {
  return id
    ? `/api/collaborations/${encodeURIComponent(id)}`
    : "/api/collaborations";
}

/** Guard empty/null JSON bodies from proxy hiccups or 204-style responses. */
function requireBody<T extends Record<string, unknown>>(
  body: unknown,
  fallback: string,
): T {
  const obj = asRecord(body);
  if (!obj) {
    throw new CollaborationsApiError(
      `${fallback}. Empty API response — try refreshing. If this keeps happening, check the network tab for /api/collaborations.`,
      502,
      body,
    );
  }
  return obj as T;
}

async function collaborationJson<T extends Record<string, unknown>>(
  apiPath: string,
  init: RequestInit,
  fallback: string,
): Promise<T> {
  const raw = await authedJson<unknown>(
    apiPath,
    init,
    fallback,
    CollaborationsApiError,
  );
  return requireBody<T>(raw, fallback);
}

export function readCollaborationsErrorCode(err: unknown): string | null {
  if (!(err instanceof HttpError) || !err.body || typeof err.body !== "object") {
    return null;
  }
  const code = (err.body as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

export async function listCollaborations(options?: {
  page?: number;
  limit?: number;
}): Promise<{
  workspaces: CollaborationWorkspace[];
  pagination: CollaborationPagination;
  collaborationAvailable: boolean;
}> {
  const params = new URLSearchParams();
  if (options?.page != null) params.set("page", String(options.page));
  if (options?.limit != null) params.set("limit", String(options.limit));
  const qs = params.toString();
  const res = await collaborationJson<{
    workspaces?: unknown[];
    data?: unknown[];
    pagination?: unknown;
    collaborationAvailable?: boolean;
  }>(qs ? `${path()}?${qs}` : path(), { method: "GET" }, "Failed to load workspaces");
  const rows = Array.isArray(res.workspaces)
    ? res.workspaces
    : Array.isArray(res.data)
      ? res.data
      : [];
  return {
    workspaces: rows
      .map(mapWorkspace)
      .filter((w): w is CollaborationWorkspace => w != null),
    pagination: mapPagination(res.pagination),
    collaborationAvailable: res.collaborationAvailable === true,
  };
}

export async function getCollaboration(
  id: string,
): Promise<{ workspace: CollaborationWorkspace }> {
  const res = await collaborationJson<{ workspace?: unknown }>(
    path(id),
    { method: "GET" },
    "Failed to load workspace",
  );
  const workspace = mapWorkspace(res.workspace) ?? mapWorkspace(res);
  if (!workspace) {
    throw new CollaborationsApiError("Workspace not found", 404, res);
  }
  return { workspace };
}

export async function createCollaboration(input: {
  name: string;
  description?: string | null;
  linkedGalleryId?: string | null;
}): Promise<{ message?: string; workspace: CollaborationWorkspace }> {
  const res = await collaborationJson<{ message?: string; workspace?: unknown }>(
    path(),
    {
      method: "POST",
      body: JSON.stringify({
        name: input.name.trim(),
        description: input.description?.trim() || null,
        linkedGalleryId: input.linkedGalleryId ?? null,
      }),
    },
    "Failed to create workspace",
  );
  const workspace = mapWorkspace(res.workspace);
  if (!workspace) {
    throw new CollaborationsApiError("Invalid create response", 500, res);
  }
  return { message: readString(res.message) ?? undefined, workspace };
}

export async function updateCollaboration(
  id: string,
  input: {
    name?: string;
    description?: string | null;
    status?: CollaborationStatus;
    linkedGalleryId?: string | null;
  },
): Promise<{ message?: string; workspace: CollaborationWorkspace }> {
  const body: Record<string, unknown> = {};
  if (input.name !== undefined) body.name = input.name.trim();
  if (input.description !== undefined) {
    body.description = input.description?.trim() || null;
  }
  if (input.status !== undefined) body.status = input.status;
  if (input.linkedGalleryId !== undefined) {
    body.linkedGalleryId = input.linkedGalleryId;
  }
  const res = await collaborationJson<{ message?: string; workspace?: unknown }>(
    path(id),
    { method: "PATCH", body: JSON.stringify(body) },
    "Failed to update workspace",
  );
  const workspace = mapWorkspace(res.workspace);
  if (!workspace) {
    throw new CollaborationsApiError("Invalid update response", 500, res);
  }
  return { message: readString(res.message) ?? undefined, workspace };
}

export async function deleteCollaboration(id: string): Promise<{ message?: string }> {
  const res = await collaborationJson<{ message?: string }>(
    path(id),
    { method: "DELETE" },
    "Failed to delete workspace",
  );
  return { message: readString(res.message) ?? undefined };
}

export async function listCollaborationMembers(id: string): Promise<{
  owner: (CollaborationPerson & { role: "owner" }) | null;
  members: CollaborationMember[];
  seats: CollaborationSeats;
}> {
  const res = await collaborationJson<{
    owner?: unknown;
    members?: unknown[];
    seats?: unknown;
  }>(`${path(id)}/members`, { method: "GET" }, "Failed to load members");
  const ownerPerson = mapPerson(res.owner);
  return {
    owner: ownerPerson
      ? { ...ownerPerson, role: "owner" as const }
      : null,
    members: (Array.isArray(res.members) ? res.members : [])
      .map(mapMember)
      .filter((m): m is CollaborationMember => m != null),
    seats: mapSeats(res.seats),
  };
}

export async function inviteCollaborationMember(
  id: string,
  input: { email: string; role: Exclude<CollaborationRole, "owner"> },
): Promise<{
  message?: string;
  member: CollaborationMember;
  seats: CollaborationSeats;
}> {
  const res = await collaborationJson<{
    message?: string;
    member?: unknown;
    seats?: unknown;
  }>(
    `${path(id)}/invites`,
    {
      method: "POST",
      body: JSON.stringify({
        email: input.email.trim().toLowerCase(),
        role: input.role,
      }),
    },
    "Failed to send invite",
  );
  const member = mapMember(res.member);
  if (!member) {
    throw new CollaborationsApiError("Invalid invite response", 500, res);
  }
  return {
    message: readString(res.message) ?? undefined,
    member,
    seats: mapSeats(res.seats),
  };
}

export async function removeCollaborationMember(
  workspaceId: string,
  memberId: string,
): Promise<{ message?: string }> {
  const res = await collaborationJson<{ message?: string }>(
    `${path(workspaceId)}/members/${encodeURIComponent(memberId)}`,
    { method: "DELETE" },
    "Failed to remove member",
  );
  return { message: readString(res.message) ?? undefined };
}

export async function leaveCollaboration(id: string): Promise<{ message?: string }> {
  const res = await collaborationJson<{ message?: string }>(
    `${path(id)}/leave`,
    { method: "POST" },
    "Failed to leave workspace",
  );
  return { message: readString(res.message) ?? undefined };
}

export async function listPendingCollaborationInvites(): Promise<{
  invites: PendingCollaborationInvite[];
}> {
  const res = await collaborationJson<{ invites?: unknown[] }>(
    "/api/collaborations/invites/pending",
    { method: "GET" },
    "Failed to load invites",
  );
  const invites: PendingCollaborationInvite[] = [];
  for (const row of Array.isArray(res.invites) ? res.invites : []) {
    const obj = asRecord(row);
    if (!obj) continue;
    const member = mapMember(obj.member);
    const workspace = mapWorkspace(obj.workspace);
    if (!member || !workspace) continue;
    invites.push({
      member,
      workspace,
      expired: obj.expired === true,
    });
  }
  return { invites };
}

export async function acceptCollaborationInviteByToken(token: string): Promise<{
  message?: string;
  workspace: CollaborationWorkspace;
  member: CollaborationMember | null;
}> {
  const res = await collaborationJson<{
    message?: string;
    workspace?: unknown;
    member?: unknown;
  }>(
    `/api/collaborations/invites/${encodeURIComponent(token)}/accept`,
    { method: "POST" },
    "Failed to accept invite",
  );
  const workspace = mapWorkspace(res.workspace);
  if (!workspace) {
    throw new CollaborationsApiError("Invalid accept response", 500, res);
  }
  return {
    message: readString(res.message) ?? undefined,
    workspace,
    member: mapMember(res.member),
  };
}

export async function declineCollaborationInviteByToken(
  token: string,
): Promise<{ message?: string }> {
  const res = await collaborationJson<{ message?: string }>(
    `/api/collaborations/invites/${encodeURIComponent(token)}/decline`,
    { method: "POST" },
    "Failed to decline invite",
  );
  return { message: readString(res.message) ?? undefined };
}

export async function acceptCollaborationInvite(
  workspaceId: string,
): Promise<{
  message?: string;
  workspace: CollaborationWorkspace;
  member: CollaborationMember | null;
}> {
  const res = await collaborationJson<{
    message?: string;
    workspace?: unknown;
    member?: unknown;
  }>(
    `${path(workspaceId)}/invites/accept`,
    { method: "POST" },
    "Failed to accept invite",
  );
  const workspace = mapWorkspace(res.workspace);
  if (!workspace) {
    throw new CollaborationsApiError("Invalid accept response", 500, res);
  }
  return {
    message: readString(res.message) ?? undefined,
    workspace,
    member: mapMember(res.member),
  };
}

export async function listCollaborationFolders(id: string): Promise<{
  folders: CollaborationFolder[];
}> {
  const res = await collaborationJson<{ folders?: unknown[] }>(
    `${path(id)}/folders`,
    { method: "GET" },
    "Failed to load folders",
  );
  return {
    folders: (Array.isArray(res.folders) ? res.folders : [])
      .map(mapFolder)
      .filter((f): f is CollaborationFolder => f != null)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
  };
}

export async function createCollaborationFolder(
  id: string,
  input: { name: string },
): Promise<{ message?: string; folder: CollaborationFolder }> {
  const res = await collaborationJson<{ message?: string; folder?: unknown }>(
    `${path(id)}/folders`,
    {
      method: "POST",
      body: JSON.stringify({ name: input.name.trim() }),
    },
    "Failed to create folder",
  );
  const folder = mapFolder(res.folder);
  if (!folder) {
    throw new CollaborationsApiError("Invalid folder response", 500, res);
  }
  return { message: readString(res.message) ?? undefined, folder };
}

export async function listCollaborationMedia(
  id: string,
  options?: {
    folderId?: string | null;
    mediaType?: "photo" | "video";
    page?: number;
    limit?: number;
  },
): Promise<{
  assets: CollaborationAsset[];
  pagination: CollaborationPagination;
}> {
  const params = new URLSearchParams();
  if (options?.folderId) params.set("folderId", options.folderId);
  if (options?.mediaType) params.set("mediaType", options.mediaType);
  if (options?.page != null) params.set("page", String(options.page));
  if (options?.limit != null) params.set("limit", String(options.limit));
  const qs = params.toString();
  const res = await collaborationJson<{ assets?: unknown[]; pagination?: unknown }>(
    qs ? `${path(id)}/media?${qs}` : `${path(id)}/media`,
    { method: "GET" },
    "Failed to load media",
  );
  return {
    assets: (Array.isArray(res.assets) ? res.assets : [])
      .map(mapAsset)
      .filter((a): a is CollaborationAsset => a != null),
    pagination: mapPagination(res.pagination),
  };
}

export async function deleteCollaborationMedia(
  workspaceId: string,
  assetId: string,
): Promise<{ message?: string }> {
  const res = await collaborationJson<{ message?: string }>(
    `${path(workspaceId)}/media/${encodeURIComponent(assetId)}`,
    { method: "DELETE" },
    "Failed to delete asset",
  );
  return { message: readString(res.message) ?? undefined };
}
