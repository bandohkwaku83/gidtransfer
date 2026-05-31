import { HttpError } from "@/lib/http";

export type SmsPlaceholder = {
  key: string;
  token: string;
  label: string;
};

export type SmsRecipientTypeOption = {
  id: string;
  label: string;
};

export type SmsMeta = {
  placeholders: SmsPlaceholder[];
  recipientTypes: SmsRecipientTypeOption[];
  configured: boolean;
};

export type SmsMessageRow = {
  _id: string;
  recipientName: string;
  recipientPhone: string;
  recipientKind: string;
  message: string;
  messageLength: number;
  status: string;
  costGHS: number;
  errorMessage?: string;
  client?: string;
  folder?: string;
  recipientType?: string;
  createdAt: string;
  updatedAt?: string;
};

export type ListSmsMessagesResponse = {
  messages: SmsMessageRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type SendSmsInput = {
  recipientType: string;
  message: string;
  folderId?: string;
  clientId?: string;
};

export type SendSmsResponse = {
  message: string;
  summary: { sent: number; failed: number; skipped: number };
  results: Array<{ id: string; clientId: string; status: string }>;
  skipped: unknown[];
};

export class SmsApiError extends HttpError {}

async function delay(ms = 25) {
  await new Promise((r) => setTimeout(r, ms));
}

export async function getSmsMeta(): Promise<SmsMeta> {
  await delay();
  return {
    placeholders: [{ key: "client", token: "{client}", label: "Client name" }],
    recipientTypes: [
      { id: "client", label: "Client" },
      { id: "custom", label: "Custom list (demo)" },
    ],
    configured: false,
  };
}

export async function listSmsMessages(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: "" | "sent" | "failed" | "skipped";
}): Promise<ListSmsMessagesResponse> {
  await delay();
  void params;
  return {
    messages: [],
    pagination: {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      total: 0,
      totalPages: 1,
    },
  };
}

export async function sendSms(input: SendSmsInput): Promise<SendSmsResponse> {
  await delay();
  return {
    message: "Demo mode: no SMS was sent.",
    summary: { sent: 0, failed: 0, skipped: 1 },
    results: [],
    skipped: [{ reason: "demo", recipientType: input.recipientType }],
  };
}
