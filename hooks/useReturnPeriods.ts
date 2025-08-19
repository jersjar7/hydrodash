// hooks/useReturnPeriods.ts
/**
 * Simple React hook for fetching return period data
 * 
 * Fetches return period thresholds for multiple river reaches.
 * All returned values are in CFS for consistency with the app.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchReturnPeriods } from '@/services/returnPeriodsService';
import type { ReachId, ReturnPeriodThresholds } from '@/types';

interface UseReturnPeriodsOptions {
  enabled?: boolean;
}

interface UseReturnPeriodsResult {
  /** Return period data keyed by reachId (values in CFS) */
  data: Record<string, ReturnPeriodThresholds>;
  /** Loading state */
  loading: boolean;
  /** Error message if requests failed */
  error: string | null;
  /** Whether any data has been loaded */
  hasData: boolean;
  /** Get return periods for a specific reach */
  getReturnPeriods: (reachId: ReachId) => ReturnPeriodThresholds | null;
  /** Manual refetch function */
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch return period thresholds for multiple river reaches
 * 
 * @param reachIds - Array of reach identifiers to fetch return periods for
 * @param options - Configuration options
 * @returns Object with data, loading state, error state, and utility functions
 */
export function useReturnPeriods(
  reachIds: (ReachId | null | undefined)[],
  options: UseReturnPeriodsOptions = {}
): UseReturnPeriodsResult {
  const { enabled = true } = options;

  const [data, setData] = useState<Record<string, ReturnPeriodThresholds>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);

  const mountedRef = useRef(true);

  // Filter valid reach IDs
  const validReachIds = reachIds.filter((id): id is ReachId => id != null);
  const reachIdsKey = validReachIds.map(id => String(id)).sort().join(',');

  // Debug effect to track data changes
  useEffect(() => {
    console.log(`[useReturnPeriods] Data state changed:`, data);
    console.log(`[useReturnPeriods] Data keys:`, Object.keys(data));
    console.log(`[useReturnPeriods] Loading state:`, loading);
    console.log(`[useReturnPeriods] HasData:`, hasData);
  }, [data, loading, hasData]);

  /**
   * Fetch return periods for all reach IDs
   */
  const fetchData = useCallback(async (): Promise<void> => {
    if (!enabled || validReachIds.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`[useReturnPeriods] Starting fetch for ${validReachIds.length} reaches:`, validReachIds);

      // Make requests for all reaches in parallel
      const results = await Promise.all(
        validReachIds.map(async (reachId) => {
          try {
            const thresholds = await fetchReturnPeriods(reachId);
            console.log(`[useReturnPeriods] Individual result for ${reachId}:`, thresholds);
            return { reachId, thresholds, success: true };
          } catch (error) {
            console.error(`[useReturnPeriods] Error for reach ${reachId}:`, error);
            return { reachId, thresholds: null, success: false, error };
          }
        })
      );

      if (!mountedRef.current) return;

      // Process results into data object
      const newData: Record<string, ReturnPeriodThresholds> = {};
      let successCount = 0;
      let errorCount = 0;

      for (const { reachId, thresholds, success } of results) {
        if (success && thresholds) {
          const key = String(reachId);
          newData[key] = thresholds;
          successCount++;
          console.log(`[useReturnPeriods] Added to newData[${key}]:`, thresholds);
        } else {
          errorCount++;
        }
      }

      console.log(`[useReturnPeriods] About to set data:`, newData);
      console.log(`[useReturnPeriods] Data keys:`, Object.keys(newData));
      console.log(`[useReturnPeriods] Success: ${successCount}, Errors: ${errorCount}`);

      // Update state
      setData(newData);
      setHasData(successCount > 0);
      setLoading(false);

      // Set error message if some/all failed
      if (errorCount > 0) {
        if (successCount === 0) {
          setError('Unable to load flood threshold data. Using estimated levels.');
        } else {
          setError(`Loaded ${successCount}/${validReachIds.length} flood thresholds. Using estimated levels for others.`);
        }
      } else {
        setError(null);
      }

      console.log(`[useReturnPeriods] State updated - loading: false, hasData: ${successCount > 0}`);

    } catch (err) {
      if (!mountedRef.current) return;
      
      console.error('[useReturnPeriods] Fetch error:', err);
      setError('Failed to load flood threshold data. Using estimated levels.');
      setData({});
      setHasData(false);
      setLoading(false);
    }
  }, [enabled, reachIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Get return periods for a specific reach
   */
  const getReturnPeriods = useCallback((reachId: ReachId): ReturnPeriodThresholds | null => {
    const key = String(reachId);
    const result = data[key] || null;
    console.log(`[useReturnPeriods] getReturnPeriods(${reachId}):`, result);
    console.log(`[useReturnPeriods] Current data keys:`, Object.keys(data));
    console.log(`[useReturnPeriods] Looking for key:`, key);
    console.log(`[useReturnPeriods] Current loading state:`, loading);
    return result;
  }, [data, loading]);

  /**
   * Manual refetch function
   */
  const refetch = useCallback(async (): Promise<void> => {
    await fetchData();
  }, [fetchData]);

  // Fetch data when reach IDs change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    hasData,
    getReturnPeriods,
    refetch,
  };
}

/**
 * Simplified hook for a single reach ID
 */
export function useReturnPeriod(
  reachId: ReachId | null | undefined,
  options: UseReturnPeriodsOptions = {}
) {
  const { data, loading, error, refetch } = useReturnPeriods(
    reachId ? [reachId] : [],
    options
  );

  const thresholds = reachId ? data[String(reachId)] || null : null;

  return {
    thresholds,
    loading,
    error,
    hasData: !!thresholds,
    refetch,
  };
}

export default useReturnPeriods;