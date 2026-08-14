import { authedJson, extractMessage, HttpError } from "@/lib/http";
import {
  DEFAULT_PLATFORM_SMS_SENDER,
  studioSmsFieldsFromApi,
  type StudioSmsFields,
} from "@/lib/sms-sender";

export type SmsConfigResponse = {
  configured: boolean;
  /** Plan: smsNotifications (Basic+) — when false, SMS send is locked. */
  available?: boolean;
  /** Plan: customSmsSender (Pro+) — when false, custom sender field is locked. */
  customSenderAvailable?: boolean;
  defaultSender: string;
  studio: StudioSmsFields;
  upgrade?: {
    feature?: string;
    requiredPlans?: string[];
    message?: string;
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

export type SendTestSmsInput = {
  phone: string;
  message?: string;
};

export type SendTestSmsResponse = {
  message?: string;
};

export class SmsApiError extends HttpError {}

/** Server-side Arkesel / SMS provider not wired (env on the API). */
export const SMS_ARKESEL_NOT_CONFIGURED_MESSAGE =
  "Arkesel is not set up on the server. Set ARKESEL_API_KEY and ARKESEL_DEFAULT_SENDER on the API. You cannot fix this from the app.";

export const SMS_NO_SENDER_MESSAGE =
  "Set your SMS display name in Settings before sending.";

export const SMS_CONFIG_LOAD_FAILED_MESSAGE = "Couldn't load SMS settings.";

function extractErrorCode(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const code = (body as { code?: unknown }).code;
  return typeof code === "string" && code.trim() ? code.trim() : null;
}

function normalizeSmsConfig(raw: unknown): SmsConfigResponse {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const studioRaw =
    o.studio && typeof o.studio === "object"
      ? (o.studio as Partial<StudioSmsFields>)
      : {};
  const defaultSender =
    typeof o.defaultSender === "string" && o.defaultSender.trim()
      ? o.defaultSender.trim()
      : DEFAULT_PLATFORM_SMS_SENDER;
  return {
    configured: o.configured === true,
    available: o.available !== false,
    customSenderAvailable: o.customSenderAvailable === true,
    defaultSender,
    studio: studioSmsFieldsFromApi(studioRaw),
    ...(o.upgrade && typeof o.upgrade === "object"
      ? { upgrade: o.upgrade as SmsConfigResponse["upgrade"] }
      : {}),
  };
}

/** GET /api/sms/config — throws on network/auth failure (do not invent configured:false). */
export async function getSmsConfig(): Promise<SmsConfigResponse> {
  const raw = await authedJson<unknown>(
    "/api/sms/config",
    { method: "GET" },
    SMS_CONFIG_LOAD_FAILED_MESSAGE,
    SmsApiError,
  );
  return normalizeSmsConfig(raw);
}

export async function sendTestSms(input: SendTestSmsInput): Promise<SendTestSmsResponse> {
  try {
    return await authedJson<SendTestSmsResponse>(
      "/api/sms/test",
      {
        method: "POST",
        body: JSON.stringify({
          phone: input.phone.trim(),
          ...(input.message?.trim() ? { message: input.message.trim() } : {}),
        }),
      },
      "Failed to send test SMS",
      SmsApiError,
    );
  } catch (err) {
    if (err instanceof SmsApiError && err.status === 503) {
      throw new SmsApiError(smsApiErrorMessage(err, "Failed to send test SMS"), err.status, err.body);
    }
    throw err;
  }
}

export async function sendSms(input: SendSmsInput): Promise<SendSmsResponse> {
  try {
    return await authedJson<SendSmsResponse>(
      "/api/sms/send",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
      "Failed to send SMS",
      SmsApiError,
    );
  } catch (err) {
    if (err instanceof SmsApiError && err.status === 503) {
      throw new SmsApiError(smsApiErrorMessage(err, "Failed to send SMS"), err.status, err.body);
    }
    throw err;
  }
}

export function smsApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof SmsApiError) {
    if (err.status === 503) {
      const code = extractErrorCode(err.body);
      if (code === "NOT_CONFIGURED") return SMS_ARKESEL_NOT_CONFIGURED_MESSAGE;
      if (code === "NO_SENDER") return SMS_NO_SENDER_MESSAGE;
      return extractMessage(err.body, SMS_ARKESEL_NOT_CONFIGURED_MESSAGE);
    }
    return err.message || fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
