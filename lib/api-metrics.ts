export type ApiMetricRecord = {
  path: string;
  method: string;
  durationMs: number;
  status: number;
  cached: boolean;
  retries: number;
  at: number;
};

const MAX_SAMPLES = 120;
const samples: ApiMetricRecord[] = [];

export function recordApiMetric(record: Omit<ApiMetricRecord, "at">): void {
  samples.push({ ...record, at: Date.now() });
  if (samples.length > MAX_SAMPLES) samples.shift();

  if (process.env.NODE_ENV === "development" && record.durationMs >= 800) {
    console.info(
      `[api] ${record.method} ${record.path} ${record.status} ${record.durationMs.toFixed(0)}ms` +
        (record.cached ? " (cache)" : "") +
        (record.retries > 0 ? ` retries=${record.retries}` : ""),
    );
  }
}

export function getRecentApiMetrics(limit = 30): ApiMetricRecord[] {
  return samples.slice(-limit);
}

export function getApiLatencySummary(): {
  count: number;
  p50Ms: number;
  p95Ms: number;
  errorRate: number;
} {
  if (samples.length === 0) {
    return { count: 0, p50Ms: 0, p95Ms: 0, errorRate: 0 };
  }
  const durations = samples.map((s) => s.durationMs).sort((a, b) => a - b);
  const p50 = durations[Math.floor(durations.length * 0.5)] ?? 0;
  const p95 = durations[Math.floor(durations.length * 0.95)] ?? p50;
  const errors = samples.filter((s) => s.status >= 400 || s.status === 0).length;
  return {
    count: samples.length,
    p50Ms: Math.round(p50),
    p95Ms: Math.round(p95),
    errorRate: errors / samples.length,
  };
}
