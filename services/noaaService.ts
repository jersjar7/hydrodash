// services/noaaService.ts
/**
 * NOAA National Water Model (NWM) service - Focused Range Implementation
 * 
 * This service provides clean, focused functions for fetching different forecast horizons
 * from the NOAA NWPS API. Each range has its own function for modularity and testing.
 * 
 * API Endpoints Used:
 * - Short Range: 18-hour deterministic forecast (hourly data)
 * - Medium Range: ~10-day forecast (hourly intervals) 
 * - Long Range: ~30-day forecast (6-hour intervals)
 * 
 * IMPORTANT: NOAA uses inconsistent response structures:
 * - Short range: response.shortRange.series.data[]
 * - Medium/Long: response.mediumRange.mean.data[] / response.longRange.mean.data[]
 */

import type { 
  ReachId, 
  NormalizedFlowForecast, 
  Horizon,
  RiverReach,
  StreamflowSeriesName 
} from '@/types';
import { publicConfig } from '@/config';
import { buildNormalizedForecast } from '@/lib/utils/normalizers';
import { ApiError } from '@/types/utils';

// ========================================
// TypeScript Interfaces for NOAA API
// ========================================

interface NoaaDataPoint {
  validTime: string;  // ISO timestamp: "2025-08-14T17:00:00Z"
  flow: number;       // Flow in CFS (cubic feet per second)
}

interface NoaaTimeSeries {
  referenceTime: string;  // When forecast was issued
  units: string;          // Always "ft³/s" for streamflow
  data: NoaaDataPoint[];  // Time series data points
}

interface NoaaStreamflowResponse {
  reach: {
    reachId: string;
    name: string;
    latitude: number;
    longitude: number;
    streamflow: StreamflowSeriesName[];
    route?: {
      upstream: Array<{ reachId: string; streamOrder: string }>;
      downstream: Array<{ reachId: string; streamOrder: string }>;
    };
  };
  // Different nesting patterns for each forecast range
  shortRange?: {
    series?: NoaaTimeSeries;    // Note: uses 'series' key
  };
  mediumRange?: {
    mean?: NoaaTimeSeries;      // Note: uses 'mean' key  
  };
  longRange?: {
    mean?: NoaaTimeSeries;      // Note: uses 'mean' key
  };
  analysisAssimilation?: any;
  mediumRangeBlend?: any;
}

// ========================================
// Individual Range Fetch Functions
// ========================================

/**
 * Fetch short-range streamflow forecast (18-hour hourly)
 * 
 * @param reachId - NOAA reach identifier (e.g., "10376192")
 * @returns Normalized forecast with 'short' horizon
 * 
 * Use case: Real-time operational decisions, immediate flood warnings
 * Update frequency: Hourly
 * Forecast length: 18 hours
 * Temporal resolution: 1 hour
 */
export async function getShortRangeForecast(reachId: ReachId): Promise<NormalizedFlowForecast> {
  try {
    console.log(`Fetching short-range forecast for reach ${reachId}`);
    
    // Fetch raw data from NOAA NWPS API
    const response = await fetchNoaaStreamflow(reachId, 'short_range');
    
    // Extract time series data (short range uses .series.data structure)
    const timeSeries = response.shortRange?.series;
    
    if (!timeSeries?.data || timeSeries.data.length === 0) {
      throw new ApiError(
        `No short-range data available for reach ${reachId}`,
        404,
        'noaa-short-range'
      );
    }

    console.log(`Found ${timeSeries.data.length} short-range data points`);

    // Convert NOAA format to our normalized format
    const normalizedData = {
      points: timeSeries.data.map(point => ({
        time: point.validTime,
        flow_cms: point.flow / 35.314666721 // Convert CFS to CMS for normalizer
      }))
    };

    // Build normalized forecast using existing utility
    return buildNormalizedForecast(reachId, [
      {
        horizon: 'short' as Horizon,
        label: 'mean',
        raw: normalizedData
      }
    ]);

  } catch (error) {
    if (error instanceof ApiError) throw error;
    
    throw new ApiError(
      `Failed to fetch short-range forecast for reach ${reachId}`,
      500,
      'noaa-short-range',
      undefined,
      error
    );
  }
}

/**
 * Fetch medium-range streamflow forecast (~10-day)
 * 
 * @param reachId - NOAA reach identifier
 * @returns Normalized forecast with 'medium' horizon
 * 
 * Use case: Weekly planning, reservoir operations, medium-term flood risk
 * Update frequency: Every 6 hours  
 * Forecast length: ~10 days
 * Temporal resolution: 6 hours
 */
