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

export function computeActivityDeltas(
  timestamps: string[],
  referenceIso?: string | null,
): { todayDelta: number; weekDelta: number } {
  const ref = referenceIso ? new Date(referenceIso) : new Date();
  const end = new Date(ref);
  end.setHours(23, 59, 59, 999);

  const dayStart = new Date(end);
  dayStart.setHours(0, 0, 0, 0);

  const yesterdayEnd = new Date(dayStart);
  yesterdayEnd.setMilliseconds(-1);
  const yesterdayStart = new Date(yesterdayEnd);
  yesterdayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date(end);
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  const prevWeekEnd = new Date(weekStart);
  prevWeekEnd.setMilliseconds(-1);
  const prevWeekStart = new Date(prevWeekEnd);
  prevWeekStart.setDate(prevWeekStart.getDate() - 6);
  prevWeekStart.setHours(0, 0, 0, 0);

  const countInRange = (start: number, finish: number) =>
    timestamps.filter((iso) => {
      const t = new Date(iso).getTime();
      return Number.isFinite(t) && t >= start && t <= finish;
    }).length;

  const today = countInRange(dayStart.getTime(), end.getTime());
  const yesterday = countInRange(yesterdayStart.getTime(), yesterdayEnd.getTime());
  const thisWeek = countInRange(weekStart.getTime(), end.getTime());
  const lastWeek = countInRange(prevWeekStart.getTime(), prevWeekEnd.getTime());

  return {
    todayDelta: today - yesterday,
    weekDelta: thisWeek - lastWeek,
  };
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
      label: "Proofs",
      bytes: raws,
      color: pick("#6366f1", "#818cf8"),
      darkColor: "#818cf8",
    },
    {
      key: "selections",
      label: "Selected",
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
