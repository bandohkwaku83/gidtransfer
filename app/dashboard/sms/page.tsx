"use client";

import { ReloadOutlined } from "@ant-design/icons";
import { Alert, Button, Select, Spin } from "antd";
import type { TextAreaRef } from "antd/es/input/TextArea";
import { ChevronRight, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { dashboardPageHeaderCtaClassName } from "@/components/dashboard/dashboard-page-header";
import { useToast } from "@/components/toast-provider";
import { FormTextArea } from "@/components/ui/form-input";
import type { ApiClient } from "@/lib/clients-api";
import { ApiError, listClients } from "@/lib/clients-api";
import {
  FoldersApiError,
  getFolderClientName,
  listFolders,
  type ApiFolder,
} from "@/lib/folders-api";
import {
  getSmsConfig,
  sendSms,
  SMS_ARKESEL_NOT_CONFIGURED_MESSAGE,
  SMS_CONFIG_LOAD_FAILED_MESSAGE,
  SMS_NO_SENDER_MESSAGE,
  smsApiErrorMessage,
  SmsApiError,
  type SmsConfigResponse,
} from "@/lib/sms-api";
import { settingsTabHref } from "@/lib/settings-tabs";
import { cn } from "@/lib/utils";

type AudienceMode = "everyone" | "gallery" | "specific";

const AUDIENCE_TABS: { id: AudienceMode; label: string }[] = [
  { id: "everyone", label: "Everyone" },
  { id: "gallery", label: "By gallery" },
  { id: "specific", label: "Specific people" },
];

const PLACEHOLDERS = [{ key: "client", token: "{client}", label: "Client name" }] as const;

const GSM7_SINGLE = 160;
const GSM7_MULTI = 153;
const UNICODE_SINGLE = 70;
const UNICODE_MULTI = 67;

/** Rough encoding check for counter UX — non-Latin / emoji flip to Unicode limits. */
function isGsm7(text: string): boolean {
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    if (code > 0x7f) return false;
  }
  return true;
}

function smsEncodingMeta(text: string) {
  const gsm = isGsm7(text);
  const len = text.length;
  const single = gsm ? GSM7_SINGLE : UNICODE_SINGLE;
  const multi = gsm ? GSM7_MULTI : UNICODE_MULTI;
  let parts = 0;
  if (len > 0) {
    parts = len <= single ? 1 : Math.ceil(len / multi);
  }
  const perPart = parts <= 1 ? single : multi;
  return {
    encoding: gsm ? "GSM-7" : "Unicode",
    len,
    parts,
    perPart,
    single,
  };
}

