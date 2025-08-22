// components/sidebar/SavedPlacesList.tsx
'use client';

import React, { useRef, useEffect, useState } from 'react';
import { SavedPlace } from '@/types/models/SavedPlace';
import { FlowUnit } from '@/types/models/UserPreferences';
import { RiskLevel } from '@/types/models/FlowForecast';
import { ReturnPeriodThresholds } from '@/types/models/ReturnPeriod';
import { WeatherData } from '@/components/display/WeatherSummary';
import { useAppContext } from '@/components/Layout/AppShell';
import { useShortRangeForecast, getCurrentFlow, getPeakFlow } from '@/hooks/useFlowData';
import { useReachMetadata } from '@/hooks/useReachMetadata';
import { useReturnPeriods } from '@/hooks/useReturnPeriods';
import { computeRisk } from '@/lib/utils/riskCalculator';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Video mapping for each risk level
const FLOW_VIDEOS = {
  no_data: '/assets/video/NoData-Flow.mp4',
  normal: '/assets/video/Normal-Flow.mp4',
  elevated: '/assets/video/Elevated-Flow.mp4',
  high: '/assets/video/High-Flow.mp4',
  flood: '/assets/video/Flood-Flow.mp4'
} as const;

// Data structure for flow information per location
interface LocationFlowData {
  flow: number;
  riskLevel: RiskLevel;
  loading?: boolean;
  error?: string;
}

// Data structure for weather information per location  
interface LocationWeatherData {
  weather?: WeatherData;
  loading?: boolean;
  error?: string;
}

// Individual Place Card with integrated flow data hooks
interface SavedPlaceCardProps {
  place: SavedPlace;
  isActive: boolean;
  flowUnit: FlowUnit;
  showFlowData: boolean;
  onSelect: (place: SavedPlace) => void;
  onEdit: (place: SavedPlace) => void;
  onDelete: (place: SavedPlace) => void;
  // New props for return periods integration
  returnPeriods?: ReturnPeriodThresholds | null;
  returnPeriodsLoading?: boolean;
}

