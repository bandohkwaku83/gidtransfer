"use client";

import {
  ChevronLeft,
  ChevronRight,
  FileUp,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Select } from "antd";
import { FormSearchInput, dashboardSearchFieldClassName } from "@/components/ui/form-input";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CreateClientModal } from "@/components/photographer/create-client-modal";
import { ImportClientsModal } from "@/components/photographer/import-clients-modal";
import { useToast } from "@/components/toast-provider";
import { deleteClient, listClients, type ApiClient } from "@/lib/clients-api";
import {
  DashboardPageHeader,
  dashboardPageHeaderChipClassName,
  dashboardPageHeaderCtaClassName,
  dashboardPageHeaderDescriptionClassName,
  dashboardPageHeaderTitleClassName,
} from "@/components/dashboard/dashboard-page-header";
import { cn } from "@/lib/utils";

export default function ClientsPage() {
  const { showToast } = useToast();

  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApiClient | null>(null);

  const [clients, setClients] = useState<ApiClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");

  const fetchClients = useCallback(async (search: string, signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const { clients: rows } = await listClients(search);
      if (signal?.aborted) return;
      setClients(rows);
    } catch (err) {
      if (signal?.aborted) return;
      setError(err instanceof Error ? err.message : "Failed to load clients.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const t = window.setTimeout(() => {
      void fetchClients(searchInput, controller.signal);
    }, searchInput.trim() ? 280 : 0);
    return () => {
      controller.abort();
      window.clearTimeout(t);
    };
  }, [fetchClients, searchInput]);

  const filteredClients = clients;

  useEffect(() => {
    setPage(1);
  }, [searchInput]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredClients.length / pageSize) || 1);
    setPage((p) => Math.min(p, maxPage));
  }, [filteredClients.length, pageSize]);

  const openCreate = useCallback(() => {
    setEditing(null);
    setClientModalOpen(true);
  }, []);

  const openEdit = useCallback((client: ApiClient) => {
    setEditing(client);
    setClientModalOpen(true);
  }, []);

  function handleSaved(saved: ApiClient) {
    setClients((prev) => {
      const exists = prev.some((c) => c._id === saved._id);
      if (exists) {
        return prev.map((c) => (c._id === saved._id ? saved : c));
      }
      return [saved, ...prev];
    });
  }

  function handleImported(imported: ApiClient[]) {
    if (imported.length === 0) return;
    setClients((prev) => {
      const byId = new Map(prev.map((c) => [c._id, c]));
      for (const client of imported) {
        byId.set(client._id, client);
      }
      const merged = Array.from(byId.values());
      merged.sort((a, b) => {
        const ta = new Date(a.createdAt ?? 0).getTime();
        const tb = new Date(b.createdAt ?? 0).getTime();
        return tb - ta;
      });
      return merged;
    });
  }

  const handleDelete = useCallback(
    async (client: ApiClient) => {
      if (pendingDeleteId) return;
      const confirmed = window.confirm(
        `Delete "${client.name}"? This cannot be undone.`,
      );
      if (!confirmed) return;

      setPendingDeleteId(client._id);
      try {
        await deleteClient(client._id);
        setClients((prev) => prev.filter((c) => c._id !== client._id));
        showToast("Client deleted.", "success");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to delete client.";
        showToast(message, "error");
      } finally {
        setPendingDeleteId(null);
      }
    },
    [pendingDeleteId, showToast],
  );

  const { pageRows, totalPages, rangeStart, rangeEnd, displayPage } = useMemo(() => {
    const total = filteredClients.length;
    const tp = Math.max(1, Math.ceil(total / pageSize) || 1);
    const safePage = Math.min(page, tp);
    const start = (safePage - 1) * pageSize;
    const slice = filteredClients.slice(start, start + pageSize);
    return {
      pageRows: slice,
      totalPages: tp,
      rangeStart: total === 0 ? 0 : start + 1,
      rangeEnd: Math.min(start + pageSize, total),
      displayPage: safePage,
    };
  }, [filteredClients, page, pageSize]);

  const searchTrimmed = searchInput.trim();
  const emptyBecauseSearch =
    !loading && clients.length > 0 && filteredClients.length === 0;

  const emptyText = emptyBecauseSearch
    ? "No clients match your search. Try another name, email, phone, or location."
    : "No clients yet. Add your first contact to use them on galleries and bookings.";

  const clientCountLabel = loading
    ? null
    : searchTrimmed
      ? `${filteredClients.length} of ${clients.length} clients`
      : clients.length === 1
        ? "1 client"
        : `${clients.length} clients`;

  return (
    <div className="dashboard-page space-y-6">
      <DashboardPageHeader innerClassName="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className={dashboardPageHeaderTitleClassName()}>Clients</h1>
          <p className={dashboardPageHeaderDescriptionClassName()}>
            Contacts you attach to galleries and bookings. Search, edit, and keep details in one
            place.
          </p>
          {clientCountLabel ? (
            <p className={dashboardPageHeaderChipClassName("mt-3")}>
              <Users className="h-3.5 w-3.5 text-brand/70" aria-hidden />
              <span className="font-semibold">{clientCountLabel}</span>
            </p>
          ) : null}
        </div>
        <button type="button" onClick={openCreate} className={dashboardPageHeaderCtaClassName()}>
          <Plus className="h-4 w-4" aria-hidden />
          Add client
        </button>
      </DashboardPageHeader>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
          <button
            type="button"
            className="ml-3 font-semibold underline underline-offset-2"
            onClick={() => void fetchClients(searchInput)}
          >
            Retry
          </button>
        </div>
      ) : null}

      {!error ? (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <FormSearchInput
              autoComplete="off"
              placeholder="Search name, email, phone, or location…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              prefix={<Search className="h-4 w-4 text-zinc-400" aria-hidden />}
              aria-label="Search clients"
              className={cn(
                "min-w-0 flex-1",
                dashboardSearchFieldClassName,
                "[&_.ant-input-affix-wrapper]:!py-3",
              )}
            />
            <button
              type="button"
              onClick={() => setImportModalOpen(true)}
              className="inline-flex shrink-0 items-center justify-center gap-2 self-end rounded-xl border border-[#55001F] bg-white px-4 py-3 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-[#55001F]/5 sm:self-auto dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-[#55001F]/10"
            >
              <FileUp className="h-4 w-4" aria-hidden />
              Import
            </button>
          </div>

          {loading ? (
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
              <div className="space-y-0 divide-y divide-zinc-100 dark:divide-zinc-800">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse bg-zinc-100/80 dark:bg-zinc-900/50"
                  />
                ))}
              </div>
            </div>
          ) : clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-zinc-50/80 px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900/30">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-200/80 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                <Users className="h-7 w-7 opacity-70" strokeWidth={1.5} aria-hidden />
              </div>
              <p className="mt-4 max-w-sm text-sm text-zinc-600 dark:text-zinc-400">{emptyText}</p>
              <button
                type="button"
                onClick={openCreate}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Add your first client
              </button>
            </div>
          ) : emptyBecauseSearch ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-zinc-50/80 px-6 py-14 text-center dark:border-zinc-700 dark:bg-zinc-900/30">
              <Search className="h-10 w-10 text-zinc-400" strokeWidth={1.25} aria-hidden />
              <p className="mt-4 max-w-sm text-sm text-zinc-600 dark:text-zinc-400">{emptyText}</p>
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="mt-5 text-sm font-semibold text-brand underline-offset-2 hover:underline dark:text-brand-on-dark"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/80 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                      <th className="px-5 py-3 sm:px-6">Name</th>
                      <th className="px-3 py-3">Email</th>
                      <th className="px-3 py-3">Phone</th>
                      <th className="px-3 py-3">Location</th>
                      <th className="w-px px-5 py-3 text-right sm:px-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {pageRows.map((record) => {
                      const isDeleting = pendingDeleteId === record._id;
                      return (
                        <tr
                          key={record._id}
                          className={cn(
                            "transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40",
                            isDeleting && "pointer-events-none opacity-55",
                          )}
                        >
                          <td className="px-5 py-3.5 font-medium text-zinc-900 dark:text-zinc-100 sm:px-6">
                            <Link
                              href={`/dashboard/clients/${record._id}`}
                              className="transition hover:text-brand hover:underline underline-offset-2 dark:hover:text-brand-on-dark"
                            >
                              {record.name}
                            </Link>
                          </td>
                          <td className="max-w-[14rem] truncate px-3 py-3.5 text-zinc-600 dark:text-zinc-300">
                            {record.email?.trim() || "N/A"}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3.5 text-zinc-600 dark:text-zinc-300">
                            {record.contact?.trim() || "N/A"}
                          </td>
                          <td className="max-w-[12rem] truncate px-3 py-3.5 text-zinc-600 dark:text-zinc-300">
                            {record.location?.trim() || "Unknown"}
                          </td>
                          <td className="px-5 py-3.5 sm:px-6">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEdit(record)}
                                disabled={isDeleting}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:border-zinc-300 hover:bg-white hover:text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                                aria-label={`Edit ${record.name}`}
                              >
                                <Pencil className="h-4 w-4" aria-hidden />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(record)}
                                disabled={isDeleting}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
                                aria-label={`Delete ${record.name}`}
                              >
                                {isDeleting ? (
                                  <span className="h-4 w-4 animate-pulse rounded bg-red-200 dark:bg-red-900/50" />
                                ) : (
                                  <Trash2 className="h-4 w-4" aria-hidden />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredClients.length > 0 ? (
                <div className="flex flex-col gap-4 border-t border-zinc-100 px-5 py-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <p className="text-center text-xs font-medium text-zinc-600 sm:text-left dark:text-zinc-400">
                    {`${rangeStart}–${rangeEnd} of ${filteredClients.length}${searchTrimmed ? " matching" : ""}`}
                    {clients.length !== filteredClients.length
                      ? `, ${clients.length} total in directory`
                      : ""}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-end">
                    <label className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="hidden sm:inline">Per page</span>
                      <Select
                        value={pageSize}
                        onChange={(value) => {
                          setPageSize(value);
                          setPage(1);
                        }}
                        options={[10, 20, 50, 100].map((n) => ({ value: n, label: String(n) }))}
                        className="min-w-[4.5rem] [&_.ant-select-selector]:!rounded-full [&_.ant-select-selector]:!border-zinc-200 [&_.ant-select-selector]:!bg-white [&_.ant-select-selector]:!px-3 [&_.ant-select-selector]:!py-1 dark:[&_.ant-select-selector]:!border-zinc-600 dark:[&_.ant-select-selector]:!bg-zinc-950"
                      />
                    </label>
                    <div className="inline-flex items-center rounded-full border border-zinc-200 bg-white p-0.5 shadow-sm dark:border-zinc-700 dark:bg-zinc-950">
                      <button
                        type="button"
                        disabled={displayPage <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="h-4 w-4" aria-hidden />
                      </button>
                      <span className="min-w-[5.5rem] px-1 text-center text-xs font-medium tabular-nums text-zinc-600 dark:text-zinc-300">
                        {displayPage} / {totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={displayPage >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        aria-label="Next page"
                      >
                        <ChevronRight className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </section>
      ) : null}

      <CreateClientModal
        open={clientModalOpen}
        client={editing}
        onClose={() => {
          setClientModalOpen(false);
          setEditing(null);
        }}
        onSaved={handleSaved}
      />

      <ImportClientsModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImported={handleImported}
      />
    </div>
  );
}
