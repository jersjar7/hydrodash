// types/models/VisibleStream.ts
/**
 * Type definitions for visible streams in map viewport
 * Used for stream search functionality that queries vector tiles
 */

import type { ReachId } from './RiverReach';

/**
 * A stream visible in the current map viewport
 * Extracted from vector tile features for search functionality
 */
export interface VisibleStream {
  /** Station ID / Reach ID from vector tile properties */
  stationId: string;
  /** Stream order (1-9+, higher = larger rivers) */
  streamOrder: number;
  /** Longitude coordinate (center point of stream segment) */
  longitude: number;
  /** Latitude coordinate (center point of stream segment) */
  latitude: number;
  /** Optional name if available in vector data */
  name?: string;
  /** Raw reach ID typed for consistency with app */
  reachId: ReachId;
}

/**
 * Raw vector tile feature properties from streams2 layer
 * Based on the actual structure returned by Mapbox queryRenderedFeatures
 */
export interface StreamVectorTileProperties {
  /** Station ID - primary identifier */
  station_id: string;
  /** Stream order (note: truncated name in vector tiles) */
  streamOrde: number;
  /** Optional stream name */
  name?: string;
  /** Additional properties that might be present */
  [key: string]: unknown;
}

/**
 * GeoJSON LineString geometry for stream features
 */
export interface StreamGeometry {
  type: 'LineString';
  coordinates: [number, number][]; // [lng, lat] pairs
}

/**
 * Complete vector tile feature structure for streams
 */
export interface StreamVectorTileFeature {
  type: 'Feature';
  properties: StreamVectorTileProperties;
  geometry: StreamGeometry;
}

/**
 * Search state for stream search functionality
 */
export interface StreamSearchState {
  /** Current search query/filter text */
  query: string;
  /** All streams in current viewport */
  availableStreams: VisibleStream[];
  /** Filtered streams based on query */
  filteredStreams: VisibleStream[];
  /** Whether search is currently loading */
  isLoading: boolean;
  /** Whether search dropdown is open */
  isOpen: boolean;
  /** Error message if query failed */
  error: string | null;
  /** Currently highlighted stream */
  highlightedStream: VisibleStream | null;
}

/**
 * Options for querying visible streams
 */
export interface StreamQueryOptions {
  /** Include small streams (order 1-2) */
  includeSmallStreams?: boolean;
  /** Maximum number of streams to return */
  maxResults?: number;
  /** Minimum stream order to include */
  minStreamOrder?: number;
  /** Whether to deduplicate by station ID */
  deduplicate?: boolean;
}

/**
 * Result of a stream viewport query
 */
export interface StreamQueryResult {
  /** Streams found in viewport */
  streams: VisibleStream[];
  /** Total features processed */
  totalFeatures: number;
  /** Query execution time in milliseconds */
  queryTime: number;
  /** Any warnings or issues during query */
  warnings: string[];
}

/**
 * Layer IDs for different stream orders in vector tiles
 */
export const STREAM_LAYER_IDS = {
  SMALL: 'streams2-order-1-2',    // Small streams
  MEDIUM: 'streams2-order-3-4',   // Medium streams  
  LARGE: 'streams2-order-5-plus', // Large rivers
} as const;

/**
 * Stream order categories for UI grouping
 */
export type StreamOrderCategory = 'small' | 'medium' | 'large';

/**
 * Map stream order number to category
 */
export function getStreamOrderCategory(order: number): StreamOrderCategory {
  if (order <= 2) return 'small';
  if (order <= 4) return 'medium';
  return 'large';
}

/**
 * Stream search actions for reducer pattern
 */
export type StreamSearchAction =
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SET_STREAMS'; payload: VisibleStream[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_OPEN'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_HIGHLIGHTED'; payload: VisibleStream | null }
  | { type: 'CLEAR_SEARCH' };

/**
 * Configuration for stream highlighting on map
 */
export interface StreamHighlightConfig {
  /** Highlight circle color (hex) */
  color?: string;
  /** Highlight circle radius in pixels */
  radius?: number;
  /** Highlight opacity (0-1) */
  opacity?: number;
  /** Stroke color for highlight circle */
  strokeColor?: string;
  /** Stroke width in pixels */
  strokeWidth?: number;
  /** Duration to show highlight in milliseconds */
  duration?: number;
}

/**
 * Default highlight configuration
 */
export const DEFAULT_HIGHLIGHT_CONFIG: Required<StreamHighlightConfig> = {
  color: '#FF0000',      // Bright red
  radius: 12,
  opacity: 0.7,
  strokeColor: '#FFFFFF', // White border
  strokeWidth: 2,
  duration: 5000,        // 5 seconds
};

/**
 * Screen coordinate bounds for chunked querying
 * Used to break large viewports into smaller query areas
 */
export interface ScreenBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Query strategy results for fallback handling
 */
export interface QueryStrategy {
  name: string;
  bounds?: ScreenBounds[];
  execute: () => Promise<VisibleStream[]>;
}

export default VisibleStream;