"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getFlaggedFinals } from "@/lib/admin/moderation";
import { getErrorMessage } from "@/lib/admin/admin-client";
import type { FlaggedFinal } from "@/lib/admin/types";
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
import { formatDateTime, truncate } from "@/lib/admin/format";

function ModerationContent() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<FlaggedFinal[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const page = Number(searchParams.get("page") ?? 1);

  useEffect(() => {
    setLoading(true);
    getFlaggedFinals({ page, limit: 50 })
      .then((data) => {
        setItems(data.items);
        setPagination(data.pagination);
        setError("");
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Moderation"
        description="Client-flagged finals awaiting review"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Table>
        <TableHead>
          <TableHeaderCell>File</TableHeaderCell>
          <TableHeaderCell>Gallery</TableHeaderCell>
          <TableHeaderCell>Studio</TableHeaderCell>
          <TableHeaderCell>Feedback</TableHeaderCell>
          <TableHeaderCell>Flagged</TableHeaderCell>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableSkeleton rows={5} cols={5} />
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                No flagged finals
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-xs">
                  {item.originalFilename}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/galleries/${item.galleryId}`}
                    className="font-medium hover:text-primary"
                  >
                    {item.galleryName || item.gallerySlug || item.galleryId}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/photographers/${item.studio.userId}`}
                    className="hover:text-primary"
                  >
                    {item.studio.companyName || item.studio.email || "—"}
                  </Link>
                </TableCell>
                <TableCell className="max-w-xs text-sm text-slate-600">
                  {truncate(item.feedback?.comment || "—", 80)}
                </TableCell>
                <TableCell className="text-xs">
                  {formatDateTime(item.flaggedAt)}
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

export default function ModerationPage() {
  return (
    <Suspense
      fallback={<div className="h-64 animate-pulse rounded-xl bg-zinc-200" />}
    >
      <ModerationContent />
    </Suspense>
  );
}
