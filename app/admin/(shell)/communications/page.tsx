"use client";

import { Suspense, useCallback, useEffect, useState, Fragment } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getCommunicationsConfig,
  getCommunications,
  sendSms,
  sendEmail,
} from "@/lib/admin/communications";
import { getPhotographers } from "@/lib/admin/photographers";
import { getErrorMessage } from "@/lib/admin/admin-client";
import type {
  CommunicationConfig,
  CommunicationRecord,
  SendResult,
} from "@/lib/admin/types";
import {
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  TableSkeleton,
} from "@/components/admin/ui/Table";
import { StatusChip } from "@/components/admin/ui/StatusChip";
import { Pagination } from "@/components/admin/ui/Pagination";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import { formatDateTime } from "@/lib/admin/format";
import { useToast } from "@/lib/admin/use-admin-toast";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { TabBar } from "@/components/admin/ui/TabBar";
import { AlertTriangle } from "lucide-react";

function BroadcastTab({
  config,
}: {
  config: CommunicationConfig | null;
}) {
  const { toast } = useToast();
  const [tab, setTab] = useState<"userIds" | "filters">("filters");
  const [channel, setChannel] = useState<"sms" | "email">("email");
  const [userIds, setUserIds] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);

  const [filters, setFilters] = useState({
    onboarded: "",
    emailVerified: "",
    isActive: "",
    subscriptionStatus: "",
  });

  const maxMessage =
    channel === "sms"
      ? (config?.maxSmsLength ?? 160)
      : (config?.maxEmailMessageLength ?? 5000);

  const previewCount = async () => {
    setPreviewLoading(true);
    try {
      if (tab === "userIds") {
        const ids = userIds
          .split(/[\n,]+/)
          .map((s) => s.trim())
          .filter(Boolean);
        setRecipientCount(ids.length);
      } else {
        const data = await getPhotographers({
          ...filters,
          limit: 1,
          page: 1,
        });
        setRecipientCount(data.pagination.total);
      }
    } catch (err) {
      toast(getErrorMessage(err), "error");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const body: {
        userIds?: string[];
        filters?: Record<string, string>;
        message: string;
        subject?: string;
      } = { message };

      if (tab === "userIds") {
        body.userIds = userIds
          .split(/[\n,]+/)
          .map((s) => s.trim())
          .filter(Boolean);
      } else {
        body.filters = Object.fromEntries(
          Object.entries(filters).filter(([, v]) => v),
        );
      }

      let sendResult: SendResult;
      if (channel === "sms") {
        sendResult = await sendSms(body);
      } else {
        sendResult = await sendEmail({ ...body, subject });
      }

      setResult(sendResult);
      toast(
        `Sent ${sendResult.sent} of ${sendResult.targeted} recipients`,
      );
      setConfirmOpen(false);
    } catch (err) {
      toast(getErrorMessage(err), "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {config && (!config.smsConfigured || !config.emailConfigured) && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            {!config.smsConfigured && <p>SMS is not configured.</p>}
            {!config.emailConfigured && <p>Email is not configured.</p>}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4">
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={channel === "email"}
              onChange={() => setChannel("email")}
            />
            Email
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={channel === "sms"}
              onChange={() => setChannel("sms")}
            />
            SMS
          </label>
        </div>

        <div className="flex gap-2 border-b border-zinc-200">
          <button
            onClick={() => setTab("filters")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === "filters"
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500"
            }`}
          >
            Filter-based
          </button>
          <button
            onClick={() => setTab("userIds")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === "userIds"
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500"
            }`}
          >
            Paste user IDs
          </button>
        </div>

        {tab === "userIds" ? (
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              User IDs (comma or newline separated)
            </label>
            <textarea
              value={userIds}
              onChange={(e) => setUserIds(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm font-mono"
            />
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <select
              value={filters.onboarded}
              onChange={(e) =>
                setFilters((f) => ({ ...f, onboarded: e.target.value }))
              }
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            >
              <option value="">Onboarded: All</option>
              <option value="true">Onboarded</option>
              <option value="false">Not onboarded</option>
            </select>
            <select
              value={filters.emailVerified}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  emailVerified: e.target.value,
                }))
              }
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            >
              <option value="">Email: All</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>
            <select
              value={filters.isActive}
              onChange={(e) =>
                setFilters((f) => ({ ...f, isActive: e.target.value }))
              }
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            >
              <option value="">Status: All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <select
              value={filters.subscriptionStatus}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  subscriptionStatus: e.target.value,
                }))
              }
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            >
              <option value="">Subscription: All</option>
              <option value="free">Free</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        )}

        {channel === "email" && (
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={config?.maxSubjectLength ?? 200}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={maxMessage}
            rows={6}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-zinc-400">
            {message.length} / {maxMessage}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={previewCount}
            disabled={previewLoading}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
          >
            {previewLoading ? "Counting…" : "Preview recipient count"}
          </button>
          {recipientCount != null && (
            <span className="text-sm text-zinc-600">
              ~{recipientCount} recipient{recipientCount !== 1 ? "s" : ""}
            </span>
          )}
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={!message.trim()}
            className="ml-auto rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            Send broadcast
          </button>
        </div>
      </div>

      {result && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="text-sm font-medium text-zinc-500">Send result</h3>
          <div className="mt-2 flex gap-4 text-sm">
            <span>Targeted: {result.targeted}</span>
            <span className="text-emerald-600">Sent: {result.sent}</span>
            <span className="text-red-600">Failed: {result.failed}</span>
            <span className="text-zinc-500">Skipped: {result.skipped}</span>
          </div>
          {result.results && (
            <div className="mt-4 space-y-2">
              {result.results.email?.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span>{r.email}</span>
                  <StatusChip status={r.status} />
                  {r.error && (
                    <span className="text-xs text-red-500">{r.error}</span>
                  )}
                </div>
              ))}
              {result.results.sms?.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span>{r.email}</span>
                  <StatusChip status={r.status} />
                  {r.error && (
                    <span className="text-xs text-red-500">{r.error}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Send broadcast"
        description={`Send ${channel.toUpperCase()} to ~${recipientCount ?? "?"} recipient(s)? This action cannot be undone.`}
        confirmLabel="Send"
        loading={sending}
        onConfirm={handleSend}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

function HistoryTab() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<CommunicationRecord[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const channel = searchParams.get("channel") ?? "";
  const userId = searchParams.get("userId") ?? "";
  const page = Number(searchParams.get("page") ?? 1);

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      if (key !== "page") params.delete("page");
      router.push(`/admin/communications?tab=history&${params.toString()}`);
    },
    [router, searchParams],
  );

  useEffect(() => {
    setLoading(true);
    getCommunications({
      channel: channel || undefined,
      userId: userId || undefined,
      page,
      limit: 50,
    })
      .then((data) => {
        setItems(data.items);
        setPagination(data.pagination);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [searchParams]);

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <select
          value={channel}
          onChange={(e) => updateFilter("channel", e.target.value)}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
        >
          <option value="">All channels</option>
          <option value="sms">SMS</option>
          <option value="email">Email</option>
        </select>
        {userId && (
          <span className="flex items-center text-sm text-zinc-500">
            Filtered by user: {userId}
            <button
              onClick={() => updateFilter("userId", "")}
              className="ml-2 text-zinc-900 hover:underline"
            >
              Clear
            </button>
          </span>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Table>
        <TableHead>
          <TableHeaderCell>When</TableHeaderCell>
          <TableHeaderCell>Channel</TableHeaderCell>
          <TableHeaderCell>Admin</TableHeaderCell>
          <TableHeaderCell>Subject</TableHeaderCell>
          <TableHeaderCell>Summary</TableHeaderCell>
          <TableHeaderCell>Actions</TableHeaderCell>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                No communications found
              </td>
            </tr>
          ) : (
            items.map((record) => (
              <Fragment key={record.id}>
                <TableRow>
                  <TableCell className="text-xs">
                    {formatDateTime(record.createdAt)}
                  </TableCell>
                  <TableCell>
                    <StatusChip status={record.channel} />
                  </TableCell>
                  <TableCell>{record.adminEmail}</TableCell>
                  <TableCell>{record.subject || "—"}</TableCell>
                  <TableCell>
                    <span className="text-emerald-600">{record.sent} sent</span>
                    {record.failed > 0 && (
                      <span className="ml-2 text-red-600">
                        {record.failed} failed
                      </span>
                    )}
                    {record.skipped > 0 && (
                      <span className="ml-2 text-zinc-400">
                        {record.skipped} skipped
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {record.recipients && (
                      <button
                        onClick={() =>
                          setExpanded(
                            expanded === record.id ? null : record.id,
                          )
                        }
                        className="text-sm font-medium hover:underline"
                      >
                        {expanded === record.id ? "Collapse" : "Expand"}
                      </button>
                    )}
                  </TableCell>
                </TableRow>
                {expanded === record.id && record.recipients && (
                  <tr>
                    <td colSpan={6} className="bg-zinc-50 px-4 py-3">
                      <div className="space-y-1">
                        {record.recipients.map((r, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-sm"
                          >
                            <span>{r.email}</span>
                            <StatusChip status={r.status} />
                            {r.error && (
                              <span className="text-xs text-red-500">
                                {r.error}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))
          )}
        </TableBody>
      </Table>

      <Pagination pagination={pagination} />
    </div>
  );
}

function CommunicationsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [config, setConfig] = useState<CommunicationConfig | null>(null);
  const activeTab =
    searchParams.get("tab") === "history" ? "history" : "broadcast";

  useEffect(() => {
    getCommunicationsConfig().then(setConfig).catch(() => {});
  }, []);

  const setTab = (tab: "broadcast" | "history") => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "history") params.set("tab", "history");
    else params.delete("tab");
    router.push(`/admin/communications?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Communications"
        description="Send broadcasts and view communication history"
      />

      <TabBar
        tabs={[
          { label: "Send broadcast", value: "broadcast" as const },
          { label: "History", value: "history" as const },
        ]}
        active={activeTab}
        onChange={setTab}
      />

      {activeTab === "broadcast" ? (
        <BroadcastTab config={config} />
      ) : (
        <HistoryTab />
      )}
    </div>
  );
}

export default function CommunicationsPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-zinc-200" />}>
      <CommunicationsContent />
    </Suspense>
  );
}
