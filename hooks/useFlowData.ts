// hooks/useFlowData.ts
'use client';

import { useQuery, useQueries, UseQueryResult } from '@tanstack/react-query';
import type { 
  ReachId, 
  NormalizedFlowForecast, 
  ApiResponse 
} from '@/types';

// Forecast range types matching your API
export type ForecastRange = 'short' | 'medium' | 'long' | 'all';

// API response wrapper
type FlowApiResponse = ApiResponse<NormalizedFlowForecast>;

// Hook options
interface UseFlowDataOptions {
  /** Enable/disable the query */
  enabled?: boolean;
  /** Refetch interval in milliseconds */
  refetchInterval?: number;
  /** Stale time in milliseconds */
  staleTime?: number;
  /** Garbage collection time in milliseconds */
  gcTime?: number;
}

// ========================================
// Primary Hook: useFlowData
// ========================================

/**
 * React hook to fetch flow forecast data for a specific reach
 * 
 * @param reachId - NOAA reach identifier
 * @param range - Forecast range to fetch
 * @param options - Query configuration options
 * @returns Query result with data, loading, error states
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = useFlowData('10376192', 'medium');
 * 
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage error={error.message} />;
 * if (data) return <HydrographChart forecast={data} />;
 * ```
 */
export function useFlowData(
  reachId: ReachId | null,
  range: ForecastRange = 'short',
  options: UseFlowDataOptions = {}
) {
  const {
    enabled = true,
    refetchInterval,
    staleTime = 5 * 60 * 1000, // 5 minutes default
    gcTime = 10 * 60 * 1000, // 10 minutes default
  } = options;

  return useQuery({
    queryKey: ['flowData', reachId, range],
    queryFn: async (): Promise<NormalizedFlowForecast> => {
      if (!reachId) {
        throw new Error('Reach ID is required');
      }

      const url = `/api/flow/${reachId}?range=${range}`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: FlowApiResponse = await response.json();

      if (!result.ok) {
        throw new Error(result.error || 'Failed to fetch flow data');
      }

      if (!result.data) {
        throw new Error('No flow data returned from API');
      }

      return result.data;
    },
    enabled: enabled && !!reachId,
    staleTime,
    gcTime,
    refetchInterval,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 404 (reach not found) or 400 (bad request)
      if (error.message.includes('404') || error.message.includes('400')) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// ========================================
// Simplified Hooks for Common Use Cases
// ========================================

/**
 * Hook for short-range forecast (18-hour, hourly)
 * Optimized for real-time monitoring
 */
export function useShortRangeForecast(
  reachId: ReachId | null,
  options: UseFlowDataOptions = {}
) {
  return useFlowData(reachId, 'short', {
    staleTime: 2 * 60 * 1000, // 2 minutes (more frequent updates)
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    ...options,
  });
}

/**
 * Hook for medium-range forecast (~10-day)
 * Optimized for weekly planning
 */
export function useMediumRangeForecast(
  reachId: ReachId | null,
  options: UseFlowDataOptions = {}
) {
  return useFlowData(reachId, 'medium', {
    staleTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: 30 * 60 * 1000, // Refetch every 30 minutes
    ...options,
  });
}

/**
 * Hook for long-range forecast (~30-day)
 * Optimized for seasonal planning
 */
export function useLongRangeForecast(
  reachId: ReachId | null,
  options: UseFlowDataOptions = {}
) {
  return useFlowData(reachId, 'long', {
    staleTime: 60 * 60 * 1000, // 1 hour
    refetchInterval: 4 * 60 * 60 * 1000, // Refetch every 4 hours
    ...options,
  });
}

// ========================================
// Multi-Range Hook: useAllFlowRanges
// ========================================

/**
 * Hook to fetch multiple forecast ranges for a single reach
 * Useful for comprehensive dashboard views
 * 
 * @param reachId - NOAA reach identifier
 * @param ranges - Array of ranges to fetch
 * @param options - Query configuration options
 * @returns Array of query results for each range
 * 
 * @example
 * ```tsx
 * const results = useAllFlowRanges('10376192', ['short', 'medium', 'long']);
 * const [shortResult, mediumResult, longResult] = results;
 * 
 * const allLoading = results.some(r => r.isLoading);
 * const anyError = results.find(r => r.error);
 * ```
 */
export function useAllFlowRanges(
  reachId: ReachId | null,
  ranges: ForecastRange[] = ['short', 'medium', 'long'],
  options: UseFlowDataOptions = {}
) {
  return useQueries({
    queries: ranges.map(range => ({
      queryKey: ['flowData', reachId, range],
      queryFn: async (): Promise<NormalizedFlowForecast> => {
        if (!reachId) {
          throw new Error('Reach ID is required');
        }

        const url = `/api/flow/${reachId}?range=${range}`;
        
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result: FlowApiResponse = await response.json();

        if (!result.ok) {
          throw new Error(result.error || 'Failed to fetch flow data');
        }

        if (!result.data) {
          throw new Error('No flow data returned from API');
        }

        return result.data;
      },
      enabled: options.enabled !== false && !!reachId,
      staleTime: options.staleTime || 5 * 60 * 1000,
      gcTime: options.gcTime || 10 * 60 * 1000,
      refetchInterval: options.refetchInterval,
      retry: (failureCount: number, error: Error) => {
        if (error.message.includes('404') || error.message.includes('400')) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    })),
  });
}

// ========================================
// Multi-Reach Hook: useMultipleReaches
// ========================================

/**
 * Hook to fetch flow data for multiple reaches
 * Useful for saved places list or comparison views
 * 
 * @param reachIds - Array of reach IDs to fetch
 * @param range - Forecast range for all reaches
 * @param options - Query configuration options
 * @returns Array of query results for each reach
 * 
 * @example
 * ```tsx
 * const savedReachIds = ['10376192', '10376193', '10376194'];
 * const results = useMultipleReaches(savedReachIds, 'short');
 * 
 * return (
 *   <div>
 *     {results.map((result, index) => (
 *       <ReachCard 
 *         key={savedReachIds[index]}
 *         data={result.data}
 *         loading={result.isLoading}
 *         error={result.error}
 *       />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useMultipleReaches(
  reachIds: (ReachId | null)[],
  range: ForecastRange = 'short',
  options: UseFlowDataOptions = {}
) {
  return useQueries({
    queries: reachIds.map(reachId => ({
      queryKey: ['flowData', reachId, range],
      queryFn: async (): Promise<NormalizedFlowForecast> => {
        if (!reachId) {
          throw new Error('Reach ID is required');
        }

        const url = `/api/flow/${reachId}?range=${range}`;
        
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result: FlowApiResponse = await response.json();

        if (!result.ok) {
          throw new Error(result.error || 'Failed to fetch flow data');
        }

        if (!result.data) {
          throw new Error('No flow data returned from API');
        }

        return result.data;
      },
      enabled: options.enabled !== false && !!reachId,
      staleTime: options.staleTime || 5 * 60 * 1000,
      gcTime: options.gcTime || 10 * 60 * 1000,
      refetchInterval: options.refetchInterval,
      retry: (failureCount: number, error: Error) => {
        if (error.message.includes('404') || error.message.includes('400')) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    })),
  });
}

// ========================================
// Re-export Flow Utility Functions
// ========================================

// Re-export flow utilities so components can import them from one place
export { 
  getCurrentFlow, 
  getPeakFlow, 
  getLatestFlow,
  getFlowStats,
  getCurrentFlowInterpolated,
  isWithinForecastPeriod 
} from '@/lib/utils/flow';

// ========================================
// Utility Functions for Multi-Query Results
// ========================================

/**
 * Check if any query in a multi-query result is loading
 */
export function isAnyLoading(results: UseQueryResult[]): boolean {
  return results.some(result => result.isLoading);
}

/**
 * Check if all queries in a multi-query result are successful
 */
export function areAllSuccessful(results: UseQueryResult[]): boolean {
  return results.every(result => result.isSuccess);
}

/**
 * Get first error from a multi-query result
 */
export function getFirstError(results: UseQueryResult[]): Error | null {
  const errorResult = results.find(result => result.error);
  return errorResult?.error as Error || null;
}