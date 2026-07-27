export type SmsSenderStatus = "none" | "pending" | "approved" | "rejected";

export type StudioSmsFields = {
  smsSenderId?: string;
  smsSenderStatus: SmsSenderStatus;
  smsSenderRequestedAt?: string;
  smsSenderApprovedAt?: string;
  smsSenderRejectedReason?: string;
  suggestedSmsSenderId?: string;
  smsBrandingReady: boolean;
};

export const DEFAULT_PLATFORM_SMS_SENDER = "Gidtransfer";

export const SMS_SENDER_ID_MAX_LENGTH = 11;

const SMS_SENDER_ID_PATTERN = /^[A-Z0-9]+$/;

/** Strip non-alphanumeric, uppercase, slice to max length (matches backend suggestion). */
export function deriveSmsSenderIdFromCompanyName(companyName: string): string {
  return companyName
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, SMS_SENDER_ID_MAX_LENGTH);
}

/** Normalize user input: letters/numbers only, uppercase, max 11 chars. */
export function normalizeSmsSenderIdInput(raw: string): string {
  return raw
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, SMS_SENDER_ID_MAX_LENGTH);
}

export function smsSenderIdValidationMessage(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Enter an SMS display name.";
  if (trimmed.length > SMS_SENDER_ID_MAX_LENGTH) {
    return `SMS display name must be ${SMS_SENDER_ID_MAX_LENGTH} characters or fewer.`;
  }
  if (!SMS_SENDER_ID_PATTERN.test(trimmed)) {
    return "Use letters and numbers only (no spaces or symbols).";
  }
  return null;
}

export function parseSmsSenderStatus(raw?: string | null): SmsSenderStatus {
  const v = raw?.trim().toLowerCase();
  if (v === "pending" || v === "approved" || v === "rejected" || v === "none") return v;
  return "none";
}

export function studioSmsFieldsFromApi(
  raw?: Partial<StudioSmsFields> | null,
): StudioSmsFields {
  const smsSenderId = raw?.smsSenderId?.trim().toUpperCase() || undefined;
  const smsSenderStatus = parseSmsSenderStatus(raw?.smsSenderStatus);
  const suggestedSmsSenderId =
    raw?.suggestedSmsSenderId?.trim().toUpperCase() || undefined;
  // Branding is ready as soon as a valid sender ID is saved — no approval step.
  const smsBrandingReady =
    raw?.smsBrandingReady === true ||
    (Boolean(smsSenderId) &&
      smsSenderIdValidationMessage(smsSenderId ?? "") === null);

  return {
    ...(smsSenderId ? { smsSenderId } : {}),
    smsSenderStatus,
    ...(raw?.smsSenderRequestedAt?.trim()
      ? { smsSenderRequestedAt: raw.smsSenderRequestedAt.trim() }
      : {}),
    ...(raw?.smsSenderApprovedAt?.trim()
      ? { smsSenderApprovedAt: raw.smsSenderApprovedAt.trim() }
      : {}),
    ...(raw?.smsSenderRejectedReason?.trim()
      ? { smsSenderRejectedReason: raw.smsSenderRejectedReason.trim() }
      : {}),
    ...(suggestedSmsSenderId ? { suggestedSmsSenderId } : {}),
    smsBrandingReady,
  };
}

export function smsSenderStatusLabel(
  status: SmsSenderStatus,
  brandingReady = false,
): string {
  if (brandingReady && status !== "rejected") return "Ready";
  switch (status) {
    case "pending":
    case "approved":
      return "Ready";
    case "rejected":
      return "Rejected";
    default:
      return "Not set";
  }
}

export function smsSenderStatusBadgeClass(
  status: SmsSenderStatus,
  brandingReady = false,
): string {
  if (brandingReady && status !== "rejected") {
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
  }
  switch (status) {
    case "pending":
    case "approved":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    case "rejected":
      return "bg-red-500/10 text-red-700 dark:text-red-400";
    default:
      return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400";
  }
}

export function smsSenderStatusMessage(
  fields: StudioSmsFields,
  platformSender = DEFAULT_PLATFORM_SMS_SENDER,
): string {
  const id = fields.smsSenderId?.trim();
  if (fields.smsSenderStatus === "rejected") {
    const reason = fields.smsSenderRejectedReason?.trim();
    return id
      ? reason
        ? `${id} was rejected. ${reason} — choose another name.`
        : `${id} was rejected — choose another name.`
      : reason
        ? `Your SMS name was rejected. ${reason} — choose another name.`
        : "Your SMS name was rejected — choose another name.";
  }
  if (fields.smsBrandingReady || id) {
    return id
      ? `Clients will see ${id} on SMS.`
      : "Your SMS display name is ready.";
  }
  return `Set an SMS display name so clients recognize your studio. Until then, messages send from ${platformSender}.`;
}
