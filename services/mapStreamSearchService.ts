// services/mapStreamSearchService.ts
/**
 * Service for querying visible streams from vector tiles
 * Handles viewport-based stream discovery for search functionality
 */

import mapboxgl from 'mapbox-gl';
import { toReachId } from '@/lib/utils/ids';
import type {
  VisibleStream,
  StreamVectorTileProperties,
  StreamVectorTileFeature,
  StreamQueryOptions,
  StreamQueryResult,
  StreamOrderCategory,
  ScreenBounds,
  QueryStrategy,
  STREAM_LAYER_IDS,
  getStreamOrderCategory,
} from '@/types/models/VisibleStream';

// Cache for query results to avoid repeated queries
interface QueryCache {
  key: string;
  streams: VisibleStream[];
  timestamp: number;
}

class MapStreamSearchService {
  private map: mapboxgl.Map | null = null;
  private cache = new Map<string, QueryCache>();
  private readonly CACHE_TTL = 30000; // 30 seconds

  /**
   * Set the Mapbox map instance
   */
  setMap(map: mapboxgl.Map): void {
    this.map = map;
    console.log('✅ Map stream search service ready');
  }

  /**
   * Get all visible streams in current map viewport
   */
  async getVisibleStreams(options: StreamQueryOptions = {}): Promise<StreamQueryResult> {
    if (!this.map) {
      throw new Error('Map not initialized');
    }

    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(options);
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log(`🎯 Using cached streams: ${cached.length} streams`);
      return {
        streams: cached,
        totalFeatures: cached.length,
        queryTime: Date.now() - startTime,
        warnings: ['Used cached results'],
      };
    }

    console.log('🔬 Querying visible streams in viewport...');

    const layerIds = this.getLayerIds(options);
    const strategies = this.createQueryStrategies(layerIds, options);
    
    let streams: VisibleStream[] = [];
    let warnings: string[] = [];
    let totalFeatures = 0;

    // Try strategies in order until one succeeds
    for (const strategy of strategies) {
      try {
        console.log(`🔍 Trying ${strategy.name} strategy...`);
        const strategyStreams = await strategy.execute();
        
        if (strategyStreams.length > 0) {
          streams = strategyStreams;
          console.log(`✅ ${strategy.name} successful: ${streams.length} streams`);
          break;
        } else {
          warnings.push(`${strategy.name} returned no results`);
        }
      } catch (error) {
        console.warn(`⚠️ ${strategy.name} failed:`, error);
        warnings.push(`${strategy.name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Apply additional filtering and sorting
    streams = this.processStreams(streams, options);
    totalFeatures = streams.length;

    // Cache the results
    this.setCache(cacheKey, streams);

    const queryTime = Date.now() - startTime;
    console.log(`🎯 Query completed: ${streams.length} streams in ${queryTime}ms`);

    return {
      streams,
      totalFeatures,
      queryTime,
      warnings,
    };
  }

  /**
   * Create query strategies for fallback handling
   */
  private createQueryStrategies(layerIds: string[], options: StreamQueryOptions): QueryStrategy[] {
    return [
      {
        name: 'chunked',
        execute: () => this.tryChunkedQuery(layerIds, options),
      },
      {
        name: 'smaller-area',
        execute: () => this.trySmallerAreaQuery(layerIds, options),
      },
      {
        name: 'center-point',
        execute: () => this.tryCenterPointQuery(layerIds, options),
      },
    ];
  }

  /**
   * Strategy 1: Query in chunks to handle large viewports
   */
  private async tryChunkedQuery(layerIds: string[], options: StreamQueryOptions): Promise<VisibleStream[]> {
    if (!this.map) throw new Error('Map not initialized');

    const canvas = this.map.getCanvas();
    const width = canvas.width;
    const height = canvas.height;

    // Create 4 chunks to avoid API limits
    const chunks: ScreenBounds[] = [
      { minX: 0, minY: 0, maxX: width / 2, maxY: height / 2 },
      { minX: width / 2, minY: 0, maxX: width, maxY: height / 2 },
      { minX: 0, minY: height / 2, maxX: width / 2, maxY: height },
      { minX: width / 2, minY: height / 2, maxX: width, maxY: height },
    ];

    const allStreams: VisibleStream[] = [];
    const seenStationIds = new Set<string>();

    for (let i = 0; i < chunks.length; i++) {
      try {
        const chunk = chunks[i];
        const features = await this.map.queryRenderedFeatures(
          [[chunk.minX, chunk.minY], [chunk.maxX, chunk.maxY]],
          { 
            layers: layerIds,
            filter: this.createReachIdFilter(options)
          }
        );

        console.log(`✅ Chunk ${i + 1}: ${features.length} features`);

        for (const feature of features) {
          const stream = this.createVisibleStreamFromFeature(feature);
          if (stream && !seenStationIds.has(stream.stationId)) {
            allStreams.push(stream);
            seenStationIds.add(stream.stationId);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Chunk ${i + 1} failed:`, error);
        continue;
      }
    }

