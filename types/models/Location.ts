// types/models/Location.ts
/**
 * Location and geocoding type definitions for global stream monitoring
 * Supports worldwide geographic location formats
 */

// ========================================
// Core Location Types
// ========================================

/**
 * Geographic coordinates
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Rounded coordinates for cache keys (4 decimal places)
 */
export interface CacheKey {
  lat: string; // e.g. "40.2581"
  lon: string; // e.g. "-111.6445"
}

/**
 * Location components from geocoding
 */
export interface LocationComponents {
  /** City or locality */
  city?: string;
  /** State, province, or administrative division */
  state?: string;
  /** Country name */
  country?: string;
  /** Country code (ISO 3166-1 alpha-2) */
  countryCode?: string;
  /** Full postal address */
  fullAddress?: string;
}

/**
 * Normalized location data for display
 */
export interface NormalizedLocation {
  /** Primary display format: "City, Country" or "City, State, Country" */
  display: string;
  /** Short format: "City, Country" */
  short: string;
  /** Individual components */
  components: LocationComponents;
  /** Source coordinates */
  coordinates: Coordinates;
  /** Cache key used for this location */
  cacheKey: CacheKey;
  /** Timestamp when geocoded */
  geocodedAt: string;
}

// ========================================
// Mapbox API Response Types
// ========================================

/**
 * Mapbox Geocoding API Context item
 */
export interface MapboxContext {
  id: string;
  text: string;
  short_code?: string;
  wikidata?: string;
}

/**
 * Mapbox Geocoding API Feature
 */
export interface MapboxFeature {
  id: string;
  type: 'Feature';
  place_type: string[];
  relevance: number;
  properties: Record<string, any>;
  text: string;
  place_name: string;
  center: [number, number]; // [longitude, latitude]
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  context?: MapboxContext[];
}

/**
 * Mapbox Geocoding API Response
 */
export interface MapboxGeocodingResponse {
  type: 'FeatureCollection';
  query: [number, number]; // [longitude, latitude]
  features: MapboxFeature[];
  attribution: string;
}

// ========================================
// Service Layer Types
// ========================================

/**
 * Geocoding service result
 */
export interface GeocodingResult {
  /** Whether geocoding was successful */
  success: boolean;
  /** Normalized location data (null if failed) */
  location: NormalizedLocation | null;
  /** Error message if failed */
  error?: string;
  /** Whether result came from cache */
  fromCache: boolean;
  /** Service response time in milliseconds */
  responseTime?: number;
}

/**
 * Geocoding cache entry
 */
export interface GeocodingCacheEntry {
  /** Normalized location data */
  location: NormalizedLocation;
  /** Timestamp when cached */
  cachedAt: string;
  /** TTL in milliseconds */
  ttl: number;
}

/**
 * Geocoding service options
 */
export interface GeocodingOptions {
  /** Custom cache TTL in milliseconds (default: 24 hours) */
  cacheTtl?: number;
  /** Whether to use cache (default: true) */
  useCache?: boolean;
  /** Preferred language for results */
  language?: string;
  /** Maximum number of results to return */
  limit?: number;
}

// ========================================
// Utility Types
// ========================================

/**
 * Location display format options
 */
export type LocationFormat = 'full' | 'short' | 'city-only' | 'country-only';

/**
 * Location precision levels
 */
export type LocationPrecision = 'exact' | 'approximate' | 'region';

/**
 * Geocoding provider types
 */
export type GeocodingProvider = 'mapbox' | 'mock';

// ========================================
// Error Types
// ========================================

/**
 * Geocoding service error
 */
export class GeocodingError extends Error {
  constructor(
    message: string,
    public code: 'NETWORK_ERROR' | 'API_ERROR' | 'INVALID_COORDINATES' | 'NO_RESULTS' | 'RATE_LIMITED',
    public statusCode?: number
  ) {
    super(message);
    this.name = 'GeocodingError';
  }
}

// ========================================
// Helper Type Guards
// ========================================

/**
 * Type guard for valid coordinates
 */
export function isValidCoordinates(coords: any): coords is Coordinates {
  return (
    coords &&
    typeof coords.latitude === 'number' &&
    typeof coords.longitude === 'number' &&
    coords.latitude >= -90 &&
    coords.latitude <= 90 &&
    coords.longitude >= -180 &&
    coords.longitude <= 180
  );
}

/**
 * Type guard for MapboxGeocodingResponse
 */
export function isMapboxGeocodingResponse(data: any): data is MapboxGeocodingResponse {
  return (
    data &&
    data.type === 'FeatureCollection' &&
    Array.isArray(data.features) &&
    Array.isArray(data.query) &&
    data.query.length === 2
  );
}