import { APP_NAME } from "@/lib/branding";

export const SUPPORT_EMAIL = "support@gido.studio";

export const SUPPORT_ISSUE_CATEGORIES = [
  { id: "bug", label: "Something isn't working" },
  { id: "billing", label: "Billing or plan" },
  { id: "gallery", label: "Galleries or client share" },
  { id: "upload", label: "Uploads or storage" },
  { id: "account", label: "Account or login" },
  { id: "other", label: "Other" },
] as const;

export type SupportIssueCategoryId = (typeof SUPPORT_ISSUE_CATEGORIES)[number]["id"];

export function supportCategoryLabel(id: SupportIssueCategoryId): string {
  return SUPPORT_ISSUE_CATEGORIES.find((c) => c.id === id)?.label ?? "Support request";
}

export type SupportReportContext = {
  reporterEmail: string;
  studioName?: string;
  planLabel?: string;
  pageUrl?: string;
  userAgent?: string;
};

export function buildSupportMailto(
  categoryId: SupportIssueCategoryId,
  message: string,
  context: SupportReportContext,
): string {
  const category = supportCategoryLabel(categoryId);
  const subject = `${APP_NAME} support: ${category}`;
  const lines = [
    message.trim(),
    "",
    "---",
    `Category: ${category}`,
    `Reporter: ${context.reporterEmail || "unknown"}`,
    context.studioName ? `Studio: ${context.studioName}` : null,
    context.planLabel ? `Plan: ${context.planLabel}` : null,
    context.pageUrl ? `Page: ${context.pageUrl}` : null,
    context.userAgent ? `Browser: ${context.userAgent}` : null,
  ].filter(Boolean);

  const params = new URLSearchParams({
    subject,
    body: lines.join("\n"),
  });
  return `mailto:${SUPPORT_EMAIL}?${params.toString()}`;
}

export function buildGeneralSupportMailto(context: SupportReportContext): string {
  const subject = `${APP_NAME} support request`;
  const lines = [
    "Hi, I need help with:",
    "",
    "",
    "---",
    `Reporter: ${context.reporterEmail || "unknown"}`,
    context.studioName ? `Studio: ${context.studioName}` : null,
    context.planLabel ? `Plan: ${context.planLabel}` : null,
    context.pageUrl ? `Page: ${context.pageUrl}` : null,
  ].filter(Boolean);

  const params = new URLSearchParams({
    subject,
    body: lines.join("\n"),
  });
  return `mailto:${SUPPORT_EMAIL}?${params.toString()}`;
}

export function formatSupportContextForClipboard(context: SupportReportContext): string {
  return [
    `App: ${APP_NAME}`,
    `Email: ${context.reporterEmail || "unknown"}`,
    context.studioName ? `Studio: ${context.studioName}` : null,
    context.planLabel ? `Plan: ${context.planLabel}` : null,
    context.pageUrl ? `Page: ${context.pageUrl}` : null,
    context.userAgent ? `Browser: ${context.userAgent}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
