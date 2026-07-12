"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getSmsSenderIds,
  approveSmsSender,
  rejectSmsSender,
} from "@/lib/admin/sms";
import { getErrorMessage } from "@/lib/admin/admin-client";
import type { SmsSenderItem } from "@/lib/admin/types";
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

const TABS = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "All", value: "" },
];

function SmsApprovalsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [items, setItems] = useState<SmsSenderItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approveTarget, setApproveTarget] = useState<SmsSenderItem | null>(
    null,
  );
  const [rejectTarget, setRejectTarget] = useState<SmsSenderItem | null>(
    null,
  );
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const status = searchParams.get("status") ?? "pending";
  const page = Number(searchParams.get("page") ?? 1);

  const setStatus = useCallback(
    (value: string) => {
      const params = new URLSearchParams();
      if (value) params.set("status", value);
      router.push(`/admin/sms/sender-ids?${params.toString()}`);
    },
    [router],
  );

  const load = () => {
    setLoading(true);
    getSmsSenderIds({ status: status || undefined, page, limit: 50 })
      .then((data) => {
        setItems(data.items);
        setPagination(data.pagination);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [searchParams]);

  const handleApprove = async () => {
    if (!approveTarget) return;
    setActionLoading(true);
    try {
      await approveSmsSender(approveTarget.userId);
      toast("SMS sender ID approved");
      setApproveTarget(null);
      load();
    } catch (err) {
      toast(getErrorMessage(err), "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setActionLoading(true);
    try {
      await rejectSmsSender(rejectTarget.userId, rejectReason || undefined);
      toast("SMS sender ID rejected");
      setRejectTarget(null);
      setRejectReason("");
      load();
    } catch (err) {
      toast(getErrorMessage(err), "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="SMS Approvals"
        description="Review and approve photographer SMS sender IDs"
      />

      <TabBar tabs={TABS} active={status} onChange={setStatus} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Table>
        <TableHead>
          <TableHeaderCell>Studio</TableHeaderCell>
          <TableHeaderCell>Sender ID</TableHeaderCell>
          <TableHeaderCell>Photographer</TableHeaderCell>
          <TableHeaderCell>Requested</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Actions</TableHeaderCell>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                No SMS sender IDs found
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <TableRow key={item.userId}>
                <TableCell>{item.companyName}</TableCell>
                <TableCell className="font-mono">
                  {item.smsSenderId}
                </TableCell>
                <TableCell>
                  <div>{item.email}</div>
                  <div className="font-mono text-xs text-zinc-400">
                    {item.accountId}
                  </div>
                </TableCell>
                <TableCell className="text-xs">
                  {formatDateTime(item.smsSenderRequestedAt)}
                </TableCell>
                <TableCell>
                  <StatusChip status={item.smsSenderStatus} />
                </TableCell>
                <TableCell>
                  {item.smsSenderStatus === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setApproveTarget(item)}
                        className="text-sm font-medium text-emerald-600 hover:underline"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectTarget(item)}
                        className="text-sm font-medium text-red-600 hover:underline"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {item.smsSenderRejectedReason && (
                    <p className="mt-1 text-xs text-zinc-400">
                      {item.smsSenderRejectedReason}
                    </p>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Pagination pagination={pagination} />

      <ConfirmDialog
        open={!!approveTarget}
        title="Approve SMS sender ID"
        description={
          approveTarget ? (
            <span>
              Approve sender ID{" "}
              <strong className="font-mono">{approveTarget.smsSenderId}</strong>{" "}
              for {approveTarget.companyName}?
            </span>
          ) : null
        }
        confirmLabel="Approve"
        loading={actionLoading}
        onConfirm={handleApprove}
        onCancel={() => setApproveTarget(null)}
      />

      <ConfirmDialog
        open={!!rejectTarget}
        title="Reject SMS sender ID"
        description={
          <div className="space-y-3">
            <p>
              Reject sender ID{" "}
              <strong className="font-mono">{rejectTarget?.smsSenderId}</strong>?
            </p>
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Reason (optional)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
        }
        confirmLabel="Reject"
        destructive
        loading={actionLoading}
        onConfirm={handleReject}
        onCancel={() => {
          setRejectTarget(null);
          setRejectReason("");
        }}
      />
    </div>
  );
}

export default function SmsApprovalsPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-zinc-200" />}>
      <SmsApprovalsContent />
    </Suspense>
  );
}
