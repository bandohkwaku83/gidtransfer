import { APP_NAME } from "@/lib/branding";
import { contactEmail } from "@/lib/marketing/faqs";

export { contactEmail };

/** Public studio phone on the contact page. */
export const contactPhone = "+233 20 000 0000";
export const contactPhoneHref = `tel:${contactPhone.replace(/\s+/g, "")}`;

export type ContactFormValues = {
  name: string;
  email: string;
  studio?: string;
  role?: string;
  message: string;
  scheduleCall: boolean;
};

export function buildContactMailto(values: ContactFormValues): string {
  const subject = `${APP_NAME}: inquiry — ${values.name.trim() || "contact"}`;
  const lines = [
    values.message.trim(),
    "",
    "---",
    `Name: ${values.name.trim()}`,
    `Email: ${values.email.trim()}`,
    values.studio?.trim() ? `Studio / company: ${values.studio.trim()}` : null,
    values.role?.trim() ? `Role: ${values.role.trim()}` : null,
    values.scheduleCall ? "Prefers: schedule a call instead of email follow-up" : null,
  ].filter(Boolean);

  const params = new URLSearchParams({
    subject,
    body: lines.join("\n"),
  });
  return `mailto:${contactEmail}?${params.toString()}`;
}
