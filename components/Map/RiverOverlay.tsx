// components/Map/RiverOverlay.tsx
'use client';

import { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { ReachId } from '@/types/models/RiverReach';
import { RiskLevel } from '@/types/models/FlowForecast';
import { ReturnPeriodThresholds } from '@/types/models/ReturnPeriod';
import { computeRisk } from '@/lib/utils/riskCalculator';
import { useAppContext } from '@/components/Layout/AppShell';
import type { StreamModalData } from '@/components/Layout/AppShell';

// Flow data structure for each reach
export interface ReachFlowData {
  reachId: ReachId;
  currentFlow: number; // in CFS
  riskLevel?: RiskLevel;
  returnPeriods?: ReturnPeriodThresholds;
  lastUpdated?: string;
}

// GeoJSON feature with flow properties
interface FlowFeatureProperties {
  station_id?: string;
  STATIONID?: string;
  reachId?: ReachId;
  currentFlow?: number;
  riskLevel?: RiskLevel;
  name?: string;
  lat?: number;
  lon?: number;
  latitude?: number;
  longitude?: number;
  [key: string]: unknown;
}

interface RiverOverlayProps {
  /** Mapbox map instance */
  map: mapboxgl.Map | null;
  /** Flow data keyed by reachId */
  flowData?: Record<string, ReachFlowData>;
  /** Return period thresholds keyed by reachId */
  returnPeriods?: Record<string, ReturnPeriodThresholds>;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string;
  /** Show flow status overlay */
  showFlowStatus?: boolean;
  /** Legacy callback when reach is clicked (now optional for backward compatibility) */
  onReachClick?: (reachId: ReachId, flowData?: ReachFlowData) => void;
  /** Callback when reach is hovered */
  onReachHover?: (reachId: ReachId | null, flowData?: ReachFlowData) => void;
  /** Layer opacity (0-1) */
  opacity?: number;
  /** Custom data attribute for testing */
  'data-testid'?: string;
}

// Risk level color mapping for map styles
const getRiskColor = (riskLevel?: RiskLevel): string => {
  switch (riskLevel) {
    case 'normal':
      return '#10b981'; // green-500
    case 'elevated':
      return '#f59e0b'; // yellow-500
    case 'high':
      return '#f97316'; // orange-500
    case 'flood':
      return '#ef4444'; // red-500
    default:
      return '#6b7280'; // gray-500 (no data)
  }
};

// Generate map expression for risk-based coloring
const createRiskColorExpression = (flowData: Record<string, ReachFlowData>): mapboxgl.Expression => {
  const expression: any[] = ['case'];
  
  // Add condition for each reach with flow data
  Object.values(flowData).forEach((data) => {
    if (data.reachId && data.riskLevel) {
      expression.push(
        ['==', ['get', 'station_id'], data.reachId],
        getRiskColor(data.riskLevel)
      );
    }
  });
  
  // Default color for reaches without data
  expression.push('#6b7280');
  
  return expression as mapboxgl.Expression;
};

const RiverOverlay: React.FC<RiverOverlayProps> = ({
  map,
  flowData = {},
  returnPeriods = {},
  loading = false,
  error,
  showFlowStatus = true,
  onReachClick, // Keep for backward compatibility
  onReachHover,
  opacity = 0.8,
  'data-testid': testId,
}) => {
  const overlayInitialized = useRef(false);
  const currentHoveredReach = useRef<ReachId | null>(null);

  // Get app context for modal control
  const { openStreamModal } = useAppContext();

  // Calculate risk levels for reaches
  const enrichedFlowData = useRef<Record<string, ReachFlowData>>({});
  
  useEffect(() => {
    const enriched: Record<string, ReachFlowData> = {};
    
    Object.entries(flowData).forEach(([reachId, data]) => {
      const thresholds = returnPeriods[reachId];
      let riskLevel = data.riskLevel;
      
      // Calculate risk level if not provided but we have thresholds
      if (!riskLevel && thresholds && data.currentFlow !== undefined) {
        riskLevel = computeRisk(data.currentFlow, thresholds);
      }
      
      enriched[reachId] = {
        ...data,
        riskLevel,
        returnPeriods: thresholds,
      };
    });
    
    enrichedFlowData.current = enriched;
  }, [flowData, returnPeriods]);

  // Extract stream data from map feature for modal
  const createStreamModalData = useCallback((feature: mapboxgl.MapboxGeoJSONFeature, reachId: ReachId, flowInfo?: ReachFlowData): StreamModalData => {
    const props = feature.properties as FlowFeatureProperties;
    
    // Try to get coordinates from feature geometry first, then from properties
    let lat: number, lon: number;
    
    if (feature.geometry.type === 'Point') {
      [lon, lat] = feature.geometry.coordinates;
    } else if (feature.geometry.type === 'LineString') {
      // For line features, use the midpoint
      const coords = feature.geometry.coordinates;
      const midIndex = Math.floor(coords.length / 2);
      [lon, lat] = coords[midIndex];
    } else {
      // Fallback to properties or default coordinates
      lat = props.lat || props.latitude || 0;
      lon = props.lon || props.longitude || 0;
    }

    return {
      reachId,
      name: props.name || `Stream ${reachId}`,
      lat,
      lon,
      currentFlow: flowInfo?.currentFlow,
      metadata: {
        riskLevel: flowInfo?.riskLevel,
        lastUpdated: flowInfo?.lastUpdated,
        hasFlowData: flowInfo?.currentFlow !== undefined,
        hasReturnPeriods: !!flowInfo?.returnPeriods,
        source: 'map_click',
        clickedAt: new Date().toISOString(),
        // Include any additional properties from the feature
        ...Object.keys(props).reduce((acc, key) => {
          if (!['station_id', 'STATIONID', 'name', 'lat', 'lon', 'latitude', 'longitude'].includes(key)) {
            acc[key] = props[key];
          }
          return acc;
        }, {} as Record<string, any>)
      }
    };
  }, []);

  // Initialize overlay layers
  const initializeOverlay = useCallback(() => {
    if (!map || overlayInitialized.current) return;

    try {
      // Add flow status layer (above base streams)
      if (showFlowStatus && !map.getLayer('streams-flow-status')) {
        map.addLayer({
          id: 'streams-flow-status',
          type: 'line',
          source: 'streams',
          'source-layer': 'streams2-7jgd8p', // Use your source layer name
          paint: {
            'line-color': createRiskColorExpression(enrichedFlowData.current),
            'line-width': [
              'interpolate',
              ['linear'],
              ['zoom'],
              8, 2,
              12, 4,
              16, 6
            ],
            'line-opacity': opacity,
          },
          filter: ['has', 'station_id'], // Only show reaches with station IDs
        });
      }

      // Add highlight layer for hover effects
      if (!map.getLayer('streams-highlight')) {
        map.addLayer({
          id: 'streams-highlight',
          type: 'line',
          source: 'streams',
          'source-layer': 'streams2-7jgd8p',
          paint: {
            'line-color': '#ffffff',
            'line-width': [
              'interpolate',
              ['linear'],
              ['zoom'],
              8, 3,
              12, 6,
              16, 9
            ],
            'line-opacity': 0.8,
          },
          filter: ['==', ['get', 'station_id'], ''], // Initially show nothing
        });
      }

      // Set up event handlers
      const handleClick = (e: mapboxgl.MapLayerMouseEvent) => {
        const features = e.features;
        if (!features || features.length === 0) return;

        const feature = features[0];
        const props = feature.properties as FlowFeatureProperties;
        const reachId = (props.station_id || props.STATIONID) as ReachId;
        
        if (reachId) {
          const flowInfo = enrichedFlowData.current[reachId];
          
          try {
            // NEW: Create modal data and open stream modal
            const modalData = createStreamModalData(feature, reachId, flowInfo);
            openStreamModal(modalData);
            
            // Analytics tracking
            if (typeof window !== 'undefined' && (window as any).gtag) {
              (window as any).gtag('event', 'stream_clicked', {
                event_category: 'map_interaction',
                event_label: reachId,
                custom_parameters: {
                  has_flow_data: !!flowInfo?.currentFlow,
                  risk_level: flowInfo?.riskLevel || 'unknown'
                }
              });
            }
          } catch (error) {
            console.error('Error opening stream modal:', error);
            
            // Fallback to legacy callback if modal fails
            if (onReachClick) {
              onReachClick(reachId, flowInfo);
            }
          }
          
          // Still call legacy callback for backward compatibility
          if (onReachClick) {
            onReachClick(reachId, flowInfo);
          }
        }
      };

      const handleMouseEnter = (e: mapboxgl.MapLayerMouseEvent) => {
        map.getCanvas().style.cursor = 'pointer';
        
        const features = e.features;
        if (!features || features.length === 0) return;

        const feature = features[0];
        const props = feature.properties as FlowFeatureProperties;
        const reachId = (props.station_id || props.STATIONID) as ReachId;
        
        if (reachId) {
          // Update highlight layer
          map.setFilter('streams-highlight', ['==', ['get', 'station_id'], reachId]);
          
          // Track current hover
          currentHoveredReach.current = reachId;
          
          // Call hover callback
          if (onReachHover) {
            const flowInfo = enrichedFlowData.current[reachId];
            onReachHover(reachId, flowInfo);
          }
        }
      };

      const handleMouseLeave = () => {
        map.getCanvas().style.cursor = '';
        
        // Clear highlight
        map.setFilter('streams-highlight', ['==', ['get', 'station_id'], '']);
        
        // Clear hover tracking
        currentHoveredReach.current = null;
        
        // Call hover callback with null
        if (onReachHover) {
          onReachHover(null);
        }
      };

      // Attach event listeners to flow status layer
      const layerId = showFlowStatus ? 'streams-flow-status' : 'streams-line';
      map.on('click', layerId, handleClick);
      map.on('mouseenter', layerId, handleMouseEnter);
      map.on('mouseleave', layerId, handleMouseLeave);

      // Store handlers for cleanup
      (map as any).__overlay_handlers = {
        click: handleClick,
        mouseenter: handleMouseEnter,
        mouseleave: handleMouseLeave,
        layerId,
      };

      overlayInitialized.current = true;
    } catch (err) {
      console.error('Error initializing river overlay:', err);
    }
  }, [map, showFlowStatus, onReachClick, onReachHover, opacity, openStreamModal, createStreamModalData]);

  // Update flow data colors
  const updateFlowColors = useCallback(() => {
    if (!map || !showFlowStatus || !map.getLayer('streams-flow-status')) return;

    try {
      const colorExpression = createRiskColorExpression(enrichedFlowData.current);
      map.setPaintProperty('streams-flow-status', 'line-color', colorExpression);
    } catch (err) {
      console.error('Error updating flow colors:', err);
    }
  }, [map, showFlowStatus]);

  // Initialize overlay when map is ready
  useEffect(() => {
    if (map && map.isStyleLoaded()) {
      initializeOverlay();
    }
  }, [map, initializeOverlay]);

  // Update colors when flow data changes
  useEffect(() => {
    updateFlowColors();
  }, [updateFlowColors, enrichedFlowData.current]);

  // Update opacity
  useEffect(() => {
    if (map && map.getLayer('streams-flow-status')) {
      map.setPaintProperty('streams-flow-status', 'line-opacity', opacity);
    }
  }, [map, opacity]);

  // Show/hide flow status layer
  useEffect(() => {
    if (!map) return;

    const flowLayer = map.getLayer('streams-flow-status');
    
    if (showFlowStatus && !flowLayer) {
      initializeOverlay();
    } else if (!showFlowStatus && flowLayer) {
      map.setLayoutProperty('streams-flow-status', 'visibility', 'none');
    } else if (showFlowStatus && flowLayer) {
      map.setLayoutProperty('streams-flow-status', 'visibility', 'visible');
    }
  }, [map, showFlowStatus, initializeOverlay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (map && (map as any).__overlay_handlers) {
        const { click, mouseenter, mouseleave, layerId } = (map as any).__overlay_handlers;
        
        try {
          map.off('click', layerId, click);
          map.off('mouseenter', layerId, mouseenter);
          map.off('mouseleave', layerId, mouseleave);
          
          delete (map as any).__overlay_handlers;
        } catch (err) {
          console.error('Error cleaning up overlay handlers:', err);
        }
      }
    };
  }, [map]);

  // Helper method to highlight a specific reach (for external control)
  const highlightReach = useCallback((reachId: ReachId | null) => {
    if (!map || !map.getLayer('streams-highlight')) return;

    try {
      if (reachId) {
        map.setFilter('streams-highlight', ['==', ['get', 'station_id'], reachId]);
      } else {
        map.setFilter('streams-highlight', ['==', ['get', 'station_id'], '']);
      }
    } catch (err) {
      console.error('Error highlighting reach:', err);
    }
  }, [map]);

  // Helper method to get flow data for a reach
  const getReachFlowData = useCallback((reachId: ReachId): ReachFlowData | undefined => {
    return enrichedFlowData.current[reachId];
  }, []);

  // Expose methods for parent components (via ref or callback)
  useEffect(() => {
    if (map) {
      (map as any).__riverOverlay = {
        highlightReach,
        getReachFlowData,
        getCurrentHover: () => currentHoveredReach.current,
      };
    }
  }, [map, highlightReach, getReachFlowData]);

  // This component doesn't render anything directly (it modifies the map)
  return null;
};

export default RiverOverlay;