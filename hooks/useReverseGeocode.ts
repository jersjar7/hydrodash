// hooks/useReverseGeocode.ts
/**
 * React hook for reverse geocoding coordinates to location names
 * Uses Mapbox geocoding service with caching for stream locations
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { reverseGeocode } from '@/services/mapboxGeocodingService';
import {
  Coordinates,
  NormalizedLocation,
  GeocodingOptions,
  GeocodingResult,
  isValidCoordinates
} from '@/types/models/Location';

interface UseReverseGeocodeOptions extends GeocodingOptions {
  /** Whether to trigger geocoding immediately */
  enabled?: boolean;
  /** Whether to skip geocoding if coordinates haven't changed */
  skipDuplicates?: boolean;
}

interface UseReverseGeocodeResult {
  /** Normalized location data */
  location: NormalizedLocation | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Whether result came from cache */
  fromCache: boolean;
  /** Response time in milliseconds */
  responseTime?: number;
  /** Manual trigger function */
  geocode: (coords: Coordinates) => Promise<void>;
  /** Reset state */
  reset: () => void;
}

/**
 * Hook for reverse geocoding coordinates to location names
 * 
 * @param coordinates - Lat/lon coordinates to geocode
 * @param options - Geocoding options
 * @returns Geocoding result and control functions
 * 
 * @example
 * ```tsx
 * const { location, isLoading, error } = useReverseGeocode(
 *   { latitude: 40.2581, longitude: -111.6445 },
 *   { enabled: true }
 * );
 * 
 * if (isLoading) return <span>Loading location...</span>;
 * if (error) return <span>Location unavailable</span>;
 * if (location) return <span>{location.display}</span>;
 * ```
 */
export function useReverseGeocode(
  coordinates: Coordinates | null,
  options: UseReverseGeocodeOptions = {}
): UseReverseGeocodeResult {
  const {
    enabled = true,
    skipDuplicates = true,
    cacheTtl,
    useCache = true,
    language,
    limit
  } = options;

  // State
  const [location, setLocation] = useState<NormalizedLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [responseTime, setResponseTime] = useState<number | undefined>();

  // Refs for tracking and cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastCoordsRef = useRef<string | null>(null);

  // Generate stable coordinate key for duplicate detection
  const getCoordsKey = useCallback((coords: Coordinates | null): string | null => {
    if (!coords || !isValidCoordinates(coords)) return null;
    return `${coords.latitude.toFixed(4)},${coords.longitude.toFixed(4)}`;
  }, []);

  // Manual geocoding function
  const geocode = useCallback(async (coords: Coordinates): Promise<void> => {
    if (!isValidCoordinates(coords)) {
      setError('Invalid coordinates provided');
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setIsLoading(true);
      setError(null);

      const result: GeocodingResult = await reverseGeocode(coords, {
        cacheTtl,
        useCache,
        language,
        limit
      });

      // Check if request was aborted
      if (abortController.signal.aborted) return;

      if (result.success && result.location) {
        setLocation(result.location);
        setFromCache(result.fromCache);
        setResponseTime(result.responseTime);
        setError(null);
      } else {
        setLocation(null);
        setFromCache(false);
        setError(result.error || 'Failed to geocode location');
      }
    } catch (err) {
      if (abortController.signal.aborted) return;
      
      console.error('[useReverseGeocode] Error:', err);
      setLocation(null);
      setFromCache(false);
      setError(err instanceof Error ? err.message : 'Geocoding failed');
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [cacheTtl, useCache, language, limit]);

  // Reset function
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLocation(null);
    setIsLoading(false);
    setError(null);
    setFromCache(false);
    setResponseTime(undefined);
    lastCoordsRef.current = null;
  }, []);

  // Auto-geocode when coordinates change
  useEffect(() => {
    if (!enabled || !coordinates) {
      return;
    }

    const coordsKey = getCoordsKey(coordinates);
    if (!coordsKey) {
      setError('Invalid coordinates');
      return;
    }

    // Skip if coordinates haven't changed
    if (skipDuplicates && lastCoordsRef.current === coordsKey) {
      return;
    }

    lastCoordsRef.current = coordsKey;
    geocode(coordinates);
  }, [coordinates, enabled, skipDuplicates, getCoordsKey, geocode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    location,
    isLoading,
    error,
    fromCache,
    responseTime,
    geocode,
    reset
  };
}

/**
 * Hook for multiple coordinate geocoding
 */
export function useBatchReverseGeocode(
  coordinatesList: Coordinates[],
  options: UseReverseGeocodeOptions = {}
): {
  locations: (NormalizedLocation | null)[];
  isLoading: boolean;
  errors: (string | null)[];
  geocodeAll: () => Promise<void>;
} {
  const { enabled = true } = options;
  
  const [locations, setLocations] = useState<(NormalizedLocation | null)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<(string | null)[]>([]);

  const geocodeAll = useCallback(async () => {
    if (coordinatesList.length === 0) return;

    setIsLoading(true);
    setErrors([]);

    try {
      const results = await Promise.allSettled(
        coordinatesList.map(coords => reverseGeocode(coords, options))
      );

      const newLocations: (NormalizedLocation | null)[] = [];
      const newErrors: (string | null)[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          newLocations[index] = result.value.location;
          newErrors[index] = null;
        } else {
          newLocations[index] = null;
          newErrors[index] = result.status === 'fulfilled' 
            ? result.value.error || 'Unknown error'
            : 'Request failed';
        }
      });

      setLocations(newLocations);
      setErrors(newErrors);
    } catch (err) {
      console.error('[useBatchReverseGeocode] Error:', err);
      setLocations(coordinatesList.map(() => null));
      setErrors(coordinatesList.map(() => 'Batch geocoding failed'));
    } finally {
      setIsLoading(false);
    }
  }, [coordinatesList, options]);

  useEffect(() => {
    if (enabled && coordinatesList.length > 0) {
      geocodeAll();
    }
  }, [enabled, coordinatesList, geocodeAll]);

  return {
    locations,
    isLoading,
    errors,
    geocodeAll
  };
}

export default useReverseGeocode;