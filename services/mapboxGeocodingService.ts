// services/mapboxGeocodingService.ts
/**
 * Mapbox Geocoding Service for HydroDash
 * 
 * Provides reverse geocoding functionality with caching for stream locations.
 * Supports global location formatting for worldwide stream monitoring.
 */

import { appConfig } from '@/config';
import {
  Coordinates,
  CacheKey,
  NormalizedLocation,
  GeocodingResult,
  GeocodingCacheEntry,
  GeocodingOptions,
  MapboxGeocodingResponse,
  MapboxFeature,
  MapboxContext,
  LocationComponents,
  GeocodingError,
  isValidCoordinates,
  isMapboxGeocodingResponse
} from '@/types/models/Location';

// Cache implementation
const cache = new Map<string, GeocodingCacheEntry>();
const DEFAULT_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 1000;

/**
 * Generate cache key from coordinates (rounded to 4 decimal places)
 */
function generateCacheKey(coordinates: Coordinates): CacheKey {
  const lat = coordinates.latitude.toFixed(4);
  const lon = coordinates.longitude.toFixed(4);
  return { lat, lon };
}

/**
 * Convert cache key to string for Map storage
 */
function cacheKeyToString(cacheKey: CacheKey): string {
  return `${cacheKey.lat},${cacheKey.lon}`;
}

/**
 * Extract location components from Mapbox context
 */
function extractLocationComponents(feature: MapboxFeature): LocationComponents {
  const components: LocationComponents = {
    fullAddress: feature.place_name,
  };

  // Extract components from context
  if (feature.context) {
    for (const ctx of feature.context) {
      if (ctx.id.includes('place')) {
        components.city = ctx.text;
      } else if (ctx.id.includes('region')) {
        components.state = ctx.text;
      } else if (ctx.id.includes('country')) {
        components.country = ctx.text;
        components.countryCode = ctx.short_code?.toUpperCase();
      }
    }
  }

  // Handle cases where the feature itself represents a place
  if (feature.place_type.includes('place') && !components.city) {
    components.city = feature.text;
  }

  return components;
}

/**
 * Format location for global display
 */
function formatLocationDisplay(components: LocationComponents): { display: string; short: string } {
  const { city, state, country } = components;

  // Priority: City, State, Country > City, Country > State, Country > Country only
  if (city && state && country) {
    return {
      display: `${city}, ${state}, ${country}`,
      short: `${city}, ${country}`
    };
  }

  if (city && country) {
    return {
      display: `${city}, ${country}`,
      short: `${city}, ${country}`
    };
  }

  if (state && country) {
    return {
      display: `${state}, ${country}`,
      short: `${state}, ${country}`
    };
  }

  if (country) {
    return {
      display: country,
      short: country
    };
  }

  if (city) {
    return {
      display: city,
      short: city
    };
  }

  return {
    display: 'Unknown Location',
    short: 'Unknown'
  };
}

/**
 * Normalize Mapbox response to our location format
 */
function normalizeMapboxResponse(
  response: MapboxGeocodingResponse,
  coordinates: Coordinates,
  cacheKey: CacheKey
): NormalizedLocation {
  if (!response.features || response.features.length === 0) {
    throw new GeocodingError('No location found for coordinates', 'NO_RESULTS');
  }

  const feature = response.features[0]; // Use most relevant result
  const components = extractLocationComponents(feature);
  const { display, short } = formatLocationDisplay(components);

  return {
    display,
    short,
    components,
    coordinates,
    cacheKey,
    geocodedAt: new Date().toISOString()
  };
}

/**
 * Check if cache entry is still valid
 */
function isCacheEntryValid(entry: GeocodingCacheEntry): boolean {
  const now = Date.now();
  const cacheAge = now - new Date(entry.cachedAt).getTime();
  return cacheAge < entry.ttl;
}

/**
 * Clean expired cache entries
 */
function cleanExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (!isCacheEntryValid(entry)) {
      cache.delete(key);
    }
  }
}

/**
 * Manage cache size (LRU-style cleanup)
 */
function manageCacheSize(): void {
  if (cache.size > MAX_CACHE_SIZE) {
    const keysToDelete = Array.from(cache.keys()).slice(0, cache.size - MAX_CACHE_SIZE);
    keysToDelete.forEach(key => cache.delete(key));
  }
}

/**
 * Get location from cache
 */
function getFromCache(cacheKey: CacheKey): NormalizedLocation | null {
  const key = cacheKeyToString(cacheKey);
  const entry = cache.get(key);
  
  if (!entry || !isCacheEntryValid(entry)) {
    if (entry) cache.delete(key);
    return null;
  }

  return entry.location;
}

