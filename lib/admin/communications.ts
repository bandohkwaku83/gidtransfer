import adminApi from "./admin-client";
import type {
  CommunicationConfig,
  CommunicationRecipient,
  CommunicationRecord,
  PaginatedResponse,
  SendResult,
} from "@/lib/admin/types";

interface RawCommunicationConfig {
  sms?: { configured?: boolean; defaultSender?: string };
  email?: { configured?: boolean };
  limits?: {
    maxRecipients?: number | null;
    maxSmsLength?: number;
    maxEmailMessageLength?: number;
    maxSubjectLength?: number;
  };
}

interface RawCommunicationRecord {
  id: string;
  channel: "sms" | "email";
  adminEmail: string;
  subject: string | null;
  message: string;
  createdAt: string;
  summary?: {
    targeted?: number;
    sent?: number;
    failed?: number;
    skipped?: number;
  };
  sent?: number;
  failed?: number;
  skipped?: number;
  recipients?: CommunicationRecord["recipients"];
}

function mapConfig(raw: RawCommunicationConfig): CommunicationConfig {
  return {
    smsConfigured: raw.sms?.configured ?? false,
    emailConfigured: raw.email?.configured ?? false,
    defaultSmsSender: raw.sms?.defaultSender,
    maxRecipients: raw.limits?.maxRecipients,
    maxSmsLength: raw.limits?.maxSmsLength ?? 480,
    maxEmailMessageLength: raw.limits?.maxEmailMessageLength ?? 10000,
    maxSubjectLength: raw.limits?.maxSubjectLength ?? 200,
  };
}

function mapRecord(raw: RawCommunicationRecord): CommunicationRecord {
  const summary = raw.summary ?? {};
  return {
    id: raw.id,
    channel: raw.channel,
    adminEmail: raw.adminEmail,
    subject: raw.subject,
    message: raw.message,
    createdAt: raw.createdAt,
    sent: summary.sent ?? raw.sent ?? 0,
    failed: summary.failed ?? raw.failed ?? 0,
    skipped: summary.skipped ?? raw.skipped ?? 0,
    recipients: raw.recipients,
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

export async function getCommunicationsConfig(): Promise<CommunicationConfig> {
  const { data } = await adminApi.get<RawCommunicationConfig>(
    "/api/admin/communications/config",
  );
  return mapConfig(data);
}

export async function getCommunications(params: {
  channel?: string;
  userId?: string;
  page?: number;
  limit?: number;
} = {}): Promise<PaginatedResponse<CommunicationRecord>> {
  const { data } = await adminApi.get<{
    items: RawCommunicationRecord[];
    pagination: PaginatedResponse<CommunicationRecord>["pagination"];
  }>("/api/admin/communications", { params });

  return {
    items: data.items.map(mapRecord),
    pagination: data.pagination,
  };
}

export async function sendSms(body: {
  userIds?: string[];
  filters?: Record<string, string>;
  message: string;
}): Promise<SendResult> {
  const { data } = await adminApi.post<{
    communication?: {
      summary?: SendResult;
      recipients?: CommunicationRecipient[];
    };
  }>("/api/admin/communications/sms", body);
  return mapSendResult(data);
}

export async function sendEmail(body: {
  userIds?: string[];
  filters?: Record<string, string>;
  subject: string;
  message: string;
}): Promise<SendResult> {
  const { data } = await adminApi.post<{
    communication?: {
      summary?: SendResult;
      recipients?: CommunicationRecipient[];
    };
  }>("/api/admin/communications/email", body);
  return mapSendResult(data);
}
