// lib/utils/flow.ts
/**
 * Flow data utilities for extracting current conditions and analyzing time series
 */

import type { NormalizedFlowForecast, NormalizedPoint } from '@/types';

/**
 * Find the flow value for the current hour (not closest point)
 * For hourly forecast data, returns the forecast for the hour we're currently in
 * 
 * @param points - Array of time series points (sorted by time ascending)
 * @param targetTime - ISO timestamp to find current hour for (defaults to current device time)
 * @returns Flow value in CFS for current hour or null if no valid data
 */
export function getCurrentFlowValue(
  points: NormalizedPoint[], 
  targetTime?: string
): number | null {
  if (!points || points.length === 0) return null;
  
  const target = targetTime ? new Date(targetTime) : new Date();
  
  // Floor to the current hour (e.g., 15:56 -> 15:00)
  const currentHour = new Date(target);
  currentHour.setMinutes(0, 0, 0); // Set to beginning of hour
  
  // Look for forecast point that matches the current hour
  // For hourly data, this should be an exact match
  const targetHourISO = currentHour.toISOString();
  
  // First try to find exact match for current hour
  for (const point of points) {
    if (point.t === targetHourISO) {
      return point.q;
    }
  }
  
  // If no exact match, find the forecast point closest to but not after current hour
  // This handles cases where forecast times might be slightly off or missing
  let bestPoint: NormalizedPoint | null = null;
  const currentHourMs = currentHour.getTime();
  
  for (const point of points) {
    const pointTime = new Date(point.t).getTime();
    
    // Only consider points at or before current hour
    if (pointTime <= currentHourMs) {
      if (!bestPoint || pointTime > new Date(bestPoint.t).getTime()) {
        bestPoint = point;
      }
    }
  }
  
  // If we found a point for current hour or earlier, use it
  if (bestPoint) {
    return bestPoint.q;
  }
  
  // If no point for current hour or earlier exists, 
  // fall back to closest future point (original behavior)
  let closestPoint: NormalizedPoint | null = null;
  let smallestTimeDiff = Infinity;
  
  for (const point of points) {
    const pointTime = new Date(point.t).getTime();
    const timeDiff = Math.abs(target.getTime() - pointTime);
    
    if (timeDiff < smallestTimeDiff) {
      smallestTimeDiff = timeDiff;
      closestPoint = point;
    }
  }
  
  return closestPoint?.q || null;
}

/**
 * Get current flow from forecast data using current hour logic
 * 
 * Flow Selection Logic:
 * 1. **Current Hour Floor**: At 15:56 local time, it floors to 15:00 local time (21:00 UTC)
 * 2. **Exact Match First**: Looks for forecast point with `validTime: "2025-08-18T21:00:00Z"`
 * 3. **Fallback Logic**: If no exact match, finds the most recent point before/at current hour
 * 4. **Final Fallback**: If no past points exist, uses original closest-point logic
 * 
 * @param forecast - Normalized flow forecast data
 * @returns Current flow value in CFS or null if no data available
 */
export function getCurrentFlow(
  forecast: NormalizedFlowForecast | undefined
): number | null {
  if (!forecast?.series?.length) return null;
  
  // Prioritize short-range data for current conditions (most accurate for near-term)
  const prioritizedSeries = forecast.series
    .filter(s => s.points.length > 0)
    .sort((a, b) => {
      const priorityMap = { short: 1, medium: 2, long: 3 };
      return priorityMap[a.horizon] - priorityMap[b.horizon];
    });
  
  // Try each series until we find a valid current flow
  for (const series of prioritizedSeries) {
    const currentFlow = getCurrentFlowValue(series.points); // Uses current device time
    if (currentFlow !== null) {
      return currentFlow;
    }
  }
  
  return null;
}

/**
 * Get the most recent actual data point (latest validTime in forecast)
 * Useful for getting the latest available measurement
 * 
 * @param forecast - Normalized flow forecast data
 * @returns Most recent flow value and timestamp, or null if no data
 */
export function getLatestFlow(
  forecast: NormalizedFlowForecast | undefined
): { flow: number; timestamp: string } | null {
  if (!forecast?.series?.length) return null;
  
  // Get all points from all series and find the most recent
  const allPoints = forecast.series.flatMap(s => s.points);
  if (allPoints.length === 0) return null;
  
  // Sort by time descending to get most recent first
  const sortedPoints = allPoints.sort((a, b) => 
    new Date(b.t).getTime() - new Date(a.t).getTime()
  );
  
  const latest = sortedPoints[0];
  return {
    flow: latest.q,
    timestamp: latest.t
  };
}

/**
 * Check if current time falls within the forecast period
 * 
 * @param forecast - Normalized flow forecast data
 * @param targetTime - Optional target time (defaults to current device time)
 * @returns True if target time is within forecast period
 */