/**
 * Store location in cache
 */
function storeInCache(location: NormalizedLocation, ttl: number = DEFAULT_CACHE_TTL): void {
  const key = cacheKeyToString(location.cacheKey);
  const entry: GeocodingCacheEntry = {
    location,
    cachedAt: new Date().toISOString(),
    ttl
  };
  
  cache.set(key, entry);
  manageCacheSize();
}

/**
 * Reverse geocode coordinates using Mapbox API
 */
export async function reverseGeocode(
  coordinates: Coordinates,
  options: GeocodingOptions = {}
): Promise<GeocodingResult> {
  const startTime = Date.now();
  
  try {
    // Validate coordinates
    if (!isValidCoordinates(coordinates)) {
      throw new GeocodingError('Invalid coordinates provided', 'INVALID_COORDINATES');
    }

    const {
      cacheTtl = DEFAULT_CACHE_TTL,
      useCache = true,
      language = 'en',
      limit = 1
    } = options;

    // Generate cache key
    const cacheKey = generateCacheKey(coordinates);

    // Check cache first
    if (useCache) {
      const cached = getFromCache(cacheKey);
      if (cached) {
        return {
          success: true,
          location: cached,
          fromCache: true,
          responseTime: Date.now() - startTime
        };
      }
    }

    // Get Mapbox token
    const publicToken = appConfig.public.map.mapbox.publicToken;
    if (!publicToken) {
      throw new GeocodingError('Mapbox public token not configured', 'API_ERROR');
    }

    // Build API URL
    const { longitude, latitude } = coordinates;
    const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json`);
    url.searchParams.set('access_token', publicToken);
    url.searchParams.set('limit', limit.toString());
    url.searchParams.set('language', language);
    url.searchParams.set('types', 'place,region,country'); // Focus on administrative areas

    console.log(`[MapboxGeocoding] Reverse geocoding: ${latitude}, ${longitude}`);

    // Make API request
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new GeocodingError('Rate limit exceeded', 'RATE_LIMITED', response.status);
      }
      throw new GeocodingError(
        `Mapbox API error: ${response.status} ${response.statusText}`, 
        'API_ERROR', 
        response.status
      );
    }

    const data = await response.json();

    // Validate response format
    if (!isMapboxGeocodingResponse(data)) {
      throw new GeocodingError('Invalid response format from Mapbox API', 'API_ERROR');
    }

    // Normalize response
    const location = normalizeMapboxResponse(data, coordinates, cacheKey);

    // Cache the result
    if (useCache) {
      storeInCache(location, cacheTtl);
    }

    console.log(`[MapboxGeocoding] ✓ ${location.display}`);

    return {
      success: true,
      location,
      fromCache: false,
      responseTime: Date.now() - startTime
    };

  } catch (error) {
    console.error('[MapboxGeocoding] Error:', error);

    // Handle different error types
    if (error instanceof GeocodingError) {
      return {
        success: false,
        location: null,
        error: error.message,
        fromCache: false,
        responseTime: Date.now() - startTime
      };
    }

    // Network or unknown errors
    return {
      success: false,
      location: null,
      error: error instanceof Error ? error.message : 'Unknown geocoding error',
      fromCache: false,
      responseTime: Date.now() - startTime
    };
  }
}

/**
 * Batch reverse geocode multiple coordinates
 */
export async function batchReverseGeocode(
  coordinatesList: Coordinates[],
  options: GeocodingOptions = {}
): Promise<GeocodingResult[]> {
  // Process in parallel with rate limiting
  const results = await Promise.allSettled(
    coordinatesList.map(coords => reverseGeocode(coords, options))
  );

  return results.map(result => 
    result.status === 'fulfilled' 
      ? result.value 
      : {
          success: false,
          location: null,
          error: 'Batch geocoding failed',
          fromCache: false
        }
  );
}

/**
 * Clear the geocoding cache
 */
export function clearGeocodingCache(): void {
  cache.clear();
  console.log('[MapboxGeocoding] Cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; maxSize: number } {
  cleanExpiredCache();
  return {
    size: cache.size,
    maxSize: MAX_CACHE_SIZE
  };
}

/**
 * Preload common locations into cache
 */
export async function preloadLocations(coordinatesList: Coordinates[]): Promise<void> {
  console.log(`[MapboxGeocoding] Preloading ${coordinatesList.length} locations...`);
  
  const results = await batchReverseGeocode(coordinatesList, { useCache: true });
  const successful = results.filter(r => r.success).length;
  
  console.log(`[MapboxGeocoding] Preloaded ${successful}/${coordinatesList.length} locations`);
}