    return allStreams;
  }

  /**
   * Strategy 2: Query smaller central area
   */
  private async trySmallerAreaQuery(layerIds: string[], options: StreamQueryOptions): Promise<VisibleStream[]> {
    if (!this.map) throw new Error('Map not initialized');

    const canvas = this.map.getCanvas();
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const size = Math.min(canvas.width, canvas.height) * 0.6; // 60% of smaller dimension

    const bounds: ScreenBounds = {
      minX: centerX - size / 2,
      minY: centerY - size / 2,
      maxX: centerX + size / 2,
      maxY: centerY + size / 2,
    };

    const features = await this.map.queryRenderedFeatures(
      [[bounds.minX, bounds.minY], [bounds.maxX, bounds.maxY]],
      { 
        layers: layerIds,
        filter: this.createReachIdFilter(options)
      }
    );

    console.log(`✅ Smaller area query: ${features.length} features`);

    const streams: VisibleStream[] = [];
    const seenStationIds = new Set<string>();

    for (const feature of features) {
      const stream = this.createVisibleStreamFromFeature(feature);
      if (stream && !seenStationIds.has(stream.stationId)) {
        streams.push(stream);
        seenStationIds.add(stream.stationId);
      }
    }

    return streams;
  }

  /**
   * Strategy 3: Query around center point
   */
  private async tryCenterPointQuery(layerIds: string[], options: StreamQueryOptions): Promise<VisibleStream[]> {
    if (!this.map) throw new Error('Map not initialized');

    const canvas = this.map.getCanvas();
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 50; // Small radius around center

    const bounds: ScreenBounds = {
      minX: centerX - radius,
      minY: centerY - radius,
      maxX: centerX + radius,
      maxY: centerY + radius,
    };

    const features = await this.map.queryRenderedFeatures(
      [[bounds.minX, bounds.minY], [bounds.maxX, bounds.maxY]],
      { 
        layers: layerIds,
        filter: this.createReachIdFilter(options)
      }
    );

    console.log(`✅ Center point query: ${features.length} features`);

    const streams: VisibleStream[] = [];
    const seenStationIds = new Set<string>();

    for (const feature of features) {
      const stream = this.createVisibleStreamFromFeature(feature);
      if (stream && !seenStationIds.has(stream.stationId)) {
        streams.push(stream);
        seenStationIds.add(stream.stationId);
      }
    }

    return streams;
  }

  /**
   * Create reach ID filter for queryRenderedFeatures
   */
  private createReachIdFilter(options: StreamQueryOptions): any[] | undefined {
    if (options.targetReachIds && options.targetReachIds.length > 0) {
      return ['in', ['get', 'station_id'], ['literal', options.targetReachIds]];
    }
    return undefined;
  }

  /**
   * Create VisibleStream from Mapbox feature
   */
  private createVisibleStreamFromFeature(feature: mapboxgl.MapboxGeoJSONFeature): VisibleStream | null {
    try {
      const properties = feature.properties as StreamVectorTileProperties;

      if (!properties?.station_id || typeof properties.streamOrde !== 'number') {
        return null;
      }

      // Get center point of LineString geometry
      const geometry = feature.geometry;
      let longitude: number, latitude: number;

      if (geometry.type === 'LineString') {
        const coordinates = geometry.coordinates;
        if (coordinates.length === 0) return null;

        // Use middle point of LineString
        const middleIndex = Math.floor(coordinates.length / 2);
        [longitude, latitude] = coordinates[middleIndex];
      } else if (geometry.type === 'Point') {
        [longitude, latitude] = geometry.coordinates;
      } else {
        // For other geometry types, try to get a representative point
        console.warn(`Unsupported geometry type: ${geometry.type}`);
        return null;
      }

      const stationId = String(properties.station_id);
      
      return {
        stationId,
        reachId: toReachId(stationId),
        streamOrder: properties.streamOrde,
        longitude,
        latitude,
        name: properties.name || undefined,
      };
    } catch (error) {
      console.warn('Error creating VisibleStream:', error);
      return null;
    }
  }

  /**
   * Process and filter streams based on options
   */
  private processStreams(streams: VisibleStream[], options: StreamQueryOptions): VisibleStream[] {
    let processed = [...streams];

    // Filter by target reach IDs (additional client-side filtering)
    if (options.targetReachIds && options.targetReachIds.length > 0) {
      processed = processed.filter(s => options.targetReachIds!.includes(s.stationId));
    }

    // Deduplicate (default: true)
    if (options.deduplicate !== false) {
      const seen = new Set<string>();
      processed = processed.filter(s => {
        if (seen.has(s.stationId)) return false;
        seen.add(s.stationId);
        return true;
      });
    }

    // Sort by stream order (larger first) then by station ID
    processed.sort((a, b) => {
      const orderCompare = b.streamOrder - a.streamOrder;
      if (orderCompare !== 0) return orderCompare;
      return a.stationId.localeCompare(b.stationId);
    });

    // Limit results
    if (options.maxResults) {
      processed = processed.slice(0, options.maxResults);
    }

    return processed;
  }

  /**
   * Get layer IDs based on options
   */
  private getLayerIds(options: StreamQueryOptions): string[] {
    if (!this.map) return [];
    
    // Get all layers that use the streams source
    const style = this.map.getStyle();
    const streamLayers = style.layers?.filter(layer => 
      layer.source === 'streams' && layer.type === 'line'
    ).map(layer => layer.id) || [];
    
    // Return existing stream layers or fall back to known layer
    return streamLayers.length > 0 ? streamLayers : ['streams-line'];
  }

  /**
   * Generate cache key based on map state and options
   */
  private generateCacheKey(options: StreamQueryOptions): string {
    if (!this.map) return 'no-map';

    const center = this.map.getCenter();
    const zoom = this.map.getZoom();
    const bearing = this.map.getBearing();
    
    const mapState = `${center.lng.toFixed(4)},${center.lat.toFixed(4)},${zoom.toFixed(1)},${bearing.toFixed(0)}`;
    const optionsStr = JSON.stringify(options);
    
    return `${mapState}|${optionsStr}`;
  }

  /**
   * Get cached results if still valid
   */
  private getFromCache(key: string): VisibleStream[] | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.streams;
  }

  /**
   * Cache query results
   */
  private setCache(key: string, streams: VisibleStream[]): void {
    this.cache.set(key, {
      key,
      streams,
      timestamp: Date.now(),
    });

    // Clean old cache entries
    if (this.cache.size > 50) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clear cache (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.cache.clear();
    console.log('✅ Stream search cache cleared');
  }

  /**
   * Dispose service and clean up resources
   */
  dispose(): void {
    this.map = null;
    this.cache.clear();
    console.log('🗑️ Map stream search service disposed');
  }
}

// Export singleton instance
export const mapStreamSearchService = new MapStreamSearchService();
export default mapStreamSearchService;