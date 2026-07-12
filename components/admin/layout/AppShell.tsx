"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/lib/admin/use-admin-auth";
import { getStats } from "@/lib/admin/stats";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAdminAuth();
  const [badges, setBadges] = useState<{ support?: number; sms?: number }>({});

  useEffect(() => {
    if (!admin) return;
    getStats()
      .then((stats) => {
        setBadges({
          support: stats.support.openIssueReports,
          sms: stats.photographers.pendingSmsSenders,
        });
      })
      .catch(() => {});
  }, [admin]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f4f6f9]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
          <p className="text-sm text-slate-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (!admin) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f6f9]">
      <Sidebar badges={badges} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto px-6 pt-6 pb-8 lg:px-8 lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}