export function isWithinForecastPeriod(
  forecast: NormalizedFlowForecast | undefined,
  targetTime?: string
): boolean {
  if (!forecast?.series?.length) return false;
  
  const target = targetTime ? new Date(targetTime) : new Date();
  const targetTime_ms = target.getTime();
  
  // Check all series for time bounds
  for (const series of forecast.series) {
    if (series.points.length === 0) continue;
    
    const firstPoint = new Date(series.points[0].t).getTime();
    const lastPoint = new Date(series.points[series.points.length - 1].t).getTime();
    
    if (targetTime_ms >= firstPoint && targetTime_ms <= lastPoint) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get flow value with interpolation between two closest points
 * More accurate than nearest neighbor for smooth data
 * 
 * @param points - Array of time series points (sorted by time ascending)
 * @param targetTime - ISO timestamp to interpolate for (defaults to current time)
 * @returns Interpolated flow value in CFS or null if no valid data
 */
export function getInterpolatedFlow(
  points: NormalizedPoint[],
  targetTime?: string
): number | null {
  if (!points || points.length === 0) return null;
  if (points.length === 1) return points[0].q;
  
  const target = targetTime ? new Date(targetTime) : new Date();
  const targetTime_ms = target.getTime();
  
  // Find the two points that bracket the target time
  let beforePoint: NormalizedPoint | null = null;
  let afterPoint: NormalizedPoint | null = null;
  
  for (let i = 0; i < points.length; i++) {
    const pointTime = new Date(points[i].t).getTime();
    
    if (pointTime <= targetTime_ms) {
      beforePoint = points[i];
    }
    
    if (pointTime >= targetTime_ms && !afterPoint) {
      afterPoint = points[i];
      break;
    }
  }
  
  // If we only have one side, return that value
  if (!beforePoint && afterPoint) return afterPoint.q;
  if (beforePoint && !afterPoint) return beforePoint.q;
  if (!beforePoint && !afterPoint) return null;
  
  // If both points are the same time, return that value
  if (beforePoint!.t === afterPoint!.t) return beforePoint!.q;
  
  // Linear interpolation
  const beforeTime = new Date(beforePoint!.t).getTime();
  const afterTime = new Date(afterPoint!.t).getTime();
  
  const timeFraction = (targetTime_ms - beforeTime) / (afterTime - beforeTime);
  const interpolatedFlow = beforePoint!.q + (afterPoint!.q - beforePoint!.q) * timeFraction;
  
  return interpolatedFlow;
}

/**
 * Get current flow using interpolation for more accuracy
 * 
 * @param forecast - Normalized flow forecast data  
 * @param targetTime - Optional target time (defaults to current device time)
 * @returns Interpolated current flow value in CFS or null if no data available
 */
export function getCurrentFlowInterpolated(
  forecast: NormalizedFlowForecast | undefined,
  targetTime?: string
): number | null {
  if (!forecast?.series?.length) return null;
  
  // Prioritize short-range data for current conditions
  const prioritizedSeries = forecast.series
    .filter(s => s.points.length > 0)
    .sort((a, b) => {
      const priorityMap = { short: 1, medium: 2, long: 3 };
      return priorityMap[a.horizon] - priorityMap[b.horizon];
    });
  
  // Try each series until we find valid interpolated flow
  for (const series of prioritizedSeries) {
    const interpolatedFlow = getInterpolatedFlow(series.points, targetTime);
    if (interpolatedFlow !== null) {
      return interpolatedFlow;
    }
  }
  
  return null;
}

/**
 * Get peak flow from forecast data
 * 
 * @param forecast - Normalized flow forecast data
 * @returns Peak flow value in CFS or null if no data
 */
export function getPeakFlow(forecast: NormalizedFlowForecast | undefined): number | null {
  if (!forecast?.series?.length) return null;
  
  const allPoints = forecast.series.flatMap(s => s.points);
  if (allPoints.length === 0) return null;
  
  return Math.max(...allPoints.map(p => p.q));
}

/**
 * Get flow statistics for a forecast
 * 
 * @param forecast - Normalized flow forecast data
 * @returns Statistics object with min, max, mean, current flow
 */
export function getFlowStats(forecast: NormalizedFlowForecast | undefined) {
  if (!forecast?.series?.length) {
    return {
      min: null,
      max: null,
      mean: null,
      current: null,
      latest: null,
      pointCount: 0
    };
  }
  
  const allPoints = forecast.series.flatMap(s => s.points);
  if (allPoints.length === 0) {
    return {
      min: null,
      max: null, 
      mean: null,
      current: null,
      latest: null,
      pointCount: 0
    };
  }
  
  const flows = allPoints.map(p => p.q);
  const sum = flows.reduce((acc, flow) => acc + flow, 0);
  
  return {
    min: Math.min(...flows),
    max: Math.max(...flows),
    mean: sum / flows.length,
    current: getCurrentFlow(forecast),
    latest: getLatestFlow(forecast),
    pointCount: allPoints.length
  };
}