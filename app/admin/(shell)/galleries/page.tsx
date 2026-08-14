"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, Lock, Link2, Shield } from "lucide-react";
import { getGalleries } from "@/lib/admin/galleries";
import { getErrorMessage } from "@/lib/admin/admin-client";
import type { GalleryListItem } from "@/lib/admin/types";
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
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { TabBar } from "@/components/admin/ui/TabBar";
import { formatDate, formatDateTime } from "@/lib/admin/format";

const STATUS_TABS = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Selecting", value: "selecting" },
  { label: "Done", value: "done" },
];

function GalleryBadges({ item }: { item: GalleryListItem }) {
  return (
    <div className="flex flex-wrap gap-1">
      <StatusChip status={item.status} />
      {item.share.isShared && (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
          <Link2 className="h-3 w-3" /> Shared
        </span>
      )}
      {item.share.passwordProtected && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
          <Lock className="h-3 w-3" /> Password
        </span>
      )}
      {!item.share.allowDownloads && (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
          <Download className="h-3 w-3" /> No DL
        </span>
      )}
      {item.selectionLocked && (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700">
          <Shield className="h-3 w-3" /> Locked
        </span>
      )}
    </div>
  );
}

function GalleriesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<GalleryListItem[]>([]);
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

  const status = searchParams.get("status") ?? "all";
  const page = Number(searchParams.get("page") ?? 1);
  const search = searchParams.get("search") ?? "";
  const slug = searchParams.get("slug") ?? "";
  const studioEmail = searchParams.get("studioEmail") ?? "";
  const clientName = searchParams.get("clientName") ?? "";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";
  const shared = searchParams.get("shared") ?? "";
  const passwordProtected = searchParams.get("passwordProtected") ?? "";

  const pushFilters = useCallback(
    (patch: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(patch).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      if (!("page" in patch)) params.delete("page");
      router.push(`/admin/galleries?${params.toString()}`);
    },
    [router, searchParams],
  );

  useEffect(() => {
    setLoading(true);
    getGalleries({
      status: status === "all" ? undefined : status,
      search: search || undefined,
      slug: slug || undefined,
      studioEmail: studioEmail || undefined,
      clientName: clientName || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      shared: shared || undefined,
      passwordProtected: passwordProtected || undefined,
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
  }, [
    status,
    search,
    slug,
    studioEmail,
    clientName,
    dateFrom,
    dateTo,
    shared,
    passwordProtected,
    page,
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gallery inspector"
        description="Search galleries by slug, studio email, or client name"
      />

      <div className="filter-bar flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Search
          </label>
          <input
            className="input-base w-full"
            placeholder="Name, slug…"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") pushFilters({ search: searchDraft });
            }}
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Slug
          </label>
          <input
            className="input-base w-full"
            defaultValue={slug}
            placeholder="share-slug"
            onBlur={(e) => pushFilters({ slug: e.target.value.trim() })}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                pushFilters({
                  slug: (e.target as HTMLInputElement).value.trim(),
                });
            }}
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Studio email
          </label>
          <input
            className="input-base w-full"
            defaultValue={studioEmail}
            placeholder="studio@example.com"
            onBlur={(e) => pushFilters({ studioEmail: e.target.value.trim() })}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                pushFilters({
                  studioEmail: (e.target as HTMLInputElement).value.trim(),
                });
            }}
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Client name
          </label>
          <input
            className="input-base w-full"
            defaultValue={clientName}
            placeholder="Client name"
            onBlur={(e) => pushFilters({ clientName: e.target.value.trim() })}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                pushFilters({
                  clientName: (e.target as HTMLInputElement).value.trim(),
                });
            }}
          />
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => pushFilters({ search: searchDraft })}
        >
          Apply
        </button>
      </div>

      <div className="filter-bar flex flex-col gap-3 lg:flex-row lg:items-end">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Event from
          </label>
          <input
            type="date"
            className="input-base"
            value={dateFrom}
            onChange={(e) => pushFilters({ dateFrom: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Event to
          </label>
          <input
            type="date"
            className="input-base"
            value={dateTo}
            onChange={(e) => pushFilters({ dateTo: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Shared
          </label>
          <select
            className="input-base"
            value={shared}
            onChange={(e) => pushFilters({ shared: e.target.value })}
          >
            <option value="">Any</option>
            <option value="true">Shared</option>
            <option value="false">Not shared</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Password
          </label>
          <select
            className="input-base"
            value={passwordProtected}
            onChange={(e) =>
              pushFilters({ passwordProtected: e.target.value })
            }
          >
            <option value="">Any</option>
            <option value="true">Protected</option>
            <option value="false">Open</option>
          </select>
        </div>
      </div>

      <TabBar
        tabs={STATUS_TABS}
        active={status}
        onChange={(value) => pushFilters({ status: value })}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Table>
        <TableHead>
          <TableHeaderCell>Gallery</TableHeaderCell>
          <TableHeaderCell>Studio</TableHeaderCell>
          <TableHeaderCell>Client</TableHeaderCell>
          <TableHeaderCell>Event</TableHeaderCell>
          <TableHeaderCell>Flags</TableHeaderCell>
          <TableHeaderCell>Updated</TableHeaderCell>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableSkeleton rows={6} cols={6} />
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                No galleries found
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Link
                    href={`/admin/galleries/${item.id}`}
                    className="font-medium text-slate-900 hover:text-primary"
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
                <TableCell>{item.client?.name || "—"}</TableCell>
                <TableCell className="text-xs">
                  {formatDate(item.eventDate)}
                </TableCell>
                <TableCell>
                  <GalleryBadges item={item} />
                </TableCell>
                <TableCell className="text-xs">
                  {formatDateTime(item.updatedAt)}
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

export default function GalleriesPage() {
  return (
    <Suspense
      fallback={<div className="h-64 animate-pulse rounded-xl bg-zinc-200" />}
    >
      <GalleriesContent />
    </Suspense>
  );
}
