import { apiFolderStatusToUi, type ApiFolder } from "@/lib/folders-api";

export type PipelineSlice = {
  key: string;
  label: string;
  value: number;
  color: string;
  darkColor: string;
};

export type WeeklyBar = {
  label: string;
  value: number;
  dateKey: string;
};

export type StorageSlice = {
  key: string;
  label: string;
  bytes: number;
  color: string;
  darkColor: string;
};

export function computePipelineSlices(
  folders: ApiFolder[],
  dark: boolean,
): PipelineSlice[] {
  let draft = 0;
  let selectionPending = 0;
  let completed = 0;
  for (const f of folders) {
    const s = apiFolderStatusToUi(f.status);
    if (s === "COMPLETED") completed += 1;
    else if (s === "SELECTION_PENDING") selectionPending += 1;
    else draft += 1;
  }
  const pick = (light: string, dk: string) => (dark ? dk : light);
  return [
    {
      key: "draft",
      label: "Draft",
      value: draft,
      color: pick("#94a3b8", "#64748b"),
      darkColor: "#64748b",
    },
    {
      key: "selection",
      label: "Selection",
      value: selectionPending,
      color: pick("#f59e0b", "#fbbf24"),
      darkColor: "#fbbf24",
    },
    {
      key: "completed",
      label: "Completed",
      value: completed,
      color: pick("#10b981", "#34d399"),
      darkColor: "#34d399",
    },
  ].filter((s) => s.value > 0);
}

export function computeWeeklyActivity(
  timestamps: string[],
  referenceIso?: string | null,
  days = 7,
): WeeklyBar[] {
  const ref = referenceIso ? new Date(referenceIso) : new Date();
  const end = new Date(ref);
  end.setHours(23, 59, 59, 999);

  const buckets: WeeklyBar[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const dateKey = d.toISOString().slice(0, 10);
    buckets.push({
      dateKey,
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      value: 0,
    });
  }

  const indexByKey = new Map(buckets.map((b, i) => [b.dateKey, i]));
  for (const iso of timestamps) {
    if (!iso) continue;
    const t = new Date(iso);
    if (Number.isNaN(t.getTime())) continue;
    const key = t.toISOString().slice(0, 10);
    const idx = indexByKey.get(key);
    if (idx !== undefined) buckets[idx]!.value += 1;
  }

  return buckets;
}

export function formatBytesShort(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  let n = bytes;
  let u = 0;
  while (n >= 1024 && u < units.length - 1) {
    n /= 1024;
    u += 1;
  }
  const digits = n >= 100 || u === 0 ? 0 : n >= 10 ? 1 : 2;
  return `${n.toFixed(digits)} ${units[u]}`;
}

export function storageSlicesFromUsage(
  raws: number,
  selections: number,
  finals: number,
  dark: boolean,
): StorageSlice[] {
  const pick = (light: string, dk: string) => (dark ? dk : light);
  return [
    {
      key: "raws",
      label: "RAWs",
      bytes: raws,
      color: pick("#6366f1", "#818cf8"),
      darkColor: "#818cf8",
    },
    {
      key: "selections",
      label: "Selections",
      bytes: selections,
      color: pick("#8b5cf6", "#a78bfa"),
      darkColor: "#a78bfa",
    },
    {
      key: "finals",
      label: "Finals",
      bytes: finals,
      color: pick("#06b6d4", "#22d3ee"),
      darkColor: "#22d3ee",
    },
  ].filter((s) => s.bytes > 0);
}
