import { getAuth } from "@/lib/auth-demo";
import { listDemoFoldersApiModels } from "@/lib/demo-api-bridge";
import { loadAllClients } from "@/lib/demo-data";
import { HttpError } from "@/lib/http";

import type { ApiClient } from "@/lib/clients-api";
import type { ApiFolder } from "@/lib/folders-api";

export type DashboardUser = {
  _id: string;
  name: string;
  email: string;
};

export type DashboardStats = {
  totalClients: number;
  totalGalleries: number;
  inProgressGalleries: number;
  completedGalleries: number;
};

export type DashboardRecentGallery = {
  id: string;
  title?: string;
  clientName: string;
  coverImageUrl?: string;
  status?: string;
  updatedAt?: string;
  createdAt?: string;
};

export type DashboardActivityItem = {
  action: string;
  targetType: string;
  targetName?: string;
  galleryId?: string;
  at: string;
};

export type DashboardResponse = {
  user: DashboardUser;
  serverDate: string;
  stats: DashboardStats;
  recentGalleries: DashboardRecentGallery[];
  activity: DashboardActivityItem[];
};

export class DashboardApiError extends HttpError {}

export function dashboardRecentGalleryToApiFolder(g: DashboardRecentGallery): ApiFolder {
  const title = g.title?.trim() || "";
  const clientObj: ApiClient = {
    _id: `${g.id}-client`,
    name: g.clientName,
    email: "",
    contact: "",
    location: "",
  };
  return {
    _id: g.id,
    client: clientObj,
    eventName: title,
    eventDate: (g.createdAt ?? "").slice(0, 10),
    description: g.clientName,
    coverImageUrl: g.coverImageUrl,
    status: g.status,
    createdAt: g.createdAt,
    updatedAt: g.updatedAt,
  };
}

export function activityItemToLabel(a: DashboardActivityItem): string {
  const target = a.targetName?.trim() || a.targetType;
  return `${a.action}, ${target}`;
}

export const DASHBOARD_HOME_LIST_LIMIT = 6;

async function delay(ms = 20) {
  await new Promise((r) => setTimeout(r, ms));
}

export async function fetchDashboard(): Promise<DashboardResponse> {
  await delay();
  const auth = typeof window !== "undefined" ? getAuth() : null;
  const user: DashboardUser = auth?.user
    ? { _id: auth.user._id, name: auth.user.name, email: auth.user.email }
    : {
        _id: "demo-local",
        name: "Demo photographer",
        email: auth?.email?.trim() || "demo@local.test",
      };

  const clients = loadAllClients();
  const folders = listDemoFoldersApiModels();
  const completed = folders.filter((f) =>
    ["completed", "complete", "delivered"].includes((f.status ?? "").toLowerCase()),
  );
  const inProgress = folders.length - completed.length;

  const sorted = [...folders].sort((a, b) => {
    const ta = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
    const tb = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
    return tb - ta;
  });

  const recentGalleries: DashboardRecentGallery[] = sorted.slice(0, DASHBOARD_HOME_LIST_LIMIT).map((f) => ({
    id: f._id,
    title: f.eventName,
    clientName: typeof f.client === "object" ? f.client.name : "Client",
    coverImageUrl: f.coverImageUrl,
    status: f.status,
    updatedAt: f.updatedAt,
    createdAt: f.createdAt,
  }));

  const activity: DashboardActivityItem[] = recentGalleries.slice(0, DASHBOARD_HOME_LIST_LIMIT).map((g, i) => ({
    action: i % 2 === 0 ? "Updated gallery" : "Viewed gallery",
    targetType: "gallery",
    targetName: g.title ?? g.clientName,
    galleryId: g.id,
    at: g.updatedAt ?? g.createdAt ?? new Date().toISOString(),
  }));

  return {
    user,
    serverDate: new Date().toISOString(),
    stats: {
      totalClients: clients.length,
      totalGalleries: folders.length,
      inProgressGalleries: Math.max(0, inProgress),
      completedGalleries: completed.length,
    },
    recentGalleries,
    activity,
  };
}
