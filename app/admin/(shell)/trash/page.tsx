"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  getTrash,
  purgeExpiredTrash,
} from "@/lib/admin/trash";
import {
  purgeGallery,
  restoreGallery,
} from "@/lib/admin/galleries";
import { getErrorMessage } from "@/lib/admin/admin-client";
import type { TrashItem } from "@/lib/admin/types";
import {
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  TableSkeleton,
} from "@/components/admin/ui/Table";
import { Pagination } from "@/components/admin/ui/Pagination";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import { formatDateTime, formatRelative } from "@/lib/admin/format";
import { useToast } from "@/lib/admin/use-admin-toast";

function TrashContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [items, setItems] = useState<TrashItem[]>([]);
  const [retentionDays, setRetentionDays] = useState(30);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [target, setTarget] = useState<{
    type: "restore" | "purge" | "purge-expired";
    item?: TrashItem;
  } | null>(null);
  const [reason, setReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const page = Number(searchParams.get("page") ?? 1);

  const load = () => {
    setLoading(true);
    getTrash({ page, limit: 50 })
      .then((data) => {
        setItems(data.items);
        setPagination(data.pagination);
        setRetentionDays(data.retentionDays ?? 30);
        setError("");
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [page]);

  const handleConfirm = async () => {
    if (!target || reason.trim().length < 3) {
      toast("Reason is required (min 3 characters)", "error");
      return;
    }
    setActionLoading(true);
    try {
      if (target.type === "restore" && target.item) {
        await restoreGallery(target.item.id, reason.trim());
        toast("Gallery restored");
      } else if (target.type === "purge" && target.item) {
        await purgeGallery(target.item.id, reason.trim());
        toast("Gallery purged");
      } else if (target.type === "purge-expired") {
        const result = await purgeExpiredTrash({ reason: reason.trim() });
        toast(
          `Purged ${result.galleries} galleries, ${result.photos} photos, ${result.finals} finals`,
        );
      }
      setTarget(null);
      setReason("");
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
        title="Trash"
        description={`Soft-deleted galleries · ${retentionDays}-day retention`}
        action={
          <button
            type="button"
            className="btn-primary"
            onClick={() => setTarget({ type: "purge-expired" })}
          >
            Purge expired
          </button>
        }
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Table>
        <TableHead>
          <TableHeaderCell>Gallery</TableHeaderCell>
          <TableHeaderCell>Studio</TableHeaderCell>
          <TableHeaderCell>Deleted</TableHeaderCell>
          <TableHeaderCell>Restore deadline</TableHeaderCell>
          <TableHeaderCell>Actions</TableHeaderCell>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableSkeleton rows={5} cols={5} />
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                Trash is empty
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Link
                    href={`/admin/galleries/${item.id}`}
                    className="font-medium hover:text-primary"
                  >
                    {item.name}
                  </Link>
                  <div className="font-mono text-xs text-slate-400">
                    {item.slug}
                  </div>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/photographers/${item.studio.userId}`}
                    className="hover:text-primary"
                  >
                    {item.studio.companyName || item.studio.email || "—"}
                  </Link>
                </TableCell>
                <TableCell className="text-xs">
                  {formatDateTime(item.deletedAt)}
                </TableCell>
                <TableCell className="text-xs">
                  {item.restoreDeadline ? (
                    <span
                      className={
                        item.restoreExpired ? "text-red-600" : "text-slate-600"
                      }
                    >
                      {formatDateTime(item.restoreDeadline)}
                      <div className="text-slate-400">
                        {item.restoreExpired
                          ? "Expired"
                          : formatRelative(item.restoreDeadline)}
                      </div>
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={item.restoreExpired}
                      className="text-sm font-medium text-emerald-600 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={() => setTarget({ type: "restore", item })}
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      className="text-sm font-medium text-red-600 hover:underline"
                      onClick={() => setTarget({ type: "purge", item })}
                    >
                      Purge
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Pagination pagination={pagination} />

      <ConfirmDialog
        open={!!target}
        title={
          target?.type === "restore"
            ? "Restore gallery"
            : target?.type === "purge"
              ? "Permanently purge gallery"
              : "Purge expired trash"
        }
        description={
          <div className="space-y-3">
            <p>
              {target?.type === "purge-expired"
                ? "Permanently delete all galleries past their restore deadline."
                : target?.item
                  ? `Confirm for “${target.item.name}”.`
                  : null}
            </p>
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Reason
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
        }
        confirmLabel={
          target?.type === "restore"
            ? "Restore"
            : target?.type === "purge"
              ? "Purge"
              : "Purge expired"
        }
        destructive={target?.type !== "restore"}
        loading={actionLoading}
        onConfirm={handleConfirm}
        onCancel={() => {
          setTarget(null);
          setReason("");
        }}
      />
    </div>
  );
}

export default function TrashPage() {
  return (
    <Suspense
      fallback={<div className="h-64 animate-pulse rounded-xl bg-zinc-200" />}
    >
      <TrashContent />
    </Suspense>
  );
}
