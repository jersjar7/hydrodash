// hooks/useMapStreamHighlight.ts
/**
 * Hook for highlighting selected streams on the map
 * Handles stream navigation and visual highlighting
 */

import { useCallback, useRef, useEffect } from 'react';
import type {
  VisibleStream,
  StreamHighlightConfig,
} from '@/types/models/VisibleStream';
import { DEFAULT_HIGHLIGHT_CONFIG } from '@/types/models/VisibleStream';

interface UseMapStreamHighlightOptions {
  /** Custom highlight configuration */
  config?: Partial<StreamHighlightConfig>;
  /** Auto-clear highlight after duration */
  autoClear?: boolean;
}

interface UseMapStreamHighlightResult {
  /** Currently highlighted stream */
  highlightedStream: VisibleStream | null;
  /** Highlight a stream and optionally fly to it */
  highlightStream: (stream: VisibleStream, flyTo?: boolean) => Promise<void>;
  /** Clear current highlight */
  clearHighlight: () => void;
  /** Fly to stream without highlighting */
  flyToStream: (stream: VisibleStream) => Promise<void>;
}

export function useMapStreamHighlight(
  map: mapboxgl.Map | null,
  options: UseMapStreamHighlightOptions = {}
): UseMapStreamHighlightResult {
  const { config = {}, autoClear = true } = options;
  
  const highlightedStreamRef = useRef<VisibleStream | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentLayerIdRef = useRef<string | null>(null);

  const mergedConfig = { ...DEFAULT_HIGHLIGHT_CONFIG, ...config };

  /**
   * Clear current highlight
   */
  const clearHighlight = useCallback((): void => {
    if (!map || !currentLayerIdRef.current) return;

    try {
      if (map.getLayer(currentLayerIdRef.current)) {
        map.removeLayer(currentLayerIdRef.current);
      }
      if (map.getSource('stream-highlight-source')) {
        map.removeSource('stream-highlight-source');
      }
      
      currentLayerIdRef.current = null;
      highlightedStreamRef.current = null;
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      console.log('✅ Stream highlight cleared');
    } catch (error) {
      console.warn('⚠️ Error clearing highlight:', error);
      currentLayerIdRef.current = null;
    }
  }, [map]);

  /**
   * Highlight a stream on the map
   */
  const highlightStream = useCallback(async (
    stream: VisibleStream,
    flyTo: boolean = true
  ): Promise<void> => {
    if (!map) return;

    try {
      // Clear existing highlight
      clearHighlight();

      // Fly to stream location first if requested
      if (flyTo) {
        await flyToStream(stream);
      }

      const sourceId = 'stream-highlight-source';
      const layerId = `stream-highlight-${Date.now()}`;

      // Create GeoJSON for highlight point
      const highlightGeoJson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [stream.longitude, stream.latitude],
            },
            properties: {
              station_id: stream.stationId,
            },
          },
        ],
      };

      // Add source
      map.addSource(sourceId, {
        type: 'geojson',
        data: highlightGeoJson,
      });

      // Add highlight layer
      map.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-color': mergedConfig.color,
          'circle-radius': mergedConfig.radius,
          'circle-opacity': mergedConfig.opacity,
          'circle-stroke-color': mergedConfig.strokeColor,
          'circle-stroke-width': mergedConfig.strokeWidth,
        },
      });

      currentLayerIdRef.current = layerId;
      highlightedStreamRef.current = stream;

      console.log(`✅ Highlighted stream ${stream.stationId}`);

      // Auto-clear after duration
      if (autoClear && mergedConfig.duration > 0) {
        timeoutRef.current = setTimeout(() => {
          clearHighlight();
        }, mergedConfig.duration);
      }
    } catch (error) {
      console.error('❌ Error highlighting stream:', error);
    }
  }, [map, clearHighlight, mergedConfig, autoClear]);

  /**
   * Fly to stream location
   */
  const flyToStream = useCallback(async (stream: VisibleStream): Promise<void> => {
    if (!map) return;

    try {
      console.log(`🛫 Flying to stream ${stream.stationId}...`);

      await new Promise<void>((resolve) => {
        map.flyTo({
          center: [stream.longitude, stream.latitude],
          zoom: 12,
          duration: 1500,
        });

        // Wait for fly animation to complete
        const onMoveEnd = () => {
          map.off('moveend', onMoveEnd);
          resolve();
        };
        map.on('moveend', onMoveEnd);
      });

      console.log(`✅ Flew to stream ${stream.stationId}`);
    } catch (error) {
      console.error('❌ Error flying to stream:', error);
    }
  }, [map]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearHighlight();
    };
  }, [clearHighlight]);

  return {
    highlightedStream: highlightedStreamRef.current,
    highlightStream,
    clearHighlight,
    flyToStream,
  };
}

export default useMapStreamHighlight;