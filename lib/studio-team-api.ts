import { HttpError, authedJson } from "@/lib/http";
import type { StudioMenuKey } from "@/lib/studio-access";

export class StudioTeamApiError extends HttpError {}

export type StudioTeamRole = "admin" | "editor" | "viewer";
export type StudioTeamMemberStatus = "active" | "disabled";

export type StudioMenuMeta = {
  key: StudioMenuKey | string;
  label: string;
  description: string;
  assignable: boolean;
};

export type StudioRoleMeta = {
  key: StudioTeamRole;
  label: string;
  description: string;
  menuKeys: string[];
};

export type StudioTeamMemberUser = {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
};

export type StudioTeamMember = {
  id: string;
  studioOwnerId: string;
  userId: string | null;
  email: string;
  displayName: string;
  role: StudioTeamRole;
  menuKeys: string[];
  status: StudioTeamMemberStatus;
  createdAt: string | null;
  updatedAt: string | null;
  user: StudioTeamMemberUser | null;
};

export type StudioTeamSeats = {
  used: number;
  max: number | null;
};

export type StudioMetaResponse = {
  menus: StudioMenuMeta[];
  roles: StudioRoleMeta[];
};

export type StudioTeamListResponse = {
  members: StudioTeamMember[];
  seats: StudioTeamSeats;
  studioTeamAvailable: boolean;
  menus: StudioMenuMeta[];
  roles: StudioRoleMeta[];
};

export type CreateStudioTeamMemberInput = {
  email: string;
  displayName: string;
  role: StudioTeamRole;
  password?: string;
  menuKeys?: string[];
};

export type CreateStudioTeamMemberResult = {
  message: string;
  member: StudioTeamMember;
  temporaryPassword?: string;
  seats: StudioTeamSeats;
};

export type UpdateStudioTeamMemberInput = {
  displayName?: string;
  role?: StudioTeamRole;
  menuKeys?: string[];
  status?: StudioTeamMemberStatus;
};

export type UpdateStudioTeamMemberResult = {
  message: string;
  member: StudioTeamMember;
};

export type ResetStudioTeamPasswordResult = {
  message: string;
  temporaryPassword?: string;
};

function requireBody<T extends Record<string, unknown>>(
  raw: unknown,
  fallback: string,
): T {
  if (!raw || typeof raw !== "object") {
    throw new StudioTeamApiError(fallback, 500, raw);
  }
  return raw as T;
}

async function studioJson<T extends Record<string, unknown>>(
  apiPath: string,
  init: RequestInit,
  fallback: string,
): Promise<T> {
  const raw = await authedJson<unknown>(
    apiPath,
    init,
    fallback,
    StudioTeamApiError,
  );
  return requireBody<T>(raw, fallback);
}

export function readStudioTeamErrorCode(err: unknown): string | null {
  if (!(err instanceof HttpError) || !err.body || typeof err.body !== "object") {
    return null;
  }
  const code = (err.body as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function asStringList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => asString(x)).filter(Boolean);
}

function mapUser(raw: unknown): StudioTeamMemberUser | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = asString(o.id) || asString(o._id);
  const email = asString(o.email);
  if (!id && !email) return null;
  return {
    id: id || email,
    email,
    name: asString(o.name) || asString(o.displayName) || email,
    isActive: o.isActive !== false,
  };
}

function mapRole(raw: unknown): StudioTeamRole {
  const v = asString(raw).toLowerCase();
  if (v === "admin" || v === "editor" || v === "viewer") return v;
  return "viewer";
}

function mapStatus(raw: unknown): StudioTeamMemberStatus {
  return asString(raw).toLowerCase() === "disabled" ? "disabled" : "active";
}

export function mapStudioTeamMember(raw: unknown): StudioTeamMember | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = asString(o.id) || asString(o._id);
  const email = asString(o.email);
  if (!id || !email) return null;
  return {
    id,
    studioOwnerId: asString(o.studioOwnerId),
    userId: asString(o.userId) || null,
    email,
    displayName: asString(o.displayName) || asString(o.name) || email,
    role: mapRole(o.role),
    menuKeys: asStringList(o.menuKeys),
    status: mapStatus(o.status),
    createdAt: asString(o.createdAt) || null,
    updatedAt: asString(o.updatedAt) || null,
    user: mapUser(o.user),
  };
}

function mapMenuMeta(raw: unknown): StudioMenuMeta | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const key = asString(o.key);
  if (!key) return null;
  return {
    key,
    label: asString(o.label) || key,
    description: asString(o.description),
    assignable: o.assignable !== false,
  };
}

function mapRoleMeta(raw: unknown): StudioRoleMeta | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const key = mapRole(o.key);
  return {
    key,
    label: asString(o.label) || key,
    description: asString(o.description),
    menuKeys: asStringList(o.menuKeys),
  };
}

