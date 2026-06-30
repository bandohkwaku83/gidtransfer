"use client";

import { DatePicker, type DatePickerProps } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { CalendarDays } from "lucide-react";
import { onboardingDatePickerClassName } from "@/lib/onboarding-field-styles";
import { cn } from "@/lib/utils";

const FORM_DATE_PICKER_CLASS =
  "w-full !box-border !flex !min-h-11 !w-full !items-center !rounded-xl !border-zinc-200 !bg-white !px-4 !py-0 !shadow-none hover:!border-zinc-300 [&.ant-picker-focused]:!border-zinc-400 [&.ant-picker-focused]:!shadow-none dark:!border-zinc-700 dark:!bg-zinc-950 [&_.ant-picker-input>input]:!text-sm";

type FormDatePickerProps = Omit<DatePickerProps, "value" | "onChange"> & {
  /** ISO date `YYYY-MM-DD` */
  value: string;
  onChange: (isoDate: string) => void;
  className?: string;
  appearance?: "default" | "onboarding";
};

function parseIsoDate(value: string): Dayjs | null {
  const t = value.trim();
  if (!t) return null;
  const d = dayjs(t, "YYYY-MM-DD", true);
  return d.isValid() ? d : null;
}

/** Calendar popup date field — stores `YYYY-MM-DD`, displays e.g. “Jun 1, 2026”. */
export function FormDatePicker({
  value,
  onChange,
  className,
  appearance = "default",
  size,
  format = "MMM D, YYYY",
  allowClear,
  suffixIcon,
  placeholder,
  ...props
}: FormDatePickerProps) {
  const isOnboarding = appearance === "onboarding";

  return (
    <DatePicker
      value={parseIsoDate(value)}
      onChange={(d) => {
        const single = Array.isArray(d) ? d[0] : d;
        onChange(single ? single.format("YYYY-MM-DD") : "");
      }}
      format={format}
      size={size}
      allowClear={allowClear ?? (isOnboarding ? false : undefined)}
      placeholder={placeholder ?? (isOnboarding ? "Select date" : undefined)}
      suffixIcon={
        suffixIcon ??
        (isOnboarding ? (
          <CalendarDays
            className="pointer-events-none h-4 w-4 shrink-0 text-neutral-400"
            strokeWidth={1.6}
            aria-hidden
          />
        ) : undefined)
      }
      className={cn(
        isOnboarding ? onboardingDatePickerClassName : FORM_DATE_PICKER_CLASS,
        className,
      )}
      {...props}
    />
  );
}
