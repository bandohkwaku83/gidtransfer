import adminApi from "./admin-client";
import type {
  CommunicationRecipient,
  PaginatedResponse,
  PhotographerDetail,
  PhotographerFilters,
  PhotographerListItem,
  SendResult,
  Session,
} from "@/lib/admin/types";

interface RawSession {
  id: string;
  authMethod: string;
  ipAddress?: string;
  ip?: string;
  userAgent: string;
  loggedInAt: string;
  lastSeenAt: string;
  active?: boolean;
  isActive?: boolean;
}

interface RawListItem {
  userId: string;
  accountId: string;
  email: string;
  emailVerified: boolean;
  companyName?: string;
  companyLogo?: string | null;
  planName?: string;
  planId?: string;
  subscriptionStatus?: string;
  smsSenderId?: string | null;
  smsSenderStatus?: string | null;
  onboardingComplete?: boolean;
  onboarded?: boolean;
  isActive: boolean;
  authProvider: string;
  createdAt: string;
  studio?: {
    companyName?: string;
    companyLogo?: string | null;
  };
  activity?: {
    lastLoginAt?: string | null;
    activeSessions?: number;
  };
  lastLoginAt?: string | null;
  activeSessions?: number;
}

interface RawPhotographerDetail {
  _id: string;
  accountId: string;
  email: string;
  emailVerified: boolean;
  authProvider: string;
  isActive: boolean;
  createdAt: string;
  onboardingComplete?: boolean;
  onboardingCompletedAt?: string | null;
  studio?: {
    companyName?: string;
    companyLogo?: string | null;
    companySlug?: string;
    country?: string;
    phone?: string;
    smsSenderId?: string | null;
    smsSenderStatus?: string | null;
  };
  subscription?: {
    planName?: string;
    status?: string;
    paystackSubscriptionCode?: string | null;
  };
  usage?: {
    clientCount?: number;
    galleries?: { all?: number };
    storageBytes?: number;
    storageLimitBytes?: number;
    storageLabel?: string;
    storageLimitLabel?: string;
  };
  activity?: {
    lastLoginAt?: string | null;
    lastSeenAt?: string | null;
    loginCount?: number;
    activeSessions?: number;
  };
  recentSessions?: RawSession[];
}

function mapSession(raw: RawSession): Session {
  return {
    id: raw.id,
    authMethod: raw.authMethod,
    ip: raw.ipAddress ?? raw.ip ?? "",
    userAgent: raw.userAgent,
    loggedInAt: raw.loggedInAt,
    lastSeenAt: raw.lastSeenAt,
    isActive: raw.active ?? raw.isActive ?? false,
  };
}

function mapListItem(raw: RawListItem): PhotographerListItem {
  const studio = raw.studio ?? {};
  return {
    userId: raw.userId,
    accountId: raw.accountId,
    email: raw.email,
    emailVerified: raw.emailVerified,
    companyName: raw.companyName ?? studio.companyName ?? "",
    companyLogo: raw.companyLogo ?? studio.companyLogo ?? null,
    planName: raw.planName ?? raw.planId ?? "",
    subscriptionStatus: raw.subscriptionStatus ?? "",
    smsSenderId: raw.smsSenderId ?? null,
    smsSenderStatus: raw.smsSenderStatus ?? null,
    lastLoginAt: raw.activity?.lastLoginAt ?? raw.lastLoginAt ?? null,
    activeSessions: raw.activity?.activeSessions ?? raw.activeSessions ?? 0,
    isActive: raw.isActive,
    onboarded: raw.onboardingComplete ?? raw.onboarded ?? false,
    authProvider: raw.authProvider,
    createdAt: raw.createdAt,
  };
}

