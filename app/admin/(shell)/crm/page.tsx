"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getCrmStudios } from "@/lib/admin/crm";
import { getErrorMessage } from "@/lib/admin/admin-client";
import type { CrmStudioListItem } from "@/lib/admin/types";
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
import { StatusChip } from "@/components/admin/ui/StatusChip";
import { formatDateTime } from "@/lib/admin/format";

function CrmStudiosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<CrmStudioListItem[]>([]);
  const [note, setNote] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchDraft, setSearchDraft] = useState(
    searchParams.get("search") ?? "",
  );

  const search = searchParams.get("search") ?? "";
  const page = Number(searchParams.get("page") ?? 1);

  const pushFilters = useCallback(
    (patch: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(patch).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      if (!("page" in patch)) params.delete("page");
      router.push(`/admin/crm?${params.toString()}`);
    },
    [router, searchParams],
  );

  useEffect(() => {
    setLoading(true);
    getCrmStudios({ search: search || undefined, page, limit: 50 })
      .then((data) => {
        setItems(data.items);
        setPagination(data.pagination);
        setNote(data.note ?? "");
        setError("");
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [search, page]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM studios"
        description="Aggregate client counts — no client PII by default"
        action={
          <Link href="/admin/crm/bookings" className="btn-secondary">
            View bookings
          </Link>
        }
      />

      <div className="filter-bar flex gap-3">
        <input
          className="input-base flex-1"
          placeholder="Search studio…"
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") pushFilters({ search: searchDraft });
          }}
        />
        <button
          type="button"
          className="btn-primary"
          onClick={() => pushFilters({ search: searchDraft })}
        >
          Search
        </button>
      </div>

      {note && (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
          {note}
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Table>
        <TableHead>
          <TableHeaderCell>Studio</TableHeaderCell>
          <TableHeaderCell>Email</TableHeaderCell>
          <TableHeaderCell>Clients</TableHeaderCell>
          <TableHeaderCell>Latest client</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableSkeleton rows={5} cols={5} />
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                No studios found
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <TableRow key={item.userId}>
                <TableCell>
                  <Link
                    href={`/admin/crm/studios/${item.userId}`}
                    className="font-medium hover:text-primary"
                  >
                    {item.companyName || "—"}
                  </Link>
                  <div className="font-mono text-xs text-slate-400">
                    {item.companySlug}
                  </div>
                </TableCell>
                <TableCell>{item.email || "—"}</TableCell>
                <TableCell>{item.clientCount}</TableCell>
                <TableCell className="text-xs">
                  {formatDateTime(item.latestClientAt)}
                </TableCell>
                <TableCell>
                  <StatusChip
                    status={item.isActive === false ? "inactive" : "active"}
                  />
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

export default function CrmPage() {
  return (
    <Suspense
      fallback={<div className="h-64 animate-pulse rounded-xl bg-zinc-200" />}
    >
      <CrmStudiosContent />
    </Suspense>
  );
}
