import { loadAllProjects } from "@/lib/demo-data";
import { HttpError } from "@/lib/http";

export type UsageCategoryBreakdown = {
  bytes: number;
  percent_of_total: number;
};

export type UsageSummaryResponse = {
  total_storage_bytes: number;
  raws_size_bytes: number;
  selections_size_bytes: number;
  finals_size_bytes: number;
  by_category?: {
    raws?: UsageCategoryBreakdown;
    selections?: UsageCategoryBreakdown;
    finals?: UsageCategoryBreakdown;
  };
};

export type UsageGalleryClient = {
  id: string;
  name: string;
};

export type UsageGalleryRow = {
  id: string;
  name: string;
  client: UsageGalleryClient;
  raws_size_bytes: number;
  selections_size_bytes: number;
  finals_size_bytes: number;
  total_size_bytes: number;
};

export type UsageGalleriesResponse = {
  count: number;
  sort_by: string;
  order: string;
  galleries: UsageGalleryRow[];
};

export class UsageApiError extends HttpError {}

async function delay(ms = 20) {
  await new Promise((r) => setTimeout(r, ms));
}

/** Demo usage model: fixed bytes per asset class (not real file sizes). */
export const DEMO_BYTES_PER_RAW_ASSET = 4_500_000;
export const DEMO_BYTES_PER_FINAL_ASSET = 2_200_000;
export const DEMO_BYTES_PER_SELECTED_ASSET = 800_000;

function fakeBytesFromCount(n: number, unit: number): number {
  return Math.max(0, Math.floor(n * unit));
}

export function estimateDemoBytesForNewRawAssets(count: number): number {
  return fakeBytesFromCount(Math.max(0, count), DEMO_BYTES_PER_RAW_ASSET);
}

export function estimateDemoBytesForNewFinalAssets(count: number): number {
  return fakeBytesFromCount(Math.max(0, count), DEMO_BYTES_PER_FINAL_ASSET);
}

export function computeDemoStorageTotalBytes(): number {
  const projects = loadAllProjects();
  let raws = 0;
  let finals = 0;
  let sel = 0;
  for (const p of projects) {
    raws += fakeBytesFromCount(p.assets.length, DEMO_BYTES_PER_RAW_ASSET);
    finals += fakeBytesFromCount(p.finalAssets.length, DEMO_BYTES_PER_FINAL_ASSET);
    sel += fakeBytesFromCount(
      p.assets.filter((a) => a.selection === "SELECTED").length,
      DEMO_BYTES_PER_SELECTED_ASSET,
    );
  }
  return raws + sel + finals;
}

export async function fetchUsageSummary(): Promise<UsageSummaryResponse> {
  await delay();
  const projects = loadAllProjects();
  let raws = 0;
  let finals = 0;
  let sel = 0;
  for (const p of projects) {
    raws += fakeBytesFromCount(p.assets.length, DEMO_BYTES_PER_RAW_ASSET);
    finals += fakeBytesFromCount(p.finalAssets.length, DEMO_BYTES_PER_FINAL_ASSET);
    sel += fakeBytesFromCount(
      p.assets.filter((a) => a.selection === "SELECTED").length,
      DEMO_BYTES_PER_SELECTED_ASSET,
    );
  }
  const total = raws + sel + finals;
  const pct = (part: number) => (total > 0 ? Math.round((part / total) * 1000) / 10 : 0);
  return {
    total_storage_bytes: total,
    raws_size_bytes: raws,
    selections_size_bytes: sel,
    finals_size_bytes: finals,
    by_category: {
      raws: { bytes: raws, percent_of_total: pct(raws) },
      selections: { bytes: sel, percent_of_total: pct(sel) },
      finals: { bytes: finals, percent_of_total: pct(finals) },
    },
  };
}

export type UsageGalleriesSortBy = "total_size" | "name";

export async function fetchUsageGalleries(params: {
  sortBy: UsageGalleriesSortBy;
  order: "asc" | "desc";
  signal?: AbortSignal;
}): Promise<UsageGalleriesResponse> {
  await delay();
  void params.signal;
  const projects = loadAllProjects();
  let rows: UsageGalleryRow[] = projects.map((p) => {
    const raws = fakeBytesFromCount(p.assets.length, DEMO_BYTES_PER_RAW_ASSET);
    const finals = fakeBytesFromCount(p.finalAssets.length, DEMO_BYTES_PER_FINAL_ASSET);
    const selections = fakeBytesFromCount(
      p.assets.filter((a) => a.selection === "SELECTED").length,
      DEMO_BYTES_PER_SELECTED_ASSET,
    );
    const total = raws + selections + finals;
    return {
      id: p.id,
      name: p.clientName,
      client: { id: `virtual-${p.id}`, name: p.clientName },
      raws_size_bytes: raws,
      selections_size_bytes: selections,
      finals_size_bytes: finals,
      total_size_bytes: total,
    };
  });
  const dir = params.order === "asc" ? 1 : -1;
  if (params.sortBy === "name") {
    rows = rows.sort((a, b) => dir * a.name.localeCompare(b.name));
  } else {
    rows = rows.sort((a, b) => dir * (a.total_size_bytes - b.total_size_bytes));
  }
  return {
    count: rows.length,
    sort_by: params.sortBy,
    order: params.order,
    galleries: rows,
  };
}