const SavedPlaceCard: React.FC<SavedPlaceCardProps> = ({
  place,
  isActive,
  flowUnit,
  showFlowData,
  onSelect,
  onEdit,
  onDelete,
  returnPeriods,
  returnPeriodsLoading,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  // Fetch river metadata to get the river name (only if we have a reachId)
  const {
    data: reachMetadata,
    isLoading: metadataLoading,
    error: metadataError,
  } = useReachMetadata(place.reachId || null, {
    enabled: !!place.reachId && showFlowData,
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
  });

  // Use individual flow data hook for this place (only if showFlowData is true)
  const {
    data: flowData,
    isLoading: flowLoading,
    error: flowError,
  } = useShortRangeForecast(place.reachId || null, {
    enabled: !!place.reachId && showFlowData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes for saved places
  });

  // Extract flow metrics
  const currentFlow = getCurrentFlow(flowData);
  const peakFlow = getPeakFlow(flowData);
  
  // Compute proper risk level using return periods
  const riskLevel = (() => {
    console.log(`[SavedPlaceCard] Risk calculation for ${place.name}:`);
    console.log(`[SavedPlaceCard] - currentFlow:`, currentFlow);
    console.log(`[SavedPlaceCard] - returnPeriods:`, returnPeriods);
    console.log(`[SavedPlaceCard] - returnPeriodsLoading:`, returnPeriodsLoading);
    console.log(`[SavedPlaceCard] - flowData?.risk:`, flowData?.risk);
    
    // If we have both current flow and return periods, use proper classification
    if (currentFlow !== null && returnPeriods && !returnPeriodsLoading) {
      try {
        const computedRisk = computeRisk(currentFlow, returnPeriods);
        console.log(`[SavedPlaceCard] - computedRisk:`, computedRisk);
        console.log(`[SavedPlaceCard] - RP2: ${returnPeriods.rp2}, RP10: ${returnPeriods.rp10}, RP25: ${returnPeriods.rp25}`);
        return computedRisk;
      } catch (error) {
        console.warn(`Failed to compute risk for ${place.name}:`, error);
        // Fall back to flow data risk if computation fails
        const fallbackRisk = flowData?.risk || 'normal';
        console.log(`[SavedPlaceCard] - fallbackRisk:`, fallbackRisk);
        return fallbackRisk;
      }
    }
    
    // Fallback to the original flow data risk when return periods unavailable
    const fallbackRisk = flowData?.risk || 'normal';
    console.log(`[SavedPlaceCard] - Using fallback risk:`, fallbackRisk);
    return fallbackRisk;
  })();

  // Determine if we have valid flow data
  const hasFlowData = currentFlow !== null && !flowError;

  // Track when data was last fetched
  useEffect(() => {
    if (!flowLoading && flowData && !flowError) {
      setLastFetchTime(new Date());
    }
  }, [flowLoading, flowData, flowError]);

  // Handle video loading and playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !place.reachId || !showFlowData) return;

    const handleCanPlay = () => {
      setVideoLoaded(true);
      setVideoError(false);
      video.play().catch((error) => {
        console.warn('Video autoplay failed:', error);
        // This is common and expected in many browsers, not a real error
      });
    };

    const handleError = (e: Event) => {
      console.error('Video loading error:', e);
      console.error('Video source:', video.src);
      console.error('Risk level:', riskLevel);
      setVideoError(true);
      setVideoLoaded(false);
    };

    const handleLoadStart = () => {
      setVideoLoaded(false);
      setVideoError(false);
    };

    // Add event listeners
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('loadstart', handleLoadStart);
    
    // Use normal video when no data, otherwise use risk-appropriate video
    // Calculate hasFlowData here to avoid dependency array size changes
    const hasValidFlowData = currentFlow !== null && !flowError;
    const videoSrc = hasValidFlowData ? FLOW_VIDEOS[riskLevel] : FLOW_VIDEOS.no_data;
    console.log(`Loading video for ${place.name} (${hasValidFlowData ? riskLevel : 'no-data'}):`, videoSrc);
    video.src = videoSrc;
    video.load();

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadstart', handleLoadStart);
    };
  }, [riskLevel, place.reachId, showFlowData, place.name, currentFlow, flowError]);

  // Format flow value with proper units
  const formatFlow = (flow: number | null): string => {
    if (flow === null) return '--';
    
    if (flowUnit === 'CMS') {
      const flowCMS = flow / 35.314666721;
      return `${flowCMS.toLocaleString(undefined, { maximumFractionDigits: 1 })} CMS`;
    }
    
    return `${flow.toLocaleString(undefined, { maximumFractionDigits: 0 })} CFS`;
  };

  // Get risk level styling
  const getRiskLevelStyle = (risk: RiskLevel) => {
    const styles = {
      normal: { bg: 'bg-green-300', text: 'text-green-900', icon: '✓' },
      elevated: { bg: 'bg-yellow-300', text: 'text-yellow-900', icon: '⚠️' },
      high: { bg: 'bg-orange-300', text: 'text-orange-900', icon: '🔶' },
      flood: { bg: 'bg-red-300', text: 'text-red-900', icon: '🚨' }
    };
    return styles[risk] || styles.normal;
  };

  // Get no data styling
  const getNoDataStyle = () => {
    return {
      bg: 'bg-gray-600',
      text: 'text-white-900',
      icon: '—',
      label: 'No Data'
    };
  };

  const riskStyle = getRiskLevelStyle(riskLevel);
  const noDataStyle = getNoDataStyle();

  // Determine if we should show video
  const shouldShowVideo = place.reachId && showFlowData;

  // Determine if we're using proper risk calculation
  const usingProperRiskCalculation = currentFlow !== null && returnPeriods && !returnPeriodsLoading;

  // Get display name - use river name if available, otherwise fall back to place name
  const riverName = reachMetadata?.name;
  const displayName = riverName || place.name;
  const showReachId = !!place.reachId && riverName; // Only show reach ID if we have a river name

  return (
    <div
      onClick={() => onSelect(place)}
      className={`
        relative p-3 rounded-lg border cursor-pointer transition-all duration-200 overflow-hidden
        ${isActive 
          ? 'border-blue-500 shadow-md' 
          : 'border-gray-200 hover:border-gray-300'
        }
      `}
    >
      {/* Video Background - Show whenever we have reachId and showFlowData is true */}
      {shouldShowVideo && (
        <video
          ref={videoRef}
          className={`
            absolute inset-0 w-full h-full object-cover transition-opacity duration-300
            ${videoLoaded && !videoError ? 'opacity-60' : 'opacity-0'}
          `}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
        />
      )}

      {/* Video Loading Indicator */}
      {shouldShowVideo && !videoLoaded && !videoError && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-lg flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Fallback Background - Show when video is not available or failed */}
      {(!shouldShowVideo || videoError) && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-lg" />
      )}

      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/20 rounded-lg" />

      {/* Content Container */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            {/* Main title - River name or place name */}
            <h4 className="text-lg font-medium text-white truncate drop-shadow-sm">
              {metadataLoading ? (
                <span className="inline-flex items-center">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  {place.name}
                </span>
              ) : (
                displayName
              )}
            </h4>
            
            {/* Subtitle - Reach ID when we have river name */}
            {showReachId && (
              <p className="text-xs text-white/80 truncate drop-shadow-sm mt-0.5">
                Stream {place.reachId}
              </p>
            )}
            
            {/* Fallback subtitle when no river name but have reach ID */}
            {place.reachId && !riverName && !metadataLoading && (
              <p className="text-xs text-white/80 truncate drop-shadow-sm mt-0.5">
                Stream #{place.reachId}
              </p>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-1 ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(place);
              }}
              className="p-1 text-white hover:text-white bg-black/20 hover:bg-black/40 rounded transition-colors"
              title="Edit place"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(place);
              }}
              className="p-1 text-white hover:text-white bg-black/20 hover:bg-black/40 rounded transition-colors"
              title="Remove place"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Flow Data Section */}
        {place.reachId && showFlowData && (
          <div className="space-y-3">
            {/* Main Flow Display - Prominent */}
            <div className="text-center">
              {flowLoading ? (
                <div className="flex justify-center">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              ) : flowError ? (
                <span className="text-lg font-bold text-white drop-shadow-sm">No data at the moment</span>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl font-bold text-white drop-shadow-sm">
                    {formatFlow(currentFlow)}
                  </span>
                </div>
              )}
            </div>

            {/* Bottom Row - Risk Level and Updated Time */}
            <div className="flex items-center justify-between">
              {/* Risk Level */}
              {flowLoading ? (
                <div className="w-16 h-5 bg-white/20 rounded animate-pulse" />
              ) : !hasFlowData ? (
                <span className={`px-2 py-1 rounded text-xs font-medium ${noDataStyle.bg} ${noDataStyle.text} shadow-sm`}>
                  {noDataStyle.icon} {noDataStyle.label}
                </span>
              ) : (
                <span className={`px-2 py-1 rounded text-xs font-medium ${riskStyle.bg} ${riskStyle.text} shadow-sm`}>
                  {riskStyle.icon} {riskStyle.icon === '✓' ? 'Normal' : riskLevel.toUpperCase()}
                </span>
              )}

              {/* Data freshness */}
              {!flowLoading && lastFetchTime && (
                <div className="text-xs text-white drop-shadow-sm">
                  Updated {lastFetchTime.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* No reach ID warning */}
        {!place.reachId && showFlowData && (
          <div className="text-xs text-white italic drop-shadow-sm">
            No flow data available
          </div>
        )}
      </div>
    </div>
  );
};

// Main SavedPlacesList component
interface SavedPlacesListProps {
  /** Places array passed from parent */
  places: SavedPlace[];
  /** Currently active/selected place */
  activePlace?: SavedPlace | null;
  /** Flow unit preference override */
  flowUnit?: FlowUnit;
  /** Callback when a place is selected */
  onPlaceSelect?: (place: SavedPlace) => void;
  /** Callback when edit is requested */
  onPlaceEdit?: (place: SavedPlace) => void;
  /** Callback when add new place is requested */
  onAddPlace?: () => void;
  /** Custom className */
  className?: string;
  /** Show add button */
  showAddButton?: boolean;
  /** Show flow data for each place */
  showFlowData?: boolean;
}

const SavedPlacesList: React.FC<SavedPlacesListProps> = ({
  places,
  activePlace,
  flowUnit,
  onPlaceSelect,
  onPlaceEdit,
  onAddPlace,
  className = '',
  showAddButton = true,
  showFlowData = true,
}) => {
  // Get user preferences and remove function from context
  const { userPreferences, removeSavedPlace } = useAppContext();
  const effectiveFlowUnit = flowUnit || userPreferences?.flowUnit || 'CFS';

  // Fetch return periods for all places with reach IDs
  const reachIds = places.map(p => p.reachId).filter(Boolean);
  const { 
    data: returnPeriodsData, 
    loading: returnPeriodsLoading, 
    error: returnPeriodsError,
    getReturnPeriods,
    hasData: hasReturnPeriodsData
  } = useReturnPeriods(reachIds, {
    enabled: showFlowData && reachIds.length > 0
  });

  // Log return periods status for debugging
  useEffect(() => {
    if (hasReturnPeriodsData && !returnPeriodsLoading) {
      console.log(`[SavedPlacesList] Loaded return periods for ${Object.keys(returnPeriodsData).length}/${reachIds.length} places`);
    }
    if (returnPeriodsError) {
      console.warn('[SavedPlacesList] Return periods error:', returnPeriodsError);
    }
  }, [hasReturnPeriodsData, returnPeriodsLoading, returnPeriodsError, returnPeriodsData, reachIds.length]);

  // Handle place deletion with confirmation
  const handlePlaceDelete = async (place: SavedPlace) => {
    if (!place) return;
    
    // Simple confirmation - could be enhanced with a modal
    const confirmed = window.confirm(`Remove "${place.name}" from saved places?`);
    if (!confirmed) return;

    try {
      await removeSavedPlace(place.id);
      console.log(`Removed saved place: ${place.name}`);
    } catch (error) {
      console.error('Failed to remove place:', error);
    }
  };

  // Handle place selection
  const handlePlaceSelect = (place: SavedPlace) => {
    if (onPlaceSelect) {
      onPlaceSelect(place);
    }
  };

  // Handle place editing
  const handlePlaceEdit = (place: SavedPlace) => {
    if (onPlaceEdit) {
      onPlaceEdit(place);
    }
  };

  // Handle add new place
  const handleAddPlace = () => {
    if (onAddPlace) {
      onAddPlace();
    }
  };

  // Empty state
  if (places.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-400 mb-3">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-white mb-1">
          No saved places
        </h3>
        <p className="text-xs text-white mb-4">
          Add locations from the map to monitor flow and weather conditions
        </p>
        {showAddButton && onAddPlace && (
          <button
            onClick={handleAddPlace}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-white/20 hover:bg-white/30 transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add your first place
          </button>
        )}
      </div>
    );
  }

  // Sort places: primary first, then by name
  const sortedPlaces = [...places].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className={`flex h-full min-h-0 flex-col space-y-3 ${className}`}>
      {/* Places List with Video Backgrounds */}
      <div className="flex-1 min-h-0 space-y-2 overflow-y-auto">
        {sortedPlaces.map((place) => {
          const placeReturnPeriods = place.reachId ? getReturnPeriods(place.reachId) : null;
          console.log(`[SavedPlacesList] Rendering ${place.name}:`);
          console.log(`[SavedPlacesList] - reachId:`, place.reachId);
          console.log(`[SavedPlacesList] - returnPeriods:`, placeReturnPeriods);
          console.log(`[SavedPlacesList] - returnPeriodsLoading:`, returnPeriodsLoading);
          console.log(`[SavedPlacesList] - hasReturnPeriodsData:`, hasReturnPeriodsData);
          
          return (
            <SavedPlaceCard
              key={place.id}
              place={place}
              isActive={activePlace?.id === place.id}
              flowUnit={effectiveFlowUnit}
              showFlowData={showFlowData}
              onSelect={handlePlaceSelect}
              onEdit={handlePlaceEdit}
              onDelete={handlePlaceDelete}
              // Pass return periods data to each card
              returnPeriods={placeReturnPeriods}
              returnPeriodsLoading={returnPeriodsLoading}
            />
          );
        })}
      </div>

      {/* Max places warning */}
      {places.length >= 20 && (
        <div className="text-xs text-white text-center py-2 bg-white/20 rounded-lg">
          Maximum number of saved places reached (20)
        </div>
      )}
    </div>
  );
};

export default SavedPlacesList;