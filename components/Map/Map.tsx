// components/Map/Map.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { appConfig } from '@/config';
import LoadingSpinner, { MapLoadingSpinner } from '@/components/common/LoadingSpinner';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useReachMetadata } from '@/hooks/useReachMetadata';
import { useShortRangeForecast } from '@/hooks/useFlowData';
import { getCurrentFlow } from '@/lib/utils/flow';
import { useAppContext } from '@/components/Layout/AppShell';
import StreamSearchOverlay from './StreamSearch/StreamSearchOverlay';
import type { ReachId } from '@/types';

type OnReady = (map: mapboxgl.Map) => void;

interface MapProps {
  /** Custom className for styling */
  className?: string;
  /** Callback when map is ready */
  onReady?: OnReady;
  /** Called with reachId (station_id / STATIONID) when user clicks a stream */
  onPickReach?: (reachId: string) => void;
  /** Map controls/overlays to render (legacy support) */
  children?: React.ReactNode;
  /** Loading state override */
  loading?: boolean;
  /** Error state override */
  error?: string;
  /** Show stream layers */
  showStreams?: boolean;
  /** Show stream search overlay (legacy - use MapPanel overlays instead) */
  showStreamSearch?: boolean;
  /** Custom data attribute for testing */
  'data-testid'?: string;
}

// Local type definition for stream modal data
interface StreamModalData {
  reachId: ReachId;
  name?: string;
  lat: number;
  lon: number;
  currentFlow?: number;
  metadata?: Record<string, any>;
}

// Error message types
type ErrorType = 'stream-load' | 'map-init' | 'invalid-stream';

interface ErrorMessage {
  type: ErrorType;
  title: string;
  message: string;
  show: boolean;
}

