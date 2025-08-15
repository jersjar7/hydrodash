// components/Sidebar/LocationCard.tsx
'use client';

import React, { useState } from 'react';
import { SavedPlace } from '@/types/models/SavedPlace';
import { RiskLevel } from '@/types/models/FlowForecast';
import { FlowUnit } from '@/types/models/UserPreferences';
import FlowStatus from '@/components/display/FlowStatus';
import WeatherSummary, { WeatherData } from '@/components/display/WeatherSummary';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface LocationCardProps {
  /** The saved place to display */
  place: SavedPlace;
  /** Whether this location is currently active/selected */
  isActive?: boolean;
  /** Current flow data for this location */
  flowData?: {
    flow: number;
    riskLevel: RiskLevel;
    loading?: boolean;
    error?: string;
  };
  /** Current weather data for this location */
  weatherData?: {
    weather?: WeatherData;
    loading?: boolean;
    error?: string;
  };
  /** Flow unit preference */
  flowUnit?: FlowUnit;
  /** Callback when location is clicked/selected */
  onSelect?: (place: SavedPlace) => void;
  /** Callback when edit is requested */
  onEdit?: (place: SavedPlace) => void;
  /** Callback when delete is requested */
  onDelete?: (place: SavedPlace) => void;
  /** Loading state for the entire card */
  loading?: boolean;
  /** Custom className */
  className?: string;
}

const LocationCard: React.FC<LocationCardProps> = ({
  place,
  isActive = false,
  flowData,
  weatherData,
  flowUnit = 'CFS',
  onSelect,
  onEdit,
  onDelete,
  loading = false,
  className = '',
}) => {
  const [showActions, setShowActions] = useState(false);

  // Handle card click (but not when clicking action buttons)
  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!showActions) {
      onSelect?.(place);
    }
  };

  // Handle action button clicks (prevent event bubbling)
  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  // Get place type icon
  const getPlaceTypeIcon = () => {
    switch (place.type) {
      case 'home':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
        );
      case 'work':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'recreation':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  // Get risk level border color
  const getRiskLevelBorderColor = () => {
    if (!flowData?.riskLevel) return '';
    
    switch (flowData.riskLevel) {
      case 'normal':
        return 'border-l-green-500';
      case 'elevated':
        return 'border-l-yellow-500';
      case 'high':
        return 'border-l-orange-500';
      case 'flood':
        return 'border-l-red-500';
      default:
        return 'border-l-gray-300';
    }
  };

  return (
    <div
      className={`
        relative group cursor-pointer rounded-lg border-2 transition-all duration-200
        border-l-4 ${getRiskLevelBorderColor()}
        ${isActive
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 hover:shadow-sm'
        }
        ${loading ? 'opacity-60' : ''}
        ${className}
      `}
      onClick={handleCardClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 rounded-lg flex items-center justify-center z-10">
          <LoadingSpinner size="sm" variant="dots" color="primary" />
        </div>
      )}

      {/* Main Card Content */}
      <div className="p-3">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {/* Place Type Icon */}
            <div className={`
              flex-shrink-0 p-1.5 rounded-md 
              ${place.type === 'home' ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' :
                place.type === 'work' ? 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' :
                place.type === 'recreation' ? 'text-green-600 bg-green-100 dark:bg-green-900/30' :
                'text-gray-600 bg-gray-100 dark:bg-gray-700'}
            `}>
              {getPlaceTypeIcon()}
            </div>

            {/* Place Name */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 dark:text-white truncate">
                {place.name}
              </h3>
              {place.type && (
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {place.type}
                </p>
              )}
            </div>
          </div>

          {/* Primary Indicator */}
          {place.isPrimary && (
            <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1" />
          )}
        </div>

        {/* Flow Status */}
        <div className="mb-2">
          {flowData?.loading ? (
            <div className="flex items-center space-x-2">
              <LoadingSpinner size="xs" variant="dots" color="gray" />
              <span className="text-xs text-gray-500">Loading flow...</span>
            </div>
          ) : flowData?.error ? (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Flow data unavailable
            </div>
          ) : flowData ? (
            <FlowStatus
              flow={flowData.flow}
              riskLevel={flowData.riskLevel}
              unit={flowUnit}
              variant="compact"
              className="text-sm"
            />
          ) : (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              No flow data
            </div>
          )}
        </div>

        {/* Weather Summary */}
        <div className="mb-1">
          <WeatherSummary
            weather={weatherData?.weather}
            loading={weatherData?.loading}
            error={weatherData?.error}
            variant="compact"
            className="text-sm"
          />
        </div>

        {/* Last Updated */}
        {place.updatedAt && (
          <div className="text-xs text-gray-400 dark:text-gray-500">
            Updated {new Date(place.updatedAt).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Action Buttons (shown on hover) */}
      {(showActions || isActive) && (onEdit || onDelete) && (
        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={(e) => handleActionClick(e, () => onEdit(place))}
              className="p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
              title="Edit location"
            >
              <svg className="w-3 h-3 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          
          {onDelete && (
            <button
              onClick={(e) => handleActionClick(e, () => onDelete(place))}
              className="p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-sm"
              title="Delete location"
            >
              <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Active Indicator */}
      {isActive && (
        <div className="absolute inset-0 rounded-lg border-2 border-blue-500 pointer-events-none" />
      )}
    </div>
  );
};

export default LocationCard;