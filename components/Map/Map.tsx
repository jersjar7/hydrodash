// components/Map/Map.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { appConfig } from '@/config';
import LoadingSpinner, { MapLoadingSpinner } from '@/components/common/LoadingSpinner';
import ErrorBoundary from '@/components/common/ErrorBoundary';

type OnReady = (map: mapboxgl.Map) => void;

interface MapProps {
  /** Custom className for styling */
  className?: string;
  /** Callback when map is ready */
  onReady?: OnReady;
  /** Called with reachId (station_id / STATIONID) when user clicks a stream */
  onPickReach?: (reachId: string) => void;
  /** Map controls/overlays to render */
  children?: React.ReactNode;
  /** Loading state override */
  loading?: boolean;
  /** Error state override */
  error?: string;
  /** Show stream layers */
  showStreams?: boolean;
  /** Custom data attribute for testing */
  'data-testid'?: string;
}

const Map: React.FC<MapProps> = ({ 
  className,
  onReady,
  onPickReach,
  children,
  loading: externalLoading,
  error: externalError,
  showStreams = true,
  'data-testid': testId,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use external loading/error states if provided
  const loading = externalLoading ?? isLoading;
  const displayError = externalError ?? error;

  const {
    publicToken,
    tilesetId,
    sourceLayer,
    baseStyle,
  } = appConfig.public.map.mapbox;
  const { defaultCenter, defaultZoom } = appConfig.public.map;

  // Destructure defaultCenter to avoid object dependency issues
  const defaultLat = defaultCenter.lat;
  const defaultLng = defaultCenter.lng;

  // Create stable references for callbacks to prevent useEffect re-runs
  const onReadyRef = useRef(onReady);
  const onPickReachRef = useRef(onPickReach);
  
  // Update refs when callbacks change
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);
  
  useEffect(() => {
    onPickReachRef.current = onPickReach;
  }, [onPickReach]);

  useEffect(() => {
    try {
      if (!containerRef.current) return;

      mapboxgl.accessToken = publicToken;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: baseStyle,
        center: [defaultLng, defaultLat],
        zoom: defaultZoom,
      });

      map.on('load', () => {
        try {
          // Add stream layers if enabled
          if (showStreams) {
            // 1) Add vector source (your tileset)
            if (!map.getSource('streams')) {
              map.addSource('streams', {
                type: 'vector',
                url: `mapbox://${tilesetId}`,
              });
            }

            // 2) Add a line layer for streams
            if (!map.getLayer('streams-line')) {
              map.addLayer({
                id: 'streams-line',
                type: 'line',
                source: 'streams',
                'source-layer': sourceLayer,
                paint: {
                  'line-color': '#1e40af',
                  'line-width': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    8, 1,
                    12, 2,
                    16, 3
                  ],
                },
              });
            }

            // 3) Add hover effects
            if (!map.getLayer('streams-hover')) {
              map.addLayer({
                id: 'streams-hover',
                type: 'line',
                source: 'streams',
                'source-layer': sourceLayer,
                paint: {
                  'line-color': '#3b82f6',
                  'line-width': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    8, 2,
                    12, 4,
                    16, 6
                  ],
                },
                filter: ['==', ['get', 'station_id'], ''],
              });
            }

            // 4) Click handler for stream selection
            const clickHandler = (e: mapboxgl.MapLayerMouseEvent) => {
              const feat = e.features?.[0];
              const props = feat?.properties as Record<string, unknown> | undefined;
              const reachId = String(
                (props?.station_id as string | undefined) ??
                (props?.STATIONID as string | undefined) ??
                ''
              );
              
              if (reachId && onPickReachRef.current) {
                onPickReachRef.current(reachId);
              }
            };

            // 5) Hover effects
            const mouseEnterHandler = (e: mapboxgl.MapLayerMouseEvent) => {
              map.getCanvas().style.cursor = 'pointer';
              
              const feat = e.features?.[0];
              const props = feat?.properties as Record<string, unknown> | undefined;
              const stationId = String(
                (props?.station_id as string | undefined) ??
                (props?.STATIONID as string | undefined) ??
                ''
              );
              
              if (stationId) {
                map.setFilter('streams-hover', ['==', ['get', 'station_id'], stationId]);
              }
            };

            const mouseLeaveHandler = () => {
              map.getCanvas().style.cursor = '';
              map.setFilter('streams-hover', ['==', ['get', 'station_id'], '']);
            };

            // Attach event listeners
            map.on('click', 'streams-line', clickHandler);
            map.on('mouseenter', 'streams-line', mouseEnterHandler);
            map.on('mouseleave', 'streams-line', mouseLeaveHandler);

            // Store handlers for cleanup
            (map as any).__hd_clickHandler = clickHandler;
            (map as any).__hd_mouseEnterHandler = mouseEnterHandler;
            (map as any).__hd_mouseLeaveHandler = mouseLeaveHandler;
          }

          setIsLoading(false);
          setError(null);
          onReadyRef.current?.(map);
        } catch (layerError) {
          console.error('Error setting up map layers:', layerError);
          setError('Failed to load map layers');
          setIsLoading(false);
        }
      });

      map.on('error', (e) => {
        console.error('Mapbox GL error:', e.error);
        setError('Map failed to load');
        setIsLoading(false);
      });

      mapRef.current = map;

      return () => {
        const m = mapRef.current;
        if (m) {
          // Remove event listeners
          if ((m as any).__hd_clickHandler) {
            m.off('click', 'streams-line', (m as any).__hd_clickHandler);
          }
          if ((m as any).__hd_mouseEnterHandler) {
            m.off('mouseenter', 'streams-line', (m as any).__hd_mouseEnterHandler);
          }
          if ((m as any).__hd_mouseLeaveHandler) {
            m.off('mouseleave', 'streams-line', (m as any).__hd_mouseLeaveHandler);
          }
          
          // Remove map
          m.remove();
        }
        mapRef.current = null;
      };
    } catch (err) {
      console.error('Map initialization error:', err);
      setError(err instanceof Error ? err.message : 'Map failed to initialize');
      setIsLoading(false);
    }
  }, [
    publicToken, 
    tilesetId, 
    sourceLayer, 
    baseStyle, 
    defaultLat,
    defaultLng,
    defaultZoom, 
    showStreams
  ]);

  // Get map instance (for child components)
  const getMap = () => mapRef.current;

  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="text-center p-6">
            <div className="text-red-500 mb-2">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Map component failed to load
            </p>
          </div>
        </div>
      }
    >
      <div 
        className={className ?? 'w-full h-full rounded-lg overflow-hidden relative'}
        data-testid={testId}
      >
        {/* Map Container */}
        <div ref={containerRef} className="w-full h-full" />
        
        {/* Loading Overlay */}
        {loading && !displayError && (
          <MapLoadingSpinner text="Loading map..." />
        )}
        
        {/* Error Overlay */}
        {displayError && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-10">
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-sm">
              <div className="text-red-500 mb-3">
                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                Map Error
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {displayError}
              </p>
            </div>
          </div>
        )}
        
        {/* Child Components (controls, overlays, etc.) */}
        {children && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="relative w-full h-full pointer-events-auto">
              {typeof children === 'function' 
                ? (children as (map: mapboxgl.Map | null) => React.ReactNode)(getMap())
                : children
              }
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default Map;