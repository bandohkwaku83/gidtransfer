"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getBillingEvents } from "@/lib/admin/billing";
import { getErrorMessage } from "@/lib/admin/admin-client";
import type { BillingEvent } from "@/lib/admin/types";
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
import { TabBar } from "@/components/admin/ui/TabBar";
import { StatusChip } from "@/components/admin/ui/StatusChip";
import { formatDateTime } from "@/lib/admin/format";

const TABS = [
  { label: "All", value: "" },
  { label: "Paid", value: "paid" },
  { label: "Failed", value: "failed" },
  { label: "Dispute", value: "dispute" },
  { label: "Other", value: "other" },
];

function BillingEventsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<BillingEvent[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const category = searchParams.get("category") ?? "";
  const page = Number(searchParams.get("page") ?? 1);
  const userId = searchParams.get("userId") ?? "";
  const reference = searchParams.get("reference") ?? "";

  const pushFilters = useCallback(
    (patch: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(patch).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      if (!("page" in patch)) params.delete("page");
      router.push(`/admin/billing/events?${params.toString()}`);
    },
    [router, searchParams],
  );

  useEffect(() => {
    setLoading(true);
    getBillingEvents({
      category: category || undefined,
      userId: userId || undefined,
      reference: reference || undefined,
      page,
      limit: 50,
    })
      .then((data) => {
        setItems(data.items);
        setPagination(data.pagination);
        setError("");
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [category, userId, reference, page]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing events"
        description="Paystack webhook events — amounts in GHS major units"
        action={
          <Link href="/admin/billing" className="btn-secondary">
            Plans
          </Link>
        }
      />

      <TabBar
        tabs={TABS}
        active={category}
        onChange={(value) => pushFilters({ category: value })}
      />

      <div className="filter-bar flex gap-3">
        <input
          className="input-base flex-1"
          placeholder="Filter by user id"
          defaultValue={userId}
          onBlur={(e) => pushFilters({ userId: e.target.value.trim() })}
        />
        <input
          className="input-base flex-1"
          placeholder="Reference"
          defaultValue={reference}
          onBlur={(e) => pushFilters({ reference: e.target.value.trim() })}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Table>
        <TableHead>
          <TableHeaderCell>Event</TableHeaderCell>
          <TableHeaderCell>Studio</TableHeaderCell>
          <TableHeaderCell>Amount</TableHeaderCell>
          <TableHeaderCell>Category</TableHeaderCell>
          <TableHeaderCell>Processed</TableHeaderCell>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableSkeleton rows={6} cols={5} />
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                No billing events
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="font-medium">{item.eventType}</div>
                  <div className="font-mono text-xs text-slate-400">
                    {item.reference || item.eventId}
                  </div>
                </TableCell>
                <TableCell>
                  {item.user ? (
                    <Link
                      href={`/admin/photographers/${item.user.userId}`}
                      className="hover:text-primary"
                    >
                      {item.user.companyName || item.user.email || "—"}
                    </Link>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  {item.currency} {item.amount.toLocaleString()}
                </TableCell>
                <TableCell>
                  <StatusChip status={item.category || item.status} />
                </TableCell>
                <TableCell className="text-xs">
                  {formatDateTime(item.processedAt || item.createdAt)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Pagination pagination={pagination} />
    </div>
  );
}

export default function BillingEventsPage() {
  return (
    <Suspense
      fallback={<div className="h-64 animate-pulse rounded-xl bg-zinc-200" />}
    >
      <BillingEventsContent />
    </Suspense>
  );
}
