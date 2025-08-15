// components/widgets/ReachInfoWidget.tsx
'use client';

import React from 'react';
import { useAppContext, isRiverReach } from '@/components/Layout/AppShell';
import { 
  getReachDisplayName, 
  getReachCoordinates, 
  getAvailableRanges,
  hasStreamflowSeries 
} from '@/hooks/useReachMetadata';
import type { RiverReach, StreamflowSeriesName } from '@/types';

interface ReachInfoWidgetProps {
  /** Custom className for styling */
  className?: string;
  /** Show detailed metadata */
  showMetadata?: boolean;
  /** Show action buttons */
  showActions?: boolean;
  /** Callback when save location is clicked */
  onSaveLocation?: (reach: RiverReach) => void;
  /** Custom data attribute for testing */
  'data-testid'?: string;
}

const ReachInfoWidget: React.FC<ReachInfoWidgetProps> = ({
  className = '',
  showMetadata = true,
  showActions = true,
  onSaveLocation,
  'data-testid': testId,
}) => {
  // Get active location from AppShell context
  const { activeLocation, saveLocationFromReach } = useAppContext();

  // Check if active location is a RiverReach (not a SavedPlace)
  const reach = isRiverReach(activeLocation) ? activeLocation : null;

  // Helper function to format coordinates
  const formatCoordinate = (coord: number, type: 'lat' | 'lng'): string => {
    const direction = type === 'lat' ? (coord >= 0 ? 'N' : 'S') : (coord >= 0 ? 'E' : 'W');
    return `${Math.abs(coord).toFixed(4)}°${direction}`;
  };

  // Helper function to get series display info
  const getSeriesInfo = (series: StreamflowSeriesName) => {
    const seriesMap = {
      'analysis_assimilation': { 
        name: 'Analysis', 
        description: 'Historical analysis',
        icon: '📊',
        color: 'text-gray-600 dark:text-gray-400'
      },
      'short_range': { 
        name: 'Short Range', 
        description: '18-hour forecast',
        icon: '⚡',
        color: 'text-blue-600 dark:text-blue-400'
      },
      'medium_range': { 
        name: 'Medium Range', 
        description: '10-day forecast',
        icon: '📈',
        color: 'text-green-600 dark:text-green-400'
      },
      'medium_range_blend': { 
        name: 'Medium Blend', 
        description: 'Blended forecast',
        icon: '🔀',
        color: 'text-purple-600 dark:text-purple-400'
      },
      'long_range': { 
        name: 'Long Range', 
        description: '30-day forecast',
        icon: '📅',
        color: 'text-orange-600 dark:text-orange-400'
      },
    };
    
    return seriesMap[series] || { 
      name: series, 
      description: 'Unknown series',
      icon: '❓',
      color: 'text-gray-500'
    };
  };

  // Handle save location action
  const handleSaveLocation = () => {
    if (reach) {
      if (onSaveLocation) {
        onSaveLocation(reach);
      } else {
        // Use AppShell's built-in save function
        saveLocationFromReach(reach, 'recreation');
      }
    }
  };

  // Empty state when no reach is selected
  if (!reach) {
    return (
      <div 
        className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
        data-testid={testId}
      >
        <div className="text-center py-8">
          <div className="text-gray-400 mb-3">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            No Stream Selected
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Click on a stream in the map to view its information
          </p>
        </div>
      </div>
    );
  }

  const coordinates = getReachCoordinates(reach);
  const displayName = getReachDisplayName(reach);

  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
      data-testid={testId}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Stream Information
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              River reach details
            </p>
          </div>
        </div>
        
        {showActions && (
          <button
            onClick={handleSaveLocation}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            title="Save this location"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Save
          </button>
        )}
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        {/* Reach Name and ID */}
        <div>
          <h4 className="text-base font-medium text-gray-900 dark:text-white mb-2">
            {displayName}
          </h4>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              ID: {reach.reachId}
            </span>
          </div>
        </div>

        {/* Coordinates */}
        {coordinates && (
          <div>
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Coordinates
            </h5>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <span className="text-gray-500 dark:text-gray-400 block">Latitude</span>
                <span className="font-mono text-gray-900 dark:text-white">
                  {formatCoordinate(reach.latitude, 'lat')}
                </span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <span className="text-gray-500 dark:text-gray-400 block">Longitude</span>
                <span className="font-mono text-gray-900 dark:text-white">
                  {formatCoordinate(reach.longitude, 'lng')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Available Forecast Types */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Available Forecasts
          </h5>
          <div className="space-y-2">
            {reach.streamflow.length > 0 ? (
              reach.streamflow.map((series) => {
                const info = getSeriesInfo(series);
                return (
                  <div 
                    key={series}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{info.icon}</span>
                      <div>
                        <p className={`font-medium ${info.color}`}>
                          {info.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {info.description}
                        </p>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No forecast data available
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Extended Metadata (if available) */}
        {showMetadata && reach.route && (
          <div>
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Stream Network
            </h5>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <span className="text-gray-500 dark:text-gray-400 block">Upstream</span>
                <span className="text-gray-900 dark:text-white">
                  {reach.route.upstream.length} connections
                </span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <span className="text-gray-500 dark:text-gray-400 block">Downstream</span>
                <span className="text-gray-900 dark:text-white">
                  {reach.route.downstream.length} connections
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {reach.streamflow.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Forecast Types
              </p>
            </div>
            <div>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                {hasStreamflowSeries(reach, 'short_range') ? '✓' : '✗'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Real-time
              </p>
            </div>
            <div>
              <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                {hasStreamflowSeries(reach, 'long_range') ? '✓' : '✗'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Long-term
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReachInfoWidget;