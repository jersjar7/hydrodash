// types/models/ReturnPeriod.ts
/**
 * Return period thresholds from NOAA-derived service.
 * Raw units: CMS (m³/s).
 */

import type { ReachId } from "./RiverReach";

/** Raw NOAA row — values in CMS (m³/s) as returned by the API */
export interface ReturnPeriodRow {
  feature_id: number;
  return_period_2: number;
  return_period_5: number;
  return_period_10: number;
  return_period_25: number;
  return_period_50: number;
  return_period_100: number;
}

export type ReturnPeriodResponse = ReturnPeriodRow[];

/** Normalized thresholds — values in CFS (ft³/s) for consistent UI usage */
export interface ReturnPeriodThresholds {
  rp2: number;
  rp5: number;
  rp10: number;
  rp25: number;
  rp50: number;
  rp100: number;
}

export interface ReachReturnPeriods {
  reachId: ReachId;
  thresholds: ReturnPeriodThresholds;
}