export async function getMediumRangeForecast(reachId: ReachId): Promise<NormalizedFlowForecast> {
  try {
    console.log(`Fetching medium-range forecast for reach ${reachId}`);
    
    // Fetch raw data from NOAA NWPS API
    const response = await fetchNoaaStreamflow(reachId, 'medium_range');
    
    // Extract time series data (medium range uses .mean.data structure)
    const timeSeries = response.mediumRange?.mean;
    
    if (!timeSeries?.data || timeSeries.data.length === 0) {
      throw new ApiError(
        `No medium-range data available for reach ${reachId}`,
        404,
        'noaa-medium-range'
      );
    }

    console.log(`Found ${timeSeries.data.length} medium-range data points`);

    // Convert NOAA format to our normalized format
    const normalizedData = {
      points: timeSeries.data.map(point => ({
        time: point.validTime,
        flow_cms: point.flow / 35.314666721 // Convert CFS to CMS for normalizer
      }))
    };

    // Build normalized forecast using existing utility
    return buildNormalizedForecast(reachId, [
      {
        horizon: 'medium' as Horizon,
        label: 'mean',
        raw: normalizedData
      }
    ]);

  } catch (error) {
    if (error instanceof ApiError) throw error;
    
    throw new ApiError(
      `Failed to fetch medium-range forecast for reach ${reachId}`,
      500,
      'noaa-medium-range',
      undefined,
      error
    );
  }
}

/**
 * Fetch long-range streamflow forecast (~30-day)
 * 
 * @param reachId - NOAA reach identifier
 * @returns Normalized forecast with 'long' horizon
 * 
 * Use case: Seasonal planning, long-term water management, drought monitoring
 * Update frequency: Daily
 * Forecast length: ~30 days  
 * Temporal resolution: Daily
 */
export async function getLongRangeForecast(reachId: ReachId): Promise<NormalizedFlowForecast> {
  try {
    console.log(`Fetching long-range forecast for reach ${reachId}`);
    
    // Fetch raw data from NOAA NWPS API
    const response = await fetchNoaaStreamflow(reachId, 'long_range');
    
    // Extract time series data (long range uses .mean.data structure)
    const timeSeries = response.longRange?.mean;
    
    if (!timeSeries?.data || timeSeries.data.length === 0) {
      throw new ApiError(
        `No long-range data available for reach ${reachId}`,
        404,
        'noaa-long-range'
      );
    }

    console.log(`Found ${timeSeries.data.length} long-range data points`);

    // Convert NOAA format to our normalized format
    const normalizedData = {
      points: timeSeries.data.map(point => ({
        time: point.validTime,
        flow_cms: point.flow / 35.314666721 // Convert CFS to CMS for normalizer
      }))
    };

    // Build normalized forecast using existing utility
    return buildNormalizedForecast(reachId, [
      {
        horizon: 'long' as Horizon,
        label: 'mean',
        raw: normalizedData
      }
    ]);

  } catch (error) {
    if (error instanceof ApiError) throw error;
    
    throw new ApiError(
      `Failed to fetch long-range forecast for reach ${reachId}`,
      500,
      'noaa-long-range',
      undefined,
      error
    );
  }
}

/**
 * Fetch all available forecast ranges for a reach
 * 
 * @param reachId - NOAA reach identifier
 * @returns Combined normalized forecast with all available horizons
 * 
 * This function attempts to fetch short, medium, and long-range forecasts
 * in parallel. If any individual range fails, it continues with the others.
 * At least one range must succeed for the function to return data.
 * 
 * Use case: Comprehensive hydrograph display showing multiple time horizons
 */
