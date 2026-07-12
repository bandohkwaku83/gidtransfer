"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Card,
  Dropdown,
  Flex,
  Input,
  Select,
  Table,
  Tooltip,
} from "antd";
import type { MenuProps, TableColumnsType } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Inbox,
  MoreHorizontal,
  Paperclip,
  RotateCcw,
  User,
} from "lucide-react";
import {
  getIssueReports,
  updateIssueReport,
} from "@/lib/admin/issue-reports";
import { getErrorMessage } from "@/lib/admin/admin-client";
import type { IssueReport, IssueReportAttachment } from "@/lib/admin/types";
import { StatusChip } from "@/components/admin/ui/StatusChip";
import { SlideOver } from "@/components/admin/ui/SlideOver";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import { TabBar } from "@/components/admin/ui/TabBar";
import {
  formatDateTime,
  formatFileSize,
  formatRelative,
  sanitizeFileName,
  truncate,
} from "@/lib/admin/format";
import { useToast } from "@/lib/admin/use-admin-toast";
import { PageHeader } from "@/components/admin/ui/PageHeader";

const STATUS_TABS = [
  { label: "Open", value: "open" },
  { label: "Resolved", value: "resolved" },
  { label: "All", value: "" },
] as const;

type StatusTab = (typeof STATUS_TABS)[number]["value"];

function isImageAttachment(attachment: IssueReportAttachment) {
  return attachment.mimeType.startsWith("image/");
}

function TopicBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-primary ring-1 ring-primary/15">
      {label}
    </span>
  );
}

function AttachmentPreview({
  attachment,
}: {
  attachment: IssueReportAttachment;
}) {
  const [imageError, setImageError] = useState(false);
  const isImage = isImageAttachment(attachment) && !imageError;
  const displayName = sanitizeFileName(attachment.originalName);

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3 transition-all hover:border-primary/25 hover:shadow-sm"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
        {isImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={attachment.url}
            alt={displayName}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <FileText className="h-6 w-6 text-slate-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900 group-hover:text-primary">
          {displayName}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          {formatFileSize(attachment.sizeBytes)}
        </p>
      </div>
      <ExternalLink className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-primary" />
    </a>
  );
}

