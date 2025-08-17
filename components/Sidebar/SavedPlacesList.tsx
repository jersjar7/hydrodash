// components/sidebar/SavedPlacesList.tsx
'use client';

import React from 'react';
import { SavedPlace } from '@/types/models/SavedPlace';
import { FlowUnit } from '@/types/models/UserPreferences';
import { RiskLevel } from '@/types/models/FlowForecast';
import { WeatherData } from '@/components/display/WeatherSummary';
import { useAppContext } from '@/components/Layout/AppShell';
import { useSavedPlaces } from '@/hooks/useSavedPlaces';
import { useShortRangeForecast, getCurrentFlow, getPeakFlow } from '@/hooks/useFlowData';
import LoadingSpinner from '@/components/common/LoadingSpinner';

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
}

const SavedPlaceCard: React.FC<SavedPlaceCardProps> = ({
  place,
  isActive,
  flowUnit,
  showFlowData,
  onSelect,
  onEdit,
  onDelete,
}) => {
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
  const riskLevel = flowData?.risk || 'normal';

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
      normal: { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-800 dark:text-green-200', icon: '✓' },
      elevated: { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-800 dark:text-yellow-200', icon: '⚠️' },
      high: { bg: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-800 dark:text-orange-200', icon: '🔶' },
      flood: { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-800 dark:text-red-200', icon: '🚨' }
    };
    return styles[risk] || styles.normal;
  };

  // Calculate simple flow trend
  const getFlowTrend = () => {
    if (!flowData?.series?.[0]?.points || flowData.series[0].points.length < 2) return null;
    
    const points = flowData.series[0].points;
    const current = points[0]?.q || 0;
    const next = points[1]?.q || 0;
    
    if (next > current * 1.1) return { direction: 'rising', icon: '↗️', color: 'text-red-600' };
    if (next < current * 0.9) return { direction: 'falling', icon: '↘️', color: 'text-blue-600' };
    return { direction: 'stable', icon: '→', color: 'text-gray-600' };
  };

  // Create mini-chart data for flow visualization
  const getMiniChartData = () => {
    if (!flowData?.series?.[0]?.points) return [];
    
    return flowData.series[0].points.slice(0, 12).map(point => point.q || 0);
  };

  const riskStyle = getRiskLevelStyle(riskLevel);
  const trend = getFlowTrend();
  const miniChartData = getMiniChartData();

  return (
    <div
      onClick={() => onSelect(place)}
      className={`
        p-3 rounded-lg border cursor-pointer transition-all duration-200
        ${isActive 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
        }
      `}
    >
    {/* Header */}
    <div className="flex items-start justify-between mb-2">
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-white truncate">
          {place.name}
        </h4>
        {place.isPrimary && (
          <div className="flex items-center mt-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-1" />
            <span className="text-xs text-white">Primary</span>
          </div>
        )}
      </div>
      
      {/* Actions */}
      <div className="flex items-center space-x-1 ml-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(place);
          }}
          className="p-1 text-white hover:text-white"
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
          className="p-1 text-white hover:text-white"
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
      <div className="space-y-2">
        {/* Current Flow */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-white">Current Flow</span>
          {flowLoading ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          ) : flowError ? (
            <span className="text-xs text-white">Error</span>
          ) : (
            <div className="flex items-center space-x-1">
              <span className="text-sm font-semibold text-gray-900">
                {formatFlow(currentFlow)}
              </span>
              {trend && (
                <span className={`text-xs ${trend.color}`} title={`Flow ${trend.direction}`}>
                  {trend.icon}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Risk Level */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-white">Risk Level</span>
          {flowLoading ? (
            <div className="w-12 h-4 bg-gray-200 rounded animate-pulse" />
          ) : (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${riskStyle.bg} ${riskStyle.text}`}>
              {riskStyle.icon} {riskStyle.icon === '✓' ? 'Normal' : riskLevel}
            </span>
          )}
        </div>

        {/* Data freshness */}
        {!flowLoading && flowData?.series?.[0]?.points?.[0] && (
          <div className="text-xs text-white text-right">
            Updated: {new Date(flowData.series[0].points[0].t).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        )}
      </div>
    )}

    {/* No reach ID warning */}
    {!place.reachId && showFlowData && (
      <div className="text-xs text-white italic">
        No flow data available
      </div>
    )}
  </div>
);
};

// Main SavedPlacesList component
interface SavedPlacesListProps {
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
  activePlace,
  flowUnit,
  onPlaceSelect,
  onPlaceEdit,
  onAddPlace,
  className = '',
  showAddButton = true,
  showFlowData = true,
}) => {
  // Get user preferences from context if flowUnit not provided
  const { userPreferences } = useAppContext();
  const effectiveFlowUnit = flowUnit || userPreferences?.flowUnit || 'CFS';

  // Use the saved places hook to get real data from localStorage
  const {
    places,
    isLoading,
    error,
    removePlace,
    canAddMore,
    getPlaceCount,
  } = useSavedPlaces({
    autoSave: true,
    maxPlaces: 20, // Reasonable limit for UI performance
  });

  // Handle place deletion with confirmation
  const handlePlaceDelete = async (place: SavedPlace) => {
    if (!place) return;
    
    // Simple confirmation - could be enhanced with a modal
    const confirmed = window.confirm(`Remove "${place.name}" from saved places?`);
    if (!confirmed) return;

    try {
      await removePlace(place.id);
      console.log(`Removed saved place: ${place.name}`);
    } catch (error) {
      console.error('Failed to remove place:', error);
      // Could show a toast notification here
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

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex justify-center py-8 ${className}`}>
        <LoadingSpinner size="md" variant="dots" color="primary" text="Loading saved places..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-red-500 mb-2">
          <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Failed to load saved places
        </p>
        <p className="text-xs text-red-600 dark:text-red-400 mb-3">
          {error}
        </p>
        {onAddPlace && (
          <button
            onClick={handleAddPlace}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            Try adding a place
          </button>
        )}
      </div>
    );
  }

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
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
          No saved places
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Add locations from the map to monitor flow and weather conditions
        </p>
        {showAddButton && onAddPlace && canAddMore() && (
          <button
            onClick={handleAddPlace}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
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
      {/* Places List with Individual Flow Data */}
      <div className="flex-1 min-h-0 space-y-2 overflow-y-auto">
        {sortedPlaces.map((place) => (
          <SavedPlaceCard
            key={place.id}
            place={place}
            isActive={activePlace?.id === place.id}
            flowUnit={effectiveFlowUnit}
            showFlowData={showFlowData}
            onSelect={handlePlaceSelect}
            onEdit={handlePlaceEdit}
            onDelete={handlePlaceDelete}
          />
        ))}
      </div>

      {/* Max places warning */}
      {!canAddMore() && (
        <div className="text-xs text-amber-600 dark:text-amber-400 text-center py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          Maximum number of saved places reached (20)
        </div>
      )}
    </div>
  );
};

export default SavedPlacesList;