"use client";

import {
  DEFAULT_PLATFORM_SMS_SENDER,
  smsSenderStatusBadgeClass,
  smsSenderStatusLabel,
  smsSenderStatusMessage,
  type StudioSmsFields,
} from "@/lib/sms-sender";
import { cn } from "@/lib/utils";

type SmsSenderStatusBannerProps = {
  fields: StudioSmsFields;
  platformSender?: string;
  className?: string;
};

export function SmsSenderStatusBanner({
  fields,
  platformSender = DEFAULT_PLATFORM_SMS_SENDER,
  className,
}: SmsSenderStatusBannerProps) {
  const message = smsSenderStatusMessage(fields, platformSender);

  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-700 dark:bg-zinc-900/40",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">SMS sender</p>
        {fields.smsSenderId ? (
          <span className="rounded-md bg-white px-2 py-0.5 font-mono text-xs font-semibold text-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
            {fields.smsSenderId}
          </span>
        ) : null}
        <span
          className={cn(
            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            smsSenderStatusBadgeClass(fields.smsSenderStatus, fields.smsBrandingReady),
          )}
        >
          {smsSenderStatusLabel(fields.smsSenderStatus, fields.smsBrandingReady)}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{message}</p>
    </div>
  );
}
