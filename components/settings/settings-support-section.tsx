"use client";

import { useEffect, useRef, useState } from "react";
import { LifeBuoy, Paperclip, Send, X } from "lucide-react";
import { DashboardSpin } from "@/components/ui/skeletons";
import { useToast } from "@/components/toast-provider";
import { FormSelect } from "@/components/ui/form-select";
import { formModalLabelClass } from "@/components/ui/form-modal";
import { FormTextArea } from "@/components/ui/form-input";
import {
  getHelpSupportSettings,
  submitReportIssue,
  type HelpSupportSettings,
} from "@/lib/report-issue-api";
import {
  FALLBACK_HELP_SUPPORT_SETTINGS,
  attachmentsAcceptAttribute,
  fileMatchesAcceptedType,
  formatAttachmentSize,
} from "@/lib/support-contact";
import type { DemoAuthUser } from "@/lib/auth-demo";
import { usePlanEntitlements } from "@/lib/use-plan-entitlements";
import { cn } from "@/lib/utils";

const labelClass = formModalLabelClass;

type SettingsSupportSectionProps = {
  auth: DemoAuthUser | null;
};

export function SettingsSupportSection({ auth }: SettingsSupportSectionProps) {
  const { showToast } = useToast();
  const { plan } = usePlanEntitlements();
  const supportBadge =
    plan?.supportTier === "premium"
      ? "Premium"
      : plan?.supportTier === "priority"
        ? "Priority"
        : null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<HelpSupportSettings>(FALLBACK_HELP_SUPPORT_SETTINGS);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [topic, setTopic] = useState(
    FALLBACK_HELP_SUPPORT_SETTINGS.reportIssue.topics[0]?.id ?? "not_working",
  );
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { helpSupport, reportIssue } = settings;
  const attachmentConfig = reportIssue.attachments;

  const reporterEmail = auth?.user?.email ?? auth?.email ?? "";

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadingConfig(true);
      try {
        const next = await getHelpSupportSettings();
        if (cancelled) return;
        setSettings(next);
        setTopic((current) =>
          next.reportIssue.topics.some((item) => item.id === current)
            ? current
            : (next.reportIssue.topics[0]?.id ?? current),
        );
      } finally {
        if (!cancelled) setLoadingConfig(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function validateAttachment(file: File): string | null {
    if (!fileMatchesAcceptedType(file, attachmentConfig.acceptedTypes)) {
      return `${file.name} is not an accepted file type.`;
    }
    if (file.size > attachmentConfig.maxSizeBytes) {
      return `${file.name} exceeds ${formatAttachmentSize(attachmentConfig.maxSizeBytes)}.`;
    }
    return null;
  }

  function handleAttachmentChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (selected.length === 0) return;

    const remaining = Math.max(0, attachmentConfig.maxCount - attachments.length);
    if (remaining === 0) {
      showToast(`You can attach up to ${attachmentConfig.maxCount} files.`, "error");
      return;
    }

    const nextFiles = [...attachments];
    for (const file of selected.slice(0, remaining)) {
      const error = validateAttachment(file);
      if (error) {
        showToast(error, "error");
        continue;
      }
      nextFiles.push(file);
    }

    if (selected.length > remaining) {
      showToast(`Only ${attachmentConfig.maxCount} files can be attached.`, "error");
    }

    setAttachments(nextFiles);
  }

  function removeAttachment(index: number) {
    setAttachments((current) => current.filter((_, i) => i !== index));
  }

  async function handleSendReport() {
    const trimmed = message.trim();
    if (!trimmed) {
      showToast("Describe the issue so we can help.", "error");
      return;
    }
    if (!reporterEmail) {
      showToast("Sign in to send a report with your account details.", "error");
      return;
    }
    if (!topic) {
      showToast("Choose a topic for your report.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitReportIssue({
        topic,
        description: trimmed,
        attachments: attachmentConfig.enabled ? attachments : undefined,
      });
      showToast(result.message || "Report submitted.", "success");
      setMessage("");
      setAttachments([]);
      setTopic(settings.reportIssue.topics[0]?.id ?? "not_working");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not submit your report.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 via-white to-brand/5 p-5 dark:border-zinc-800 dark:from-zinc-900/80 dark:via-zinc-950 dark:to-brand/10">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <LifeBuoy className="h-3.5 w-3.5" aria-hidden />
          Need help?
          {supportBadge ? (
            <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              {supportBadge}
            </span>
          ) : null}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {helpSupport.subtitle}
        </p>
      </div>

      <section className="space-y-4 rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {reportIssue.title}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">{reportIssue.subtitle}</p>
        </div>

        <label className="block">
          <span className={labelClass}>Topic</span>
          <FormSelect
            value={topic}
            onChange={setTopic}
            loading={loadingConfig}
            disabled={loadingConfig || submitting}
            options={reportIssue.topics.map((item) => ({ value: item.id, label: item.label }))}
          />
        </label>

        <label className="block">
          <span className={labelClass}>What went wrong?</span>
          <FormTextArea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            disabled={submitting}
            placeholder={reportIssue.descriptionPlaceholder}
            className="mt-2"
          />
        </label>

        {attachmentConfig.enabled ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className={labelClass}>Attachments</p>
                <p className="mt-0.5 text-xs text-zinc-500">{attachmentConfig.hint}</p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={
                  submitting ||
                  loadingConfig ||
                  attachments.length >= attachmentConfig.maxCount
                }
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-brand/40 hover:bg-brand/5 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-brand/10",
                  (submitting ||
                    loadingConfig ||
                    attachments.length >= attachmentConfig.maxCount) &&
                    "cursor-not-allowed opacity-60",
                )}
              >
                <Paperclip className="h-4 w-4" aria-hidden />
                Add files
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={attachmentsAcceptAttribute(attachmentConfig.acceptedTypes)}
              className="hidden"
              onChange={handleAttachmentChange}
            />

            {attachments.length > 0 ? (
              <ul className="space-y-2">
                {attachments.map((file, index) => (
                  <li
                    key={`${file.name}-${file.size}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {file.name}
                      </p>
                      <p className="text-xs text-zinc-500">{formatAttachmentSize(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      disabled={submitting}
                      className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void handleSendReport()}
            disabled={submitting || loadingConfig}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover",
              (submitting || loadingConfig) && "cursor-not-allowed opacity-70",
            )}
          >
            {submitting ? (
              <DashboardSpin size="small" />
            ) : (
              <Send className="h-4 w-4" aria-hidden />
            )}
            {submitting ? "Submitting…" : "Submit report"}
          </button>
        </div>
      </section>
    </div>
  );
}
