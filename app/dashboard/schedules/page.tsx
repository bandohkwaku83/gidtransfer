import { Suspense } from "react";
import { SchedulesClient } from "./schedules-client";

export default function SchedulesPage() {
  return (
    <Suspense
      fallback={
        <div className="dashboard-page px-4 py-16 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Loading bookings…
        </div>
      }
    >
      <SchedulesClient />
    </Suspense>
  );
}
