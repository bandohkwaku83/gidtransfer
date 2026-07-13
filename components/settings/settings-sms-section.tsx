"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { SmsSenderIdField } from "@/components/sms/sms-sender-id-field";
import { SmsSenderStatusBanner } from "@/components/sms/sms-sender-status-banner";
import { ContactNumberInput } from "@/components/ui/form-input";
import { formModalLabelClass } from "@/components/ui/form-modal";
import type { DemoAuthUser } from "@/lib/auth-demo";
import {
  settingsErrorMessage,
  updateProfileSettings,
  type SettingsPageData,
} from "@/lib/settings-api";
import {
  deriveSmsSenderIdFromCompanyName,
  smsSenderIdValidationMessage,
  studioSmsFieldsFromApi,
} from "@/lib/sms-sender";
import {
  getSmsConfig,
  sendTestSms,
  smsApiErrorMessage,
} from "@/lib/sms-api";
import { cn } from "@/lib/utils";

type SettingsSmsSectionProps = {
  auth: DemoAuthUser | null;
  pageData: SettingsPageData | null;
  onProfileUpdated?: (data: SettingsPageData) => void;
};

export function SettingsSmsSection({
  auth,
  pageData,
  onProfileUpdated,
}: SettingsSmsSectionProps) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [testBusy, setTestBusy] = useState(false);
  const [smsSenderId, setSmsSenderId] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [platformSender, setPlatformSender] = useState("Gidtransfer");
  const [configured, setConfigured] = useState(false);

  const studio = auth?.user?.studio;
  const apiStudio = pageData?.bundle.studio;
  const smsFields = studioSmsFieldsFromApi({ ...studio, ...apiStudio });
  const savedSmsSenderId = smsFields.smsSenderId ?? "";

  const syncFromData = useCallback(() => {
    setSmsSenderId(savedSmsSenderId);
    setTestPhone(apiStudio?.phone?.trim() ?? studio?.phone?.trim() ?? "");
  }, [apiStudio?.phone, savedSmsSenderId, studio?.phone]);

  useEffect(() => {
    syncFromData();
  }, [syncFromData]);

  useEffect(() => {
    let cancelled = false;
    void getSmsConfig()
      .then((config) => {
        if (cancelled) return;
        setConfigured(config.configured);
        setPlatformSender(config.defaultSender?.trim() || "Gidtransfer");
      })
      .catch(() => {
        if (!cancelled) setConfigured(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const companyName =
    apiStudio?.companyName?.trim() ||
    apiStudio?.businessName?.trim() ||
    studio?.companyName?.trim() ||
    "";
  const suggestion =
    smsFields.suggestedSmsSenderId ||
    deriveSmsSenderIdFromCompanyName(companyName);
  const smsChanged = smsSenderId.trim().toUpperCase() !== savedSmsSenderId.toUpperCase();
  const smsValidation = smsSenderIdValidationMessage(smsSenderId);

  async function handleRequestName() {
    if (busy || !auth?.user) return;
    if (smsValidation) {
      showToast(smsValidation, "error");
      return;
    }
    if (!smsChanged) {
      showToast("Enter a new SMS display name first.", "error");
      return;
    }

    setBusy(true);
    try {
      const saved = await updateProfileSettings({
        businessName: companyName,
        companySlug:
          apiStudio?.companySlug?.trim() ||
          studio?.companySlug?.trim() ||
          "",
        phone: apiStudio?.phone?.trim() || studio?.phone?.trim() || "",
        website: apiStudio?.website?.trim() || studio?.website?.trim() || undefined,
        smsSenderId: smsSenderId.trim().toUpperCase(),
      });
      onProfileUpdated?.(saved);
      showToast("SMS display name submitted for approval.", "success");
    } catch (e) {
      showToast(settingsErrorMessage(e, "Could not request SMS display name."), "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleTestSms() {
    if (testBusy) return;
    const phone = testPhone.trim();
    if (!phone) {
      showToast("Enter a phone number for the test SMS.", "error");
      return;
    }

    setTestBusy(true);
    try {
      const res = await sendTestSms({ phone });
      showToast(res.message?.trim() || "Test SMS sent.", "success");
    } catch (e) {
      showToast(smsApiErrorMessage(e, "Could not send test SMS."), "error");
    } finally {
      setTestBusy(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
      <div>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">SMS branding</p>
        <p className="mt-0.5 text-xs text-zinc-500">
          Choose the sender name clients see on text messages from your studio.
        </p>
      </div>

      <SmsSenderStatusBanner fields={smsFields} platformSender={platformSender} />

      <SmsSenderIdField
        value={smsSenderId}
        onChange={setSmsSenderId}
        disabled={busy}
        variant="settings"
        error={smsSenderId.trim() ? smsValidation : null}
      />

      {!savedSmsSenderId && suggestion && !smsSenderId ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => setSmsSenderId(suggestion)}
          className="text-xs font-semibold text-brand hover:underline disabled:opacity-50"
        >
          Use suggested name: {suggestion}
        </button>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <button
          type="button"
          disabled={busy}
          onClick={syncFromData}
          className="text-sm font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
        >
          Reset
        </button>
        <button
          type="button"
          disabled={busy || !smsChanged || Boolean(smsValidation)}
          onClick={() => void handleRequestName()}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover disabled:opacity-50"
        >
          <Send className="h-4 w-4" aria-hidden />
          {busy ? "Submitting…" : "Request new name"}
        </button>
      </div>

      <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-900/40">
        <div className="flex items-start gap-2">
          <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Send test SMS</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {configured
                ? "Verify delivery with your business phone or any test number."
                : "SMS is not configured on the server yet — test sends may fail."}
            </p>
            <label className="mt-3 block">
              <span className={cn(formModalLabelClass, "normal-case")}>Phone number</span>
              <ContactNumberInput
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="e.g. +233200000000"
                disabled={testBusy}
                className="mt-2"
              />
            </label>
            <button
              type="button"
              disabled={testBusy}
              onClick={() => void handleTestSms()}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200"
            >
              {testBusy ? "Sending…" : "Send test SMS"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
