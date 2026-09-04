"use client";

import { Dropdown, type MenuProps } from "antd";
import { useCallback, useMemo, useState } from "react";
import { DashboardSpin } from "@/components/ui/skeletons";
import { useToast } from "@/components/toast-provider";
import { dashboardPageHeaderCtaSecondaryClassName } from "@/components/dashboard/dashboard-page-header";
import { getAuth } from "@/lib/auth-demo";
import type { IncomeEntry } from "@/lib/income-demo";
import {
  buildIncomeReportData,
  downloadIncomeReportPdf,
  incomeReportMenuLabel,
  type IncomeReportPeriod,
} from "@/lib/income-report";
import { cn } from "@/lib/utils";

type Props = {
  entries: IncomeEntry[];
  selectedYear: string;
  className?: string;
};

const REPORT_PERIODS: IncomeReportPeriod[] = ["monthly", "quarterly", "yearly"];

export function IncomeReportMenu({ entries, selectedYear, className }: Props) {
  const { showToast } = useToast();
  const [generating, setGenerating] = useState<IncomeReportPeriod | null>(null);

  const generateReport = useCallback(
    async (period: IncomeReportPeriod) => {
      setGenerating(period);
      try {
        const auth = getAuth();
        const year = period === "yearly" ? Number(selectedYear) : undefined;
        const data = buildIncomeReportData(
          entries,
          period,
          auth?.user?.studio,
          auth?.user?.email ?? auth?.email,
          new Date(),
          year,
        );
        await downloadIncomeReportPdf(data);
        const emptyHint =
          data.summary.entryCount === 0 ? " (no entries in this period)" : "";
        showToast(`${incomeReportMenuLabel(period)} downloaded${emptyHint}.`, "success");
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : "Could not generate report.",
          "error",
        );
      } finally {
        setGenerating(null);
      }
    },
    [entries, selectedYear, showToast],
  );

  const menuItems: MenuProps["items"] = useMemo(
    () =>
      REPORT_PERIODS.map((period) => ({
        key: period,
        label: (
          <span className="inline-flex items-center gap-2">
            {generating === period ? <DashboardSpin size="small" /> : null}
            {incomeReportMenuLabel(period)}
          </span>
        ),
        disabled: generating !== null,
      })),
    [generating],
  );

  return (
    <Dropdown
      trigger={["click"]}
      placement="bottomRight"
      disabled={generating !== null}
      menu={{
        items: menuItems,
        onClick: ({ key }) => void generateReport(key as IncomeReportPeriod),
      }}
    >
      <button
        type="button"
        className={cn(dashboardPageHeaderCtaSecondaryClassName(), className)}
        aria-label="Generate income report"
      >
        {generating ? (
          <>
            <DashboardSpin size="small" />
            Generating…
          </>
        ) : (
          "Generate report"
        )}
      </button>
    </Dropdown>
  );
}
