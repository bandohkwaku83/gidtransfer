"use client";

import { Select, type SelectProps } from "antd";
import { cn } from "@/lib/utils";

const FORM_SELECT_CLASS =
  "w-full [&_.ant-select-selector]:!min-h-[42px] [&_.ant-select-selector]:!items-center [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!border-zinc-200 [&_.ant-select-selector]:!bg-white [&_.ant-select-selector]:!px-3 [&_.ant-select-selector]:!py-2 [&_.ant-select-selection-item]:!text-sm [&_.ant-select-selection-item]:!text-zinc-900 dark:[&_.ant-select-selector]:!border-zinc-700 dark:[&_.ant-select-selector]:!bg-zinc-900 dark:[&_.ant-select-selection-item]:!text-zinc-100";

/** Ant Design select styled for dashboard forms and modals. */
export function FormSelect<Value extends string = string>({
  className,
  ...props
}: SelectProps<Value> & { className?: string }) {
  return <Select<Value> className={cn(FORM_SELECT_CLASS, className)} {...props} />;
}