function mapSeats(raw: unknown): StudioTeamSeats {
  if (!raw || typeof raw !== "object") return { used: 0, max: null };
  const o = raw as Record<string, unknown>;
  const used = typeof o.used === "number" && Number.isFinite(o.used) ? o.used : 0;
  const max =
    typeof o.max === "number" && Number.isFinite(o.max)
      ? o.max
      : typeof o.maxTeamMembers === "number" && Number.isFinite(o.maxTeamMembers)
        ? o.maxTeamMembers
        : null;
  return { used, max };
}

export function studioTeamRoleLabel(role: StudioTeamRole): string {
  if (role === "admin") return "Admin";
  if (role === "editor") return "Editor";
  return "Viewer";
}

/** GET /api/studio/meta */
export async function fetchStudioMeta(): Promise<StudioMetaResponse> {
  const body = await studioJson<Record<string, unknown>>(
    "/api/studio/meta",
    { method: "GET" },
    "Could not load team settings",
  );
  return {
    menus: Array.isArray(body.menus)
      ? body.menus.map(mapMenuMeta).filter((m): m is StudioMenuMeta => Boolean(m))
      : [],
    roles: Array.isArray(body.roles)
      ? body.roles.map(mapRoleMeta).filter((r): r is StudioRoleMeta => Boolean(r))
      : [],
  };
}

/** GET /api/studio/team */
export async function listStudioTeam(): Promise<StudioTeamListResponse> {
  const body = await studioJson<Record<string, unknown>>(
    "/api/studio/team",
    { method: "GET" },
    "Could not load studio team",
  );
  return {
    members: Array.isArray(body.members)
      ? body.members
          .map(mapStudioTeamMember)
          .filter((m): m is StudioTeamMember => Boolean(m))
      : [],
    seats: mapSeats(body.seats),
    studioTeamAvailable: body.studioTeamAvailable !== false,
    menus: Array.isArray(body.menus)
      ? body.menus.map(mapMenuMeta).filter((m): m is StudioMenuMeta => Boolean(m))
      : [],
    roles: Array.isArray(body.roles)
      ? body.roles.map(mapRoleMeta).filter((r): r is StudioRoleMeta => Boolean(r))
      : [],
  };
}

/** POST /api/studio/team */
export async function createStudioTeamMember(
  input: CreateStudioTeamMemberInput,
): Promise<CreateStudioTeamMemberResult> {
  const payload: Record<string, unknown> = {
    email: input.email.trim().toLowerCase(),
    displayName: input.displayName.trim(),
    role: input.role,
  };
  if (input.password?.trim()) payload.password = input.password;
  if (input.menuKeys) payload.menuKeys = input.menuKeys;

  const body = await studioJson<Record<string, unknown>>(
    "/api/studio/team",
    { method: "POST", body: JSON.stringify(payload) },
    "Could not create team member",
  );
  const member = mapStudioTeamMember(body.member);
  if (!member) {
    throw new StudioTeamApiError("Invalid team member response", 500, body);
  }
  const temp = asString(body.temporaryPassword);
  return {
    message: asString(body.message) || "Team member created",
    member,
    ...(temp ? { temporaryPassword: temp } : {}),
    seats: mapSeats(body.seats),
  };
}

/** PATCH /api/studio/team/:memberId */
export async function updateStudioTeamMember(
  memberId: string,
  input: UpdateStudioTeamMemberInput,
): Promise<UpdateStudioTeamMemberResult> {
  const body = await studioJson<Record<string, unknown>>(
    `/api/studio/team/${encodeURIComponent(memberId)}`,
    { method: "PATCH", body: JSON.stringify(input) },
    "Could not update team member",
  );
  const member = mapStudioTeamMember(body.member);
  if (!member) {
    throw new StudioTeamApiError("Invalid team member response", 500, body);
  }
  return {
    message: asString(body.message) || "Team member updated",
    member,
  };
}

/** DELETE /api/studio/team/:memberId */
export async function removeStudioTeamMember(
  memberId: string,
): Promise<{ message: string }> {
  const body = await studioJson<Record<string, unknown>>(
    `/api/studio/team/${encodeURIComponent(memberId)}`,
    { method: "DELETE" },
    "Could not remove team member",
  );
  return { message: asString(body.message) || "Team member removed" };
}

/** POST /api/studio/team/:memberId/reset-password */
export async function resetStudioTeamPassword(
  memberId: string,
  password?: string,
): Promise<ResetStudioTeamPasswordResult> {
  const payload: Record<string, unknown> = {};
  if (password?.trim()) payload.password = password.trim();

  const body = await studioJson<Record<string, unknown>>(
    `/api/studio/team/${encodeURIComponent(memberId)}/reset-password`,
    { method: "POST", body: JSON.stringify(payload) },
    "Could not reset password",
  );
  const temp = asString(body.temporaryPassword);
  return {
    message: asString(body.message) || "Password updated",
    ...(temp ? { temporaryPassword: temp } : {}),
  };
}
