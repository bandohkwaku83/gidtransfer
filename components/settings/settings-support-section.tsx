"use client";

import { useMemo, useState } from "react";
import { Copy, LifeBuoy, Mail, Send } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { FormSelect } from "@/components/ui/form-select";
import { formModalLabelClass } from "@/components/ui/form-modal";
import { FormTextArea } from "@/components/ui/form-input";
import { APP_NAME } from "@/lib/branding";
import {
  SUPPORT_EMAIL,
  SUPPORT_ISSUE_CATEGORIES,
  buildGeneralSupportMailto,
  buildSupportMailto,
  formatSupportContextForClipboard,
  type SupportIssueCategoryId,
} from "@/lib/support-contact";
import { PLANS, type PlanId } from "@/lib/subscription-plan";
import type { DemoAuthUser } from "@/lib/auth-demo";
import { cn } from "@/lib/utils";

const labelClass = formModalLabelClass;

type SettingsSupportSectionProps = {
  auth: DemoAuthUser | null;
  planId: PlanId;
};

export function SettingsSupportSection({ auth, planId }: SettingsSupportSectionProps) {
  const { showToast } = useToast();
  const [category, setCategory] = useState<SupportIssueCategoryId>("bug");
  const [message, setMessage] = useState("");

  const reporterEmail = auth?.user?.email ?? auth?.email ?? "";
  const studioName =
    auth?.user?.studio?.companyName?.trim() || auth?.user?.name?.trim() || undefined;

  const context = useMemo(
    () => ({
      reporterEmail,
      studioName,
      planLabel: PLANS[planId].label,
      pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    }),
    [reporterEmail, studioName, planId],
  );

  function openMailto(href: string) {
    window.location.href = href;
  }

  function handleSendReport() {
    const trimmed = message.trim();
    if (!trimmed) {
      showToast("Describe the issue so we can help.", "error");
      return;
    }
    if (!reporterEmail) {
      showToast("Sign in to send a report with your account details.", "error");
      return;
    }
    openMailto(buildSupportMailto(category, trimmed, context));
    showToast("Your email app should open with the report ready to send.", "info");
  }

  function handleEmailSupport() {
    if (!reporterEmail) {
      showToast("Sign in to include your account in the message.", "error");
      return;
    }
    openMailto(buildGeneralSupportMailto(context));
  }

  async function copyDiagnostics() {
    const text = formatSupportContextForClipboard(context);
    try {
      await navigator.clipboard.writeText(text);
      showToast("Diagnostic details copied.", "success");
    } catch {
      showToast("Could not copy. Select and copy the text manually.", "error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 via-white to-brand/5 p-5 dark:border-zinc-800 dark:from-zinc-900/80 dark:via-zinc-950 dark:to-brand/10">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <LifeBuoy className="h-3.5 w-3.5" aria-hidden />
          Need help?
        </p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Report a bug, ask a question, or tell us what blocked your workflow. We read every message
          and usually reply within one business day.
        </p>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline dark:text-brand-on-dark"
        >
          <Mail className="h-4 w-4" aria-hidden />
          {SUPPORT_EMAIL}
        </a>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleEmailSupport}
          className="flex flex-col items-start rounded-2xl border border-zinc-200 bg-white p-4 text-left transition hover:border-brand/40 hover:bg-brand/5 dark:border-zinc-800 dark:bg-zinc-950/50 dark:hover:bg-brand/10"
        >
          <Mail className="h-5 w-5 text-brand" aria-hidden />
          <span className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Email support
          </span>
          <span className="mt-1 text-xs text-zinc-500">
            Opens your mail app with your studio details included.
          </span>
        </button>
        <button
          type="button"
          onClick={copyDiagnostics}
          className="flex flex-col items-start rounded-2xl border border-zinc-200 bg-white p-4 text-left transition hover:border-brand/40 hover:bg-brand/5 dark:border-zinc-800 dark:bg-zinc-950/50 dark:hover:bg-brand/10"
        >
          <Copy className="h-5 w-5 text-brand" aria-hidden />
          <span className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Copy diagnostics
          </span>
          <span className="mt-1 text-xs text-zinc-500">
            Paste into your message if email does not open automatically.
          </span>
        </button>
      </div>

      <section className="space-y-4 rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Report an issue</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Tell us what happened. Screenshots can be attached in your email after this opens.
          </p>
        </div>

        <label className="block">
          <span className={labelClass}>Topic</span>
          <FormSelect<SupportIssueCategoryId>
            value={category}
            onChange={setCategory}
            options={SUPPORT_ISSUE_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))}
          />
        </label>

        <label className="block">
          <span className={labelClass}>What went wrong?</span>
          <FormTextArea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            placeholder="What were you trying to do? What did you expect? What happened instead?"
            className="mt-2"
          />
        </label>

        <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-2.5 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
          <p className="font-medium text-zinc-700 dark:text-zinc-300">Included automatically</p>
          <p className="mt-1">
            {reporterEmail || "No email on file"}
            {studioName ? ` · ${studioName}` : ""}
            {` · ${PLANS[planId].label} plan`}
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSendReport}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover"
          >
            <Send className="h-4 w-4" aria-hidden />
            Send report
          </button>
        </div>
      </section>

      <p className="text-xs text-zinc-500">
        {APP_NAME} support is handled by email in this preview. A ticket inbox and in-app chat may
        be added when the production help desk is connected.
      </p>
    </div>
  );
}
