// components/Map/Map.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { appConfig } from '@/config';
import LoadingSpinner, { MapLoadingSpinner } from '@/components/common/LoadingSpinner';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useReachMetadata } from '@/hooks/useReachMetadata';
import { useSavedPlaces } from '@/hooks/useSavedPlaces';
import { useAppContext } from '@/components/Layout/AppShell';
import type { ReachId, SavedPlace } from '@/types';

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

// Feedback message types
type FeedbackType = 'success' | 'saved' | 'error' | 'duplicate';

interface FeedbackMessage {
  type: FeedbackType;
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
  'data-testid': testId,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for tracking clicked reach
  const [clickedReachId, setClickedReachId] = useState<ReachId | null>(null);
  
  // State for feedback messages
  const [feedback, setFeedback] = useState<FeedbackMessage>({
    type: 'success',
    title: '',
    message: '',
    show: false,
  });
  
  // Get AppShell context to update active location
  const { setActiveLocation } = useAppContext();
  
  // Saved places hook for save functionality
  const { 
    addPlace, 
    hasPlace, 
    canAddMore,
    isLoading: isSavingPlace 
  } = useSavedPlaces();
  
  // Fetch reach metadata when a reach is clicked
  const { 
    data: reachData, 
    isLoading: isLoadingReach, 
    error: reachError 
  } = useReachMetadata(clickedReachId, {
    enabled: !!clickedReachId,
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  // Update active location when reach data is successfully fetched
  useEffect(() => {
    if (reachData && !isLoadingReach && !reachError) {
      console.log('Setting active location to:', reachData);
      setActiveLocation(reachData);
      
      // Show success feedback with save option
      const isAlreadySaved = hasPlace(reachData.reachId);
      setFeedback({
        type: isAlreadySaved ? 'duplicate' : 'success',
        title: isAlreadySaved ? 'Already Saved' : 'Stream Loaded',
        message: reachData.name || `Reach ${reachData.reachId}`,
        show: true,
      });
      
      // Clear the clicked reach ID to reset for next click
      setClickedReachId(null);
    }
  }, [reachData, isLoadingReach, reachError, setActiveLocation, hasPlace]);

  // Handle reach loading errors
  useEffect(() => {
    if (reachError && clickedReachId) {
      console.error('Failed to fetch reach data:', reachError);
      setFeedback({
        type: 'error',
        title: 'Failed to Load Stream',
        message: `Could not load data for reach ${clickedReachId}`,
        show: true,
      });
      setError(`Failed to load data for reach ${clickedReachId}: ${reachError.message}`);
      setClickedReachId(null);
    }
  }, [reachError, clickedReachId]);

  // Auto-hide feedback messages after 5 seconds
  useEffect(() => {
    if (feedback.show) {
      const timer = setTimeout(() => {
        setFeedback(prev => ({ ...prev, show: false }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback.show]);

  // Handle saving a place
  const handleSavePlace = useCallback(async () => {
    if (!reachData || isSavingPlace) return;
    
    // Check if already saved
    if (hasPlace(reachData.reachId)) {
      setFeedback({
        type: 'duplicate',
        title: 'Already Saved',
        message: 'This location is already in your saved places',
        show: true,
      });
      return;
    }
    
    // Check if can add more places
    if (!canAddMore()) {
      setFeedback({
        type: 'error',
        title: 'Cannot Save',
        message: 'Maximum number of saved places reached',
        show: true,
      });
      return;
    }

    try {
      // Create saved place object
      const savedPlace: Omit<SavedPlace, 'id' | 'createdAt' | 'updatedAt'> = {
        name: reachData.name || `Reach ${reachData.reachId}`,
        type: 'other', // Default type for map-saved places
        reachId: reachData.reachId,
        lat: reachData.latitude,
        lon: reachData.longitude,
        notes: `Saved from map on ${new Date().toLocaleDateString()}`,
        isPrimary: false, // User can set primary later
      };

      await addPlace(savedPlace);
      
      setFeedback({
        type: 'saved',
        title: 'Place Saved!',
        message: `Added "${savedPlace.name}" to saved places`,
        show: true,
      });
      
      console.log('Successfully saved place:', savedPlace.name);
    } catch (error) {
      console.error('Failed to save place:', error);
      setFeedback({
        type: 'error',
        title: 'Save Failed',
        message: error instanceof Error ? error.message : 'Could not save this location',
        show: true,
      });
    }
  }, [reachData, hasPlace, canAddMore, addPlace, isSavingPlace]);

  // Use external loading/error states if provided, or combine with internal states
  const loading = externalLoading ?? (isLoading || isLoadingReach);
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

  // Helper function to convert string to ReachId (branded type)
  const toReachId = useCallback((id: string): ReachId => {
    return id as ReachId;
  }, []);

  // Get feedback styling based on type
  const getFeedbackStyle = (type: FeedbackType) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-100 dark:bg-green-900/30',
          text: 'text-green-800 dark:text-green-200',
          border: 'border-green-200 dark:border-green-700',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
        };
      case 'saved':
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          text: 'text-blue-800 dark:text-blue-200',
          border: 'border-blue-200 dark:border-blue-700',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          ),
        };
      case 'duplicate':
        return {
          bg: 'bg-amber-100 dark:bg-amber-900/30',
          text: 'text-amber-800 dark:text-amber-200',
          border: 'border-amber-200 dark:border-amber-700',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ),
        };
      case 'error':
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
    }
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

            // 4) Click handler for stream selection - UPDATED FOR REAL DATA
            const clickHandler = (e: mapboxgl.MapLayerMouseEvent) => {
              const feat = e.features?.[0];
              const props = feat?.properties as Record<string, unknown> | undefined;
              const reachIdString = String(
                (props?.station_id as string | undefined) ??
                (props?.STATIONID as string | undefined) ??
                ''
              );
              
              if (reachIdString) {
                console.log('Stream clicked, reach ID:', reachIdString);
                
                // Convert to branded ReachId type and trigger data fetch
                const reachId = toReachId(reachIdString);
                setClickedReachId(reachId);
                
                // Clear any previous errors and feedback
                setError(null);
                setFeedback(prev => ({ ...prev, show: false }));
                
                // Call legacy callback if provided (for backward compatibility)
                if (onPickReachRef.current) {
                  onPickReachRef.current(reachIdString);
                }
              } else {
                console.warn('Clicked stream has no valid reach ID');
                setFeedback({
                  type: 'error',
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
        
        {/* Loading Overlay - Updated to show reach loading */}
        {loading && !displayError && (
          <MapLoadingSpinner 
            text={isLoadingReach ? 'Loading stream data...' : 'Loading map...'} 
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
                {reachError ? 'Stream Data Error' : 'Map Error'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {displayError}
              </p>
              {reachError && (
                <button
                  onClick={() => {
                    setError(null);
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
        
        {/* Enhanced Feedback Notification with Save Functionality */}
        {feedback.show && (
          <div className="absolute top-4 right-4 z-10 animate-fade-in">
            <div className={`
              max-w-sm p-4 rounded-lg shadow-lg border backdrop-blur-sm
              ${getFeedbackStyle(feedback.type).bg} 
              ${getFeedbackStyle(feedback.type).text}
              ${getFeedbackStyle(feedback.type).border}
            `}>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getFeedbackStyle(feedback.type).icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium">
                    {feedback.title}
                  </h4>
                  <p className="text-sm opacity-90 truncate">
                    {feedback.message}
                  </p>
                  
                  {/* Save Place Button - Show only for successful loads that aren't already saved */}
                  {feedback.type === 'success' && reachData && (
                    <div className="mt-2 flex items-center space-x-2">
                      <button
                        onClick={handleSavePlace}
                        disabled={isSavingPlace || !canAddMore()}
                        className="
                          px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                          bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed
                          border border-current/20 hover:border-current/30
                        "
                        title={
                          !canAddMore() 
                            ? 'Maximum saved places reached' 
                            : 'Add this location to your saved places'
                        }
                      >
                        {isSavingPlace ? (
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                            <span>Saving...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                            <span>Save Place</span>
                          </div>
                        )}
                      </button>
                      
                      <button
                        onClick={() => setFeedback(prev => ({ ...prev, show: false }))}
                        className="p-1 hover:bg-white/20 rounded"
                        title="Dismiss"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                  
                  {/* Dismiss button for other feedback types */}
                  {feedback.type !== 'success' && (
                    <button
                      onClick={() => setFeedback(prev => ({ ...prev, show: false }))}
                      className="mt-2 text-xs opacity-75 hover:opacity-100 underline"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
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