function SectionLabel({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}

function IssueDetailPanel({
  report,
}: {
  report: IssueReport;
}) {
  const reporterInitial = report.userEmail.charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <TopicBadge label={report.topicLabel} />
          <StatusChip status={report.status} />
        </div>
        <div className="text-right text-xs text-slate-500">
          <Tooltip title={formatDateTime(report.createdAt)}>
            <p className="flex items-center justify-end gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {formatRelative(report.createdAt)}
            </p>
          </Tooltip>
          {report.updatedAt !== report.createdAt && (
            <p className="mt-1 text-slate-400">
              Updated {formatRelative(report.updatedAt)}
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-slate-100 pt-6">
        <SectionLabel icon={User} label="Reporter" />
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light text-sm font-semibold text-primary">
            {reporterInitial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-slate-900">{report.userEmail}</p>
            <p className="mt-0.5 font-mono text-xs text-slate-400">
              {report.accountId}
            </p>
            <Link
              href={`/admin/photographers/${report.ownerId}`}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover"
            >
              View photographer profile
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-6">
        <SectionLabel icon={FileText} label="Description" />
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
          {report.description}
        </p>
      </div>

      {report.attachments.length > 0 && (
        <div className="border-t border-slate-100 pt-6">
          <SectionLabel
            icon={Paperclip}
            label={`Attachments (${report.attachmentCount})`}
          />
          <div className="space-y-2">
            {report.attachments.map((attachment) => (
              <AttachmentPreview
                key={attachment.filename}
                attachment={attachment}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function IssueDetailActions({
  report,
  actionLoading,
  onResolve,
  onReopen,
}: {
  report: IssueReport;
  actionLoading: boolean;
  onResolve: () => void;
  onReopen: () => void;
}) {
  if (report.status === "open") {
    return (
      <button
        onClick={onResolve}
        disabled={actionLoading}
        className="btn-primary w-full"
      >
        <CheckCircle2 className="h-4 w-4" />
        Mark resolved
      </button>
    );
  }

  return (
    <button
      onClick={onReopen}
      disabled={actionLoading}
      className="btn-secondary w-full"
    >
      <RotateCcw className="h-4 w-4" />
      Reopen
    </button>
  );
}

function SupportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [items, setItems] = useState<IssueReport[]>([]);
  const [topics, setTopics] = useState<{ id: string; label: string }[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selected, setSelected] = useState<IssueReport | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{
    report: IssueReport;
    status: "open" | "resolved";
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const status = (searchParams.get("status") ?? "open") as StatusTab;
  const topic = searchParams.get("topic") ?? "";
  const search = searchParams.get("search") ?? "";
  const page = Number(searchParams.get("page") ?? 1);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const hasActiveFilters = Boolean(search || topic);

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      if (key !== "page") params.delete("page");
      router.push(`/admin/support?${params.toString()}`);
    },
    [router, searchParams],
  );

  const setStatus = useCallback(
    (value: StatusTab) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set("status", value);
      else params.delete("status");
      params.delete("page");
      router.push(`/admin/support?${params.toString()}`);
    },
    [router, searchParams],
  );

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    ["search", "topic", "page"].forEach((key) => params.delete(key));
    router.push(`/admin/support?${params.toString()}`);
  }, [router, searchParams]);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    getIssueReports({ status, topic, search, page, limit: 50 })
      .then((data) => {
        setItems(data.items);
        setPagination(data.pagination);
        setTopics(data.topics ?? []);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [status, topic, search, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async () => {
    if (!confirmTarget) return;
    const { report, status: newStatus } = confirmTarget;
    setActionLoading(true);
    try {
      const result = await updateIssueReport(report.id, { status: newStatus });
      toast(result.message);
      setSelected((current) =>
        current?.id === report.id ? result.report : current,
      );
      setConfirmTarget(null);
      load();
    } catch (err) {
      toast(getErrorMessage(err), "error");
    } finally {
      setActionLoading(false);
    }
  };

  const openConfirm = (report: IssueReport, newStatus: "open" | "resolved") => {
    setConfirmTarget({ report, status: newStatus });
  };

  const columns: TableColumnsType<IssueReport> = useMemo(
    () => [
      {
        title: "Topic",
        dataIndex: "topicLabel",
        key: "topic",
        width: 160,
        render: (topicLabel: string) => <TopicBadge label={topicLabel} />,
      },
      {
        title: "Reporter",
        key: "reporter",
        render: (_, record) => (
          <div>
            <p className="font-medium text-slate-900">{record.userEmail}</p>
            <p className="font-mono text-xs text-slate-400">{record.accountId}</p>
          </div>
        ),
      },
      {
        title: "Description",
        dataIndex: "description",
        key: "description",
        ellipsis: true,
        render: (description: string) => (
          <span className="text-slate-600">{truncate(description, 90)}</span>
        ),
      },
      {
        title: "Files",
        key: "attachments",
        width: 80,
        align: "center",
        render: (_, record) =>
          record.attachmentCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              <Paperclip className="h-3 w-3" />
              {record.attachmentCount}
            </span>
          ) : (
            <span className="text-slate-300">—</span>
          ),
      },
      {
        title: "Submitted",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 140,
        render: (createdAt: string) => (
          <Tooltip title={formatDateTime(createdAt)}>
            <span className="text-xs text-slate-500">
              {formatRelative(createdAt)}
            </span>
          </Tooltip>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 110,
        render: (status: string) => <StatusChip status={status} />,
      },
      {
        title: "",
        key: "actions",
        width: 56,
        align: "center",
        render: (_, record) => {
          const menuItems: MenuProps["items"] = [
            {
              key: "view",
              label: "View details",
              onClick: ({ domEvent }) => {
                domEvent.stopPropagation();
                setSelected(record);
              },
            },
            record.status === "open"
              ? {
                  key: "resolve",
                  label: "Mark resolved",
                  onClick: ({ domEvent }) => {
                    domEvent.stopPropagation();
                    openConfirm(record, "resolved");
                  },
                }
              : {
                  key: "reopen",
                  label: "Reopen",
                  onClick: ({ domEvent }) => {
                    domEvent.stopPropagation();
                    openConfirm(record, "open");
                  },
                },
            {
              key: "photographer",
              label: "View photographer",
              onClick: ({ domEvent }) => {
                domEvent.stopPropagation();
                router.push(`/admin/photographers/${record.ownerId}`);
              },
            },
          ];

          return (
            <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
              <Button
                type="text"
                size="small"
                icon={<MoreHorizontal className="h-4 w-4" />}
                onClick={(e) => e.stopPropagation()}
              />
            </Dropdown>
          );
        },
      },
    ],
    [router],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support"
        description="Review and resolve user issue reports"
      />

      <TabBar tabs={[...STATUS_TABS]} active={status} onChange={setStatus} />

      <Card bordered={false} className="shadow-sm">
        <Flex vertical gap={16}>
          <Input.Search
            allowClear
            size="large"
            placeholder="Search by email, account ID, or description…"
            prefix={<SearchOutlined className="text-slate-400" />}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onSearch={(value) => updateFilter("search", value)}
            onClear={() => updateFilter("search", "")}
          />

          <Flex wrap gap={12} align="center">
            <Select
              allowClear
              placeholder="All topics"
              style={{ minWidth: 200 }}
              value={topic || undefined}
              onChange={(value) => updateFilter("topic", value ?? "")}
              options={topics.map((t) => ({ value: t.id, label: t.label }))}
            />

            {hasActiveFilters && (
              <Button type="link" onClick={clearFilters} className="px-0">
                Clear filters
              </Button>
            )}

            {!loading && (
              <span className="ml-auto text-sm text-slate-400">
                {pagination.total === 0
                  ? "No results"
                  : `${pagination.total} report${pagination.total !== 1 ? "s" : ""}`}
              </span>
            )}
          </Flex>
        </Flex>
      </Card>

      {error && (
        <div className="card flex items-center gap-3 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <Card bordered={false} className="shadow-sm">
        <Table<IssueReport>
          rowKey="id"
          columns={columns}
          dataSource={items}
          loading={loading}
          scroll={{ x: "max-content" }}
          locale={{
            emptyText: (
              <div className="py-10 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                  <Inbox className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600">
                  No issue reports found
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {hasActiveFilters
                    ? "Try adjusting your filters"
                    : status === "open"
                      ? "The queue is clear — no open reports"
                      : "Reports will appear here when users submit them"}
                </p>
              </div>
            ),
          }}
          onRow={(record) => ({
            onClick: () => setSelected(record),
            style: { cursor: "pointer" },
          })}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: false,
            showTotal: (total, range) =>
              total === 0
                ? "No results"
                : `${range[0]}–${range[1]} of ${total}`,
            onChange: (nextPage) => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("page", String(nextPage));
              router.push(`/admin/support?${params.toString()}`);
            },
          }}
        />
      </Card>

      <SlideOver
        open={!!selected}
        title="Issue report"
        onClose={() => setSelected(null)}
        width="max-w-xl"
        footer={
          selected ? (
            <IssueDetailActions
              report={selected}
              actionLoading={actionLoading}
              onResolve={() => openConfirm(selected, "resolved")}
              onReopen={() => openConfirm(selected, "open")}
            />
          ) : undefined
        }
      >
        {selected && <IssueDetailPanel report={selected} />}
      </SlideOver>

      <ConfirmDialog
        open={!!confirmTarget}
        title={
          confirmTarget?.status === "resolved"
            ? "Resolve issue report?"
            : "Reopen issue report?"
        }
        description={
          confirmTarget?.status === "resolved"
            ? "This will mark the report as resolved. The reporter will no longer see it as open."
            : "This will reopen the report so it appears in the open queue again."
        }
        confirmLabel={
          confirmTarget?.status === "resolved" ? "Resolve" : "Reopen"
        }
        loading={actionLoading}
        onConfirm={handleStatusChange}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}

export default function SupportPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
          <div className="card h-96 animate-pulse bg-slate-50" />
        </div>
      }
    >
      <SupportContent />
    </Suspense>
  );
}
