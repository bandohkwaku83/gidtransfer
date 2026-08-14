import {
  computeWeeklyActivity,
  type PipelineSlice,
  type WeeklyBar,
} from "@/lib/dashboard-chart-data";
import type { ApiFolder } from "@/lib/folders/types";

export type GalleryAnalyticsActivityPoint = {
  date: string;
  label: string;
  selections: number;
  galleryEvents: number;
  total: number;
};

export type GalleryAnalyticsUpgrade = {
  feature?: string;
  requiredPlans?: string[];
  message?: string;
} | null;

export type GalleryAnalyticsApi = {
  linkViews: number;
  clientDownloads?: number;
  clientPicks: number;
  selectionRate: number | null;
  mediaBreakdown: {
    uploads: number;
    selections: number;
    finals: number;
    total: number;
  };
  activity?: {
    days: number;
    series: GalleryAnalyticsActivityPoint[];
  };
  range?: unknown;
  tier?: "basic" | "advanced";
  upgrade?: GalleryAnalyticsUpgrade;
};

export type GalleryAnalyticsSnapshot = {
  totalViews: number;
  clientDownloads: number;
  clientPicks: number;
  selectionRate: number | null;
  weeklyActivity: WeeklyBar[];
  mediaSlices: PipelineSlice[];
  tier?: "basic" | "advanced";
  upgrade?: GalleryAnalyticsUpgrade;
};

export function collectGalleryActivityTimestamps(
  folder: ApiFolder | null | undefined,
  selectionTimestamps: (string | null | undefined)[],
): string[] {
  const out: string[] = [];
  if (folder?.share?.sharedAt?.trim()) out.push(folder.share.sharedAt);
  if (folder?.createdAt?.trim()) out.push(folder.createdAt);
  if (folder?.updatedAt?.trim()) out.push(folder.updatedAt);
  for (const iso of selectionTimestamps) {
    if (iso?.trim()) out.push(iso);
  }
  return out;
}

export function computeGalleryMediaSlices(
  uploads: number,
  selections: number,
  finals: number,
  dark = false,
): PipelineSlice[] {
  const pick = (light: string, dk: string) => (dark ? dk : light);
  return [
    {
      key: "uploads",
      label: "Uploads",
      value: uploads,
      color: pick("#6366f1", "#818cf8"),
      darkColor: "#818cf8",
    },
    {
      key: "selections",
      label: "Selections",
      value: selections,
      color: pick("#f59e0b", "#fbbf24"),
      darkColor: "#fbbf24",
    },
    {
      key: "finals",
      label: "Finals",
      value: finals,
      color: pick("#10b981", "#34d399"),
      darkColor: "#34d399",
    },
  ].filter((s) => s.value > 0);
}

export function buildGalleryAnalyticsSnapshot(input: {
  viewCount: number;
  downloadCount?: number;
  uploadsCount: number;
  selectionsCount: number;
  finalsCount: number;
  activityTimestamps: string[];
  referenceIso?: string | null;
  dark?: boolean;
}): GalleryAnalyticsSnapshot {
  const {
    viewCount,
    downloadCount = 0,
    uploadsCount,
    selectionsCount,
    finalsCount,
    activityTimestamps,
    referenceIso,
    dark,
  } = input;

  const selectionRate =
    uploadsCount > 0 ? Math.round((selectionsCount / uploadsCount) * 100) : null;

  return {
    totalViews: Math.max(0, viewCount),
    clientDownloads: Math.max(0, downloadCount),
    clientPicks: Math.max(0, selectionsCount),
    selectionRate,
    weeklyActivity: computeWeeklyActivity(activityTimestamps, referenceIso),
    mediaSlices: computeGalleryMediaSlices(uploadsCount, selectionsCount, finalsCount, dark),
  };
}

export function mapGalleryAnalyticsToSnapshot(
  analytics: GalleryAnalyticsApi,
  dark = false,
): GalleryAnalyticsSnapshot {
  const { mediaBreakdown, activity } = analytics;
  return {
    totalViews: Math.max(0, analytics.linkViews),
    clientDownloads: Math.max(0, analytics.clientDownloads ?? 0),
    clientPicks: Math.max(0, analytics.clientPicks),
    selectionRate: analytics.selectionRate,
    weeklyActivity: (activity?.series ?? []).map((point) => ({
      dateKey: point.date,
      label: point.label,
      value: Math.max(0, point.total),
    })),
    mediaSlices: computeGalleryMediaSlices(
      mediaBreakdown.uploads,
      mediaBreakdown.selections,
      mediaBreakdown.finals,
      dark,
    ),
    tier: analytics.tier,
    upgrade: analytics.upgrade,
  };
}
