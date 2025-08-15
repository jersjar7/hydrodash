// hooks/useReachMetadata.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import type { 
  ReachId, 
  RiverReach, 
  ApiResponse 
} from '@/types';

// API response wrapper
type ReachApiResponse = ApiResponse<RiverReach>;

// Hook options
interface UseReachMetadataOptions {
  /** Enable/disable the query */
  enabled?: boolean;
  /** Stale time in milliseconds */
  staleTime?: number;
  /** Garbage collection time in milliseconds */
  gcTime?: number;
}

// ========================================
// Primary Hook: useReachMetadata
// ========================================

/**
 * React hook to fetch river reach metadata
 * 
 * @param reachId - NOAA reach identifier
 * @param options - Query configuration options
 * @returns Query result with reach data, loading, error states
 * 
 * @example
 * ```tsx
 * const { data: reach, isLoading, error } = useReachMetadata('10376192');
 * 
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage error={error.message} />;
 * if (reach) return <ReachInfo name={reach.name} lat={reach.latitude} lng={reach.longitude} />;
 * ```
 */
export function useReachMetadata(
  reachId: ReachId | null,
  options: UseReachMetadataOptions = {}
) {
  const {
    enabled = true,
    staleTime = 60 * 60 * 1000, // 1 hour default (metadata doesn't change often)
    gcTime = 24 * 60 * 60 * 1000, // 24 hours default
  } = options;

  return useQuery({
    queryKey: ['reachMetadata', reachId],
    queryFn: async (): Promise<RiverReach> => {
      if (!reachId) {
        throw new Error('Reach ID is required');
      }

      const url = `/api/reaches/${reachId}`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ReachApiResponse = await response.json();

      if (!result.ok) {
        throw new Error(result.error || 'Failed to fetch reach metadata');
      }

      if (!result.data) {
        throw new Error('No reach data returned from API');
      }

      return result.data;
    },
    enabled: enabled && !!reachId,
    staleTime,
    gcTime,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 404 (reach not found) or 400 (bad request)
      if (error.message.includes('404') || error.message.includes('400')) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

// ========================================
// Utility Functions
// ========================================

/**
 * Extract display name from reach data
 * Falls back to reach ID if no name available
 */
export function getReachDisplayName(reach: RiverReach | undefined): string {
  if (!reach) return 'Unknown Reach';
  return reach.name || `Reach ${reach.reachId}`;
}

/**
 * Get coordinates as a tuple for map operations
 */
export function getReachCoordinates(reach: RiverReach | undefined): [number, number] | null {
  if (!reach) return null;
  return [reach.longitude, reach.latitude]; // [lng, lat] for mapping libraries
}

/**
 * Check if reach has specific streamflow series available
 */
export function hasStreamflowSeries(
  reach: RiverReach | undefined, 
  series: 'short_range' | 'medium_range' | 'long_range'
): boolean {
  if (!reach?.streamflow) return false;
  return reach.streamflow.includes(series);
}

/**
 * Get available forecast ranges for a reach
 */
export function getAvailableRanges(reach: RiverReach | undefined): string[] {
  if (!reach?.streamflow) return [];
  
  const rangeMap = {
    'short_range': 'Short (18h)',
    'medium_range': 'Medium (10d)',
    'long_range': 'Long (30d)',
  };
  
  return reach.streamflow
    .filter(series => series in rangeMap)
    .map(series => rangeMap[series as keyof typeof rangeMap]);
}