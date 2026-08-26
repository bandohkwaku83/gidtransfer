"use client";

import { Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import {
  ChevronRight,
  Pencil,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { IncomeAnalyticsPanel } from "@/components/income/income-analytics-panel";
import { IncomeEntryModal } from "@/components/income/income-entry-modal";
import { IncomeReportMenu } from "@/components/income/income-report-menu";
import { useToast } from "@/components/toast-provider";
import { FormSelect } from "@/components/ui/form-select";
import { dashboardPageHeaderCtaClassName } from "@/components/dashboard/dashboard-page-header";
import {
  DASHBOARD_TABLE_DEFAULT_PAGE_SIZE,
  dashboardTablePaginationProps,
} from "@/components/dashboard/dashboard-table-pagination";
import { formatBookingAmount } from "@/lib/bookings-api";
import {
  deleteIncome,
  EMPTY_INCOME_SUMMARY_RESPONSE,
  getIncomeSummary,
  listIncome,
  type IncomeSummaryResponse,
} from "@/lib/income-api";
import {
  incomePaymentPercent,
  incomeStatusLabel,
  type IncomeEntry,
  type IncomeStatus,
} from "@/lib/income-demo";
import { cn } from "@/lib/utils";

function formatIncomeDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

function incomeEntryYear(iso: string): number | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.getFullYear();
}

function statusTagColor(status: IncomeStatus): string {
  switch (status) {
    case "paid":
      return "success";
    case "pending":
      return "default";
    case "partial":
      return "warning";
    case "invoiced":
      return "processing";
  }
}

export default function IncomePage() {
  const { showToast } = useToast();

  const [entries, setEntries] = useState<IncomeEntry[]>([]);
  const [summaryData, setSummaryData] = useState<IncomeSummaryResponse>(
    EMPTY_INCOME_SUMMARY_RESPONSE,
  );
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<IncomeEntry | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DASHBOARD_TABLE_DEFAULT_PAGE_SIZE);
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));

  const loadIncome = useCallback(async (year: number) => {
    const [listRes, summaryRes] = await Promise.all([
      listIncome({ year }),
      getIncomeSummary({ year }),
    ]);
    setEntries(listRes.entries ?? []);
    setSummaryData(summaryRes);
  }, []);

  useEffect(() => {
    const year = Number(selectedYear);
    if (!Number.isFinite(year)) return;

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        await loadIncome(year);
      } catch (error) {
        if (cancelled) return;
        showToast(
          error instanceof Error ? error.message : "Failed to load income.",
          "error",
        );
        setEntries([]);
        setSummaryData(EMPTY_INCOME_SUMMARY_RESPONSE);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedYear, loadIncome, showToast]);

  const yearOptions = useMemo(() => {
    const years = new Set<number>([new Date().getFullYear()]);
    for (const entry of entries) {
      const year = incomeEntryYear(entry.date);
      if (year) years.add(year);
    }
    return [...years]
      .sort((a, b) => b - a)
      .map((year) => ({ value: String(year), label: String(year) }));
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const year = Number(selectedYear);
    if (!Number.isFinite(year)) return entries;
    return entries.filter((entry) => incomeEntryYear(entry.date) === year);
  }, [entries, selectedYear]);

  const entryCount = filteredEntries.length;

  useEffect(() => {
    setPage(1);
  }, [selectedYear]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(entryCount / pageSize) || 1);
    setPage((current) => Math.min(current, maxPage));
  }, [entryCount, pageSize]);

  const openCreate = useCallback(() => {
    setEditing(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((entry: IncomeEntry) => {
    setEditing(entry);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    if (pendingDeleteId) return;
    setModalOpen(false);
    setEditing(null);
  }, [pendingDeleteId]);

  function handleSaved() {
    const year = Number(selectedYear);
    if (!Number.isFinite(year)) return;
    void loadIncome(year).catch(() => undefined);
  }

  async function handleDelete(entry: IncomeEntry) {
    const paidLabel =
      formatBookingAmount(entry.amountPaying, entry.currency) ?? String(entry.amountPaying);
    const confirmed = window.confirm(
      `Delete income for ${entry.clientName} (${paidLabel} paid)?`,
    );
    if (!confirmed) return;

    setPendingDeleteId(entry.id);
    try {
      await deleteIncome(entry.id);
      const year = Number(selectedYear);
      if (Number.isFinite(year)) {
        await loadIncome(year);
      } else {
        setEntries((prev) => prev.filter((row) => row.id !== entry.id));
      }
      showToast("Income deleted.", "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to delete income.",
        "error",
      );
    } finally {
      setPendingDeleteId(null);
    }
  }

  const columns: ColumnsType<IncomeEntry> = useMemo(
    () => [
      {
        title: "Date",
        dataIndex: "date",
        key: "date",
        width: 120,
        render: (iso: string) => (
          <span className="whitespace-nowrap tabular-nums text-zinc-600 dark:text-zinc-400">
            {formatIncomeDate(iso)}
          </span>
        ),
      },
      {
        title: "Client",
        dataIndex: "clientName",
        key: "clientName",
        width: 180,
        render: (name: string) => (
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{name}</span>
        ),
      },
      {
        title: "Title",
        dataIndex: "title",
        key: "title",
        ellipsis: true,
        render: (rowTitle: string) => (
          <span className="text-zinc-700 dark:text-zinc-300">{rowTitle}</span>
        ),
      },
      {
        title: "Type",
        dataIndex: "shootType",
        key: "shootType",
        width: 120,
        render: (type: string) => (
          <span className="text-zinc-600 dark:text-zinc-400">{type}</span>
        ),
      },
      {
        title: "Total",
        dataIndex: "totalAmount",
        key: "totalAmount",
        width: 110,
        align: "right",
        render: (total: number, row) => (
          <span className="tabular-nums text-zinc-700 dark:text-zinc-300">
            {formatBookingAmount(total, row.currency) ?? `${row.currency} ${total.toFixed(2)}`}
          </span>
        ),
      },
      {
        title: "Paid",
        dataIndex: "amountPaying",
        key: "amountPaying",
        width: 110,
        align: "right",
        render: (paid: number, row) => (
          <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {formatBookingAmount(paid, row.currency) ?? `${row.currency} ${paid.toFixed(2)}`}
          </span>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 120,
        render: (status: IncomeStatus, row) => (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Tag color={statusTagColor(status)}>{incomeStatusLabel(status)}</Tag>
            <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
              {incomePaymentPercent(row.totalAmount, row.amountPaying)}%
            </span>
          </div>
        ),
      },
      {
        title: "Actions",
        key: "actions",
        width: 110,
        align: "right",
        fixed: "right",
        render: (_, row) => {
          const isDeleting = pendingDeleteId === row.id;
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => openEdit(row)}
                disabled={isDeleting}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                aria-label={`Edit ${row.clientName}`}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(row)}
                disabled={isDeleting}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
                aria-label={`Delete ${row.clientName}`}
              >
                {isDeleting ? (
                  <span className="h-3.5 w-3.5 animate-pulse rounded bg-red-200 dark:bg-red-900/50" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                )}
              </button>
            </div>
          );
        },
      },
    ],
    [openEdit, pendingDeleteId],
  );

  return (
    <div className="dashboard-page space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm">
            <li>
              <Link
                href="/dashboard"
                className="font-medium text-zinc-400 transition hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
              >
                Dashboard
              </Link>
            </li>
            <li className="text-zinc-300 dark:text-zinc-600" aria-hidden>
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
            </li>
            <li className="font-semibold text-zinc-900 dark:text-zinc-50">Income</li>
          </ol>
        </nav>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <IncomeReportMenu entries={entries} selectedYear={selectedYear} />
          <button type="button" className={dashboardPageHeaderCtaClassName()} onClick={openCreate}>
            Add income
          </button>
        </div>
      </header>

      <IncomeAnalyticsPanel
        summary={summaryData.summary}
        monthlyRevenue={summaryData.monthlyRevenue}
        byStatus={summaryData.byStatus}
        loading={loading}
      />

      <section className="dashboard-panel !overflow-hidden !p-0">
        <div className="border-b border-zinc-100 px-4 py-4 dark:border-zinc-800 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Recent income
              <span className="ml-2 font-medium text-zinc-500 dark:text-zinc-400">({entryCount})</span>
            </h2>
            <FormSelect
              size="small"
              value={selectedYear}
              onChange={(year) => setSelectedYear(year)}
              options={yearOptions}
              aria-label="Filter income by year"
              className={cn(
                "w-[5.25rem] shrink-0",
                "[&_.ant-select-selector]:!h-8 [&_.ant-select-selector]:!min-h-8",
                "[&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!px-2",
                "[&_.ant-select-selection-item]:!text-xs [&_.ant-select-selection-item]:!leading-8",
              )}
            />
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">Booking charges and invoice totals</p>
        </div>

        <div
          className={cn(
            "overflow-x-auto px-1 pb-1",
            "[&_.ant-table]:bg-transparent",
            "[&_.ant-table-thead>tr>th]:dark:bg-zinc-900/80",
            "[&_.ant-table-thead>tr>th]:dark:text-zinc-300",
            "[&_.ant-table-tbody>tr>td]:dark:border-zinc-800",
            "[&_.ant-table-thead>tr>th]:dark:border-zinc-800",
          )}
        >
          <Table<IncomeEntry>
            rowKey="id"
            columns={columns}
            dataSource={filteredEntries}
            pagination={dashboardTablePaginationProps({
              current: page,
              pageSize,
              total: entryCount,
              noun: { singular: "income entry", plural: "income entries" },
              suffix: `in ${selectedYear}`,
              onChange: (nextPage, nextPageSize) => {
                setPage(nextPage);
                setPageSize(nextPageSize);
              },
            })}
            locale={{
              emptyText: loading
                ? "Loading income…"
                : `No income entries for ${selectedYear}.`,
            }}
            scroll={{ x: "max-content" }}
          />
        </div>
      </section>

      <IncomeEntryModal
        open={modalOpen}
        onClose={closeModal}
        entry={editing}
        onSaved={handleSaved}
      />
    </div>
  );
}
