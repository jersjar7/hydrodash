// lib/utils/normalizers.ts
//
// Raw API → normalized app models (pure, isomorphic).
// Keep provider-specific quirks inside small helpers so swapping sources later is easy.

import type {
  Horizon,
  NormalizedFlowForecast,
  NormalizedPoint,
  ReturnPeriodRow,
  ReturnPeriodThresholds,
  ReachReturnPeriods,
  ReachId,
} from '@/types';
import { cmsToCfs } from './units';
import { toReachId } from './ids';

// ---------- Small safe parsers ----------

/** Return an ISO string if possible; otherwise '' (filtered later). */
function toISO(value: unknown): string {
  if (typeof value === 'string') {
    // Allow already-ISO values
    const d = new Date(value);
    return isNaN(d.getTime()) ? '' : d.toISOString();
  }
  if (typeof value === 'number') {
    // Assume UNIX ms or s if big/small
    const ms = value > 1e12 ? value : value * 1000;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? '' : d.toISOString();
  }
  return '';
}

/** Coerce to finite number; otherwise return NaN. */
function toNumber(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : (value as number);
  return Number.isFinite(n) ? n : NaN;
}

// ---------- NOAA streamflow normalization ----------
//
// Expected raw shape is flexible; we normalize as long as we can find:
//   - a timestamp under "time" | "t" | "validTime"
//   - a flow (cms) under "flow_cms" | "streamflow" | "q_cms"
//
// Example raw:
// { points: [{ time: '2025-08-14T00:00Z', flow_cms: 50.2 }, ...] }

type RawNoaaPoint = Record<string, unknown>;
type RawNoaaSeries =
  | { points?: RawNoaaPoint[] }
  | RawNoaaPoint[]
  | Record<string, unknown>;

/** Extract a timestamp from a possibly-varying key. */
function readTime(p: RawNoaaPoint): string {
  return toISO(p.time ?? p.t ?? p.validTime ?? p.timestamp ?? '');
}

/** Extract flow (cms) from common keys. */
function readFlowCms(p: RawNoaaPoint): number {
  const cms = toNumber(p.flow_cms ?? p.streamflow ?? p.q_cms ?? p.flow ?? NaN);
  return cms;
}

/** 
 * Check if a flow value is valid (not a sentinel/missing data value)
 * NOAA uses -9999 CFS as missing data, which converts to ~-283 CMS
 * Since flow can't be negative, we just filter all negative values
 */
function isValidFlowValue(cms: number): boolean {
  if (!Number.isFinite(cms)) return false;
  if (cms < 0) return false;  // Catches -9999 CFS (→ -283 CMS) and other invalid negatives
  return true;
}

/** Normalize a list of raw NOAA points → sorted, deduped NormalizedPoint[] in CFS. */
export function normalizeNoaaPoints(raw: RawNoaaSeries): NormalizedPoint[] {
  const arr: RawNoaaPoint[] = Array.isArray((raw as any)?.points)
    ? ((raw as any).points as RawNoaaPoint[])
    : Array.isArray(raw)
      ? (raw as RawNoaaPoint[])
      : [];

  // Map → filter invalid → convert → dedupe by timestamp → sort
  const dedup = new Map<string, NormalizedPoint>();

  for (const p of arr) {
    const t = readTime(p);
    const cms = readFlowCms(p);
    
    // Filter out invalid timestamps and flow values (including -9999 sentinel)
    if (!t || !isValidFlowValue(cms)) continue;

    const q = cmsToCfs(cms);
    dedup.set(t, { t, q }); // last one wins for a given timestamp
  }

  const out = Array.from(dedup.values());
  out.sort((a, b) => (a.t < b.t ? -1 : a.t > b.t ? 1 : 0));
  return out;
}

/**
 * Build a NormalizedFlowForecast from one or more raw series.
 * Pass each horizon + label + raw payload you fetched.
 */
export function buildNormalizedForecast(
  reachIdInput: string | number | ReachId,
  seriesInput: Array<{ horizon: Horizon; label: 'mean' | `member${number}`; raw: any }>
): NormalizedFlowForecast {
  const reachId = typeof reachIdInput === 'string' || typeof reachIdInput === 'number'
    ? toReachId(reachIdInput)
    : reachIdInput; // already ReachId

  return {
    reachId,
    series: seriesInput.map(({ horizon, label, raw }) => ({
      horizon,
      label,
      points: normalizeNoaaPoints(raw),
    })),
  };
}


// ---------- Return period normalization (CMS → CFS) ----------

/** Convert a single ReturnPeriodRow (cms) → thresholds in CFS. */
function rowToThresholdsCfs(row: ReturnPeriodRow): ReturnPeriodThresholds {
  return {
    rp2: cmsToCfs(row.return_period_2),
    rp5: cmsToCfs(row.return_period_5),
    rp10: cmsToCfs(row.return_period_10),
    rp25: cmsToCfs(row.return_period_25),
    rp50: cmsToCfs(row.return_period_50),
    rp100: cmsToCfs(row.return_period_100),
  };
}

/**
 * Normalize an array of raw rows into a lookup-friendly array keyed by reachId.
 * NOTE: We treat feature_id as a string reachId to keep IDs consistent across the app.
 */
export function normalizeReturnPeriods(
  rows: ReturnPeriodRow[]
): ReachReturnPeriods[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter(r => Number.isFinite(r.feature_id))
    .map(r => ({
      reachId: toReachId(r.feature_id),
      thresholds: rowToThresholdsCfs(r),
    }));
}

// ---------- (Placeholder) Weather normalization skeleton ----------
// When you add WeatherKit, mirror the NOAA approach and keep the surface small.
//
// type RawWeather = { hourly?: Array<{ time: string; temperature_c?: number; ... }> };
//
// export function normalizeWeather(raw: RawWeather): WeatherForecast {
//   // Convert to your WeatherForecast types (keep ISO strings, convert units here).
// }
