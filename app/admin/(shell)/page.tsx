"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Camera, Images, MailCheck, Users } from "lucide-react";
import { getStats } from "@/lib/admin/stats";
import { getPhotographers } from "@/lib/admin/photographers";
import { getErrorMessage } from "@/lib/admin/admin-client";
import type { PhotographerListItem, StatsResponse } from "@/lib/admin/types";
import {
  HorizontalBarChart,
  KpiTile,
  OverviewCard,
  PhotographersTable,
  RadarChart,
} from "@/components/admin/dashboard/Charts";

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [photographers, setPhotographers] = useState<PhotographerListItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getStats(), getPhotographers({ page: 1, limit: 5 })])
      .then(([statsData, photographersData]) => {
        setStats(statsData);
        setPhotographers(photographersData.items);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid items-stretch gap-4 lg:grid-cols-5">
          <div className="grid grid-cols-2 gap-4 lg:col-span-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card h-[8.75rem] animate-pulse bg-slate-50" />
            ))}
          </div>
          <div className="card h-72 animate-pulse bg-slate-50 lg:col-span-3" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card h-80 animate-pulse bg-slate-50" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="card flex items-center gap-3 p-5 text-red-600">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <p className="text-sm">{error || "Failed to load stats"}</p>
      </div>
    );
  }

  const { photographers: pStats, clients, galleries, support } = stats;
  const onboardingPct =
    pStats.total > 0
      ? Math.round((pStats.onboarded / pStats.total) * 100)
      : 0;

  const radarDatasets = [
    {
      label: "Plans",
      data: pStats.byPlan,
      color: "#5e001e",
    },
    {
      label: "Galleries",
      data: galleries.byStatus,
      color: "#10b981",
    },
    {
      label: "Subscriptions",
      data: pStats.bySubscriptionStatus,
      color: "#c990a0",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top row: 4 KPIs + overview */}
      <div className="grid items-stretch gap-4 lg:grid-cols-5">
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <KpiTile
            label="Photographers"
            value={pStats.total}
            icon={Camera}
            variant="primary"
            hint={`${pStats.active} active`}
          />
          <KpiTile
            label="Clients"
            value={clients.total}
            icon={Users}
            variant="rose"
          />
          <KpiTile
            label="Galleries"
            value={galleries.active}
            icon={Images}
            variant="emerald"
            hint={`${galleries.trashed} trashed`}
          />
          <KpiTile
            label="Onboarded"
            value={`${onboardingPct}%`}
            icon={MailCheck}
            variant="amber"
            hint={`${pStats.onboarded}/${pStats.total}`}
          />
        </div>

        <div className="lg:col-span-3">
          <OverviewCard
            photographers={pStats}
            support={support}
          />
        </div>
      </div>

      {/* Bottom row: table + charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <PhotographersTable photographers={photographers} />

        <HorizontalBarChart
          title="Subscription status"
          data={pStats.bySubscriptionStatus}
          legend={[
            { label: "Active", color: "#5e001e" },
            { label: "Other", color: "#c990a0" },
          ]}
        />

        <RadarChart title="Platform breakdown" datasets={radarDatasets} />
      </div>
    </div>
  );
}