export async function getAllRangeForecasts(reachId: ReachId): Promise<NormalizedFlowForecast> {
  try {
    console.log(`Fetching all forecast ranges for reach ${reachId}`);
    
    // Fetch all ranges in parallel for better performance
    const [shortResult, mediumResult, longResult] = await Promise.allSettled([
      getShortRangeForecast(reachId),
      getMediumRangeForecast(reachId),
      getLongRangeForecast(reachId)
    ]);

    // Collect all successful forecast series
    const allSeries = [];
    
    // Process short-range result
    if (shortResult.status === 'fulfilled') {
      console.log('✓ Short-range forecast successful');
      allSeries.push(...shortResult.value.series);
    } else {
      console.warn('✗ Short-range forecast failed:', shortResult.reason?.message);
    }
    
    // Process medium-range result  
    if (mediumResult.status === 'fulfilled') {
      console.log('✓ Medium-range forecast successful');
      allSeries.push(...mediumResult.value.series);
    } else {
      console.warn('✗ Medium-range forecast failed:', mediumResult.reason?.message);
    }
    
    // Process long-range result
    if (longResult.status === 'fulfilled') {
      console.log('✓ Long-range forecast successful');
      allSeries.push(...longResult.value.series);
    } else {
      console.warn('✗ Long-range forecast failed:', longResult.reason?.message);
    }

    // Ensure we got at least one successful forecast
    if (allSeries.length === 0) {
      throw new ApiError(
        `No forecast data available for any range for reach ${reachId}`,
        404,
        'noaa-all-ranges'
      );
    }

    console.log(`Successfully combined ${allSeries.length} forecast series`);

    // Return combined forecast with all available series
    return {
      reachId,
      series: allSeries
    };

  } catch (error) {
    if (error instanceof ApiError) throw error;
    
    throw new ApiError(
      `Failed to fetch all-range forecasts for reach ${reachId}`,
      500,
      'noaa-all-ranges',
      undefined,
      error
    );
  }
}

// ========================================
// Helper Functions
// ========================================

/**
 * Low-level function to fetch streamflow data from NOAA NWPS API
 * 
 * @param reachId - NOAA reach identifier
 * @param series - Forecast series type
 * @returns Raw NOAA API response
 * 
 * This function handles the HTTP request and basic error handling.
 * Series-specific data extraction is handled by the calling functions.
 */
async function fetchNoaaStreamflow(
  reachId: ReachId,
  series: StreamflowSeriesName
): Promise<NoaaStreamflowResponse> {
  const url = `${publicConfig.api.noaaBaseUrl}/reaches/${reachId}/streamflow?series=${series}`;
  
  try {
    console.log(`Making request to: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'HydroDash/1.0'
      },
      // 30 second timeout for external API
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new ApiError(
          `Reach ${reachId} not found or no ${series} data available`,
          404,
          url
        );
      }
      
      throw new ApiError(
        `NOAA API returned ${response.status}: ${response.statusText}`,
        response.status,
        url,
        await response.text().catch(() => 'No response body')
      );
    }

    const data: NoaaStreamflowResponse = await response.json();
    
    // Validate basic response structure
    if (!data.reach?.reachId) {
      throw new ApiError(
        'Invalid response format from NOAA API - missing reach data',
        500,
        url,
        JSON.stringify(data)
      );
    }

    console.log(`✓ Successfully fetched ${series} data for ${data.reach.name || reachId}`);
    return data;
    
  } catch (error) {
    if (error instanceof ApiError) throw error;
    
    throw new ApiError(
      `Network error fetching NOAA ${series} data`,
      500,
      url,
      undefined,
      error
    );
  }
}

/**
 * Get basic reach metadata from NOAA (uses short-range endpoint)
 * 
 * @param reachId - NOAA reach identifier
 * @returns River reach metadata or null if not found
 * 
 * This function uses the short-range endpoint to get reach metadata
 * since it's the most commonly available series type.
 */
export async function getReachMetadata(reachId: ReachId): Promise<RiverReach | null> {
  try {
    console.log(`Fetching metadata for reach ${reachId}`);
    
    // Use short-range endpoint to get reach metadata (most reliable)
    const response = await fetchNoaaStreamflow(reachId, 'short_range');
    
    if (!response.reach) {
      return null;
    }

    // Convert to our RiverReach type
    const reach: RiverReach = {
      reachId: response.reach.reachId as ReachId,
      name: response.reach.name,
      latitude: response.reach.latitude,
      longitude: response.reach.longitude,
      streamflow: response.reach.streamflow || [],
      route: response.reach.route ? {
        upstream: response.reach.route.upstream.map(r => ({
          reachId: r.reachId as ReachId,
          streamOrder: r.streamOrder
        })),
        downstream: response.reach.route.downstream.map(r => ({
          reachId: r.reachId as ReachId,
          streamOrder: r.streamOrder
        }))
      } : undefined
    };

    console.log(`✓ Found reach: ${reach.name} at (${reach.latitude}, ${reach.longitude})`);
    return reach;
    
  } catch (error) {
    console.warn(`Failed to fetch reach metadata for ${reachId}:`, error);
    return null;
  }
}