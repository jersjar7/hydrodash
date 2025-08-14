/**
 * Return period thresholds from NOAA-derived service.
 * Raw units: CMS (m³/s).
 */

// Raw API response (array of rows)
export interface ReturnPeriodRow {
  feature_id: number;
  /** CMS (m³/s), as returned by the API */
  return_period_2: number;
  return_period_5: number;
  return_period_10: number;
  return_period_25: number;
  return_period_50: number;
  return_period_100: number;
}

export type ReturnPeriodResponse = ReturnPeriodRow[];

/** Normalized to CFS for US users */
export interface NormalizedReturnPeriods {
  featureId: number;
  rp2?: number;
  rp5?: number;
  rp10?: number;
  rp25?: number;
  rp50?: number;
  rp100?: number;
  /** Always CFS after normalization */
  units: "cfs";
}
