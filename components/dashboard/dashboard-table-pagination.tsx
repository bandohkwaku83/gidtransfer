"use client";

import { Pagination, type PaginationProps } from "antd";
import { cn } from "@/lib/utils";

export const DASHBOARD_TABLE_PAGE_SIZE_OPTIONS = [5, 10, 20] as const;
export const DASHBOARD_TABLE_DEFAULT_PAGE_SIZE = 10;

type TableNoun = {
  singular: string;
  plural: string;
};

export function dashboardTableShowTotal(
  total: number,
  noun: TableNoun,
  suffix?: string,
) {
  const label = total === 1 ? noun.singular : noun.plural;
  return (
    <span className="text-sm text-zinc-600 dark:text-zinc-400">
      Total {total} {label}
      {suffix ? ` ${suffix}` : ""}
    </span>
  );
}

export function dashboardTablePaginationProps({
  current,
  pageSize,
  total,
  noun,
  suffix,
  onChange,
}: {
  current: number;
  pageSize: number;
  total: number;
  noun: TableNoun;
  suffix?: string;
  onChange: (page: number, pageSize: number) => void;
}): PaginationProps {
  return {
    current,
    pageSize,
    total,
    align: "end",
    showSizeChanger: true,
    pageSizeOptions: [...DASHBOARD_TABLE_PAGE_SIZE_OPTIONS],
    showTotal: (count) => dashboardTableShowTotal(count, noun, suffix),
    onChange,
  };
}

export function DashboardTablePagination({
  className,
  ...props
}: {
  current: number;
  pageSize: number;
  total: number;
  noun: TableNoun;
  suffix?: string;
  onChange: (page: number, pageSize: number) => void;
  className?: string;
}) {
  if (props.total <= 0) return null;
  return (
    <div className={cn("flex justify-end px-4 py-3 sm:px-5", className)}>
      <Pagination
        {...dashboardTablePaginationProps(props)}
        className={cn(
          "!mx-0 !my-0 flex w-full flex-wrap items-center justify-end gap-y-2",
          "[&_.ant-pagination-total-text]:mr-auto [&_.ant-pagination-total-text]:flex-1",
        )}
      />
    </div>
  );
}
