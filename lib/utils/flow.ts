// lib/utils/flow.ts
/**
 * Flow data utilities for extracting current conditions and analyzing time series
 */

import type { NormalizedFlowForecast, NormalizedPoint } from '@/types';

/**
 * Find the flow value closest to the target time by comparing timestamps
 * 
 * @param points - Array of time series points (sorted by time ascending)
 * @param targetTime - ISO timestamp to find closest point to (defaults to current device time)
 * @returns Flow value in CFS or null if no valid data
 */
export function getCurrentFlowValue(
  points: NormalizedPoint[], 
  targetTime?: string
): number | null {
  if (!points || points.length === 0) return null;
  
  const target = targetTime ? new Date(targetTime) : new Date();
  const targetTime_ms = target.getTime();
  
  let closestPoint: NormalizedPoint | null = null;
  let smallestTimeDiff = Infinity;
  
  for (const point of points) {
    const pointTime = new Date(point.t).getTime();
    const timeDiff = Math.abs(targetTime_ms - pointTime);
    
    if (timeDiff < smallestTimeDiff) {
      smallestTimeDiff = timeDiff;
      closestPoint = point;
    }
  }
  
  return closestPoint?.q || null;
}

/**
 * Get current flow from forecast data by comparing device time to validTime
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