export default function SmsPage() {
  const { showToast } = useToast();
  const broadcastRef = useRef<TextAreaRef | null>(null);

  const [config, setConfig] = useState<SmsConfigResponse | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  const [audienceMode, setAudienceMode] = useState<AudienceMode>("everyone");
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(undefined);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [sending, setSending] = useState(false);

  const [clients, setClients] = useState<ApiClient[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [folders, setFolders] = useState<ApiFolder[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(false);

  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    setConfigError(null);
    try {
      const next = await getSmsConfig();
      setConfig(next);
    } catch (e) {
      setConfig(null);
      setConfigError(
        e instanceof SmsApiError
          ? e.message || SMS_CONFIG_LOAD_FAILED_MESSAGE
          : SMS_CONFIG_LOAD_FAILED_MESSAGE,
      );
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    let cancelled = false;
    setClientsLoading(true);
    void (async () => {
      try {
        const cRes = await listClients("");
        if (!cancelled) setClients(cRes.clients);
      } catch (e) {
        const msg =
          e instanceof ApiError || e instanceof SmsApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Could not load clients.";
        showToast(msg, "error");
        if (!cancelled) setClients([]);
      } finally {
        if (!cancelled) setClientsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  useEffect(() => {
    let cancelled = false;
    setFoldersLoading(true);
    void (async () => {
      try {
        const fList = await listFolders(
          selectedClientId ? { clientId: selectedClientId } : {},
        );
        if (!cancelled) setFolders(fList);
      } catch (e) {
        const msg =
          e instanceof FoldersApiError || e instanceof SmsApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Could not load galleries.";
        showToast(msg, "error");
        if (!cancelled) setFolders([]);
      } finally {
        if (!cancelled) setFoldersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedClientId, showToast]);

  const providerConfigured = config?.configured === true;
  const studioSender = config?.studio.smsSenderId?.trim() || "";
  const brandingReady = config?.studio.smsBrandingReady === true;
  const defaultSender = config?.defaultSender?.trim() || "Gidtransfer";
  const needsDisplayName = providerConfigured && !brandingReady && !studioSender;
  const effectiveSender = brandingReady && studioSender ? studioSender : defaultSender;

  const headerStatusLabel = configLoading
    ? "Checking…"
    : configError
      ? "Unavailable"
      : providerConfigured
        ? "Connected"
        : "Not configured";

  const headerStatusDot = configLoading
    ? "bg-zinc-400"
    : configError
      ? "bg-rose-500"
      : providerConfigured
        ? "bg-emerald-500"
        : "bg-amber-500";

  const meta = useMemo(() => smsEncodingMeta(broadcastMessage), [broadcastMessage]);

  const recipientCount = useMemo(() => {
    if (audienceMode === "specific") return selectedClientId ? 1 : 0;
    if (clientsLoading) return null;
    return clients.length;
  }, [audienceMode, selectedClientId, clientsLoading, clients.length]);

  const recipientType = audienceMode === "specific" ? "client" : "all_clients";

  const insertToken = useCallback((token: string) => {
    const ta = broadcastRef.current?.resizableTextArea?.textArea;
    if (!ta) {
      setBroadcastMessage((prev) => prev + token);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    setBroadcastMessage((prev) => {
      const next = prev.slice(0, start) + token + prev.slice(end);
      requestAnimationFrame(() => {
        broadcastRef.current?.focus();
        const pos = start + token.length;
        ta.setSelectionRange(pos, pos);
      });
      return next;
    });
  }, []);

  const sendBroadcastSms = useCallback(async () => {
    const text = broadcastMessage.trim();
    if (!text) {
      showToast("Enter a message.", "error");
      return;
    }
    if (!providerConfigured) {
      showToast(SMS_ARKESEL_NOT_CONFIGURED_MESSAGE, "error");
      return;
    }
    if (audienceMode === "specific" && !selectedClientId) {
      showToast("Select a client.", "error");
      return;
    }
    if (audienceMode === "gallery" && !selectedFolderId) {
      showToast("Select a gallery.", "error");
      return;
    }

    setSending(true);
    try {
      const res = await sendSms({
        recipientType,
        message: text,
        folderId: selectedFolderId || undefined,
        clientId: audienceMode === "specific" ? selectedClientId : undefined,
      });
      showToast(res.message, "success");
      setBroadcastMessage("");
      await loadConfig();
    } catch (e) {
      showToast(smsApiErrorMessage(e, "Send failed."), "error");
    } finally {
      setSending(false);
    }
  }, [
    broadcastMessage,
    audienceMode,
    recipientType,
    selectedClientId,
    selectedFolderId,
    providerConfigured,
    showToast,
    loadConfig,
  ]);

  const folderSelectOptions = useMemo(
    () =>
      folders.map((f) => ({
        value: f._id,
        label: `${f.eventName || "Gallery"}, ${getFolderClientName(f)}`,
      })),
    [folders],
  );

  const clientSelectOptions = useMemo(
    () =>
      clients.map((c) => ({
        value: c._id,
        label: `${c.name}, ${c.contact || c.email || "N/A"}`,
      })),
    [clients],
  );

  const audienceHint =
    audienceMode === "everyone"
      ? "All clients with a phone number on file."
      : audienceMode === "gallery"
        ? "Everyone, with placeholders linked to the gallery you pick."
        : "Send to one client only.";

  const billedParts = Math.max(meta.parts, 1);
  const billedRecipients = recipientCount ?? 0;
  const canSend =
    providerConfigured &&
    !configLoading &&
    !!broadcastMessage.trim() &&
    (audienceMode !== "specific" || !!selectedClientId) &&
    (audienceMode !== "gallery" || !!selectedFolderId);

  return (
    <div className="dashboard-page space-y-6">
      <header>
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm">
            <li>
              <Link
                href="/dashboard"
                className="font-medium text-zinc-400 transition hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
              >
                Dashboard
              </Link>
            </li>
            <li className="text-zinc-300 dark:text-zinc-600" aria-hidden>
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
            </li>
            <li>
              <Link
                href="/dashboard/notifications"
                className="font-semibold text-zinc-600 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Notifications
              </Link>
            </li>
            <li className="text-zinc-300 dark:text-zinc-600" aria-hidden>
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
            </li>
            <li className="font-semibold text-zinc-900 dark:text-zinc-50">SMS</li>
          </ol>
        </nav>
      </header>

      {configError ? (
        <Alert
          type="error"
          showIcon
          title={SMS_CONFIG_LOAD_FAILED_MESSAGE}
          description={configError}
          action={
            <Button size="small" icon={<ReloadOutlined />} onClick={() => void loadConfig()}>
              Retry
            </Button>
          }
        />
      ) : null}

      {!configError && config && config.configured === false ? (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
        >
          SMS isn’t configured for this studio yet.{" "}
          <span className="font-medium">{SMS_ARKESEL_NOT_CONFIGURED_MESSAGE}</span>
        </div>
      ) : null}

      {!configError && needsDisplayName ? (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
        >
          {SMS_NO_SENDER_MESSAGE} Messages will use the platform default (
          <span className="font-medium">{defaultSender}</span>) until you add one.{" "}
          <Link
            href={settingsTabHref("profile")}
            className="font-semibold underline underline-offset-2"
          >
            Open settings
          </Link>
        </div>
      ) : null}

      <Spin spinning={configLoading}>
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Audience */}
          <section className="dashboard-panel min-w-0 space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  Audience
                </h2>
                <p className="mt-0.5 text-sm text-zinc-500">Pick who receives this message.</p>
              </div>
              <button
                type="button"
                onClick={() => void loadConfig()}
                disabled={configLoading}
                aria-label="Refresh SMS settings"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
              >
                {configLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300">
                <span className={cn("h-1.5 w-1.5 rounded-full", headerStatusDot)} aria-hidden />
                {headerStatusLabel}
              </span>
              <span className="text-zinc-300 dark:text-zinc-600" aria-hidden>·</span>
              <span>
                Sending as{" "}
                <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                  {configLoading || configError ? "…" : effectiveSender}
                </span>
              </span>
              {!configLoading && !configError && !studioSender ? (
                <>
                  <span className="text-zinc-300 dark:text-zinc-600" aria-hidden>·</span>
                  <Link
                    href={settingsTabHref("profile")}
                    className="font-medium text-brand transition hover:underline dark:text-brand-on-dark"
                  >
                    Set display name
                  </Link>
                </>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-zinc-500">Recipients</p>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {recipientCount === null
                    ? "…"
                    : recipientCount === 1
                      ? "1 recipient"
                      : `${recipientCount} recipients`}
                </p>
              </div>

              <div
                role="tablist"
                aria-label="Audience mode"
                className="grid grid-cols-3 gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900"
              >
                {AUDIENCE_TABS.map((tab) => {
                  const active = audienceMode === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => {
                        setAudienceMode(tab.id);
                        if (tab.id !== "specific") setSelectedClientId(undefined);
                        if (tab.id !== "gallery") setSelectedFolderId("");
                      }}
                      className={cn(
                        "rounded-lg px-2 py-2 text-center text-xs font-semibold transition sm:text-sm",
                        active
                          ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                          : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
                      )}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <p className="text-xs leading-relaxed text-zinc-500">{audienceHint}</p>

              {audienceMode === "gallery" ? (
                <div className="grid gap-2">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Gallery
                  </label>
                  <Select
                    allowClear
                    showSearch
                    placeholder="Select a gallery…"
                    optionFilterProp="label"
                    className="w-full"
                    loading={foldersLoading}
                    value={selectedFolderId || undefined}
                    onChange={(id) => setSelectedFolderId(id ?? "")}
                    options={folderSelectOptions}
                  />
                </div>
              ) : null}

              {audienceMode === "specific" ? (
                <div className="grid gap-2">
                  <label
                    htmlFor="sms-client-select"
                    className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
                  >
                    Client
                  </label>
                  <Select
                    id="sms-client-select"
                    showSearch
                    allowClear
                    placeholder="Search and select a client…"
                    optionFilterProp="label"
                    className="w-full"
                    loading={clientsLoading}
                    value={selectedClientId}
                    onChange={(id) => setSelectedClientId(id)}
                    options={clientSelectOptions}
                  />
                </div>
              ) : null}
            </div>
          </section>

          {/* Message */}
          <section className="dashboard-panel min-w-0 space-y-3">
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Message</h2>
              <p className="mt-0.5 text-sm text-zinc-500">Write what clients will receive.</p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {PLACEHOLDERS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => insertToken(p.token)}
                    className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700 transition hover:bg-brand/5 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <FormTextArea
                ref={broadcastRef}
                rows={7}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Hi {client}, your gallery is ready to view…"
                disabled={!providerConfigured}
                className="min-h-[160px]"
              />

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
                <span className="tabular-nums">
                  {meta.parts || 0} SMS · {meta.len} / {meta.perPart} chars
                </span>
                <span>
                  {meta.encoding} · {meta.single} chars/SMS
                </span>
              </div>

              <div className="rounded-xl bg-zinc-100/80 px-3.5 py-3 text-xs leading-relaxed text-zinc-600 dark:bg-zinc-900/60 dark:text-zinc-400">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Cost note.</span>{" "}
                1 SMS = {GSM7_SINGLE} chars (GSM-7) or {UNICODE_SINGLE} chars (Unicode — emoji,
                accents). Longer messages split into multi-part SMS at {GSM7_MULTI}/{UNICODE_MULTI}{" "}
                chars each. You’ll be billed {billedParts} SMS
                {billedRecipients > 0 ? ` × ${billedRecipients} recipients` : ""}.
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!canSend || sending}
                  onClick={() => void sendBroadcastSms()}
                  className={cn(
                    dashboardPageHeaderCtaClassName(),
                    "disabled:cursor-not-allowed disabled:opacity-45",
                  )}
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Sending…
                    </>
                  ) : (
                    "Send SMS"
                  )}
                </button>
              </div>
            </div>
          </section>
        </div>
      </Spin>
    </div>
  );
}
