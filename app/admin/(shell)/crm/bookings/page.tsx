"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getCrmBookings } from "@/lib/admin/crm";
import { getErrorMessage } from "@/lib/admin/admin-client";
import type { CrmBooking } from "@/lib/admin/types";
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
import { formatDateTime } from "@/lib/admin/format";
import { useToast } from "@/lib/admin/use-admin-toast";

function BookingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [items, setItems] = useState<CrmBooking[]>([]);
  const [includePii, setIncludePii] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [piiOpen, setPiiOpen] = useState(false);
  const [reason, setReason] = useState("");

  const ownerId = searchParams.get("ownerId") ?? "";
  const shootType = searchParams.get("shootType") ?? "";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";
  const page = Number(searchParams.get("page") ?? 1);
  const piiReason = searchParams.get("reason") ?? "";
  const wantPii = searchParams.get("includePii") === "true";

  const pushFilters = useCallback(
    (patch: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(patch).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      if (!("page" in patch)) params.delete("page");
      router.push(`/admin/crm/bookings?${params.toString()}`);
    },
    [router, searchParams],
  );

  useEffect(() => {
    setLoading(true);
    getCrmBookings({
      ownerId: ownerId || undefined,
      shootType: shootType || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      includePii: wantPii || undefined,
      reason: wantPii ? piiReason || undefined : undefined,
      page,
      limit: 100,
    })
      .then((data) => {
        setItems(data.items);
        setPagination(data.pagination);
        setIncludePii(data.includePii);
        setError("");
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [ownerId, shootType, dateFrom, dateTo, page, wantPii, piiReason]);

  const confirmPii = () => {
    if (reason.trim().length < 3) {
      toast("Reason is required (min 3 characters)", "error");
      return;
    }
    setPiiOpen(false);
    pushFilters({ includePii: "true", reason: reason.trim() });
    setReason("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        description="Agenda across studios"
        action={
          <div className="flex gap-2">
            <Link href="/admin/crm" className="btn-secondary">
              Studios
            </Link>
            {!includePii ? (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPiiOpen(true)}
              >
                Include PII
              </button>
            ) : (
              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  pushFilters({ includePii: "", reason: "" })
                }
              >
                Hide PII
              </button>
            )}
          </div>
        }
      />

      <div className="filter-bar grid gap-3 md:grid-cols-4">
        <input
          className="input-base"
          placeholder="Owner user id"
          defaultValue={ownerId}
          onBlur={(e) => pushFilters({ ownerId: e.target.value.trim() })}
        />
        <input
          className="input-base"
          placeholder="Shoot type (e.g. wedding)"
          defaultValue={shootType}
          onBlur={(e) => pushFilters({ shootType: e.target.value.trim() })}
        />
        <input
          type="date"
          className="input-base"
          defaultValue={dateFrom}
          onChange={(e) => pushFilters({ dateFrom: e.target.value })}
        />
        <input
          type="date"
          className="input-base"
          defaultValue={dateTo}
          onChange={(e) => pushFilters({ dateTo: e.target.value })}
        />
      </div>

      {includePii && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Client PII included — audited access. Do not persist locally.
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Table>
        <TableHead>
          <TableHeaderCell>Booking</TableHeaderCell>
          <TableHeaderCell>Studio</TableHeaderCell>
          <TableHeaderCell>Client</TableHeaderCell>
          <TableHeaderCell>Starts</TableHeaderCell>
          <TableHeaderCell>Amount</TableHeaderCell>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableSkeleton rows={6} cols={5} />
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                No bookings found
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs text-slate-400">
                    {item.categoryLabel || item.category}
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
                <TableCell>
                  <div>{item.client.name || "—"}</div>
                  {includePii && (
                    <div className="text-xs text-slate-400">
                      {[item.client.email, item.client.phone, item.location]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-xs">
                  {formatDateTime(item.startsAt)}
                </TableCell>
                <TableCell>
                  {item.currency} {item.amountCharged.toLocaleString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Pagination pagination={pagination} />

      <ConfirmDialog
        open={piiOpen}
        title="Include booking PII"
        description={
          <div className="space-y-3">
            <p>
              Reveals client email, phone, and location. Access is audited.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              placeholder="Reason (min 3 characters)"
            />
          </div>
        }
        confirmLabel="Include PII"
        loading={false}
        onConfirm={confirmPii}
        onCancel={() => {
          setPiiOpen(false);
          setReason("");
        }}
      />
    </div>
  );
}

export default function CrmBookingsPage() {
  return (
    <Suspense
      fallback={<div className="h-64 animate-pulse rounded-xl bg-zinc-200" />}
    >
      <BookingsContent />
    </Suspense>
  );
}
