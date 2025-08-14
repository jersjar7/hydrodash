// types/models/FlowForecast.ts
/**
 * Raw NOAA NWPS streamflow forecast structures + normalized UI model.
 * Keep widgets using ONLY the normalized model.
 */

import type { RiverReach, ReachId } from "./RiverReach";

/** Raw atomic point: time + discharge value in the series' declared units */
export interface ForecastDataPoint {
  /** ISO timestamp when the forecast is valid */
  validTime: string;
  /** Numeric flow in the series' units (often "ft³/s" / CFS) */
  flow: number;
}

/** Raw time series block from NOAA */
export interface ForecastSeries {
  /** ISO timestamp for model initialization/reference time */
  referenceTime: string;
  /** e.g., "ft³/s" (CFS) or "m³/s" (CMS) depending on endpoint */
  units: string;
  data: ForecastDataPoint[];
}

/** Short-range: single `series` */
export interface ShortRangeForecast {
  series?: ForecastSeries;
}

/** Ensemble member keys like "member1", "member2", ... */
export type EnsembleMemberKey = `member${number}`;

/** Medium/Long-range: mean + optional ensemble members */
export interface EnsembleForecast {
  mean?: ForecastSeries;
  [memberKey: EnsembleMemberKey]: ForecastSeries | undefined;
}

/** Complete raw API response shape */
export interface FlowForecastResponse {
  reach: RiverReach;
  /** Present in some responses; leave opaque until needed */
  analysisAssimilation?: Record<string, unknown>;
  shortRange?: ShortRangeForecast;
  mediumRange?: EnsembleForecast;
  longRange?: EnsembleForecast;
  /** Present in some responses; leave opaque until needed */
  mediumRangeBlend?: Record<string, unknown>;
}

/* ---------- Normalized (UI-facing) model ---------- */

export type Horizon = "short" | "medium" | "long";
export type SeriesLabel = "mean" | `member${number}`;
export type RiskLevel = "normal" | "elevated" | "high" | "flood";

export interface NormalizedPoint {
  /** ISO timestamp (UTC) */
  t: string;
  /** Discharge in CFS (ft³/s) */
  q: number;
}

export interface NormalizedSeries {
  horizon: Horizon;
  label: SeriesLabel;
  /** Sorted by time ascending */
  points: NormalizedPoint[];
}

export interface NormalizedFlowForecast {
  reachId: ReachId;
  series: NormalizedSeries[];
  /** Optional metrics computed elsewhere - all in CFS */
  peakFlow?: number;
  risk?: RiskLevel;
}