const Map: React.FC<MapProps> = ({ 
  className,
  onReady,
  onPickReach,
  children,
  loading: externalLoading,
  error: externalError,
  showStreams = true,
  showStreamSearch = true,
  'data-testid': testId,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  
  // State for tracking clicked reach
  const [clickedReachId, setClickedReachId] = useState<ReachId | null>(null);
  
  // State for error messages
  const [errorMessage, setErrorMessage] = useState<ErrorMessage>({
    type: 'map-init',
    title: '',
    message: '',
    show: false,
  });
  
  // Get AppShell context for modal management
  const { openStreamModal } = useAppContext();
  
  // Fetch reach metadata when a reach is clicked
  const { 
    data: reachData, 
    isLoading: isLoadingReach, 
    error: reachError 
  } = useReachMetadata(clickedReachId, {
    enabled: !!clickedReachId,
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  // Fetch short-range forecast for current flow when we have reach data
  const { 
    data: forecastData, 
    isLoading: isLoadingForecast, 
    error: forecastError 
  } = useShortRangeForecast(reachData?.reachId || null, {
    enabled: !!reachData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // When both reach data and forecast data are loaded, show modal
  useEffect(() => {
    if (reachData && !isLoadingReach && !reachError && !isLoadingForecast) {
      console.log('Stream data loaded, showing modal for:', reachData);
      
      // Extract current flow by comparing device time to forecast validTime
      const currentFlowValue = forecastData ? getCurrentFlow(forecastData) : null;
      
      // Transform RiverReach data to StreamModalData format
      const streamModalData: StreamModalData = {
        reachId: reachData.reachId,
        name: reachData.name,
        lat: reachData.latitude,
        lon: reachData.longitude,
        currentFlow: currentFlowValue ?? undefined, // Convert null to undefined for type compatibility
        metadata: {
          streamflow: reachData.streamflow,
          forecastAvailable: !!forecastData,
          forecastError: forecastError?.message,
        },
      };
      
      // Open modal with stream data
      openStreamModal(streamModalData);
      
      // Clear the clicked reach ID to reset for next click
      setClickedReachId(null);
    }
  }, [reachData, isLoadingReach, reachError, forecastData, isLoadingForecast, forecastError, openStreamModal]);

  // Handle reach or forecast loading errors
  useEffect(() => {
    if ((reachError || forecastError) && clickedReachId) {
      console.error('Failed to fetch stream data:', { reachError, forecastError });
      const errorMsg = reachError?.message || forecastError?.message || 'Unknown error';
      setErrorMessage({
        type: 'stream-load',
        title: 'Failed to Load Stream',
        message: `Could not load data for reach ${clickedReachId}: ${errorMsg}`,
        show: true,
      });
      setMapError(`Failed to load data for reach ${clickedReachId}: ${errorMsg}`);
      setClickedReachId(null);
    }
  }, [reachError, forecastError, clickedReachId]);

  // Auto-hide error messages after 5 seconds
  useEffect(() => {
    if (errorMessage.show) {
      const timer = setTimeout(() => {
        setErrorMessage(prev => ({ ...prev, show: false }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage.show]);

  // Use external loading/error states if provided, or combine with internal states
  const loading = externalLoading ?? (isLoading || isLoadingReach || isLoadingForecast);
  const displayError = externalError ?? mapError;

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

  // Helper function to convert string to ReachId (branded type)
  const toReachId = useCallback((id: string): ReachId => {
    return id as ReachId;
  }, []);

  // Get error styling based on type
  const getErrorStyle = (type: ErrorType) => {
    return {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-800 dark:text-red-200',
      border: 'border-red-200 dark:border-red-700',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    };
  };

  useEffect(() => {
    try {
      if (!containerRef.current) return;

      mapboxgl.accessToken = publicToken;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: baseStyle,
        center: [defaultLng, defaultLat],
        zoom: defaultZoom,
        // Add 3D settings
        pitch: 60, // Tilt angle (0-60 degrees)
        bearing: 0, // Rotation angle
        antialias: true // Smooth 3D rendering
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

            // 4) Click handler for stream selection - MODAL APPROACH WITH CURRENT FLOW
            const clickHandler = (e: mapboxgl.MapMouseEvent) => {
              const feat = e.features?.[0];
              const props = feat?.properties as Record<string, unknown> | undefined;
              const reachIdString = String(
                (props?.station_id as string | undefined) ??
                (props?.STATIONID as string | undefined) ??
                ''
              );
              
              if (reachIdString) {
                console.log('Stream clicked, will fetch metadata and current flow for reach ID:', reachIdString);
                
                // Convert to branded ReachId type and trigger data fetch for modal
                const reachId = toReachId(reachIdString);
                setClickedReachId(reachId);
                
                // Clear any previous errors
                setMapError(null);
                setErrorMessage(prev => ({ ...prev, show: false }));
                
                // Call legacy callback if provided (for backward compatibility)
                if (onPickReachRef.current) {
                  onPickReachRef.current(reachIdString);
                }
              } else {
                console.warn('Clicked stream has no valid reach ID');
                setErrorMessage({
                  type: 'invalid-stream',
                  title: 'Invalid Stream',
                  message: 'Selected stream has no valid identifier',
                  show: true,
                });
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
          setMapError(null);
          onReadyRef.current?.(map);
        } catch (layerError) {
          console.error('Error setting up map layers:', layerError);
          setMapError('Failed to load map layers');
          setIsLoading(false);
        }
      });

      map.on('error', (e) => {
        console.error('Mapbox GL error:', e.error);
        setMapError('Map failed to load');
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
      setMapError(err instanceof Error ? err.message : 'Map failed to initialize');
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
    showStreams,
    toReachId
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
        
        {/* Loading Overlay - Shows progress through data loading stages */}
        {loading && !displayError && (
          <MapLoadingSpinner 
            text={
              isLoadingForecast ? 'Loading current flow data...' : 
              isLoadingReach ? 'Loading stream data...' : 
              'Loading map...'
            } 
          />
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
                {reachError || forecastError ? 'Stream Data Error' : 'Map Error'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {displayError}
              </p>
              {(reachError || forecastError) && (
                <button
                  onClick={() => {
                    setMapError(null);
                    setClickedReachId(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Simplified Error Notification (modal handles success states) */}
        {errorMessage.show && (
          <div className="absolute top-4 right-4 z-10 animate-fade-in">
            <div className={`
              max-w-sm p-4 rounded-lg shadow-lg border backdrop-blur-sm
              ${getErrorStyle(errorMessage.type).bg} 
              ${getErrorStyle(errorMessage.type).text}
              ${getErrorStyle(errorMessage.type).border}
            `}>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getErrorStyle(errorMessage.type).icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium">
                    {errorMessage.title}
                  </h4>
                  <p className="text-sm opacity-90">
                    {errorMessage.message}
                  </p>
                  <button
                    onClick={() => setErrorMessage(prev => ({ ...prev, show: false }))}
                    className="mt-2 text-xs opacity-75 hover:opacity-100 underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* FIXED: Only render StreamSearchOverlay when showStreamSearch=true AND not using MapPanel overlays */}
        {showStreamSearch && (
          <StreamSearchOverlay
            map={mapRef.current}
            topOffset={20}
            inMapPanel={false}
          />
        )}
        
        {/* Legacy Child Components Support - Maintains backward compatibility */}
        {children && (
          <div className="absolute inset-0 pointer-events-none z-50">
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