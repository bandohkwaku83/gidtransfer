"use client";

import { Select } from "antd";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type FilterChipOption<T extends string = string> = {
  value: T;
  label: string;
};

type FilterChipSelectProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: FilterChipOption<T>[];
  className?: string;
  "aria-label"?: string;
};

const CHIP_SELECT_CLASS =
  "[&_.ant-select-selector]:!h-8 [&_.ant-select-selector]:!rounded-[30px] [&_.ant-select-selector]:!border-transparent [&_.ant-select-selector]:!bg-white [&_.ant-select-selector]:!px-2.5 [&_.ant-select-selector]:!pr-7 [&_.ant-select-selector]:!shadow-none sm:[&_.ant-select-selector]:!h-9 sm:[&_.ant-select-selector]:!px-3 sm:[&_.ant-select-selector]:!pr-8 dark:[&_.ant-select-selector]:!bg-zinc-900 [&_.ant-select-selection-item]:!text-[11px] [&_.ant-select-selection-item]:!font-medium [&_.ant-select-selection-item]:!text-zinc-700 sm:[&_.ant-select-selection-item]:!text-[12px] dark:[&_.ant-select-selection-item]:!text-zinc-200 [&_.ant-select-arrow]:!text-zinc-500";

/** Compact pill select for dashboard filter bars (Ant Design). */
export function FilterChipSelect<T extends string>({
  value,
  onChange,
  options,
  className,
  "aria-label": ariaLabel,
}: FilterChipSelectProps<T>) {
  return (
    <Select<T>
      value={value}
      onChange={onChange}
      options={options}
      aria-label={ariaLabel}
      popupMatchSelectWidth={false}
      suffixIcon={<ChevronDown className="h-3.5 w-3.5 text-zinc-500" aria-hidden />}
      className={cn("min-w-[7.5rem]", CHIP_SELECT_CLASS, className)}
      variant="outlined"
    />
  );
}
