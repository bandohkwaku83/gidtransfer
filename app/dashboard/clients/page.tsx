"use client";

import {
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { Select } from "antd";
import { FormSearchInput, dashboardSearchFieldClassName } from "@/components/ui/form-input";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CreateClientModal } from "@/components/photographer/create-client-modal";
import { useToast } from "@/components/toast-provider";
import { deleteClient, listClients, type ApiClient } from "@/lib/clients-api";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export default function ClientsPage() {
  const { showToast } = useToast();

  const [clientModalOpen, setClientModalOpen] = useState(false);
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
      <section className="relative overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-950 via-indigo-950/85 to-slate-900 shadow-lg shadow-slate-900/20">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand/15 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[1.65rem]">
              Clients
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
              Contacts you attach to galleries and bookings. Search, edit, and keep details in one
              place.
            </p>
            {clientCountLabel ? (
              <p className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                <Users className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                <span className="font-semibold text-white/90">{clientCountLabel}</span>
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-brand-hover"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add client
          </button>
        </div>
      </section>

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
          <FormSearchInput
            autoComplete="off"
            placeholder="Search name, email, phone, or location…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            prefix={<Search className="h-4 w-4 text-zinc-400" aria-hidden />}
            aria-label="Search clients"
            className={cn("max-w-2xl", dashboardSearchFieldClassName, "[&_.ant-input-affix-wrapper]:!py-3")}
          />

          {loading ? (
            <ul className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <li
                  key={i}
                  className="h-[5.25rem] animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100/80 dark:border-zinc-800 dark:bg-zinc-900/50"
                />
              ))}
            </ul>
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
            <>
              <ul className="space-y-2">
                {pageRows.map((record) => {
                  const isDeleting = pendingDeleteId === record._id;
                  return (
                    <li key={record._id}>
                      <div
                        className={cn(
                          "group flex flex-col gap-4 rounded-2xl border border-zinc-200/90 bg-white p-4 transition-shadow hover:shadow-md hover:shadow-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:shadow-black/40 md:flex-row md:items-center md:justify-between md:gap-6 md:p-5",
                          isDeleting && "pointer-events-none opacity-55",
                        )}
                      >
                        <div className="flex min-w-0 flex-1 gap-4">
                          <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 text-sm font-bold text-zinc-700 ring-1 ring-zinc-300/60 dark:from-zinc-800 dark:to-zinc-900 dark:text-zinc-200 dark:ring-zinc-700"
                            aria-hidden
                          >
                            {initials(record.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
                              {record.name}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                              <span className="inline-flex min-w-0 items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
                                <span className="truncate">{record.email?.trim() || "N/A"}</span>
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
                                {record.contact?.trim() || "N/A"}
                              </span>
                              <span className="inline-flex min-w-0 items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
                                <span className="truncate">
                                  {record.location?.trim() || "Unknown"}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-zinc-100 pt-4 md:border-t-0 md:pt-0 dark:border-zinc-800">
                          <button
                            type="button"
                            onClick={() => openEdit(record)}
                            disabled={isDeleting}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                            aria-label={`Edit ${record.name}`}
                          >
                            <Pencil className="h-4 w-4" aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(record)}
                            disabled={isDeleting}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
                            aria-label={`Delete ${record.name}`}
                          >
                            {isDeleting ? (
                              <span className="h-4 w-4 animate-pulse rounded bg-red-200 dark:bg-red-900/50" />
                            ) : (
                              <Trash2 className="h-4 w-4" aria-hidden />
                            )}
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {filteredClients.length > 0 ? (
                <div className="mt-1 flex flex-col gap-4 border-t border-zinc-200 pt-5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
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
            </>
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
    </div>
  );
}
