// services/returnPeriodsService.ts
/**
 * Simple Return Periods Service for HydroDash
 * 
 * Fetches return period data via Next.js API proxy to avoid CORS issues.
 * External API returns values in CMS, converts to CFS for app consistency.
 */

import { config } from '@/config/secrets.local';
import { normalizeReturnPeriods } from '@/lib/utils/normalizers';
import type { 
  ReturnPeriodResponse,
  ReturnPeriodThresholds,
  ReachId 
} from '@/types';

// Simple cache to avoid duplicate requests
const cache = new Map<string, { data: ReturnPeriodThresholds; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetches return period thresholds for a single stream via API proxy
 * @param reachId - The reach identifier
 * @returns Promise resolving to return period thresholds in CFS, or null if not found
 */
export async function fetchReturnPeriods(reachId: ReachId): Promise<ReturnPeriodThresholds | null> {
  const cacheKey = String(reachId);
  
  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    console.log(`[ReturnPeriodsService] Using cached data for reach ${reachId}`);
    return cached.data;
  }

  try {
    // Use Next.js API proxy instead of direct external API call
    const apiUrl = `/api/return-periods/${reachId}`;
    
    console.log(`[ReturnPeriodsService] Fetching return periods for reach ${reachId} via proxy`);
    console.log(`[ReturnPeriodsService] API URL: ${apiUrl}`);

    // Make API request to our proxy
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    console.log(`[ReturnPeriodsService] Proxy response status: ${response.status}`);

    if (!response.ok) {
      console.error(`[ReturnPeriodsService] Proxy API error for reach ${reachId}:`, response.status, response.statusText);
      
      // Try to get error details
      try {
        const errorData = await response.json();
        console.error(`[ReturnPeriodsService] Error response:`, errorData);
      } catch (e) {
        console.error(`[ReturnPeriodsService] Could not parse error response`);
      }
      
      return null;
    }

    const rawData: ReturnPeriodResponse = await response.json();
    
    console.log(`[ReturnPeriodsService] Raw response for reach ${reachId}:`, rawData);
    
    if (!Array.isArray(rawData) || rawData.length === 0) {
      console.warn(`[ReturnPeriodsService] No data returned for reach ${reachId}`);
      return null;
    }

    // Normalize data (converts CMS → CFS)
    const normalized = normalizeReturnPeriods(rawData);
    
    if (normalized.length === 0) {
      console.warn(`[ReturnPeriodsService] Failed to normalize data for reach ${reachId}`);
      console.warn(`[ReturnPeriodsService] Raw data was:`, rawData);
      return null;
    }

    const thresholds = normalized[0].thresholds;

    // Cache the result
    cache.set(cacheKey, { data: thresholds, timestamp: Date.now() });

    console.log(`[ReturnPeriodsService] Successfully fetched return periods for reach ${reachId}:`, thresholds);
    return thresholds;

  } catch (error) {
    console.error(`[ReturnPeriodsService] Failed to fetch return periods for reach ${reachId}:`, error);
    
    // More specific error handling
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error(`[ReturnPeriodsService] Network error - check if the Next.js API route is working`);
    }
    
    return null;
  }
}

/**
 * Clears the cache (useful for testing)
 */
export function clearCache(): void {
  cache.clear();
}