function mapDetail(raw: RawPhotographerDetail): PhotographerDetail {
  const studio = raw.studio ?? {};
  const subscription = raw.subscription ?? {};
  const usage = raw.usage ?? {};
  const activity = raw.activity ?? {};

  return {
    userId: raw._id,
    accountId: raw.accountId,
    email: raw.email,
    emailVerified: raw.emailVerified,
    authProvider: raw.authProvider,
    companyName: studio.companyName ?? "",
    companyLogo: studio.companyLogo ?? null,
    slug: studio.companySlug ?? "",
    country: studio.country ?? "",
    phone: studio.phone ?? "",
    onboarded: raw.onboardingComplete ?? false,
    onboardedAt: raw.onboardingCompletedAt ?? null,
    createdAt: raw.createdAt,
    isActive: raw.isActive,
    planName: subscription.planName ?? "",
    subscriptionStatus: subscription.status ?? "",
    paystackSubscriptionCode: subscription.paystackSubscriptionCode ?? null,
    clientsCount: usage.clientCount ?? 0,
    galleriesCount: usage.galleries?.all ?? 0,
    storageUsed: usage.storageBytes ?? 0,
    storageLimit: usage.storageLimitBytes ?? 0,
    storageLabel: usage.storageLabel ?? "0 B",
    storageLimitLabel: usage.storageLimitLabel ?? "0 B",
    lastLoginAt: activity.lastLoginAt ?? null,
    lastSeenAt: activity.lastSeenAt ?? null,
    loginCount: activity.loginCount ?? 0,
    activeSessions: activity.activeSessions ?? 0,
    smsSenderId: studio.smsSenderId ?? null,
    smsSenderStatus: studio.smsSenderStatus ?? null,
    recentSessions: (raw.recentSessions ?? []).map(mapSession),
  };
}

function mapSendResult(data: {
  communication?: {
    summary?: SendResult;
    recipients?: CommunicationRecipient[];
  };
}): SendResult {
  const communication = data.communication;
  const summary = communication?.summary ?? {
    targeted: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
  };
  const recipients = communication?.recipients;

  return {
    ...summary,
    results: recipients ? { sms: recipients, email: recipients } : undefined,
  };
}

export async function getPhotographers(
  filters: PhotographerFilters = {},
): Promise<PaginatedResponse<PhotographerListItem>> {
  const { data } = await adminApi.get<{
    items: RawListItem[];
    pagination: PaginatedResponse<PhotographerListItem>["pagination"];
  }>("/api/admin/photographers", { params: filters });

  return {
    items: data.items.map(mapListItem),
    pagination: data.pagination,
  };
}

export async function getPhotographer(
  userId: string,
  sessionLimit = 10,
): Promise<PhotographerDetail> {
  const { data } = await adminApi.get<{ photographer: RawPhotographerDetail }>(
    `/api/admin/photographers/${userId}`,
    { params: { sessionLimit } },
  );
  return mapDetail(data.photographer);
}

export async function activatePhotographer(userId: string): Promise<void> {
  await adminApi.patch(`/api/admin/photographers/${userId}/activate`);
}

export async function deactivatePhotographer(userId: string): Promise<void> {
  await adminApi.patch(`/api/admin/photographers/${userId}/deactivate`);
}

export async function verifyPhotographerEmail(userId: string): Promise<void> {
  await adminApi.post(`/api/admin/photographers/${userId}/verify-email`);
}

export async function communicate(
  userId: string,
  body: {
    channel: "sms" | "email" | "both";
    subject?: string;
    message: string;
  },
): Promise<SendResult> {
  const channels =
    body.channel === "both"
      ? ["email", "sms"]
      : body.channel === "sms"
        ? ["sms"]
        : ["email"];

  const { data } = await adminApi.post<{
    communication?: {
      summary?: SendResult;
      recipients?: CommunicationRecipient[];
    };
  }>(`/api/admin/photographers/${userId}/communicate`, {
    channels,
    subject: body.subject,
    message: body.message,
  });

  return mapSendResult(data);
}

export async function getSessions(
  userId: string,
  params: { active?: boolean; page?: number; limit?: number } = {},
): Promise<PaginatedResponse<Session>> {
  const { data } = await adminApi.get<{
    items: RawSession[];
    pagination: PaginatedResponse<Session>["pagination"];
  }>(`/api/admin/photographers/${userId}/sessions`, { params });

  return {
    items: data.items.map(mapSession),
    pagination: data.pagination,
  };
}
