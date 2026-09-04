import { Suspense } from "react";
import { DashboardPageSpin } from "@/components/ui/skeletons";
import { SchedulesClient } from "./schedules-client";

export default function SchedulesPage() {
  return (
    <Suspense fallback={<DashboardPageSpin label="Loading bookings…" className="dashboard-page px-4" />}>
      <SchedulesClient />
    </Suspense>
  );
}
